import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useLanguage } from '@/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { getFoundingOffer, handleSubscriptionCheckout } from '@/lib/stripeService';
import { toast } from 'sonner';
import { subscriptionPlanCopy } from '@/data/subscriptionPlanCopy';

const COPY={
 en:{title:'Choose Your One2OneLove Membership',subtitle:'Simple, stable membership options with no hidden steps.',premiere:'Premiere',premierePrice:'US$9.99 / month',exclusive:'Exclusive',exclusivePrice:'US$19.99 / month',premiereFeatures:['Relationship tools and activities','Community and chat access','Love Notes and relationship support','Member profile and shared features'],exclusiveFeatures:['Everything in Premiere','Exclusive-level feature access','Enhanced relationship tools','Priority premium experiences'],createPremiere:'Create Account for Premiere',createExclusive:'Create Account for Exclusive',starting:'Opening secure checkout…',current:'Current membership',loading:'Checking your membership…',setup:'Finish membership setup to continue.',freeSignup:'OPEN HOUSE BROWSING IS FREE!',noCard:'No account or card is needed to browse. A valid credit or debit card is required to activate a Founding or paid membership.',openHouseTitle:'OPEN HOUSE — BROWSING IS FREE',openHouseBody:'You do not need a membership to keep exploring One2OneLove during the Open House. Membership is for protected, personal and member-only actions.',continueBrowsing:'Continue Free Open House',createFreeAccount:'Create Free Account',foundingCta:'Activate Founding Offer',foundingOpening:'Opening Founding checkout…',foundingCurrent:'Current Founding offer',foundingCompare:'You may activate the Founding offer above or choose a regular paid plan below. Free account signup remains available with no card.',foundingUnavailable:'Founding offer availability is being checked.'},
 es:{title:'Elige Tu Membresía One2OneLove',subtitle:'Opciones simples y estables, sin pasos ocultos.',premiere:'Premiere',premierePrice:'US$9.99 / mes',exclusive:'Exclusive',exclusivePrice:'US$19.99 / mes',premiereFeatures:['Herramientas y actividades de relación','Comunidad y chat','Notas de Amor y apoyo','Perfil y funciones compartidas'],exclusiveFeatures:['Todo en Premiere','Acceso Exclusive','Herramientas ampliadas','Experiencias premium prioritarias'],createPremiere:'Crear Cuenta para Premiere',createExclusive:'Crear Cuenta para Exclusive',starting:'Abriendo pago seguro…',current:'Membresía actual',loading:'Comprobando tu membresía…',setup:'Completa la configuración de membresía para continuar.',freeSignup:'¡NAVEGAR EN OPEN HOUSE ES GRATIS!',noCard:'No necesitas cuenta ni tarjeta para navegar. Se requiere una tarjeta de crédito o débito válida para activar una membresía de Fundador o de pago.',openHouseTitle:'PUERTAS ABIERTAS — NAVEGAR ES GRATIS',openHouseBody:'No necesitas una membresía para seguir explorando One2OneLove durante la jornada de puertas abiertas. La membresía es para acciones protegidas, personales y exclusivas para miembros.',continueBrowsing:'Continuar Explorando Gratis',createFreeAccount:'Crear Cuenta Gratis',foundingCta:'Activar Oferta de Fundador',foundingOpening:'Abriendo checkout de Fundador…',foundingCurrent:'Oferta de Fundador actual',foundingCompare:'Puedes activar la oferta de Fundador arriba o elegir un plan de pago regular abajo. La cuenta gratuita sigue disponible sin tarjeta.',foundingUnavailable:'Comprobando disponibilidad de la oferta de Fundador.'},
 fr:{title:'Choisissez Votre Abonnement One2OneLove',subtitle:'Des options simples et stables, sans étapes cachées.',premiere:'Premiere',premierePrice:'US$9.99 / mois',exclusive:'Exclusive',exclusivePrice:'US$19.99 / mois',premiereFeatures:['Outils et activités relationnels','Communauté et chat','Notes d’Amour et soutien','Profil et fonctions partagées'],exclusiveFeatures:['Tout dans Premiere','Accès Exclusive','Outils relationnels renforcés','Expériences premium prioritaires'],createPremiere:'Créer un Compte Premiere',createExclusive:'Créer un Compte Exclusive',starting:'Ouverture du paiement sécurisé…',current:'Abonnement actuel',loading:'Vérification de votre abonnement…',setup:'Terminez la configuration de votre abonnement pour continuer.',freeSignup:'LA NAVIGATION OPEN HOUSE EST GRATUITE !',noCard:'Aucun compte ni carte n’est requis pour parcourir le site. Une carte de crédit ou de débit valide est requise pour activer un abonnement Fondateur ou payant.',openHouseTitle:'PORTES OUVERTES — NAVIGATION GRATUITE',openHouseBody:'Vous n’avez pas besoin d’un abonnement pour continuer à explorer One2OneLove pendant les Portes Ouvertes. L’abonnement concerne les actions protégées, personnelles et réservées aux membres.',continueBrowsing:'Continuer Gratuitement',createFreeAccount:'Créer un Compte Gratuit',foundingCta:'Activer l’Offre Fondateur',foundingOpening:'Ouverture du paiement Fondateur…',foundingCurrent:'Offre Fondateur actuelle',foundingCompare:'Vous pouvez activer l’offre Fondateur ci-dessus ou choisir un abonnement payant régulier ci-dessous. Le compte gratuit reste disponible sans carte.',foundingUnavailable:'Vérification de la disponibilité de l’offre Fondateur.'},
 it:{title:'Scegli il Tuo Abbonamento One2OneLove',subtitle:'Opzioni semplici e stabili, senza passaggi nascosti.',premiere:'Premiere',premierePrice:'US$9.99 / mese',exclusive:'Exclusive',exclusivePrice:'US$19.99 / mese',premiereFeatures:['Strumenti e attività di relazione','Community e chat','Love Notes e supporto','Profilo e funzioni condivise'],exclusiveFeatures:['Tutto in Premiere','Accesso Exclusive','Strumenti avanzati','Esperienze premium prioritarie'],createPremiere:'Crea Account Premiere',createExclusive:'Crea Account Exclusive',starting:'Apertura pagamento sicuro…',current:'Abbonamento attuale',loading:'Controllo abbonamento…',setup:'Completa la configurazione dell’abbonamento per continuare.',freeSignup:'NAVIGARE NELL’OPEN HOUSE È GRATIS!',noCard:'Non servono account o carta per navigare. È richiesta una carta di credito o debito valida per attivare un abbonamento Fondatore o a pagamento.',openHouseTitle:'OPEN HOUSE — NAVIGAZIONE GRATUITA',openHouseBody:'Non serve un abbonamento per continuare a esplorare One2OneLove durante l’Open House. L’abbonamento serve per azioni protette, personali e riservate ai membri.',continueBrowsing:'Continua Gratis',createFreeAccount:'Crea Account Gratuito',foundingCta:'Attiva Offerta Fondatore',foundingOpening:'Apertura checkout Fondatore…',foundingCurrent:'Offerta Fondatore attuale',foundingCompare:'Puoi attivare l’offerta Fondatore sopra oppure scegliere un piano a pagamento regolare qui sotto. L’account gratuito resta disponibile senza carta.',foundingUnavailable:'Verifica disponibilità dell’offerta Fondatore.'},
 de:{title:'Wählen Sie Ihre One2OneLove-Mitgliedschaft',subtitle:'Einfache, stabile Optionen ohne versteckte Schritte.',premiere:'Premiere',premierePrice:'US$9.99 / Monat',exclusive:'Exclusive',exclusivePrice:'US$19.99 / Monat',premiereFeatures:['Beziehungswerkzeuge und Aktivitäten','Community und Chat','Love Notes und Unterstützung','Profil und gemeinsame Funktionen'],exclusiveFeatures:['Alles in Premiere','Exclusive-Zugriff','Erweiterte Werkzeuge','Premium-Erlebnisse mit Priorität'],createPremiere:'Premiere-Konto Erstellen',createExclusive:'Exclusive-Konto Erstellen',starting:'Sicherer Checkout wird geöffnet…',current:'Aktuelle Mitgliedschaft',loading:'Mitgliedschaft wird geprüft…',setup:'Schließen Sie die Mitgliedschaftseinrichtung ab, um fortzufahren.',freeSignup:'OPEN-HOUSE-STÖBERN IST KOSTENLOS!',noCard:'Zum Stöbern sind weder Konto noch Karte erforderlich. Für die Aktivierung einer Gründer- oder kostenpflichtigen Mitgliedschaft ist eine gültige Kredit- oder Debitkarte erforderlich.',openHouseTitle:'OPEN HOUSE — STÖBERN IST KOSTENLOS',openHouseBody:'Du brauchst während des Open House keine Mitgliedschaft, um One2OneLove weiter zu erkunden. Die Mitgliedschaft ist für geschützte, persönliche und mitgliederbezogene Aktionen.',continueBrowsing:'Kostenlos Weiter Erkunden',createFreeAccount:'Kostenloses Konto Erstellen',foundingCta:'Gründungsangebot Aktivieren',foundingOpening:'Gründer-Checkout wird geöffnet…',foundingCurrent:'Aktuelles Gründungsangebot',foundingCompare:'Sie können das Gründerangebot oben aktivieren oder unten einen regulären kostenpflichtigen Tarif wählen. Ein kostenloses Konto bleibt ohne Karte verfügbar.',foundingUnavailable:'Verfügbarkeit des Gründungsangebots wird geprüft.'}
};

