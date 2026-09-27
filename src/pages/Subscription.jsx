import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { Button } from '@/components/ui/button';
import { getUserSubscription, handleSubscriptionCheckout, startPremierTrial } from '@/lib/stripeService';
import { toast } from 'sonner';
import { subscriptionPlanCopy } from '@/data/subscriptionPlanCopy';

const COPY={
 en:{title:'Choose Your One2OneLove Membership',subtitle:'Simple, stable membership options with no hidden steps.',guest:'24-Hour Guest Preview',guestPrice:'FREE',guestBadge:'NO CARD REQUIRED',guestBody:'Create and verify your account to begin a 24-hour view-only preview. Email and mobile-number verification are required.',guestButton:'Create Account — Start 24-Hour Preview',premiere:'Premiere',premierePrice:'US$9.99 / month',exclusive:'Exclusive',exclusivePrice:'US$19.99 / month',premiereFeatures:['Relationship tools and activities','Community and chat access','Love Notes and relationship support','Member profile and shared features'],exclusiveFeatures:['Everything in Premiere','Exclusive-level feature access','Enhanced relationship tools','Priority premium experiences'],createPremiere:'Create Account for Premiere',createExclusive:'Create Account for Exclusive',startTrial:'Start 7-Day Full Access Trial',starting:'Opening secure checkout…',current:'Current membership',loading:'Checking your membership…',trial:'The 7-day Full Access trial includes Exclusive-level access. After the trial, membership continues on Premiere unless you choose Exclusive or cancel.',setup:'Finish membership setup to continue.'},
 es:{title:'Elige Tu Membresía One2OneLove',subtitle:'Opciones simples y estables, sin pasos ocultos.',guest:'Vista Previa de 24 Horas',guestPrice:'GRATIS',guestBadge:'SIN TARJETA',guestBody:'Crea y verifica tu cuenta para comenzar una vista previa de 24 horas solo para ver. Se requiere verificar correo y móvil.',guestButton:'Crear Cuenta — Iniciar Vista Previa',premiere:'Premiere',premierePrice:'US$9.99 / mes',exclusive:'Exclusive',exclusivePrice:'US$19.99 / mes',premiereFeatures:['Herramientas y actividades de relación','Comunidad y chat','Notas de Amor y apoyo','Perfil y funciones compartidas'],exclusiveFeatures:['Todo en Premiere','Acceso Exclusive','Herramientas ampliadas','Experiencias premium prioritarias'],createPremiere:'Crear Cuenta para Premiere',createExclusive:'Crear Cuenta para Exclusive',startTrial:'Comenzar Prueba de 7 Días',starting:'Abriendo pago seguro…',current:'Membresía actual',loading:'Comprobando tu membresía…',trial:'La prueba de 7 días incluye acceso Exclusive. Después continúa en Premiere salvo que elijas Exclusive o canceles.',setup:'Completa la configuración de membresía para continuar.'},
 fr:{title:'Choisissez Votre Abonnement One2OneLove',subtitle:'Des options simples et stables, sans étapes cachées.',guest:'Aperçu Invité de 24 Heures',guestPrice:'GRATUIT',guestBadge:'SANS CARTE',guestBody:'Créez et vérifiez votre compte pour commencer un aperçu de 24 heures en lecture seule. La vérification e-mail et mobile est requise.',guestButton:'Créer un Compte — Démarrer l’Aperçu',premiere:'Premiere',premierePrice:'US$9.99 / mois',exclusive:'Exclusive',exclusivePrice:'US$19.99 / mois',premiereFeatures:['Outils et activités relationnels','Communauté et chat','Notes d’Amour et soutien','Profil et fonctions partagées'],exclusiveFeatures:['Tout dans Premiere','Accès Exclusive','Outils relationnels renforcés','Expériences premium prioritaires'],createPremiere:'Créer un Compte Premiere',createExclusive:'Créer un Compte Exclusive',startTrial:'Commencer l’Essai de 7 Jours',starting:'Ouverture du paiement sécurisé…',current:'Abonnement actuel',loading:'Vérification de votre abonnement…',trial:'L’essai de 7 jours comprend l’accès Exclusive. Ensuite, l’abonnement continue en Premiere sauf choix d’Exclusive ou annulation.',setup:'Terminez la configuration de votre abonnement pour continuer.'},
 it:{title:'Scegli il Tuo Abbonamento One2OneLove',subtitle:'Opzioni semplici e stabili, senza passaggi nascosti.',guest:'Anteprima Ospite di 24 Ore',guestPrice:'GRATIS',guestBadge:'NESSUNA CARTA',guestBody:'Crea e verifica il tuo account per iniziare un’anteprima di 24 ore solo visualizzazione. Sono richieste verifica email e cellulare.',guestButton:'Crea Account — Avvia Anteprima',premiere:'Premiere',premierePrice:'US$9.99 / mese',exclusive:'Exclusive',exclusivePrice:'US$19.99 / mese',premiereFeatures:['Strumenti e attività di relazione','Community e chat','Love Notes e supporto','Profilo e funzioni condivise'],exclusiveFeatures:['Tutto in Premiere','Accesso Exclusive','Strumenti avanzati','Esperienze premium prioritarie'],createPremiere:'Crea Account Premiere',createExclusive:'Crea Account Exclusive',startTrial:'Avvia Prova di 7 Giorni',starting:'Apertura pagamento sicuro…',current:'Abbonamento attuale',loading:'Controllo abbonamento…',trial:'La prova di 7 giorni include accesso Exclusive. Dopo continua su Premiere salvo scelta di Exclusive o annullamento.',setup:'Completa la configurazione dell’abbonamento per continuare.'},
 de:{title:'Wählen Sie Ihre One2OneLove-Mitgliedschaft',subtitle:'Einfache, stabile Optionen ohne versteckte Schritte.',guest:'24-Stunden-Gastvorschau',guestPrice:'KOSTENLOS',guestBadge:'KEINE KARTE',guestBody:'Erstellen und bestätigen Sie Ihr Konto für eine 24-stündige Ansichtsvorschau. E-Mail- und Mobiltelefonbestätigung sind erforderlich.',guestButton:'Konto Erstellen — 24-Stunden-Vorschau',premiere:'Premiere',premierePrice:'US$9.99 / Monat',exclusive:'Exclusive',exclusivePrice:'US$19.99 / Monat',premiereFeatures:['Beziehungswerkzeuge und Aktivitäten','Community und Chat','Love Notes und Unterstützung','Profil und gemeinsame Funktionen'],exclusiveFeatures:['Alles in Premiere','Exclusive-Zugriff','Erweiterte Werkzeuge','Premium-Erlebnisse mit Priorität'],createPremiere:'Premiere-Konto Erstellen',createExclusive:'Exclusive-Konto Erstellen',startTrial:'7-Tage-Test Starten',starting:'Sicherer Checkout wird geöffnet…',current:'Aktuelle Mitgliedschaft',loading:'Mitgliedschaft wird geprüft…',trial:'Der 7-Tage-Test enthält Exclusive-Zugriff. Danach läuft Premiere weiter, sofern Sie nicht Exclusive wählen oder kündigen.',setup:'Schließen Sie die Mitgliedschaftseinrichtung ab, um fortzufahren.'}
};

