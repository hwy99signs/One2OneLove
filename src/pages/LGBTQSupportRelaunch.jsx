import React from 'react';
import { Heart, HelpCircle, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const COPY = {
  en: {
    eyebrow: 'LGBTQ+ RELATIONSHIPS', title: 'Every kind of love belongs here.', subtitle: 'One2OneLove is designed to welcome LGBTQ+ members and relationships without pretending we currently operate a therapist directory, legal-information service, or crisis network.',
    body: 'The relaunch focuses on the same practical connection tools for everyone: Love Notes, respectful community conversation, Date Ideas, reflection tools and private member connection. Specialized professional resources can be added only after the professionals, information and regional requirements are properly reviewed.',
    safetyTitle: 'Clear boundaries matter', safety: 'One2OneLove relationship tools and AI features are not therapy, legal advice, medical care or emergency services. For urgent safety, crisis, medical or legal needs, use appropriate qualified/local resources for your location.',
    community: 'Join Live Community', notes: 'Explore Love Notes', dates: 'Browse Date Ideas', help: 'Open Help Center',
    cards: [['Inclusive community', 'Members should be able to participate without One2OneLove manufacturing stereotypes, fake professional endorsements or separate standards of respect.'], ['Privacy first', 'Private profile and conversation data stays separate from the public/community experience under the relaunch privacy model.'], ['Specialized resources later', 'Professional directories, region-specific legal material and crisis resources will be added only when their accuracy, credentials and operating process are ready.']],
  },
  es: {
    eyebrow: 'RELACIONES LGBTQ+', title: 'Toda forma de amor pertenece aquí.', subtitle: 'One2OneLove está diseñado para recibir a miembros y relaciones LGBTQ+ sin fingir que actualmente operamos un directorio de terapeutas, servicio de información legal o red de crisis.',
    body: 'El relanzamiento se enfoca en las mismas herramientas prácticas de conexión para todos: Love Notes, conversación comunitaria respetuosa, Ideas para Citas, reflexión y conexión privada entre miembros. Los recursos profesionales especializados se añadirán solo después de revisar adecuadamente profesionales, información y requisitos regionales.',
    safetyTitle: 'Los límites claros importan', safety: 'Las herramientas de relación y funciones de IA de One2OneLove no son terapia, asesoramiento legal, atención médica ni servicios de emergencia. Para necesidades urgentes de seguridad, crisis, salud o legales, usa recursos locales o profesionales adecuados para tu ubicación.',
    community: 'Entrar a Live Community', notes: 'Explorar Love Notes', dates: 'Ver Ideas para Citas', help: 'Abrir Centro de Ayuda',
    cards: [['Comunidad inclusiva', 'Los miembros deben poder participar sin estereotipos fabricados, falsas recomendaciones profesionales ni estándares diferentes de respeto.'], ['Privacidad primero', 'Los datos privados de perfil y conversación se mantienen separados de la experiencia pública/comunitaria.'], ['Recursos especializados después', 'Directorios profesionales, material legal regional y recursos de crisis se añadirán solo cuando precisión, credenciales y procesos estén listos.']],
  },
  fr: {
    eyebrow: 'RELATIONS LGBTQ+', title: 'Toutes les formes d’amour ont leur place ici.', subtitle: 'One2OneLove accueille les membres et relations LGBTQ+ sans prétendre exploiter actuellement un annuaire de thérapeutes, un service juridique ou un réseau de crise.',
    body: 'La relance se concentre sur les mêmes outils de connexion pratiques pour tous : Love Notes, conversations communautaires respectueuses, idées de rendez-vous, réflexion et connexion privée entre membres. Les ressources spécialisées seront ajoutées seulement après vérification appropriée des professionnels, informations et exigences régionales.',
    safetyTitle: 'Des limites claires sont importantes', safety: 'Les outils relationnels et fonctions IA One2OneLove ne sont ni une thérapie, ni un conseil juridique, ni un soin médical, ni un service d’urgence. Pour un besoin urgent de sécurité, crise, santé ou droit, utilisez les ressources locales ou professionnelles appropriées à votre lieu.',
    community: 'Rejoindre Live Community', notes: 'Explorer Love Notes', dates: 'Voir les Idées de Rendez-vous', help: 'Ouvrir le Centre d’Aide',
    cards: [['Communauté inclusive', 'Les membres doivent pouvoir participer sans stéréotypes fabriqués, faux soutiens professionnels ou normes de respect différentes.'], ['Confidentialité d’abord', 'Les données privées de profil et de conversation restent séparées de l’expérience publique/community.'], ['Ressources spécialisées plus tard', 'Annuaires professionnels, informations juridiques régionales et ressources de crise seront ajoutés seulement lorsque leur exactitude, leurs qualifications et leur fonctionnement seront prêts.']],
  },
  it: {
    eyebrow: 'RELAZIONI LGBTQ+', title: 'Ogni forma d’amore appartiene qui.', subtitle: 'One2OneLove è progettato per accogliere membri e relazioni LGBTQ+ senza fingere di gestire oggi una directory di terapeuti, un servizio di informazioni legali o una rete di crisi.',
    body: 'Il rilancio si concentra sugli stessi strumenti pratici di connessione per tutti: Love Notes, conversazioni rispettose in community, idee per appuntamenti, riflessione e connessione privata tra membri. Le risorse professionali specializzate saranno aggiunte solo dopo una corretta verifica di professionisti, informazioni e requisiti regionali.',
    safetyTitle: 'I limiti chiari contano', safety: 'Gli strumenti relazionali e le funzioni IA One2OneLove non sono terapia, consulenza legale, assistenza medica o servizi di emergenza. Per esigenze urgenti di sicurezza, crisi, salute o legali, usa risorse locali o professionali appropriate alla tua posizione.',
    community: 'Entra nella Live Community', notes: 'Esplora Love Notes', dates: 'Vedi Idee per Appuntamenti', help: 'Apri Centro Assistenza',
    cards: [['Community inclusiva', 'I membri devono poter partecipare senza stereotipi inventati, false approvazioni professionali o standard diversi di rispetto.'], ['Privacy prima di tutto', 'Dati privati di profilo e conversazione restano separati dall’esperienza pubblica/community.'], ['Risorse specializzate più avanti', 'Directory professionali, materiale legale regionale e risorse di crisi verranno aggiunti solo quando accuratezza, credenziali e processo operativo saranno pronti.']],
  },
  de: {
    eyebrow: 'LGBTQ+ BEZIEHUNGEN', title: 'Jede Form von Liebe gehört hierher.', subtitle: 'One2OneLove soll LGBTQ+ Mitglieder und Beziehungen willkommen heißen, ohne vorzugeben, derzeit ein Therapeutenverzeichnis, Rechtsinformationsdienst oder Krisennetz zu betreiben.',
    body: 'Der Relaunch konzentriert sich für alle auf dieselben praktischen Verbindungstools: Love Notes, respektvolle Community-Gespräche, Date-Ideen, Reflexion und private Mitgliederverbindung. Spezialisierte professionelle Ressourcen werden erst hinzugefügt, nachdem Fachleute, Informationen und regionale Anforderungen ordentlich geprüft wurden.',
    safetyTitle: 'Klare Grenzen sind wichtig', safety: 'One2OneLove-Beziehungstools und KI-Funktionen sind keine Therapie, Rechtsberatung, medizinische Versorgung oder Notfalldienste. Bei dringenden Sicherheits-, Krisen-, Gesundheits- oder Rechtsfragen nutzen Sie geeignete qualifizierte/lokale Ressourcen für Ihren Standort.',
    community: 'Live Community Besuchen', notes: 'Love Notes Erkunden', dates: 'Date-Ideen Ansehen', help: 'Hilfezentrum Öffnen',
    cards: [['Inklusive Community', 'Mitglieder sollen ohne erfundene Stereotype, falsche professionelle Empfehlungen oder unterschiedliche Respektstandards teilnehmen können.'], ['Datenschutz zuerst', 'Private Profil- und Gesprächsdaten bleiben vom öffentlichen/community-basierten Erlebnis getrennt.'], ['Spezialisierte Ressourcen später', 'Fachverzeichnisse, regionale Rechtsinformationen und Krisenressourcen kommen erst hinzu, wenn Genauigkeit, Qualifikationen und Betrieb geklärt sind.']],
  },
  nl: {
    eyebrow: 'LGBTQ+ RELATIES', title: 'Elke vorm van liefde hoort hier thuis.', subtitle: 'One2OneLove is bedoeld om LGBTQ+ leden en relaties welkom te heten zonder te doen alsof we nu een therapeutenregister, juridische informatiedienst of crisisnetwerk beheren.',
    body: 'De herlancering richt zich voor iedereen op dezelfde praktische verbindingstools: Love Notes, respectvolle communitygesprekken, date-ideeën, reflectie en privé ledencontact. Gespecialiseerde professionele bronnen worden pas toegevoegd nadat professionals, informatie en regionale vereisten goed zijn beoordeeld.',
    safetyTitle: 'Duidelijke grenzen zijn belangrijk', safety: 'One2OneLove-relatietools en AI-functies zijn geen therapie, juridisch advies, medische zorg of nooddiensten. Gebruik bij urgente veiligheids-, crisis-, medische of juridische behoeften passende gekwalificeerde/lokale middelen voor jouw locatie.',
    community: 'Naar Live Community', notes: 'Bekijk Love Notes', dates: 'Bekijk Date-ideeën', help: 'Open Helpcentrum',
    cards: [['Inclusieve community', 'Leden moeten kunnen deelnemen zonder verzonnen stereotypen, valse professionele aanbevelingen of verschillende normen voor respect.'], ['Privacy eerst', 'Privé profiel- en gespreksgegevens blijven gescheiden van de openbare/community-ervaring.'], ['Gespecialiseerde bronnen later', 'Professionele registers, regionale juridische informatie en crisisbronnen worden pas toegevoegd wanneer nauwkeurigheid, kwalificaties en processen klaar zijn.']],
  },
};

const ICONS = [Users, ShieldCheck, Sparkles];

export default function LGBTQSupportRelaunch() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg"><Heart className="h-8 w-8 fill-current" /></div>
          <p className="text-sm font-black tracking-[0.2em] text-purple-700">{t.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-gray-600">{t.subtitle}</p>
        </div>

        <Card className="mt-10 border-purple-100 shadow-sm"><CardContent className="p-7 text-base leading-8 text-gray-700">{t.body}</CardContent></Card>

        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {t.cards.map(([title, description], index) => {
            const Icon = ICONS[index] || Heart;
            return <Card key={title} className="border-gray-200 shadow-sm"><CardContent className="p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700"><Icon className="h-5 w-5" /></div><h2 className="mt-4 text-lg font-black text-gray-900">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{description}</p></CardContent></Card>;
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
          <div className="flex items-center gap-2 font-black"><HelpCircle className="h-5 w-5" />{t.safetyTitle}</div>
          <p className="mt-2">{t.safety}</p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/Community"><MessageCircle className="mr-2 h-4 w-4" />{t.community}</Link></Button>
          <Button asChild variant="outline"><Link to="/LoveNotes"><Heart className="mr-2 h-4 w-4" />{t.notes}</Link></Button>
          <Button asChild variant="outline"><Link to="/DateIdeas"><Sparkles className="mr-2 h-4 w-4" />{t.dates}</Link></Button>
          <Button asChild variant="outline"><Link to="/HelpCenter"><HelpCircle className="mr-2 h-4 w-4" />{t.help}</Link></Button>
        </div>
      </div>
    </div>
  );
}
