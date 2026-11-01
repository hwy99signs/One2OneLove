import React,{useEffect,useState} from 'react';
import {Link,useNavigate,useParams,useSearchParams} from 'react-router-dom';
import {ArrowLeft,Gamepad2,Heart,UserPlus} from 'lucide-react';
import {useLanguage} from '@/Layout';
import {resolveInvite,inviteGame,saveAttribution,logInviteEvent,validInviteCode} from '@/lib/inviteService';
import {freePromoMessage} from '@/lib/o2olFreePromo2026';
const copy={
 en:{title:'You are invited to play!',invited:(n,g)=>`${n} invited you to play ${g} on One2OneLove.`,generic:'Discover free relationship games and more on One2OneLove.',play:g=>'Play '+g,signup:'Create Free Account',back:'Browse Games',forever:'All current and future games are FREE FOREVER.',loading:'Checking invitation…'},
 es:{title:'¡Te invitaron a jugar!',invited:(n,g)=>`¡${n} te invita a jugar ${g} en One2OneLove!`,generic:'Descubre juegos de relaciones gratis en One2OneLove.',play:g=>'Jugar '+g,signup:'Crear Cuenta Gratis',back:'Explorar Juegos',forever:'Todos los juegos son GRATIS PARA SIEMPRE.',loading:'Comprobando invitación…'},
 fr:{title:'Vous êtes invité à jouer !',invited:(n,g)=>`${n} vous invite à jouer à ${g} sur One2OneLove.`,generic:'Découvrez les jeux relationnels gratuits sur One2OneLove.',play:g=>'Jouer à '+g,signup:'Créer un Compte Gratuit',back:'Voir les Jeux',forever:'Tous les jeux restent GRATUITS POUR TOUJOURS.',loading:'Vérification de l’invitation…'},
 it:{title:'Sei stato invitato a giocare!',invited:(n,g)=>`${n} ti invita a giocare a ${g} su One2OneLove.`,generic:'Scopri i giochi gratuiti su One2OneLove.',play:g=>'Gioca a '+g,signup:'Crea Account Gratuito',back:'Esplora i Giochi',forever:'Tutti i giochi sono GRATIS PER SEMPRE.',loading:'Verifica dell’invito…'},
 de:{title:'Du wurdest zum Spielen eingeladen!',invited:(n,g)=>`${n} lädt dich ein, ${g} auf One2OneLove zu spielen.`,generic:'Entdecke kostenlose Beziehungsspiele auf One2OneLove.',play:g=>'Spiele '+g,signup:'Kostenloses Konto erstellen',back:'Spiele ansehen',forever:'Alle Spiele bleiben FÜR IMMER KOSTENLOS.',loading:'Einladung wird geprüft…'},
};
export default function InviteLanding(){
 const {code:slug}=useParams(),[params]=useSearchParams(),navigate=useNavigate();
 const {currentLanguage}=useLanguage(),t=copy[currentLanguage]||copy.en;
 const code=String(slug||'').toUpperCase();
 const game=inviteGame(params.get('g'))||inviteGame('scrabluko');
 const source=params.get('src')==='games_site'?'games_site':'invite_link';
 const [invite,setInvite]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let alive=true;
  const validCode=validInviteCode(code);
  if(!validCode&&code!=='PLAY'){setInvite({valid:false});setLoading(false);return;}
  resolveInvite(validCode?code:'play').then(r=>{if(alive)setInvite(r)}).catch(()=>{if(alive)setInvite({valid:false})}).finally(()=>{if(alive)setLoading(false)});
  return()=>{alive=false};
 },[code]);
 useEffect(()=>{
  if(loading)return;
  const validPersonal=validInviteCode(code)&&invite?.valid;
  const validSource=code==='PLAY';
  if(!validPersonal&&!validSource)return;
  saveAttribution({code:validPersonal?code:null,game:game.key,source:validPersonal?'invite_link':source,landedAt:new Date().toISOString()});
  logInviteEvent({code:validPersonal?code:null,game:game.key,surface:validSource?'games_site':'invite_landing',event:'landing_view'}).catch(()=>{});
 },[loading,invite?.valid,code,game.key,source]);
 const tracked=event=>logInviteEvent({code:invite?.valid&&validInviteCode(code)?code:null,game:game.key,surface:'invite_landing',event}).catch(()=>{});
 return <main className="min-h-[76vh] bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12 text-slate-900">
  <div className="mx-auto max-w-2xl rounded-3xl border border-pink-200 bg-white p-7 text-center shadow-xl sm:p-10">
   <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-pink-100"><Heart size={32} className="fill-pink-500 text-pink-600"/></div>
   <h1 className="mt-5 text-3xl font-black sm:text-4xl">{t.title}</h1>
   <p className="mt-4 text-lg text-slate-600">{loading?t.loading:invite?.valid&&invite.inviterFirstName?t.invited(invite.inviterFirstName,game.label):t.generic}</p>
   <img src={game.image} alt={game.label} className="mx-auto mt-7 w-full max-w-md rounded-2xl shadow-lg"/>
   <p className="mt-5 font-black text-emerald-700">{t.forever}</p>
   <p className="mt-2 text-xs font-semibold text-purple-700">{freePromoMessage(currentLanguage)}</p>
   <div className="mt-7 grid gap-3 sm:grid-cols-2">
    <button type="button" data-analytics-id="invite-landing-play" onClick={()=>{tracked('play_click');navigate(game.route)}} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-4 font-black text-white"><Gamepad2 size={20}/>{t.play(game.label)}</button>
    <Link data-analytics-id="invite-landing-signup" onClick={()=>tracked('signup_click')} to="/SignUp" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-purple-300 px-5 py-4 font-black text-purple-800"><UserPlus size={20}/>{t.signup}</Link>
   </div>
   <Link to="/CooperativeGames" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16}/>{t.back}</Link>
  </div>
 </main>;
}
