import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { acceptCoachingConsent, getCoachingConsent } from '@/lib/coachingConsentService';

export default function CoachingConsentGate({children,source='coaching_gate',exitTo='/Home'}){
  const {isAuthenticated}=useAuth();
  const navigate=useNavigate();
  const [status,setStatus]=useState('loading');
  const [consent,setConsent]=useState(null);
  const [error,setError]=useState('');
  const [submitting,setSubmitting]=useState(false);

  useEffect(()=>{
    if(!isAuthenticated){setStatus('allowed');return;}
    let cancelled=false;
    (async()=>{
      try{
        const data=await getCoachingConsent();
        if(cancelled)return;
        setConsent(data);
        setStatus(data?.accepted===true?'allowed':'required');
      }catch(e){
        if(cancelled)return;
        setError(e?.message||'Unable to load the coaching agreement.');
        setStatus('error');
      }
    })();
    return()=>{cancelled=true;};
  },[isAuthenticated]);

  if(!isAuthenticated || status==='allowed') return children;

  const leave=()=>navigate(exitTo,{replace:true});
  const agree=async()=>{
    if(!consent?.version||submitting)return;
    setSubmitting(true);setError('');
    try{
      await acceptCoachingConsent({version:consent.version,source});
      setStatus('allowed');
    }catch(e){
      setError(e?.message||'Unable to save your agreement.');
    }finally{setSubmitting(false);}
  };

  if(status==='loading'){
    return <main className="min-h-[70vh] grid place-items-center bg-[#09040c] text-white"><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"><Loader2 className="h-5 w-5 animate-spin"/>Loading coaching agreement…</div></main>;
  }

  if(status==='error'){
    return <main className="min-h-[70vh] grid place-items-center bg-[#09040c] px-4 text-white"><section className="max-w-lg rounded-3xl border border-red-300/20 bg-red-950/25 p-7 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-red-200"/><h1 className="mt-3 text-xl font-black">Coaching agreement unavailable</h1><p className="mt-3 text-sm text-white/70">{error}</p><button onClick={leave} className="mt-6 rounded-full border border-white/20 bg-white/10 px-5 py-3 font-black">Go back</button></section></main>;
  }

  const copy=consent?.copy||{};
  return <main className="min-h-[85vh] bg-[#09040c] px-4 py-8 text-white">
    <section className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-fuchsia-200/20 bg-[#16091d] shadow-2xl">
      <div className="flex items-start justify-between border-b border-white/10 p-5 sm:p-7">
        <div className="pr-4"><div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-fuchsia-200"><ShieldCheck className="h-4 w-4"/>One2OneLove coaching agreement</div><h1 className="mt-2 text-2xl font-black sm:text-3xl">{copy.title||'Before you chat with Amora or Bianca'}</h1></div>
        <button onClick={leave} aria-label="Close coaching agreement" className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"><X className="h-5 w-5"/></button>
      </div>
      <div className="max-h-[62vh] space-y-4 overflow-y-auto p-5 text-sm leading-6 text-white/80 sm:p-7 sm:text-base">
        {(copy.paragraphs||[]).map((p,i)=><p key={i}>{p}</p>)}
        <div className="rounded-2xl border border-red-300/25 bg-red-950/35 p-4 font-bold text-red-50">{copy.crisis}</div>
        <div className="rounded-2xl border border-amber-200/20 bg-amber-950/25 p-4 text-amber-50">{copy.billing}</div>
        <p>{copy.privacy}</p>
        <p className="font-semibold text-white">{copy.agreement}</p>
        <p className="text-sm text-white/60">You can review the <Link to="/TermsOfService" target="_blank" rel="noreferrer" className="font-bold text-fuchsia-200 underline underline-offset-4">One2OneLove Terms of Service</Link> before agreeing.</p>
        {error&&<div className="rounded-xl border border-red-300/20 bg-red-950/25 p-3 text-sm text-red-100">{error}</div>}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-5 sm:flex-row sm:justify-end sm:p-7">
        <button type="button" onClick={leave} disabled={submitting} className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-black text-white/80 disabled:opacity-50">Decline</button>
        <button type="button" onClick={agree} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-7 py-3 font-black shadow-lg disabled:opacity-50">{submitting?<Loader2 className="h-5 w-5 animate-spin"/>:<ShieldCheck className="h-5 w-5"/>}I agree</button>
      </div>
    </section>
  </main>;
}