const FOUNDING={
 en:{hero:'FOUNDING MEMBERS — FIRST 200 MEMBERS',title:'Founding Members Launch Offer',first:'Members #1–100: Exclusive FREE for 30 days with a credit/debit card. Unless you choose Premiere before the free period ends, Exclusive continues automatically at US$15.99/month for as long as you remain continuously subscribed.',second:'Members #101–200: Premiere FREE for 30 days with a credit/debit card, then Premiere continues automatically at the regular monthly price.',terms:'Cancel anytime. Your Founding Member badge remains permanently. If a 1st 100 member cancels and later returns, the permanent badge remains but the US$15.99 Founding rate is permanently forfeited and current regular pricing applies. Founding member numbers are reserved and are not recycled.'},
 es:{hero:'MIEMBROS FUNDADORES — PRIMEROS 200 MIEMBROS',title:'Oferta de Lanzamiento para Miembros Fundadores',first:'Miembros #1–100: Exclusive GRATIS durante 30 días con tarjeta de crédito/débito. Si no eliges Premiere antes de que termine el período gratuito, Exclusive continúa automáticamente por US$15.99/mes mientras mantengas la suscripción de forma continua.',second:'Miembros #101–200: Premiere GRATIS durante 30 días con tarjeta de crédito/débito; después Premiere continúa automáticamente al precio mensual regular.',terms:'Cancela en cualquier momento. Tu insignia de Miembro Fundador permanece para siempre. Si un miembro de los primeros 100 cancela y vuelve después, conserva la insignia permanente, pero pierde para siempre la tarifa fundadora de US$15.99 y se aplica el precio regular vigente. Los números de Miembro Fundador quedan reservados y no se reutilizan.'},
 fr:{hero:'MEMBRES FONDATEURS — 200 PREMIERS MEMBRES',title:'Offre de Lancement Membres Fondateurs',first:'Membres #1–100 : Exclusive GRATUIT pendant 30 jours avec carte de crédit/débit. Sauf choix de Premiere avant la fin de la période gratuite, Exclusive continue automatiquement à US$15.99/mois tant que l’abonnement reste actif sans interruption.',second:'Membres #101–200 : Premiere GRATUIT pendant 30 jours avec carte de crédit/débit, puis Premiere continue automatiquement au tarif mensuel normal.',terms:'Annulez à tout moment. Votre badge de Membre Fondateur reste permanent. Si un membre des 100 premiers annule puis revient, le badge permanent reste, mais le tarif fondateur de US$15.99 est définitivement perdu et le tarif normal en vigueur s’applique. Les numéros de membre fondateur sont réservés et ne sont pas réattribués.'},
 it:{hero:'MEMBRI FONDATORI — PRIMI 200 MEMBRI',title:'Offerta Lancio Membri Fondatori',first:'Membri #1–100: Exclusive GRATIS per 30 giorni con carta di credito/debito. Se non scegli Premiere prima della fine del periodo gratuito, Exclusive continua automaticamente a US$15.99/mese finché l’abbonamento resta attivo senza interruzioni.',second:'Membri #101–200: Premiere GRATIS per 30 giorni con carta di credito/debito, poi Premiere continua automaticamente al normale prezzo mensile.',terms:'Annulla in qualsiasi momento. Il badge di Membro Fondatore rimane permanente. Se un membro dei primi 100 annulla e torna in seguito, il badge resta ma la tariffa fondatore di US$15.99 viene persa definitivamente e si applica il prezzo regolare vigente. I numeri dei Membri Fondatori restano riservati e non vengono riutilizzati.'},
 de:{hero:'GRÜNDUNGSMITGLIEDER — ERSTE 200 MITGLIEDER',title:'Startangebot für Gründungsmitglieder',first:'Mitglieder #1–100: Exclusive 30 Tage KOSTENLOS mit Kredit-/Debitkarte. Wenn Sie vor Ablauf des kostenlosen Zeitraums nicht Premiere wählen, läuft Exclusive automatisch für US$15.99/Monat weiter, solange das Abonnement ohne Unterbrechung aktiv bleibt.',second:'Mitglieder #101–200: Premiere 30 Tage KOSTENLOS mit Kredit-/Debitkarte; danach läuft Premiere automatisch zum regulären Monatspreis weiter.',terms:'Jederzeit kündbar. Ihr Gründungsmitglied-Abzeichen bleibt dauerhaft bestehen. Kündigt ein Mitglied der ersten 100 und kehrt später zurück, bleibt das Abzeichen erhalten, aber der Gründungspreis von US$15.99 ist dauerhaft verwirkt und der dann gültige reguläre Preis gilt. Gründungsmitgliedsnummern bleiben reserviert und werden nicht erneut vergeben.'}
};

