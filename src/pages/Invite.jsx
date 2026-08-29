import React from "react";
import { ArrowLeft, Copy, Heart, Mail, MessageSquare, Share2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/Layout";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    back: "Back", title: "Invite Someone to One2OneLove", subtitle: "Share One2OneLove without handing us someone else’s contact information.", message: "I thought you might enjoy One2OneLove—a place for practical relationship tools, conversations, and connection.", copy: "Copy invite link", copied: "Invite link copied.", share: "Share", email: "Open email app", sms: "Open text-message app", privacyTitle: "Privacy-first invitations", privacy: "One2OneLove does not collect your friend’s email address or phone number on this page. Email and text buttons open your own device apps so you stay in control of the recipient.", rewardsTitle: "No referral reward is currently active", rewards: "Inviting someone does not currently earn points, cash, prizes, or other rewards. If a referral program launches later, its rules and eligibility will be published before it begins.", explore: "Explore O2OL instead", room: "Global Relationship Room", library: "Relationship Library", activities: "Couple Activities" },
  es: {
    back: "Volver", title: "Invita a Alguien a One2OneLove", subtitle: "Comparte One2OneLove sin darnos los datos de contacto de otra persona.", message: "Pensé que quizá te gustaría One2OneLove, un espacio con herramientas prácticas para relaciones, conversaciones y conexión.", copy: "Copiar enlace de invitación", copied: "Enlace copiado.", share: "Compartir", email: "Abrir aplicación de correo", sms: "Abrir aplicación de mensajes", privacyTitle: "Invitaciones con privacidad primero", privacy: "One2OneLove no recopila el correo ni el teléfono de tu amigo en esta página. Los botones de correo y SMS abren las aplicaciones de tu dispositivo para que tú controles el destinatario.", rewardsTitle: "Actualmente no hay recompensa por referidos", rewards: "Invitar a alguien no genera actualmente puntos, dinero, premios ni otras recompensas. Si se lanza un programa de referidos, publicaremos primero sus reglas y requisitos.", explore: "Explora O2OL", room: "Sala Global de Relaciones", library: "Biblioteca de Relaciones", activities: "Actividades de Pareja" },
  fr: {
    back: "Retour", title: "Inviter Quelqu’un sur One2OneLove", subtitle: "Partagez One2OneLove sans nous transmettre les coordonnées d’une autre personne.", message: "Je pensais que One2OneLove pourrait t’intéresser : un espace avec des outils relationnels pratiques, des conversations et des moyens de se rapprocher.", copy: "Copier le lien d’invitation", copied: "Lien d’invitation copié.", share: "Partager", email: "Ouvrir l’application e-mail", sms: "Ouvrir l’application SMS", privacyTitle: "Invitations respectueuses de la vie privée", privacy: "One2OneLove ne collecte pas l’adresse e-mail ni le numéro de téléphone de votre ami sur cette page. Les boutons e-mail et SMS ouvrent les applications de votre appareil afin que vous gardiez le contrôle du destinataire.", rewardsTitle: "Aucune récompense de parrainage n’est active", rewards: "Inviter quelqu’un ne rapporte actuellement ni points, ni argent, ni prix. Si un programme de parrainage est lancé plus tard, ses règles et conditions seront publiées avant son ouverture.", explore: "Explorer O2OL", room: "Salle Mondiale des Relations", library: "Bibliothèque Relationnelle", activities: "Activités de Couple" },
  it: {
    back: "Indietro", title: "Invita Qualcuno su One2OneLove", subtitle: "Condividi One2OneLove senza consegnarci i dati di contatto di un’altra persona.", message: "Ho pensato che potrebbe piacerti One2OneLove, uno spazio con strumenti pratici per le relazioni, conversazioni e connessione.", copy: "Copia link di invito", copied: "Link di invito copiato.", share: "Condividi", email: "Apri app email", sms: "Apri app messaggi", privacyTitle: "Inviti con privacy al primo posto", privacy: "One2OneLove non raccoglie l’email o il numero di telefono del tuo amico in questa pagina. I pulsanti email e SMS aprono le app del tuo dispositivo, così mantieni il controllo del destinatario.", rewardsTitle: "Nessun premio referral è attivo", rewards: "Invitare qualcuno al momento non fa guadagnare punti, denaro, premi o altre ricompense. Se verrà lanciato un programma referral, regole e requisiti saranno pubblicati prima dell’apertura.", explore: "Esplora O2OL", room: "Sala Globale delle Relazioni", library: "Biblioteca delle Relazioni", activities: "Attività di Coppia" },
  de: {
    back: "Zurück", title: "Jemanden zu One2OneLove Einladen", subtitle: "Teile One2OneLove, ohne uns die Kontaktdaten einer anderen Person zu geben.", message: "Ich dachte, One2OneLove könnte dir gefallen – ein Ort mit praktischen Beziehungswerkzeugen, Gesprächen und Verbindung.", copy: "Einladungslink kopieren", copied: "Einladungslink kopiert.", share: "Teilen", email: "E-Mail-App öffnen", sms: "Nachrichten-App öffnen", privacyTitle: "Datenschutzfreundliche Einladungen", privacy: "One2OneLove sammelt auf dieser Seite weder die E-Mail-Adresse noch die Telefonnummer deines Freundes. E-Mail- und SMS-Schaltflächen öffnen deine eigenen Geräte-Apps, sodass du die Kontrolle über den Empfänger behältst.", rewardsTitle: "Derzeit gibt es keine Empfehlungsprämie", rewards: "Einladungen bringen derzeit keine Punkte, Geld, Preise oder andere Belohnungen. Falls später ein Empfehlungsprogramm startet, werden Regeln und Teilnahmebedingungen vorher veröffentlicht.", explore: "O2OL entdecken", room: "Globaler Beziehungsraum", library: "Beziehungsbibliothek", activities: "Paar-Aktivitäten" },
};

