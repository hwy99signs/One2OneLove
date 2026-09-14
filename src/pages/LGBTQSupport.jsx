import React from 'react';
import { ArrowRight, BookOpen, Heart, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';

const copy = {
  en:{
    title:'LGBTQ+ Relationship Support', subtitle:'Affirming relationship guidance, reflection tools and community for LGBTQ+ people and couples.',
    intro:'Your relationship deserves the same care, respect and practical support as any other relationship.', practical:'Practical Guides', tools:'Use One2OneLove Tools', open:'Open', safety:'If you are in immediate danger or facing threats, contact local emergency services or a qualified local support organization.',
    guides:[
      ['Coming Out or Disclosing Identity as a Couple','Talk about timing, privacy, safety, who gets told, and what support each partner needs. One partner’s readiness should not automatically become the other partner’s timeline.'],
      ['Family Acceptance and Boundaries','You cannot force acceptance, but you can decide what treatment is acceptable around your relationship. Agree on boundaries before difficult family situations happen.'],
      ['External Stress Without Turning on Each Other','Discrimination, rejection or social pressure can create strain inside a relationship. Name the outside stress clearly so your partner does not become the target for pain caused elsewhere.'],
      ['Identity Growth Inside a Relationship','People may learn new things about identity, expression or orientation over time. Curiosity, honesty and room for adjustment can help partners respond without panic or erasure.'],
    ],
    toolCards:[['Relationship Library','Articles and practical guides','ArticlesSupport'],['Relationship Quizzes','Self-reflection tools','RelationshipQuizzes'],['Community Chat','Talk with the One2OneLove community','Chat'],['Date Ideas','Plan meaningful time together','DateIdeas']]
  },
  es:{
    title:'Apoyo para Relaciones LGBTQ+', subtitle:'Orientación afirmativa, herramientas de reflexión y comunidad para personas y parejas LGBTQ+.',
    intro:'Tu relación merece el mismo cuidado, respeto y apoyo práctico que cualquier otra relación.', practical:'Guías Prácticas', tools:'Usa las Herramientas One2OneLove', open:'Abrir', safety:'Si estás en peligro inmediato o enfrentas amenazas, contacta los servicios de emergencia locales o una organización de apoyo local calificada.',
    guides:[
      ['Salir del Clóset o Compartir la Identidad en Pareja','Hablen sobre el momento, la privacidad, la seguridad, a quién contarle y qué apoyo necesita cada persona. La preparación de una pareja no debe imponer el calendario de la otra.'],
      ['Aceptación Familiar y Límites','No pueden obligar a la familia a aceptar, pero sí decidir qué trato es aceptable hacia la relación. Acuerden límites antes de situaciones familiares difíciles.'],
      ['Estrés Externo sin Volverse Uno Contra el Otro','La discriminación, el rechazo o la presión social pueden generar tensión dentro de la relación. Nombren el estrés externo para no convertir a la pareja en el blanco del dolor.'],
      ['Crecimiento de la Identidad Dentro de la Relación','Las personas pueden descubrir aspectos nuevos de su identidad, expresión u orientación. Curiosidad, honestidad y espacio para adaptarse ayudan a responder sin pánico ni negación.'],
    ],
    toolCards:[['Biblioteca de Relaciones','Artículos y guías prácticas','ArticlesSupport'],['Cuestionarios de Relaciones','Herramientas de autorreflexión','RelationshipQuizzes'],['Chat Comunitario','Habla con la comunidad One2OneLove','Chat'],['Ideas para Citas','Planifica tiempo significativo juntos','DateIdeas']]
  },
  fr:{
    title:'Soutien aux Relations LGBTQ+', subtitle:'Conseils affirmatifs, outils de réflexion et communauté pour les personnes et couples LGBTQ+.',
    intro:'Votre relation mérite le même soin, le même respect et le même soutien pratique que toute autre relation.', practical:'Guides Pratiques', tools:'Utiliser les Outils One2OneLove', open:'Ouvrir', safety:'En cas de danger immédiat ou de menaces, contactez les services d’urgence locaux ou une organisation locale qualifiée.',
    guides:[
      ['Coming Out ou Partage de l’Identité en Couple','Parlez du moment, de la vie privée, de la sécurité, des personnes à informer et du soutien dont chacun a besoin. Le rythme de l’un ne doit pas automatiquement imposer celui de l’autre.'],
      ['Acceptation Familiale et Limites','Vous ne pouvez pas forcer l’acceptation, mais vous pouvez décider quel traitement est acceptable envers votre relation. Convenez des limites avant les situations familiales difficiles.'],
      ['Stress Extérieur sans Se Retourner l’un Contre l’autre','Discrimination, rejet ou pression sociale peuvent peser sur le couple. Nommez clairement la source extérieure du stress pour éviter que le partenaire devienne la cible de cette douleur.'],
      ['Évolution de l’Identité dans la Relation','On peut découvrir de nouveaux aspects de son identité, expression ou orientation avec le temps. Curiosité, honnêteté et adaptation peuvent aider sans panique ni effacement.'],
    ],
    toolCards:[['Bibliothèque des Relations','Articles et guides pratiques','ArticlesSupport'],['Quiz Relationnels','Outils d’auto-réflexion','RelationshipQuizzes'],['Chat Communautaire','Parlez avec la communauté One2OneLove','Chat'],['Idées de Rendez-vous','Planifiez du temps significatif ensemble','DateIdeas']]
  },
  it:{
    title:'Supporto per Relazioni LGBTQ+', subtitle:'Guida affermativa, strumenti di riflessione e comunità per persone e coppie LGBTQ+.',
    intro:'La tua relazione merita la stessa cura, rispetto e supporto pratico di qualsiasi altra relazione.', practical:'Guide Pratiche', tools:'Usa gli Strumenti One2OneLove', open:'Apri', safety:'In caso di pericolo immediato o minacce, contatta i servizi di emergenza locali o un’organizzazione locale qualificata.',
    guides:[
      ['Coming Out o Condivisione dell’Identità in Coppia','Parlate di tempi, privacy, sicurezza, chi informare e del supporto necessario a ciascuno. La prontezza di uno non dovrebbe imporre automaticamente i tempi dell’altro.'],
      ['Accettazione Familiare e Confini','Non potete forzare l’accettazione, ma potete decidere quale trattamento è accettabile verso la relazione. Concordate i confini prima delle situazioni familiari difficili.'],
      ['Stress Esterno senza Rivolgersi l’uno Contro l’altro','Discriminazione, rifiuto o pressione sociale possono creare tensione nella coppia. Nominate lo stress esterno per evitare che il partner diventi il bersaglio del dolore.'],
      ['Crescita dell’Identità nella Relazione','Nel tempo si possono scoprire aspetti nuovi di identità, espressione o orientamento. Curiosità, onestà e spazio di adattamento aiutano a rispondere senza panico o cancellazione.'],
    ],
    toolCards:[['Biblioteca delle Relazioni','Articoli e guide pratiche','ArticlesSupport'],['Quiz sulle Relazioni','Strumenti di autoriflessione','RelationshipQuizzes'],['Chat Comunitario','Parla con la comunità One2OneLove','Chat'],['Idee per Appuntamenti','Pianifica tempo significativo insieme','DateIdeas']]
  },
  de:{
    title:'LGBTQ+ Beziehungsunterstützung', subtitle:'Bestärkende Orientierung, Reflexionswerkzeuge und Community für LGBTQ+ Menschen und Paare.',
    intro:'Deine Beziehung verdient dieselbe Fürsorge, denselben Respekt und dieselbe praktische Unterstützung wie jede andere Beziehung.', practical:'Praktische Leitfäden', tools:'One2OneLove Werkzeuge Nutzen', open:'Öffnen', safety:'Bei unmittelbarer Gefahr oder Bedrohungen wende dich an lokale Notdienste oder eine qualifizierte lokale Hilfsorganisation.',
    guides:[
      ['Coming-out oder Identität in der Partnerschaft Teilen','Sprecht über Zeitpunkt, Privatsphäre, Sicherheit, wen ihr informiert und welche Unterstützung beide brauchen. Die Bereitschaft einer Person sollte nicht automatisch den Zeitplan der anderen bestimmen.'],
      ['Familienakzeptanz und Grenzen','Akzeptanz lässt sich nicht erzwingen, aber ihr könnt entscheiden, welche Behandlung eurer Beziehung akzeptabel ist. Vereinbart Grenzen vor schwierigen Familiensituationen.'],
      ['Äußerer Stress, ohne Gegeneinander zu Arbeiten','Diskriminierung, Ablehnung oder sozialer Druck können die Beziehung belasten. Benennt den äußeren Stress klar, damit der Partner nicht zum Ziel von Schmerz wird, der anderswo entstanden ist.'],
      ['Identitätsentwicklung in einer Beziehung','Menschen können im Laufe der Zeit Neues über Identität, Ausdruck oder Orientierung lernen. Neugier, Ehrlichkeit und Anpassungsraum helfen, ohne Panik oder Auslöschung zu reagieren.'],
    ],
    toolCards:[['Beziehungsbibliothek','Artikel und praktische Leitfäden','ArticlesSupport'],['Beziehungsquiz','Werkzeuge zur Selbstreflexion','RelationshipQuizzes'],['Community Chat','Sprich mit der One2OneLove Community','Chat'],['Date-Ideen','Plant wertvolle gemeinsame Zeit','DateIdeas']]
  }
};

export default function LGBTQSupport() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const guideIcons = [Heart, Users, ShieldCheck, Sparkles];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{opacity:0,y:-18}} animate={{opacity:1,y:0}} className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg"><Heart size={32} className="fill-white"/></div>
          <h1 className="mt-5 text-4xl font-black text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-3xl text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <p className="mx-auto mt-4 max-w-3xl rounded-2xl border border-purple-100 bg-white p-4 font-semibold text-slate-700 shadow-sm">{t.intro}</p>
        </motion.div>

        <section className="mt-10">
          <h2 className="text-2xl font-black text-slate-900">{t.practical}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {t.guides.map((guide,index) => { const Icon=guideIcons[index] || Heart; return <div key={guide[0]} className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700"><Icon size={23}/></div><h3 className="mt-4 text-xl font-black text-slate-900">{guide[0]}</h3><p className="mt-3 leading-7 text-slate-600">{guide[1]}</p></div>; })}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black text-slate-900">{t.tools}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.toolCards.map((tool,index) => { const icons=[BookOpen,ShieldCheck,MessageCircle,Heart]; const Icon=icons[index] || Sparkles; return <Link key={tool[0]} to={createPageUrl(tool[2])} className="group rounded-3xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><Icon className="text-purple-600" size={24}/><h3 className="mt-3 font-black text-slate-900">{tool[0]}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{tool[1]}</p><div className="mt-4 inline-flex items-center gap-1 font-black text-purple-600">{t.open}<ArrowRight size={16} className="transition group-hover:translate-x-1"/></div></Link>; })}
          </div>
        </section>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><ShieldCheck className="mt-0.5 shrink-0" size={18}/><p>{t.safety}</p></div>
      </div>
    </div>
  );
}
