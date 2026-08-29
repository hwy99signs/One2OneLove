import React from 'react';

const labels = {
  en: 'Skip to main content',
  es: 'Saltar al contenido principal',
  fr: 'Aller au contenu principal',
  it: 'Vai al contenuto principale',
  de: 'Zum Hauptinhalt springen',
};

export default function SkipToContent({ currentLanguage = 'en' }) {
  const label = labels[currentLanguage] || labels.en;
  return (
    <a
      href="#o2ol-main-content"
      className="fixed left-4 top-3 z-[200] -translate-y-24 rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white shadow-lg transition-transform focus:translate-y-0"
    >
      {label}
    </a>
  );
}
