import React from 'react';
import { CalendarHeart, HeartHandshake, MessageCircleHeart, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Marriage Matters',
    subtitle: 'Marriage deserves care after the wedding, not only when something is wrong.',
    intro: 'A One2OneLove space created specifically for married couples to reconnect, communicate, appreciate each other, and keep growing together.',
    weekly: "This week's marriage reset",
    weeklyCopy: 'Choose one quiet moment this week and talk through these four areas without trying to solve everything at once.',
    resetItems: [
      ['Connection', 'When did we feel closest this week?'],
      ['Communication', 'Is there something we need to understand better about each other?'],
      ['Partnership', 'Where can we make life easier for each other this week?'],
      ['Joy', 'What can we do together simply because it would feel good?'],
    ],
    practice: 'Three simple ways to invest in your marriage',
    practices: [
      ['15-Minute Check-In', 'Put the phones down. Ask: How are you doing, how are we doing, and what do you need from me this week?'],
      ['Specific Appreciation', 'Tell your spouse one specific thing you noticed and appreciated instead of using a general compliment.'],
      ['Mini Date', 'Create a small date without waiting for a special occasion: coffee, a walk, dessert, music, or an uninterrupted conversation.'],
    ],
    promptTitle: 'Need a conversation starter?',
    promptCopy: "Use today's Daily Relationship Question and answer it together.",
    daily: "Today's Question",
    dateIdeas: 'Date Ideas',
    supportTitle: 'Marriage can need support, too',
    supportCopy: 'Use One2OneLove tools to keep working on connection, or seek qualified professional help when the situation calls for it.',
    relationshipSupport: 'Relationship Support',
    globalRoom: 'Global Relationship Room',
    note: 'Marriage Matters offers education, reflection, and connection tools. It does not replace licensed counseling, medical care, legal advice, or emergency services.',
  },
  es: {
    title: 'El Matrimonio Importa',
    subtitle: 'El matrimonio merece cuidado después de la boda, no solo cuando algo va mal.',
    intro: 'Un espacio de One2OneLove creado especialmente para matrimonios que desean reconectarse, comunicarse, valorarse y seguir creciendo juntos.',
    weekly: 'Reinicio matrimonial de esta semana',
    weeklyCopy: 'Elijan un momento tranquilo esta semana y conversen sobre estas cuatro áreas sin intentar resolverlo todo de una vez.',
    resetItems: [
      ['Conexión', '¿Cuándo nos sentimos más unidos esta semana?'],
      ['Comunicación', '¿Hay algo que necesitemos comprender mejor el uno del otro?'],
      ['Compañerismo', '¿Dónde podemos hacernos la vida más fácil esta semana?'],
      ['Alegría', '¿Qué podemos hacer juntos simplemente porque nos haría sentir bien?'],
    ],
    practice: 'Tres maneras sencillas de invertir en su matrimonio',
    practices: [
      ['Conversación de 15 Minutos', 'Dejen los teléfonos. Pregunten: ¿Cómo estás, cómo estamos y qué necesitas de mí esta semana?'],
      ['Aprecio Específico', 'Dile a tu cónyuge algo específico que notaste y apreciaste en lugar de usar un cumplido general.'],
      ['Mini Cita', 'Creen una pequeña cita sin esperar una ocasión especial: café, paseo, postre, música o una conversación sin interrupciones.'],
    ],
    promptTitle: '¿Necesitan iniciar una conversación?',
    promptCopy: 'Usen la Pregunta Diaria para la Relación de hoy y respóndanla juntos.',
    daily: 'Pregunta de Hoy',
    dateIdeas: 'Ideas para Citas',
    supportTitle: 'El matrimonio también puede necesitar apoyo',
    supportCopy: 'Usen las herramientas de One2OneLove para seguir fortaleciendo la conexión y busquen ayuda profesional cualificada cuando sea necesario.',
    relationshipSupport: 'Apoyo para Relaciones',
    globalRoom: 'Sala Global de Relaciones',
    note: 'El Matrimonio Importa ofrece educación, reflexión y herramientas de conexión. No sustituye terapia profesional, atención médica, asesoramiento legal ni servicios de emergencia.',
  },
  fr: {
    title: 'Le Mariage Compte',
    subtitle: "Le mariage mérite de l'attention après le mariage, pas seulement quand quelque chose va mal.",
    intro: 'Un espace One2OneLove créé spécialement pour les couples mariés afin de se reconnecter, communiquer, se valoriser et continuer à grandir ensemble.',
    weekly: 'Réinitialisation du mariage de cette semaine',
    weeklyCopy: 'Choisissez un moment calme cette semaine et discutez de ces quatre domaines sans essayer de tout résoudre en une seule fois.',
    resetItems: [
      ['Connexion', 'Quand nous sommes-nous sentis le plus proches cette semaine ?'],
      ['Communication', 'Y a-t-il quelque chose que nous devrions mieux comprendre l’un de l’autre ?'],
      ['Partenariat', 'Comment pouvons-nous nous faciliter la vie cette semaine ?'],
      ['Joie', 'Que pouvons-nous faire ensemble simplement parce que cela nous ferait du bien ?'],
    ],
    practice: 'Trois façons simples d’investir dans votre mariage',
    practices: [
      ['Bilan de 15 Minutes', 'Posez les téléphones. Demandez : Comment vas-tu, comment allons-nous et de quoi as-tu besoin de ma part cette semaine ?'],
      ['Appréciation Précise', 'Dites à votre conjoint une chose précise que vous avez remarquée et appréciée plutôt qu’un compliment général.'],
      ['Mini Rendez-vous', 'Créez un petit rendez-vous sans attendre une occasion spéciale : café, promenade, dessert, musique ou conversation sans interruption.'],
    ],
    promptTitle: 'Besoin de lancer une conversation ?',
    promptCopy: 'Utilisez la Question Relationnelle du Jour et répondez-y ensemble.',
    daily: 'Question du Jour',
    dateIdeas: 'Idées de Rendez-vous',
    supportTitle: 'Le mariage peut aussi avoir besoin de soutien',
    supportCopy: 'Utilisez les outils One2OneLove pour continuer à nourrir votre connexion et faites appel à un professionnel qualifié lorsque la situation le nécessite.',
    relationshipSupport: 'Soutien aux Relations',
    globalRoom: 'Salle Mondiale des Relations',
    note: 'Le Mariage Compte propose de l’éducation, de la réflexion et des outils de connexion. Il ne remplace pas un suivi professionnel, des soins médicaux, des conseils juridiques ou des services d’urgence.',
  },
  it: {
    title: 'Il Matrimonio Conta',
    subtitle: 'Il matrimonio merita cura dopo il matrimonio, non solo quando qualcosa non va.',
    intro: 'Uno spazio One2OneLove creato appositamente per le coppie sposate che vogliono riconnettersi, comunicare, apprezzarsi e continuare a crescere insieme.',
    weekly: 'Reset matrimoniale di questa settimana',
    weeklyCopy: 'Scegliete un momento tranquillo questa settimana e parlate di queste quattro aree senza cercare di risolvere tutto in una volta.',
    resetItems: [
      ['Connessione', 'Quando ci siamo sentiti più vicini questa settimana?'],
      ['Comunicazione', 'C’è qualcosa che dovremmo comprendere meglio l’uno dell’altra?'],
      ['Collaborazione', 'Dove possiamo renderci la vita più facile questa settimana?'],
      ['Gioia', 'Cosa possiamo fare insieme semplicemente perché ci farebbe stare bene?'],
    ],
    practice: 'Tre modi semplici per investire nel vostro matrimonio',
    practices: [
      ['Check-In di 15 Minuti', 'Mettete via i telefoni. Chiedete: Come stai, come stiamo e di cosa hai bisogno da me questa settimana?'],
      ['Apprezzamento Specifico', 'Dì al tuo coniuge una cosa precisa che hai notato e apprezzato invece di fare un complimento generico.'],
      ['Mini Appuntamento', 'Create un piccolo appuntamento senza aspettare un’occasione speciale: caffè, passeggiata, dessert, musica o una conversazione senza interruzioni.'],
    ],
    promptTitle: 'Serve uno spunto per parlare?',
    promptCopy: 'Usate la Domanda Quotidiana sulla Relazione di oggi e rispondete insieme.',
    daily: 'Domanda di Oggi',
    dateIdeas: 'Idee per Appuntamenti',
    supportTitle: 'Anche il matrimonio può aver bisogno di sostegno',
    supportCopy: 'Usate gli strumenti One2OneLove per continuare a lavorare sulla connessione e cercate un professionista qualificato quando la situazione lo richiede.',
    relationshipSupport: 'Supporto per Relazioni',
    globalRoom: 'Sala Globale delle Relazioni',
    note: 'Il Matrimonio Conta offre educazione, riflessione e strumenti di connessione. Non sostituisce consulenza professionale, cure mediche, consulenza legale o servizi di emergenza.',
  },
  de: {
    title: 'Ehe Zählt',
    subtitle: 'Eine Ehe verdient auch nach der Hochzeit Aufmerksamkeit – nicht nur dann, wenn etwas nicht stimmt.',
    intro: 'Ein One2OneLove-Bereich speziell für Ehepaare, die sich wieder näherkommen, besser kommunizieren, einander wertschätzen und gemeinsam weiterwachsen möchten.',
    weekly: 'Ehe-Reset dieser Woche',
    weeklyCopy: 'Nehmt euch diese Woche einen ruhigen Moment und sprecht über diese vier Bereiche, ohne alles auf einmal lösen zu wollen.',
    resetItems: [
      ['Verbindung', 'Wann haben wir uns diese Woche am nächsten gefühlt?'],
      ['Kommunikation', 'Gibt es etwas, das wir gegenseitig besser verstehen sollten?'],
      ['Partnerschaft', 'Wo können wir uns diese Woche das Leben leichter machen?'],
      ['Freude', 'Was können wir zusammen tun, einfach weil es uns guttun würde?'],
    ],
    practice: 'Drei einfache Wege, in eure Ehe zu investieren',
    practices: [
      ['15-Minuten-Check-In', 'Legt die Handys weg. Fragt: Wie geht es dir, wie geht es uns und was brauchst du diese Woche von mir?'],
      ['Konkrete Wertschätzung', 'Sag deinem Ehepartner eine konkrete Sache, die dir aufgefallen ist und die du schätzt, statt nur ein allgemeines Kompliment zu machen.'],
      ['Mini-Date', 'Plant ein kleines Date, ohne auf einen besonderen Anlass zu warten: Kaffee, Spaziergang, Dessert, Musik oder ein ungestörtes Gespräch.'],
    ],
    promptTitle: 'Braucht ihr einen Gesprächseinstieg?',
    promptCopy: 'Nutzt die heutige Tägliche Beziehungsfrage und beantwortet sie gemeinsam.',
    daily: 'Heutige Frage',
    dateIdeas: 'Date-Ideen',
    supportTitle: 'Auch eine Ehe kann Unterstützung brauchen',
    supportCopy: 'Nutzt One2OneLove-Werkzeuge, um weiter an eurer Verbindung zu arbeiten, und sucht qualifizierte professionelle Hilfe, wenn die Situation es erfordert.',
    relationshipSupport: 'Beziehungsunterstützung',
    globalRoom: 'Globaler Beziehungsraum',
    note: 'Ehe Zählt bietet Bildung, Reflexion und Verbindungshilfen. Es ersetzt keine professionelle Beratung, medizinische Versorgung, Rechtsberatung oder Notfalldienste.',
  },
};