export default function Invite() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const inviteLink = `${window.location.origin}${createPageUrl("SignUp")}`;
  const shareText = `${t.message}\n\n${inviteLink}`;

  const copyInvite = async () => {
    await navigator.clipboard.writeText(shareText);
    toast.success(t.copied);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "One2One Love", text: t.message, url: inviteLink });
      return;
    }
    await copyInvite();
  };

  const openEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent("One2One Love")}&body=${encodeURIComponent(shareText)}`;
  };

  const openSms = () => {
    window.location.href = `sms:?body=${encodeURIComponent(shareText)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-white hover:text-purple-700"><ArrowLeft className="h-4 w-4" />{t.back}</Link>

        <header className="mx-auto mt-8 max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white"><Share2 className="h-8 w-8" /></div>
          <h1 className="mt-5 text-4xl font-bold text-gray-950 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-8 text-gray-600">{t.subtitle}</p>
        </header>

        <Card className="mx-auto mt-8 max-w-3xl border-purple-100 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <p className="rounded-2xl bg-purple-50 p-5 text-lg leading-8 text-purple-950">“{t.message}”</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button type="button" onClick={copyInvite}><Copy className="mr-2 h-4 w-4" />{t.copy}</Button>
              <Button type="button" variant="outline" onClick={nativeShare}><Share2 className="mr-2 h-4 w-4" />{t.share}</Button>
              <Button type="button" variant="outline" onClick={openEmail}><Mail className="mr-2 h-4 w-4" />{t.email}</Button>
              <Button type="button" variant="outline" onClick={openSms}><MessageSquare className="mr-2 h-4 w-4" />{t.sms}</Button>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-6 grid max-w-3xl gap-5 md:grid-cols-2">
          <Card className="border-emerald-200 bg-emerald-50/70">
            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-950"><ShieldCheck className="h-5 w-5" />{t.privacyTitle}</CardTitle></CardHeader>
            <CardContent className="leading-7 text-emerald-900">{t.privacy}</CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/70">
            <CardHeader><CardTitle className="text-amber-950">{t.rewardsTitle}</CardTitle></CardHeader>
            <CardContent className="leading-7 text-amber-900">{t.rewards}</CardContent>
          </Card>
        </div>

        <section className="mx-auto mt-10 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-950">{t.explore}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button asChild variant="outline"><Link to={createPageUrl("GlobalRelationshipRoom")}><Heart className="mr-2 h-4 w-4" />{t.room}</Link></Button>
            <Button asChild variant="outline"><Link to={createPageUrl("RelationshipLibrary")}>{t.library}</Link></Button>
            <Button asChild variant="outline"><Link to={createPageUrl("CoupleActivities")}>{t.activities}</Link></Button>
          </div>
        </section>
      </div>
    </main>
  );
}
