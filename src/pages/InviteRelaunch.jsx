import React, { useMemo } from 'react';
import { Copy, Heart, Mail, MessageCircle, Send, Share2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';

const COPY = {
  en: { title: 'Invite Someone to One2OneLove', subtitle: 'Share One2OneLove directly from your own phone, email, or social app.', note: 'One2OneLove does not claim that an invitation was delivered from this page. Email and text buttons open your device composer so you remain the sender.', link: 'Signup link', copy: 'Copy Link', copied: 'Signup link copied.', share: 'Share', email: 'Open Email', text: 'Open Text', whatsapp: 'Open WhatsApp', message: "I thought you might enjoy One2OneLove — a place for Love Notes, relationship conversations, Date Ideas and tools for growing together.", from: 'Invitation from', fallback: 'Share options are unavailable on this device, so the link was copied instead.', noRewards: 'No referral contest or reward is being promised by this relaunch invite page.' },
  es: { title: 'Invita a Alguien a One2OneLove', subtitle: 'Comparte One2OneLove directamente desde tu teléfono, correo o app social.', note: 'One2OneLove no afirma que una invitación fue entregada desde esta página. Los botones de correo y texto abren el compositor de tu dispositivo para que tú sigas siendo el remitente.', link: 'Enlace de registro', copy: 'Copiar Enlace', copied: 'Enlace de registro copiado.', share: 'Compartir', email: 'Abrir Correo', text: 'Abrir Texto', whatsapp: 'Abrir WhatsApp', message: 'Pensé que podrías disfrutar One2OneLove: un lugar para Notas de Amor, conversaciones de relación, Ideas para Citas y herramientas para crecer juntos.', from: 'Invitación de', fallback: 'Las opciones de compartir no están disponibles en este dispositivo, así que copiamos el enlace.', noRewards: 'Esta página de invitación no promete concursos ni recompensas por referidos.' },
  fr: { title: 'Invitez Quelqu’un sur One2OneLove', subtitle: 'Partagez One2OneLove depuis votre téléphone, e-mail ou application sociale.', note: "One2OneLove ne prétend pas qu'une invitation a été livrée depuis cette page. Les boutons e-mail et SMS ouvrent le composeur de votre appareil afin que vous restiez l'expéditeur.", link: "Lien d'inscription", copy: 'Copier le Lien', copied: "Lien d'inscription copié.", share: 'Partager', email: "Ouvrir l'E-mail", text: 'Ouvrir le SMS', whatsapp: 'Ouvrir WhatsApp', message: "Je pensais que One2OneLove pourrait vous plaire — un espace pour les Notes d'Amour, les conversations de couple, les idées de rendez-vous et des outils pour grandir ensemble.", from: 'Invitation de', fallback: "Le partage n'est pas disponible sur cet appareil; le lien a été copié.", noRewards: "Cette page d'invitation ne promet aucun concours ni récompense de parrainage." },
  it: { title: 'Invita Qualcuno su One2OneLove', subtitle: 'Condividi One2OneLove dal tuo telefono, email o app social.', note: 'One2OneLove non dichiara che un invito sia stato consegnato da questa pagina. I pulsanti email e SMS aprono il compositore del tuo dispositivo, quindi il mittente resti tu.', link: 'Link di registrazione', copy: 'Copia Link', copied: 'Link di registrazione copiato.', share: 'Condividi', email: 'Apri Email', text: 'Apri SMS', whatsapp: 'Apri WhatsApp', message: 'Pensavo che One2OneLove potesse piacerti: uno spazio per Note d’Amore, conversazioni di coppia, idee per appuntamenti e strumenti per crescere insieme.', from: 'Invito da', fallback: 'La condivisione non è disponibile su questo dispositivo, quindi il link è stato copiato.', noRewards: 'Questa pagina non promette concorsi o premi per referral.' },
  de: { title: 'Jemanden zu One2OneLove Einladen', subtitle: 'Teilen Sie One2OneLove über Ihr Telefon, Ihre E-Mail oder eine Social-App.', note: 'One2OneLove behauptet nicht, dass von dieser Seite eine Einladung zugestellt wurde. E-Mail- und SMS-Schaltflächen öffnen den Composer Ihres Geräts; Sie bleiben der Absender.', link: 'Registrierungslink', copy: 'Link Kopieren', copied: 'Registrierungslink kopiert.', share: 'Teilen', email: 'E-Mail Öffnen', text: 'SMS Öffnen', whatsapp: 'WhatsApp Öffnen', message: 'Ich dachte, One2OneLove könnte dir gefallen – ein Ort für Love Notes, Beziehungsgespräche, Date-Ideen und Werkzeuge, um gemeinsam zu wachsen.', from: 'Einladung von', fallback: 'Teilen ist auf diesem Gerät nicht verfügbar; der Link wurde stattdessen kopiert.', noRewards: 'Diese Einladungsseite verspricht keinen Empfehlungswettbewerb und keine Prämien.' },
  nl: { title: 'Nodig Iemand uit voor One2OneLove', subtitle: 'Deel One2OneLove via je telefoon, e-mail of sociale app.', note: 'One2OneLove beweert niet dat vanuit deze pagina een uitnodiging is bezorgd. De e-mail- en sms-knoppen openen de composer van je apparaat, zodat jij de afzender blijft.', link: 'Aanmeldlink', copy: 'Link Kopiëren', copied: 'Aanmeldlink gekopieerd.', share: 'Delen', email: 'E-mail Openen', text: 'Sms Openen', whatsapp: 'WhatsApp Openen', message: 'Ik dacht dat je One2OneLove misschien leuk zou vinden — een plek voor Love Notes, relatiegesprekken, date-ideeën en tools om samen te groeien.', from: 'Uitnodiging van', fallback: 'Delen is niet beschikbaar op dit apparaat, dus de link is gekopieerd.', noRewards: 'Deze uitnodigingspagina belooft geen referralwedstrijd of beloning.' },
};

const INVITE_I18N_EXTRAS = {
  en: { copyError: 'Unable to copy the link on this device.', shareError: 'Sharing is unavailable on this device.', featureTerms: [] },
  es: { copyError: 'No se pudo copiar el enlace en este dispositivo.', shareError: 'Compartir no está disponible en este dispositivo.', featureTerms: [] },
  fr: { copyError: 'Impossible de copier le lien sur cet appareil.', shareError: 'Le partage n’est pas disponible sur cet appareil.', featureTerms: [] },
  it: { copyError: 'Impossibile copiare il link su questo dispositivo.', shareError: 'La condivisione non è disponibile su questo dispositivo.', featureTerms: [] },
  de: { copyError: 'Der Link konnte auf diesem Gerät nicht kopiert werden.', shareError: 'Teilen ist auf diesem Gerät nicht verfügbar.', featureTerms: [['Love Notes', 'Liebesnotizen']] },
  nl: { copyError: 'De link kon niet op dit apparaat worden gekopieerd.', shareError: 'Delen is niet beschikbaar op dit apparaat.', featureTerms: [['Love Notes', 'Liefdesbriefjes']] },
};

const localizeFeatureTerms = (value, replacements) =>
  replacements.reduce((text, [from, to]) => text.split(from).join(to), value);

const safeWriteClipboard = async (text) => {
  if (!navigator?.clipboard?.writeText) throw new Error('Clipboard unavailable');
  await navigator.clipboard.writeText(text);
};

export default function InviteRelaunch() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const baseCopy = COPY[language];
  const extras = INVITE_I18N_EXTRAS[language] || INVITE_I18N_EXTRAS.en;
  const t = { ...baseCopy, ...extras, message: localizeFeatureTerms(baseCopy.message, extras.featureTerms || []) };
  const { user } = useAuth();

  const signupLink = useMemo(() => {
    if (typeof window === 'undefined') return 'https://one2onelove.com/SignUp';
    return `${window.location.origin}/SignUp`;
  }, []);

  const senderName = String(user?.name || '').trim();
  const invitationText = `${t.message}${senderName ? `\n\n${t.from} ${senderName}.` : ''}\n\n${signupLink}`;

  const copyLink = async () => {
    try {
      await safeWriteClipboard(signupLink);
      toast.success(t.copied);
    } catch {
      toast.error(t.copyError);
    }
  };

  const nativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({ title: 'One2OneLove', text: t.message, url: signupLink });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try {
      await safeWriteClipboard(invitationText);
      toast.success(t.fallback);
    } catch {
      toast.error(t.shareError);
    }
  };

  const openEmail = () => {
    const subject = encodeURIComponent('One2OneLove');
    const body = encodeURIComponent(invitationText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const openText = () => {
    const body = encodeURIComponent(invitationText);
    window.location.href = `sms:?body=${body}`;
  };

  const openWhatsApp = () => {
    const body = encodeURIComponent(invitationText);
    window.open(`https://wa.me/?text=${body}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg"><Share2 className="h-8 w-8" /></div>
          <h1 className="text-4xl font-bold text-gray-900">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">{t.subtitle}</p>
        </div>

        <Card className="mb-6 border-pink-100 shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-pink-500" />{t.link}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row"><Input readOnly value={signupLink} className="bg-gray-50" /><Button onClick={copyLink}><Copy className="mr-2 h-4 w-4" />{t.copy}</Button></div>
            <div className="rounded-xl bg-purple-50 p-4 text-sm leading-relaxed text-purple-900">{t.note}</div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <ActionCard icon={Send} title={t.share} onClick={nativeShare} />
          <ActionCard icon={Mail} title={t.email} onClick={openEmail} />
          <ActionCard icon={Smartphone} title={t.text} onClick={openText} />
          <ActionCard icon={MessageCircle} title={t.whatsapp} onClick={openWhatsApp} />
        </div>

        <Card className="mt-6 border-gray-200 bg-gray-50 shadow-none">
          <CardContent className="p-5 text-sm leading-relaxed text-gray-600">{t.noRewards}</CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-pink-200 hover:shadow-md">
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 text-purple-700"><Icon className="h-5 w-5" /></div>
      <span className="font-semibold text-gray-900">{title}</span>
    </button>
  );
}
