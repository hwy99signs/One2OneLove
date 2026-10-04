import React,{useEffect,useMemo,useState} from 'react';
import {Coins,CreditCard,RefreshCw,ShieldCheck,Play,Square,ArrowLeft,CheckCircle2} from 'lucide-react';
import {Link,useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {useAuth} from '@/contexts/AuthContext';
import {useLanguage} from '@/Layout';
import {createPageUrl} from '@/utils';
import {
  getTokenWallet,startTokenCheckout,confirmTokenCheckout,startPaymentMethodSetup,
  confirmPaymentMethodSetup,updateAutoReplenish,startCostCalibration,endCostCalibration,getCalibrationHistory
} from '@/lib/tokenService';

const COPY={
 en:{title:'BUY O2OL TOKENS',sub:'Keep Tokens ready so premium features, locked content, games and AI conversations are available when you want them.',balance:'Token Balance',buy:'Buy Tokens',buyAccess:'Buy Tokens To Access',packages:'Token Packages',auto:'Auto-Replenish',autoBody:'Optional. Choose when your wallet refills and which package is purchased.',enable:'Enable Auto-Replenish',threshold:'Refill when balance falls below',payment:'Payment method',addCard:'Add / Change Card',history:'Recent Activity',noHistory:'No token activity yet.',cal:'Cost Calibration',calBody:'Admin-only measurement mode. Start a session, use the selected feature naturally, then end it to see the complete provider-usage totals.',start:'Start Cost Test',end:'End Cost Test',feature:'Feature',notes:'Notes',signed:'Create or sign in to a free verified account before buying tokens.',back:'Back',loading:'Loading wallet…',saved:'Auto-Replenish saved.',checkout:'Opening secure checkout…',calStarted:'Cost test started.',calEnded:'Cost test ended.',providerCost:'Provider cost',charsIn:'Characters in',charsOut:'Characters out',providerIn:'Provider input units',providerCached:'Cached input units',providerOut:'Provider output units',contextChars:'Context characters',o2olTokens:'O2OL Tokens charged',costPerToken:'Provider cost / O2OL Token',packageTest:'Package under test'},
 es:{title:'COMPRAR TOKENS O2OL',sub:'Ten Tokens listos para acceder a funciones premium, contenido bloqueado, juegos y conversaciones con IA cuando quieras.',balance:'Saldo de Tokens',buy:'Comprar Tokens',buyAccess:'Comprar Tokens para Acceder',packages:'Paquetes de Tokens',auto:'Recarga Automática',autoBody:'Opcional. Elige cuándo recargar y qué paquete comprar.',enable:'Activar Recarga Automática',threshold:'Recargar cuando el saldo baje de',payment:'Método de pago',addCard:'Agregar / Cambiar Tarjeta',history:'Actividad Reciente',noHistory:'Aún no hay actividad.',cal:'Calibración de Costos',calBody:'Modo de medición solo para admin.',start:'Iniciar Prueba',end:'Finalizar Prueba',feature:'Función',notes:'Notas',signed:'Crea o inicia sesión en una cuenta gratuita verificada antes de comprar tokens.',back:'Volver',loading:'Cargando…',saved:'Recarga guardada.',checkout:'Abriendo pago seguro…',calStarted:'Prueba iniciada.',calEnded:'Prueba finalizada.',providerCost:'Costo proveedor',charsIn:'Caracteres entrada',charsOut:'Caracteres salida',providerIn:'Unidades entrada',providerCached:'Unidades en caché',providerOut:'Unidades salida',contextChars:'Caracteres de contexto',o2olTokens:'Tokens O2OL cobrados',costPerToken:'Costo proveedor / Token O2OL',packageTest:'Paquete en prueba'},
 fr:{title:'ACHETER DES JETONS O2OL',sub:'Gardez des Jetons disponibles pour accéder aux fonctions premium, contenus verrouillés, jeux et conversations IA quand vous le souhaitez.',balance:'Solde de Jetons',buy:'Acheter des Jetons',buyAccess:'Acheter des Jetons pour Accéder',packages:'Forfaits de Jetons',auto:'Recharge Automatique',autoBody:'Optionnel. Choisissez quand recharger et quel forfait acheter.',enable:'Activer la Recharge',threshold:'Recharger lorsque le solde passe sous',payment:'Moyen de paiement',addCard:'Ajouter / Changer la Carte',history:'Activité Récente',noHistory:'Aucune activité.',cal:'Calibration des Coûts',calBody:'Mode de mesure réservé à l’administration.',start:'Démarrer le Test',end:'Terminer le Test',feature:'Fonction',notes:'Notes',signed:'Créez ou connectez-vous à un compte gratuit vérifié avant d’acheter des jetons.',back:'Retour',loading:'Chargement…',saved:'Recharge enregistrée.',checkout:'Ouverture du paiement sécurisé…',calStarted:'Test démarré.',calEnded:'Test terminé.',providerCost:'Coût fournisseur',charsIn:'Caractères entrée',charsOut:'Caractères sortie',providerIn:'Unités entrée',providerCached:'Unités en cache',providerOut:'Unités sortie',contextChars:'Caractères de contexte',o2olTokens:'Jetons O2OL débités',costPerToken:'Coût fournisseur / Jeton O2OL',packageTest:'Forfait testé'},
 it:{title:'ACQUISTA TOKEN O2OL',sub:'Tieni Token disponibili per accedere a funzioni premium, contenuti bloccati, giochi e conversazioni IA quando vuoi.',balance:'Saldo Token',buy:'Acquista Token',buyAccess:'Acquista Token per Accedere',packages:'Pacchetti Token',auto:'Ricarica Automatica',autoBody:'Opzionale. Scegli quando ricaricare e quale pacchetto acquistare.',enable:'Attiva Ricarica Automatica',threshold:'Ricarica quando il saldo scende sotto',payment:'Metodo di pagamento',addCard:'Aggiungi / Cambia Carta',history:'Attività Recente',noHistory:'Nessuna attività.',cal:'Calibrazione Costi',calBody:'Modalità di misurazione solo admin.',start:'Avvia Test',end:'Termina Test',feature:'Funzione',notes:'Note',signed:'Crea o accedi a un account gratuito verificato prima di acquistare token.',back:'Indietro',loading:'Caricamento…',saved:'Ricarica salvata.',checkout:'Apertura pagamento sicuro…',calStarted:'Test avviato.',calEnded:'Test terminato.',providerCost:'Costo provider',charsIn:'Caratteri input',charsOut:'Caratteri output',providerIn:'Unità input',providerCached:'Unità input in cache',providerOut:'Unità output',contextChars:'Caratteri contesto',o2olTokens:'Token O2OL addebitati',costPerToken:'Costo provider / Token O2OL',packageTest:'Pacchetto in prova'},
 de:{title:'O2OL TOKENS KAUFEN',sub:'Halte Tokens bereit, damit Premium-Funktionen, gesperrte Inhalte, Spiele und KI-Gespräche jederzeit verfügbar sind.',balance:'Token-Guthaben',buy:'Tokens Kaufen',buyAccess:'Tokens Kaufen für Zugriff',packages:'Token-Pakete',auto:'Automatische Aufladung',autoBody:'Optional. Wähle Schwelle und Paket.',enable:'Auto-Aufladung Aktivieren',threshold:'Aufladen wenn Guthaben unter',payment:'Zahlungsmethode',addCard:'Karte Hinzufügen / Ändern',history:'Letzte Aktivität',noHistory:'Noch keine Token-Aktivität.',cal:'Kostenkalibrierung',calBody:'Messmodus nur für Admin.',start:'Kostentest Starten',end:'Kostentest Beenden',feature:'Funktion',notes:'Notizen',signed:'Erstelle oder melde dich bei einem kostenlosen verifizierten Konto an, bevor du Tokens kaufst.',back:'Zurück',loading:'Wird geladen…',saved:'Auto-Aufladung gespeichert.',checkout:'Sichere Zahlung wird geöffnet…',calStarted:'Kostentest gestartet.',calEnded:'Kostentest beendet.',providerCost:'Anbieterkosten',charsIn:'Zeichen rein',charsOut:'Zeichen raus',providerIn:'Provider Eingabe',providerCached:'Zwischengespeicherte Eingabe',providerOut:'Provider Ausgabe',contextChars:'Kontextzeichen',o2olTokens:'Berechnete O2OL Tokens',costPerToken:'Anbieterkosten / O2OL Token',packageTest:'Testpaket'}
};

function money(cents){return '$'+(Number(cents||0)/100).toFixed(2);}
function micros(value){return '$'+(Number(value||0)/1000000).toFixed(6);}
function txLabel(tx){
 const map={purchase:'Token purchase',reserve:'Premium feature',release:'Returned tokens',refund:'Refund',grant:'Token grant',founding_bonus:'Founding Member bonus',migration_credit:'Membership conversion credit',auto_replenish:'Auto-Replenish',admin_adjustment:'Admin adjustment'};
 return map[tx.transaction_type]||tx.transaction_type;
}

export default function Tokens(){
 const {currentLanguage}=useLanguage();
 const {user,isAuthenticated}=useAuth();
 const [params,setParams]=useSearchParams();
 const t=COPY[currentLanguage]||COPY.en;
 const [state,setState]=useState(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState('');
 const [trigger,setTrigger]=useState(5);
 const [autoPackage,setAutoPackage]=useState('value');
 const [autoEnabled,setAutoEnabled]=useState(false);
 const [feature,setFeature]=useState('bianca_response');
 const [calPackage,setCalPackage]=useState('starter');
 const [notes,setNotes]=useState('');
 const [lastSummary,setLastSummary]=useState(null);
 const isAdmin=String(user?.role||'').toLowerCase()==='admin';
 const requestedReturn=params.get('return')||'';
 const returnTo=requestedReturn.startsWith('/')&&!requestedReturn.startsWith('//')?requestedReturn:createPageUrl('Home');
 const onboarding=params.get('onboarding')==='1';

 const refresh=async()=>{
  if(!isAuthenticated){setLoading(false);return;}
  try{
   const data=await getTokenWallet();setState(data);
   setTrigger(Number(data?.settings?.trigger_balance||5));
   setAutoPackage(data?.settings?.package_code||'value');
   setAutoEnabled(Boolean(data?.settings?.enabled));
  }catch(e){toast.error(e?.message||'Unable to load token wallet.');}
  finally{setLoading(false);}
 };

 useEffect(()=>{refresh();},[isAuthenticated,user?.id]);
 useEffect(()=>{
  if(!isAuthenticated)return;
  const checkout=params.get('checkout'),sid=params.get('session_id'),pm=params.get('payment_method');
  if(checkout==='success'&&sid){
   setBusy('confirm');
   confirmTokenCheckout(sid).then(()=>{toast.success('Tokens added to your wallet.');setParams({...(onboarding?{onboarding:'1'}:{}),return:returnTo});return refresh();}).catch(e=>toast.error(e?.message||'Unable to confirm token purchase.')).finally(()=>setBusy(''));
  } else if(pm==='success'&&sid){
   setBusy('setup');
   confirmPaymentMethodSetup(sid).then(()=>{toast.success('Payment method saved for optional Auto-Replenish.');setParams({});return refresh();}).catch(e=>toast.error(e?.message||'Unable to confirm payment method.')).finally(()=>setBusy(''));
  } else if(checkout==='cancelled'||pm==='cancelled'){setParams({...(onboarding?{onboarding:'1'}:{}),return:returnTo});}
 },[isAuthenticated]);

 const packages=state?.packages||[];
 const prices=state?.featurePrices||[];
 const active=state?.activeCalibration||null;
 const selectedAutoPackage=useMemo(()=>packages.find(pkg=>pkg.code===autoPackage)||null,[packages,autoPackage]);
 const maxAutoTrigger=Number(selectedAutoPackage?.tokens||0);
 const selectedCalibrationPackage=useMemo(()=>packages.find(pkg=>pkg.code===calPackage)||packages[0]||null,[packages,calPackage]);
 useEffect(()=>{if(packages.length&&!packages.some(pkg=>pkg.code===calPackage))setCalPackage(packages[0].code);},[packages,calPackage]);

 const buy=async(code)=>{
  setBusy(code);
  try{const data=await startTokenCheckout(code,returnTo);if(data?.checkout?.url)window.location.assign(data.checkout.url);}
  catch(e){toast.error(e?.message||'Unable to open checkout.');setBusy('');}
 };
 const setupCard=async()=>{
  setBusy('card');
  try{const data=await startPaymentMethodSetup();if(data?.checkout?.url)window.location.assign(data.checkout.url);}
  catch(e){toast.error(e?.message||'Unable to set up card.');setBusy('');}
 };
 const saveAuto=async()=>{
  setBusy('auto');
  try{await updateAutoReplenish({enabled:autoEnabled,packageCode:autoPackage,triggerBalance:Number(trigger)});toast.success(t.saved);await refresh();}
  catch(e){toast.error(e?.message||'Unable to save Auto-Replenish.');}
  finally{setBusy('');}
 };
 const startCalibration=async()=>{
  setBusy('cal');
  try{await startCostCalibration({featureCode:feature,packageCode:selectedCalibrationPackage?.code||null,notes});toast.success(t.calStarted);setNotes('');await refresh();}
  catch(e){toast.error(e?.message||'Unable to start cost test.');}
  finally{setBusy('');}
 };
 const endCalibration=async()=>{
  if(!active?.id)return;
  setBusy('cal');
  try{const data=await endCostCalibration(active.id);setLastSummary(data?.summary||null);toast.success(t.calEnded);await refresh();}
  catch(e){toast.error(e?.message||'Unable to end cost test.');}
  finally{setBusy('');}
 };

 if(!isAuthenticated)return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4 py-12"><div className="mx-auto max-w-xl rounded-[28px] border bg-white p-8 text-center shadow-xl"><Coins className="mx-auto h-12 w-12 text-violet-600"/><h1 className="mt-4 text-3xl font-black">{t.title}</h1><p className="mt-3 text-slate-600">{t.signed}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to={`/SignUp?source=buy-tokens&token=1&feature=tokens&return=${encodeURIComponent(returnTo)}`} className="inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">Create FREE Account</Link><Link to={`/SignIn?source=buy-tokens&token=1&redirect=${encodeURIComponent(returnTo)}`} className="inline-flex rounded-2xl border-2 border-slate-300 bg-white px-6 py-3 font-black text-slate-800">Sign In</Link></div></div></main>;
 if(loading)return <div className="min-h-[60vh] grid place-items-center font-bold text-slate-500">{t.loading}</div>;

 return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4 py-8">
  <div className="mx-auto max-w-6xl">
   <Link to={createPageUrl('Home')} className="mb-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white"><ArrowLeft className="h-4 w-4"/>{t.back}</Link>
   <div className="rounded-[30px] bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 p-7 text-white shadow-2xl sm:p-10">
    <div className="flex flex-wrap items-center justify-between gap-6">
     <div><div className="text-xs font-black uppercase tracking-[.2em] text-fuchsia-200">One2OneLove</div><h1 className="mt-2 text-4xl font-black sm:text-5xl">{t.title}</h1><p className="mt-3 max-w-2xl text-white/70">{t.sub}</p><div className="mt-4 inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-200">BASE VALUE · 1 TOKEN = $0.10</div></div>
     <div className="min-w-[190px] rounded-3xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur"><div className="text-xs font-black uppercase tracking-wider text-white/60">{t.balance}</div><div className="mt-1 text-5xl font-black">{state?.wallet?.balance||0}</div><div className="mt-1 text-sm text-fuchsia-200">TOKENS</div></div>
    </div>
   </div>

   <section className="mt-7">
    <h2 className="text-2xl font-black text-slate-950">{t.packages}</h2>
    <div className="mt-4 grid gap-4 md:grid-cols-3">
     {packages.map((pkg,i)=><div key={pkg.code} className={'rounded-[26px] border bg-white p-6 shadow-sm '+(i===1?'border-violet-300 ring-2 ring-violet-100':'border-slate-200')}>
      <div className="text-sm font-black uppercase tracking-wide text-violet-600">{pkg.label}</div><div className="mt-2 text-4xl font-black">{pkg.tokens} <span className="text-lg text-slate-500">tokens</span></div><div className="mt-1 text-2xl font-black text-slate-800">{money(pkg.amount_cents)}</div>
      <button onClick={()=>buy(pkg.code)} disabled={!!busy} className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white disabled:opacity-50">{busy===pkg.code?t.checkout:t.buy}</button>
      {pkg.calibration_only&&<div className="mt-3 text-center text-[11px] font-bold text-amber-600">PRELAUNCH CALIBRATION PACKAGE</div>}
     </div>)}
    </div>
   </section>

   <section className="mt-7 grid gap-5 lg:grid-cols-2">
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
     <div className="flex items-start gap-3"><RefreshCw className="mt-1 h-6 w-6 text-violet-600"/><div><h2 className="text-xl font-black">{t.auto}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{t.autoBody}</p></div></div>
     <label className="mt-5 flex items-center gap-3 font-bold"><input type="checkbox" checked={autoEnabled} onChange={e=>setAutoEnabled(e.target.checked)} className="h-5 w-5"/>{t.enable}</label>
     <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">{t.threshold}<input type="number" min="0" max={maxAutoTrigger||undefined} value={trigger} onChange={e=>setTrigger(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2"/></label><label className="text-sm font-bold">{t.packages}<select value={autoPackage} onChange={e=>setAutoPackage(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2">{packages.map(p=><option key={p.code} value={p.code}>{p.label} — {p.tokens}</option>)}</select></label></div>
     <div className="mt-4 flex flex-wrap gap-3"><button onClick={setupCard} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-black"><CreditCard className="h-4 w-4"/>{t.addCard}</button><button onClick={saveAuto} disabled={!!busy} className="rounded-xl bg-violet-600 px-4 py-2 font-black text-white">Save</button></div>
     <div className="mt-3 text-xs text-slate-500">{state?.settings?.payment_method_saved?<span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4"/>Payment method stored securely by Stripe</span>:'No saved payment method for Auto-Replenish.'}</div>
    </div>

    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{t.history}</h2><div className="mt-4 max-h-80 space-y-3 overflow-y-auto">{(state?.transactions||[]).length===0?<p className="text-sm text-slate-500">{t.noHistory}</p>:(state.transactions||[]).map(tx=><div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><div><div className="text-sm font-bold">{txLabel(tx)}</div><div className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</div></div><div className={'font-black '+(Number(tx.wallet_delta)>=0?'text-emerald-600':'text-rose-600')}>{Number(tx.wallet_delta)>=0?'+':''}{tx.wallet_delta}</div></div>)}</div></div>
   </section>

   <section className="mt-7 rounded-[26px] border border-violet-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-black">Current Prelaunch Feature Prices</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{prices.map(p=><div key={p.feature_code} className="rounded-xl bg-violet-50 px-4 py-3"><div className="font-bold">{p.label}</div><div className="mt-1 text-sm"><strong>{p.token_cost}</strong> token{p.token_cost===1?'':'s'} / {p.pricing_unit}</div></div>)}</div>
   </section>

   {!isAdmin&&<div className="mt-10 border-t border-slate-200 pt-6 text-center"><Link to={returnTo} className="text-xs font-semibold text-slate-400 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-600">Skip for now</Link></div>}

   {isAdmin&&<section className="mt-7 rounded-[28px] border-2 border-dashed border-amber-300 bg-amber-50 p-6">
    <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 text-amber-700"/><div><h2 className="text-xl font-black text-amber-950">{t.cal}</h2><p className="mt-1 text-sm leading-6 text-amber-900/80">{t.calBody}</p></div></div>
    {active?<div className="mt-5 rounded-2xl bg-white p-5"><div className="text-xs font-black uppercase text-emerald-600">TEST RUNNING</div><div className="mt-1 text-lg font-black">{active.feature_code}</div><div className="mt-1 text-sm font-semibold text-amber-800">{t.packageTest}: {active.package_code||'—'}</div><div className="mt-1 text-sm text-slate-500">Started {new Date(active.started_at).toLocaleString()} · Starting balance {active.starting_balance}</div><button onClick={endCalibration} disabled={!!busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-black text-white"><Square className="h-4 w-4"/>{t.end}</button></div>:
     <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"><label className="text-xs font-black uppercase text-amber-900">{t.feature}<select value={feature} onChange={e=>setFeature(e.target.value)} className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-3 normal-case"><option value="all">All metered features</option>{prices.map(p=><option key={p.feature_code} value={p.feature_code}>{p.label}</option>)}</select></label><label className="text-xs font-black uppercase text-amber-900">{t.packageTest}<select value={calPackage} onChange={e=>setCalPackage(e.target.value)} className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-3 normal-case">{packages.map(p=><option key={p.code} value={p.code}>{p.label} — {p.tokens} Tokens — {money(p.amount_cents)}</option>)}</select></label><label className="text-xs font-black uppercase text-amber-900">{t.notes}<input value={notes} onChange={e=>setNotes(e.target.value)} placeholder={t.notes} className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-3 normal-case"/></label><button onClick={startCalibration} disabled={!!busy||!selectedCalibrationPackage} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-black text-white disabled:opacity-50"><Play className="h-4 w-4"/>{t.start}</button></div>}
    {lastSummary&&<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{[[t.providerCost,micros(lastSummary.provider_cost_micros)],[t.charsIn,lastSummary.input_characters],[t.contextChars,lastSummary.context_characters],[t.charsOut,lastSummary.output_characters],[t.providerIn,lastSummary.provider_input_units],[t.providerCached,lastSummary.provider_cached_input_units],[t.providerOut,lastSummary.provider_output_units],[t.o2olTokens,lastSummary.customer_tokens_charged],[t.costPerToken,Number(lastSummary.customer_tokens_charged||0)>0?micros(Number(lastSummary.provider_cost_micros||0)/Number(lastSummary.customer_tokens_charged||1)):'—']].map(([k,v])=><div key={k} className="rounded-xl bg-white p-4"><div className="text-xs font-black uppercase text-slate-500">{k}</div><div className="mt-1 text-xl font-black">{v}</div></div>)}</div>}
   </section>}
  </div>
 </main>;
}
