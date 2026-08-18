import React from 'react';
import { ArrowLeft, BriefcaseBusiness, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const COPY = {
  en: { eyebrow: 'Professional applications', title: 'Applications are not open yet.', body: 'One2OneLove is preparing the private intake and review process for therapists, influencers and other professional partners. We will not collect application details until that secure workflow is deliberately activated.', safety: 'No application was submitted from this page. When applications open, the form will confirm submission only after the private intake backend actually stores it.', back: 'Back to One2OneLove', help: 'Help Center' },
  es: { eyebrow: 'Solicitudes profesionales', title: 'Las solicitudes aún no están abiertas.', body: 'One2OneLove está preparando el proceso privado de solicitud y revisión para terapeutas, influencers y otros colaboradores profesionales. No recopilaremos datos de solicitudes hasta que ese flujo seguro se active de forma deliberada.', safety: 'No se envió ninguna solicitud desde esta página. Cuando se abran las solicitudes, el formulario solo confirmará el envío después de que el sistema privado realmente la guarde.', back: 'Volver a One2OneLove', help: 'Centro de Ayuda' },
  fr: { eyebrow: 'Candidatures professionnelles', title: 'Les candidatures ne sont pas encore ouvertes.', body: 'One2OneLove prépare le processus privé de candidature et d’examen pour les thérapeutes, influenceurs et autres partenaires professionnels. Nous ne recueillerons aucune information de candidature avant l’activation volontaire de ce processus sécurisé.', safety: 'Aucune candidature n’a été envoyée depuis cette page. À l’ouverture, le formulaire ne confirmera l’envoi qu’après l’enregistrement réel par le système privé.', back: 'Retour à One2OneLove', help: 'Centre d’Aide' },
  it: { eyebrow: 'Candidature professionali', title: 'Le candidature non sono ancora aperte.', body: 'One2OneLove sta preparando il processo privato di candidatura e revisione per terapeuti, influencer e altri partner professionali. Non raccoglieremo i dati delle candidature finché questo flusso sicuro non verrà attivato in modo deliberato.', safety: 'Da questa pagina non è stata inviata alcuna candidatura. Quando le candidature apriranno, il modulo confermerà l’invio solo dopo che il sistema privato l’avrà realmente salvata.', back: 'Torna a One2OneLove', help: 'Centro Assistenza' },
  de: { eyebrow: 'Professionelle Bewerbungen', title: 'Bewerbungen sind noch nicht geöffnet.', body: 'One2OneLove bereitet den privaten Bewerbungs- und Prüfprozess für Therapeuten, Influencer und andere professionelle Partner vor. Bewerbungsdaten werden erst erfasst, wenn dieser sichere Ablauf bewusst aktiviert wurde.', safety: 'Von dieser Seite wurde keine Bewerbung übermittelt. Wenn Bewerbungen geöffnet werden, bestätigt das Formular die Übermittlung erst, nachdem das private System sie tatsächlich gespeichert hat.', back: 'Zurück zu One2OneLove', help: 'Hilfe-Center' },
};

export default function ProfessionalApplicationsClosed() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  return (
    <div className="min-h-[75vh] bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100"><BriefcaseBusiness className="h-8 w-8 text-purple-700" /></div>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-purple-700">{t.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">{t.title}</h1>
        <p className="mt-5 text-base leading-7 text-slate-600">{t.body}</p>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm leading-6 text-emerald-950">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{t.safety}</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />{t.back}</Link></Button>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"><Link to="/HelpCenter">{t.help}</Link></Button>
        </div>
      </div>
    </div>
  );
}