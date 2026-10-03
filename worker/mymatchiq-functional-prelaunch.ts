// @ts-nocheck
import { handleMyMatchIQAiRequest } from './mymatchiq-ai';
import { handleMyMatchIQCreditsRequest } from './mymatchiq-credits';
import { handleMyMatchIQMembersRequest } from './mymatchiq-members';
import { handleMyMatchIQLegacyRequest } from './mymatchiq-legacy';
import { handleLikeMindedRequest } from './like-minded';

const HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}

export default {
  async fetch(request,env){
    const url=new URL(request.url);

    if(url.pathname==='/api/health'){
      return json({
        ok:true,
        environment:'o2ol-mymatchiq-functional-prelaunch',
        production:false,
        apiScope:['mymatchiq','like-minded'],
      });
    }

    if(url.pathname.startsWith('/api/mymatchiq/credits')){
      const response=await handleMyMatchIQCreditsRequest(request,env,url);
      if(response)return response;
    }
    if(url.pathname.startsWith('/api/mymatchiq/members')){
      const response=await handleMyMatchIQMembersRequest(request,env,url);
      if(response)return response;
    }
    if(url.pathname.startsWith('/api/mymatchiq/legacy')){
      const response=await handleMyMatchIQLegacyRequest(request,env,url);
      if(response)return response;
    }
    if(url.pathname==='/api/mymatchiq/access'||url.pathname.startsWith('/api/mymatchiq/bianca')||url.pathname.startsWith('/api/mymatchiq/assessment')){
      const response=await handleMyMatchIQAiRequest(request,env,url);
      if(response)return response;
    }
    if(url.pathname.startsWith('/api/like-minded')){
      const response=await handleLikeMindedRequest(request,env,url);
      if(response)return response;
    }

    if(url.pathname.startsWith('/api/')){
      return json({ok:false,error:{code:'prelaunch_api_blocked',message:'This functional Prelaunch only exposes MyMatchIQ and Like Minded APIs.'}},404);
    }
    return env.ASSETS.fetch(request);
  },
};
