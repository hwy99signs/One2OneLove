import React, { useEffect, useRef, useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { submitGlobalRoomReport } from '@/lib/globalRoomReportingService';

const translations = {
  en: {
    report: 'Report Program', title: 'Report this program', intro: 'Choose the reason that best describes your concern. Reports are reviewed by One2OneLove moderators.', reason: 'Reason', chooseReason: 'Choose a reason', details: 'Additional details (optional)', submit: 'Submit Report', submitting: 'Submitting…', cancel: 'Cancel', signIn: 'Sign in to report programming.', success: 'Thank you. Your report has been submitted for review.', duplicate: 'You already reported this program.', error: 'We could not submit your report. Please try again.', reasons: { misleading: 'Misleading or harmful advice', harassment: 'Harassment or bullying', hate: 'Hate or hateful conduct', sexual_content: 'Inappropriate sexual content', self_harm: 'Self-harm concern', violence: 'Violence or threats', spam: 'Spam or deceptive promotion', other: 'Other' }
  },
  es: {
    report: 'Reportar Programa', title: 'Reportar este programa', intro: 'Elige el motivo que mejor describa tu preocupación. Los reportes son revisados por moderadores de One2OneLove.', reason: 'Motivo', chooseReason: 'Elige un motivo', details: 'Detalles adicionales (opcional)', submit: 'Enviar Reporte', submitting: 'Enviando…', cancel: 'Cancelar', signIn: 'Inicia sesión para reportar programación.', success: 'Gracias. Tu reporte fue enviado para revisión.', duplicate: 'Ya reportaste este programa.', error: 'No pudimos enviar tu reporte. Inténtalo de nuevo.', reasons: { misleading: 'Consejo engañoso o dañino', harassment: 'Acoso o intimidación', hate: 'Odio o conducta de odio', sexual_content: 'Contenido sexual inapropiado', self_harm: 'Preocupación por autolesión', violence: 'Violencia o amenazas', spam: 'Spam o promoción engañosa', other: 'Otro' }
  },
  fr: {
    report: 'Signaler le Programme', title: 'Signaler ce programme', intro: 'Choisissez le motif qui décrit le mieux votre préoccupation. Les signalements sont examinés par les modérateurs One2OneLove.', reason: 'Motif', chooseReason: 'Choisissez un motif', details: 'Détails supplémentaires (facultatif)', submit: 'Envoyer le Signalement', submitting: 'Envoi…', cancel: 'Annuler', signIn: 'Connectez-vous pour signaler un programme.', success: 'Merci. Votre signalement a été envoyé pour examen.', duplicate: 'Vous avez déjà signalé ce programme.', error: 'Impossible d’envoyer votre signalement. Veuillez réessayer.', reasons: { misleading: 'Conseil trompeur ou nuisible', harassment: 'Harcèlement ou intimidation', hate: 'Haine ou conduite haineuse', sexual_content: 'Contenu sexuel inapproprié', self_harm: 'Risque d’automutilation', violence: 'Violence ou menaces', spam: 'Spam ou promotion trompeuse', other: 'Autre' }
  },
  it: {
    report: 'Segnala Programma', title: 'Segnala questo programma', intro: 'Scegli il motivo che descrive meglio la tua preoccupazione. Le segnalazioni vengono esaminate dai moderatori One2OneLove.', reason: 'Motivo', chooseReason: 'Scegli un motivo', details: 'Dettagli aggiuntivi (opzionale)', submit: 'Invia Segnalazione', submitting: 'Invio…', cancel: 'Annulla', signIn: 'Accedi per segnalare un programma.', success: 'Grazie. La tua segnalazione è stata inviata per la revisione.', duplicate: 'Hai già segnalato questo programma.', error: 'Impossibile inviare la segnalazione. Riprova.', reasons: { misleading: 'Consiglio fuorviante o dannoso', harassment: 'Molestie o bullismo', hate: 'Odio o condotta d’odio', sexual_content: 'Contenuto sessuale inappropriato', self_harm: 'Preoccupazione per autolesionismo', violence: 'Violenza o minacce', spam: 'Spam o promozione ingannevole', other: 'Altro' }
  },
  de: {
    report: 'Programm Melden', title: 'Dieses Programm melden', intro: 'Wähle den Grund, der dein Anliegen am besten beschreibt. Meldungen werden von One2OneLove-Moderatoren geprüft.', reason: 'Grund', chooseReason: 'Grund auswählen', details: 'Zusätzliche Details (optional)', submit: 'Meldung Senden', submitting: 'Wird gesendet…', cancel: 'Abbrechen', signIn: 'Melde dich an, um Programme zu melden.', success: 'Danke. Deine Meldung wurde zur Prüfung eingereicht.', duplicate: 'Du hast dieses Programm bereits gemeldet.', error: 'Die Meldung konnte nicht gesendet werden. Bitte versuche es erneut.', reasons: { misleading: 'Irreführender oder schädlicher Rat', harassment: 'Belästigung oder Mobbing', hate: 'Hass oder hasserfülltes Verhalten', sexual_content: 'Unangemessene sexuelle Inhalte', self_harm: 'Sorge wegen Selbstverletzung', violence: 'Gewalt oder Drohungen', spam: 'Spam oder täuschende Werbung', other: 'Andere' }
  },
};

const REASONS = ['misleading', 'harassment', 'hate', 'sexual_content', 'self_harm', 'violence', 'spam', 'other'];

export default function ProgramReportButton({ slotId, compact = false }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const restoreTarget = triggerRef.current || previouslyFocused;
      restoreTarget?.focus?.();
    };
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    if (!reason || !user?.id) return;
    setSubmitting(true);
    setMessage('');
    setIsError(false);

    try {
      const result = await submitGlobalRoomReport({ userId: user.id, slotId, reason, details });
      if (result.success) {
        setMessage(t.success);
        setReason('');
        setDetails('');
      } else {
        setIsError(true);
        setMessage(result.duplicate ? t.duplicate : t.error);
      }
    } catch {
      setIsError(true);
      setMessage(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return compact ? null : <span className="text-xs text-slate-500">{t.signIn}</span>;
  }

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => { setOpen(true); setMessage(''); setIsError(false); }} className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2">
        <Flag aria-hidden="true" className="h-3.5 w-3.5" /> {t.report}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby={`report-program-${slotId}`} aria-describedby={`report-program-description-${slotId}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={`report-program-${slotId}`} className="text-xl font-bold text-slate-900">{t.title}</h2>
                <p id={`report-program-description-${slotId}`} className="mt-2 text-sm leading-6 text-slate-600">{t.intro}</p>
              </div>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" aria-label={t.cancel}><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>

            {message && <div role={isError ? 'alert' : 'status'} aria-live="polite" className={`mt-4 rounded-xl border p-3 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</div>}

            <form className="mt-5 space-y-4" onSubmit={submit}>
              <label className="block text-sm font-medium text-slate-700">
                {t.reason}
                <select value={reason} onChange={(event) => setReason(event.target.value)} required className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">{t.chooseReason}</option>
                  {REASONS.map((value) => <option key={value} value={value}>{t.reasons[value]}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {t.details}
                <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} rows={4} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
              </label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
                <Button type="submit" disabled={submitting || !reason}>{submitting ? t.submitting : t.submit}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
