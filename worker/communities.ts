// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const CATEGORIES = new Set(['long_distance','premarital','marriage','dating','lgbtq','parenting','conflict_resolution','intimacy','communication','general']);
const COMMUNITY_SORT = new Set(['created_at','updated_at','name','member_count','post_count','category']);
const POST_SORT = new Set(['created_at','updated_at','likes_count','comments_count','shares_count','views_count','title']);

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: HEADERS }); }
function fail(message, status = 400, code = 'bad_request') { return json({ ok: false, error: { code, message } }, status); }
async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', { headers: { cookie, accept: 'application/json' } });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && active ? { user, session: active } : null;
}
async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}
function text(value, max, required = false) {
  if (value == null) { if (required) throw new Error('Required value is missing.'); return null; }
  const out = String(value).trim();
  if (required && !out) throw new Error('Required value is empty.');
  if (out.length > max) throw new Error(`Value exceeds ${max} characters.`);
  return out || null;
}
function textArray(value, maxItems = 30, maxLength = 100) { return Array.isArray(value) ? value.slice(0,maxItems).map(v => text(v,maxLength,true)) : []; }
function order(value, allowed, fallback) {
  const requested = String(value || fallback);
  const desc = requested.startsWith('-');
  const field = requested.replace(/^-/, '');
  return { field: allowed.has(field) ? field : fallback.replace(/^-/,''), dir: desc ? 'DESC' : 'ASC' };
}
async function membership(db, communityId, userId) {
  if (!userId) return null;
  const result = await db.query('SELECT * FROM public.community_members WHERE community_id=$1::uuid AND user_id=$2::uuid', [communityId,userId]);
  return result.rows[0] || null;
}
async function communityAccess(db, communityId, auth) {
  const result = await db.query('SELECT * FROM public.communities WHERE id=$1::uuid', [communityId]);
  const community = result.rows[0];
  if (!community) return { community: null, member: null, allowed: false };
  const member = auth ? await membership(db, communityId, auth.user.id) : null;
  const creator = Boolean(auth && community.creator_id === auth.user.id);
  const allowed = community.is_public || creator || member?.status === 'active';
  return { community, member, creator, allowed };
}
function decorateCommunity(community, member, auth) {
  return { ...community, userMembership: member || null, isMember: member?.status === 'active', isCreator: Boolean(auth && community.creator_id === auth.user.id) };
}
async function listCommunities(db, auth, url) {
  const clauses = [];
  const values = [];
  if (auth) {
    values.push(auth.user.id);
    clauses.push(`(c.is_public=true OR c.creator_id=$1::uuid OR EXISTS(SELECT 1 FROM public.community_members mx WHERE mx.community_id=c.id AND mx.user_id=$1::uuid AND mx.status='active'))`);
  } else clauses.push('c.is_public=true');
  const category = url.searchParams.get('category');
  if (category) { values.push(category); clauses.push(`c.category=$${values.length}`); }
  const search = (url.searchParams.get('search') || '').trim();
  if (search) { values.push(`%${search}%`); clauses.push(`(c.name ILIKE $${values.length} OR c.description ILIKE $${values.length})`); }
  const sort = order(url.searchParams.get('order'), COMMUNITY_SORT, '-created_at');
  const result = await db.query(`SELECT c.* FROM public.communities c WHERE ${clauses.join(' AND ')} ORDER BY c.${sort.field} ${sort.dir},c.id ASC`, values);
  if (!auth || !result.rows.length) return result.rows.map(c => decorateCommunity(c,null,auth));
  const ids = result.rows.map(c => c.id);
  const m = await db.query('SELECT * FROM public.community_members WHERE user_id=$1::uuid AND community_id=ANY($2::uuid[])', [auth.user.id,ids]);
  const map = new Map(m.rows.map(x => [x.community_id,x]));
  return result.rows.map(c => decorateCommunity(c,map.get(c.id)||null,auth));
}
async function requireActiveMember(db, community, userId) {
  if (community.creator_id === userId) return true;
  const m = await membership(db, community.id, userId);
  return m?.status === 'active';
}
async function authorName(db, auth, anonymous) {
  if (anonymous) return null;
  const result = await db.query('SELECT name FROM public.users WHERE id=$1::uuid', [auth.user.id]);
  return result.rows[0]?.name || auth.user.name || auth.user.email?.split('@')[0] || 'User';
}
async function postFlags(db, posts, auth) {
  if (!posts.length) return [];
  let liked = new Set();
  if (auth) {
    const result = await db.query('SELECT post_id FROM public.post_likes WHERE user_id=$1::uuid AND post_id=ANY($2::uuid[])', [auth.user.id,posts.map(p=>p.id)]);
    liked = new Set(result.rows.map(r=>r.post_id));
  }
  return posts.map(p=>({ ...p, userHasLiked: liked.has(p.id), created_date:p.created_at, replies_count:p.comments_count }));
}
async function listPosts(db, communityId, auth, url) {
  const access = await communityAccess(db,communityId,auth);
  if (!access.community) throw Object.assign(new Error('Community not found.'),{status:404});
  if (!access.allowed) throw Object.assign(new Error('Community access denied.'),{status:403});
  const values=[communityId];
  const clauses=["community_id=$1::uuid","moderation_status='approved'"];
  const search=(url.searchParams.get('search')||'').trim();
  if(search){values.push(`%${search}%`);clauses.push(`(title ILIKE $${values.length} OR content ILIKE $${values.length})`);}
  const sort=order(url.searchParams.get('order'),POST_SORT,'-created_at');
  const result=await db.query(`SELECT * FROM public.community_posts WHERE ${clauses.join(' AND ')} ORDER BY is_pinned DESC,${sort.field} ${sort.dir},id ASC`,values);
  return postFlags(db,result.rows,auth);
}
async function comments(db, postId, auth) {
  const postResult=await db.query('SELECT community_id FROM public.community_posts WHERE id=$1::uuid AND moderation_status=\'approved\'', [postId]);
  if(!postResult.rows[0]) throw Object.assign(new Error('Post not found.'),{status:404});
  const access=await communityAccess(db,postResult.rows[0].community_id,auth);
  if(!access.allowed) throw Object.assign(new Error('Community access denied.'),{status:403});
  const result=await db.query("SELECT * FROM public.post_comments WHERE post_id=$1::uuid AND moderation_status='approved' ORDER BY created_at ASC",[postId]);
  let liked=new Set();
  if(auth&&result.rows.length){const l=await db.query('SELECT comment_id FROM public.comment_likes WHERE user_id=$1::uuid AND comment_id=ANY($2::uuid[])',[auth.user.id,result.rows.map(c=>c.id)]);liked=new Set(l.rows.map(x=>x.comment_id));}
  const top=[];const replies=new Map();
  for(const c of result.rows){const item={...c,userHasLiked:liked.has(c.id),created_date:c.created_at,replies:[]};if(c.parent_comment_id){if(!replies.has(c.parent_comment_id))replies.set(c.parent_comment_id,[]);replies.get(c.parent_comment_id).push(item);}else top.push(item);}
  for(const c of top)c.replies=replies.get(c.id)||[];
  return top;
}

