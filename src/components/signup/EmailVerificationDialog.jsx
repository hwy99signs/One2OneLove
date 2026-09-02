import React from 'react';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const copy = {
  en: {
    title: 'Check your email', success: 'Account created successfully', sent: "We've sent a confirmation email to:", next: 'Next steps',
    steps: ['Open your email inbox', 'Find the email from One2OneLove', 'Click the confirmation link', 'We’ll return you to the page you were trying to reach, or ask you to sign in if needed'],
    missing: "Can't find the email?", missingText: 'Check your spam or junk folder. The email may take a few minutes to arrive.', button: 'Got it',
  },
  es: {
    title: 'Revisa tu correo', success: 'Cuenta creada correctamente', sent: 'Enviamos un correo de confirmación a:', next: 'Siguientes pasos',
    steps: ['Abre tu bandeja de entrada', 'Busca el correo de One2OneLove', 'Haz clic en el enlace de confirmación', 'Te devolveremos a la página que querías abrir o te pediremos iniciar sesión si hace falta'],
    missing: '¿No encuentras el correo?', missingText: 'Revisa la carpeta de spam o correo no deseado. El mensaje puede tardar unos minutos.', button: 'Entendido',
  },
  fr: {
    title: 'Vérifiez votre e-mail', success: 'Compte créé avec succès', sent: 'Nous avons envoyé un e-mail de confirmation à :', next: 'Étapes suivantes',
    steps: ['Ouvrez votre boîte de réception', 'Recherchez l’e-mail de One2OneLove', 'Cliquez sur le lien de confirmation', 'Nous vous ramènerons à la page souhaitée ou vous demanderons de vous connecter si nécessaire'],
    missing: 'Vous ne trouvez pas l’e-mail ?', missingText: 'Vérifiez vos courriers indésirables. Le message peut prendre quelques minutes.', button: 'Compris',
  },
  it: {
    title: 'Controlla la tua email', success: 'Account creato con successo', sent: 'Abbiamo inviato un’email di conferma a:', next: 'Prossimi passi',
    steps: ['Apri la tua casella email', 'Trova l’email di One2OneLove', 'Fai clic sul link di conferma', 'Ti riporteremo alla pagina che volevi raggiungere o ti chiederemo di accedere se necessario'],
    missing: 'Non trovi l’email?', missingText: 'Controlla spam o posta indesiderata. L’email può richiedere qualche minuto.', button: 'Ho capito',
  },
  de: {
    title: 'Prüfe deine E-Mail', success: 'Konto erfolgreich erstellt', sent: 'Wir haben eine Bestätigungs-E-Mail gesendet an:', next: 'Nächste Schritte',
    steps: ['Öffne dein E-Mail-Postfach', 'Suche die E-Mail von One2OneLove', 'Klicke auf den Bestätigungslink', 'Wir bringen dich zur gewünschten Seite zurück oder bitten dich bei Bedarf, dich anzumelden'],
    missing: 'E-Mail nicht gefunden?', missingText: 'Prüfe Spam oder Junk. Die E-Mail kann ein paar Minuten benötigen.', button: 'Verstanden',
  },
  nl: {
    title: 'Controleer je e-mail', success: 'Account succesvol aangemaakt', sent: 'We hebben een bevestigingsmail gestuurd naar:', next: 'Volgende stappen',
    steps: ['Open je e-mailinbox', 'Zoek de e-mail van One2OneLove', 'Klik op de bevestigingslink', 'We brengen je terug naar de pagina die je wilde openen of vragen je indien nodig in te loggen'],
    missing: 'Kun je de e-mail niet vinden?', missingText: 'Controleer spam of ongewenste e-mail. Het kan enkele minuten duren voordat de e-mail aankomt.', button: 'Begrepen',
  },
};

export default function EmailVerificationDialog({ isOpen, onClose, email }) {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-500 shadow-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">{t.title} 📧</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4 text-center">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div className="text-left">
                  <p className="mb-1 font-semibold text-green-900">{t.success}</p>
                  <p className="text-sm text-green-700">{t.sent}</p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-green-900">{email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
              <p className="mb-2 font-semibold text-blue-900">{t.next}</p>
              <ol className="list-inside list-decimal space-y-2 text-sm text-blue-800">
                {t.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-xs text-yellow-800"><strong>💡 {t.missing}</strong> {t.missingText}</p>
            </div>

            <Button onClick={onClose} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 font-semibold text-white hover:from-pink-600 hover:to-purple-700">
              {t.button}<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
