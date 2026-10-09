// @ts-nocheck
import { Client } from 'pg';

const EPISODE={
  id:'season-1-episode-1',
  season:1,
  episode:1,
  title:'Who Should Apologize First?',
  key:'studio/season-1/episode-1-who-should-apologize-first.mp4',
  path:'/studio-media/season-1-episode-1.mp4',
  // First public/live O2OL Open House release. Anonymous replay opens 7 days later.
  releasedAt:'2026-10-03T00:00:00.000Z',
};
const PUBLIC_DELAY_MS=7*24*60*60*1000;

function error(message,status=404,extraHeaders={}){
  return new Response(message,{status,headers:{
    'content-type':'text/plain; charset=utf-8',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff',
    ...extraHeaders,
  }});
}
function publicAvailableAt(){
  return new Date(new Date(EPISODE.releasedAt).getTime()+PUBLIC_DELAY_MS);
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
async function accessState(request,env){
  const member=await verifiedFreeMember(request,env).catch(()=>false);
  const availableAt=publicAvailableAt();
  const publicAvailable=Date.now()>=availableAt.getTime();
  return {
    member,
    publicAvailable,
    canWatch:member||publicAvailable,
    publicAvailableAt:availableAt.toISOString(),
    releasedAt:EPISODE.releasedAt,
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
  if(url.pathname==='/api/studio/episodes'){
    if(request.method!=='GET')return json({ok:false,error:{code:'method_not_allowed',message:'Method not allowed.'}},405);
    const access=await accessState(request,env);
    const mediaReady=Boolean(env.MEDIA&&await env.MEDIA.head(EPISODE.key).catch(()=>null));
    return json({
      ok:true,
      episodes:[{
        id:EPISODE.id,season:EPISODE.season,episode:EPISODE.episode,title:EPISODE.title,
        releasedAt:access.releasedAt,publicAvailableAt:access.publicAvailableAt,
        publicAvailable:access.publicAvailable,memberAvailable:access.member,
        canWatch:access.canWatch&&mediaReady,mediaReady,
        mediaPath:access.canWatch&&mediaReady?EPISODE.path:null,
      }],
    });
  }

  if(url.pathname!==EPISODE.path)return null;
  if(!['GET','HEAD'].includes(request.method))return error('Method not allowed.',405);

  const access=await accessState(request,env);
  if(!access.canWatch){
    return error(
      'Create a free verified One2OneLove account to watch this episode now. The public replay opens seven days after release.',
      403,
      {'x-o2ol-public-available-at':access.publicAvailableAt},
    );
  }
  if(!env.MEDIA)return error('Studio media storage is not configured.',503);

  const head=await env.MEDIA.head(EPISODE.key);
  if(!head)return error('Episode media is not available yet.',404);

  const range=parseRange(request.headers.get('range'),head.size);
  if(range?.invalid){
    return new Response(null,{status:416,headers:{'content-range':`bytes */${head.size}`,'accept-ranges':'bytes'}});
  }

  const headers=new Headers();
  head.writeHttpMetadata(headers);
  headers.set('content-type',head.httpMetadata?.contentType||'video/mp4');
  headers.set('accept-ranges','bytes');
  headers.set('cache-control',access.member?'private, max-age=300':'public, max-age=3600');
  headers.set('etag',head.httpEtag);
  headers.set('x-content-type-options','nosniff');
  headers.set('x-o2ol-access',access.member?'free-member':'public-replay');

  if(request.method==='HEAD'){
    headers.set('content-length',String(head.size));
    return new Response(null,{status:200,headers});
  }
  if(range){
    const object=await env.MEDIA.get(EPISODE.key,{range:{offset:range.offset,length:range.length}});
    if(!object)return error('Episode media is not available yet.',404);
    headers.set('content-length',String(range.length));
    headers.set('content-range',`bytes ${range.start}-${range.end}/${head.size}`);
    return new Response(object.body,{status:206,headers});
  }
  const object=await env.MEDIA.get(EPISODE.key);
  if(!object)return error('Episode media is not available yet.',404);
  headers.set('content-length',String(head.size));
  return new Response(object.body,{status:200,headers});
}
