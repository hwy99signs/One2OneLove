import {useEffect,useRef,useState} from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { getMyInvite, buildInviteLink, buildShareText, shareVia, logInviteEvent, inviteGame } from '@/lib/inviteService';
import { toast } from 'sonner';
const copy={
 en:{invite:'Invite someone to play',share:'Share game invite',link:'Your invite link',body:'Edit your invitation',member:'Sign in to receive a personal invite link',signin:'Sign In',close:'Close',sms:'Text',email:'Email',whatsapp:'WhatsApp',facebook:'Facebook',x:'X',linkedin:'LinkedIn',copy:'Copy link',more:'More',sent:'Share option opened',copied:'Link copied',error:'Sharing is unavailable right now'},
 es:{invite:'Invita a alguien a jugar',share:'Comparte una invitación',link:'Tu enlace de invitación',body:'Edita tu invitación',member:'Inicia sesión para obtener tu enlace personal',signin:'Iniciar sesión',close:'Cerrar',sms:'Mensaje',email:'Correo',whatsapp:'WhatsApp',facebook:'Facebook',x:'X',linkedin:'LinkedIn',copy:'Copiar enlace',more:'Más',sent:'Opción de compartir abierta',copied:'Enlace copiado',error:'No se puede compartir ahora'},
 fr:{invite:'Inviter quelqu’un à jouer',share:'Partager une invitation',link:'Votre lien',body:'Modifier votre invitation',member:'Connectez-vous pour obtenir votre lien personnel',signin:'Se connecter',close:'Fermer',sms:'SMS',email:'E-mail',whatsapp:'WhatsApp',facebook:'Facebook',x:'X',linkedin:'LinkedIn',copy:'Copier le lien',more:'Plus',sent:'Partage ouvert',copied:'Lien copié',error:'Partage indisponible'},
 it:{invite:'Invita qualcuno a giocare',share:'Condividi un invito',link:'Il tuo link',body:'Modifica il messaggio',member:'Accedi per ottenere il tuo link personale',signin:'Accedi',close:'Chiudi',sms:'SMS',email:'Email',whatsapp:'WhatsApp',facebook:'Facebook',x:'X',linkedin:'LinkedIn',copy:'Copia link',more:'Altro',sent:'Condivisione aperta',copied:'Link copiato',error:'Condivisione non disponibile'},
 de:{invite:'Jemanden zum Spielen einladen',share:'Spieleinladung teilen',link:'Dein Einladungslink',body:'Nachricht bearbeiten',member:'Melde dich an, um deinen persönlichen Link zu erhalten',signin:'Anmelden',close:'Schließen',sms:'SMS',email:'E-Mail',whatsapp:'WhatsApp',facebook:'Facebook',x:'X',linkedin:'LinkedIn',copy:'Link kopieren',more:'Mehr',sent:'Teilen geöffnet',copied:'Link kopiert',error:'Teilen momentan nicht verfügbar'},
};
export default function InviteSheet({open,onClose,game=null,surface='game_button',code:codeProp=null}){
 const {currentLanguage}=useLanguage(),t=copy[currentLanguage]||copy.en;
 const {isAuthenticated}=useAuth();
 const [code,setCode]=useState(codeProp),[text,setText]=useState(''),[busy,setBusy]=useState(false);
 const openedRef=useRef(false);
 const link=buildInviteLink({code,game,source:'member_signed_out'});
 const gameInfo=inviteGame(game);
 useEffect(()=>{setCode(codeProp)},[codeProp]);
 useEffect(()=>{
  if(!open)return;
  let alive=true;
  setText(buildShareText({language:currentLanguage,game,link}));
  if(isAuthenticated&&!codeProp){
   setBusy(true);
   getMyInvite().then(data=>{if(alive)setCode(data?.code||null)}).catch(()=>{if(alive)setCode(null)}).finally(()=>{if(alive)setBusy(false)});
  }
  return()=>{alive=false};
 // eslint-disable-next-line react-hooks/exhaustive-deps -- link changes are handled by the next effect
 },[open,game,isAuthenticated,codeProp,currentLanguage]);
 useEffect(()=>{if(open)setText(buildShareText({language:currentLanguage,game,link}))},[link,open,game,currentLanguage]);
 useEffect(()=>{
  if(!open){openedRef.current=false;return;}
  // One open event per opening; wait for member code before attributing.
  if(isAuthenticated&&!code)return;
  if(openedRef.current)return;
  openedRef.current=true;
  logInviteEvent({code:code||undefined,game,surface,event:'share_opened'}).catch(()=>{});
 },[open,code,game,surface,isAuthenticated]);
 useEffect(()=>{
  if(!open)return;const esc=e=>{if(e.key==='Escape')onClose?.()};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)
 },[open,onClose]);
 const send=async channel=>{
  try{
   await shareVia(channel,{link,text:text.trim()||buildShareText({language:currentLanguage,game,link})});
   if(code)logInviteEvent({code,game,surface,event:'share_channel',channel}).catch(()=>{});
   toast.success(channel==='copy'?t.copied:t.sent);
  }catch(e){if(e?.name!=='AbortError')toast.error(t.error)}
 };
 if(!open)return null;
 return <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/65 sm:items-center sm:p-4" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}>
  <div role="dialog" aria-modal="true" aria-label={t.share} className="max-h-[92dvh] w-full min-w-0 max-w-lg overscroll-contain overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:rounded-3xl sm:p-6">
   <div className="sticky -top-4 z-10 -mx-1 flex items-start justify-between gap-3 rounded-xl bg-white px-1 py-2 sm:-top-6"><h2 className="min-w-0 break-words text-xl font-black leading-tight text-slate-900 sm:text-2xl">{t.share}</h2><button aria-label={t.close} data-analytics-id="invite-sheet-close" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full p-2 hover:bg-slate-100"><X/></button></div>
   {gameInfo&&<div className="mt-5 flex min-w-0 items-center gap-3 rounded-2xl bg-pink-50 p-3"><img src={gameInfo.image} alt="" className="h-20 w-24 shrink-0 rounded-xl object-cover"/><strong className="min-w-0 break-words">{gameInfo.label}</strong></div>}
   {!isAuthenticated&&<div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm"><span>{t.member}</span><Link to="/SignIn" className="font-bold text-purple-800" data-analytics-id="invite-signin">{t.signin}</Link></div>}
   <label className="mt-5 block text-sm font-bold text-slate-700">{t.body}<textarea className="mt-2 min-h-24 w-full min-w-0 rounded-xl border border-slate-200 p-3 text-sm" value={text} onChange={e=>setText(e.target.value.slice(0,500))}/></label>
   <label className="mt-4 block text-sm font-bold text-slate-700">{t.link}<input className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs" readOnly value={link}/></label>
   <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{['sms','whatsapp','email','copy','native_share','facebook','x','linkedin'].map(ch=><button data-analytics-id={'invite-channel-'+ch} key={ch} type="button" disabled={busy} onClick={()=>send(ch)} className="min-h-11 min-w-0 break-words rounded-xl border border-purple-200 bg-purple-50 px-2 py-3 text-center text-sm font-black text-purple-800 hover:bg-purple-100 disabled:opacity-50 sm:px-3">{t[ch==='native_share'?'more':ch]}</button>)}</div>
  </div>
 </div>;
}
InviteSheet.propTypes={open:PropTypes.bool.isRequired,onClose:PropTypes.func.isRequired,game:PropTypes.string,surface:PropTypes.string,code:PropTypes.string};
