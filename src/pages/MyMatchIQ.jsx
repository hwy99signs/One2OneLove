import { useNavigate } from 'react-router-dom';
import { BrainCircuit, HeartHandshake, LockKeyhole, Sparkles, UsersRound } from 'lucide-react';
import { useLanguage } from './Layout';

const COPY = {
  en: {
    eyebrow: 'Inside One2OneLove',
    title: 'Meet with more insight.',
    highlight: 'Build with more intention.',
    cardTitle: 'Compatibility, inside O2OL.',
    body: 'MyMatchIQ helps you explore compatibility, communication, and the relationship priorities that matter before you invest more time and heart.',
    membership: 'Explore O2OL membership',
    signUp: 'Create your O2OL account',
    membershipNote: 'MyMatchIQ is a One2OneLove feature. One account. One secure membership home.',
    toolsTitle: 'Compatibility tools designed for real life',
    tools: [
      { title: 'Know yourself first', body: 'Reflect on your values, communication style, needs, and relationship priorities.' },
      { title: 'Explore together', body: 'Invite someone you already know into a private compatibility experience.' },
      { title: 'Grow inside O2OL', body: 'Turn insight into shared conversations, activities, and relationship support.' },
    ],
    access: 'Membership access required',
    footer: 'Already met someone elsewhere? Bring the connection to MyMatchIQ—inside One2OneLove.'
  },
  es: {
    eyebrow: 'Dentro de One2OneLove',
    title: 'Conoce con más claridad.',
    highlight: 'Construye con más intención.',
    cardTitle: 'Compatibilidad dentro de O2OL.',
    body: 'MyMatchIQ te ayuda a explorar compatibilidad, comunicación y las prioridades de relación importantes antes de invertir más tiempo y corazón.',
    membership: 'Explorar membresía O2OL',
    signUp: 'Crea tu cuenta O2OL',
    membershipNote: 'MyMatchIQ es una función de One2OneLove. Una cuenta. Un espacio seguro de membresía.',
    toolsTitle: 'Herramientas de compatibilidad para la vida real',
    tools: [
      { title: 'Conócete primero', body: 'Reflexiona sobre tus valores, estilo de comunicación, necesidades y prioridades de relación.' },
      { title: 'Exploren juntos', body: 'Invita a alguien que ya conoces a una experiencia privada de compatibilidad.' },
      { title: 'Crezcan en O2OL', body: 'Convierte la claridad en conversaciones, actividades y apoyo para la relación.' },
    ],
    access: 'Se requiere acceso de membresía',
    footer: '¿Ya conociste a alguien en otro lugar? Lleva esa conexión a MyMatchIQ dentro de One2OneLove.'
  },
  fr: {
    eyebrow: 'Dans One2OneLove',
    title: 'Rencontrez avec plus de clarté.',
    highlight: 'Construisez avec plus d’intention.',
    cardTitle: 'La compatibilité dans O2OL.',
    body: 'MyMatchIQ vous aide à explorer la compatibilité, la communication et les priorités relationnelles importantes avant d’investir davantage de temps et de cœur.',
    membership: 'Découvrir l’abonnement O2OL',
    signUp: 'Créer votre compte O2OL',
    membershipNote: 'MyMatchIQ est une fonctionnalité One2OneLove. Un compte. Un espace d’abonnement sécurisé.',
    toolsTitle: 'Des outils de compatibilité pour la vraie vie',
    tools: [
      { title: 'Apprenez à vous connaître', body: 'Réfléchissez à vos valeurs, votre style de communication, vos besoins et vos priorités.' },
      { title: 'Explorez ensemble', body: 'Invitez une personne que vous connaissez déjà dans une expérience privée de compatibilité.' },
      { title: 'Évoluez dans O2OL', body: 'Transformez les réflexions en conversations, activités et soutien relationnel.' },
    ],
    access: 'Accès membre requis',
    footer: 'Vous avez déjà rencontré quelqu’un ailleurs ? Apportez ce lien à MyMatchIQ dans One2OneLove.'
  },
  it: {
    eyebrow: 'Dentro One2OneLove',
    title: 'Incontra con più chiarezza.',
    highlight: 'Costruisci con più intenzione.',
    cardTitle: 'Compatibilità dentro O2OL.',
    body: 'MyMatchIQ ti aiuta a esplorare compatibilità, comunicazione e priorità relazionali importanti prima di investire più tempo e cuore.',
    membership: 'Scopri l’abbonamento O2OL',
    signUp: 'Crea il tuo account O2OL',
    membershipNote: 'MyMatchIQ è una funzione di One2OneLove. Un account. Uno spazio di abbonamento sicuro.',
    toolsTitle: 'Strumenti di compatibilità per la vita reale',
    tools: [
      { title: 'Conosci prima te stesso', body: 'Rifletti sui tuoi valori, stile di comunicazione, bisogni e priorità relazionali.' },
      { title: 'Esplorate insieme', body: 'Invita una persona che già conosci in un’esperienza privata di compatibilità.' },
      { title: 'Crescete in O2OL', body: 'Trasforma gli spunti in conversazioni, attività e supporto per la relazione.' },
    ],
    access: 'Accesso membro richiesto',
    footer: 'Hai già conosciuto qualcuno altrove? Porta quella connessione a MyMatchIQ dentro One2OneLove.'
  },
  de: {
    eyebrow: 'In One2OneLove',
    title: 'Lerne dich mit mehr Klarheit kennen.',
    highlight: 'Baue mit mehr Absicht auf.',
    cardTitle: 'Kompatibilität in O2OL.',
    body: 'MyMatchIQ hilft dir, Kompatibilität, Kommunikation und wichtige Beziehungsprioritäten zu erkunden, bevor du mehr Zeit und Herz investierst.',
    membership: 'O2OL-Mitgliedschaft entdecken',
    signUp: 'O2OL-Konto erstellen',
    membershipNote: 'MyMatchIQ ist eine One2OneLove-Funktion. Ein Konto. Ein sicherer Mitgliedschaftsbereich.',
    toolsTitle: 'Kompatibilitäts-Tools für das echte Leben',
    tools: [
      { title: 'Lerne dich zuerst kennen', body: 'Reflektiere deine Werte, deinen Kommunikationsstil, deine Bedürfnisse und Beziehungsprioritäten.' },
      { title: 'Erkundet es gemeinsam', body: 'Lade jemanden, den du bereits kennst, zu einer privaten Kompatibilitätserfahrung ein.' },
      { title: 'Wachst in O2OL', body: 'Macht aus Erkenntnissen gemeinsame Gespräche, Aktivitäten und Beziehungsunterstützung.' },
    ],
    access: 'Mitgliedszugang erforderlich',
    footer: 'Du hast jemanden bereits anderswo kennengelernt? Bring diese Verbindung zu MyMatchIQ in One2OneLove.'
  },
};

