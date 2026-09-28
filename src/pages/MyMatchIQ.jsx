import { useNavigate } from 'react-router-dom';
import { useLanguage } from './Layout';

const COPY = {
  en: { assessment: 'Take the assessment', plans: 'View plans', learn: 'Learn more' },
  es: { assessment: 'Realizar la evaluación', plans: 'Ver planes', learn: 'Más información' },
  fr: { assessment: 'Faire l’évaluation', plans: 'Voir les formules', learn: 'En savoir plus' },
  it: { assessment: 'Fai la valutazione', plans: 'Visualizza i piani', learn: 'Scopri di più' },
  de: { assessment: 'Assessment starten', plans: 'Pläne ansehen', learn: 'Mehr erfahren' },
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
            src="/assets/mymatchiq-home-hero.webp"
            alt="MyMatchIQ — When the intention is real, the connection follows."
            className="h-full w-full object-cover"
          />

          <button
            type="button"
            aria-label={t.assessment}
            onClick={() => openMembership('assessment')}
            className="absolute bottom-[10.5%] left-[13.4%] h-[8%] w-[30.4%] rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-white hover:bg-white/10"
          />
          <button
            type="button"
            aria-label={t.plans}
            onClick={() => openMembership('plans')}
            className="absolute bottom-[10.5%] left-[45.9%] h-[8%] w-[18.4%] rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-white hover:bg-white/10"
          />
          <button
            type="button"
            aria-label={t.learn}
            onClick={() => openMembership('learn-more')}
            className="absolute bottom-[10.5%] left-[65.8%] h-[8%] w-[20.8%] rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-white hover:bg-white/10"
          />
        </div>
      </section>
    </main>
  );
}
