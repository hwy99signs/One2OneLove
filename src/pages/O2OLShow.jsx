import React from 'react';
import { HeartHandshake, MessageCircleHeart, Radio, Sparkles, Tv2, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'The O2OL Show',
    subtitle: 'Real conversations about love, marriage, dating, and the work of staying connected.',
    intro: 'O2OL and AMORA bring thoughtful, practical relationship conversations into the One2OneLove studio. Episodes are designed to open discussion—not tell you what your relationship must look like.',
    hostsTitle: 'Meet the hosts',
    o2ol: 'O2OL',
    o2olCopy: 'Thoughtful, calm, reflective, and focused on helping people consider another perspective.',
    amora: 'AMORA',
    amoraCopy: 'Warm, empathetic, insightful, and willing to ask the questions couples sometimes avoid.',
    studioTitle: 'From the One2OneLove studio',
    studioCopy: 'The permanent O2OL studio keeps the One2OneLove heart-tree identity visible while O2OL, AMORA, guests, and approved viewer voices explore relationship topics together.',
    topicsTitle: 'Conversation lanes',
    topics: [
      ['Love & Communication', 'How couples listen, express needs, repair tension, and stay emotionally connected.'],
      ['Marriage Matters', 'Conversations created specifically for married couples and the everyday work of protecting a marriage.'],
      ['Modern Dating', 'Clear-eyed conversations about expectations, dating culture, compatibility, boundaries, and connection.'],
      ['Viewer Questions', 'Questions and perspectives from the One2OneLove community can help shape future conversations.'],
    ],
    room: 'Open the Global Relationship Room',
    daily: 'Try today’s relationship question',
    marriage: 'Visit Marriage Matters',
    note: 'O2OL Show content is educational and conversational. It is not a substitute for licensed counseling, medical care, legal advice, or emergency services.',
  },
  es: {
    title: 'El Programa O2OL',
    subtitle: 'Conversaciones reales sobre amor, matrimonio, citas y el trabajo de mantenerse conectados.',
    intro: 'O2OL y AMORA llevan conversaciones reflexivas y prácticas sobre relaciones al estudio de One2OneLove. Los episodios buscan abrir diálogo, no decirte cómo debe ser tu relación.',
    hostsTitle: 'Conoce a los anfitriones',
    o2ol: 'O2OL',
    o2olCopy: 'Reflexivo, sereno y enfocado en ayudar a las personas a considerar otra perspectiva.',
    amora: 'AMORA',
    amoraCopy: 'Cálida, empática, perspicaz y dispuesta a hacer las preguntas que las parejas a veces evitan.',
    studioTitle: 'Desde el estudio One2OneLove',
    studioCopy: 'El estudio permanente O2OL mantiene visible la identidad del árbol-corazón de One2OneLove mientras O2OL, AMORA, invitados y voces aprobadas de la audiencia exploran temas de relaciones.',
    topicsTitle: 'Líneas de conversación',
    topics: [
      ['Amor y Comunicación', 'Cómo las parejas escuchan, expresan necesidades, reparan tensiones y mantienen la conexión emocional.'],
      ['El Matrimonio Importa', 'Conversaciones creadas específicamente para matrimonios y el trabajo cotidiano de proteger la relación.'],
      ['Citas Modernas', 'Conversaciones claras sobre expectativas, cultura de citas, compatibilidad, límites y conexión.'],
      ['Preguntas de la Audiencia', 'Las preguntas y perspectivas de la comunidad One2OneLove pueden ayudar a dar forma a conversaciones futuras.'],
    ],
    room: 'Abrir la Sala Global de Relaciones',
    daily: 'Probar la pregunta de relación de hoy',
    marriage: 'Visitar El Matrimonio Importa',
    note: 'El contenido del Programa O2OL es educativo y conversacional. No sustituye terapia profesional, atención médica, asesoramiento legal ni servicios de emergencia.',
  },
  fr: {
    title: 'L’Émission O2OL',
    subtitle: 'De vraies conversations sur l’amour, le mariage, les rencontres et le travail nécessaire pour rester proches.',
    intro: 'O2OL et AMORA proposent dans le studio One2OneLove des conversations relationnelles réfléchies et pratiques. Les épisodes ouvrent le dialogue sans imposer un modèle de relation.',
    hostsTitle: 'Rencontrez les animateurs',
    o2ol: 'O2OL',
    o2olCopy: 'Réfléchi, calme et centré sur l’idée d’aider chacun à considérer un autre point de vue.',
    amora: 'AMORA',
    amoraCopy: 'Chaleureuse, empathique, perspicace et prête à poser les questions que les couples évitent parfois.',
    studioTitle: 'Depuis le studio One2OneLove',
    studioCopy: 'Le studio permanent O2OL garde visible l’identité arbre-cœur de One2OneLove pendant qu’O2OL, AMORA, les invités et des voix de spectateurs approuvées explorent ensemble les sujets relationnels.',
    topicsTitle: 'Axes de conversation',
    topics: [
      ['Amour & Communication', 'Comment les couples écoutent, expriment leurs besoins, réparent les tensions et entretiennent la connexion émotionnelle.'],
      ['Le Mariage Compte', 'Des conversations pensées spécialement pour les couples mariés et le travail quotidien qui protège un mariage.'],
      ['Rencontres Modernes', 'Des discussions lucides sur les attentes, la culture des rencontres, la compatibilité, les limites et la connexion.'],
      ['Questions des Spectateurs', 'Les questions et points de vue de la communauté One2OneLove peuvent nourrir les futures conversations.'],
    ],
    room: 'Ouvrir la Salle Mondiale des Relations',
    daily: 'Essayer la question relationnelle du jour',
    marriage: 'Visiter Le Mariage Compte',
    note: 'Le contenu de l’Émission O2OL est éducatif et conversationnel. Il ne remplace pas une thérapie professionnelle, des soins médicaux, des conseils juridiques ou des services d’urgence.',
  },
  it: {
    title: 'Lo Show O2OL',
    subtitle: 'Conversazioni vere su amore, matrimonio, appuntamenti e sul lavoro necessario per restare connessi.',
    intro: 'O2OL e AMORA portano nello studio One2OneLove conversazioni riflessive e pratiche sulle relazioni. Gli episodi servono ad aprire il dialogo, non a imporre come debba essere una relazione.',
    hostsTitle: 'Conosci i conduttori',
    o2ol: 'O2OL',
    o2olCopy: 'Riflessivo, calmo e concentrato sull’aiutare le persone a considerare un’altra prospettiva.',
    amora: 'AMORA',
    amoraCopy: 'Calda, empatica, perspicace e pronta a fare le domande che le coppie a volte evitano.',
    studioTitle: 'Dallo studio One2OneLove',
    studioCopy: 'Lo studio permanente O2OL mantiene visibile l’identità albero-cuore di One2OneLove mentre O2OL, AMORA, ospiti e voci approvate degli spettatori esplorano insieme temi relazionali.',
    topicsTitle: 'Percorsi di conversazione',
    topics: [
      ['Amore e Comunicazione', 'Come le coppie ascoltano, esprimono bisogni, riparano le tensioni e mantengono la connessione emotiva.'],
      ['Il Matrimonio Conta', 'Conversazioni create appositamente per coppie sposate e per il lavoro quotidiano che protegge un matrimonio.'],
      ['Appuntamenti Moderni', 'Conversazioni lucide su aspettative, cultura degli appuntamenti, compatibilità, confini e connessione.'],
      ['Domande degli Spettatori', 'Domande e punti di vista della comunità One2OneLove possono contribuire a plasmare le conversazioni future.'],
    ],
    room: 'Apri la Sala Globale delle Relazioni',
    daily: 'Prova la domanda relazionale di oggi',
    marriage: 'Visita Il Matrimonio Conta',
    note: 'Il contenuto dello Show O2OL è educativo e conversazionale. Non sostituisce consulenza professionale, cure mediche, consulenza legale o servizi di emergenza.',
  },
  de: {
    title: 'Die O2OL Show',
    subtitle: 'Echte Gespräche über Liebe, Ehe, Dating und die Arbeit, miteinander verbunden zu bleiben.',
    intro: 'O2OL und AMORA bringen nachdenkliche, praktische Beziehungsgespräche ins One2OneLove-Studio. Die Folgen sollen Gespräche öffnen und nicht vorschreiben, wie eine Beziehung aussehen muss.',
    hostsTitle: 'Die Gastgeber',
    o2ol: 'O2OL',
    o2olCopy: 'Nachdenklich, ruhig und darauf ausgerichtet, Menschen eine weitere Perspektive zu eröffnen.',
    amora: 'AMORA',
    amoraCopy: 'Warm, empathisch, klug und bereit, die Fragen zu stellen, denen Paare manchmal ausweichen.',
    studioTitle: 'Aus dem One2OneLove-Studio',
    studioCopy: 'Das feste O2OL-Studio hält die Herzbaum-Identität von One2OneLove sichtbar, während O2OL, AMORA, Gäste und freigegebene Zuschauerstimmen Beziehungsthemen gemeinsam erkunden.',
    topicsTitle: 'Gesprächsbereiche',
    topics: [
      ['Liebe & Kommunikation', 'Wie Paare zuhören, Bedürfnisse ausdrücken, Spannungen reparieren und emotional verbunden bleiben.'],
      ['Ehe Zählt', 'Gespräche speziell für Ehepaare und die tägliche Arbeit, die eine Ehe schützt.'],
      ['Modernes Dating', 'Klare Gespräche über Erwartungen, Dating-Kultur, Kompatibilität, Grenzen und Verbindung.'],
      ['Fragen der Zuschauer', 'Fragen und Perspektiven aus der One2OneLove-Community können zukünftige Gespräche mitgestalten.'],
    ],
    room: 'Globalen Beziehungsraum öffnen',
    daily: 'Heutige Beziehungsfrage ausprobieren',
    marriage: 'Ehe Zählt besuchen',
    note: 'Die O2OL Show ist Bildungs- und Gesprächsinhalt. Sie ersetzt keine professionelle Beratung, medizinische Versorgung, Rechtsberatung oder Notfalldienste.',
  },
};

