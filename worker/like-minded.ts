// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
};

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

// Idempotent DDL bootstrap; running it on every request cost 8 statements
// per Like-Minded poll (room state polls every 1.8 s). Run once per isolate
// (same pattern as worker/feature-usage.ts); flag set only after success so
// a failure retries on the next request.
let likeMindedSchemaReady = false;

async function ensureSchema(db){
  if (likeMindedSchemaReady) return;
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
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_rooms_code ON public.like_minded_rooms(code)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_lobby ON public.like_minded_player_settings(available,in_lobby,updated_at DESC)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_like_minded_answers_room ON public.like_minded_answers(room_id,set_number,question_no)');
  likeMindedSchemaReady = true;
}

async function requirePremiumGamePass(db,userId){
  await db.query(`UPDATE public.o2ol_game_access_passes SET status='expired'
    WHERE user_id=$1::uuid AND game='like_minded' AND status='active' AND expires_at<=now()`,[userId]);
  const pass=(await db.query(
    `SELECT id,tokens_charged,started_at,expires_at FROM public.o2ol_game_access_passes
      WHERE user_id=$1::uuid AND game='like_minded' AND status='active' AND expires_at>now()
      ORDER BY expires_at DESC LIMIT 1`,
    [userId],
  )).rows[0];
  if(pass)return pass;
  const wallet=(await db.query('SELECT balance FROM public.o2ol_token_wallets WHERE user_id=$1::uuid',[userId])).rows[0];
  const price=(await db.query(
    `SELECT token_cost,label FROM public.o2ol_token_feature_prices
      WHERE feature_code='like_minded_session' AND active=true LIMIT 1`
  )).rows[0];
  throw Object.assign(new Error('Buy Tokens To Access'),{
    status:402,code:'tokens_required',
    balance:Number(wallet?.balance||0),required:Number(price?.token_cost||2),
    featureCode:'like_minded_session',featureLabel:price?.label||'Like Minded session',
  });
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
  for(const row of byCategory.rows) categoryScores[row.category]={matches:row.matches||0,total:row.total||0};

  return {
    id:room.id,code:room.code,host_user_id:room.host_user_id,guest_user_id:room.guest_user_id,
    invited_user_id:room.invited_user_id,category:room.category,depth:room.depth,status:room.status,
    set_number:room.set_number,current_question_no:room.current_question_no,
    my_locked:Boolean(mine),other_locked:Boolean(other),both_locked:bothLocked,
    my_answer_id:mine?.answer_id??null,
    other_answer_id:bothLocked?(other?.answer_id??null):null,
    current_match:bothLocked?mine.answer_id===other.answer_id:null,
    question_id:mine?.question_id||other?.question_id||null,
    matches:score.rows[0]?.matches||0,total_answered:score.rows[0]?.total_answered||0,
    category_scores:categoryScores,
    created_at:room.created_at,updated_at:room.updated_at,
  };
}

async function getRoomByCode(db,rawCode){
  const value=clean(rawCode,12).toUpperCase();
  if(!value) return null;
  const result=await db.query('SELECT * FROM public.like_minded_rooms WHERE code=$1 LIMIT 1',[value]);
  return result.rows[0]||null;
}

