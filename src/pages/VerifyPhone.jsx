import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, LogOut, MessageSquareText, Phone, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { sendPhoneVerificationOtp, verifyPhoneNumberOtp } from '@/lib/phoneVerificationService';

const translations = {
  en: {
    title: 'Verify Your Phone',
    subtitle: 'One2OneLove requires a verified phone number before protected member features can be used.',
    phone: 'Mobile Phone Number',
    phoneHint: 'Include country code, for example +1 555 123 4567. One verified mobile number can be linked to only one member account.',
    send: 'Send Verification Code',
    sending: 'Sending…',
    code: '6-digit SMS code',
    codeHint: 'Enter the code sent to your phone.',
    verify: 'Verify Phone',
    verifying: 'Verifying…',
    resend: 'Send a New Code',
    success: 'Phone verified successfully.',
    invalidPhone: 'Enter a valid mobile number with country code.',
    invalidCode: 'Enter the 6-digit code from the SMS.',
    unavailable: 'Phone verification is not available yet. Please try again after phone verification is enabled.',
    signOut: 'Sign Out Instead',
    doorNote: 'Member features stay locked until your phone is verified. Verify now, or sign out and browse as a guest.',
    bonusTitle:'You received $5.00 in FREE Game Credits!',bonusWhere:'Your bonus is waiting in your Credit wallet. You can open it any time with the BUY CREDIT button at the top of the site, or from your Profile. On that page your bonus sits at the very top, labeled "O2OL Bonus Game Credits", right under your $ Credit.',bonusHow:'When you play any One2OneLove game, your Game Credits are spent first — before any paid Credit.',bonusExpires:'Use them by {date}: unused Game Credits expire on that date.',bonusSee:'See My $5.00 Bonus',bonusPlay:'Play a Game Now',bonusContinue:'Continue',
  },
  es: {
    title: 'Verifica Tu Teléfono',
    subtitle: 'One2OneLove requiere un número de teléfono verificado antes de usar las funciones protegidas para miembros.',
    phone: 'Número de Teléfono Móvil',
    phoneHint: 'Incluye el código de país, por ejemplo +1 555 123 4567. Un número móvil verificado solo puede vincularse a una cuenta de miembro.',
    send: 'Enviar Código de Verificación',
    sending: 'Enviando…',
    code: 'Código SMS de 6 dígitos',
    codeHint: 'Ingresa el código enviado a tu teléfono.',
    verify: 'Verificar Teléfono',
    verifying: 'Verificando…',
    resend: 'Enviar un Código Nuevo',
    success: 'Teléfono verificado correctamente.',
    invalidPhone: 'Ingresa un número móvil válido con código de país.',
    invalidCode: 'Ingresa el código de 6 dígitos del SMS.',
    unavailable: 'La verificación telefónica aún no está disponible. Inténtalo cuando se habilite.',
    signOut: 'Cerrar Sesión',
    doorNote: 'Las funciones para miembros permanecerán bloqueadas hasta que verifiques tu teléfono. Verifícalo ahora, o cierra sesión y navega como invitado.',
    bonusTitle:'¡Recibiste $5.00 en Créditos de Juego GRATIS!',bonusWhere:'Tu bono te espera en tu billetera de Crédito. Puedes abrirla cuando quieras con el botón COMPRAR CRÉDITO en la parte superior del sitio, o desde tu Perfil. En esa página tu bono está arriba de todo, con la etiqueta "O2OL Bonus Game Credits", justo debajo de tu $ Crédito.',bonusHow:'Cuando juegas cualquier juego de One2OneLove, tus Créditos de Juego se gastan primero, antes que cualquier Crédito pagado.',bonusExpires:'Úsalos antes del {date}: los Créditos de Juego no utilizados vencen en esa fecha.',bonusSee:'Ver Mi Bono de $5.00',bonusPlay:'Jugar Ahora',bonusContinue:'Continuar',
  },
  fr: {
    title: 'Vérifiez Votre Téléphone',
    subtitle: 'One2OneLove exige un numéro de téléphone vérifié avant l’utilisation des fonctions protégées pour membres.',
    phone: 'Numéro de Téléphone Mobile',
    phoneHint: 'Incluez l’indicatif du pays, par exemple +1 555 123 4567. Un numéro mobile vérifié ne peut être lié qu’à un seul compte membre.',
    send: 'Envoyer le Code de Vérification',
    sending: 'Envoi…',
    code: 'Code SMS à 6 chiffres',
    codeHint: 'Saisissez le code envoyé à votre téléphone.',
    verify: 'Vérifier le Téléphone',
    verifying: 'Vérification…',
    resend: 'Envoyer un Nouveau Code',
    success: 'Téléphone vérifié avec succès.',
    invalidPhone: 'Saisissez un numéro mobile valide avec indicatif du pays.',
    invalidCode: 'Saisissez le code à 6 chiffres du SMS.',
    unavailable: 'La vérification téléphonique n’est pas encore disponible. Réessayez lorsqu’elle sera activée.',
    signOut: 'Se Déconnecter',
    doorNote: 'Les fonctions pour membres restent verrouillées jusqu’à la vérification de votre téléphone. Vérifiez maintenant, ou déconnectez-vous et naviguez en invité.',
    bonusTitle:'Vous avez reçu 5,00 $ en Crédits de Jeu GRATUITS !',bonusWhere:'Votre bonus vous attend dans votre portefeuille de Crédit. Vous pouvez l’ouvrir à tout moment avec le bouton ACHETER DU CRÉDIT en haut du site, ou depuis votre Profil. Sur cette page, votre bonus se trouve tout en haut, sous l’étiquette « O2OL Bonus Game Credits », juste sous votre Crédit $.',bonusHow:'Quand vous jouez à un jeu One2OneLove, vos Crédits de Jeu sont dépensés en premier, avant tout Crédit payé.',bonusExpires:'Utilisez-les avant le {date} : les Crédits de Jeu non utilisés expirent à cette date.',bonusSee:'Voir Mon Bonus de 5,00 $',bonusPlay:'Jouer Maintenant',bonusContinue:'Continuer',
  },
  it: {
    title: 'Verifica il Tuo Telefono',
    subtitle: 'One2OneLove richiede un numero di telefono verificato prima di usare le funzioni protette per i membri.',
    phone: 'Numero di Cellulare',
    phoneHint: 'Includi il prefisso internazionale, ad esempio +1 555 123 4567. Un numero mobile verificato può essere collegato a un solo account membro.',
    send: 'Invia Codice di Verifica',
    sending: 'Invio…',
    code: 'Codice SMS di 6 cifre',
    codeHint: 'Inserisci il codice inviato al tuo telefono.',
    verify: 'Verifica Telefono',
    verifying: 'Verifica…',
    resend: 'Invia un Nuovo Codice',
    success: 'Telefono verificato con successo.',
    invalidPhone: 'Inserisci un numero mobile valido con prefisso internazionale.',
    invalidCode: 'Inserisci il codice di 6 cifre ricevuto via SMS.',
    unavailable: 'La verifica telefonica non è ancora disponibile. Riprova quando sarà abilitata.',
    signOut: 'Esci',
    doorNote: 'Le funzioni per i membri restano bloccate finché il tuo telefono non è verificato. Verificalo ora, oppure esci e naviga come ospite.',
    bonusTitle:'Hai ricevuto $5,00 in Crediti di Gioco GRATIS!',bonusWhere:'Il tuo bonus ti aspetta nel tuo portafoglio di Credito. Puoi aprirlo quando vuoi con il pulsante ACQUISTA CREDITO in cima al sito, o dal tuo Profilo. In quella pagina il tuo bonus è in alto, con l’etichetta "O2OL Bonus Game Credits", proprio sotto il tuo Credito $.',bonusHow:'Quando giochi a qualsiasi gioco One2OneLove, i tuoi Crediti di Gioco vengono spesi per primi, prima di qualsiasi Credito pagato.',bonusExpires:'Usali entro il {date}: i Crediti di Gioco non utilizzati scadono in quella data.',bonusSee:'Vedi Il Mio Bonus di $5,00',bonusPlay:'Gioca Ora',bonusContinue:'Continua',
  },
  de: {
    title: 'Telefonnummer Bestätigen',
    subtitle: 'One2OneLove erfordert eine bestätigte Telefonnummer, bevor geschützte Mitgliederfunktionen genutzt werden können.',
    phone: 'Mobiltelefonnummer',
    phoneHint: 'Geben Sie die Landesvorwahl an, zum Beispiel +1 555 123 4567. Eine bestätigte Mobilnummer kann nur mit einem Mitgliedskonto verknüpft werden.',
    send: 'Bestätigungscode Senden',
    sending: 'Wird Gesendet…',
    code: '6-stelliger SMS-Code',
    codeHint: 'Geben Sie den Code ein, der an Ihr Telefon gesendet wurde.',
    verify: 'Telefon Bestätigen',
    verifying: 'Wird Bestätigt…',
    resend: 'Neuen Code Senden',
    success: 'Telefon erfolgreich bestätigt.',
    invalidPhone: 'Geben Sie eine gültige Mobilnummer mit Landesvorwahl ein.',
    invalidCode: 'Geben Sie den 6-stelligen SMS-Code ein.',
    unavailable: 'Die Telefonbestätigung ist noch nicht verfügbar. Versuchen Sie es erneut, nachdem sie aktiviert wurde.',
    signOut: 'Stattdessen Abmelden',
    doorNote: 'Mitgliederfunktionen bleiben gesperrt, bis Ihr Telefon bestätigt ist. Bestätigen Sie jetzt, oder melden Sie sich ab und surfen Sie als Gast.',
    bonusTitle:'Sie haben $5.00 in GRATIS Spiel-Credits erhalten!',bonusWhere:'Ihr Bonus wartet in Ihrer Credit-Wallet. Sie können sie jederzeit über die Schaltfläche CREDIT KAUFEN oben auf der Seite oder über Ihr Profil öffnen. Auf dieser Seite steht Ihr Bonus ganz oben, beschriftet mit „O2OL Bonus Game Credits", direkt unter Ihrem $ Credit.',bonusHow:'Wenn Sie ein One2OneLove-Spiel spielen, werden Ihre Spiel-Credits zuerst ausgegeben — vor jedem bezahlten Credit.',bonusExpires:'Nutzen Sie sie bis zum {date}: Nicht genutzte Spiel-Credits verfallen an diesem Datum.',bonusSee:'Meinen $5.00-Bonus Ansehen',bonusPlay:'Jetzt Ein Spiel Spielen',bonusContinue:'Weiter',
  },
};

