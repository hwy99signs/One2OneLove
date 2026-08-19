import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    about: 'About',
    community: 'Community',
    room: 'Global Relationship Room',
    help: 'Help Center',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    tagline: 'Love. Grow. Evolve. Together.',
    rights: 'All rights reserved.',
  },
  es: {
    about: 'Acerca de',
    community: 'Comunidad',
    room: 'Sala Global de Relaciones',
    help: 'Centro de Ayuda',
    contact: 'Contacto',
    privacy: 'Privacidad',
    terms: 'Términos',
    tagline: 'Ama. Crece. Evoluciona. Juntos.',
    rights: 'Todos los derechos reservados.',
  },
  fr: {
    about: 'À Propos',
    community: 'Communauté',
    room: 'Salle Mondiale des Relations',
    help: 'Centre d’Aide',
    contact: 'Contact',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    tagline: 'Aimer. Grandir. Évoluer. Ensemble.',
    rights: 'Tous droits réservés.',
  },
  it: {
    about: 'Chi Siamo',
    community: 'Comunità',
    room: 'Sala Globale delle Relazioni',
    help: 'Centro Assistenza',
    contact: 'Contatti',
    privacy: 'Privacy',
    terms: 'Termini',
    tagline: 'Ama. Cresci. Evolvi. Insieme.',
    rights: 'Tutti i diritti riservati.',
  },
  de: {
    about: 'Über Uns',
    community: 'Community',
    room: 'Globaler Beziehungsraum',
    help: 'Hilfe-Center',
    contact: 'Kontakt',
    privacy: 'Datenschutz',
    terms: 'Bedingungen',
    tagline: 'Lieben. Wachsen. Entwickeln. Gemeinsam.',
    rights: 'Alle Rechte vorbehalten.',
  },
};

export default function SiteFooter() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const year = new Date().getFullYear();

  const links = [
    ['/AboutUs', t.about],
    ['/Community', t.community],
    ['/GlobalRelationshipRoom', t.room],
    ['/HelpCenter', t.help],
    ['/ContactUs', t.contact],
    ['/PrivacyPolicy', t.privacy],
    ['/TermsOfService', t.terms],
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white"><Heart className="h-5 w-5 fill-rose-500 text-rose-500" />One2One Love</div>
            <p className="mt-2 text-sm text-slate-400">{t.tagline}</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm" aria-label="Footer">
            {links.map(([to, label]) => <Link key={to} to={to} className="hover:text-white">{label}</Link>)}
          </nav>
        </div>
        <div className="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-500">© {year} One2One Love. {t.rights}</div>
      </div>
    </footer>
  );
}
