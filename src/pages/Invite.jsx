import React, { useState } from 'react';
import { Copy, Facebook, Heart, Linkedin, Mail, MessageSquare, Share2, Smartphone, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/Layout';

const copy = {
  en: {
    title:'Invite Friends & Family', subtitle:'Share One2OneLove with people you care about.', message:"I found One2OneLove, a relationship platform with practical tools, conversations and resources for healthier connection. Take a look 💕",
    textTitle:'Invite by Text Message', emailTitle:'Invite by Email', linkTitle:'Share Your Invite Link', socialTitle:'Share Via', phone:'Enter phone number', email:'Enter email address', send:'Send', copy:'Copy', copied:'Invite link copied!', needPhone:'Enter a phone number first.', needEmail:'Enter an email address first.', openingText:'Opening your text message app…', openingEmail:'Opening your email app…', copiedPost:'Invite text copied. Paste it into the app you want to use.', why:'Why share One2OneLove?', reasons:['Help people you care about discover practical relationship tools.','Bring more thoughtful voices into the One2OneLove community.','Give friends and family an easy way to explore healthier communication and connection.']
  },
  es: {
    title:'Invitar a Amigos y Familia', subtitle:'Comparte One2OneLove con las personas que te importan.', message:'Encontré One2OneLove, una plataforma de relaciones con herramientas prácticas, conversaciones y recursos para conexiones más saludables. Échale un vistazo 💕',
    textTitle:'Invitar por Mensaje de Texto', emailTitle:'Invitar por Correo', linkTitle:'Comparte Tu Enlace de Invitación', socialTitle:'Compartir Vía', phone:'Ingresa el número de teléfono', email:'Ingresa el correo electrónico', send:'Enviar', copy:'Copiar', copied:'¡Enlace copiado!', needPhone:'Primero ingresa un número de teléfono.', needEmail:'Primero ingresa un correo electrónico.', openingText:'Abriendo tu aplicación de mensajes…', openingEmail:'Abriendo tu aplicación de correo…', copiedPost:'Texto de invitación copiado. Pégalo en la aplicación que quieras usar.', why:'¿Por qué compartir One2OneLove?', reasons:['Ayuda a las personas que quieres a descubrir herramientas prácticas para sus relaciones.','Trae más voces reflexivas a la comunidad One2OneLove.','Da a amigos y familia una forma sencilla de explorar una comunicación y conexión más saludables.']
  },
  fr: {
    title:'Inviter Amis et Famille', subtitle:'Partagez One2OneLove avec les personnes qui comptent pour vous.', message:'J’ai découvert One2OneLove, une plateforme relationnelle avec des outils pratiques, des conversations et des ressources pour des liens plus sains. Jetez-y un œil 💕',
    textTitle:'Inviter par SMS', emailTitle:'Inviter par E-mail', linkTitle:'Partager Votre Lien d’Invitation', socialTitle:'Partager Via', phone:'Entrez le numéro de téléphone', email:'Entrez l’adresse e-mail', send:'Envoyer', copy:'Copier', copied:'Lien d’invitation copié !', needPhone:'Entrez d’abord un numéro de téléphone.', needEmail:'Entrez d’abord une adresse e-mail.', openingText:'Ouverture de votre application de messages…', openingEmail:'Ouverture de votre application e-mail…', copiedPost:'Texte d’invitation copié. Collez-le dans l’application de votre choix.', why:'Pourquoi partager One2OneLove ?', reasons:['Aidez vos proches à découvrir des outils relationnels pratiques.','Apportez davantage de voix réfléchies à la communauté One2OneLove.','Offrez à vos proches un moyen simple d’explorer une communication et une connexion plus saines.']
  },
  it: {
    title:'Invita Amici e Famiglia', subtitle:'Condividi One2OneLove con le persone a cui tieni.', message:'Ho trovato One2OneLove, una piattaforma per le relazioni con strumenti pratici, conversazioni e risorse per connessioni più sane. Dagli un’occhiata 💕',
    textTitle:'Invita via Messaggio', emailTitle:'Invita via Email', linkTitle:'Condividi il Tuo Link di Invito', socialTitle:'Condividi Tramite', phone:'Inserisci il numero di telefono', email:'Inserisci l’indirizzo email', send:'Invia', copy:'Copia', copied:'Link di invito copiato!', needPhone:'Inserisci prima un numero di telefono.', needEmail:'Inserisci prima un indirizzo email.', openingText:'Apertura dell’app messaggi…', openingEmail:'Apertura dell’app email…', copiedPost:'Testo dell’invito copiato. Incollalo nell’app che vuoi usare.', why:'Perché condividere One2OneLove?', reasons:['Aiuta le persone a cui tieni a scoprire strumenti pratici per le relazioni.','Porta più voci attente nella comunità One2OneLove.','Offri ad amici e familiari un modo semplice per esplorare una comunicazione e una connessione più sane.']
  },
  de: {
    title:'Freunde & Familie Einladen', subtitle:'Teile One2OneLove mit Menschen, die dir wichtig sind.', message:'Ich habe One2OneLove entdeckt – eine Beziehungsplattform mit praktischen Werkzeugen, Gesprächen und Ressourcen für gesündere Verbindung. Schau es dir an 💕',
    textTitle:'Per Textnachricht Einladen', emailTitle:'Per E-Mail Einladen', linkTitle:'Deinen Einladungslink Teilen', socialTitle:'Teilen Über', phone:'Telefonnummer eingeben', email:'E-Mail-Adresse eingeben', send:'Senden', copy:'Kopieren', copied:'Einladungslink kopiert!', needPhone:'Gib zuerst eine Telefonnummer ein.', needEmail:'Gib zuerst eine E-Mail-Adresse ein.', openingText:'Nachrichten-App wird geöffnet…', openingEmail:'E-Mail-App wird geöffnet…', copiedPost:'Einladungstext kopiert. Füge ihn in die gewünschte App ein.', why:'Warum One2OneLove teilen?', reasons:['Hilf Menschen, die dir wichtig sind, praktische Beziehungswerkzeuge zu entdecken.','Bring weitere nachdenkliche Stimmen in die One2OneLove Community.','Gib Freunden und Familie einen einfachen Weg zu gesünderer Kommunikation und Verbindung.']
  }
};

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

export default function Invite() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/SignUp` : 'https://one2onelove.com/SignUp';
  const shareText = `${t.message}\n\n${inviteLink}`;

  const handleCopyLink = async () => {
    try { await copyToClipboard(inviteLink); toast.success(t.copied); }
    catch { toast.error('Unable to copy the link.'); }
  };

  const handleEmailInvite = event => {
    event.preventDefault();
    if (!email.trim()) return toast.error(t.needEmail);
    const subject = encodeURIComponent('One2OneLove');
    const body = encodeURIComponent(shareText);
    window.location.href = `mailto:${encodeURIComponent(email.trim())}?subject=${subject}&body=${body}`;
    toast.info(t.openingEmail);
  };

  const handleSMSInvite = event => {
    event.preventDefault();
    if (!phoneNumber.trim()) return toast.error(t.needPhone);
    window.location.href = `sms:${phoneNumber.trim()}?body=${encodeURIComponent(shareText)}`;
    toast.info(t.openingText);
  };

  const shareVia = async platform => {
    const text = encodeURIComponent(t.message);
    const url = encodeURIComponent(inviteLink);
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
    else if (platform === 'x') window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
    else if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
    else if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
    else {
      try { await copyToClipboard(shareText); toast.success(t.copiedPost); }
      catch { toast.error('Unable to copy the invite text.'); }
    }
  };

  const cards = [
    ['facebook','Facebook',Facebook,'bg-blue-600'],
    ['x','X',Twitter,'bg-slate-900'],
    ['linkedin','LinkedIn',Linkedin,'bg-blue-700'],
    ['whatsapp','WhatsApp',MessageSquare,'bg-green-600'],
    ['instagram','Instagram',Share2,'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600'],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg"><Share2 size={30}/></div>
          <h1 className="text-4xl font-black text-slate-900">{t.title}</h1>
          <p className="mt-3 text-xl text-slate-600">{t.subtitle}</p>
        </motion.div>

        <div className="mb-7 rounded-3xl border border-pink-200 bg-pink-50 p-6 text-center text-slate-700 shadow-sm"><p className="italic leading-7">“{t.message}”</p></div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">{t.textTitle}</h2>
            <form onSubmit={handleSMSInvite} className="mt-4 flex gap-3"><input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder={t.phone} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"/><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 font-black text-white"><Smartphone size={17}/>{t.send}</button></form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">{t.emailTitle}</h2>
            <form onSubmit={handleEmailInvite} className="mt-4 flex gap-3"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.email} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"/><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 font-black text-white"><Mail size={17}/>{t.send}</button></form>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">{t.linkTitle}</h2>
          <div className="mt-4 flex gap-3"><input value={inviteLink} readOnly className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"/><button type="button" onClick={handleCopyLink} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 font-black text-white"><Copy size={17}/>{t.copy}</button></div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">{t.socialTitle}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{cards.map(([id,label,Icon,bg]) => <button key={id} type="button" onClick={() => shareVia(id)} className="rounded-2xl border border-slate-200 p-3 text-center transition hover:-translate-y-0.5 hover:shadow-md"><div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${bg} text-white`}><Icon size={21}/></div><span className="mt-2 block text-xs font-bold text-slate-700">{label}</span></button>)}</div>
        </section>

        <section className="mt-6 rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 p-7 text-white shadow-lg">
          <h2 className="text-xl font-black">{t.why}</h2>
          <div className="mt-4 space-y-3">{t.reasons.map(reason => <div key={reason} className="flex items-start gap-3"><Heart className="mt-0.5 shrink-0 fill-white" size={18}/><p className="leading-6 text-white/95">{reason}</p></div>)}</div>
        </section>
      </div>
    </div>
  );
}