function normalizePhone(value) {
  const text = String(value || '').trim();
  const compact = text.replace(/[\s().-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}

function nextRoute(user, redirect = null) {
  if (String(user?.role || '').toLowerCase() === 'admin') return '/Admin';
  return redirect || '/Home';
}

export default function VerifyPhone() {
  const { user, isAuthenticated, isLoading, refreshUserProfile, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const safeRedirect = (() => {
    const value = searchParams.get('redirect');
    return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
  })();
  const t = translations[currentLanguage] || translations.en;
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone_number || '');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState('phone');
  const [busy, setBusy] = useState(false);
  const [bonus, setBonus] = useState(null);

  const verified = user?.phoneNumberVerified === true || user?.phone_number_verified === true;
  const required = user?.phone_verification_required === true;
  const normalized = useMemo(() => normalizePhone(phone), [phone]);

  useEffect(() => {
    if (isLoading) return;
    if (bonus) return; // the bonus welcome panel is showing; it owns navigation
    if (!isAuthenticated || !user) {
      navigate(safeRedirect ? `/SignIn?redirect=${encodeURIComponent(safeRedirect)}` : '/SignIn', { replace: true });
      return;
    }
    if (!required || verified) {
      navigate(nextRoute(user, safeRedirect), { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, required, safeRedirect, user, verified]);

  useEffect(() => {
    const stored = user?.phoneNumber || user?.phone_number || '';
    if (stored && !phone) setPhone(stored);
  }, [phone, user?.phoneNumber, user?.phone_number]);

  const unavailable = error => {
    if ([404, 405, 503].includes(error?.status)) return t.unavailable;
    return error?.message || t.unavailable;
  };

  const signOutInstead = async () => {
    // The honest exit from the verification door: signing out ends the
    // member session. There is no "skip" into an unverified member account.
    await logout();
    navigate('/SignIn', { replace: true });
  };

  const sendCode = async () => {
    if (!normalized) return toast.error(t.invalidPhone);
    setBusy(true);
    try {
      await sendPhoneVerificationOtp(normalized);
      setPhase('code');
      setCode('');
    } catch (error) {
      toast.error(unavailable(error));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async event => {
    event.preventDefault();
    if (!normalized) return toast.error(t.invalidPhone);
    if (!/^\d{6}$/.test(code)) return toast.error(t.invalidCode);
    setBusy(true);
    try {
      const verification = await verifyPhoneNumberOtp(normalized, code);
      if (verification?.gameCreditBonus) {
        // Owner-directed wayfinding (2026-10-12): the $5 announcement used
        // to be a toast that faded in 8 seconds while the page navigated
        // away — new members could not find their bonus anywhere. When
        // the welcome bonus actually lands, hold a welcome panel that
        // says where the bonus lives and takes the member straight to
        // it. The panel owns navigation until the member picks a button.
        setBonus(verification.gameCreditBonus);
        toast.success(t.success);
        try { await refreshUserProfile(); } catch { /* panel already holds the moment */ }
        return;
      }
      const refreshed = await refreshUserProfile();
      toast.success(t.success);
      navigate(nextRoute(refreshed || user, safeRedirect), { replace: true });
    } catch (error) {
      toast.error(error?.message || t.invalidCode);
    } finally {
      setBusy(false);
    }
  };

  if (!bonus && (isLoading || !isAuthenticated || !user || !required || verified)) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (bonus) {
    const expiryDate = bonus.expiresAt ? new Date(bonus.expiresAt).toLocaleDateString() : null;
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
        <Card className="mx-auto max-w-xl shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <h1 className="mb-3 text-3xl font-bold text-gray-900">{t.bonusTitle}</h1>
            <p className="mb-4 text-gray-600">{t.bonusWhere}</p>
            <p className="mb-4 text-gray-600">{t.bonusHow}</p>
            {expiryDate && <p className="mb-8 font-semibold text-emerald-700">{t.bonusExpires.replace('{date}', expiryDate)}</p>}
            <div className="space-y-3">
              <Button type="button" onClick={() => navigate('/credit')} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 py-6 text-white">
                {t.bonusSee}
              </Button>
              <Button type="button" onClick={() => navigate('/cooperativegames')} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-white">
                {t.bonusPlay}
              </Button>
              <button type="button" onClick={() => navigate(nextRoute(user, safeRedirect), { replace: true })} className="w-full py-2 font-semibold text-gray-500 hover:text-gray-700">
                {t.bonusContinue}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <Card className="mx-auto max-w-xl shadow-2xl">
        <CardContent className="p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            {phase === 'code' ? <MessageSquareText className="h-9 w-9 text-purple-600" /> : <Phone className="h-9 w-9 text-purple-600" />}
          </div>
          <h1 className="mb-3 text-center text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="mb-8 text-center text-gray-600">{t.subtitle}</p>

          {phase === 'phone' ? (
            <div className="space-y-5">
              <div>
                <label htmlFor="o2ol-phone-number" className="mb-2 block text-sm font-semibold text-gray-700">{t.phone}</label>
                <Input
                  id="o2ol-phone-number"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+1 555 123 4567"
                  className="h-12"
                />
                <p className="mt-2 text-xs text-gray-500">{t.phoneHint}</p>
              </div>
              <Button type="button" onClick={sendCode} disabled={busy || !normalized} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-white">
                {busy ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.sending}</> : <><ShieldCheck className="mr-2 h-5 w-5" />{t.send}</>}
              </Button>
            </div>
          ) : (
            <form onSubmit={verifyCode} className="space-y-5">
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
                <div className="font-semibold">{normalized}</div>
                <div className="mt-1">{t.codeHint}</div>
              </div>
              <div>
                <label htmlFor="o2ol-phone-code" className="mb-2 block text-sm font-semibold text-gray-700">{t.code}</label>
                <Input
                  id="o2ol-phone-code"
                  value={code}
                  onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="h-14 text-center text-2xl font-black tracking-[0.35em]"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={busy || code.length !== 6} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-white">
                {busy ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.verifying}</> : <><CheckCircle2 className="mr-2 h-5 w-5" />{t.verify}</>}
              </Button>
              <Button type="button" variant="outline" onClick={sendCode} disabled={busy} className="w-full">{t.resend}</Button>
            </form>
          )}

          <div className="mt-8 border-t border-gray-100 pt-5 text-center">
            <p className="text-sm text-gray-500">{t.doorNote}</p>
            <Button type="button" variant="ghost" onClick={signOutInstead} className="mt-2 font-bold text-purple-700">
              <LogOut className="mr-2 h-4 w-4" />{t.signOut}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
