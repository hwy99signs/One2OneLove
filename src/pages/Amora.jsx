import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,Coins,HeartHandshake,Loader2,MessageCircle,Plus,Send,Trash2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {useLanguage} from '@/Layout';
import {createCoachConversation,deleteCoachConversation,listCoachConversations,listCoachMessages,sendCoachMessage} from '@/lib/aiService';
import {getTokenWallet,isTokensRequiredError,tokenRequiredDetails} from '@/lib/tokenService';

const COPY={
 en:{eyebrow:'Meet Amora',title:'A warm relationship coach you can talk to naturally.',intro:'Talk through communication, conflict, boundaries, connection, expectations or something that is simply on your mind. Amora offers practical relationship reflection without pretending to replace therapy or professional care.',newChat:'New conversation',placeholder:'Talk to Amora…',send:'Send',empty:'Start a conversation with Amora.',privacy:'Private relationship reflection. Amora is not therapy, diagnosis or emergency support.',signIn:'Sign in to talk with Amora',create:'Create FREE O2OL Account',tokens:'Credit',buy:'Add Credit to Unlock',tokenNote:'Creating a free account and viewing Amora are free. Each Amora response uses Credit.',delete:'Delete conversation',confirm:'Delete this conversation?'},
 es:{eyebrow:'Conoce a Amora',title:'Una coach de relaciones cálida con quien puedes hablar naturalmente.',intro:'Habla sobre comunicación, conflictos, límites, conexión, expectativas o simplemente algo que tengas en mente. Amora ofrece reflexión práctica sin sustituir terapia ni atención profesional.',newChat:'Nueva conversación',placeholder:'Habla con Amora…',send:'Enviar',empty:'Inicia una conversación con Amora.',privacy:'Reflexión privada. Amora no es terapia, diagnóstico ni apoyo de emergencia.',signIn:'Inicia sesión para hablar con Amora',create:'Crear Cuenta O2OL GRATIS',tokens:'Crédito',buy:'Agregar Crédito para Desbloquear',tokenNote:'Crear una cuenta gratis y ver a Amora es gratis. Cada respuesta de Amora usa Crédito.',delete:'Eliminar conversación',confirm:'¿Eliminar esta conversación?'},
 fr:{eyebrow:'Découvrez Amora',title:'Une coach relationnelle chaleureuse avec qui parler naturellement.',intro:'Parlez communication, conflit, limites, connexion, attentes ou simplement de ce qui vous préoccupe. Amora propose une réflexion pratique sans remplacer la thérapie ni les soins professionnels.',newChat:'Nouvelle conversation',placeholder:'Parlez à Amora…',send:'Envoyer',empty:'Commencez une conversation avec Amora.',privacy:'Réflexion relationnelle privée. Amora n’est ni thérapie, ni diagnostic, ni aide d’urgence.',signIn:'Connectez-vous pour parler à Amora',create:'Créer un Compte O2OL GRATUIT',tokens:'Crédit',buy:'Ajouter du Crédit pour Déverrouiller',tokenNote:'Créer un compte gratuit et voir Amora est gratuit. Chaque réponse d’Amora utilise du Crédit.',delete:'Supprimer la conversation',confirm:'Supprimer cette conversation ?'},
 it:{eyebrow:'Conosci Amora',title:'Una coach relazionale calorosa con cui parlare naturalmente.',intro:'Parla di comunicazione, conflitti, confini, connessione, aspettative o semplicemente di ciò che hai in mente. Amora offre riflessione pratica senza sostituire terapia o assistenza professionale.',newChat:'Nuova conversazione',placeholder:'Parla con Amora…',send:'Invia',empty:'Inizia una conversazione con Amora.',privacy:'Riflessione privata. Amora non è terapia, diagnosi o supporto di emergenza.',signIn:'Accedi per parlare con Amora',create:'Crea Account O2OL GRATUITO',tokens:'Credito',buy:'Aggiungi Credito per Sbloccare',tokenNote:'Creare un account gratuito e vedere Amora è gratis. Ogni risposta di Amora usa Credito.',delete:'Elimina conversazione',confirm:'Eliminare questa conversazione?'},
 de:{eyebrow:'Lerne Amora kennen',title:'Eine warmherzige Beziehungscoachin für natürliche Gespräche.',intro:'Sprich über Kommunikation, Konflikte, Grenzen, Verbindung, Erwartungen oder einfach das, was dich beschäftigt. Amora bietet praktische Beziehungsreflexion, ohne Therapie oder professionelle Hilfe zu ersetzen.',newChat:'Neues Gespräch',placeholder:'Mit Amora sprechen…',send:'Senden',empty:'Beginne ein Gespräch mit Amora.',privacy:'Private Beziehungsreflexion. Amora ist keine Therapie, Diagnose oder Notfallhilfe.',signIn:'Anmelden, um mit Amora zu sprechen',create:'KOSTENLOSES O2OL-Konto erstellen',tokens:'Credit',buy:'Credit Hinzufügen zum Freischalten',tokenNote:'Ein kostenloses Konto zu erstellen und Amora anzusehen ist kostenlos. Jede Antwort von Amora verwendet Credit.',delete:'Gespräch löschen',confirm:'Dieses Gespräch löschen?'}
};
const money=(cents)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents||0)/100);

