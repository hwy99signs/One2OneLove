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

  const verified = user?.phoneNumberVerified === true || user?.phone_number_verified === true;
  const required = user?.phone_verification_required === true;
  const normalized = useMemo(() => normalizePhone(phone), [phone]);

  useEffect(() => {
    if (isLoading) return;
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
      const refreshed = await refreshUserProfile();
      toast.success(verification?.gameCreditBonus?.welcome || t.success,{duration:8000});
      navigate(nextRoute(refreshed || user, safeRedirect), { replace: true });
    } catch (error) {
      toast.error(error?.message || t.invalidCode);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !isAuthenticated || !user || !required || verified) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
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
