// @ts-nocheck
import { Client } from 'pg';
import { getDateIdeasForLanguage } from '../src/components/dateideas/dateIdeasLibrary';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
async function identity(request,env){
  const cookie=request.headers.get('cookie');
  if(!cookie)return null;
  const r=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
  if(!r.ok)return null;
  const p=await r.json().catch(()=>null);
  return p?.user?.id&&p?.user?.emailVerified===true&&(p?.session??p?.data?.session)?p.user:null;
}
export async function handleDateIdeaLibraryRequest(request,env,url){
  if(!url.pathname.startsWith('/api/date-idea-library'))return null;
  if(request.method!=='GET')return json({ok:false},405);
  const lang=['en','es','fr','it','de'].includes(url.searchParams.get('lang'))?url.searchParams.get('lang'):'en';
  const ideas=getDateIdeasForLanguage(lang);
  if(url.pathname==='/api/date-idea-library'){
    return json({ok:true,ideas:ideas.map(({id,title,week,iconKey,categories,locations,occasions,stages,budget,difficulty,duration,duration_hours,category,location_type,occasion,relationship_stage})=>({id,title,week,iconKey,categories,locations,occasions,stages,budget,difficulty,duration,duration_hours,category,location_type,occasion,relationship_stage}))});
  }
  if(url.pathname!=='/api/date-idea-library/item')return json({ok:false},404);
  const id=String(url.searchParams.get('id')||'').slice(0,100);
  const idea=ideas.find(x=>String(x.id)===id);
  if(!idea)return json({ok:false,error:{code:'not_found'}},404);
  const user=await identity(request,env);
  if(!user)return json({ok:false,error:{code:'unauthorized',message:'Sign in to unlock this Date Idea.'}},401);
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();
  try{
    const m=(await db.query('SELECT COALESCE(p.is_active,true) AS active,COALESCE(u.banned,false) AS banned,u.role FROM neon_auth."user" u LEFT JOIN public.users p ON p.id=u.id WHERE u.id=$1::uuid',[user.id])).rows[0];
    if(!m||!m.active||m.banned)return json({ok:false,error:{code:'forbidden'}},403);
    const owned=(await db.query(`SELECT EXISTS(SELECT 1 FROM public.o2ol_token_content_unlocks WHERE user_id=$1::uuid AND feature_code='date_idea_unlock' AND content_key=$2) AS owned`,[user.id,id])).rows[0]?.owned===true;
    if(!owned && m.role!=='admin')return json({ok:false,error:{code:'content_unlock_required',message:'Unlock this Date Idea for $0.49 Credit.'}},402);
    return json({ok:true,idea});
  }finally{await db.end();}
}
