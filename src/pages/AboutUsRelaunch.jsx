import React from 'react';
import { Heart, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const COPY = {
  en: {
    eyebrow: 'ABOUT ONE2ONELOVE',
    title: 'We start where dating sites stop.',
    subtitle: 'One2OneLove is being built for what happens after people connect: communication, affection, reflection, shared experiences, and the everyday work of growing a relationship.',
    missionTitle: 'Love. Grow. Evolve. Together.',
    mission: 'Our goal is to give people practical, warm ways to stay connected without pretending technology can replace the people, judgment, care, or professional help a real relationship may need.',
    pillars: [
      ['Connection over performance', 'Love Notes, conversation spaces and relationship tools are designed to support genuine interaction—not fake activity, rankings or manufactured social proof.'],
      ['Private where it should be private', 'Private account information, Love Notes and one-to-one conversations are being separated from public/community experiences and protected with purpose-built access rules.'],
      ['Community without pretending', 'Live Community shows real human presence when people are there. If a room is quiet, an AI Host may invite conversation, but it never pretends humans are present.'],
      ['AI with boundaries', 'AI tools are designed as optional conversation and reflection aids. They are not therapists, emergency services, or substitutes for qualified professional help.'],
    ],
    relaunchTitle: 'What the relaunch is focused on',
    relaunch: 'The relaunch is intentionally focused: Love Notes, Live Community, useful free relationship tools, private member connection, and a simple optional membership for deeper AI and couple tools. Legacy contests, fake statistics, unfinished calls and other prototype features are not part of the relaunch simply because old code exists.',
    free: 'Explore Love Notes',
    community: 'Visit Live Community',
    account: 'Create Free Account',
    note: 'One2OneLove is still in controlled relaunch development. Features that require production databases, external delivery, AI spend, or billing remain subject to staged testing and activation.',
  },
  es: {
    eyebrow: 'SOBRE ONE2ONELOVE', title: 'Empezamos donde terminan los sitios de citas.', subtitle: 'One2OneLove se está construyendo para lo que ocurre después de conectar: comunicación, afecto, reflexión, experiencias compartidas y el trabajo cotidiano de hacer crecer una relación.', missionTitle: 'Ama. Crece. Evoluciona. Juntos.', mission: 'Nuestro objetivo es ofrecer formas prácticas y cálidas de mantenerse conectados sin fingir que la tecnología puede reemplazar a las personas, el criterio, el cuidado o la ayuda profesional que una relación real pueda necesitar.',
    pillars: [['Conexión sobre apariencia', 'Love Notes, conversaciones y herramientas de relación apoyan interacción auténtica, no actividad falsa, rankings ni prueba social fabricada.'], ['Privado cuando debe ser privado', 'La información de cuenta, Love Notes privadas y conversaciones individuales se separan de las experiencias públicas/comunitarias.'], ['Comunidad sin fingir', 'Live Community muestra presencia humana real. Si una sala está tranquila, AI Host puede iniciar una conversación, pero no finge que hay personas.'], ['IA con límites', 'Las herramientas de IA son ayudas opcionales de conversación y reflexión, no terapeutas ni servicios de emergencia.']],
    relaunchTitle: 'En qué se enfoca el relanzamiento', relaunch: 'El relanzamiento es intencionalmente enfocado: Love Notes, Live Community, herramientas gratuitas útiles, conexión privada entre miembros y una membresía opcional sencilla para herramientas más profundas. Concursos antiguos, estadísticas falsas, llamadas inacabadas y otros prototipos no forman parte del relanzamiento solo porque exista código antiguo.', free: 'Explorar Love Notes', community: 'Visitar Live Community', account: 'Crear Cuenta Gratis', note: 'One2OneLove sigue en desarrollo controlado de relanzamiento. Las funciones que requieren bases de datos de producción, entrega externa, gasto de IA o facturación siguen sujetas a pruebas y activación por etapas.'
  },
  fr: {
    eyebrow: 'À PROPOS DE ONE2ONELOVE', title: 'Nous commençons là où les sites de rencontre s’arrêtent.', subtitle: 'One2OneLove est conçu pour ce qui vient après la rencontre : communication, affection, réflexion, expériences partagées et croissance quotidienne de la relation.', missionTitle: 'Aimer. Grandir. Évoluer. Ensemble.', mission: 'Notre objectif est de proposer des moyens pratiques et chaleureux de rester connectés sans prétendre que la technologie remplace les personnes, le jugement, l’attention ou l’aide professionnelle parfois nécessaire.',
    pillars: [['La connexion avant la performance', 'Love Notes, espaces de discussion et outils relationnels soutiennent de vraies interactions, sans activité fictive, classement ou preuve sociale fabriquée.'], ['Privé quand cela doit l’être', 'Les données de compte, Love Notes privées et conversations individuelles sont séparées des expériences publiques et communautaires.'], ['Une communauté sans simulation', 'Live Community affiche une présence humaine réelle. Si une salle est calme, AI Host peut lancer une invitation sans prétendre que des personnes sont présentes.'], ['Une IA avec des limites', 'Les outils IA sont des aides facultatives de conversation et de réflexion, pas des thérapeutes ni des services d’urgence.']],
    relaunchTitle: 'Priorités de la relance', relaunch: 'La relance reste volontairement ciblée : Love Notes, Live Community, outils relationnels gratuits utiles, connexion privée entre membres et adhésion facultative simple pour des outils plus avancés. Les anciens concours, fausses statistiques, appels inachevés et prototypes ne font pas partie de la relance simplement parce que du vieux code existe.', free: 'Explorer Love Notes', community: 'Voir Live Community', account: 'Créer un Compte Gratuit', note: 'One2OneLove est encore en développement contrôlé. Les fonctions nécessitant bases de production, livraison externe, dépenses IA ou facturation restent soumises à des tests et activations par étapes.'
  },
  it: {
    eyebrow: 'CHI È ONE2ONELOVE', title: 'Iniziamo dove finiscono i siti di incontri.', subtitle: 'One2OneLove viene costruito per ciò che accade dopo la connessione: comunicazione, affetto, riflessione, esperienze condivise e crescita quotidiana della relazione.', missionTitle: 'Ama. Cresci. Evolvi. Insieme.', mission: 'Il nostro obiettivo è offrire modi pratici e calorosi per restare connessi senza fingere che la tecnologia possa sostituire persone, giudizio, cura o aiuto professionale.',
    pillars: [['Connessione prima della performance', 'Love Notes, spazi di conversazione e strumenti relazionali sostengono interazioni vere, non attività finta, classifiche o prova sociale inventata.'], ['Privato quando deve esserlo', 'Dati account, Love Notes private e conversazioni individuali vengono separati dalle esperienze pubbliche/community.'], ['Community senza finzioni', 'Live Community mostra presenza umana reale. Se una stanza è tranquilla, AI Host può invitare la conversazione senza fingere che ci siano persone.'], ['IA con limiti', 'Gli strumenti IA sono aiuti opzionali per conversazione e riflessione, non terapeuti o servizi di emergenza.']],
    relaunchTitle: 'Su cosa si concentra il rilancio', relaunch: 'Il rilancio è intenzionalmente focalizzato: Love Notes, Live Community, strumenti gratuiti utili, connessione privata tra membri e un semplice abbonamento opzionale per strumenti più profondi. Vecchi concorsi, statistiche false, chiamate incomplete e altri prototipi non fanno parte del rilancio solo perché esiste vecchio codice.', free: 'Esplora Love Notes', community: 'Visita Live Community', account: 'Crea Account Gratuito', note: 'One2OneLove è ancora in sviluppo controllato. Le funzioni che richiedono database di produzione, consegna esterna, costi IA o fatturazione restano soggette a test e attivazione graduale.'
  },
  de: {
    eyebrow: 'ÜBER ONE2ONELOVE', title: 'Wir beginnen dort, wo Dating-Seiten aufhören.', subtitle: 'One2OneLove wird für das gebaut, was nach dem Kennenlernen kommt: Kommunikation, Zuneigung, Reflexion, gemeinsame Erlebnisse und tägliches Beziehungswachstum.', missionTitle: 'Lieben. Wachsen. Entwickeln. Gemeinsam.', mission: 'Unser Ziel ist es, praktische und warme Wege zur Verbindung anzubieten, ohne so zu tun, als könne Technologie Menschen, Urteilsvermögen, Fürsorge oder professionelle Hilfe ersetzen.',
    pillars: [['Verbindung statt Inszenierung', 'Love Notes, Gesprächsräume und Beziehungstools unterstützen echte Interaktion statt Fake-Aktivität, Rankings oder erfundener sozialer Beweise.'], ['Privat, wo es privat sein soll', 'Kontodaten, private Love Notes und Einzelgespräche werden von öffentlichen/community-basierten Erfahrungen getrennt.'], ['Community ohne Vortäuschung', 'Live Community zeigt echte menschliche Präsenz. Ist ein Raum ruhig, kann AI Host ein Gespräch anstoßen, ohne Menschen vorzutäuschen.'], ['KI mit Grenzen', 'KI-Tools sind optionale Hilfen für Gespräch und Reflexion, keine Therapeuten oder Notfalldienste.']],
    relaunchTitle: 'Worauf sich der Relaunch konzentriert', relaunch: 'Der Relaunch bleibt bewusst fokussiert: Love Notes, Live Community, nützliche kostenlose Beziehungstools, private Mitgliederverbindung und eine einfache optionale Mitgliedschaft für tiefere Werkzeuge. Alte Wettbewerbe, falsche Statistiken, unfertige Anrufe und andere Prototypen gehören nicht zum Relaunch nur weil alter Code existiert.', free: 'Love Notes Erkunden', community: 'Live Community Besuchen', account: 'Kostenloses Konto Erstellen', note: 'One2OneLove befindet sich weiterhin in kontrollierter Relaunch-Entwicklung. Funktionen mit Produktionsdatenbanken, externer Zustellung, KI-Kosten oder Abrechnung bleiben gestaffelten Tests und Aktivierungen vorbehalten.'
  },
  nl: {
    eyebrow: 'OVER ONE2ONELOVE', title: 'Wij beginnen waar datingsites stoppen.', subtitle: 'One2OneLove wordt gebouwd voor wat er na contact gebeurt: communicatie, genegenheid, reflectie, gedeelde ervaringen en dagelijkse groei van een relatie.', missionTitle: 'Liefde. Groei. Evolueer. Samen.', mission: 'Ons doel is praktische, warme manieren te bieden om verbonden te blijven zonder te doen alsof technologie mensen, oordeel, zorg of professionele hulp kan vervangen.',
    pillars: [['Verbinding boven vertoon', 'Love Notes, gespreksruimtes en relatietools ondersteunen echte interactie, niet nepactiviteit, ranglijsten of verzonnen sociale bewijskracht.'], ['Privé waar het privé hoort', 'Accountgegevens, privé Love Notes en één-op-één gesprekken worden gescheiden van openbare/community-ervaringen.'], ['Community zonder te doen alsof', 'Live Community toont echte menselijke aanwezigheid. Is een ruimte stil, dan kan AI Host uitnodigen tot gesprek zonder mensen te verzinnen.'], ['AI met grenzen', 'AI-tools zijn optionele hulpmiddelen voor gesprek en reflectie, geen therapeuten of nooddiensten.']],
    relaunchTitle: 'Waar de herlancering op focust', relaunch: 'De herlancering blijft bewust gericht op Love Notes, Live Community, nuttige gratis relatietools, privé ledencontact en een eenvoudig optioneel lidmaatschap voor diepere tools. Oude wedstrijden, nepstatistieken, onafgemaakte belopties en andere prototypes horen niet bij de herlancering alleen omdat oude code bestaat.', free: 'Bekijk Love Notes', community: 'Bezoek Live Community', account: 'Gratis Account Maken', note: 'One2OneLove is nog in gecontroleerde herlanceringsontwikkeling. Functies die productiegegevens, externe bezorging, AI-kosten of facturatie vereisen blijven onder gefaseerde tests en activering.'
  },
};

const ICONS = [Heart, ShieldCheck, Users, Sparkles];

export default function AboutUsRelaunch() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-black tracking-[0.2em] text-pink-700">{t.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900 sm:text-6xl">{t.title}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-gray-600">{t.subtitle}</p>
        </div>

        <section className="mx-auto mt-12 max-w-4xl rounded-3xl bg-gradient-to-r from-pink-600 to-purple-600 p-8 text-white shadow-xl sm:p-10">
          <Heart className="h-9 w-9 fill-current" />
          <h2 className="mt-4 text-3xl font-black">{t.missionTitle}</h2>
          <p className="mt-4 text-lg leading-8 text-pink-50">{t.mission}</p>
        </section>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {t.pillars.map(([title, body], index) => {
            const Icon = ICONS[index] || Heart;
            return (
              <Card key={title} className="border-pink-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-700"><Icon className="h-5 w-5" /></div>
                  <h2 className="mt-4 text-xl font-black text-gray-900">{title}</h2>
                  <p className="mt-2 leading-7 text-gray-600">{body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <section className="mt-10 rounded-3xl border border-purple-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="flex items-center gap-3"><MessageCircle className="h-6 w-6 text-purple-700" /><h2 className="text-2xl font-black text-gray-900">{t.relaunchTitle}</h2></div>
          <p className="mt-4 leading-8 text-gray-600">{t.relaunch}</p>
          <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{t.note}</p>
        </section>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-gradient-to-r from-pink-600 to-purple-600 text-white"><Link to="/LoveNotes">{t.free}</Link></Button>
          <Button asChild variant="outline"><Link to="/Community">{t.community}</Link></Button>
          <Button asChild variant="outline"><Link to="/SignUp">{t.account}</Link></Button>
        </div>
      </div>
    </div>
  );
}
