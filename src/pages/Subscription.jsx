import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { Button } from '@/components/ui/button';
import { getUserSubscription, handleSubscriptionCheckout, startPremierTrial } from '@/lib/stripeService';
import { toast } from 'sonner';

const COPY={
 en:{title:'Choose Your One2OneLove Membership',subtitle:'Simple, stable membership options with no hidden steps.',guest:'24-Hour Guest Preview',guestPrice:'FREE',guestBadge:'NO CARD REQUIRED',guestBody:'Create and verify your account to begin a 24-hour view-only preview. Email and mobile-number verification are required.',guestButton:'Create Account — Start 24-Hour Preview',premiere:'Premiere',premierePrice:'US$9.99 / month',exclusive:'Exclusive',exclusivePrice:'US$19.99 / month',premiereFeatures:['Relationship tools and activities','Community and chat access','Love Notes and relationship support','Member profile and shared features'],exclusiveFeatures:['Everything in Premiere','Exclusive-level feature access','Enhanced relationship tools','Priority premium experiences'],createPremiere:'Create Account for Premiere',createExclusive:'Create Account for Exclusive',startTrial:'Start 7-Day Full Access Trial',starting:'Opening secure checkout…',current:'Current membership',loading:'Checking your membership…',trial:'The 7-day Full Access trial includes Exclusive-level access. After the trial, membership continues on Premiere unless you choose Exclusive or cancel.',setup:'Finish membership setup to continue.'},
 es:{title:'Elige Tu Membresía One2OneLove',subtitle:'Opciones simples y estables, sin pasos ocultos.',guest:'Vista Previa de 24 Horas',guestPrice:'GRATIS',guestBadge:'SIN TARJETA',guestBody:'Crea y verifica tu cuenta para comenzar una vista previa de 24 horas solo para ver. Se requiere verificar correo y móvil.',guestButton:'Crear Cuenta — Iniciar Vista Previa',premiere:'Premiere',premierePrice:'US$9.99 / mes',exclusive:'Exclusive',exclusivePrice:'US$19.99 / mes',premiereFeatures:['Herramientas y actividades de relación','Comunidad y chat','Notas de Amor y apoyo','Perfil y funciones compartidas'],exclusiveFeatures:['Todo en Premiere','Acceso Exclusive','Herramientas ampliadas','Experiencias premium prioritarias'],createPremiere:'Crear Cuenta para Premiere',createExclusive:'Crear Cuenta para Exclusive',startTrial:'Comenzar Prueba de 7 Días',starting:'Abriendo pago seguro…',current:'Membresía actual',loading:'Comprobando tu membresía…',trial:'La prueba de 7 días incluye acceso Exclusive. Después continúa en Premiere salvo que elijas Exclusive o canceles.',setup:'Completa la configuración de membresía para continuar.'},
 fr:{title:'Choisissez Votre Abonnement One2OneLove',subtitle:'Des options simples et stables, sans étapes cachées.',guest:'Aperçu Invité de 24 Heures',guestPrice:'GRATUIT',guestBadge:'SANS CARTE',guestBody:'Créez et vérifiez votre compte pour commencer un aperçu de 24 heures en lecture seule. La vérification e-mail et mobile est requise.',guestButton:'Créer un Compte — Démarrer l’Aperçu',premiere:'Premiere',premierePrice:'US$9.99 / mois',exclusive:'Exclusive',exclusivePrice:'US$19.99 / mois',premiereFeatures:['Outils et activités relationnels','Communauté et chat','Notes d’Amour et soutien','Profil et fonctions partagées'],exclusiveFeatures:['Tout dans Premiere','Accès Exclusive','Outils relationnels renforcés','Expériences premium prioritaires'],createPremiere:'Créer un Compte Premiere',createExclusive:'Créer un Compte Exclusive',startTrial:'Commencer l’Essai de 7 Jours',starting:'Ouverture du paiement sécurisé…',current:'Abonnement actuel',loading:'Vérification de votre abonnement…',trial:'L’essai de 7 jours comprend l’accès Exclusive. Ensuite, l’abonnement continue en Premiere sauf choix d’Exclusive ou annulation.',setup:'Terminez la configuration de votre abonnement pour continuer.'},
 it:{title:'Scegli il Tuo Abbonamento One2OneLove',subtitle:'Opzioni semplici e stabili, senza passaggi nascosti.',guest:'Anteprima Ospite di 24 Ore',guestPrice:'GRATIS',guestBadge:'NESSUNA CARTA',guestBody:'Crea e verifica il tuo account per iniziare un’anteprima di 24 ore solo visualizzazione. Sono richieste verifica email e cellulare.',guestButton:'Crea Account — Avvia Anteprima',premiere:'Premiere',premierePrice:'US$9.99 / mese',exclusive:'Exclusive',exclusivePrice:'US$19.99 / mese',premiereFeatures:['Strumenti e attività di relazione','Community e chat','Love Notes e supporto','Profilo e funzioni condivise'],exclusiveFeatures:['Tutto in Premiere','Accesso Exclusive','Strumenti avanzati','Esperienze premium prioritarie'],createPremiere:'Crea Account Premiere',createExclusive:'Crea Account Exclusive',startTrial:'Avvia Prova di 7 Giorni',starting:'Apertura pagamento sicuro…',current:'Abbonamento attuale',loading:'Controllo abbonamento…',trial:'La prova di 7 giorni include accesso Exclusive. Dopo continua su Premiere salvo scelta di Exclusive o annullamento.',setup:'Completa la configurazione dell’abbonamento per continuare.'},
 de:{title:'Wählen Sie Ihre One2OneLove-Mitgliedschaft',subtitle:'Einfache, stabile Optionen ohne versteckte Schritte.',guest:'24-Stunden-Gastvorschau',guestPrice:'KOSTENLOS',guestBadge:'KEINE KARTE',guestBody:'Erstellen und bestätigen Sie Ihr Konto für eine 24-stündige Ansichtsvorschau. E-Mail- und Mobiltelefonbestätigung sind erforderlich.',guestButton:'Konto Erstellen — 24-Stunden-Vorschau',premiere:'Premiere',premierePrice:'US$9.99 / Monat',exclusive:'Exclusive',exclusivePrice:'US$19.99 / Monat',premiereFeatures:['Beziehungswerkzeuge und Aktivitäten','Community und Chat','Love Notes und Unterstützung','Profil und gemeinsame Funktionen'],exclusiveFeatures:['Alles in Premiere','Exclusive-Zugriff','Erweiterte Werkzeuge','Premium-Erlebnisse mit Priorität'],createPremiere:'Premiere-Konto Erstellen',createExclusive:'Exclusive-Konto Erstellen',startTrial:'7-Tage-Test Starten',starting:'Sicherer Checkout wird geöffnet…',current:'Aktuelle Mitgliedschaft',loading:'Mitgliedschaft wird geprüft…',trial:'Der 7-Tage-Test enthält Exclusive-Zugriff. Danach läuft Premiere weiter, sofern Sie nicht Exclusive wählen oder kündigen.',setup:'Schließen Sie die Mitgliedschaftseinrichtung ab, um fortzufahren.'}
};