const FOUNDING={
 en:{hero:'FOUNDING MEMBERS — FIRST 200 MEMBERS',title:'Founding Members Launch Offer',first:'Members #1–100: Exclusive FREE for 30 days with a credit/debit card. Unless you choose Premiere before the free period ends, Exclusive continues automatically at US$15.99/month for as long as you remain continuously subscribed.',second:'Members #101–200: Premiere FREE for 30 days with a credit/debit card, then Premiere continues automatically at the regular monthly price.',terms:'Cancel anytime. Your Founding Member badge remains permanently. If a 1st 100 member cancels and later returns, the permanent badge remains but the US$15.99 Founding rate is permanently forfeited and current regular pricing applies. Founding member numbers are reserved and are not recycled.'},
 es:{hero:'MIEMBROS FUNDADORES — PRIMEROS 200 MIEMBROS',title:'Oferta de Lanzamiento para Miembros Fundadores',first:'Miembros #1–100: Exclusive GRATIS durante 30 días con tarjeta de crédito/débito. Si no eliges Premiere antes de que termine el período gratuito, Exclusive continúa automáticamente por US$15.99/mes mientras mantengas la suscripción de forma continua.',second:'Miembros #101–200: Premiere GRATIS durante 30 días con tarjeta de crédito/débito; después Premiere continúa automáticamente al precio mensual regular.',terms:'Cancela en cualquier momento. Tu insignia de Miembro Fundador permanece para siempre. Si un miembro de los primeros 100 cancela y vuelve después, conserva la insignia permanente, pero pierde para siempre la tarifa fundadora de US$15.99 y se aplica el precio regular vigente. Los números de Miembro Fundador quedan reservados y no se reutilizan.'},
 fr:{hero:'MEMBRES FONDATEURS — 200 PREMIERS MEMBRES',title:'Offre de Lancement Membres Fondateurs',first:'Membres #1–100 : Exclusive GRATUIT pendant 30 jours avec carte de crédit/débit. Sauf choix de Premiere avant la fin de la période gratuite, Exclusive continue automatiquement à US$15.99/mois tant que l’abonnement reste actif sans interruption.',second:'Membres #101–200 : Premiere GRATUIT pendant 30 jours avec carte de crédit/débit, puis Premiere continue automatiquement au tarif mensuel normal.',terms:'Annulez à tout moment. Votre badge de Membre Fondateur reste permanent. Si un membre des 100 premiers annule puis revient, le badge permanent reste, mais le tarif fondateur de US$15.99 est définitivement perdu et le tarif normal en vigueur s’applique. Les numéros de membre fondateur sont réservés et ne sont pas réattribués.'},
 it:{hero:'MEMBRI FONDATORI — PRIMI 200 MEMBRI',title:'Offerta Lancio Membri Fondatori',first:'Membri #1–100: Exclusive GRATIS per 30 giorni con carta di credito/debito. Se non scegli Premiere prima della fine del periodo gratuito, Exclusive continua automaticamente a US$15.99/mese finché l’abbonamento resta attivo senza interruzioni.',second:'Membri #101–200: Premiere GRATIS per 30 giorni con carta di credito/debito, poi Premiere continua automaticamente al normale prezzo mensile.',terms:'Annulla in qualsiasi momento. Il badge di Membro Fondatore rimane permanente. Se un membro dei primi 100 annulla e torna in seguito, il badge resta ma la tariffa fondatore di US$15.99 viene persa definitivamente e si applica il prezzo regolare vigente. I numeri dei Membri Fondatori restano riservati e non vengono riutilizzati.'},
 de:{hero:'GRÜNDUNGSMITGLIEDER — ERSTE 200 MITGLIEDER',title:'Startangebot für Gründungsmitglieder',first:'Mitglieder #1–100: Exclusive 30 Tage KOSTENLOS mit Kredit-/Debitkarte. Wenn Sie vor Ablauf des kostenlosen Zeitraums nicht Premiere wählen, läuft Exclusive automatisch für US$15.99/Monat weiter, solange das Abonnement ohne Unterbrechung aktiv bleibt.',second:'Mitglieder #101–200: Premiere 30 Tage KOSTENLOS mit Kredit-/Debitkarte; danach läuft Premiere automatisch zum regulären Monatspreis weiter.',terms:'Jederzeit kündbar. Ihr Gründungsmitglied-Abzeichen bleibt dauerhaft bestehen. Kündigt ein Mitglied der ersten 100 und kehrt später zurück, bleibt das Abzeichen erhalten, aber der Gründungspreis von US$15.99 ist dauerhaft verwirkt und der dann gültige reguläre Preis gilt. Gründungsmitgliedsnummern bleiben reserviert und werden nicht erneut vergeben.'}
};

