import React from 'react';
import { Heart, Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    eyebrow: 'Page not found',
    title: 'This page isn’t here.',
    copy: 'The link may be outdated, or the page may have moved as One2OneLove continues to grow.',
    home: 'Return Home',
    community: 'Visit Community',
  },
  es: {
    eyebrow: 'Página no encontrada',
    title: 'Esta página no está aquí.',
    copy: 'El enlace puede estar desactualizado o la página puede haberse movido mientras One2OneLove continúa creciendo.',
    home: 'Volver al Inicio',
    community: 'Visitar Comunidad',
  },
  fr: {
    eyebrow: 'Page introuvable',
    title: 'Cette page n’est pas disponible.',
    copy: 'Le lien est peut-être obsolète ou la page a pu être déplacée pendant que One2OneLove continue d’évoluer.',
    home: 'Retour à l’Accueil',
    community: 'Visiter la Communauté',
  },
  it: {
    eyebrow: 'Pagina non trovata',
    title: 'Questa pagina non è disponibile.',
    copy: 'Il link potrebbe essere obsoleto oppure la pagina potrebbe essere stata spostata mentre One2OneLove continua a crescere.',
    home: 'Torna alla Home',
    community: 'Visita la Comunità',
  },
  de: {
    eyebrow: 'Seite nicht gefunden',
    title: 'Diese Seite ist nicht verfügbar.',
    copy: 'Der Link ist möglicherweise veraltet oder die Seite wurde verschoben, während One2OneLove weiter wächst.',
    home: 'Zur Startseite',
    community: 'Community Besuchen',
  },
};

export default function NotFound() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-rose-50 via-white to-blue-50 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card className="rounded-3xl border-rose-100 shadow-sm">
          <CardContent className="p-8 text-center md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
              <Search className="h-8 w-8 text-rose-600" />
            </div>
            <div className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-rose-700">404 · {t.eyebrow}</div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1>
            <p className="mx-auto mt-4 max-w-lg leading-7 text-slate-600">{t.copy}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild><Link to="/Home"><Home className="mr-2 h-4 w-4" />{t.home}</Link></Button>
              <Button asChild variant="outline"><Link to="/Community"><Heart className="mr-2 h-4 w-4" />{t.community}</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
