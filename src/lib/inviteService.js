import { apiRequest } from './apiClient';
const KEY='o2ol_invite_attr',TTL=30*86400*1000;
export const INVITE_GAMES=[
 {key:'pests',label:"PEST'S",route:'/Pests',image:'/game-cards/card-pests.jpg'},
 {key:'pool_ping_pong',label:'Pool Ping Pong',route:'/PoolPingPong',image:'/game-cards/card-pool-ping-pong.jpg'},
 {key:'scrabluko',label:'Scrabluko',route:'/Scrabluko',image:'/game-cards/card-scrabluko.jpg'},
 {key:'i_thought_so',label:'I Thought So!',route:'/IThoughtSo',image:'/game-cards/card-i-thought-so.jpg'},
 {key:'what_should_they_do',label:'What Should They Do?',route:'/WhatShouldTheyDo',image:'/game-cards/card-what-should.jpg'},
 {key:'scratch',label:'Love Scratch',route:'/ScratchGame',image:'/game-cards/card-love-scratch.jpg'},
 {key:'like_minded',label:'Like Minded?',route:'/LikeMinded',image:'/game-cards/card-like-minded.jpg'},
];
export const inviteGame=game=>INVITE_GAMES.find(g=>g.key===game)||null;
export const validInviteCode=code=>/^[A-HJ-NP-Z2-9]{6,8}$/.test(String(code||'').toUpperCase());
const languageShare={
 en:g=>`Play ${g} with me on One2OneLove! Games are free:`,
 es:g=>`¡Juega ${g} conmigo en One2OneLove! Los juegos son gratis:`,
 fr:g=>`Joue à ${g} avec moi sur One2OneLove ! Les jeux sont gratuits :`,
 it:g=>`Gioca a ${g} con me su One2OneLove! I giochi sono gratuiti:`,
 de:g=>`Spiel ${g} mit mir auf One2OneLove! Alle Spiele sind kostenlos:`,
};
export const buildInviteLink=({code,game,source,origin}={})=>{
 const root=(origin|| (typeof window!=='undefined'?window.location.origin:'https://one2onelove.com')).replace(/\/$/,'');
 const personal=validInviteCode(code);
 const u=new URL('/i/'+(personal?String(code).toUpperCase():'play'),root);
 if(inviteGame(game))u.searchParams.set('g',game);
 if(!personal)u.searchParams.set('src',source||'member_signed_out');
 return u.toString();
};
export const buildShareText=({language='en',game,link})=>{
 const g=inviteGame(game);return `${(languageShare[language]||languageShare.en)(g?.label||'One2OneLove games')} ${link}`;
};
export const getMyInvite=()=>apiRequest('/api/invites/me');
export const resolveInvite=code=>apiRequest('/api/invites/resolve/'+encodeURIComponent(code||'play'));
export const logInviteEvent=payload=>apiRequest('/api/invites/events',{method:'POST',body:{...payload,visitorId:getVisitorId()}});
function getVisitorId(){try{return localStorage.getItem('o2ol.analytics.visitor')||null}catch{return null}}
function fromCookie(){
 try{let c=document.cookie.split('; ').find(x=>x.startsWith(KEY+'='));if(!c)return null;return JSON.parse(decodeURIComponent(c.slice(KEY.length+1)))}catch{return null}
}
function validAttr(value){
 if(!value||typeof value!=='object')return null;
 const landed=Date.parse(value.landedAt||'');
 if(!Number.isFinite(landed)||Date.now()-landed>TTL||Date.now()<landed)return null;
 const code=String(value.code||'').toUpperCase();
 if(code&&!validInviteCode(code))return null;
 const source=['games_site','like_minded_room','member_signed_out','invite_link'].includes(value.source)?value.source:'invite_link';
 if(!code&&source==='invite_link')return null;
 return{code:code||null,game:inviteGame(value.game)?.key||null,source,landedAt:new Date(landed).toISOString()};
}
export function readAttribution(){
 let raw;try{raw=JSON.parse(localStorage.getItem(KEY)||'null')}catch{raw=null}
 return validAttr(raw)||validAttr(typeof document!=='undefined'?fromCookie():null);
}
export function saveAttribution(value){
 const next=validAttr({...value,landedAt:value?.landedAt||new Date().toISOString()});if(!next)return null;
 const existing=readAttribution();
 // First touch wins, except a personal code supersedes an un-attributed game-site link.
 if(existing&& (existing.code||!next.code))return existing;
 try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}
 if(typeof document!=='undefined'){
  document.cookie=KEY+'='+encodeURIComponent(JSON.stringify(next))+'; Max-Age=2592000; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
 }
 return next;
}
export function clearAttribution(){
 try{localStorage.removeItem(KEY)}catch{}
 if(typeof document!=='undefined')document.cookie=KEY+'=; Max-Age=0; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
}
export async function shareVia(channel,{link,text,subject='One2OneLove'}){
 const enc=encodeURIComponent;
 if(channel==='copy'){
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(link);return true}
  const el=document.createElement('textarea');el.value=link;document.body.appendChild(el);el.select();let ok=document.execCommand('copy');el.remove();if(!ok)throw Error('copy_failed');return true;
 }
 if(channel==='native_share'){
  if(!navigator.share)throw Error('native_share_unavailable');await navigator.share({title:subject,text,url:link});return true;
 }
 if(channel==='sms'){window.location.href='sms:?body='+enc(text);return true}
 if(channel==='email'){window.location.href='mailto:?subject='+enc(subject)+'&body='+enc(text);return true}
 if(channel==='whatsapp')window.open('https://wa.me/?text='+enc(text),'_blank','noopener,noreferrer');
 if(channel==='facebook')window.open('https://www.facebook.com/sharer/sharer.php?u='+enc(link),'_blank','noopener,noreferrer');
 if(channel==='x')window.open('https://twitter.com/intent/tweet?text='+enc(text),'_blank','noopener,noreferrer');
 if(channel==='linkedin')window.open('https://www.linkedin.com/sharing/share-offsite/?url='+enc(link),'_blank','noopener,noreferrer');
 return true;
}
