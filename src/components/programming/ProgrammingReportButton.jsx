import React, { useEffect, useState } from 'react';
import { Check, Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  PROGRAMMING_MODERATION_ENABLED,
  PROGRAMMING_REPORT_REASONS,
  getMyProgrammingReport,
  reportProgramming,
} from '@/lib/programmingModerationService';

const COPY = {
  en: {
    report: 'Report program', reported: 'Reported', title: 'Report this program?', description: 'Reports are private moderation records. Choose the concern that best describes the program.', reason: 'Reason', details: 'Optional details', detailsPlaceholder: 'Briefly explain what should be reviewed…', cancel: 'Cancel', submit: 'Submit report', submitting: 'Submitting…', success: 'Programming report submitted.', failed: 'Unable to submit the programming report.',
    reasons: { harassment_or_hate: 'Harassment or hateful content', sexual_or_exploitative: 'Sexual or exploitative content', dangerous_advice: 'Dangerous advice or unsafe claims', privacy_or_doxxing: 'Privacy violation or doxxing', spam_or_scam: 'Spam, scam, or deceptive promotion', copyright_or_rights: 'Copyright or content-rights concern', other: 'Something else' },
  },
  es: {
    report: 'Reportar programa', reported: 'Reportado', title: '¿Reportar este programa?', description: 'Los reportes son registros privados de moderación. Elige el motivo que mejor describa el problema.', reason: 'Motivo', details: 'Detalles opcionales', detailsPlaceholder: 'Explica brevemente qué debería revisarse…', cancel: 'Cancelar', submit: 'Enviar reporte', submitting: 'Enviando…', success: 'Reporte de programación enviado.', failed: 'No se pudo enviar el reporte.',
    reasons: { harassment_or_hate: 'Acoso o contenido de odio', sexual_or_exploitative: 'Contenido sexual o explotador', dangerous_advice: 'Consejos peligrosos o afirmaciones inseguras', privacy_or_doxxing: 'Violación de privacidad o doxxing', spam_or_scam: 'Spam, estafa o promoción engañosa', copyright_or_rights: 'Problema de copyright o derechos de contenido', other: 'Otro motivo' },
  },
  fr: {
    report: 'Signaler le programme', reported: 'Signalé', title: 'Signaler ce programme ?', description: 'Les signalements sont des dossiers privés de modération. Choisissez la raison qui décrit le mieux le problème.', reason: 'Raison', details: 'Détails facultatifs', detailsPlaceholder: 'Expliquez brièvement ce qui doit être examiné…', cancel: 'Annuler', submit: 'Envoyer le signalement', submitting: 'Envoi…', success: 'Signalement de programmation envoyé.', failed: 'Impossible d’envoyer le signalement.',
    reasons: { harassment_or_hate: 'Harcèlement ou contenu haineux', sexual_or_exploitative: 'Contenu sexuel ou exploitatif', dangerous_advice: 'Conseil dangereux ou affirmation risquée', privacy_or_doxxing: 'Atteinte à la vie privée ou doxxing', spam_or_scam: 'Spam, arnaque ou promotion trompeuse', copyright_or_rights: 'Problème de droits d’auteur ou de contenu', other: 'Autre chose' },
  },
  it: {
    report: 'Segnala programma', reported: 'Segnalato', title: 'Segnalare questo programma?', description: 'Le segnalazioni sono registri privati di moderazione. Scegli il motivo che descrive meglio il problema.', reason: 'Motivo', details: 'Dettagli facoltativi', detailsPlaceholder: 'Spiega brevemente cosa dovrebbe essere esaminato…', cancel: 'Annulla', submit: 'Invia segnalazione', submitting: 'Invio…', success: 'Segnalazione inviata.', failed: 'Impossibile inviare la segnalazione.',
    reasons: { harassment_or_hate: 'Molestie o contenuti d’odio', sexual_or_exploitative: 'Contenuti sessuali o di sfruttamento', dangerous_advice: 'Consigli pericolosi o affermazioni non sicure', privacy_or_doxxing: 'Violazione della privacy o doxxing', spam_or_scam: 'Spam, truffa o promozione ingannevole', copyright_or_rights: 'Problema di copyright o diritti sui contenuti', other: 'Altro' },
  },
  de: {
    report: 'Programm melden', reported: 'Gemeldet', title: 'Dieses Programm melden?', description: 'Meldungen sind private Moderationsunterlagen. Wähle den Grund, der das Problem am besten beschreibt.', reason: 'Grund', details: 'Optionale Details', detailsPlaceholder: 'Beschreibe kurz, was geprüft werden sollte…', cancel: 'Abbrechen', submit: 'Meldung senden', submitting: 'Wird gesendet…', success: 'Programmmeldung gesendet.', failed: 'Programmmeldung konnte nicht gesendet werden.',
    reasons: { harassment_or_hate: 'Belästigung oder Hassinhalte', sexual_or_exploitative: 'Sexuelle oder ausbeuterische Inhalte', dangerous_advice: 'Gefährliche Ratschläge oder unsichere Behauptungen', privacy_or_doxxing: 'Privatsphäreverletzung oder Doxxing', spam_or_scam: 'Spam, Betrug oder irreführende Werbung', copyright_or_rights: 'Urheberrechts- oder Inhaltsrechteproblem', other: 'Etwas anderes' },
  },
  nl: {
    report: 'Programma melden', reported: 'Gemeld', title: 'Dit programma melden?', description: 'Meldingen zijn privé-moderatierecords. Kies de reden die het probleem het beste beschrijft.', reason: 'Reden', details: 'Optionele details', detailsPlaceholder: 'Leg kort uit wat beoordeeld moet worden…', cancel: 'Annuleren', submit: 'Melding versturen', submitting: 'Versturen…', success: 'Programmamelding verstuurd.', failed: 'De programmamelding kon niet worden verstuurd.',
    reasons: { harassment_or_hate: 'Intimidatie of haatdragende inhoud', sexual_or_exploitative: 'Seksuele of uitbuitende inhoud', dangerous_advice: 'Gevaarlijk advies of onveilige claims', privacy_or_doxxing: 'Privacyschending of doxxing', spam_or_scam: 'Spam, fraude of misleidende promotie', copyright_or_rights: 'Auteursrecht- of inhoudsrechtenprobleem', other: 'Iets anders' },
  },
};

