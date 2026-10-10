// @ts-nocheck
import { Client } from 'pg';

const EPISODES=[
  {
    id:'season-1-episode-2',
    season:1,
    episode:2,
    title:'Who Pays for the First Date?',
    key:'studio/season-1/episode-2-who-pays-for-the-first-date.mp4',
    path:'/studio-media/season-1-episode-2.mp4',
    chatRoom:'studio-who-pays-for-the-first-date',
    posterPath:null,
    releasedAt:'2026-10-09T22:00:00.000Z',
    unlockFeatureCode:'studio_episode_unlock',
    unlockPriceCents:100,
  },
  {
    id:'season-1-episode-1',
    season:1,
    episode:1,
    title:'Who Should Apologize First?',
    key:'studio/season-1/episode-1-who-should-apologize-first.mp4',
    path:'/studio-media/season-1-episode-1.mp4',
    chatRoom:'studio-who-should-apologize-first',
    posterPath:'/assets/o2ol-studio-bianca-card.webp',
    releasedAt:'2026-10-03T00:00:00.000Z',
  },
];
const PUBLIC_DELAY_MS=7*24*60*60*1000;

function error(message,status=404,extraHeaders={}){
  return new Response(message,{status,headers:{
    'content-type':'text/plain; charset=utf-8',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff',
    ...extraHeaders,
  }});
}
function publicAvailableAt(episode){
  return new Date(new Date(episode.releasedAt).getTime()+PUBLIC_DELAY_MS);
}
function mediaBucket(env){
  // Functional Prelaunch may bind the shared published Studio library as
  // STUDIO_MEDIA while keeping all other preview media isolated in MEDIA.
  return env.STUDIO_MEDIA||env.MEDIA||null;
}
async function sessionUser(request,env){
  const cookie=request.headers.get('cookie');
  if(!cookie||!env.NEON_AUTH_BASE_URL)return null;
  const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{
    headers:{cookie,accept:'application/json'},
  }).catch(()=>null);
  if(!response?.ok)return null;
  const payload=await response.json().catch(()=>null);
  const user=payload?.user??payload?.data?.user??null;
  const session=payload?.session??payload?.data?.session??null;
  return user?.id&&user?.emailVerified===true&&session?user:null;
}
async function verifiedFreeMember(request,env){
  const user=await sessionUser(request,env);
  if(!user?.id)return false;
  if(!env.HYPERDRIVE?.connectionString)return false;
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();
  try{
    const row=(await db.query(
      `SELECT COALESCE(phone_number_verified,false) AS phone_verified,
              COALESCE(is_active,true) AS is_active
         FROM public.users WHERE id=$1::uuid LIMIT 1`,
      [user.id],
    )).rows[0];
    return Boolean(row?.is_active!==false&&row?.phone_verified===true);
  }finally{await db.end();}
}
async function unlockState(request,env,episode){
  // Paywalled episodes only: has this signed-in user unlocked the episode
  // with Credit, and is the account an admin (owner bypass)?
  const result={unlocked:false,isAdmin:false};
  if(!episode.unlockFeatureCode)return result;
  const user=await sessionUser(request,env).catch(()=>null);
  if(!user?.id||!env.HYPERDRIVE?.connectionString)return result;
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();
  try{
    try{
      const row=(await db.query(
        `SELECT EXISTS(SELECT 1 FROM public.o2ol_token_content_unlocks
                        WHERE user_id=$1::uuid AND feature_code=$2 AND content_key=$3) AS unlocked`,
        [user.id,episode.unlockFeatureCode,episode.id],
      )).rows[0];
      result.unlocked=Boolean(row?.unlocked);
    }catch(_){/* unlocks table may not exist yet */}
    try{
      const roleRow=(await db.query(
        `SELECT role FROM neon_auth."user" WHERE id=$1::uuid LIMIT 1`,
        [user.id],
      )).rows[0];
      result.isAdmin=roleRow?.role==='admin';
    }catch(_){}
    return result;
  }finally{await db.end();}
}
async function accessState(request,env,episode){
  const member=await verifiedFreeMember(request,env).catch(()=>false);
  const availableAt=publicAvailableAt(episode);
  const paywalled=Boolean(episode.unlockPriceCents);
  // Paywalled episodes never open to the public for free — the Credit
  // unlock is the only door (owner call, 2026-10-09).
  const publicAvailable=!paywalled&&Date.now()>=availableAt.getTime();
  const {unlocked,isAdmin}=await unlockState(request,env,episode).catch(()=>({unlocked:false,isAdmin:false}));
  const canWatch=paywalled?(unlocked||isAdmin):(member||publicAvailable);
  return {
    member,
    publicAvailable,
    canWatch,
    unlocked,
    isAdmin,
    unlockPriceCents:episode.unlockPriceCents||null,
    publicAvailableAt:availableAt.toISOString(),
    releasedAt:episode.releasedAt,
  };
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff',
  }});
}
function parseRange(value,size){
  if(!value||!/^bytes=/.test(value))return null;
  const first=value.replace(/^bytes=/,'').split(',')[0]?.trim();
  if(!first)return null;
  const [startRaw,endRaw]=first.split('-');
  if(startRaw===''){
    const suffix=Number(endRaw);
    if(!Number.isFinite(suffix)||suffix<=0)return null;
    const length=Math.min(size,Math.floor(suffix));
    return {offset:size-length,length,start:size-length,end:size-1};
  }
  const start=Number(startRaw);
  if(!Number.isFinite(start)||start<0||start>=size)return {invalid:true};
  const requestedEnd=endRaw===''?size-1:Number(endRaw);
  if(!Number.isFinite(requestedEnd)||requestedEnd<start)return {invalid:true};
  const end=Math.min(size-1,Math.floor(requestedEnd));
  return {offset:start,length:end-start+1,start,end};
}

