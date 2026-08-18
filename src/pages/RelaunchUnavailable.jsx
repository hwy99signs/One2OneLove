import React from 'react';
import { ArrowLeft, Heart, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const COPY = {
  en: { title: 'This page is not part of the current relaunch', body: 'We kept the original work safely in development, but this destination is not being offered to members until its product rules and backend behavior are fully reviewed.', home: 'Back to One2OneLove' },
  es: { title: 'Esta página no forma parte del relanzamiento actual', body: 'Conservamos el trabajo original de forma segura en desarrollo, pero este destino no se ofrece a los miembros hasta revisar completamente sus reglas y funcionamiento.', home: 'Volver a One2OneLove' },
  fr: { title: 'Cette page ne fait pas partie de la relance actuelle', body: "Le travail original est conservé en développement, mais cette destination n'est pas proposée aux membres tant que ses règles produit et son fonctionnement ne sont pas entièrement revus.", home: 'Retour à One2OneLove' },
  it: { title: 'Questa pagina non fa parte del rilancio attuale', body: 'Il lavoro originale è conservato in sviluppo, ma questa destinazione non viene offerta ai membri finché regole e funzionamento non saranno completamente revisionati.', home: 'Torna a One2OneLove' },
  de: { title: 'Diese Seite ist nicht Teil des aktuellen Relaunchs', body: 'Die ursprüngliche Arbeit bleibt sicher in der Entwicklung erhalten, wird Mitgliedern aber erst nach vollständiger Produkt- und Backend-Prüfung angeboten.', home: 'Zurück zu One2OneLove' },
  nl: { title: 'Deze pagina maakt geen deel uit van de huidige herlancering', body: 'Het oorspronkelijke werk blijft veilig bewaard in ontwikkeling, maar deze bestemming wordt pas aangeboden nadat productregels en backend volledig zijn beoordeeld.', home: 'Terug naar One2OneLove' },
};

export default function RelaunchUnavailable() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 py-16">
      <Card className="mx-auto max-w-2xl border-purple-100 shadow-xl">
        <CardContent className="p-8 text-center sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 text-purple-700">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-pink-600"><Heart className="h-4 w-4" />One2OneLove Relaunch</div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-gray-600">{t.body}</p>
          <Button className="mt-7" onClick={() => navigate('/Home', { replace: true })}><ArrowLeft className="mr-2 h-4 w-4" />{t.home}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
