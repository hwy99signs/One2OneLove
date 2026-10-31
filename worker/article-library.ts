// The public SPA contains article metadata only. Full article paragraphs and
// takeaways are returned by this verified-member endpoint, never in a public
// catalog response or client bundle. No prices, credits or promotions change.
import { relationshipArticleLibrary } from '../src/data/relationshipArticleLibrary';
import { relationshipArticleBodies } from '../src/data/relationshipArticleBodies';
import { verifiedFreeMember } from './studio-media';

function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{
  'content-type':'application/json; charset=utf-8',
  'cache-control':'private, no-store',
  'x-content-type-options':'nosniff',
}})}

export async function handleRelationshipArticleRequest(request,env,url){
  if(url.pathname!=='/api/articles/detail')return null;
  if(request.method!=='GET')return reply({ok:false,error:'method_not_allowed'},405);
  // Fail closed: both verified email session and member phone verification.
  let member=false;
  try{member=await verifiedFreeMember(request,env)}catch(_){member=false}
  if(!member)return reply({ok:false,error:'verified_signup_required'},401);
  const lang=['en','es','fr','it','de'].includes(url.searchParams.get('lang'))?url.searchParams.get('lang'):'en';
  const id=String(url.searchParams.get('id')||'').slice(0,120);
  const article=(relationshipArticleLibrary[lang]||[]).find(a=>a.id===id);
  const body=relationshipArticleBodies[lang]?.[id];
  if(!article||!Array.isArray(body))return reply({ok:false,error:'article_not_found'},404);
  return reply({ok:true,article:{id,body,takeaways:article.takeaways||[]}});
}