export async function handleStudioMediaRequest(request,env,url){
  const bucket=mediaBucket(env);

  if(url.pathname==='/api/studio/episodes'){
    if(request.method!=='GET')return json({ok:false,error:{code:'method_not_allowed',message:'Method not allowed.'}},405);
    const episodes=await Promise.all(EPISODES.map(async episode=>{
      const access=await accessState(request,env,episode);
      const mediaReady=Boolean(bucket&&await bucket.head(episode.key).catch(()=>null));
      return {
        id:episode.id,season:episode.season,episode:episode.episode,title:episode.title,
        releasedAt:episode.releasedAt,publicAvailableAt:access.publicAvailableAt,
        publicAvailable:access.publicAvailable,memberAvailable:access.member,
        unlockPriceCents:access.unlockPriceCents,unlocked:access.unlocked,
        canWatch:access.canWatch&&mediaReady,mediaReady,
        mediaPath:access.canWatch&&mediaReady?episode.path:null,
        chatRoom:episode.chatRoom,
        posterPath:episode.posterPath,
      };
    }));
    return json({ok:true,episodes});
  }

  const episode=EPISODES.find(item=>item.path===url.pathname);
  if(!episode)return null;
  if(!['GET','HEAD'].includes(request.method))return error('Method not allowed.',405);

  const access=await accessState(request,env,episode);
  if(!access.canWatch){
    return error(
      episode.unlockPriceCents
        ? 'This episode is a $1 Credit unlock. Sign in and unlock it in O2OL Studio to watch — Episode 1 is always free.'
        : 'Create a free verified One2OneLove account to watch this episode now. The public replay opens seven days after release.',
      403,
      {'x-o2ol-public-available-at':access.publicAvailableAt},
    );
  }
  if(!bucket)return error('Studio media storage is not configured.',503);

  const head=await bucket.head(episode.key);
  if(!head)return error('Episode media is not available yet.',404);

  const range=parseRange(request.headers.get('range'),head.size);
  if(range?.invalid){
    return new Response(null,{status:416,headers:{'content-range':`bytes */${head.size}`,'accept-ranges':'bytes'}});
  }

  const headers=new Headers();
  head.writeHttpMetadata(headers);
  headers.set('content-type',head.httpMetadata?.contentType||'video/mp4');
  headers.set('accept-ranges','bytes');
  headers.set('cache-control',access.member||access.unlocked||access.isAdmin?'private, max-age=300':'public, max-age=3600');
  headers.set('etag',head.httpEtag);
  headers.set('x-content-type-options','nosniff');
  headers.set('x-o2ol-access',access.isAdmin?'admin':access.unlocked?'credit-unlock':access.member?'free-member':'public-replay');

  if(request.method==='HEAD'){
    headers.set('content-length',String(head.size));
    return new Response(null,{status:200,headers});
  }
  if(range){
    const object=await bucket.get(episode.key,{range:{offset:range.offset,length:range.length}});
    if(!object)return error('Episode media is not available yet.',404);
    headers.set('content-length',String(range.length));
    headers.set('content-range',`bytes ${range.start}-${range.end}/${head.size}`);
    return new Response(object.body,{status:206,headers});
  }
  const object=await bucket.get(episode.key);
  if(!object)return error('Episode media is not available yet.',404);
  headers.set('content-length',String(head.size));
  return new Response(object.body,{status:200,headers});
}