export default function MarriageMatters() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
                <HeartHandshake className="h-4 w-4" aria-hidden="true" /> One2OneLove
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
              <p className="mt-3 text-xl font-semibold text-rose-700">{t.subtitle}</p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{t.intro}</p>
            </div>
            <CalendarHeart className="h-24 w-24 text-rose-200 md:h-32 md:w-32" aria-hidden="true" />
          </div>
        </section>

        <section className="mt-8" aria-labelledby="marriage-reset-heading">
          <div className="mb-5">
            <h2 id="marriage-reset-heading" className="text-2xl font-bold text-slate-900 md:text-3xl">{t.weekly}</h2>
            <p className="mt-2 max-w-3xl leading-7 text-slate-600">{t.weeklyCopy}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.resetItems.map(([title, question]) => (
              <Card key={title} className="rounded-2xl border-rose-100">
                <CardHeader className="pb-2"><CardTitle className="text-lg text-rose-800">{title}</CardTitle></CardHeader>
                <CardContent><p className="leading-6 text-slate-600">{question}</p></CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="marriage-practice-heading">
          <h2 id="marriage-practice-heading" className="text-2xl font-bold text-slate-900 md:text-3xl">{t.practice}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {t.practices.map(([title, copy], index) => (
              <Card key={title} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-800">{index + 1}</div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 leading-6 text-slate-600">{copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl border-pink-100 bg-pink-50/50">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-2 font-semibold text-pink-800"><MessageCircleHeart className="h-5 w-5" aria-hidden="true" />{t.promptTitle}</div>
              <p className="mt-3 leading-7 text-slate-600">{t.promptCopy}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild><Link to="/DailyQuestion">{t.daily}</Link></Button>
                <Button asChild variant="outline"><Link to="/DateIdeas">{t.dateIdeas}</Link></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-cyan-100 bg-cyan-50/50">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-2 font-semibold text-cyan-900"><Users className="h-5 w-5" aria-hidden="true" />{t.supportTitle}</div>
              <p className="mt-3 leading-7 text-slate-600">{t.supportCopy}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild><Link to="/CoupleSupport">{t.relationshipSupport}</Link></Button>
                <Button asChild variant="outline"><Link to="/GlobalRelationshipRoom"><Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />{t.globalRoom}</Link></Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-500">{t.note}</p>
      </div>
    </div>
  );
}
