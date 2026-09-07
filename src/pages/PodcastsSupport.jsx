import React from "react";
import { Mic, ArrowLeft, Heart, Users, MessageCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Featured Podcasters",
    subtitle: "A curated home for approved relationship-focused podcasters and selected episodes",
    back: "Back to Support",
    comingSoon: "Featured podcasters are coming soon",
    body: "We are removing placeholder listings and building this section with real podcasters only. Podcasters will appear here after they are reviewed and approved for One2OneLove.",
    whatToExpect: "What You’ll Find Here",
    communication: "Communication",
    communicationDesc: "Conversations about listening, expressing needs, conflict, and connection.",
    dating: "Dating & Relationships",
    datingDesc: "Thoughtful discussions about dating, compatibility, boundaries, and intentional relationships.",
    marriage: "Marriage",
    marriageDesc: "Content focused specifically on married couples, commitment, partnership, and long-term growth.",
    growth: "Personal & Relationship Growth",
    growthDesc: "Episodes that encourage reflection, emotional awareness, responsibility, and healthy relationship habits.",
    note: "Only approved podcasters and real episode information will be displayed here."
  },
  es: {
    title: "Podcasters Destacados",
    subtitle: "Un espacio seleccionado para podcasters aprobados enfocados en relaciones y episodios elegidos",
    back: "Volver al Apoyo",
    comingSoon: "Los podcasters destacados llegarán pronto",
    body: "Estamos eliminando listados de ejemplo y construyendo esta sección solo con podcasters reales. Aparecerán aquí después de ser revisados y aprobados para One2OneLove.",
    whatToExpect: "Qué Encontrarás Aquí",
    communication: "Comunicación",
    communicationDesc: "Conversaciones sobre escuchar, expresar necesidades, conflicto y conexión.",
    dating: "Citas y Relaciones",
    datingDesc: "Debates reflexivos sobre citas, compatibilidad, límites y relaciones intencionales.",
    marriage: "Matrimonio",
    marriageDesc: "Contenido enfocado en parejas casadas, compromiso, compañerismo y crecimiento a largo plazo.",
    growth: "Crecimiento Personal y de Pareja",
    growthDesc: "Episodios que fomentan reflexión, conciencia emocional, responsabilidad y hábitos saludables.",
    note: "Aquí solo se mostrarán podcasters aprobados e información real de episodios."
  },
  fr: {
    title: "Podcasteurs en Vedette",
    subtitle: "Un espace sélectionné pour des podcasteurs relationnels approuvés et des épisodes choisis",
    back: "Retour au Soutien",
    comingSoon: "Les podcasteurs en vedette arrivent bientôt",
    body: "Nous supprimons les listes fictives et construisons cette section uniquement avec de vrais podcasteurs. Ils apparaîtront ici après examen et approbation pour One2OneLove.",
    whatToExpect: "Ce Que Vous Trouverez Ici",
    communication: "Communication",
    communicationDesc: "Des conversations sur l'écoute, l'expression des besoins, les conflits et la connexion.",
    dating: "Rencontres et Relations",
    datingDesc: "Des échanges réfléchis sur les rencontres, la compatibilité, les limites et les relations intentionnelles.",
    marriage: "Mariage",
    marriageDesc: "Du contenu destiné aux couples mariés, à l'engagement, au partenariat et à la croissance à long terme.",
    growth: "Croissance Personnelle et Relationnelle",
    growthDesc: "Des épisodes favorisant la réflexion, la conscience émotionnelle, la responsabilité et des habitudes relationnelles saines.",
    note: "Seuls des podcasteurs approuvés et des informations réelles sur les épisodes seront affichés ici."
  },
  it: {
    title: "Podcaster in Evidenza",
    subtitle: "Uno spazio curato per podcaster approvati dedicati alle relazioni e episodi selezionati",
    back: "Torna al Supporto",
    comingSoon: "I podcaster in evidenza arriveranno presto",
    body: "Stiamo eliminando gli elenchi di esempio e costruendo questa sezione solo con podcaster reali. Appariranno qui dopo essere stati esaminati e approvati per One2OneLove.",
    whatToExpect: "Cosa Troverai Qui",
    communication: "Comunicazione",
    communicationDesc: "Conversazioni su ascolto, bisogni, conflitti e connessione.",
    dating: "Appuntamenti e Relazioni",
    datingDesc: "Discussioni su appuntamenti, compatibilità, confini e relazioni intenzionali.",
    marriage: "Matrimonio",
    marriageDesc: "Contenuti dedicati alle coppie sposate, all'impegno, alla collaborazione e alla crescita a lungo termine.",
    growth: "Crescita Personale e Relazionale",
    growthDesc: "Episodi che incoraggiano riflessione, consapevolezza emotiva, responsabilità e abitudini relazionali sane.",
    note: "Qui verranno mostrati solo podcaster approvati e informazioni reali sugli episodi."
  },
  de: {
    title: "Ausgewählte Podcaster",
    subtitle: "Ein kuratierter Bereich für geprüfte beziehungsorientierte Podcaster und ausgewählte Episoden",
    back: "Zurück zur Unterstützung",
    comingSoon: "Ausgewählte Podcaster kommen bald",
    body: "Wir entfernen Platzhalter-Listen und bauen diesen Bereich ausschließlich mit echten Podcastern auf. Sie erscheinen hier nach Prüfung und Freigabe für One2OneLove.",
    whatToExpect: "Was Sie Hier Finden Werden",
    communication: "Kommunikation",
    communicationDesc: "Gespräche über Zuhören, Bedürfnisse, Konflikte und Verbindung.",
    dating: "Dating und Beziehungen",
    datingDesc: "Durchdachte Gespräche über Dating, Kompatibilität, Grenzen und bewusste Beziehungen.",
    marriage: "Ehe",
    marriageDesc: "Inhalte speziell für Ehepaare, Engagement, Partnerschaft und langfristiges Wachstum.",
    growth: "Persönliches und Beziehungsmäßiges Wachstum",
    growthDesc: "Episoden zu Reflexion, emotionalem Bewusstsein, Verantwortung und gesunden Beziehungsgewohnheiten.",
    note: "Hier werden ausschließlich geprüfte Podcaster und echte Episodeninformationen angezeigt."
  }
};

export default function PodcastsSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const categories = [
    { title: t.communication, description: t.communicationDesc, icon: MessageCircle, color: "from-blue-500 to-cyan-600" },
    { title: t.dating, description: t.datingDesc, icon: Heart, color: "from-pink-500 to-rose-600" },
    { title: t.marriage, description: t.marriageDesc, icon: Users, color: "from-purple-500 to-pink-600" },
    { title: t.growth, description: t.growthDesc, icon: TrendingUp, color: "from-emerald-500 to-teal-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link
          to={createPageUrl("CoupleSupport")}
          className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          {t.back}
        </Link>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full mb-6 shadow-xl">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white text-center shadow-xl mb-10">
          <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-bold mb-4">COMING SOON</div>
          <h2 className="text-3xl font-bold mb-3">{t.comingSoon}</h2>
          <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">{t.body}</p>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">{t.whatToExpect}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div key={category.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                <Card className="h-full border-0 shadow-md">
                  <CardHeader>
                    <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{category.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-purple-100 px-6 py-5 text-center text-gray-600 shadow-sm">
          {t.note}
        </div>
      </div>
    </div>
  );
}
