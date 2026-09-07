import React from "react";
import { Users, MessageCircle, Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Relationship Room",
    comingSoon: "Coming Soon",
    subtitle: "Public topic-based conversations for the One2OneLove community",
    body: "The Relationship Room will be a shared community space where members can enter live relationship discussions, respond to questions from O2OL, Amora, and approved hosts, and talk together around specific relationship topics.",
    publicTitle: "Public Community Conversation",
    publicBody: "This is not private member-to-member messaging. Conversations are topic-based and visible to participants in the room.",
    countTitle: "Live Room Count",
    countBody: "When the room opens, you will be able to see how many people are currently participating before you enter.",
    moderationTitle: "Moderated Discussions",
    moderationBody: "Room topics and participation tools will be designed around respectful, relationship-focused community conversation.",
    back: "Back to Community"
  },
  es: {
    title: "Sala de Relaciones",
    comingSoon: "Próximamente",
    subtitle: "Conversaciones públicas por temas para la comunidad One2OneLove",
    body: "La Sala de Relaciones será un espacio comunitario compartido donde los miembros podrán participar en conversaciones en vivo, responder preguntas de O2OL, Amora y anfitriones aprobados, y conversar sobre temas específicos de relaciones.",
    publicTitle: "Conversación Comunitaria Pública",
    publicBody: "No es mensajería privada entre miembros. Las conversaciones serán por temas y visibles para quienes estén en la sala.",
    countTitle: "Conteo en Vivo",
    countBody: "Cuando la sala esté disponible, podrás ver cuántas personas participan antes de entrar.",
    moderationTitle: "Conversaciones Moderadas",
    moderationBody: "Los temas y herramientas de participación estarán diseñados para conversaciones respetuosas y centradas en relaciones.",
    back: "Volver a Comunidad"
  },
  fr: {
    title: "Salon des Relations",
    comingSoon: "Bientôt Disponible",
    subtitle: "Des conversations publiques par thèmes pour la communauté One2OneLove",
    body: "Le Salon des Relations sera un espace communautaire partagé où les membres pourront rejoindre des discussions en direct, répondre aux questions de O2OL, Amora et d'animateurs approuvés, et échanger autour de thèmes relationnels précis.",
    publicTitle: "Conversation Communautaire Publique",
    publicBody: "Il ne s'agit pas de messagerie privée entre membres. Les conversations sont organisées par thèmes et visibles par les participants du salon.",
    countTitle: "Nombre de Participants en Direct",
    countBody: "Lorsque le salon ouvrira, vous pourrez voir combien de personnes participent avant d'entrer.",
    moderationTitle: "Discussions Modérées",
    moderationBody: "Les sujets et outils de participation seront conçus pour des échanges respectueux centrés sur les relations.",
    back: "Retour à la Communauté"
  },
  it: {
    title: "Sala delle Relazioni",
    comingSoon: "Prossimamente",
    subtitle: "Conversazioni pubbliche per temi per la comunità One2OneLove",
    body: "La Sala delle Relazioni sarà uno spazio comunitario condiviso dove i membri potranno partecipare a discussioni dal vivo, rispondere alle domande di O2OL, Amora e host approvati, e parlare insieme di temi specifici sulle relazioni.",
    publicTitle: "Conversazione Pubblica della Comunità",
    publicBody: "Non è messaggistica privata tra membri. Le conversazioni saranno basate su temi e visibili ai partecipanti nella sala.",
    countTitle: "Conteggio Partecipanti dal Vivo",
    countBody: "Quando la sala sarà disponibile, potrai vedere quante persone stanno partecipando prima di entrare.",
    moderationTitle: "Discussioni Moderate",
    moderationBody: "Temi e strumenti di partecipazione saranno progettati per conversazioni rispettose e focalizzate sulle relazioni.",
    back: "Torna alla Comunità"
  },
  de: {
    title: "Beziehungsraum",
    comingSoon: "Demnächst",
    subtitle: "Öffentliche themenbasierte Gespräche für die One2OneLove-Community",
    body: "Der Beziehungsraum wird ein gemeinsamer Community-Bereich, in dem Mitglieder an Live-Diskussionen teilnehmen, Fragen von O2OL, Amora und freigegebenen Gastgebern beantworten und gemeinsam über bestimmte Beziehungsthemen sprechen können.",
    publicTitle: "Öffentliches Community-Gespräch",
    publicBody: "Dies ist keine private Nachrichtenfunktion zwischen Mitgliedern. Gespräche sind themenbasiert und für die Teilnehmer im Raum sichtbar.",
    countTitle: "Live-Teilnehmerzahl",
    countBody: "Wenn der Raum geöffnet wird, können Sie vor dem Beitritt sehen, wie viele Personen gerade teilnehmen.",
    moderationTitle: "Moderierte Diskussionen",
    moderationBody: "Themen und Teilnahmefunktionen werden für respektvolle, beziehungsorientierte Community-Gespräche gestaltet.",
    back: "Zurück zur Community"
  }
};

export default function Chat() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const features = [
    { icon: MessageCircle, title: t.publicTitle, body: t.publicBody },
    { icon: Users, title: t.countTitle, body: t.countBody },
    { icon: Heart, title: t.moderationTitle, body: t.moderationBody }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          to={createPageUrl("Community")}
          className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t.back}
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-6 shadow-xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold mb-4 ml-3">
            {t.comingSoon}
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-5">{t.subtitle}</p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">{t.body}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white rounded-2xl border border-purple-100 p-6 shadow-md">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h2>
                <p className="text-gray-600 leading-relaxed">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
