// @ts-nocheck

const EPISODE_KEY='studio/season-1/episode-1-who-should-apologize-first.mp4';
const EPISODE_PATH='/studio-media/season-1-episode-1.mp4';

function error(message,status=404){
  return new Response(message,{status,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
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
  if(url.pathname!==EPISODE_PATH)return null;
  if(!['GET','HEAD'].includes(request.method))return error('Method not allowed.',405);
  if(!env.MEDIA)return error('Studio media storage is not configured.',503);

  const head=await env.MEDIA.head(EPISODE_KEY);
  if(!head)return error('Episode media is not available yet.',404);

  const range=parseRange(request.headers.get('range'),head.size);
  if(range?.invalid){
    return new Response(null,{status:416,headers:{'content-range':`bytes */${head.size}`,'accept-ranges':'bytes'}});
  }

  const headers=new Headers();
  head.writeHttpMetadata(headers);
  headers.set('content-type',head.httpMetadata?.contentType||'video/mp4');
  headers.set('accept-ranges','bytes');
  headers.set('cache-control','public, max-age=3600');
  headers.set('etag',head.httpEtag);
  headers.set('x-content-type-options','nosniff');

  if(request.method==='HEAD'){
    headers.set('content-length',String(head.size));
    return new Response(null,{status:200,headers});
  }

  if(range){
    const object=await env.MEDIA.get(EPISODE_KEY,{range:{offset:range.offset,length:range.length}});
    if(!object)return error('Episode media is not available yet.',404);
    headers.set('content-length',String(range.length));
    headers.set('content-range',`bytes ${range.start}-${range.end}/${head.size}`);
    return new Response(object.body,{status:206,headers});
  }

  const object=await env.MEDIA.get(EPISODE_KEY);
  if(!object)return error('Episode media is not available yet.',404);
  headers.set('content-length',String(head.size));
  return new Response(object.body,{status:200,headers});
}