const PLANS=[{name:'Premiere',price:9.99},{name:'Exclusive',price:19.99}];

function PlanCard({plan,t,planCopy,user,busy,onChoose}){
 const features=planCopy.plans[plan.name].features;
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
 const planCopy=subscriptionPlanCopy[currentLanguage]||subscriptionPlanCopy.en;
 const founding=FOUNDING[currentLanguage]||FOUNDING.en;
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
   <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-center shadow-sm"><div className="text-sm font-black uppercase tracking-widest text-amber-700">{founding.hero}</div><h2 className="mt-1 text-2xl font-black text-slate-900">{founding.title}</h2></div>
   <div className="mt-6 min-h-[86px] rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">{!checked?<p className="font-semibold text-slate-600">{t.loading}</p>:user?<div><div className="text-xs font-black uppercase tracking-wider text-slate-500">{t.current}</div><div className="mt-1 text-lg font-black text-slate-900">{subscription?.subscription_plan||user.subscription_plan||'Guest Preview'}</div>{setupRequired&&<p className="mt-1 text-sm text-amber-700">{t.setup}</p>}</div>:<p className="text-sm font-semibold text-slate-600">{t.guestBody}</p>}</div>
   <div className="mt-8 grid gap-6 lg:grid-cols-3">
    <section className="flex min-h-[430px] flex-col rounded-3xl border-2 border-emerald-200 bg-white p-7 shadow-sm"><div className="flex items-center justify-between"><ShieldCheck className="h-8 w-8 text-emerald-600"/><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">{t.guestBadge}</span></div><h2 className="mt-4 text-3xl font-black text-slate-900">{t.guest}</h2><div className="mt-2 text-2xl font-black text-emerald-700">{t.guestPrice}</div><p className="mt-6 flex-1 text-sm leading-7 text-slate-700">{t.guestBody}</p>{!user&&<Button onClick={()=>navigate('/SignUp?plan=Premiere&type=individual&source=guest-preview')} className="mt-7 w-full bg-emerald-600 py-6 text-base font-bold text-white hover:bg-emerald-700">{t.guestButton}</Button>}{user&&!subscription?.stripe_subscription_id&&<Button disabled={Boolean(busy)} onClick={()=>choose(PLANS[0])} className="mt-7 w-full bg-emerald-600 py-6 text-base font-bold text-white hover:bg-emerald-700"><CreditCard className="mr-2 h-5 w-5"/>{busy?t.starting:t.startTrial}</Button>}</section>
    {PLANS.map(plan=><PlanCard key={plan.name} plan={plan} t={t} planCopy={planCopy} user={user} busy={busy===plan.name} onChoose={choose}/>) }
   </div>
   <div className="mt-8 space-y-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-slate-700"><h3 className="text-xl font-black text-slate-900">{founding.title}</h3><p><strong>{founding.first}</strong></p><p><strong>{founding.second}</strong></p><p>{founding.terms}</p></div>
   <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600"><p>{planCopy.terms.guest}</p><p>{planCopy.terms.trial}</p><p>{planCopy.terms.loveNotes}</p><p>{planCopy.terms.cancel}</p></div>
  </div>
 </main>;
}