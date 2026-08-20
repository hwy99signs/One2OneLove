import React from 'react';
import { CircleHelp, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { SUPPORT_REQUESTS_ENABLED } from '@/lib/supportRequestService';

const COPY = {
  en: { title: 'Need help with your account?', text: 'Use private in-app Member Support to send a request and track One2OneLove’s response.', boundary: 'Member Support is not an emergency or crisis-response channel.', open: 'Open Member Support', signIn: 'Sign in for Member Support' },
  es: { title: '¿Necesitas ayuda con tu cuenta?', text: 'Usa el Soporte para Miembros dentro de la aplicación para enviar una solicitud y seguir la respuesta de One2OneLove.', boundary: 'El Soporte para Miembros no es un canal de emergencias o crisis.', open: 'Abrir Soporte para Miembros', signIn: 'Iniciar sesión para Soporte' },
  fr: { title: 'Besoin d’aide avec votre compte ?', text: 'Utilisez l’Assistance Membres privée dans l’application pour envoyer une demande et suivre la réponse de One2OneLove.', boundary: 'L’Assistance Membres n’est pas un canal d’urgence ou de crise.', open: 'Ouvrir l’Assistance Membres', signIn: 'Se connecter pour l’assistance' },
  it: { title: 'Hai bisogno di aiuto con il tuo account?', text: 'Usa l’Assistenza Membri privata nell’app per inviare una richiesta e seguire la risposta di One2OneLove.', boundary: 'L’Assistenza Membri non è un canale di emergenza o crisi.', open: 'Apri Assistenza Membri', signIn: 'Accedi per l’assistenza' },
  de: { title: 'Brauchst du Hilfe mit deinem Konto?', text: 'Nutze den privaten In-App-Mitglieder-Support, um eine Anfrage zu senden und die One2OneLove-Antwort zu verfolgen.', boundary: 'Mitglieder-Support ist kein Notfall- oder Krisendienst.', open: 'Mitglieder-Support öffnen', signIn: 'Für Support anmelden' },
  nl: { title: 'Hulp nodig met je account?', text: 'Gebruik privé-ledenondersteuning in de app om een verzoek te sturen en het antwoord van One2OneLove te volgen.', boundary: 'Ledenondersteuning is geen nood- of crisisservice.', open: 'Ledenondersteuning openen', signIn: 'Inloggen voor ondersteuning' },
};

export default function HelpCenterSupportControl({ languageCode = 'en' }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const t = COPY[languageCode] || COPY.en;

  if (!SUPPORT_REQUESTS_ENABLED) return null;

  const destination = isAuthenticated
    ? '/SupportRequests'
    : '/SignIn?returnTo=%2FSupportRequests';

  return (
    <section className="mt-8 rounded-[2rem] border border-violet-200 bg-violet-50 p-6 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-700 text-white">
            {isAuthenticated ? <CircleHelp className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">{t.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t.text}</p>
            <p className="mt-2 text-xs font-bold text-amber-800">{t.boundary}</p>
          </div>
        </div>
        <Button className="shrink-0 bg-violet-700 text-white hover:bg-violet-800" onClick={() => navigate(destination)}>
          {isAuthenticated ? t.open : t.signIn}
        </Button>
      </div>
    </section>
  );
}