export async function handleCommunitiesRequest(request,env,url){
  if(!url.pathname.startsWith('/api/communities'))return null;
  const auth=await session(request,env);
  try{return await withDb(env,async db=>{
    if(url.pathname==='/api/communities'&&request.method==='GET')return json({ok:true,communities:await listCommunities(db,auth,url)});
    if(url.pathname==='/api/communities/mine'){
      if(!auth)return fail('Authentication required.',401,'unauthorized');
      if(request.method!=='GET')return fail('Method not allowed.',405,'method_not_allowed');
      const result=await db.query(`SELECT c.*,jsonb_build_object('role',m.role,'status',m.status,'joined_at',m.joined_at) AS membership FROM public.community_members m JOIN public.communities c ON c.id=m.community_id WHERE m.user_id=$1::uuid AND m.status='active' ORDER BY m.joined_at DESC`,[auth.user.id]);
      return json({ok:true,communities:result.rows});
    }
    const commentsMatch=url.pathname.match(/^\/api\/communities\/posts\/([0-9a-f-]{36})\/comments$/i);
    if(commentsMatch){
      const postId=commentsMatch[1];
      if(request.method==='GET')return json({ok:true,comments:await comments(db,postId,auth)});
      if(!auth)return fail('Authentication required.',401,'unauthorized');
      if(request.method==='POST'){
        const input=await readJson(request);const content=text(input.content,10000,true);const anonymous=Boolean(input.is_anonymous);const parent=input.parent_comment_id||null;
        const post=await db.query('SELECT community_id,is_locked FROM public.community_posts WHERE id=$1::uuid AND moderation_status=\'approved\'',[postId]);
        if(!post.rows[0])return fail('Post not found.',404,'not_found');if(post.rows[0].is_locked)return fail('This discussion is locked.',403,'forbidden');
        const access=await communityAccess(db,post.rows[0].community_id,auth);if(!access.allowed||!await requireActiveMember(db,access.community,auth.user.id))return fail('Active community membership is required.',403,'forbidden');
        if(parent){const p=await db.query('SELECT 1 FROM public.post_comments WHERE id=$1::uuid AND post_id=$2::uuid',[parent,postId]);if(!p.rowCount)return fail('Parent comment not found.',404,'not_found');}
        const name=await authorName(db,auth,anonymous);const r=await db.query(`INSERT INTO public.post_comments(post_id,author_id,parent_comment_id,content,author_name,is_anonymous,moderation_status) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,'approved') RETURNING *`,[postId,auth.user.id,parent,content,name,anonymous]);
        return json({ok:true,comment:{...r.rows[0],created_date:r.rows[0].created_at,replies:[]}},201);
      }return fail('Method not allowed.',405,'method_not_allowed');
    }
    const commentItem=url.pathname.match(/^\/api\/communities\/comments\/([0-9a-f-]{36})$/i);
    if(commentItem){if(!auth)return fail('Authentication required.',401,'unauthorized');const id=commentItem[1];
      if(request.method==='PATCH'){const input=await readJson(request);const fields=[];const values=[];if('content'in input){values.push(text(input.content,10000,true));fields.push(`content=$${values.length}`);}if('is_anonymous'in input){const anon=Boolean(input.is_anonymous);values.push(anon);fields.push(`is_anonymous=$${values.length}`);values.push(await authorName(db,auth,anon));fields.push(`author_name=$${values.length}`);}if(!fields.length)return fail('No comment updates provided.');values.push(id,auth.user.id);const r=await db.query(`UPDATE public.post_comments SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length-1}::uuid AND author_id=$${values.length}::uuid RETURNING *`,values);return r.rows[0]?json({ok:true,comment:{...r.rows[0],created_date:r.rows[0].created_at}}):fail('Comment not found.',404,'not_found');}
      if(request.method==='DELETE'){const r=await db.query('DELETE FROM public.post_comments WHERE id=$1::uuid AND author_id=$2::uuid RETURNING id',[id,auth.user.id]);return r.rowCount?json({ok:true}):fail('Comment not found.',404,'not_found');}
      return fail('Method not allowed.',405,'method_not_allowed');}
    const commentLike=url.pathname.match(/^\/api\/communities\/comments\/([0-9a-f-]{36})\/like$/i);
    if(commentLike){if(!auth)return fail('Authentication required.',401,'unauthorized');if(request.method==='POST'){await db.query('INSERT INTO public.comment_likes(comment_id,user_id) VALUES($1::uuid,$2::uuid) ON CONFLICT DO NOTHING',[commentLike[1],auth.user.id]);return json({ok:true});}if(request.method==='DELETE'){await db.query('DELETE FROM public.comment_likes WHERE comment_id=$1::uuid AND user_id=$2::uuid',[commentLike[1],auth.user.id]);return json({ok:true});}return fail('Method not allowed.',405,'method_not_allowed');}
    const postInteraction=url.pathname.match(/^\/api\/communities\/posts\/([0-9a-f-]{36})\/(like|share)$/i);
    if(postInteraction){if(!auth)return fail('Authentication required.',401,'unauthorized');const postId=postInteraction[1];const action=postInteraction[2];
      if(action==='like'){if(request.method==='POST'){await db.query('INSERT INTO public.post_likes(post_id,user_id) VALUES($1::uuid,$2::uuid) ON CONFLICT DO NOTHING',[postId,auth.user.id]);return json({ok:true});}if(request.method==='DELETE'){await db.query('DELETE FROM public.post_likes WHERE post_id=$1::uuid AND user_id=$2::uuid',[postId,auth.user.id]);return json({ok:true});}}
      if(action==='share'&&request.method==='POST'){const input=await readJson(request);const via=text(input.shared_via,100)||'internal';const dest=input.shared_to_community_id||null;const r=await db.query('INSERT INTO public.post_shares(post_id,user_id,shared_to_community_id,shared_via) VALUES($1::uuid,$2::uuid,$3::uuid,$4) RETURNING *',[postId,auth.user.id,dest,via]);return json({ok:true,share:r.rows[0]},201);}return fail('Method not allowed.',405,'method_not_allowed');}
    const postsMatch=url.pathname.match(/^\/api\/communities\/([0-9a-f-]{36})\/posts$/i);
    if(postsMatch){const communityId=postsMatch[1];if(request.method==='GET')return json({ok:true,posts:await listPosts(db,communityId,auth,url)});if(!auth)return fail('Authentication required.',401,'unauthorized');if(request.method==='POST'){const access=await communityAccess(db,communityId,auth);if(!access.community)return fail('Community not found.',404,'not_found');if(!await requireActiveMember(db,access.community,auth.user.id))return fail('Active community membership is required.',403,'forbidden');if(!access.community.allow_member_posts&&access.community.creator_id!==auth.user.id)return fail('Member posts are disabled for this community.',403,'forbidden');const input=await readJson(request);const anonymous=Boolean(input.is_anonymous);const name=await authorName(db,auth,anonymous);const r=await db.query(`INSERT INTO public.community_posts(community_id,author_id,title,content,author_name,is_anonymous,tags,moderation_status) VALUES($1::uuid,$2::uuid,$3,$4,$5,$6,$7::text[],'approved') RETURNING *`,[communityId,auth.user.id,text(input.title,300,true),text(input.content,30000,true),name,anonymous,textArray(input.tags)]);return json({ok:true,post:{...r.rows[0],created_date:r.rows[0].created_at}},201);}return fail('Method not allowed.',405,'method_not_allowed');}
    const postItem=url.pathname.match(/^\/api\/communities\/posts\/([0-9a-f-]{36})$/i);
    if(postItem){if(!auth)return fail('Authentication required.',401,'unauthorized');const id=postItem[1];if(request.method==='PATCH'){const input=await readJson(request);const fields=[];const values=[];for(const key of ['title','content','is_anonymous','tags'])if(key in input){let v=input[key];if(key==='title')v=text(v,300,true);if(key==='content')v=text(v,30000,true);if(key==='is_anonymous')v=Boolean(v);if(key==='tags')v=textArray(v);values.push(v);fields.push(`${key}=$${values.length}`);}if('is_anonymous'in input){values.push(await authorName(db,auth,Boolean(input.is_anonymous)));fields.push(`author_name=$${values.length}`);}if(!fields.length)return fail('No post updates provided.');values.push(id,auth.user.id);const r=await db.query(`UPDATE public.community_posts SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length-1}::uuid AND author_id=$${values.length}::uuid RETURNING *`,values);return r.rows[0]?json({ok:true,post:{...r.rows[0],created_date:r.rows[0].created_at}}):fail('Post not found.',404,'not_found');}if(request.method==='DELETE'){const r=await db.query('DELETE FROM public.community_posts WHERE id=$1::uuid AND author_id=$2::uuid RETURNING id',[id,auth.user.id]);return r.rowCount?json({ok:true}):fail('Post not found.',404,'not_found');}return fail('Method not allowed.',405,'method_not_allowed');}
    const membershipRoute=url.pathname.match(/^\/api\/communities\/([0-9a-f-]{36})\/membership$/i);
    if(membershipRoute){if(!auth)return fail('Authentication required.',401,'unauthorized');const id=membershipRoute[1];const access=await communityAccess(db,id,auth);if(!access.community)return fail('Community not found.',404,'not_found');if(request.method==='POST'){const creator=access.community.creator_id===auth.user.id;const status=access.community.requires_approval&&!creator?'pending':'active';const role=creator?'admin':'member';const r=await db.query(`INSERT INTO public.community_members(community_id,user_id,role,status) VALUES($1::uuid,$2::uuid,$3,$4) ON CONFLICT(community_id,user_id) DO UPDATE SET role=CASE WHEN public.community_members.role='admin' THEN 'admin' ELSE EXCLUDED.role END,status=EXCLUDED.status RETURNING *`,[id,auth.user.id,role,status]);return json({ok:true,membership:r.rows[0]},201);}if(request.method==='DELETE'){if(access.community.creator_id===auth.user.id)return fail('A community creator cannot leave their own community. Delete it or transfer ownership first.',409,'conflict');await db.query("UPDATE public.community_members SET status='left' WHERE community_id=$1::uuid AND user_id=$2::uuid",[id,auth.user.id]);return json({ok:true});}return fail('Method not allowed.',405,'method_not_allowed');}
    const item=url.pathname.match(/^\/api\/communities\/([0-9a-f-]{36})$/i);
    if(item){const id=item[1];if(request.method==='GET'){const access=await communityAccess(db,id,auth);if(!access.community)return fail('Community not found.',404,'not_found');if(!access.allowed)return fail('Community access denied.',403,'forbidden');return json({ok:true,community:decorateCommunity(access.community,access.member,auth)});}if(!auth)return fail('Authentication required.',401,'unauthorized');if(request.method==='PATCH'){const input=await readJson(request);const fields=[];const values=[];for(const key of ['name','description','icon','category','is_public','requires_approval','allow_member_posts'])if(key in input){let v=input[key];if(key==='name')v=text(v,250,true);if(key==='description')v=text(v,5000);if(key==='icon')v=text(v,100);if(key==='category'&&!CATEGORIES.has(v))return fail('Invalid community category.');if(['is_public','requires_approval','allow_member_posts'].includes(key))v=Boolean(v);values.push(v);fields.push(`${key}=$${values.length}`);}if(!fields.length)return fail('No community updates provided.');values.push(id,auth.user.id);const r=await db.query(`UPDATE public.communities SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length-1}::uuid AND creator_id=$${values.length}::uuid RETURNING *`,values);return r.rows[0]?json({ok:true,community:r.rows[0]}):fail('Community not found or permission denied.',404,'not_found');}if(request.method==='DELETE'){const r=await db.query('DELETE FROM public.communities WHERE id=$1::uuid AND creator_id=$2::uuid RETURNING id',[id,auth.user.id]);return r.rowCount?json({ok:true}):fail('Community not found or permission denied.',404,'not_found');}return fail('Method not allowed.',405,'method_not_allowed');}
    if(url.pathname==='/api/communities'&&request.method==='POST'){if(!auth)return fail('Authentication required.',401,'unauthorized');const input=await readJson(request);const category=input.category||'general';if(!CATEGORIES.has(category))return fail('Invalid community category.');await db.query('BEGIN');try{const r=await db.query(`INSERT INTO public.communities(creator_id,name,description,icon,category,is_public,requires_approval,allow_member_posts) VALUES($1::uuid,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[auth.user.id,text(input.name,250,true),text(input.description,5000),text(input.icon,100)||'💬',category,input.is_public!==false,Boolean(input.requires_approval),input.allow_member_posts!==false]);await db.query("INSERT INTO public.community_members(community_id,user_id,role,status) VALUES($1::uuid,$2::uuid,'admin','active')",[r.rows[0].id,auth.user.id]);await db.query('COMMIT');return json({ok:true,community:r.rows[0]},201);}catch(e){await db.query('ROLLBACK');throw e;}}
    return fail('Community route not found.',404,'not_found');
  });}catch(err){console.error('One2OneLove communities API error',err);return fail(err?.message||'Unable to process community request.',err?.status||400,err?.status===403?'forbidden':'community_error');}
}
