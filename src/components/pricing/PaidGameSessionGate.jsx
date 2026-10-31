import React, { cloneElement, isValidElement, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { isPhoneVerificationError } from '@/lib/tokenService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { isUnifiedPrelaunchGuestAccessEnabled } from '@/lib/prelaunchGuestAccess';

const COPY = {
  en: {loading:'Checking game access…', verify:'Verify your phone number', verifyText:'A verified account is required to play. Every game is permanently FREE — no Credit is charged.', verifyButton:'Verify My Phone', badge:'FREE FOREVER', text:'All current and future One2OneLove games are free forever. No Credit needed.', start:'Play FREE', opening:'Opening…', error:'Unable to start this game.', signIn:'Create your free account to play' },
  es: {loading:'Comprobando acceso…', verify:'Verifica tu número de teléfono', verifyText:'Necesitas una cuenta verificada. Todos los juegos son GRATIS PARA SIEMPRE, sin cobrar Crédito.', verifyButton:'Verificar mi teléfono', badge:'GRATIS PARA SIEMPRE', text:'Todos los juegos One2OneLove son gratis para siempre. No necesitas Crédito.', start:'Jugar GRATIS', opening:'Abriendo…', error:'No se pudo iniciar el juego.', signIn:'Crea tu cuenta gratis para jugar' },
  fr: {loading:'Vérification de l’accès…', verify:'Vérifiez votre téléphone', verifyText:'Un compte vérifié est nécessaire. Tous les jeux sont GRATUITS POUR TOUJOURS, sans débit de Crédit.', verifyButton:'Vérifier mon téléphone', badge:'GRATUIT POUR TOUJOURS', text:'Tous les jeux One2OneLove sont gratuits pour toujours. Aucun Crédit nécessaire.', start:'Jouer GRATUITEMENT', opening:'Ouverture…', error:'Impossible de démarrer le jeu.', signIn:'Créez votre compte gratuit pour jouer' },
  it: {loading:'Verifica dell’accesso…', verify:'Verifica il tuo numero di telefono', verifyText:'Serve un account verificato. Tutti i giochi sono GRATIS PER SEMPRE, senza addebiti di Credito.', verifyButton:'Verifica il telefono', badge:'GRATIS PER SEMPRE', text:'Tutti i giochi One2OneLove sono gratis per sempre. Non serve Credito.', start:'Gioca GRATIS', opening:'Apertura…', error:'Impossibile avviare il gioco.', signIn:'Crea un account gratuito per giocare' },
  de: {loading:'Spielzugang wird geprüft…', verify:'Telefonnummer bestätigen', verifyText:'Ein bestätigtes Konto ist erforderlich. Alle Spiele sind FÜR IMMER KOSTENLOS, ohne Credit-Abzug.', verifyButton:'Telefon bestätigen', badge:'FÜR IMMER KOSTENLOS', text:'Alle One2OneLove-Spiele sind für immer kostenlos. Kein Credit nötig.', start:'GRATIS spielen', opening:'Wird geöffnet…', error:'Spiel konnte nicht gestartet werden.', signIn:'Erstelle dein kostenloses Konto zum Spielen' },
};

export default function PaidGameSessionGate({game,title,image,backdrop,children}){
  const {user,isAuthenticated}=useAuth();
  const {currentLanguage}=useLanguage();
  const t=COPY[currentLanguage]||COPY.en;
  const [ready,setReady]=useState(false),[active,setActive]=useState(false);
  const [sessionRef,setSessionRef]=useState(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[phoneGate,setPhoneGate]=useState(false);
  useEffect(()=>{
    let alive=true;
    setReady(false);setActive(false);setSessionRef(null);setPhoneGate(false);setError('');
    if(!isAuthenticated||!user?.id){setReady(true);return()=>{alive=false};}
    apiRequest('/api/games/standard/access?game='+encodeURIComponent(game))
      .then(access=>{if(!alive)return;setActive(Boolean(access?.active));setSessionRef(access?.pass?.id||null);})
      .catch(err=>{if(alive){if(isPhoneVerificationError(err))setPhoneGate(true);else setError(err?.message||t.error);}})
      .finally(()=>{if(alive)setReady(true);});
    return()=>{alive=false};
  },[game,isAuthenticated,user?.id]);
  const start=async()=>{
    if(!isAuthenticated||!user?.id){window.location.assign('/SignUp?return='+encodeURIComponent(window.location.pathname));return;}
    setBusy(true);setError('');
    try{
      const requestId=globalThis.crypto?.randomUUID?.()||'game-'+Date.now();
      const result=await apiRequest('/api/games/standard/access',{method:'POST',body:{game,requestId}});
      if(!result?.pass?.id)throw new Error(t.error);
      setSessionRef(result.pass.id);setActive(true);
    }catch(err){
      if(isPhoneVerificationError(err))setPhoneGate(true);
      else setError(err?.message||t.error);
    }finally{setBusy(false);}
  };
  const surface={backgroundColor:backdrop||'#07112f'};
  // Guest preview may display game UI; a real server game session still
  // requires account verification and is never forged for an anonymous user.
  if(!isAuthenticated && isUnifiedPrelaunchGuestAccessEnabled()) return children;
  if(!ready)return <div className="min-h-[50vh] grid place-items-center font-bold text-slate-500">{t.loading}</div>;
  if(active)return isValidElement(children)?cloneElement(children,{gameSessionRef:sessionRef}):children;
  if(phoneGate)return <div className="grid min-h-[60vh] place-items-center p-6 text-center text-white" style={surface}><div className="w-full max-w-md"><div className="text-5xl">📱</div><h1 className="mt-4 text-3xl font-black">{t.verify}</h1><p className="mt-3 text-white/75">{t.verifyText}</p><button onClick={()=>window.location.assign('/VerifyPhone?redirect='+encodeURIComponent(window.location.pathname))} className="mt-5 rounded-full bg-fuchsia-600 px-7 py-3 font-black text-white">{t.verifyButton}</button></div></div>;
  return <div className="grid min-h-[60vh] place-items-center p-6 text-center text-white" style={surface}><div className="w-full max-w-3xl">
    {image&&<img src={image} alt={title} className="mx-auto mb-6 block w-full rounded-[24px] shadow-2xl ring-1 ring-white/15"/>}
    <div className="text-5xl">🎮</div>
    <div className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">{t.badge}</div>
    <h1 className="mt-4 text-3xl font-black">{title}</h1>
    <p className="mt-3 text-white/75">{t.text}</p>
    {error&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">{error}</div>}
    <button onClick={start} disabled={busy} className="mt-5 rounded-full bg-emerald-600 px-7 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-60">{busy?t.opening:!isAuthenticated?t.signIn:t.start}</button>
  </div></div>;
}
