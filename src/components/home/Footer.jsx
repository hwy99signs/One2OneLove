import React from "react";
import { Heart } from "lucide-react";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    tagline: "Love. Grow. Evolve. Together.",
    features: "Relationship Tools",
    support: "Support",
    company: "One2OneLove",
    loveNotes: "Love Notes",
    dailyQuestion: "Daily Relationship Question",
    marriageMatters: "Marriage Matters",
    globalRoom: "Global Relationship Room",
    dateIdeas: "Date Ideas",
    helpCenter: "Help Center",
    relationshipSupport: "Relationship Support",
    contactUs: "Contact Us",
    aboutUs: "About Us",
    blog: "Blog",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    copyright: "One2OneLove. All rights reserved."
  },
  es: {
    tagline: "Ama. Crece. Evoluciona. Juntos.",
    features: "Herramientas para Relaciones",
    support: "Apoyo",
    company: "One2OneLove",
    loveNotes: "Notas de Amor",
    dailyQuestion: "Pregunta Diaria para la Relación",
    marriageMatters: "El Matrimonio Importa",
    globalRoom: "Sala Global de Relaciones",
    dateIdeas: "Ideas para Citas",
    helpCenter: "Centro de Ayuda",
    relationshipSupport: "Apoyo para Relaciones",
    contactUs: "Contáctanos",
    aboutUs: "Sobre Nosotros",
    blog: "Blog",
    privacyPolicy: "Política de Privacidad",
    termsOfService: "Términos de Servicio",
    copyright: "One2OneLove. Todos los derechos reservados."
  },
  fr: {
    tagline: "Aimer. Grandir. Évoluer. Ensemble.",
    features: "Outils Relationnels",
    support: "Soutien",
    company: "One2OneLove",
    loveNotes: "Notes d'Amour",
    dailyQuestion: "Question Relationnelle du Jour",
    marriageMatters: "Le Mariage Compte",
    globalRoom: "Salle Mondiale des Relations",
    dateIdeas: "Idées de Rendez-vous",
    helpCenter: "Centre d'Aide",
    relationshipSupport: "Soutien aux Relations",
    contactUs: "Nous Contacter",
    aboutUs: "À Propos",
    blog: "Blog",
    privacyPolicy: "Politique de Confidentialité",
    termsOfService: "Conditions d'Utilisation",
    copyright: "One2OneLove. Tous droits réservés."
  },
  it: {
    tagline: "Ama. Cresci. Evolvi. Insieme.",
    features: "Strumenti per le Relazioni",
    support: "Supporto",
    company: "One2OneLove",
    loveNotes: "Note d'Amore",
    dailyQuestion: "Domanda Quotidiana sulla Relazione",
    marriageMatters: "Il Matrimonio Conta",
    globalRoom: "Sala Globale delle Relazioni",
    dateIdeas: "Idee per Appuntamenti",
    helpCenter: "Centro Assistenza",
    relationshipSupport: "Supporto per Relazioni",
    contactUs: "Contattaci",
    aboutUs: "Chi Siamo",
    blog: "Blog",
    privacyPolicy: "Informativa Privacy",
    termsOfService: "Termini di Servizio",
    copyright: "One2OneLove. Tutti i diritti riservati."
  },
  de: {
    tagline: "Lieben. Wachsen. Entwickeln. Gemeinsam.",
    features: "Beziehungswerkzeuge",
    support: "Unterstützung",
    company: "One2OneLove",
    loveNotes: "Liebesbotschaften",
    dailyQuestion: "Tägliche Beziehungsfrage",
    marriageMatters: "Ehe Zählt",
    globalRoom: "Globaler Beziehungsraum",
    dateIdeas: "Date-Ideen",
    helpCenter: "Hilfezentrum",
    relationshipSupport: "Beziehungsunterstützung",
    contactUs: "Kontakt",
    aboutUs: "Über Uns",
    blog: "Blog",
    privacyPolicy: "Datenschutz",
    termsOfService: "Nutzungsbedingungen",
    copyright: "One2OneLove. Alle Rechte vorbehalten."
  }
};

const linkClass = "text-white/80 hover:text-white transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-500 rounded";

export default function Footer() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 mb-8">
          <div>
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 mb-4 w-fit">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500 fill-pink-500" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold">One2OneLove</span>
            </Link>
            <p className="text-white/90 text-sm leading-6">{t.tagline}</p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{t.features}</h3>
            <ul className="space-y-2">
              <li><Link to={createPageUrl("LoveNotes")} className={linkClass}>{t.loveNotes}</Link></li>
              <li><Link to="/DailyQuestion" className={linkClass}>{t.dailyQuestion}</Link></li>
              <li><Link to="/MarriageMatters" className={linkClass}>{t.marriageMatters}</Link></li>
              <li><Link to="/GlobalRelationshipRoom" className={linkClass}>{t.globalRoom}</Link></li>
              <li><Link to={createPageUrl("DateIdeas")} className={linkClass}>{t.dateIdeas}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{t.support}</h3>
            <ul className="space-y-2">
              <li><Link to={createPageUrl("HelpCenter")} className={linkClass}>{t.helpCenter}</Link></li>
              <li><Link to={createPageUrl("CoupleSupport")} className={linkClass}>{t.relationshipSupport}</Link></li>
              <li><Link to={createPageUrl("ContactUs")} className={linkClass}>{t.contactUs}</Link></li>
              <li><Link to={createPageUrl("PrivacyPolicy")} className={linkClass}>{t.privacyPolicy}</Link></li>
              <li><Link to={createPageUrl("TermsOfService")} className={linkClass}>{t.termsOfService}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{t.company}</h3>
            <ul className="space-y-2">
              <li><Link to={createPageUrl("AboutUs")} className={linkClass}>{t.aboutUs}</Link></li>
              <li><Link to={createPageUrl("Blog")} className={linkClass}>{t.blog}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center">
          <p className="text-white/90 text-sm">© {year} {t.copyright}</p>
        </div>
      </div>
    </footer>
  );
}