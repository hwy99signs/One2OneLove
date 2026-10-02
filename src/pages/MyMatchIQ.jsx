import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Heart, PlayCircle, ShieldCheck, UsersRound, Sparkles, WalletCards } from 'lucide-react';
import { useLanguage } from './Layout';

const COPY = {
  en: {
    assessment: 'Take the assessment',
    meetMembers: 'Meet intentional members',
    biancaEyebrow: 'Meet Bianca — your MyMatchIQ guide',
    biancaTitle: 'Hi, I’m Bianca.',
    biancaBody: 'I will guide you through thoughtful questions and help you turn your answers into a private Personality & Relationship Pattern Report.',
    biancaNote: 'For self-reflection only — not therapy, diagnosis, or a guarantee of compatibility.',
    biancaStart: 'Start with Bianca',
    biancaCredits: 'Explore credits', biancaWatch:'See Bianca in Conversation', biancaWatchSub:'O2OL Studio — Season 1, Episode 1',
    heroAlt: 'MyMatchIQ — When the intention is real, the connection follows.',
    benefitsLabel: 'MyMatchIQ relationship benefits',
    features: [
      { title: 'Discover Compatibility', body: 'Understand what brings you closer.' },
      { title: 'Gain Deeper Insights', body: 'See beyond the surface.' },
      { title: 'Spot Red Flags Early', body: 'Make safer, smarter decisions.' },
      { title: 'Build Stronger Relationships', body: 'Good intentions. Better outcomes.' },
    ],
  },
  es: {
    assessment: 'Realizar la evaluación',
    meetMembers: 'Conoce miembros intencionales',
    biancaEyebrow: 'Conoce a Bianca — tu guía MyMatchIQ', biancaTitle: 'Hola, soy Bianca.', biancaBody: 'Te guiaré con preguntas reflexivas y te ayudaré a convertir tus respuestas en un Informe Privado de Patrones de Personalidad y Relaciones.', biancaNote: 'Solo para autorreflexión; no es terapia, diagnóstico ni garantía de compatibilidad.', biancaStart: 'Comenzar con Bianca', biancaCredits: 'Explorar créditos', biancaWatch:'Ver a Bianca en Conversación', biancaWatchSub:'O2OL Studio — Temporada 1, Episodio 1',
    heroAlt: 'MyMatchIQ — Cuando la intención es real, la conexión sigue.',
    benefitsLabel: 'Beneficios relacionales de MyMatchIQ',
    features: [
      { title: 'Descubre compatibilidad', body: 'Comprende lo que los acerca.' },
      { title: 'Obtén mayor claridad', body: 'Ve más allá de la superficie.' },
      { title: 'Detecta señales de alerta', body: 'Toma decisiones más seguras e inteligentes.' },
      { title: 'Fortalece la relación', body: 'Buenas intenciones. Mejores resultados.' },
    ],
  },
  fr: {
    assessment: 'Faire l’évaluation',
    meetMembers: 'Rencontrer des membres intentionnels',
    biancaEyebrow: 'Rencontrez Bianca — votre guide MyMatchIQ', biancaTitle: 'Bonjour, je suis Bianca.', biancaBody: 'Je vous guiderai avec des questions réfléchies et vous aiderai à transformer vos réponses en un Rapport Privé sur vos Schémas de Personnalité et de Relation.', biancaNote: 'Pour l’autoréflexion uniquement — ce n’est ni une thérapie, ni un diagnostic, ni une garantie de compatibilité.', biancaStart: 'Commencer avec Bianca', biancaCredits: 'Découvrir les crédits', biancaWatch:'Voir Bianca en Conversation', biancaWatchSub:'O2OL Studio — Saison 1, Épisode 1',
    heroAlt: 'MyMatchIQ — Quand l’intention est réelle, la connexion suit.',
    benefitsLabel: 'Avantages relationnels de MyMatchIQ',
    features: [
      { title: 'Découvrez la compatibilité', body: 'Comprenez ce qui vous rapproche.' },
      { title: 'Obtenez plus de clarté', body: 'Voyez au-delà de la surface.' },
      { title: 'Repérez les signaux d’alerte', body: 'Prenez des décisions plus sûres et éclairées.' },
      { title: 'Renforcez la relation', body: 'De bonnes intentions. De meilleurs résultats.' },
    ],
  },
  it: {
    assessment: 'Fai la valutazione',
    meetMembers: 'Incontra membri intenzionali',
    biancaEyebrow: 'Conosci Bianca — la tua guida MyMatchIQ', biancaTitle: 'Ciao, sono Bianca.', biancaBody: 'Ti guiderò attraverso domande ponderate e ti aiuterò a trasformare le risposte in un Rapporto Privato sui Pattern di Personalità e Relazione.', biancaNote: 'Solo per autoriflessione: non è terapia, diagnosi né una garanzia di compatibilità.', biancaStart: 'Inizia con Bianca', biancaCredits: 'Scopri i crediti', biancaWatch:'Guarda Bianca in Conversazione', biancaWatchSub:'O2OL Studio — Stagione 1, Episodio 1',
    heroAlt: 'MyMatchIQ — Quando l’intenzione è reale, la connessione segue.',
    benefitsLabel: 'Benefici relazionali di MyMatchIQ',
    features: [
      { title: 'Scopri la compatibilità', body: 'Capisci cosa vi avvicina.' },
      { title: 'Ottieni più chiarezza', body: 'Guarda oltre la superficie.' },
      { title: 'Individua i segnali d’allarme', body: 'Prendi decisioni più sicure e consapevoli.' },
      { title: 'Costruisci relazioni più forti', body: 'Buone intenzioni. Risultati migliori.' },
    ],
  },
  de: {
    assessment: 'Assessment starten',
    meetMembers: 'Absichtsvolle Mitglieder treffen',
    biancaEyebrow: 'Lernen Sie Bianca kennen — Ihre MyMatchIQ-Begleiterin', biancaTitle: 'Hallo, ich bin Bianca.', biancaBody: 'Ich führe Sie durch durchdachte Fragen und helfe Ihnen, Ihre Antworten in einen privaten Bericht über Persönlichkeits- und Beziehungsmuster zu verwandeln.', biancaNote: 'Nur zur Selbstreflexion — keine Therapie, Diagnose oder Garantie für Kompatibilität.', biancaStart: 'Mit Bianca beginnen', biancaCredits: 'Credits entdecken', biancaWatch:'Bianca im Gespräch Sehen', biancaWatchSub:'O2OL Studio — Staffel 1, Folge 1',
    heroAlt: 'MyMatchIQ — Wenn die Absicht echt ist, folgt die Verbindung.',
    benefitsLabel: 'Beziehungsvorteile von MyMatchIQ',
    features: [
      { title: 'Kompatibilität entdecken', body: 'Verstehe, was euch näher zusammenbringt.' },
      { title: 'Tiefere Einblicke gewinnen', body: 'Sieh über die Oberfläche hinaus.' },
      { title: 'Warnsignale früh erkennen', body: 'Triff sicherere, klügere Entscheidungen.' },
      { title: 'Stärkere Beziehungen aufbauen', body: 'Gute Absichten. Bessere Ergebnisse.' },
    ],
  },
};

