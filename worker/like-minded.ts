// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
};

const CATEGORY_LIST=['Relationship Goals','Communication','Values','Family','Lifestyle','Money & Ambition','Boundaries','Future Priorities','Fun Scenarios','Humor','Activities','Food & Travel','Entertainment','Daily Preferences','Wild Card'];
const CATEGORIES=new Set(CATEGORY_LIST);
const DEPTHS=new Set(['Easy','Real','Deep']);
const DAILY_LIMITS={Free:10,Premiere:63,Exclusive:null};
const MAX_ROOM_QUESTIONS=42;

function json(data,status=200){ return new Response(JSON.stringify(data),{status,headers:HEADERS}); }
function fail(message,status=400,code='bad_request',extra={}){ return json({ok:false,error:{code,message,...extra}},status); }

async function session(request,env){
  const cookie=request.headers.get('cookie');
  if(!cookie) return null;
  const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
  if(!response.ok) return null;
  const payload=await response.json().catch(()=>null);
  const user=payload?.user??payload?.data?.user??null;
  const active=payload?.session??payload?.data?.session??null;
  return user?.id&&user?.emailVerified===true&&active?{user,session:active}:null;
}

async function withDb(env,fn){
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();
  try{return await fn(db);}finally{await db.end();}
}

async function readJson(request){
  if(!(request.headers.get('content-type')||'').includes('application/json')) return {};
  return request.json().catch(()=>({}));
}

function clean(value,max=120){ return String(value??'').trim().slice(0,max); }
function code(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const a=new Uint8Array(6); crypto.getRandomValues(a);
  return Array.from(a,n=>alphabet[n%alphabet.length]).join('');
}
function planName(value){
  const raw=String(value||'').trim().toLowerCase();
  if(raw==='exclusive'||raw==='elite')return 'Exclusive';
  if(raw==='premiere'||raw==='premier')return 'Premiere';
  return 'Free';
}
function validQuestionId(value){
  const raw=clean(value,180);
  const parts=raw.split(':');
  let variant='v1';
  if(/^v[1-3]$/.test(parts[parts.length-1]||''))variant=parts.pop();
  const depth=parts.pop();
  const category=parts.join(':');
  return Boolean(variant)&&CATEGORIES.has(category)&&['easy','real','deep'].includes(depth);
}

