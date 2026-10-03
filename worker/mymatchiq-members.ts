// @ts-nocheck
import { Client } from 'pg';
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}
function fail(message,status=400,code='bad_request'){return json({ok:false,error:{code,message}},status);}
async function readJson(request){if(!(request.headers.get('content-type')||'').includes('application/json'))throw new Error('Expected application/json body.');return request.json();}
async function session(request,env){const cookie=request.headers.get('cookie');if(!cookie)return null;const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});if(!response.ok)return null;const payload=await response.json().catch(()=>null);const user=payload?.user??payload?.data?.user??null;const active=payload?.session??payload?.data?.session??null;return user?.id&&user?.emailVerified===true&&active?{user,session:active}:null;}
async function withDb(env,fn){const db=new Client({connectionString:env.HYPERDRIVE.connectionString});await db.connect();try{return await fn(db);}finally{await db.end();}}
function clean(v,max=600){const s=String(v??'').trim();return s.slice(0,max);}
async function ensureProfile(db,userId){return (await db.query(`INSERT INTO public.mmiq_member_profiles(user_id) VALUES($1::uuid) ON CONFLICT(user_id) DO UPDATE SET updated_at=public.mmiq_member_profiles.updated_at RETURNING *`,[userId])).rows[0];}
async function updateProfile(db,userId,input){
 const display=clean(input?.displayName,80),bio=clean(input?.bio,1200),intent=clean(input?.relationshipIntent,120),interests=Array.isArray(input?.interests)?input.interests.map(x=>clean(x,60)).filter(Boolean).slice(0,12):[];
 const discoverable=Boolean(input?.discoverable),allow=Boolean(input?.allowInvitations),photo=input?.showProfilePhoto!==false;
 const complete=Boolean(display&&bio);
 return (await db.query(`INSERT INTO public.mmiq_member_profiles(user_id,display_name,bio,discoverable,allow_invitations,show_profile_photo,interests,relationship_intent,profile_complete,updated_at) VALUES($1::uuid,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,now()) ON CONFLICT(user_id) DO UPDATE SET display_name=$2,bio=$3,discoverable=$4,allow_invitations=$5,show_profile_photo=$6,interests=$7::jsonb,relationship_intent=$8,profile_complete=$9,updated_at=now() RETURNING *`,[userId,display,bio,discoverable,allow,photo,JSON.stringify(interests),intent,complete])).rows[0];
}
async function discover(db,userId){
 const r=await db.query(`SELECT p.user_id,p.display_name,p.bio,p.interests,p.relationship_intent,p.show_profile_photo
 FROM public.mmiq_member_profiles p
 WHERE p.user_id<>$1::uuid AND p.discoverable=true AND p.profile_complete=true
 AND NOT EXISTS(SELECT 1 FROM public.mmiq_member_blocks b WHERE (b.blocker_user_id=$1::uuid AND b.blocked_user_id=p.user_id) OR (b.blocker_user_id=p.user_id AND b.blocked_user_id=$1::uuid))
 ORDER BY p.updated_at DESC LIMIT 50`,[userId]);return r.rows;
}
async function listInvites(db,userId){const r=await db.query(`SELECT i.*,fp.display_name AS from_name,tp.display_name AS to_name FROM public.mmiq_member_invitations i LEFT JOIN public.mmiq_member_profiles fp ON fp.user_id=i.from_user_id LEFT JOIN public.mmiq_member_profiles tp ON tp.user_id=i.to_user_id WHERE i.from_user_id=$1::uuid OR i.to_user_id=$1::uuid ORDER BY i.created_at DESC LIMIT 100`,[userId]);return r.rows;}
async function createInvite(db,userId,input){
 const to=String(input?.toUserId||'');if(!UUID.test(to)||to===userId)throw Object.assign(new Error('Invalid recipient.'),{status:400,code:'invalid_recipient'});
 const allowed=(await db.query(`SELECT 1 FROM public.mmiq_member_profiles p WHERE p.user_id=$1::uuid AND p.discoverable=true AND p.allow_invitations=true AND p.profile_complete=true AND NOT EXISTS(SELECT 1 FROM public.mmiq_member_blocks b WHERE (b.blocker_user_id=$2::uuid AND b.blocked_user_id=$1::uuid) OR (b.blocker_user_id=$1::uuid AND b.blocked_user_id=$2::uuid))`,[to,userId])).rowCount;
 if(!allowed)throw Object.assign(new Error('This member is not accepting invitations.'),{status:409,code:'recipient_unavailable'});
 const type=['like_minded','compatibility_scan'].includes(input?.invitationType)?input.invitationType:'like_minded';
 const r=await db.query(`INSERT INTO public.mmiq_member_invitations(from_user_id,to_user_id,invitation_type,message) VALUES($1::uuid,$2::uuid,$3,$4) RETURNING *`,[userId,to,type,clean(input?.message,280)||null]);return r.rows[0];
}
async function respond(db,userId,id,status){if(!UUID.test(id)||!['accepted','declined','cancelled'].includes(status))throw Object.assign(new Error('Invalid invitation update.'),{status:400,code:'bad_request'});
 let q;if(status==='cancelled')q=await db.query(`UPDATE public.mmiq_member_invitations SET status='cancelled',responded_at=now() WHERE id=$1::uuid AND from_user_id=$2::uuid AND status='pending' RETURNING *`,[id,userId]);
 else q=await db.query(`UPDATE public.mmiq_member_invitations SET status=$3,responded_at=now() WHERE id=$1::uuid AND to_user_id=$2::uuid AND status='pending' AND expires_at>now() RETURNING *`,[id,userId,status]);
 if(!q.rows[0])throw Object.assign(new Error('Invitation is no longer available.'),{status:409,code:'invite_unavailable'});return q.rows[0];}
