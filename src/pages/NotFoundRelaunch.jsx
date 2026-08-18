import React from 'react';
import { ArrowLeft, Heart, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const COPY = {
  en: { title: 'Page not found', body: 'This address is not part of the current One2OneLove relaunch.', home: 'Back to One2OneLove' },
  es: { title: 'Página no encontrada', body: 'Esta dirección no forma parte del relanzamiento actual de One2OneLove.', home: 'Volver a One2OneLove' },
  fr: { title: 'Page introuvable', body: "Cette adresse ne fait pas partie de la relance actuelle de One2OneLove.", home: 'Retour à One2OneLove' },
  it: { title: 'Pagina non trovata', body: 'Questo indirizzo non fa parte del rilancio attuale di One2OneLove.', home: 'Torna a One2OneLove' },
  de: { title: 'Seite nicht gefunden', body: 'Diese Adresse gehört nicht zum aktuellen One2OneLove-Relaunch.', home: 'Zurück zu One2OneLove' },
  nl: { title: 'Pagina niet gevonden', body: 'Dit adres maakt geen deel uit van de huidige One2OneLove-herlancering.', home: 'Terug naar One2OneLove' },
};

export default function NotFoundRelaunch() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-slate-50 via-white to-pink-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 text-purple-700">
          <SearchX className="h-8 w-8" />
        </div>
        <div className="mb-3 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-pink-600">
          <Heart className="h-4 w-4 fill-current" /> One2OneLove
        </div>
        <h1 className="text-3xl font-black text-gray-900">{t.title}</h1>
        <p className="mt-4 leading-7 text-gray-600">{t.body}</p>
        <Button asChild className="mt-7">
          <Link to="/Home"><ArrowLeft className="mr-2 h-4 w-4" />{t.home}</Link>
        </Button>
      </div>
    </div>
  );
}