const TOOL_ICONS = [BrainCircuit, UsersRound, HeartHandshake];

export default function MyMatchIQ() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const continueToMembership = () => navigate('/Subscription?source=my-matchiq');
  const createAccount = () => navigate('/SignUp?plan=Premiere&source=my-matchiq');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_20%_15%,rgba(168,85,247,0.45),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(236,72,153,0.32),transparent_26%),linear-gradient(140deg,#020617_0%,#172554_52%,#4c1d95_100%)] px-5 py-20 sm:px-8 lg:py-28">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300" />
        <div className="relative mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/40 bg-white/10 px-4 py-2 text-sm font-black tracking-wide text-violet-100"><Sparkles className="h-4 w-4" /> {t.eyebrow}</div>
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">{t.title} <span className="bg-gradient-to-r from-fuchsia-200 via-violet-100 to-cyan-100 bg-clip-text text-transparent">{t.highlight}</span></h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-100 sm:text-xl">{t.body}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={continueToMembership} className="rounded-2xl bg-white px-6 py-4 text-base font-black text-indigo-950 shadow-xl transition hover:scale-[1.02] hover:bg-violet-50">✦ {t.membership}</button>
                <button type="button" onClick={createAccount} className="rounded-2xl border border-white/45 bg-white/10 px-6 py-4 text-base font-black text-white transition hover:bg-white/20">{t.signUp}</button>
              </div>
              <p className="mt-5 text-sm font-semibold text-violet-100">{t.membershipNote}</p>
            </div>
            <div className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/20 bg-slate-950/55 p-6 shadow-2xl backdrop-blur">
              <div className="absolute -right-5 -top-6 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-fuchsia-400 to-violet-600 text-3xl shadow-xl">✦</div>
              <div className="text-xs font-black tracking-[0.2em] text-fuchsia-200">MYMATCHIQ</div>
              <h2 className="mt-3 text-3xl font-black">{t.cardTitle}</h2>
              <div className="mt-6 space-y-3">
                {t.tools.map((tool, index) => {
                  const Icon = TOOL_ICONS[index];
                  return <button type="button" key={tool.title} onClick={continueToMembership} className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-left transition hover:border-fuchsia-200/70 hover:bg-white/15"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-fuchsia-400/20 text-fuchsia-100"><Icon className="h-5 w-5" /></span><span><span className="block font-black">{tool.title}</span><span className="mt-1 block text-sm leading-relaxed text-slate-200">{tool.body}</span></span><LockKeyhole className="ml-auto mt-1 h-4 w-4 shrink-0 text-violet-200" /></button>;
                })}
              </div>
              <div className="mt-5 rounded-xl bg-cyan-300/10 px-4 py-3 text-center text-xs font-black tracking-wide text-cyan-100">{t.access}</div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white px-5 py-8 text-center text-slate-800 sm:px-8"><p className="mx-auto max-w-4xl text-lg font-bold leading-relaxed">{t.footer}</p></section>
    </div>
  );
}
