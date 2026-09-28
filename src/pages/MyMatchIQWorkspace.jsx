import { Link } from 'react-router-dom';
import { BrainCircuit, ClipboardCheck, HeartHandshake, LockKeyhole, Send, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from './Layout';

const COPY = {
  en: {
    eyebrow: 'MyMatchIQ member space',
    assessmentTitle: 'Your Compatibility Passport',
    assessmentBody: 'Build a private foundation for clearer choices and stronger connections.',
    actionTitle: 'Choose your next step',
    actionBody: 'MyMatchIQ keeps compatibility, consent, and safety at the center of every connection.',
    dashboardTitle: 'Your MyMatchIQ workspace',
    dashboardBody: 'Your account is recognized here. Compatibility records will appear here once the secure account connection is complete.',
    inviteTitle: 'Invite with intention',
    inviteBody: 'Invite someone to explore compatibility together. A connection only moves forward when both people choose it.',
    signInTitle: 'Welcome back to MyMatchIQ',
    signInBody: 'Use your MyMatchIQ member sign-in. This will become the shared One2OneLove account sign-in after secure migration.',
    signUpTitle: 'Create your MyMatchIQ account',
    signUpBody: 'Start with compatibility. You can add One2OneLove when you want its relationship-growth tools.',
    passport: 'Compatibility Passport',
    single: 'Single Scan',
    dual: 'Dual Scan',
    safety: 'Safety & privacy',
    begin: 'Begin your Passport',
    seeActions: 'Explore MyMatchIQ',
    create: 'Create MyMatchIQ account',
    signIn: 'Sign in to MyMatchIQ',
    continue: 'Continue to your workspace',
    comingTitle: 'Secure integration in progress',
    comingBody: 'The member area is now inside One2OneLove Prelaunch. Existing MyMatchIQ accounts and assessment records will be connected only after their secure migration is verified.',
    memberOnly: 'Sign in to use this member feature.',
    o2olNote: 'Want the relationship-growth tools too?',
    o2olButton: 'Explore One2OneLove',
  },
  es: {
    eyebrow: 'Espacio de miembros MyMatchIQ', assessmentTitle: 'Tu Pasaporte de Compatibilidad', assessmentBody: 'Crea una base privada para decisiones más claras y conexiones más fuertes.', actionTitle: 'Elige tu siguiente paso', actionBody: 'MyMatchIQ mantiene la compatibilidad, el consentimiento y la seguridad en el centro de cada conexión.', dashboardTitle: 'Tu espacio MyMatchIQ', dashboardBody: 'Tu cuenta se reconoce aquí. Los registros de compatibilidad aparecerán cuando se complete la conexión segura de cuentas.', inviteTitle: 'Invita con intención', inviteBody: 'Invita a alguien a explorar la compatibilidad contigo. Una conexión solo avanza cuando ambas personas lo eligen.', signInTitle: 'Bienvenido de nuevo a MyMatchIQ', signInBody: 'Usa tu acceso de miembro MyMatchIQ. Tras la migración segura, será el acceso compartido de One2OneLove.', signUpTitle: 'Crea tu cuenta MyMatchIQ', signUpBody: 'Comienza con compatibilidad. Puedes añadir One2OneLove cuando quieras sus herramientas de crecimiento relacional.', passport: 'Pasaporte de Compatibilidad', single: 'Escaneo Individual', dual: 'Escaneo Dual', safety: 'Seguridad y privacidad', begin: 'Comienza tu Pasaporte', seeActions: 'Explora MyMatchIQ', create: 'Crear cuenta MyMatchIQ', signIn: 'Iniciar sesión en MyMatchIQ', continue: 'Continuar a tu espacio', comingTitle: 'Integración segura en curso', comingBody: 'El área de miembros ya está dentro de One2OneLove Prelaunch. Las cuentas y registros existentes se conectarán solo tras verificar su migración segura.', memberOnly: 'Inicia sesión para usar esta función.', o2olNote: '¿También quieres herramientas para crecer en tu relación?', o2olButton: 'Explora One2OneLove',
  },
  fr: {
    eyebrow: 'Espace membre MyMatchIQ', assessmentTitle: 'Votre Passeport de Compatibilité', assessmentBody: 'Créez une base privée pour des choix plus clairs et des liens plus forts.', actionTitle: 'Choisissez votre prochaine étape', actionBody: 'MyMatchIQ place la compatibilité, le consentement et la sécurité au cœur de chaque connexion.', dashboardTitle: 'Votre espace MyMatchIQ', dashboardBody: 'Votre compte est reconnu ici. Les dossiers de compatibilité apparaîtront après la connexion sécurisée des comptes.', inviteTitle: 'Invitez avec intention', inviteBody: 'Invitez une personne à explorer la compatibilité ensemble. Une connexion n’avance que lorsque les deux personnes le choisissent.', signInTitle: 'Bon retour sur MyMatchIQ', signInBody: 'Utilisez votre accès membre MyMatchIQ. Après la migration sécurisée, ce sera l’accès partagé One2OneLove.', signUpTitle: 'Créez votre compte MyMatchIQ', signUpBody: 'Commencez par la compatibilité. Ajoutez One2OneLove lorsque vous souhaitez ses outils de croissance relationnelle.', passport: 'Passeport de Compatibilité', single: 'Analyse Individuelle', dual: 'Analyse Double', safety: 'Sécurité et confidentialité', begin: 'Commencer votre Passeport', seeActions: 'Explorer MyMatchIQ', create: 'Créer un compte MyMatchIQ', signIn: 'Se connecter à MyMatchIQ', continue: 'Continuer vers votre espace', comingTitle: 'Intégration sécurisée en cours', comingBody: 'L’espace membre est désormais dans One2OneLove Prelaunch. Les comptes et dossiers existants ne seront connectés qu’après vérification de leur migration sécurisée.', memberOnly: 'Connectez-vous pour utiliser cette fonction.', o2olNote: 'Vous souhaitez aussi des outils pour faire grandir votre relation ?', o2olButton: 'Explorer One2OneLove',
  },
  it: {
    eyebrow: 'Area membri MyMatchIQ', assessmentTitle: 'Il tuo Passaporto di Compatibilità', assessmentBody: 'Crea una base privata per scelte più chiare e connessioni più forti.', actionTitle: 'Scegli il tuo prossimo passo', actionBody: 'MyMatchIQ mantiene compatibilità, consenso e sicurezza al centro di ogni connessione.', dashboardTitle: 'Il tuo spazio MyMatchIQ', dashboardBody: 'Il tuo account è riconosciuto qui. I dati di compatibilità appariranno quando la connessione sicura degli account sarà completata.', inviteTitle: 'Invita con intenzione', inviteBody: 'Invita qualcuno a esplorare la compatibilità insieme. Una connessione procede solo quando entrambe le persone lo scelgono.', signInTitle: 'Bentornato su MyMatchIQ', signInBody: 'Usa il tuo accesso membro MyMatchIQ. Dopo la migrazione sicura, sarà l’accesso condiviso One2OneLove.', signUpTitle: 'Crea il tuo account MyMatchIQ', signUpBody: 'Inizia dalla compatibilità. Puoi aggiungere One2OneLove quando desideri i suoi strumenti per la crescita della relazione.', passport: 'Passaporto di Compatibilità', single: 'Scansione Singola', dual: 'Scansione Doppia', safety: 'Sicurezza e privacy', begin: 'Inizia il tuo Passaporto', seeActions: 'Esplora MyMatchIQ', create: 'Crea account MyMatchIQ', signIn: 'Accedi a MyMatchIQ', continue: 'Continua al tuo spazio', comingTitle: 'Integrazione sicura in corso', comingBody: 'L’area membri è ora dentro One2OneLove Prelaunch. Gli account e i dati MyMatchIQ esistenti saranno collegati solo dopo la verifica della migrazione sicura.', memberOnly: 'Accedi per usare questa funzione.', o2olNote: 'Vuoi anche gli strumenti per far crescere la relazione?', o2olButton: 'Esplora One2OneLove',
  },
  de: {
    eyebrow: 'MyMatchIQ-Mitgliederbereich', assessmentTitle: 'Ihr Kompatibilitäts-Pass', assessmentBody: 'Schaffen Sie eine private Grundlage für klarere Entscheidungen und stärkere Verbindungen.', actionTitle: 'Wählen Sie Ihren nächsten Schritt', actionBody: 'MyMatchIQ stellt Kompatibilität, Einwilligung und Sicherheit in den Mittelpunkt jeder Verbindung.', dashboardTitle: 'Ihr MyMatchIQ-Bereich', dashboardBody: 'Ihr Konto wird hier erkannt. Kompatibilitätsdaten erscheinen nach Abschluss der sicheren Kontoverbindung.', inviteTitle: 'Mit Absicht einladen', inviteBody: 'Laden Sie jemanden ein, gemeinsam Kompatibilität zu erkunden. Eine Verbindung geht nur weiter, wenn beide Personen dies wünschen.', signInTitle: 'Willkommen zurück bei MyMatchIQ', signInBody: 'Nutzen Sie Ihre MyMatchIQ-Mitgliederanmeldung. Nach der sicheren Migration wird dies die gemeinsame One2OneLove-Anmeldung sein.', signUpTitle: 'Erstellen Sie Ihr MyMatchIQ-Konto', signUpBody: 'Beginnen Sie mit Kompatibilität. Fügen Sie One2OneLove hinzu, wenn Sie dessen Beziehungstools nutzen möchten.', passport: 'Kompatibilitäts-Pass', single: 'Einzel-Scan', dual: 'Doppel-Scan', safety: 'Sicherheit & Datenschutz', begin: 'Pass beginnen', seeActions: 'MyMatchIQ entdecken', create: 'MyMatchIQ-Konto erstellen', signIn: 'Bei MyMatchIQ anmelden', continue: 'Weiter zu Ihrem Bereich', comingTitle: 'Sichere Integration läuft', comingBody: 'Der Mitgliederbereich ist jetzt in One2OneLove Prelaunch. Bestehende MyMatchIQ-Konten und Daten werden erst nach bestätigter sicherer Migration verbunden.', memberOnly: 'Melden Sie sich an, um diese Funktion zu nutzen.', o2olNote: 'Möchten Sie auch Tools für Ihre Beziehung?', o2olButton: 'One2OneLove entdecken',
  },
};

const featureStyle = 'rounded-3xl border border-white/15 bg-white/[0.06] p-6 text-white shadow-[0_16px_44px_rgba(9,2,25,0.28)] backdrop-blur';
const actionClass = 'inline-flex items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110';

export default function MyMatchIQWorkspace({ page = 'assessment' }) {
  const { currentLanguage } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const t = COPY[currentLanguage] || COPY.en;
  const isDashboard = page === 'dashboard';
  const isInvite = page === 'invite';
  const isSignIn = page === 'signin';
  const isSignUp = page === 'signup';
  const title = isDashboard ? t.dashboardTitle : isInvite ? t.inviteTitle : isSignIn ? t.signInTitle : isSignUp ? t.signUpTitle : page === 'actions' ? t.actionTitle : t.assessmentTitle;
  const body = isDashboard ? t.dashboardBody : isInvite ? t.inviteBody : isSignIn ? t.signInBody : isSignUp ? t.signUpBody : page === 'actions' ? t.actionBody : t.assessmentBody;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#5b126f_0%,transparent_32%),radial-gradient(circle_at_80%_16%,#162e78_0%,transparent_30%),#070312] px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200">{t.eyebrow}</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-center text-4xl font-black text-white sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-8 text-white/80">{body}</p>

        {(isSignIn || isSignUp) && (
          <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-fuchsia-200/25 bg-black/35 p-7 text-center shadow-2xl backdrop-blur">
            <img src="/assets/mymatchiq-official-logo.webp" alt="MyMatchIQ" className="mx-auto h-16 w-auto object-contain" />
            <p className="mt-5 text-sm leading-6 text-white/75">{isSignIn ? t.signInBody : t.signUpBody}</p>
            <Link to={isSignIn ? '/SignIn?source=mymatchiq&returnTo=%2FMyMatchIQ%2FDashboard' : '/SignUp?source=mymatchiq&type=individual'} className={`${actionClass} mt-6`}>
              {isSignIn ? t.signIn : t.create}
            </Link>
          </section>
        )}

        {!isSignIn && !isSignUp && (
          <>
            <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                [ClipboardCheck, t.passport, t.assessmentBody],
                [BrainCircuit, t.single, t.actionBody],
                [HeartHandshake, t.dual, t.inviteBody],
                [ShieldCheck, t.safety, t.comingBody],
              ].map(([Icon, label, text]) => (
                <article key={label} className={featureStyle}>
                  <Icon className="h-9 w-9 text-fuchsia-300" aria-hidden="true" />
                  <h2 className="mt-4 text-xl font-black">{label}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/75">{text}</p>
                </article>
              ))}
            </section>

            <section className="mt-7 rounded-3xl border border-fuchsia-300/25 bg-black/35 p-6 shadow-xl backdrop-blur sm:p-8">
              {isAuthenticated ? (
                <>
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div><p className="text-sm font-bold text-fuchsia-200">{user?.name || user?.email}</p><h2 className="mt-1 text-2xl font-black text-white">{t.comingTitle}</h2><p className="mt-2 max-w-3xl leading-7 text-white/75">{t.comingBody}</p></div>
                    <Link to="/SignUp?source=mymatchiq-o2ol" className={actionClass}>{t.o2olButton}</Link>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left"><div><h2 className="text-2xl font-black text-white">{t.memberOnly}</h2><p className="mt-2 text-white/75">{t.o2olNote}</p></div><div className="flex flex-wrap justify-center gap-3"><Link to="/MyMatchIQ/SignIn" className={actionClass}>{t.signIn}</Link><Link to="/MyMatchIQ/SignUp" className="inline-flex items-center justify-center rounded-full border border-fuchsia-200/40 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20">{t.create}</Link></div></div>
              )}
            </section>

            {isInvite && <section className="mt-7 rounded-3xl border border-cyan-200/25 bg-cyan-950/25 p-6 text-center text-white shadow-xl"><Send className="mx-auto h-9 w-9 text-cyan-200" aria-hidden="true" /><h2 className="mt-3 text-2xl font-black">{t.inviteTitle}</h2><p className="mx-auto mt-2 max-w-2xl text-white/75">{t.inviteBody}</p><Link to={isAuthenticated ? '/MyMatchIQ/Dashboard' : '/MyMatchIQ/SignIn'} className={`${actionClass} mt-5`}>{isAuthenticated ? t.continue : t.signIn}</Link></section>}
          </>
        )}
      </section>
    </main>
  );
}
