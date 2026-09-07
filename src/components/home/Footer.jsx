import React from "react";
import { Heart, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    tagline: "Making relationships more beautiful, one note at a time.",
    features: "Features",
    support: "Support",
    company: "Company",
    loveNotes: "Love Notes",
    helpCenter: "Help Center",
    aboutUs: "About Us",
    contactUs: "Contact Us",
    blog: "Blog",
    privacyPolicy: "Privacy Policy",
    reviews: "Reviews",
    termsOfService: "Terms of Service",
    suggestions: "Suggestions",
    copyright: "© 2025 Love Notes. Made with ❤️ for couples everywhere."
  },
  es: {
    tagline: "Haciendo las relaciones más hermosas, una nota a la vez.",
    features: "Características",
    support: "Soporte",
    company: "Compañía",
    loveNotes: "Notas de Amor",
    helpCenter: "Centro de Ayuda",
    aboutUs: "Sobre Nosotros",
    contactUs: "Contáctanos",
    blog: "Blog",
    privacyPolicy: "Política de Privacidad",
    reviews: "Reseñas",
    termsOfService: "Términos de Servicio",
    suggestions: "Sugerencias",
    copyright: "© 2025 Love Notes. Hecho con ❤️ para parejas en todas partes."
  },
  fr: {
    tagline: "Rendre les relations plus belles, une note à la fois.",
    features: "Fonctionnalités",
    support: "Support",
    company: "Entreprise",
    loveNotes: "Notes d'Amour",
    helpCenter: "Centre d'Aide",
    aboutUs: "À Propos",
    contactUs: "Nous Contacter",
    blog: "Blog",
    privacyPolicy: "Politique de Confidentialité",
    reviews: "Avis",
    termsOfService: "Conditions d'Utilisation",
    suggestions: "Suggestions",
    copyright: "© 2025 Love Notes. Fait avec ❤️ pour les couples partout."
  },
  it: {
    tagline: "Rendere le relazioni più belle, una nota alla volta.",
    features: "Funzionalità",
    support: "Supporto",
    company: "Azienda",
    loveNotes: "Note d'Amore",
    helpCenter: "Centro Assistenza",
    aboutUs: "Chi Siamo",
    contactUs: "Contattaci",
    blog: "Blog",
    privacyPolicy: "Informativa Privacy",
    reviews: "Recensioni",
    termsOfService: "Termini di Servizio",
    suggestions: "Suggerimenti",
    copyright: "© 2025 Love Notes. Fatto con ❤️ per le coppie ovunque."
  },
  de: {
    tagline: "Beziehungen schöner machen, eine Botschaft nach der anderen.",
    features: "Funktionen",
    support: "Unterstützung",
    company: "Unternehmen",
    loveNotes: "Liebesbotschaften",
    helpCenter: "Hilfezentrum",
    aboutUs: "Über Uns",
    contactUs: "Kontakt",
    blog: "Blog",
    privacyPolicy: "Datenschutz",
    reviews: "Bewertungen",
    termsOfService: "Nutzungsbedingungen",
    suggestions: "Vorschläge",
    copyright: "© 2025 Love Notes. Mit ❤️ für Paare überall gemacht."
  }
};

export default function Footer() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  
  return (
    <footer className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Logo & Tagline */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
              </div>
              <span className="text-xl font-bold">One 2 One Love</span>
            </div>
            <p className="text-white/90 text-sm mb-6">
              {t.tagline}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61583726951948"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Features */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t.features}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to={createPageUrl("LoveNotes")}
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  {t.loveNotes}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t.support}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to={createPageUrl("HelpCenter")}
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  {t.helpCenter}
                </Link>
              </li>
              <li>
                <Link
                  to={createPageUrl("ContactUs")}
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  {t.contactUs}
                </Link>
              </li>
              <li>
                <Link
                  to={createPageUrl("PrivacyPolicy")}
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  {t.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link
                  to={createPageUrl("TermsOfService")}
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  {t.termsOfService}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t.company}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to={createPageUrl("AboutUs")}
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  {t.aboutUs}
                </Link>
              </li>
              <li>
                <Link
                  to={createPageUrl("Blog")}
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  {t.blog}
                </Link>
              </li>
              <li>
                <Link
                  to={createPageUrl("Reviews")}
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  {t.reviews}
                </Link>
              </li>
              <li>
                <Link
                  to={createPageUrl("Suggestions")}
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  {t.suggestions}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-white/20 pt-8 text-center">
          <p className="text-white/90 text-sm">
            {t.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}