const PLANS=[{name:'Premiere',price:9.99},{name:'Exclusive',price:19.99}];

function PlanCard({plan,t,planCopy,busy,onChoose,authLoading=false}){
 const features=planCopy.plans[plan.name].features;
 const price=plan.name==='Exclusive'?t.exclusivePrice:t.premierePrice;
 const create=plan.name==='Exclusive'?t.createExclusive:t.createPremiere;
 const cardGradient=plan.name==='Exclusive'
  ? 'from-blue-600 via-violet-500 to-pink-500'
  : 'from-pink-500 via-violet-500 to-blue-600';
 return <section className={`flex min-h-[430px] flex-col rounded-3xl border border-white/30 bg-gradient-to-r ${cardGradient} p-7 text-white shadow-xl`}>
   <div className="text-4xl" aria-hidden="true">{plan.name==='Exclusive'?'👑':'💖'}</div>
   <h2 className="mt-4 text-3xl font-black text-white">{plan.name==='Exclusive'?t.exclusive:t.premiere}</h2>
   <div className="mt-2 text-2xl font-black text-white">{price}</div>
   <ul className="mt-6 flex-1 space-y-3">{features.map(item=><li key={item} className="flex items-start gap-3 text-[1.3125rem] leading-[1.8rem] text-white/95"><Check className="mt-1 h-4 w-4 shrink-0 text-white"/><span>{item}</span></li>)}</ul>
   <Button data-analytics-id={`subscription-plan-${plan.name.toLowerCase()}`} disabled={busy||authLoading} onClick={()=>onChoose(plan)} className="mt-7 w-full border-2 border-white bg-white py-6 text-base font-black text-slate-900 shadow-lg hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70">{busy?t.starting:(authLoading?t.loading:create)}</Button>
 </section>;
}