export default function Amora(){
 const {currentLanguage}=useLanguage(); const {isAuthenticated}=useAuth(); const t=COPY[currentLanguage]||COPY.en;
 const [conversations,setConversations]=useState([]); const [activeId,setActiveId]=useState(null); const [messages,setMessages]=useState([]);
 const [draft,setDraft]=useState(''); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [tokenPrompt,setTokenPrompt]=useState(null); const [balance,setBalance]=useState(0); const bottomRef=useRef(null);
 const active=useMemo(()=>conversations.find(x=>x.id===activeId)||null,[conversations,activeId]);
 const refreshWallet=async()=>{try{const data=await getTokenWallet();setBalance(Number(data?.wallet?.balance||0));return data;}catch(_){return null;}};
 const handleError=(e)=>{
   if(isTokensRequiredError(e)){const info=tokenRequiredDetails(e);setTokenPrompt(info);setError(`${t.buy} — ${money(info.required)} Credit required. Current balance: ${money(info.balance)}.`);}
   else{setTokenPrompt(null);setError(e?.message||'Unable to complete that request.');}
 };
 useEffect(()=>{
  if(!isAuthenticated){setConversations([]);setMessages([]);setBalance(0);return;}
  let cancelled=false;(async()=>{try{const [list,wallet]=await Promise.all([listCoachConversations(),getTokenWallet()]);if(cancelled)return;setConversations(list);setBalance(Number(wallet?.wallet?.balance||0));if(list[0])setActiveId(v=>v||list[0].id);}catch(e){if(!cancelled)setError(e?.message||'Unable to load Amora.');}})();return()=>{cancelled=true};
 },[isAuthenticated]);
 useEffect(()=>{if(!activeId||!isAuthenticated)return;listCoachMessages(activeId).then(setMessages).catch(handleError);},[activeId,isAuthenticated]);
 useEffect(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),[messages]);

 async function newChat(){setLoading(true);setError('');setTokenPrompt(null);try{const c=await createCoachConversation();setConversations(v=>[c,...v]);setActiveId(c.id);setMessages([]);}catch(e){handleError(e);}finally{setLoading(false);}}
 async function send(){const text=draft.trim();if(!text||loading)return;setLoading(true);setDraft('');setError('');setTokenPrompt(null);try{let id=activeId;if(!id){const c=await createCoachConversation();setConversations(v=>[c,...v]);id=c.id;setActiveId(id);}const result=await sendCoachMessage(id,text);setMessages(v=>[...v,result.userMessage,result.message]);if(result?.tokens?.balance!=null)setBalance(Number(result.tokens.balance));else await refreshWallet();}catch(e){setDraft(text);handleError(e);}finally{setLoading(false);}}
 async function remove(id){if(!id||!window.confirm(t.confirm))return;setLoading(true);try{await deleteCoachConversation(id);const next=conversations.filter(x=>x.id!==id);setConversations(next);setMessages([]);setActiveId(next[0]?.id||null);}catch(e){handleError(e);}finally{setLoading(false);}}

 if(!isAuthenticated)return <main className="min-h-screen bg-[#120508] px-4 py-12 text-white" style={{backgroundImage:'radial-gradient(circle at 15% 0%, #7f1d1d 0%, transparent 32%), radial-gradient(circle at 90% 10%, #3b0764 0%, transparent 30%)'}}>
  <section className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200/20 bg-black/25 p-8 text-center shadow-2xl backdrop-blur">
   <img src="/assets/amora-relationship-coach-official.webp" alt="Amora" className="mx-auto w-56 rounded-3xl border border-white/15 shadow-xl"/>
   <p className="mt-6 text-xs font-black uppercase tracking-[.22em] text-rose-200">{t.eyebrow}</p><h1 className="mt-2 text-4xl font-black">{t.title}</h1><p className="mx-auto mt-4 max-w-2xl text-white/75">{t.intro}</p>
   <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200/20 bg-amber-950/25 p-4 text-sm leading-6 text-amber-50"><Coins className="mx-auto mb-2 h-5 w-5"/>{t.tokenNote}</div>
   <div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/SignIn?source=amora" className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-black">{t.signIn}</Link><Link to="/SignUp?source=amora&type=individual" className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-3 font-black">{t.create}</Link></div>
  </section>
 </main>;

 return <main className="min-h-screen bg-[#120508] px-3 py-5 text-white sm:px-6 sm:py-8" style={{backgroundImage:'radial-gradient(circle at 12% 0%, #7f1d1d 0%, transparent 30%), radial-gradient(circle at 88% 12%, #4a044e 0%, transparent 28%)'}}>
  <section className="mx-auto max-w-7xl">
   <Link to="/Home" className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/75"><ArrowLeft className="h-4 w-4"/>Home</Link>
   <div className="grid gap-5 lg:grid-cols-[310px_1fr]">
    <aside className="rounded-[1.75rem] border border-rose-200/20 bg-black/35 p-5 shadow-xl backdrop-blur">
     <img src="/assets/amora-relationship-coach-official.webp" alt="Amora" className="mx-auto w-48 rounded-3xl border border-white/15"/>
     <p className="mt-5 text-xs font-black uppercase tracking-[.22em] text-rose-200">{t.eyebrow}</p><h1 className="mt-2 text-2xl font-black">{t.title}</h1><p className="mt-3 text-sm leading-6 text-white/70">{t.intro}</p>
     <Link to="/Credit?return=/Amora" className="mt-5 flex items-center justify-between rounded-2xl border border-amber-200/25 bg-amber-300/10 p-4 text-amber-50"><span className="inline-flex items-center gap-2 font-black"><Coins className="h-5 w-5"/>{t.tokens}</span><span className="text-2xl font-black">{money(balance)}</span></Link>
     <button onClick={newChat} disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/15 disabled:opacity-50"><Plus className="h-4 w-4"/>{t.newChat}</button>
     <div className="mt-4 space-y-2">{conversations.slice(0,10).map(c=><div key={c.id} className={`flex items-center gap-2 rounded-xl pr-2 ${activeId===c.id?'bg-rose-500/25':'bg-white/[.05] hover:bg-white/10'}`}><button onClick={()=>setActiveId(c.id)} className="min-w-0 flex-1 px-3 py-2 text-left"><span className="block truncate text-sm font-bold">{c.title}</span><span className="block truncate text-xs text-white/50">{c.last_message||''}</span></button><button onClick={()=>remove(c.id)} aria-label={t.delete} className="rounded-lg p-2 text-white/45 hover:bg-white/10 hover:text-white"><Trash2 className="h-4 w-4"/></button></div>)}</div>
    </aside>
    <section className="flex min-h-[72vh] flex-col overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/35 shadow-2xl backdrop-blur">
     <div className="border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><HeartHandshake className="h-6 w-6 text-rose-200"/><div><h2 className="font-black">{active?.title||t.eyebrow}</h2><p className="text-xs text-white/55">{t.privacy}</p></div></div></div>
     <div className="flex-1 space-y-4 overflow-y-auto p-5">{!messages.length&&<div className="mx-auto mt-20 max-w-md text-center text-white/55"><MessageCircle className="mx-auto h-10 w-10 text-rose-300"/><p className="mt-3">{t.empty}</p></div>}{messages.map(m=><div key={m.id} className={`flex ${m.is_user||m.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.is_user||m.role==='user'?'bg-rose-600 text-white':'border border-white/10 bg-white/10 text-white/90'}`}>{m.text||m.content}</div></div>)}<div ref={bottomRef}/></div>
     {(error)&&<div className="mx-5 mb-3 rounded-xl border border-amber-200/25 bg-amber-950/25 p-3 text-sm text-amber-50">{error}{tokenPrompt&&<Link to="/Credit?return=/Amora" className="ml-3 inline-flex items-center gap-1 rounded-lg bg-amber-300 px-3 py-1.5 font-black text-amber-950"><Coins className="h-4 w-4"/>{t.buy}</Link>}</div>}
     <div className="border-t border-white/10 p-4"><div className="flex gap-3"><textarea value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder={t.placeholder} rows={2} className="min-h-[58px] flex-1 resize-none rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-rose-300/50"/><button onClick={send} disabled={loading||!draft.trim()} className="grid w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-600 disabled:opacity-50">{loading?<Loader2 className="h-5 w-5 animate-spin"/>:<Send className="h-5 w-5"/>}</button></div><p className="mt-2 text-center text-[11px] text-white/40">{t.tokenNote}</p></div>
    </section>
   </div>
  </section>
 </main>;
}
