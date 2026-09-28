import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Heart, ShieldCheck, UsersRound } from 'lucide-react';
import { useLanguage } from './Layout';

const COPY = {
  en: {
    assessment: 'Take the assessment',
    meetMembers: 'Meet intentional members',
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
    </main>
  );
}
