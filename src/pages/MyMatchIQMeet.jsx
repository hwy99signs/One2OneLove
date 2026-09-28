import { Link } from 'react-router-dom';
import { ClipboardCheck, Gamepad2, HeartHandshake, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from './Layout';

const COPY = {
  en: { eyebrow:'MyMatchIQ intentional-member space', title:'Meet Intentional Members', body:'A structured space for people who want to learn compatibility before deciding where a connection could go.', profile:'Build your member profile', profileBody:'Choose what you want to share and opt in before you can be discovered.', play:'Send a Let’s Play invitation', playBody:'A connection begins only when both members choose to play.', grow:'Let the game be the icebreaker', growBody:'Explore compatibility and Like-Minded questions together—without a public chat room.', safetyTitle:'Built around mutual choice', safety:'No open public chat. No unsolicited direct messages. Profiles, invitations, and any future private continuation are controlled by mutual consent.', assessment:'Take the assessment', membership:'View membership options', signIn:'Sign in to MyMatchIQ', readyTitle:'Start with your Compatibility Passport', readyBody:'Your assessment prepares you for more intentional games and invitations when the member experience opens.', prelaunch:'The intentional-member experience is being built in Prelaunch. Member discovery will only open after profile privacy, reporting, blocking, and invitation controls are ready.' },
  es: { eyebrow:'Espacio de miembros intencionales MyMatchIQ', title:'Conoce Miembros Intencionales', body:'Un espacio estructurado para quienes desean conocer la compatibilidad antes de decidir hacia dónde puede ir una conexión.', profile:'Crea tu perfil de miembro', profileBody:'Elige qué deseas compartir y acepta participar antes de poder aparecer.', play:'Envía una invitación a Jugar', playBody:'Una conexión comienza solo cuando ambas personas eligen jugar.', grow:'Deja que el juego rompa el hielo', growBody:'Explora preguntas de compatibilidad y Like-Minded juntos, sin una sala de chat pública.', safetyTitle:'Basado en la elección mutua', safety:'Sin chat público abierto. Sin mensajes directos no solicitados. Los perfiles, invitaciones y cualquier continuación privada futura se controlan con consentimiento mutuo.', assessment:'Realizar la evaluación', membership:'Ver opciones de membresía', signIn:'Iniciar sesión en MyMatchIQ', readyTitle:'Comienza con tu Pasaporte de Compatibilidad', readyBody:'Tu evaluación te prepara para juegos e invitaciones más intencionales cuando se abra la experiencia de miembros.', prelaunch:'La experiencia de miembros intencionales se está construyendo en Prelaunch. El descubrimiento de miembros solo se abrirá después de contar con controles de privacidad, reportes, bloqueo e invitaciones.' },
  fr: { eyebrow:'Espace membres intentionnels MyMatchIQ', title:'Rencontrer des Membres Intentionnels', body:'Un espace structuré pour les personnes qui souhaitent comprendre la compatibilité avant de décider où une connexion peut mener.', profile:'Créez votre profil membre', profileBody:'Choisissez ce que vous partagez et inscrivez-vous avant de pouvoir être découvert.', play:'Envoyez une invitation Let’s Play', playBody:'Une connexion commence uniquement lorsque les deux membres choisissent de jouer.', grow:'Laissez le jeu briser la glace', growBody:'Explorez ensemble des questions de compatibilité et Like-Minded, sans salon de discussion public.', safetyTitle:'Fondé sur le choix mutuel', safety:'Pas de chat public ouvert. Pas de messages directs non sollicités. Les profils, invitations et toute future suite privée sont contrôlés par consentement mutuel.', assessment:'Faire l’évaluation', membership:'Voir les options d’abonnement', signIn:'Se connecter à MyMatchIQ', readyTitle:'Commencez par votre Passeport de Compatibilité', readyBody:'Votre évaluation vous prépare à des jeux et invitations plus intentionnels lorsque l’expérience membre ouvrira.', prelaunch:'L’expérience des membres intentionnels est en cours de création dans Prelaunch. La découverte des membres ne s’ouvrira qu’après la mise en place des contrôles de confidentialité, signalement, blocage et invitation.' },
  it: { eyebrow:'Spazio membri intenzionali MyMatchIQ', title:'Incontra Membri Intenzionali', body:'Uno spazio strutturato per chi desidera conoscere la compatibilità prima di decidere dove può portare una connessione.', profile:'Crea il tuo profilo membro', profileBody:'Scegli cosa condividere e dai il consenso prima di poter essere scoperto.', play:'Invia un invito Let’s Play', playBody:'Una connessione inizia solo quando entrambi i membri scelgono di giocare.', grow:'Lascia che il gioco rompa il ghiaccio', growBody:'Esplora insieme domande di compatibilità e Like-Minded, senza una chat pubblica.', safetyTitle:'Basato sulla scelta reciproca', safety:'Nessuna chat pubblica aperta. Nessun messaggio diretto non richiesto. Profili, inviti e qualsiasi futura continuazione privata sono controllati dal consenso reciproco.', assessment:'Fai la valutazione', membership:'Vedi le opzioni di abbonamento', signIn:'Accedi a MyMatchIQ', readyTitle:'Inizia con il tuo Passaporto di Compatibilità', readyBody:'La tua valutazione ti prepara a giochi e inviti più intenzionali quando l’esperienza membri sarà disponibile.', prelaunch:'L’esperienza dei membri intenzionali è in costruzione in Prelaunch. La scoperta dei membri si aprirà solo dopo che saranno pronti i controlli di privacy, segnalazione, blocco e invito.' },
  de: { eyebrow:'MyMatchIQ-Bereich für absichtsvolle Mitglieder', title:'Absichtsvolle Mitglieder Treffen', body:'Ein strukturierter Bereich für Menschen, die Kompatibilität verstehen möchten, bevor sie entscheiden, wohin eine Verbindung führen könnte.', profile:'Erstellen Sie Ihr Mitgliederprofil', profileBody:'Wählen Sie, was Sie teilen möchten, und stimmen Sie zu, bevor Sie entdeckt werden können.', play:'Senden Sie eine Let’s-Play-Einladung', playBody:'Eine Verbindung beginnt erst, wenn beide Mitglieder sich für das Spielen entscheiden.', grow:'Lassen Sie das Spiel das Eis brechen', growBody:'Erkunden Sie gemeinsam Kompatibilitäts- und Like-Minded-Fragen—ohne öffentlichen Chatraum.', safetyTitle:'Auf gegenseitiger Wahl aufgebaut', safety:'Kein offener öffentlicher Chat. Keine unerwünschten Direktnachrichten. Profile, Einladungen und jede zukünftige private Fortsetzung werden durch gegenseitige Einwilligung gesteuert.', assessment:'Assessment starten', membership:'Mitgliedschaftsoptionen ansehen', signIn:'Bei MyMatchIQ anmelden', readyTitle:'Beginnen Sie mit Ihrem Kompatibilitäts-Pass', readyBody:'Ihr Assessment bereitet Sie auf bewusstere Spiele und Einladungen vor, wenn das Mitgliedererlebnis öffnet.', prelaunch:'Das Erlebnis für absichtsvolle Mitglieder wird in Prelaunch aufgebaut. Die Mitgliedersuche wird erst geöffnet, wenn Datenschutz-, Melde-, Blockier- und Einladungskontrollen bereitstehen.' },
};

const CARD_STYLES = ['border-fuchsia-300/45', 'border-cyan-300/45', 'border-amber-300/45'];

export default function MyMatchIQMeet() {
  const { currentLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();
  const t = COPY[currentLanguage] || COPY.en;
  const steps = [[UsersRound, t.profile, t.profileBody], [HeartHandshake, t.play, t.playBody], [Gamepad2, t.grow, t.growBody]];

  return (
    <main className="min-h-screen bg-[#070312] px-4 py-10 sm:px-6" style={{ backgroundImage:'radial-gradient(circle at 18% 0%, #5b126f 0%, transparent 32%), radial-gradient(circle at 82% 12%, #162e78 0%, transparent 30%)' }}>
      <section className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">{t.eyebrow}</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-center text-4xl font-black text-white sm:text-5xl">{t.title}</h1>
        <p className="mx-auto mt-4 max-w-3xl text-center text-lg leading-8 text-white/80">{t.body}</p>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(([Icon, title, body], index) => (
            <article key={title} className={`rounded-3xl border bg-white/[0.07] p-6 text-white shadow-[0_16px_44px_rgba(9,2,25,0.3)] backdrop-blur ${CARD_STYLES[index]}`}>
              <Icon className="h-10 w-10 text-fuchsia-200" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-white/75">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-7 rounded-3xl border border-cyan-200/30 bg-cyan-950/25 p-7 text-center text-white shadow-xl backdrop-blur">
          <ShieldCheck className="mx-auto h-10 w-10 text-cyan-200" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black">{t.safetyTitle}</h2>
          <p className="mx-auto mt-3 max-w-3xl leading-7 text-white/80">{t.safety}</p>
        </section>

        <section className="mt-7 rounded-3xl border border-fuchsia-200/25 bg-black/35 p-7 text-center text-white shadow-xl backdrop-blur">
          <ClipboardCheck className="mx-auto h-9 w-9 text-fuchsia-200" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black">{t.readyTitle}</h2>
          <p className="mx-auto mt-2 max-w-3xl leading-7 text-white/75">{isAuthenticated ? t.readyBody : t.prelaunch}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/MyMatchIQ/Assessment" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110">{t.assessment}</Link>
            {isAuthenticated ? <Link to="/MyMatchIQ/Subscription" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20">{t.membership}</Link> : <Link to="/MyMatchIQ/SignIn" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20">{t.signIn}</Link>}
          </div>
        </section>
      </section>
    </main>
  );
}
