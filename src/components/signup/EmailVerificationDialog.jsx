import React from 'react';
import { ArrowRight, CheckCircle, Mail } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    verifyTitle: 'Check Your Email',
    readyTitle: 'Your Account Is Ready',
    created: 'Account created successfully!',
    sent: 'We sent an account verification email to:',
    ready: 'Your account is ready to use with:',
    next: 'Next Steps',
    steps: ['Open your email inbox', 'Find the email from One2One Love', 'Click the verification link', 'Return here and sign in'],
    tipTitle: "Can't find the email?",
    tip: 'Check your spam or junk folder. Delivery can sometimes take a few minutes.',
    continueVerify: 'Go to Sign In',
    continueReady: 'Continue to Sign In',
  },
  es: {
    verifyTitle: 'Revisa Tu Correo',
    readyTitle: 'Tu Cuenta Está Lista',
    created: '¡Cuenta creada correctamente!',
    sent: 'Enviamos un correo de verificación de cuenta a:',
    ready: 'Tu cuenta está lista para usarse con:',
    next: 'Próximos Pasos',
    steps: ['Abre tu bandeja de entrada', 'Busca el correo de One2One Love', 'Haz clic en el enlace de verificación', 'Regresa aquí e inicia sesión'],
    tipTitle: '¿No encuentras el correo?',
    tip: 'Revisa tu carpeta de spam o correo no deseado. La entrega puede tardar unos minutos.',
    continueVerify: 'Ir a Iniciar Sesión',
    continueReady: 'Continuar a Iniciar Sesión',
  },
  fr: {
    verifyTitle: 'Consultez Votre E-mail',
    readyTitle: 'Votre Compte Est Prêt',
    created: 'Compte créé avec succès !',
    sent: 'Nous avons envoyé un e-mail de vérification à :',
    ready: 'Votre compte est prêt à être utilisé avec :',
    next: 'Prochaines Étapes',
    steps: ['Ouvrez votre boîte de réception', 'Trouvez l’e-mail de One2One Love', 'Cliquez sur le lien de vérification', 'Revenez ici et connectez-vous'],
    tipTitle: 'Vous ne trouvez pas l’e-mail ?',
    tip: 'Vérifiez vos courriers indésirables. La livraison peut parfois prendre quelques minutes.',
    continueVerify: 'Aller à la Connexion',
    continueReady: 'Continuer vers la Connexion',
  },
  it: {
    verifyTitle: 'Controlla La Tua Email',
    readyTitle: 'Il Tuo Account È Pronto',
    created: 'Account creato correttamente!',
    sent: 'Abbiamo inviato un’email di verifica a:',
    ready: 'Il tuo account è pronto per essere usato con:',
    next: 'Prossimi Passi',
    steps: ['Apri la tua casella email', 'Trova l’email di One2One Love', 'Fai clic sul link di verifica', 'Torna qui e accedi'],
    tipTitle: 'Non trovi l’email?',
    tip: 'Controlla la cartella spam o posta indesiderata. La consegna può richiedere alcuni minuti.',
    continueVerify: 'Vai ad Accedi',
    continueReady: 'Continua ad Accedi',
  },
  de: {
    verifyTitle: 'Prüfe Deine E-Mail',
    readyTitle: 'Dein Konto Ist Bereit',
    created: 'Konto erfolgreich erstellt!',
    sent: 'Wir haben eine Bestätigungs-E-Mail gesendet an:',
    ready: 'Dein Konto ist einsatzbereit mit:',
    next: 'Nächste Schritte',
    steps: ['Öffne deinen E-Mail-Posteingang', 'Suche die E-Mail von One2One Love', 'Klicke auf den Bestätigungslink', 'Kehre zurück und melde dich an'],
    tipTitle: 'Du findest die E-Mail nicht?',
    tip: 'Prüfe deinen Spam- oder Junk-Ordner. Die Zustellung kann einige Minuten dauern.',
    continueVerify: 'Zur Anmeldung',
    continueReady: 'Weiter zur Anmeldung',
  },
};

export default function EmailVerificationDialog({ isOpen, onClose, email, requiresVerification = true }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <Mail aria-hidden="true" className="w-8 h-8 text-white" />
            </div>
          </div>
          <AlertDialogTitle className="text-2xl text-center">
            {requiresVerification ? t.verifyTitle : t.readyTitle}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-center space-y-4 pt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle aria-hidden="true" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-semibold text-green-900 mb-1">{t.created}</p>
                    <p className="text-sm text-green-700">{requiresVerification ? t.sent : t.ready}</p>
                    <p className="text-sm font-mono font-semibold text-green-900 mt-1 break-all">{email}</p>
                  </div>
                </div>
              </div>

              {requiresVerification && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <p className="font-semibold text-blue-900 mb-2">{t.next}:</p>
                    <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                      {t.steps.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
                    <p className="text-xs text-yellow-800"><strong>{t.tipTitle}</strong> {t.tip}</p>
                  </div>
                </>
              )}

              <Button
                type="button"
                onClick={onClose}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold"
              >
                {requiresVerification ? t.continueVerify : t.continueReady}
                <ArrowRight aria-hidden="true" className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
