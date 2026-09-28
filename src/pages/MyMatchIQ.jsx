import { useNavigate } from 'react-router-dom';
import { useLanguage } from './Layout';

const COPY = {
  en: { assessment: 'Take the assessment' },
  es: { assessment: 'Realizar la evaluación' },
  fr: { assessment: 'Faire l’évaluation' },
  it: { assessment: 'Fai la valutazione' },
  de: { assessment: 'Assessment starten' },
};

export default function MyMatchIQ() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const openMembership = (intent) => navigate(`/Subscription?source=my-matchiq&intent=${intent}`);

  return (
    <main className="min-h-screen bg-[#070312] px-3 py-4 sm:px-5 sm:py-6">
      <section className="mx-auto max-w-[1800px] overflow-hidden rounded-[1.5rem] border border-fuchsia-300/35 bg-black shadow-[0_0_55px_rgba(217,70,239,0.28)] sm:rounded-[2rem]">
        <h1 className="sr-only">MyMatchIQ</h1>
        <div className="relative aspect-[16/9]">
          <img
            src="/assets/mymatchiq-hero-v3.webp"
            alt="MyMatchIQ — When the intention is real, the connection follows."
            className="h-full w-full object-cover"
          />

          <button
            type="button"
            aria-label={t.assessment}
            onClick={() => openMembership('assessment')}
            className="absolute bottom-[5.8%] left-[12.4%] h-[9.9%] w-[75.2%] rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-white hover:bg-white/10"
          />
        </div>
      </section>
    </main>
  );
}
