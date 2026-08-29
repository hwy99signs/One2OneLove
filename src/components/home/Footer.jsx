import React from "react";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LOGO_URL = "https://hphhmjcutesqsdnubnnw.supabase.co/storage/v1/object/public/app-assets/logo.png";

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
    o2olShow: "O2OL Show",
    invite: "Invite Someone",
    privacyPolicy: "Privacy Notice",
    termsOfService: "Terms Overview",
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
    o2olShow: "O2OL Show",
    invite: "Invitar a Alguien",
    privacyPolicy: "Aviso de Privacidad",
    termsOfService: "Resumen de Términos",
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
    o2olShow: "O2OL Show",
    invite: "Inviter Quelqu’un",
    privacyPolicy: "Avis de Confidentialité",
    termsOfService: "Aperçu des Conditions",
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
    o2olShow: "O2OL Show",
    invite: "Invita Qualcuno",
    privacyPolicy: "Informativa Privacy",
    termsOfService: "Panoramica dei Termini",
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
    o2olShow: "O2OL Show",
    invite: "Jemanden Einladen",
    privacyPolicy: "Datenschutzhinweis",
    termsOfService: "Nutzungsübersicht",
    copyright: "One2OneLove. Alle Rechte vorbehalten."
  }
};

const linkClass = "text-white/80 hover:text-white transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-500 rounded";

export default function Footer() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-cyan-500 to-blue-600 py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link to={createPageUrl("Home")} className="mb-4 flex w-fit items-center gap-3">
              <img src={LOGO_URL} alt="One2OneLove" className="h-14 w-auto rounded-lg bg-white/95 p-1" />
            </Link>
            <p className="text-sm leading-6 text-white/90">{t.tagline}</p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">{t.features}</h3>
            <ul className="space-y-2">
              <li><Link to={createPageUrl("LoveNotes")} className={linkClass}>{t.loveNotes}</Link></li>
              <li><Link to="/DailyQuestion" className={linkClass}>{t.dailyQuestion}</Link></li>
              <li><Link to="/MarriageMatters" className={linkClass}>{t.marriageMatters}</Link></li>
              <li><Link to="/GlobalRelationshipRoom" className={linkClass}>{t.globalRoom}</Link></li>
              <li><Link to={createPageUrl("DateIdeas")} className={linkClass}>{t.dateIdeas}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">{t.support}</h3>
            <ul className="space-y-2">
              <li><Link to={createPageUrl("HelpCenter")} className={linkClass}>{t.helpCenter}</Link></li>
              <li><Link to={createPageUrl("CoupleSupport")} className={linkClass}>{t.relationshipSupport}</Link></li>
              <li><Link to={createPageUrl("ContactUs")} className={linkClass}>{t.contactUs}</Link></li>
              <li><Link to={createPageUrl("PrivacyPolicy")} className={linkClass}>{t.privacyPolicy}</Link></li>
              <li><Link to={createPageUrl("TermsOfService")} className={linkClass}>{t.termsOfService}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">{t.company}</h3>
            <ul className="space-y-2">
              <li><Link to={createPageUrl("AboutUs")} className={linkClass}>{t.aboutUs}</Link></li>
              <li><Link to={createPageUrl("O2OLShow")} className={linkClass}>{t.o2olShow}</Link></li>
              <li><Link to={createPageUrl("Invite")} className={linkClass}>{t.invite}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center">
          <p className="text-sm text-white/90">© {year} {t.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