const PLANS=[{name:'Premiere',price:9.99},{name:'Exclusive',price:19.99}];

function PlanCard({plan,t,user,busy,onChoose}){
 const features=plan.name==='Exclusive'?t.exclusiveFeatures:t.premiereFeatures;
 const price=plan.name==='Exclusive'?t.exclusivePrice:t.premierePrice;
 const create=plan.name==='Exclusive'?t.createExclusive:t.createPremiere;
 return <section className="flex min-h-[430px] flex-col rounded-3xl border-2 border-slate-200 bg-white p-7 shadow-sm">
   <div className="text-4xl" aria-hidden="true">{plan.name==='Exclusive'?'👑':'💖'}</div>
   <h2 className="mt-4 text-3xl font-black text-slate-900">{plan.name==='Exclusive'?t.exclusive:t.premiere}</h2>
   <div className="mt-2 text-2xl font-black text-slate-800">{price}</div>
   <ul className="mt-6 flex-1 space-y-3">{features.map(item=><li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600"/><span>{item}</span></li>)}</ul>
   <Button disabled={busy} onClick={()=>onChoose(plan)} className="mt-7 w-full py-6 text-base font-bold">{user?(busy?t.starting:(user.stripe_subscription_id?'Choose '+plan.name:t.startTrial)):create}</Button>
 </section>;
}

export default function Subscription(){
 const {user}=useAuth();
 const navigate=useNavigate();
 const [searchParams]=useSearchParams();
 const {currentLanguage}=useLanguage();
 const t=COPY[currentLanguage]||COPY.en;
 const [subscription,setSubscription]=useState(null);
 const [checked,setChecked]=useState(!user);
 const [busy,setBusy]=useState('');

 useEffect(()=>{
  let active=true;
  if(!user){setSubscription(null);setChecked(true);return()=>{active=false;};}
  setChecked(false);
  getUserSubscription().then(v=>{if(active){setSubscription(v);setChecked(true);}}).catch(()=>{if(active)setChecked(true);});
  return()=>{active=false;};
 },[user?.id]);

 const choose=async plan=>{
  if(!user){navigate('/SignUp?plan='+encodeURIComponent(plan.name)+'&type=individual&source=subscription-plan');return;}
  setBusy(plan.name);
  try{
   if(!subscription?.stripe_subscription_id){const result=await startPremierTrial();if(!result?.success)toast.error(result?.error||'Unable to start checkout.');return;}
   const result=await handleSubscriptionCheckout({name:plan.name,price:plan.price,priceId:plan.name==='Exclusive'?(import.meta.env.VITE_STRIPE_PRICE_EXCLUSIVE||'price_1UFUSKCoKDheG1ASG5zk97Ph'):(import.meta.env.VITE_STRIPE_PRICE_PREMIERE||'price_1UFUSDCoKDheG1AS2AgFooh0')});
   if(!result?.success)toast.error(result?.error||'Unable to update membership.');
  }finally{setBusy('');}
 };

 const setupRequired=searchParams.get('setup')==='required';
 return <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
  <div className="mx-auto max-w-6xl">
   <header className="text-center"><h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{t.title}</h1><p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">{t.subtitle}</p></header>
   <div className="mt-8 min-h-[86px] rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">{!checked?<p className="font-semibold text-slate-600">{t.loading}</p>:user?<div><div className="text-xs font-black uppercase tracking-wider text-slate-500">{t.current}</div><div className="mt-1 text-lg font-black text-slate-900">{subscription?.subscription_plan||user.subscription_plan||'Guest Preview'}</div>{setupRequired&&<p className="mt-1 text-sm text-amber-700">{t.setup}</p>}</div>:<p className="text-sm font-semibold text-slate-600">{t.guestBody}</p>}</div>
   <div className="mt-8 grid gap-6 lg:grid-cols-3">
    <section className="flex min-h-[430px] flex-col rounded-3xl border-2 border-emerald-200 bg-white p-7 shadow-sm"><div className="flex items-center justify-between"><ShieldCheck className="h-8 w-8 text-emerald-600"/><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">{t.guestBadge}</span></div><h2 className="mt-4 text-3xl font-black text-slate-900">{t.guest}</h2><div className="mt-2 text-2xl font-black text-emerald-700">{t.guestPrice}</div><p className="mt-6 flex-1 text-sm leading-7 text-slate-700">{t.guestBody}</p>{!user&&<Button onClick={()=>navigate('/SignUp?plan=Premiere&type=individual&source=guest-preview')} className="mt-7 w-full bg-emerald-600 py-6 text-base font-bold text-white hover:bg-emerald-700">{t.guestButton}</Button>}{user&&!subscription?.stripe_subscription_id&&<Button disabled={Boolean(busy)} onClick={()=>choose(PLANS[0])} className="mt-7 w-full bg-emerald-600 py-6 text-base font-bold text-white hover:bg-emerald-700"><CreditCard className="mr-2 h-5 w-5"/>{busy?t.starting:t.startTrial}</Button>}</section>
    {PLANS.map(plan=><PlanCard key={plan.name} plan={plan} t={t} user={user} busy={busy===plan.name} onChoose={choose}/>) }
   </div>
   <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><p>{t.trial}</p></div>
  </div>
 </main>;
}