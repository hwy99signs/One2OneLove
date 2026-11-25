import { Link } from 'react-router-dom';
import { useLanguage } from '@/Layout';
import { FEATURE_PRICING } from '@/lib/featurePricing';
import { freePromoMessage } from '@/lib/o2olFreePromo2026';

// Feature List (owner decision, 2026-11-25): this page used to be the
// Feature Price List. One2OneLove is now 100% free — there are no prices,
// no subscriptions, no Credit and no unlocks. The page simply lists what
// the platform includes; every row is FREE. (The route names /FeaturePricing
// and /pricing are kept so existing links keep working.)
const copy = {
  en: { eyebrow: 'One2OneLove Feature List', title: 'Everything is free. No catch.', intro: 'Every feature on One2OneLove is free for everyone — no signup, no card, no Credit, no unlocks. Just a relationship platform.', back: 'Back to One2OneLove', included: 'What you get', price: 'Price', note: 'Features that cost money every time they were used — AI chat replies, AI content generation, AI reports and Love Note texting (SMS) — have been retired. Everything listed here is free and stays free.' },
  es: { eyebrow: 'Lista de Funciones de One2OneLove', title: 'Todo es gratis. Sin trucos.', intro: 'Todas las funciones de One2OneLove son gratuitas para todos — sin registro, sin tarjeta, sin Crédito, sin desbloqueos. Solo una plataforma de relaciones.', back: 'Volver a One2OneLove', included: 'Lo que obtienes', price: 'Precio', note: 'Las funciones que costaban dinero en cada uso — respuestas de chat con IA, generación de contenido con IA, informes de IA y envío de Notas de Amor por SMS — han sido retiradas. Todo lo que aparece aquí es gratis y seguirá siéndolo.' },
  fr: { eyebrow: 'Liste des Fonctionnalités One2OneLove', title: 'Tout est gratuit. Sans piège.', intro: 'Chaque fonctionnalité de One2OneLove est gratuite pour tout le monde — sans inscription, sans carte, sans Crédit, sans déblocage. Simplement une plateforme relationnelle.', back: 'Retour à One2OneLove', included: 'Ce que vous obtenez', price: 'Prix', note: 'Les fonctions qui coûtaient de l’argent à chaque utilisation — réponses de chat IA, génération de contenu IA, rapports IA et envoi de Notes d’Amour par SMS — ont été retirées. Tout ce qui est listé ici est gratuit et le restera.' },
  it: { eyebrow: 'Elenco Funzioni One2OneLove', title: 'Tutto è gratuito. Nessun trucco.', intro: 'Ogni funzione di One2OneLove è gratuita per tutti — nessuna registrazione, nessuna carta, nessun Credito, nessuno sblocco. Solo una piattaforma relazionale.', back: 'Torna a One2OneLove', included: 'Cosa ottieni', price: 'Prezzo', note: 'Le funzioni che costavano denaro a ogni utilizzo — risposte chat IA, generazione di contenuti IA, report IA e invio di Note d’Amore via SMS — sono state ritirate. Tutto ciò che è elencato qui è gratuito e resterà tale.' },
  de: { eyebrow: 'One2OneLove Funktionsliste', title: 'Alles ist kostenlos. Ohne Haken.', intro: 'Jede Funktion auf One2OneLove ist für alle kostenlos — keine Anmeldung, keine Karte, kein Credit, keine Freischaltungen. Einfach eine Beziehungsplattform.', back: 'Zurück zu One2OneLove', included: 'Was du bekommst', price: 'Preis', note: 'Funktionen, die bei jeder Nutzung Geld kosteten — KI-Chat-Antworten, KI-Inhaltserstellung, KI-Berichte und Liebesbotschaften per SMS — wurden eingestellt. Alles hier Aufgeführte ist kostenlos und bleibt es.' },
};
export default function FeaturePricing() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const groups = FEATURE_PRICING.reduce((acc, row) => { (acc[row.category] || (acc[row.category] = [])).push(row); return acc; }, {});
  return <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-pink-50 px-4 py-10"><section className="mx-auto max-w-7xl">
    <div className="rounded-[2rem] bg-gradient-to-r from-indigo-950 via-violet-800 to-fuchsia-700 p-7 text-white shadow-xl sm:p-10"><div className="text-xs font-black uppercase tracking-[.2em] text-amber-200">{t.eyebrow}</div><h1 className="mt-2 text-4xl font-black sm:text-5xl">{t.title}</h1><p className="mt-4 max-w-3xl text-white/80">{t.intro}</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/Home" className="rounded-full bg-amber-300 px-5 py-3 font-black text-indigo-950">{t.back}</Link></div></div>
    <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 font-extrabold text-slate-900">{freePromoMessage(currentLanguage)}</div>
    <div className="mt-8 space-y-8">{Object.entries(groups).map(([group, rows]) => <section key={group} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"><h2 className="bg-slate-950 px-5 py-4 text-xl font-black text-white">{group}</h2><div className="divide-y divide-slate-100">{rows.map(row => <div key={row.code} className="grid gap-3 p-5 md:grid-cols-[1.25fr_3fr_1fr]"><div className="font-black text-slate-900">{row.feature}</div><div><div className="text-[11px] font-black uppercase tracking-wider text-emerald-700">{t.included}</div><div className="mt-1 text-sm leading-6 text-slate-600">{row.free}</div></div><div className="md:text-right"><div className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t.price}</div><div className="mt-1 font-black text-emerald-700">{row.priceLabel}</div></div></div>)}</div></section>)}</div>
    <p className="mx-auto mt-8 max-w-4xl text-center text-xs leading-5 text-slate-500">{t.note}</p>
  </section></main>;
}