export default function Subscription(){
 const navigate=useNavigate();
 const [searchParams]=useSearchParams();
 const {currentLanguage}=useLanguage();
 const {isAuthenticated,isLoading:authLoading}=useAuth();
 const t=COPY[currentLanguage]||COPY.en;
 const planCopy=subscriptionPlanCopy[currentLanguage]||subscriptionPlanCopy.en;
 const founding=FOUNDING[currentLanguage]||FOUNDING.en;
 const [busy,setBusy]=useState('');
 const [foundingOffer,setFoundingOffer]=useState(null);
 const [foundingLoading,setFoundingLoading]=useState(true);

 useEffect(()=>{
  let active=true;
  getFoundingOffer().then(offer=>{ if(active) setFoundingOffer(offer); }).finally(()=>{ if(active) setFoundingLoading(false); });
  return ()=>{active=false;};
 },[]);

 const chooseFounding=async ()=>{
  const offer=foundingOffer;
  if(!offer?.available || !offer?.plan) return;
  if(!isAuthenticated){
    navigate('/SignUp?plan='+encodeURIComponent(offer.plan)+'&founding=1&source=founding-offer');
    return;
  }
  setBusy('founding');
  try{
   const result=await handleSubscriptionCheckout({
     name:offer.plan,
     price:Number(offer.recurringPriceCents||0)/100,
     founding:true,
   });
   if(result?.success) return;
   if(result?.status===401 || result?.code==='unauthorized'){
     navigate('/SignUp?plan='+encodeURIComponent(offer.plan)+'&founding=1&source=founding-offer');
     return;
   }
   if(result?.code==='founding_offer_unavailable'){
     setFoundingOffer(await getFoundingOffer());
   }
   toast.error(result?.error||'Unable to continue.');
  }finally{setBusy('');}
 };

 const choose=async plan=>{
  if(!isAuthenticated){
    navigate('/SignUp?plan='+encodeURIComponent(plan.name)+'&source=subscription-plan');
    return;
  }
  setBusy(plan.name);
  try{
   const result=await handleSubscriptionCheckout({name:plan.name,price:plan.price,priceId:plan.name==='Exclusive'?(import.meta.env.VITE_STRIPE_PRICE_EXCLUSIVE||'price_1UFUSKCoKDheG1ASG5zk97Ph'):(import.meta.env.VITE_STRIPE_PRICE_PREMIERE||'price_1UFUSDCoKDheG1AS2AgFooh0')});
   if(result?.success) return;
   if(result?.status===401 || result?.code==='unauthorized'){
     navigate('/SignUp?plan='+encodeURIComponent(plan.name)+'&source=subscription-plan');
     return;
   }
   toast.error(result?.error||'Unable to continue.');
  }finally{setBusy('');}
 };

 const setupRequired=searchParams.get('setup')==='required';
 return <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6" style={{fontFamily:'Arial, Helvetica, sans-serif',overflowAnchor:'none'}}>
  <div className="mx-auto max-w-6xl">
   <header className="text-center"><h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{t.title}</h1><p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">{t.subtitle}</p></header>
   <div className="mt-6 rounded-2xl border-2 border-cyan-300 bg-cyan-50 p-5 text-center shadow-sm">
    <div className="text-sm font-black uppercase tracking-widest text-cyan-800">{t.openHouseTitle}</div>
    <p className="mx-auto mt-2 max-w-3xl text-sm leading-6 text-slate-700">{t.openHouseBody}</p>
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      <Button type="button" data-analytics-id="subscription-create-free-account" onClick={()=>navigate('/SignUp?account=free&type=individual&source=open-house-free')} className="bg-cyan-700 px-5 font-black text-white hover:bg-cyan-800">{t.createFreeAccount}</Button>
      <Button type="button" data-analytics-id="subscription-continue-open-house" onClick={()=>navigate('/Home')} className="bg-slate-900 px-5 font-black text-white hover:bg-slate-800">{t.continueBrowsing}</Button>
    </div>
   </div>
   <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-center shadow-sm">
    <div className="text-sm font-black uppercase tracking-widest text-amber-700">{founding.hero}</div>
    <h2 className="mt-1 text-2xl font-black text-slate-900">{founding.title}</h2>
    {foundingLoading ? <p className="mt-3 text-sm font-semibold text-amber-800">{t.foundingUnavailable}</p> : foundingOffer?.available ? <>
      <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-amber-300 bg-white p-4">
       <div className="text-xs font-black uppercase tracking-widest text-amber-700">{t.foundingCurrent}</div>
       <p className="mt-2 text-lg font-black text-slate-900">{foundingOffer.cohort==='first100'?founding.first:founding.second}</p>
       <Button type="button" disabled={busy==='founding'||authLoading} onClick={chooseFounding} className="mt-4 bg-amber-600 px-6 font-black text-white shadow-md hover:bg-amber-700 disabled:cursor-wait disabled:opacity-70">{busy==='founding'?t.foundingOpening:(authLoading?t.loading:t.foundingCta)}</Button>
      </div>
      <p className="mx-auto mt-3 max-w-3xl text-xs leading-5 text-slate-600">{t.foundingCompare}</p>
    </> : null}
   </div>
   {setupRequired&&<div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-center shadow-sm"><p className="text-sm font-semibold leading-6 text-amber-800">{t.setup}</p></div>}
   <div className="relative mx-auto mt-7 w-full max-w-xl">
    <div aria-hidden="true" className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 opacity-45 blur-lg motion-safe:animate-pulse motion-reduce:animate-none"></div>
    <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 px-5 py-3 text-center text-white shadow-xl">
     <div className="text-xl font-black tracking-wide sm:text-2xl">{t.freeSignup}</div>
     <div className="mt-0.5 text-sm font-semibold text-white/85 sm:text-base">{t.noCard}</div>
    </div>
   </div>
   <div className="mt-5 grid gap-6 md:grid-cols-2">
    {PLANS.map(plan=><PlanCard key={plan.name} plan={plan} t={t} planCopy={planCopy} busy={busy===plan.name} authLoading={authLoading} onChoose={choose}/>) }
   </div>
   <><div className="mt-8 space-y-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-slate-700"><h3 className="text-xl font-black text-slate-900">{founding.title}</h3><p><strong>{founding.first}</strong></p><p><strong>{founding.second}</strong></p><p>{founding.terms}</p></div><div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600"><p>{planCopy.terms.loveNotes}</p><p>{planCopy.terms.cancel}</p></div></>
  </div>
 </main>;
}
