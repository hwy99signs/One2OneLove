import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';
import RegularUserRelaunchForm from '@/components/signup/RegularUserRelaunchForm';

const COPY = {
  en: {
    eyebrow: 'FREE ONE2ONELOVE ACCOUNT',
    title: 'Come in. The relationship can grow from here.',
    body: 'Create a free account to reveal private Love Notes, join the community, and continue the experiences that brought you here.',
    existing: 'Already have an account?', signIn: 'Sign in',
    professional: 'Joining in a professional role?',
    therapist: 'Therapist application', influencer: 'Influencer application', partner: 'Professional application',
  },
  es: {
    eyebrow: 'CUENTA GRATIS DE ONE2ONELOVE', title: 'Entra. La relación puede crecer desde aquí.',
    body: 'Crea una cuenta gratis para revelar Love Notes privadas, unirte a la comunidad y continuar las experiencias que te trajeron aquí.',
    existing: '¿Ya tienes una cuenta?', signIn: 'Iniciar sesión', professional: '¿Te unes en un rol profesional?',
    therapist: 'Solicitud de terapeuta', influencer: 'Solicitud de influencer', partner: 'Solicitud profesional',
  },
  fr: {
    eyebrow: 'COMPTE ONE2ONELOVE GRATUIT', title: 'Entrez. La relation peut grandir à partir d’ici.',
    body: 'Créez un compte gratuit pour révéler des Love Notes privées, rejoindre la communauté et poursuivre les expériences qui vous ont amené ici.',
    existing: 'Vous avez déjà un compte ?', signIn: 'Se connecter', professional: 'Vous nous rejoignez à titre professionnel ?',
    therapist: 'Candidature thérapeute', influencer: 'Candidature influenceur', partner: 'Candidature professionnelle',
  },
  it: {
    eyebrow: 'ACCOUNT ONE2ONELOVE GRATUITO', title: 'Entra. La relazione può crescere da qui.',
    body: 'Crea un account gratuito per rivelare Love Notes private, partecipare alla community e continuare le esperienze che ti hanno portato qui.',
    existing: 'Hai già un account?', signIn: 'Accedi', professional: 'Ti unisci con un ruolo professionale?',
    therapist: 'Candidatura terapeuta', influencer: 'Candidatura influencer', partner: 'Candidatura professionale',
  },
  de: {
    eyebrow: 'KOSTENLOSES ONE2ONELOVE-KONTO', title: 'Komm rein. Von hier aus kann die Beziehung wachsen.',
    body: 'Erstelle ein kostenloses Konto, um private Love Notes zu öffnen, der Community beizutreten und das fortzusetzen, was dich hierhergebracht hat.',
    existing: 'Du hast schon ein Konto?', signIn: 'Anmelden', professional: 'Du möchtest in einer professionellen Rolle teilnehmen?',
    therapist: 'Therapeuten-Bewerbung', influencer: 'Influencer-Bewerbung', partner: 'Professionelle Bewerbung',
  },
  nl: {
    eyebrow: 'GRATIS ONE2ONELOVE-ACCOUNT', title: 'Kom binnen. Vanaf hier kan de relatie groeien.',
    body: 'Maak een gratis account om privé Love Notes te onthullen, deel te nemen aan de community en verder te gaan met wat je hier bracht.',
    existing: 'Heb je al een account?', signIn: 'Inloggen', professional: 'Doe je mee in een professionele rol?',
    therapist: 'Therapeut-aanvraag', influencer: 'Influencer-aanvraag', partner: 'Professionele aanvraag',
  },
};

const language = () => {
  if (typeof window === 'undefined') return 'en';
  const value = window.localStorage?.getItem('preferredLanguage') || 'en';
  return COPY[value] ? value : 'en';
};

const safeReturnTo = (value) => {
  if (!value || typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
};

export default function SignUp() {
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const t = COPY[language()] || COPY.en;
  const signInHref = `/SignIn?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 px-4 py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="pt-4 lg:sticky lg:top-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-pink-700">
            <Heart className="h-5 w-5 fill-current" />
            One2OneLove
          </Link>

          <p className="mt-8 text-sm font-black tracking-[0.18em] text-pink-700">{t.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mt-5 text-lg leading-8 text-gray-600">{t.body}</p>

          <div className="mt-7 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
              <p className="text-sm text-gray-700">Email confirmation protects private Love Note reveals and member-only experiences.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-pink-700" />
              <p className="text-sm text-gray-700">Creating this account does not enroll you in a paid membership or ask for payment information.</p>
            </div>
          </div>

          <p className="mt-7 text-sm text-gray-600">
            {t.existing}{' '}
            <Link to={signInHref} className="font-bold text-purple-700 underline">{t.signIn}</Link>
          </p>

          <div className="mt-8 border-t border-pink-200 pt-6">
            <p className="text-sm font-bold text-gray-800">{t.professional}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link to="/TherapistSignup" className="font-semibold text-teal-700 underline">{t.therapist}</Link>
              <Link to="/InfluencerSignup" className="font-semibold text-pink-700 underline">{t.influencer}</Link>
              <Link to="/ProfessionalSignup" className="font-semibold text-blue-700 underline">{t.partner}</Link>
            </div>
          </div>
        </section>

        <RegularUserRelaunchForm returnTo={returnTo} />
      </div>
    </div>
  );
}