const FEATURE_ICONS = [Heart, BrainCircuit, ShieldCheck, UsersRound];
const HERO_IMAGES = {
  en: '/assets/mymatchiq-hero-v3-top.webp',
  es: '/assets/mymatchiq-hero-v3-top-es.webp',
  fr: '/assets/mymatchiq-hero-v3-top-fr.webp',
  it: '/assets/mymatchiq-hero-v3-top-it.webp',
  de: '/assets/mymatchiq-hero-v3-top-de.webp',
};
const FEATURE_STYLES = [
  'border-fuchsia-300/70 shadow-[0_0_28px_rgba(236,72,153,0.25)] text-fuchsia-300',
  'border-cyan-300/70 shadow-[0_0_28px_rgba(34,211,238,0.22)] text-cyan-300',
  'border-amber-300/70 shadow-[0_0_28px_rgba(251,191,36,0.22)] text-amber-300',
  'border-violet-300/70 shadow-[0_0_28px_rgba(167,139,250,0.25)] text-violet-300',
];

export default function MyMatchIQ() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const openAssessment = () => navigate('/MyMatchIQ/Assessment');
  const openMeetMembers = () => navigate('/MyMatchIQ/Meet');
  const openCredits = () => navigate('/MyMatchIQ/Credits');
  const openStudio = () => navigate('/O2OLStudio?from=mymatchiq');

  return (
    <main className="min-h-screen bg-[#070312] px-3 py-4 sm:px-5 sm:py-6">
      <section className="mx-auto max-w-[1800px] overflow-hidden rounded-[1.5rem] border border-fuchsia-300/35 bg-black shadow-[0_0_55px_rgba(217,70,239,0.28)] sm:rounded-[2rem]">
        <h1 className="sr-only">MyMatchIQ</h1>
        <div className="relative">
          <img
            src={HERO_IMAGES[currentLanguage] || HERO_IMAGES.en}
            alt={t.heroAlt}
            className="block h-auto w-full"
          />
          <div className="bg-[radial-gradient(ellipse_at_center,rgba(112,12,114,0.55),transparent_65%),linear-gradient(180deg,#100319_0%,#06020c_100%)] px-5 pb-7 pt-5 sm:px-10 sm:pb-10 sm:pt-7">
            <div className="mx-auto grid w-full max-w-[92%] gap-4 sm:grid-cols-2 sm:gap-5">
            <button
              type="button"
              aria-label={t.assessment}
              onClick={openAssessment}
              className="flex w-full items-center justify-center gap-4 rounded-full border-2 border-pink-200/70 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-fuchsia-600 px-5 py-4 text-base font-black uppercase tracking-wide text-white shadow-[0_0_32px_rgba(236,72,153,0.85)] transition hover:scale-[1.015] hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white sm:px-7 sm:text-xl"
            >
              {t.assessment}<span aria-hidden="true" className="text-2xl leading-none sm:text-3xl">›</span>
            </button>
            <button
              type="button"
              aria-label={t.meetMembers}
              onClick={openMeetMembers}
              className="flex w-full items-center justify-center gap-4 rounded-full border-2 border-cyan-200/70 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 px-5 py-4 text-base font-black uppercase tracking-wide text-white shadow-[0_0_32px_rgba(34,211,238,0.55)] transition hover:scale-[1.015] hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white sm:px-7 sm:text-xl"
            >
              {t.meetMembers}<span aria-hidden="true" className="text-2xl leading-none sm:text-3xl">›</span>
            </button>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={t.benefitsLabel} className="mx-auto mt-5 max-w-[1800px] rounded-[1.5rem] border border-violet-300/25 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.22),transparent_40%),linear-gradient(145deg,#100319,#05020c)] p-4 shadow-[0_0_45px_rgba(139,92,246,0.14)] sm:rounded-[2rem] sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {t.features.map((feature, index) => {
            const Icon = FEATURE_ICONS[index];
            return (
              <article key={feature.title} className={`min-h-[190px] rounded-[1.35rem] border bg-black/45 px-4 py-6 text-center backdrop-blur-sm sm:px-6 ${FEATURE_STYLES[index]}`}>
                <Icon className="mx-auto h-11 w-11" strokeWidth={2.4} aria-hidden="true" />
                <h2 className="mt-4 text-base font-black uppercase leading-tight text-white sm:text-lg">{feature.title}</h2>
                <p className="mt-3 text-sm font-medium leading-snug text-white/85 sm:text-base">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-5 grid max-w-[1800px] overflow-hidden rounded-[1.5rem] border border-fuchsia-300/30 bg-[radial-gradient(circle_at_15%_30%,rgba(217,70,239,0.22),transparent_36%),linear-gradient(120deg,#100319,#111b50)] shadow-[0_0_45px_rgba(139,92,246,0.18)] md:grid-cols-[0.82fr_1.18fr] sm:rounded-[2rem]">
        <div className="flex items-center justify-center bg-[radial-gradient(circle_at_44%_20%,rgba(255,255,255,0.25),transparent_32%),linear-gradient(145deg,#8c267e_0%,#4c226f_52%,#152869_100%)] p-6 sm:p-8">
          <img src="/assets/bianca-mymatchiq-portrait-v2.webp" alt="Bianca, MyMatchIQ virtual guide" className="block h-auto w-full max-w-[460px] rounded-[1.5rem] border border-white/25 object-contain shadow-[0_20px_42px_rgba(18,5,35,0.48)]" />
        </div>
        <div className="flex flex-col justify-center px-6 py-9 text-white sm:px-10 sm:py-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200">{t.biancaEyebrow}</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">{t.biancaTitle}</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/85">{t.biancaBody}</p>
          <div className="mt-5 flex items-start gap-2 text-sm leading-6 text-cyan-100"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />{t.biancaNote}</div>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={openAssessment} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-600 px-5 py-3 text-sm font-black shadow-lg transition hover:-translate-y-0.5 hover:brightness-110"><Sparkles className="h-4 w-4" aria-hidden="true" />{t.biancaStart}</button>
            <button type="button" onClick={openStudio} className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/50 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"><PlayCircle className="h-4 w-4" aria-hidden="true" /><span className="text-left"><span className="block">{t.biancaWatch}</span><span className="block text-[0.68rem] font-semibold text-fuchsia-100/80">{t.biancaWatchSub}</span></span></button>
            <button type="button" onClick={openCredits} className="inline-flex items-center gap-2 rounded-full border border-cyan-200/50 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"><WalletCards className="h-4 w-4" aria-hidden="true" />{t.biancaCredits}</button>
          </div>
        </div>
      </section>
    </main>
  );
}