async function block(db,userId,target){if(!UUID.test(target)||target===userId)throw Object.assign(new Error('Invalid member.'),{status:400,code:'bad_request'});await db.query('BEGIN');try{await db.query(`INSERT INTO public.mmiq_member_blocks(blocker_user_id,blocked_user_id) VALUES($1::uuid,$2::uuid) ON CONFLICT DO NOTHING`,[userId,target]);await db.query(`UPDATE public.mmiq_member_invitations SET status='cancelled',responded_at=now() WHERE status='pending' AND ((from_user_id=$1::uuid AND to_user_id=$2::uuid) OR (from_user_id=$2::uuid AND to_user_id=$1::uuid))`,[userId,target]);await db.query('COMMIT');return true;}catch(e){await db.query('ROLLBACK');throw e;}}
async function reportMember(db,userId,input){const target=String(input?.reportedUserId||'');const cats=['harassment','spam','impersonation','unsafe_behavior','inappropriate_content','other'];const cat=cats.includes(input?.category)?input.category:'other';if(!UUID.test(target)||target===userId)throw Object.assign(new Error('Invalid member.'),{status:400,code:'bad_request'});return (await db.query(`INSERT INTO public.mmiq_member_reports(reporter_user_id,reported_user_id,category,details) VALUES($1::uuid,$2::uuid,$3,$4) RETURNING id,status,created_at`,[userId,target,cat,clean(input?.details,1200)||null])).rows[0];}

export async function handleMyMatchIQMembersRequest(request,env,url){
 if(!url.pathname.startsWith('/api/mymatchiq/members'))return null;
 const auth=await session(request,env);if(!auth)return fail('Verified MyMatchIQ sign-in is required.',401,'unauthorized');
 try{return await withDb(env,async db=>{
   if(url.pathname==='/api/mymatchiq/members/profile'){if(request.method==='GET')return json({ok:true,profile:await ensureProfile(db,auth.user.id)});if(request.method==='PUT')return json({ok:true,profile:await updateProfile(db,auth.user.id,await readJson(request))});return fail('Method not allowed.',405,'method_not_allowed');}
   if(url.pathname==='/api/mymatchiq/members/discover'&&request.method==='GET')return json({ok:true,members:await discover(db,auth.user.id)});
   if(url.pathname==='/api/mymatchiq/members/invitations'){if(request.method==='GET')return json({ok:true,invitations:await listInvites(db,auth.user.id)});if(request.method==='POST')return json({ok:true,invitation:await createInvite(db,auth.user.id,await readJson(request))},201);return fail('Method not allowed.',405,'method_not_allowed');}
   const invite=url.pathname.match(/^\/api\/mymatchiq\/members\/invitations\/([0-9a-f-]{36})$/i);if(invite&&request.method==='PATCH'){const input=await readJson(request);return json({ok:true,invitation:await respond(db,auth.user.id,invite[1],String(input?.status||''))});}
   if(url.pathname==='/api/mymatchiq/members/block'&&request.method==='POST'){const input=await readJson(request);await block(db,auth.user.id,String(input?.userId||''));return json({ok:true});}
   if(url.pathname==='/api/mymatchiq/members/report'&&request.method==='POST')return json({ok:true,report:await reportMember(db,auth.user.id,await readJson(request))},201);
   return fail('MyMatchIQ member route not found.',404,'not_found');
 });}catch(error){console.error('MMIQ members API error',error);return fail(error?.message||'Unable to process member request.',error?.status||500,error?.code||'member_error');}
}