export default function O2OLShow() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-4 py-10 text-white md:py-16">
      <div className="mx-auto max-w-6xl">
        <section className="mx-auto max-w-4xl text-center" aria-labelledby="o2ol-show-title">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Tv2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 id="o2ol-show-title" className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">{t.title}</h1>
          <p className="mt-4 text-xl font-semibold text-cyan-200 md:text-2xl">{t.subtitle}</p>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">{t.intro}</p>
        </section>

        <section className="mt-10" aria-labelledby="o2ol-hosts-title">
          <h2 id="o2ol-hosts-title" className="text-2xl font-bold md:text-3xl">{t.hostsTitle}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200"><Radio className="h-5 w-5" aria-hidden="true" /></div>
                <CardTitle className="pt-2 text-2xl">{t.o2ol}</CardTitle>
              </CardHeader>
              <CardContent><p className="leading-7 text-slate-300">{t.o2olCopy}</p></CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-400/15 text-pink-200"><HeartHandshake className="h-5 w-5" aria-hidden="true" /></div>
                <CardTitle className="pt-2 text-2xl">{t.amora}</CardTitle>
              </CardHeader>
              <CardContent><p className="leading-7 text-slate-300">{t.amoraCopy}</p></CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8" aria-labelledby="o2ol-studio-title">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-violet-200"><Sparkles className="h-5 w-5" aria-hidden="true" /></div>
            <div>
              <h2 id="o2ol-studio-title" className="text-2xl font-bold">{t.studioTitle}</h2>
              <p className="mt-3 leading-7 text-slate-300">{t.studioCopy}</p>
            </div>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="o2ol-topics-title">
          <h2 id="o2ol-topics-title" className="text-2xl font-bold md:text-3xl">{t.topicsTitle}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {t.topics.map(([title, copy], index) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  {index === 3 ? <Users2 className="h-5 w-5 text-cyan-200" aria-hidden="true" /> : <MessageCircleHeart className="h-5 w-5 text-pink-200" aria-hidden="true" />}
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Link to="/GlobalRelationshipRoom">{t.room}</Link></Button>
          <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/DailyQuestion">{t.daily}</Link></Button>
          <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/MarriageMatters">{t.marriage}</Link></Button>
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-5 text-slate-400">{t.note}</p>
      </div>
    </div>
  );
}