export async function handleLikeMindedRequest(request,env,url){
  if(!url.pathname.startsWith('/api/like-minded')) return null;
  const auth=await session(request,env);
  if(!auth) return fail('Sign in with a verified One2OneLove account to use multiplayer.',401,'unauthorized');

  try{
    return await withDb(env,async(db)=>{
      await ensureSchema(db);
      const body=['POST','PATCH','PUT'].includes(request.method)?await readJson(request):{};

      // Blocking/reporting stays available for safety even if a paid game pass has expired.
      const safetyRoute=url.pathname==='/api/like-minded/blocks'||url.pathname==='/api/like-minded/reports';
      if(!safetyRoute)await requirePremiumGamePass(db,auth.user.id);

      if(url.pathname==='/api/like-minded/settings'){
        const current=await db.query('SELECT * FROM public.like_minded_player_settings WHERE user_id=$1::uuid',[auth.user.id]);
        const row=current.rows[0]||null;
        if(request.method==='GET'){
          return json({ok:true,settings:row||{user_id:auth.user.id,available:false,in_lobby:false,city:null,state_region:null,country:null,language:'en'}});
        }
        if(request.method==='POST'||request.method==='PATCH'){
          if(row?.in_lobby===true&&body.available===false) return fail('Availability stays ON while you are inside the Player Lobby.',409,'lobby_availability_locked');
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
        if(request.method==='POST'){
          const existing=await db.query('SELECT * FROM public.like_minded_player_settings WHERE user_id=$1::uuid',[auth.user.id]);
          const previous=existing.rows[0]||{};
          const inLobby=body.inLobby===undefined?Boolean(previous.in_lobby):Boolean(body.inLobby);
          const available=inLobby?true:(body.available===undefined?Boolean(previous.available):Boolean(body.available));
          const city=body.city===undefined?previous.city:clean(body.city,120);
          const stateRegion=body.stateRegion===undefined?previous.state_region:clean(body.stateRegion,120);
          const country=body.country===undefined?previous.country:clean(body.country,120);
          const language=['en','es','fr','it','de'].includes(body.language)?body.language:(previous.language||'en');
          if(inLobby&&(!city||!country)) return fail('City and country are required to enter the Player Lobby.');
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
              WHERE s.available=true
                AND s.user_id<>$1::uuid
                AND s.updated_at>now()-interval '10 minutes'
                AND NOT EXISTS(
                  SELECT 1 FROM public.like_minded_blocks b
                   WHERE (b.blocker_user_id=$1::uuid AND b.blocked_user_id=s.user_id)
                      OR (b.blocker_user_id=s.user_id AND b.blocked_user_id=$1::uuid)
                )
              ORDER BY s.in_lobby DESC,s.updated_at DESC
              LIMIT 100`,
            [auth.user.id]
          );
          const invites=await db.query(
            `SELECT r.code,r.category,r.depth,COALESCE(NULLIF(split_part(u.name,' ',1),''),'Player') AS host_first_name,r.created_at
               FROM public.like_minded_rooms r
               JOIN public.users u ON u.id=r.host_user_id
              WHERE r.invited_user_id=$1::uuid
                AND r.guest_user_id IS NULL
                AND r.status='waiting'
                AND r.created_at>now()-interval '30 minutes'
                AND NOT EXISTS(
                  SELECT 1 FROM public.like_minded_blocks b
                   WHERE (b.blocker_user_id=$1::uuid AND b.blocked_user_id=r.host_user_id)
                      OR (b.blocker_user_id=r.host_user_id AND b.blocked_user_id=$1::uuid)
                )
              ORDER BY r.created_at DESC LIMIT 20`,
            [auth.user.id]
          );
          return json({ok:true,players:result.rows,invites:invites.rows});
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }

      if(url.pathname==='/api/like-minded/blocks'&&request.method==='POST'){
        const blocked=clean(body.userId,80);
        if(!/^[0-9a-f-]{36}$/i.test(blocked)||blocked===auth.user.id) return fail('Invalid player.');
        await db.query('INSERT INTO public.like_minded_blocks(blocker_user_id,blocked_user_id) VALUES($1::uuid,$2::uuid) ON CONFLICT DO NOTHING',[auth.user.id,blocked]);
        return json({ok:true});
      }

      if(url.pathname==='/api/like-minded/reports'&&request.method==='POST'){
        const reported=clean(body.userId,80);
        if(!/^[0-9a-f-]{36}$/i.test(reported)||reported===auth.user.id) return fail('Invalid player.');
        const roomId=/^[0-9a-f-]{36}$/i.test(clean(body.roomId,80))?clean(body.roomId,80):null;
        await db.query(
          'INSERT INTO public.like_minded_reports(id,reporting_user_id,reported_user_id,room_id,context) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5)',
          [crypto.randomUUID(),auth.user.id,reported,roomId,clean(body.context,1000)||null]
        );
        return json({ok:true});
      }

      if(url.pathname==='/api/like-minded/rooms'&&request.method==='POST'){
        const allowedCategories=new Set(['Relationship Goals','Communication','Values','Family','Lifestyle','Money & Ambition','Boundaries','Future Priorities','Fun Scenarios','Humor','Activities','Food & Travel','Entertainment','Daily Preferences','Wild Card']);
        const category=allowedCategories.has(body.category)?body.category:'Relationship Goals';
        const depth=new Set(['Easy','Real','Deep']).has(body.depth)?body.depth:'Real';
        const language=['en','es','fr','it','de'].includes(body.language)?body.language:'en';
        const invited=/^[0-9a-f-]{36}$/i.test(clean(body.invitedUserId,80))?clean(body.invitedUserId,80):null;
        if(invited===auth.user.id) return fail('You cannot invite yourself.');

        let roomCode='';
        for(let i=0;i<8;i++){
          const candidate=code();
          const exists=await db.query('SELECT 1 FROM public.like_minded_rooms WHERE code=$1',[candidate]);
          if(!exists.rowCount){roomCode=candidate;break;}
        }
        if(!roomCode) return fail('Unable to create a unique room code.',500,'room_code_error');

        const id=crypto.randomUUID();
        const result=await db.query(
          `INSERT INTO public.like_minded_rooms(id,code,host_user_id,invited_user_id,category,depth,host_language)
           VALUES($1::uuid,$2,$3::uuid,$4::uuid,$5,$6,$7) RETURNING *`,
          [id,roomCode,auth.user.id,invited,category,depth,language]
        );
        const state=await roomState(db,result.rows[0],auth.user.id);
        return json({ok:true,room:state},201);
      }

      if(url.pathname==='/api/like-minded/rooms/join'&&request.method==='POST'){
        const room=await getRoomByCode(db,body.code);
        if(!room) return fail('Game room not found.',404,'not_found');
        if(room.host_user_id===auth.user.id){
          const state=await roomState(db,room,auth.user.id);
          return json({ok:true,room:state});
        }
        if(room.invited_user_id&&room.invited_user_id!==auth.user.id) return fail('This invitation is for another player.',403,'invite_mismatch');
        if(room.guest_user_id&&room.guest_user_id!==auth.user.id) return fail('This game room already has two players.',409,'room_full');

        const language=['en','es','fr','it','de'].includes(body.language)?body.language:'en';
        const updated=await db.query(
          `UPDATE public.like_minded_rooms
              SET guest_user_id=$2::uuid,guest_language=$3,status='active',updated_at=now()
            WHERE id=$1::uuid RETURNING *`,
          [room.id,auth.user.id,language]
        );
        const state=await roomState(db,updated.rows[0],auth.user.id);
        return json({ok:true,room:state});
      }

      const roomMatch=url.pathname.match(/^\/api\/like-minded\/rooms\/([A-Z0-9]+)$/i);
      if(roomMatch&&request.method==='GET'){
        const room=await getRoomByCode(db,roomMatch[1]);
        if(!room) return fail('Game room not found.',404,'not_found');
        const state=await roomState(db,room,auth.user.id);
        if(!state) return fail('You are not a player in this room.',403,'forbidden');
        return json({ok:true,room:state});
      }

      const answerMatch=url.pathname.match(/^\/api\/like-minded\/rooms\/([A-Z0-9]+)\/answer$/i);
      if(answerMatch&&request.method==='POST'){
        const room=await getRoomByCode(db,answerMatch[1]);
        if(!room) return fail('Game room not found.',404,'not_found');
        if(auth.user.id!==room.host_user_id&&auth.user.id!==room.guest_user_id) return fail('You are not a player in this room.',403,'forbidden');
        if(!room.guest_user_id) return fail('Waiting for Player 2.',409,'waiting_for_player');
        const answerId=Number(body.answerId);
        if(!Number.isInteger(answerId)||answerId<0||answerId>3) return fail('Choose a valid answer.');
        const questionId=clean(body.questionId,180);
        if(!questionId) return fail('Question ID is required.');

        await db.query(
          `INSERT INTO public.like_minded_answers(room_id,set_number,question_no,question_id,user_id,answer_id)
           VALUES($1::uuid,$2,$3,$4,$5::uuid,$6)
           ON CONFLICT(room_id,set_number,question_no,user_id) DO NOTHING`,
          [room.id,room.set_number,room.current_question_no,questionId,auth.user.id,answerId]
        );

        const refreshed=(await db.query('SELECT * FROM public.like_minded_rooms WHERE id=$1::uuid',[room.id])).rows[0];
        const state=await roomState(db,refreshed,auth.user.id);
        return json({ok:true,room:state});
      }

      const nextMatch=url.pathname.match(/^\/api\/like-minded\/rooms\/([A-Z0-9]+)\/next$/i);
      if(nextMatch&&request.method==='POST'){
        const room=await getRoomByCode(db,nextMatch[1]);
        if(!room) return fail('Game room not found.',404,'not_found');
        if(auth.user.id!==room.host_user_id&&auth.user.id!==room.guest_user_id) return fail('You are not a player in this room.',403,'forbidden');

        const locked=await db.query(
          'SELECT count(*)::int AS count FROM public.like_minded_answers WHERE room_id=$1::uuid AND set_number=$2 AND question_no=$3',
          [room.id,room.set_number,room.current_question_no]
        );
        if((locked.rows[0]?.count||0)<2) return fail('Both players must lock their answers before moving on.',409,'answers_pending');

        let nextQuestion=room.current_question_no+1;
        let nextSet=room.set_number;
        if(nextQuestion>21){nextQuestion=1;nextSet+=1;}
        const updated=await db.query(
          'UPDATE public.like_minded_rooms SET current_question_no=$2,set_number=$3,updated_at=now() WHERE id=$1::uuid RETURNING *',
          [room.id,nextQuestion,nextSet]
        );
        const state=await roomState(db,updated.rows[0],auth.user.id);
        return json({ok:true,room:state});
      }

      return fail('Like Minded route not found.',404,'not_found');
    });
  }catch(err){
    console.error('Like Minded API error',err);
    return fail(err?.message||'Unable to process Like Minded request.',500,'like_minded_error');
  }
}