function depthKey(value){ return value==='Easy'?'easy':value==='Deep'?'deep':'real'; }
function expectedQuestionId(room){
  const start=Math.max(0,CATEGORY_LIST.indexOf(room.category));
  const absolute=Math.max(0,(Number(room.set_number||1)-1)*21+(Number(room.current_question_no||1)-1));
  const variant=Math.floor(absolute/CATEGORY_LIST.length)%3;
  const within=absolute%CATEGORY_LIST.length;
  const category=CATEGORY_LIST[(start+within+variant*5)%CATEGORY_LIST.length];
  return category+':'+depthKey(room.depth)+':v'+(variant+1);
}
function generalLocation(value,label,max=120){
  const text=clean(value,max);
  if(!text)return '';
  if(/[0-9@]/.test(text)||/https?:\/\//i.test(text))throw Object.assign(new Error(label+' must be a general location, not an address or contact detail.'),{status:400,code:'general_location_required'});
  return text;
}
async function enforceRoomCreateRate(db,userId){
  const recent=(await db.query(`SELECT count(*)::int AS count FROM public.like_minded_rooms WHERE host_user_id=$1::uuid AND created_at>now()-interval '1 hour'`,[userId])).rows[0]?.count||0;
  if(recent>=20)throw Object.assign(new Error('Too many Like Minded game rooms were created recently. Try again later.'),{status:429,code:'rate_limited'});
  const open=(await db.query(`SELECT count(*)::int AS count FROM public.like_minded_rooms WHERE host_user_id=$1::uuid AND status='waiting' AND updated_at>now()-interval '24 hours'`,[userId])).rows[0]?.count||0;
  if(open>=5)throw Object.assign(new Error('Finish or reuse an existing invitation before creating another game room.'),{status:409,code:'open_room_limit'});
}

async function ensureSchema(db){
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.like_minded_rooms(
      id uuid PRIMARY KEY,
      code varchar(12) UNIQUE NOT NULL,
      host_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      guest_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
      invited_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
      category varchar(80) NOT NULL DEFAULT 'Relationship Goals',
      depth varchar(12) NOT NULL DEFAULT 'Real',
      host_language varchar(8) NOT NULL DEFAULT 'en',
      guest_language varchar(8),
      status varchar(20) NOT NULL DEFAULT 'waiting',
      set_number int NOT NULL DEFAULT 1,
      current_question_no int NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.like_minded_answers(
      room_id uuid NOT NULL REFERENCES public.like_minded_rooms(id) ON DELETE CASCADE,
      set_number int NOT NULL,
      question_no int NOT NULL,
      question_id varchar(180) NOT NULL,
      user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      answer_id int NOT NULL CHECK(answer_id BETWEEN 0 AND 3),
      locked_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(room_id,set_number,question_no,user_id)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.like_minded_player_settings(
      user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
      available boolean NOT NULL DEFAULT false,
      in_lobby boolean NOT NULL DEFAULT false,
      city varchar(120),
      state_region varchar(120),
      country varchar(120),
      language varchar(8) NOT NULL DEFAULT 'en',
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.like_minded_blocks(
      blocker_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      blocked_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(blocker_user_id,blocked_user_id)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.like_minded_reports(
      id uuid PRIMARY KEY,
      reporting_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      reported_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      room_id uuid REFERENCES public.like_minded_rooms(id) ON DELETE SET NULL,
      context text,
      status varchar(20) NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.like_minded_usage(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      usage_key varchar(220) NOT NULL,
      mode varchar(20) NOT NULL CHECK(mode IN ('solo','multiplayer')),
      question_id varchar(180) NOT NULL,
      used_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(user_id,usage_key)
    )
  `);
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_rooms_code ON public.like_minded_rooms(code)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_lobby ON public.like_minded_player_settings(available,in_lobby,updated_at DESC)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_answers_room ON public.like_minded_answers(room_id,set_number,question_no)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_usage_user_day ON public.like_minded_usage(user_id,used_at DESC)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_rooms_user_activity ON public.like_minded_rooms(host_user_id,updated_at DESC)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_rooms_guest_activity ON public.like_minded_rooms(guest_user_id,updated_at DESC)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_rooms_status_activity ON public.like_minded_rooms(status,updated_at DESC)');
}

async function cleanup(db){
  await db.query(`UPDATE public.like_minded_rooms SET status='abandoned',updated_at=now()
                    WHERE status IN ('waiting','active') AND updated_at<now()-interval '24 hours'`);
  await db.query(`DELETE FROM public.like_minded_rooms WHERE updated_at<now()-interval '30 days'`);
  await db.query(`DELETE FROM public.like_minded_usage WHERE used_at<now()-interval '90 days'`);
  await db.query(`UPDATE public.like_minded_player_settings SET available=false,in_lobby=false
                    WHERE updated_at<now()-interval '15 minutes' AND (available=true OR in_lobby=true)`);
}

async function memberAccess(db,userId){
  const r=await db.query(`
    SELECT a.role,COALESCE(a.banned,false) AS banned,
           COALESCE(p.is_active,true) AS is_active,
           COALESCE(p.phone_number_verified,false) AS phone_verified,
           p.subscription_plan,p.subscription_status,p.subscription_end_date,p.stripe_subscription_id
      FROM neon_auth."user" a
      LEFT JOIN public.users p ON p.id=a.id
     WHERE a.id=$1::uuid LIMIT 1`,[userId]);
  const row=r.rows[0];
  if(!row)throw Object.assign(new Error('One2OneLove member profile was not found.'),{status:404,code:'profile_not_found'});
  if(row.banned||row.is_active===false)throw Object.assign(new Error('Account access is unavailable.'),{status:403,code:'forbidden'});
  if(row.phone_verified!==true)throw Object.assign(new Error('Phone verification is required for Like Minded multiplayer and tracked play.'),{status:428,code:'phone_verification_required'});
  let plan='Free';
  if(row.role==='admin') plan='Exclusive';
  else {
    const status=String(row.subscription_status||'').toLowerCase();
    const rawPlan=String(row.subscription_plan||'').trim().toLowerCase();
    const adminUntil=row.subscription_end_date?new Date(row.subscription_end_date):null;
    const adminAccess=Boolean(adminUntil&&!Number.isNaN(adminUntil.getTime())&&adminUntil.getTime()>Date.now());
    const paid=adminAccess||(['active','trial','trialing'].includes(status)&&Boolean(row.stripe_subscription_id));
    if(paid)plan=planName(row.subscription_plan);
    else if(rawPlan==='free')plan='Free';
    else throw Object.assign(new Error('Like Minded tracked play is available after Free membership activation or with an active paid membership.'),{status:402,code:'free_membership_required'});
  }
  return {plan,dailyLimit:DAILY_LIMITS[plan]};
}

async function accessSnapshot(db,userId){
  const access=await memberAccess(db,userId);
  const used=(await db.query(`
    SELECT count(*)::int AS count FROM public.like_minded_usage
     WHERE user_id=$1::uuid
       AND (used_at AT TIME ZONE 'UTC')::date=(now() AT TIME ZONE 'UTC')::date`,[userId])).rows[0]?.count||0;
  return {...access,usedToday:used,remaining:access.dailyLimit==null?null:Math.max(0,access.dailyLimit-used)};
}

async function consumeUsage(db,userId,usageKey,mode,questionId){
  const key=clean(usageKey,220);
  if(!key||!['solo','multiplayer'].includes(mode)||!validQuestionId(questionId))throw Object.assign(new Error('Invalid Like Minded usage record.'),{status:400,code:'invalid_usage'});
  await db.query('BEGIN');
  try{
    // Serialize usage decisions per member so concurrent tabs/devices cannot race past a daily cap.
    await db.query('SELECT id FROM public.users WHERE id=$1::uuid FOR UPDATE',[userId]);
    const existing=await db.query('SELECT 1 FROM public.like_minded_usage WHERE user_id=$1::uuid AND usage_key=$2',[userId,key]);
    if(existing.rowCount){
      const snapshot=await accessSnapshot(db,userId);
      await db.query('COMMIT');
      return snapshot;
    }
    const snapshot=await accessSnapshot(db,userId);
    if(snapshot.dailyLimit!=null&&snapshot.usedToday>=snapshot.dailyLimit){
      throw Object.assign(new Error(`${snapshot.plan} Like Minded daily play limit reached.`),{status:403,code:'like_minded_daily_limit',extra:snapshot});
    }
    await db.query(`INSERT INTO public.like_minded_usage(user_id,usage_key,mode,question_id)
                     VALUES($1::uuid,$2,$3,$4) ON CONFLICT(user_id,usage_key) DO NOTHING`,[userId,key,mode,questionId]);
    const updated=await accessSnapshot(db,userId);
    await db.query('COMMIT');
    return updated;
  }catch(err){
    await db.query('ROLLBACK').catch(()=>{});
    throw err;
  }
}

async function roomState(db,room,userId){
  const isHost=room.host_user_id===userId;
  const isGuest=room.guest_user_id===userId;
  if(!isHost&&!isGuest) return null;

  const answers=await db.query(
    `SELECT user_id::text,answer_id,question_id,locked_at
       FROM public.like_minded_answers
      WHERE room_id=$1::uuid AND set_number=$2 AND question_no=$3
      ORDER BY locked_at`,
    [room.id,room.set_number,room.current_question_no]
  );

  const mine=answers.rows.find(r=>r.user_id===userId)||null;
  const other=answers.rows.find(r=>r.user_id!==userId)||null;
  const bothLocked=Boolean(room.guest_user_id&&mine&&other);
  const opponentId=isHost?room.guest_user_id:room.host_user_id;
  let opponentFirstName=null;
  if(opponentId){
    const n=await db.query(`SELECT COALESCE(NULLIF(split_part(name,' ',1),''),'Player') AS first_name FROM public.users WHERE id=$1::uuid`,[opponentId]);
    opponentFirstName=n.rows[0]?.first_name||'Player';
  }

  const score=await db.query(
    `SELECT
       count(*) FILTER (WHERE player_count=2)::int AS total_answered,
       count(*) FILTER (WHERE player_count=2 AND min_answer=max_answer)::int AS matches
     FROM (
       SELECT set_number,question_no,count(*)::int AS player_count,
              min(answer_id)::int AS min_answer,max(answer_id)::int AS max_answer
         FROM public.like_minded_answers
        WHERE room_id=$1::uuid
        GROUP BY set_number,question_no
     ) q`,
    [room.id]
  );

  const byCategory=await db.query(
    `SELECT category,
            count(*) FILTER (WHERE player_count=2)::int AS total,
            count(*) FILTER (WHERE player_count=2 AND min_answer=max_answer)::int AS matches
       FROM (
         SELECT split_part(question_id,':',1) AS category,set_number,question_no,
                count(*)::int AS player_count,min(answer_id)::int AS min_answer,max(answer_id)::int AS max_answer
           FROM public.like_minded_answers
          WHERE room_id=$1::uuid
          GROUP BY split_part(question_id,':',1),set_number,question_no
       ) s
      GROUP BY category`,
    [room.id]
  );
  const categoryScores={};
  for(const row of byCategory.rows)categoryScores[row.category]={matches:row.matches||0,total:row.total||0};

  return {
    id:room.id,code:room.code,host_user_id:room.host_user_id,guest_user_id:room.guest_user_id,
    invited_user_id:room.invited_user_id,category:room.category,depth:room.depth,status:room.status,
    set_number:room.set_number,current_question_no:room.current_question_no,
    my_locked:Boolean(mine),other_locked:Boolean(other),both_locked:bothLocked,
    my_answer_id:mine?.answer_id??null,other_answer_id:bothLocked?(other?.answer_id??null):null,
    current_match:bothLocked?mine.answer_id===other.answer_id:null,
    question_id:mine?.question_id||other?.question_id||null,
    matches:score.rows[0]?.matches||0,total_answered:score.rows[0]?.total_answered||0,
    category_scores:categoryScores,opponent_user_id:opponentId||null,opponent_first_name:opponentFirstName,
    created_at:room.created_at,updated_at:room.updated_at,
  };
}

async function getRoomByCode(db,rawCode){
  const value=clean(rawCode,12).toUpperCase();
  if(!value)return null;
  const result=await db.query('SELECT * FROM public.like_minded_rooms WHERE code=$1 LIMIT 1',[value]);
  return result.rows[0]||null;
}

async function activeRoom(db,userId){
  const r=await db.query(`
    SELECT * FROM public.like_minded_rooms
     WHERE (host_user_id=$1::uuid OR guest_user_id=$1::uuid)
       AND status IN ('waiting','active')
       AND updated_at>now()-interval '24 hours'
     ORDER BY updated_at DESC LIMIT 1`,[userId]);
  return r.rows[0]?roomState(db,r.rows[0],userId):null;
}

async function history(db,userId){
  const r=await db.query(`
    SELECT r.*,
      CASE WHEN r.host_user_id=$1::uuid THEN r.guest_user_id ELSE r.host_user_id END AS opponent_user_id
      FROM public.like_minded_rooms r
     WHERE r.host_user_id=$1::uuid OR r.guest_user_id=$1::uuid
     ORDER BY r.updated_at DESC LIMIT 20`,[userId]);
  const out=[];
  for(const room of r.rows){
    const state=await roomState(db,room,userId);
    if(state)out.push(state);
  }
  return out;
}

export async function handleLikeMindedRequest(request,env,url){
  if(!url.pathname.startsWith('/api/like-minded'))return null;
  const auth=await session(request,env);
  if(!auth)return fail('Sign in with a verified One2OneLove account to use tracked Like Minded play.',401,'unauthorized');

  try{
    return await withDb(env,async(db)=>{
      await ensureSchema(db);
      await cleanup(db);
      const body=['POST','PATCH','PUT'].includes(request.method)?await readJson(request):{};

      if(url.pathname==='/api/like-minded/access'&&request.method==='GET'){
        return json({ok:true,access:await accessSnapshot(db,auth.user.id)});
      }

      if(url.pathname==='/api/like-minded/solo/use'&&request.method==='POST'){
        const access=await consumeUsage(db,auth.user.id,body.usageKey,'solo',body.questionId);
        return json({ok:true,access});
      }

      if(url.pathname==='/api/like-minded/history'&&request.method==='GET'){
        await memberAccess(db,auth.user.id);
        return json({ok:true,games:await history(db,auth.user.id)});
      }

      if(url.pathname==='/api/like-minded/rooms/active'&&request.method==='GET'){
        await memberAccess(db,auth.user.id);
        return json({ok:true,room:await activeRoom(db,auth.user.id)});
      }

      if(url.pathname==='/api/like-minded/settings'){
        await memberAccess(db,auth.user.id);
        const current=await db.query('SELECT * FROM public.like_minded_player_settings WHERE user_id=$1::uuid',[auth.user.id]);
        const row=current.rows[0]||null;
        if(request.method==='GET')return json({ok:true,settings:row||{user_id:auth.user.id,available:false,in_lobby:false,city:null,state_region:null,country:null,language:'en'}});
        if(request.method==='POST'||request.method==='PATCH'){
          if(row?.in_lobby===true&&body.available===false)return fail('Availability stays ON while you are inside the Player Lobby.',409,'lobby_availability_locked');
          const available=body.available===undefined?Boolean(row?.available):Boolean(body.available);
          await db.query(
            `INSERT INTO public.like_minded_player_settings(user_id,available,in_lobby,language,updated_at)
             VALUES($1::uuid,$2,false,$3,now())
             ON CONFLICT(user_id) DO UPDATE SET available=excluded.available,language=excluded.language,updated_at=now()`,
            [auth.user.id,available,['en','es','fr','it','de'].includes(body.language)?body.language:(row?.language||'en')]
          );
          return json({ok:true,available});
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }

      if(url.pathname==='/api/like-minded/lobby'){
        await memberAccess(db,auth.user.id);
        if(request.method==='POST'){
          const existing=await db.query('SELECT * FROM public.like_minded_player_settings WHERE user_id=$1::uuid',[auth.user.id]);
          const previous=existing.rows[0]||{};
          const inLobby=body.inLobby===undefined?Boolean(previous.in_lobby):Boolean(body.inLobby);
          const available=inLobby?true:(body.available===undefined?Boolean(previous.available):Boolean(body.available));
          const city=body.city===undefined?previous.city:generalLocation(body.city,'City',120);
          const stateRegion=body.stateRegion===undefined?previous.state_region:generalLocation(body.stateRegion,'State / region',120);
          const country=body.country===undefined?previous.country:generalLocation(body.country,'Country',120);
          const language=['en','es','fr','it','de'].includes(body.language)?body.language:(previous.language||'en');
          if(inLobby&&(!city||!country))return fail('City and country are required to enter the Player Lobby.');
          await db.query(
            `INSERT INTO public.like_minded_player_settings(user_id,available,in_lobby,city,state_region,country,language,updated_at)
             VALUES($1::uuid,$2,$3,$4,$5,$6,$7,now())
             ON CONFLICT(user_id) DO UPDATE SET available=excluded.available,in_lobby=excluded.in_lobby,
             city=excluded.city,state_region=excluded.state_region,country=excluded.country,language=excluded.language,updated_at=now()`,
            [auth.user.id,available,inLobby,city||null,stateRegion||null,country||null,language]
          );
          return json({ok:true,available,inLobby});
        }
        if(request.method==='GET'){
          await db.query('UPDATE public.like_minded_player_settings SET updated_at=now(),available=true WHERE user_id=$1::uuid AND in_lobby=true',[auth.user.id]);
          const result=await db.query(
            `SELECT s.user_id::text,
                    COALESCE(NULLIF(split_part(u.name,' ',1),''),'Player') AS first_name,
                    s.city,s.state_region,s.country,s.language,s.updated_at
               FROM public.like_minded_player_settings s
               JOIN public.users u ON u.id=s.user_id
              WHERE s.available=true AND s.user_id<>$1::uuid AND s.updated_at>now()-interval '10 minutes'
                AND NOT EXISTS(
                  SELECT 1 FROM public.like_minded_blocks b
                   WHERE (b.blocker_user_id=$1::uuid AND b.blocked_user_id=s.user_id)
                      OR (b.blocker_user_id=s.user_id AND b.blocked_user_id=$1::uuid))
              ORDER BY s.in_lobby DESC,s.updated_at DESC LIMIT 100`,[auth.user.id]
          );
          const invites=await db.query(
            `SELECT r.code,r.category,r.depth,COALESCE(NULLIF(split_part(u.name,' ',1),''),'Player') AS host_first_name,r.created_at
               FROM public.like_minded_rooms r JOIN public.users u ON u.id=r.host_user_id
              WHERE r.invited_user_id=$1::uuid AND r.guest_user_id IS NULL AND r.status='waiting'
                AND r.created_at>now()-interval '30 minutes'
                AND NOT EXISTS(
                  SELECT 1 FROM public.like_minded_blocks b
                   WHERE (b.blocker_user_id=$1::uuid AND b.blocked_user_id=r.host_user_id)
                      OR (b.blocker_user_id=r.host_user_id AND b.blocked_user_id=$1::uuid))
              ORDER BY r.created_at DESC LIMIT 20`,[auth.user.id]
          );
          return json({ok:true,players:result.rows,invites:invites.rows});
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }

      if(url.pathname==='/api/like-minded/blocks'&&request.method==='POST'){
        await memberAccess(db,auth.user.id);
        const blocked=clean(body.userId,80);
        if(!/^[0-9a-f-]{36}$/i.test(blocked)||blocked===auth.user.id)return fail('Invalid player.');
        await db.query('BEGIN');
        try{
          await db.query('INSERT INTO public.like_minded_blocks(blocker_user_id,blocked_user_id) VALUES($1::uuid,$2::uuid) ON CONFLICT DO NOTHING',[auth.user.id,blocked]);
          await db.query(`UPDATE public.like_minded_rooms SET status='blocked',updated_at=now()
                           WHERE status IN ('waiting','active') AND ((host_user_id=$1::uuid AND guest_user_id=$2::uuid) OR (host_user_id=$2::uuid AND guest_user_id=$1::uuid))`,[auth.user.id,blocked]);
          await db.query('COMMIT');
        }catch(e){await db.query('ROLLBACK');throw e;}
        return json({ok:true});
      }

      if(url.pathname==='/api/like-minded/reports'&&request.method==='POST'){
        await memberAccess(db,auth.user.id);
        const reported=clean(body.userId,80);
        if(!/^[0-9a-f-]{36}$/i.test(reported)||reported===auth.user.id)return fail('Invalid player.');
        const roomId=/^[0-9a-f-]{36}$/i.test(clean(body.roomId,80))?clean(body.roomId,80):null;
        await db.query('INSERT INTO public.like_minded_reports(id,reporting_user_id,reported_user_id,room_id,context) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5)',[crypto.randomUUID(),auth.user.id,reported,roomId,clean(body.context,1000)||null]);
        return json({ok:true});
      }

      if(url.pathname==='/api/like-minded/rooms'&&request.method==='POST'){
        await memberAccess(db,auth.user.id);
        await enforceRoomCreateRate(db,auth.user.id);
        const category=CATEGORIES.has(body.category)?body.category:'Relationship Goals';
        const depth=DEPTHS.has(body.depth)?body.depth:'Real';
        const language=['en','es','fr','it','de'].includes(body.language)?body.language:'en';
        const invited=/^[0-9a-f-]{36}$/i.test(clean(body.invitedUserId,80))?clean(body.invitedUserId,80):null;
        if(invited===auth.user.id)return fail('You cannot invite yourself.');
        if(invited){
          const blocked=await db.query(`SELECT 1 FROM public.like_minded_blocks WHERE (blocker_user_id=$1::uuid AND blocked_user_id=$2::uuid) OR (blocker_user_id=$2::uuid AND blocked_user_id=$1::uuid)`,[auth.user.id,invited]);
          if(blocked.rowCount)return fail('This player is not available.',403,'player_unavailable');
        }
        let roomCode='';
        for(let i=0;i<8;i++){const candidate=code();const exists=await db.query('SELECT 1 FROM public.like_minded_rooms WHERE code=$1',[candidate]);if(!exists.rowCount){roomCode=candidate;break;}}
        if(!roomCode)return fail('Unable to create a unique room code.',500,'room_code_error');
        const id=crypto.randomUUID();
        const result=await db.query(
          `INSERT INTO public.like_minded_rooms(id,code,host_user_id,invited_user_id,category,depth,host_language)
           VALUES($1::uuid,$2,$3::uuid,$4::uuid,$5,$6,$7) RETURNING *`,
          [id,roomCode,auth.user.id,invited,category,depth,language]
        );
        return json({ok:true,room:await roomState(db,result.rows[0],auth.user.id),access:await accessSnapshot(db,auth.user.id)},201);
      }

      if(url.pathname==='/api/like-minded/rooms/join'&&request.method==='POST'){
        await memberAccess(db,auth.user.id);
        const room=await getRoomByCode(db,body.code);
        if(!room)return fail('Game room not found.',404,'not_found');
        if(!['waiting','active'].includes(room.status))return fail('This game is no longer active.',409,'room_closed');
        if(room.host_user_id===auth.user.id)return json({ok:true,room:await roomState(db,room,auth.user.id),access:await accessSnapshot(db,auth.user.id)});
        if(room.invited_user_id&&room.invited_user_id!==auth.user.id)return fail('This invitation is for another player.',403,'invite_mismatch');
        if(room.guest_user_id&&room.guest_user_id!==auth.user.id)return fail('This game room already has two players.',409,'room_full');
        const blocked=await db.query(`SELECT 1 FROM public.like_minded_blocks WHERE (blocker_user_id=$1::uuid AND blocked_user_id=$2::uuid) OR (blocker_user_id=$2::uuid AND blocked_user_id=$1::uuid)`,[auth.user.id,room.host_user_id]);
        if(blocked.rowCount)return fail('This game is unavailable.',403,'player_unavailable');
        const language=['en','es','fr','it','de'].includes(body.language)?body.language:'en';
        const updated=await db.query(`UPDATE public.like_minded_rooms SET guest_user_id=$2::uuid,guest_language=$3,status='active',updated_at=now() WHERE id=$1::uuid RETURNING *`,[room.id,auth.user.id,language]);
        return json({ok:true,room:await roomState(db,updated.rows[0],auth.user.id),access:await accessSnapshot(db,auth.user.id)});
      }

      const finishMatch=url.pathname.match(/^\/api\/like-minded\/rooms\/([A-Z0-9]+)\/finish$/i);
      if(finishMatch&&request.method==='POST'){
        await memberAccess(db,auth.user.id);
        const room=await getRoomByCode(db,finishMatch[1]);
        if(!room)return fail('Game room not found.',404,'not_found');
        if(auth.user.id!==room.host_user_id&&auth.user.id!==room.guest_user_id)return fail('You are not a player in this room.',403,'forbidden');
        const updated=await db.query(`UPDATE public.like_minded_rooms SET status='finished',updated_at=now() WHERE id=$1::uuid RETURNING *`,[room.id]);
        return json({ok:true,room:await roomState(db,updated.rows[0],auth.user.id)});
      }

      const roomMatch=url.pathname.match(/^\/api\/like-minded\/rooms\/([A-Z0-9]+)$/i);
      if(roomMatch&&request.method==='GET'){
        await memberAccess(db,auth.user.id);
        const room=await getRoomByCode(db,roomMatch[1]);
        if(!room)return fail('Game room not found.',404,'not_found');
        const state=await roomState(db,room,auth.user.id);
        if(!state)return fail('You are not a player in this room.',403,'forbidden');
        return json({ok:true,room:state,access:await accessSnapshot(db,auth.user.id)});
      }

      const answerMatch=url.pathname.match(/^\/api\/like-minded\/rooms\/([A-Z0-9]+)\/answer$/i);
      if(answerMatch&&request.method==='POST'){
        await memberAccess(db,auth.user.id);
        const room=await getRoomByCode(db,answerMatch[1]);
        if(!room)return fail('Game room not found.',404,'not_found');
        if(room.status!=='active')return fail('This game is not active.',409,'room_not_active');
        if(auth.user.id!==room.host_user_id&&auth.user.id!==room.guest_user_id)return fail('You are not a player in this room.',403,'forbidden');
        if(!room.guest_user_id)return fail('Waiting for Player 2.',409,'waiting_for_player');
        const answerId=Number(body.answerId);
        if(!Number.isInteger(answerId)||answerId<0||answerId>3)return fail('Choose a valid answer.');
        const questionId=clean(body.questionId,180);
        if(!validQuestionId(questionId))return fail('Question ID is invalid.',400,'invalid_question');
        const expected=expectedQuestionId(room);
        if(questionId!==expected)return fail('This answer does not match the current Like Minded question.',409,'question_mismatch',{expectedQuestionId:expected});
        const usageKey=`room:${room.id}:set:${room.set_number}:q:${room.current_question_no}`;
        const access=await consumeUsage(db,auth.user.id,usageKey,'multiplayer',questionId);
        await db.query(`INSERT INTO public.like_minded_answers(room_id,set_number,question_no,question_id,user_id,answer_id)
                         VALUES($1::uuid,$2,$3,$4,$5::uuid,$6)
                         ON CONFLICT(room_id,set_number,question_no,user_id) DO NOTHING`,
          [room.id,room.set_number,room.current_question_no,questionId,auth.user.id,answerId]);
        await db.query('UPDATE public.like_minded_rooms SET updated_at=now() WHERE id=$1::uuid',[room.id]);
        const refreshed=(await db.query('SELECT * FROM public.like_minded_rooms WHERE id=$1::uuid',[room.id])).rows[0];
        return json({ok:true,room:await roomState(db,refreshed,auth.user.id),access});
      }

      const nextMatch=url.pathname.match(/^\/api\/like-minded\/rooms\/([A-Z0-9]+)\/next$/i);
      if(nextMatch&&request.method==='POST'){
        await memberAccess(db,auth.user.id);
        const room=await getRoomByCode(db,nextMatch[1]);
        if(!room)return fail('Game room not found.',404,'not_found');
        if(room.status!=='active')return fail('This game is not active.',409,'room_not_active');
        if(auth.user.id!==room.host_user_id&&auth.user.id!==room.guest_user_id)return fail('You are not a player in this room.',403,'forbidden');
        const locked=await db.query('SELECT count(*)::int AS count FROM public.like_minded_answers WHERE room_id=$1::uuid AND set_number=$2 AND question_no=$3',[room.id,room.set_number,room.current_question_no]);
        if((locked.rows[0]?.count||0)<2)return fail('Both players must lock their answers before moving on.',409,'answers_pending');
        const absolute=(room.set_number-1)*21+room.current_question_no;
        if(absolute>=MAX_ROOM_QUESTIONS){
          const done=(await db.query(`UPDATE public.like_minded_rooms SET status='finished',updated_at=now() WHERE id=$1::uuid RETURNING *`,[room.id])).rows[0];
          return json({ok:true,finished:true,room:await roomState(db,done,auth.user.id)});
        }
        let nextQuestion=room.current_question_no+1,nextSet=room.set_number;
        if(nextQuestion>21){nextQuestion=1;nextSet+=1;}
        const updated=await db.query('UPDATE public.like_minded_rooms SET current_question_no=$2,set_number=$3,updated_at=now() WHERE id=$1::uuid RETURNING *',[room.id,nextQuestion,nextSet]);
        return json({ok:true,finished:false,room:await roomState(db,updated.rows[0],auth.user.id)});
      }

      return fail('Like Minded route not found.',404,'not_found');
    });
  }catch(err){
    console.error('Like Minded API error',err);
    return fail(err?.message||'Unable to process Like Minded request.',err?.status||500,err?.code||'like_minded_error',err?.extra||{});
  }
}