export default function ProgrammingReportButton({ slot, variant = 'ghost' }) {
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [serverAvailable, setServerAvailable] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    setExistingReport(null);
    if (!PROGRAMMING_MODERATION_ENABLED || !isAuthenticated || !user?.id || !slot?.id) {
      setServerAvailable(false);
      return () => { mounted = false; };
    }

    getMyProgrammingReport(slot.id)
      .then((report) => {
        if (!mounted) return;
        setServerAvailable(true);
        setExistingReport(report || null);
      })
      .catch(() => {
        if (mounted) setServerAvailable(false);
      });

    return () => { mounted = false; };
  }, [slot?.id, isAuthenticated, user?.id]);

  if (!PROGRAMMING_MODERATION_ENABLED || !isAuthenticated || !slot?.id || !serverAvailable) return null;

  if (existingReport) {
    return <Button type="button" size="sm" variant="outline" disabled><Check className="mr-2 h-3.5 w-3.5" />{t.reported}</Button>;
  }

  const submit = async () => {
    if (!PROGRAMMING_REPORT_REASONS.includes(reason) || busy) return;
    setBusy(true);
    try {
      const report = await reportProgramming({ slotId: slot.id, reason, details });
      setExistingReport(report);
      setOpen(false);
      setReason('');
      setDetails('');
      toast.success(t.success);
    } catch {
      toast.error(t.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button type="button" size="sm" variant={variant} onClick={() => setOpen(true)} className="text-slate-500 hover:text-rose-700">
        <Flag className="mr-2 h-3.5 w-3.5" />{t.report}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.title}</DialogTitle>
            <DialogDescription>{t.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">{t.reason}</label>
              <select value={reason} onChange={(event) => setReason(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="">—</option>
                {PROGRAMMING_REPORT_REASONS.map((value) => <option key={value} value={value}>{t.reasons[value]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">{t.details}</label>
              <textarea value={details} onChange={(event) => setDetails(event.target.value.slice(0, 1000))} rows={4} placeholder={t.detailsPlaceholder} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button type="button" disabled={busy || !PROGRAMMING_REPORT_REASONS.includes(reason)} onClick={submit} className="bg-rose-700 text-white hover:bg-rose-800">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flag className="mr-2 h-4 w-4" />}
              {busy ? t.submitting : t.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
