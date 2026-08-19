import React, { useState } from 'react';
import { Building, CheckCircle, Heart, Loader2, LockKeyhole, Mail, Phone, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/Layout';
import OtherUserSignupForm from '../components/signup/OtherUserSignupForm';
import ProfilePhotoUpload from '../components/signup/ProfilePhotoUpload';

const translations = {
  en: {
    title: 'Join as a Professional', subtitle: 'Apply to participate in One2OneLove as a coach, educator, consultant, or other relationship-adjacent professional.', basic: 'Account Information', first: 'First Name *', last: 'Last Name *', email: 'Email Address *', phone: 'Phone Number', optional: '(Optional)', password: 'Password *', confirmPassword: 'Confirm Password *', passwordHelp: 'Use at least 8 characters. You will use this password to sign in.', consentPrefix: 'I agree to the', terms: 'Terms of Service', and: 'and', privacy: 'Privacy Policy', submit: 'Submit Professional Application', submitting: 'Submitting application…', successTitle: 'Application Submitted', successCopy: 'Your professional application has been received and is pending review.', successEmail: 'If email confirmation is required for your account, check your inbox before signing in.', signIn: 'Go to Sign In', home: 'Back to Home', errors: { required: 'Complete all required account fields.', passwordLength: 'Password must be at least 8 characters.', passwordMatch: 'Passwords do not match.', organization: 'Enter your practice or organization name.', type: 'Select a practice type.', services: 'Describe the services you offer.', bio: 'Professional bio must be at least 100 characters.', consent: 'You must accept the Terms of Service and Privacy Policy.', submit: 'We could not submit the application. Please review the form and try again.' } },
  es: {
    title: 'Únete como Profesional', subtitle: 'Solicita participar en One2OneLove como coach, educador, consultor u otro profesional relacionado con las relaciones.', basic: 'Información de la Cuenta', first: 'Nombre *', last: 'Apellido *', email: 'Correo Electrónico *', phone: 'Número de Teléfono', optional: '(Opcional)', password: 'Contraseña *', confirmPassword: 'Confirmar Contraseña *', passwordHelp: 'Usa al menos 8 caracteres. Utilizarás esta contraseña para iniciar sesión.', consentPrefix: 'Acepto los', terms: 'Términos de Servicio', and: 'y la', privacy: 'Política de Privacidad', submit: 'Enviar Solicitud Profesional', submitting: 'Enviando solicitud…', successTitle: 'Solicitud Enviada', successCopy: 'Hemos recibido tu solicitud profesional y está pendiente de revisión.', successEmail: 'Si tu cuenta requiere confirmación de correo, revisa tu bandeja de entrada antes de iniciar sesión.', signIn: 'Ir a Iniciar Sesión', home: 'Volver al Inicio', errors: { required: 'Completa todos los campos obligatorios de la cuenta.', passwordLength: 'La contraseña debe tener al menos 8 caracteres.', passwordMatch: 'Las contraseñas no coinciden.', organization: 'Ingresa el nombre de tu práctica u organización.', type: 'Selecciona un tipo de práctica.', services: 'Describe los servicios que ofreces.', bio: 'La biografía profesional debe tener al menos 100 caracteres.', consent: 'Debes aceptar los Términos de Servicio y la Política de Privacidad.', submit: 'No pudimos enviar la solicitud. Revisa el formulario e inténtalo de nuevo.' } },
  fr: {
    title: 'Rejoindre comme Professionnel', subtitle: 'Candidatez pour participer à One2OneLove comme coach, éducateur, consultant ou autre professionnel lié aux relations.', basic: 'Informations du Compte', first: 'Prénom *', last: 'Nom *', email: 'Adresse E-mail *', phone: 'Numéro de Téléphone', optional: '(Facultatif)', password: 'Mot de Passe *', confirmPassword: 'Confirmer le Mot de Passe *', passwordHelp: 'Utilisez au moins 8 caractères. Ce mot de passe servira à vous connecter.', consentPrefix: 'J’accepte les', terms: 'Conditions d’Utilisation', and: 'et la', privacy: 'Politique de Confidentialité', submit: 'Envoyer la Candidature Professionnelle', submitting: 'Envoi de la candidature…', successTitle: 'Candidature Envoyée', successCopy: 'Votre candidature professionnelle a été reçue et est en attente d’examen.', successEmail: 'Si une confirmation e-mail est requise pour votre compte, consultez votre boîte de réception avant de vous connecter.', signIn: 'Aller à la Connexion', home: 'Retour à l’Accueil', errors: { required: 'Complétez tous les champs obligatoires du compte.', passwordLength: 'Le mot de passe doit comporter au moins 8 caractères.', passwordMatch: 'Les mots de passe ne correspondent pas.', organization: 'Indiquez le nom de votre cabinet ou organisation.', type: 'Sélectionnez un type de pratique.', services: 'Décrivez les services que vous proposez.', bio: 'La bio professionnelle doit comporter au moins 100 caractères.', consent: 'Vous devez accepter les Conditions d’Utilisation et la Politique de Confidentialité.', submit: 'Nous n’avons pas pu envoyer la candidature. Vérifiez le formulaire et réessayez.' } },
  it: {
    title: 'Unisciti come Professionista', subtitle: 'Candidati per partecipare a One2OneLove come coach, educatore, consulente o altro professionista collegato alle relazioni.', basic: 'Informazioni Account', first: 'Nome *', last: 'Cognome *', email: 'Indirizzo Email *', phone: 'Numero di Telefono', optional: '(Facoltativo)', password: 'Password *', confirmPassword: 'Conferma Password *', passwordHelp: 'Usa almeno 8 caratteri. Utilizzerai questa password per accedere.', consentPrefix: 'Accetto i', terms: 'Termini di Servizio', and: 'e la', privacy: 'Informativa Privacy', submit: 'Invia Candidatura Professionale', submitting: 'Invio candidatura…', successTitle: 'Candidatura Inviata', successCopy: 'La tua candidatura professionale è stata ricevuta ed è in attesa di revisione.', successEmail: 'Se per il tuo account è richiesta la conferma email, controlla la posta prima di accedere.', signIn: 'Vai all’Accesso', home: 'Torna alla Home', errors: { required: 'Completa tutti i campi obbligatori dell’account.', passwordLength: 'La password deve contenere almeno 8 caratteri.', passwordMatch: 'Le password non coincidono.', organization: 'Inserisci il nome dello studio o dell’organizzazione.', type: 'Seleziona un tipo di attività.', services: 'Descrivi i servizi che offri.', bio: 'La bio professionale deve contenere almeno 100 caratteri.', consent: 'Devi accettare i Termini di Servizio e l’Informativa Privacy.', submit: 'Non è stato possibile inviare la candidatura. Controlla il modulo e riprova.' } },
  de: {
    title: 'Als Fachperson Beitreten', subtitle: 'Bewirb dich für One2OneLove als Coach, Pädagoge, Berater oder andere beziehungsnahe Fachperson.', basic: 'Kontoinformationen', first: 'Vorname *', last: 'Nachname *', email: 'E-Mail-Adresse *', phone: 'Telefonnummer', optional: '(Optional)', password: 'Passwort *', confirmPassword: 'Passwort Bestätigen *', passwordHelp: 'Verwende mindestens 8 Zeichen. Mit diesem Passwort meldest du dich später an.', consentPrefix: 'Ich akzeptiere die', terms: 'Nutzungsbedingungen', and: 'und die', privacy: 'Datenschutzrichtlinie', submit: 'Professionelle Bewerbung Senden', submitting: 'Bewerbung wird gesendet…', successTitle: 'Bewerbung Gesendet', successCopy: 'Deine professionelle Bewerbung wurde empfangen und wartet auf Prüfung.', successEmail: 'Falls für dein Konto eine E-Mail-Bestätigung erforderlich ist, prüfe dein Postfach vor der Anmeldung.', signIn: 'Zur Anmeldung', home: 'Zurück zur Startseite', errors: { required: 'Fülle alle erforderlichen Kontofelder aus.', passwordLength: 'Das Passwort muss mindestens 8 Zeichen lang sein.', passwordMatch: 'Die Passwörter stimmen nicht überein.', organization: 'Gib den Namen deiner Praxis oder Organisation ein.', type: 'Wähle eine Tätigkeitsart aus.', services: 'Beschreibe deine angebotenen Leistungen.', bio: 'Die professionelle Bio muss mindestens 100 Zeichen lang sein.', consent: 'Du musst die Nutzungsbedingungen und die Datenschutzrichtlinie akzeptieren.', submit: 'Die Bewerbung konnte nicht gesendet werden. Prüfe das Formular und versuche es erneut.' } },
};

export default function ProfessionalSignup() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { registerProfessional } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [otherUserBio, setOtherUserBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [formError, setFormError] = useState('');

  const uploadPhoto = async (file) => {
    if (!file) return null;
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `professional-profiles/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from('professional-photos').upload(filePath, file, { upsert: false });
      if (error) return null;
      return supabase.storage.from('professional-photos').getPublicUrl(filePath).data.publicUrl;
    } catch {
      return null;
    }
  };

  const validate = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) return t.errors.required;
    if (password.length < 8) return t.errors.passwordLength;
    if (password !== confirmPassword) return t.errors.passwordMatch;
    if (!organizationName.trim()) return t.errors.organization;
    if (!organizationType) return t.errors.type;
    if (!serviceDescription.trim()) return t.errors.services;
    if (otherUserBio.trim().length < 100) return t.errors.bio;
    if (!acceptedTerms) return t.errors.consent;
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const photoUrl = await uploadPhoto(photoFile);
      const result = await registerProfessional(
        { email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim() },
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
          organizationName: organizationName.trim(),
          practiceType: organizationType,
          serviceDescription: serviceDescription.trim(),
          websiteUrl: websiteUrl.trim() || null,
          professionalBio: otherUserBio.trim(),
          profilePhotoUrl: photoUrl,
          emailVerified: false,
          phoneVerified: false,
        },
      );

      if (!result?.success) {
        setFormError(t.errors.submit);
        return;
      }
      setSignupComplete(true);
    } catch {
      setFormError(t.errors.submit);
    } finally {
      setIsLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center shadow-2xl md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100"><CheckCircle className="h-12 w-12 text-green-600" aria-hidden="true" /></div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 md:text-4xl">{t.successTitle}</h1>
          <p className="mt-4 text-lg text-gray-600">{t.successCopy}</p>
          <p className="mt-3 text-sm leading-6 text-gray-500">{t.successEmail}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild><Link to="/SignIn">{t.signIn}</Link></Button>
            <Button asChild variant="outline"><Link to="/">{t.home}</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4 py-10 md:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl"><Building className="h-8 w-8 text-white" aria-hidden="true" /></div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">{t.subtitle}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}

          <section className="rounded-xl border-2 border-blue-200 bg-white p-6 shadow-lg" aria-labelledby="professional-account-title">
            <h2 id="professional-account-title" className="mb-4 text-xl font-bold text-gray-800">{t.basic}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">{t.first}<div className="relative mt-2"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><input type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-400" required /></div></label>
              <label className="block text-sm font-medium text-gray-700">{t.last}<div className="relative mt-2"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><input type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-400" required /></div></label>
              <label className="block text-sm font-medium text-gray-700">{t.email}<div className="relative mt-2"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-400" required /></div></label>
              <label className="block text-sm font-medium text-gray-700">{t.phone} <span className="text-xs font-normal text-gray-400">{t.optional}</span><div className="relative mt-2"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-400" /></div></label>
              <label className="block text-sm font-medium text-gray-700">{t.password}<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-400" required /></div><span className="mt-1 block text-xs font-normal text-gray-500">{t.passwordHelp}</span></label>
              <label className="block text-sm font-medium text-gray-700">{t.confirmPassword}<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-400" required /></div></label>
            </div>
          </section>

          <ProfilePhotoUpload photoFile={photoFile} setPhotoFile={setPhotoFile} photoPreview={photoPreview} setPhotoPreview={setPhotoPreview} />
          <OtherUserSignupForm organizationName={organizationName} setOrganizationName={setOrganizationName} organizationType={organizationType} setOrganizationType={setOrganizationType} serviceDescription={serviceDescription} setServiceDescription={setServiceDescription} websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl} otherUserBio={otherUserBio} setOtherUserBio={setOtherUserBio} />

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4" required />
            <span>{t.consentPrefix} <Link className="font-semibold text-blue-700 underline" to="/TermsOfService">{t.terms}</Link> {t.and} <Link className="font-semibold text-blue-700 underline" to="/PrivacyPolicy">{t.privacy}</Link>.</span>
          </label>

          <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 py-6 text-base font-semibold text-white hover:from-blue-600 hover:to-indigo-700">
            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />{t.submitting}</> : t.submit}
          </Button>
        </form>
      </div>
    </div>
  );
}
