import React, { useState } from "react";
import { useLanguage } from "@/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Globe, ArrowLeft, Send, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const translations = {
  en: {
    title: "Contact Us",
    subtitle: "Questions, support requests, feedback, privacy requests, or legal inquiries — we want to hear from you.",
    back: "Back",
    name: "Your Name",
    email: "Your Email",
    subject: "Subject",
    message: "Message",
    sendMessage: "Open Email to Send Message",
    getInTouch: "Send Us a Message",
    support: "General Support",
    legal: "Legal & Privacy",
    website: "Website",
    emailNotice: "Submitting this form opens your device's email application with your message prepared. Your message is not sent until you send it from your email application.",
    safety: "For emergencies or immediate danger, contact local emergency services. One2OneLove is not an emergency or crisis-response service."
  },
  es: {
    title: "Contáctanos",
    subtitle: "Preguntas, soporte, comentarios, solicitudes de privacidad o consultas legales: queremos saber de ti.",
    back: "Volver",
    name: "Tu Nombre",
    email: "Tu Email",
    subject: "Asunto",
    message: "Mensaje",
    sendMessage: "Abrir Email para Enviar Mensaje",
    getInTouch: "Envíanos un Mensaje",
    support: "Soporte General",
    legal: "Legal y Privacidad",
    website: "Sitio Web",
    emailNotice: "Al enviar este formulario se abrirá la aplicación de correo de tu dispositivo con el mensaje preparado. El mensaje no se envía hasta que tú lo envíes desde tu aplicación de correo.",
    safety: "Para emergencias o peligro inmediato, contacta a los servicios de emergencia locales. One2OneLove no es un servicio de emergencia ni de respuesta a crisis."
  },
  fr: {
    title: "Nous Contacter",
    subtitle: "Questions, assistance, commentaires, demandes de confidentialité ou questions juridiques : nous souhaitons vous entendre.",
    back: "Retour",
    name: "Votre Nom",
    email: "Votre Email",
    subject: "Sujet",
    message: "Message",
    sendMessage: "Ouvrir l'Email pour Envoyer",
    getInTouch: "Envoyez-Nous un Message",
    support: "Assistance Générale",
    legal: "Juridique et Confidentialité",
    website: "Site Web",
    emailNotice: "L'envoi de ce formulaire ouvre l'application de messagerie de votre appareil avec le message préparé. Le message n'est envoyé que lorsque vous l'envoyez depuis votre application de messagerie.",
    safety: "En cas d'urgence ou de danger immédiat, contactez les services d'urgence locaux. One2OneLove n'est pas un service d'urgence ou de gestion de crise."
  },
  it: {
    title: "Contattaci",
    subtitle: "Domande, assistenza, feedback, richieste sulla privacy o questioni legali: vogliamo sentirti.",
    back: "Indietro",
    name: "Il Tuo Nome",
    email: "La Tua Email",
    subject: "Oggetto",
    message: "Messaggio",
    sendMessage: "Apri Email per Inviare il Messaggio",
    getInTouch: "Inviaci un Messaggio",
    support: "Assistenza Generale",
    legal: "Legale e Privacy",
    website: "Sito Web",
    emailNotice: "L'invio di questo modulo apre l'app email del dispositivo con il messaggio già preparato. Il messaggio non viene inviato finché non lo invii dalla tua applicazione email.",
    safety: "Per emergenze o pericolo immediato, contatta i servizi di emergenza locali. One2OneLove non è un servizio di emergenza o di risposta alle crisi."
  },
  de: {
    title: "Kontaktieren Sie Uns",
    subtitle: "Fragen, Supportanfragen, Feedback, Datenschutzanfragen oder rechtliche Anliegen — wir möchten von Ihnen hören.",
    back: "Zurück",
    name: "Ihr Name",
    email: "Ihre E-Mail",
    subject: "Betreff",
    message: "Nachricht",
    sendMessage: "E-Mail zum Senden Öffnen",
    getInTouch: "Senden Sie Uns eine Nachricht",
    support: "Allgemeiner Support",
    legal: "Recht & Datenschutz",
    website: "Webseite",
    emailNotice: "Beim Absenden dieses Formulars wird die E-Mail-App Ihres Geräts mit einer vorbereiteten Nachricht geöffnet. Die Nachricht wird erst gesendet, wenn Sie sie in Ihrer E-Mail-App absenden.",
    safety: "Bei Notfällen oder unmittelbarer Gefahr wenden Sie sich an die örtlichen Notdienste. One2OneLove ist kein Notfall- oder Krisendienst."
  }
};

export default function ContactUs() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = formData.subject.trim() || "One2OneLove Support Request";
    const body = [
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      "",
      formData.message
    ].join("\n");
    window.location.href = `mailto:support@one2onelove.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("Home")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">{t.getInTouch}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.name}</label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="h-12" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.email}</label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="h-12" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.subject}</label>
                    <Input value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required className="h-12" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.message}</label>
                    <Textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required className="h-32" />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{t.emailNotice}</p>
                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg">
                    <Send className="w-5 h-5 mr-2" />
                    {t.sendMessage}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{t.support}</h3>
                    <a href="mailto:support@one2onelove.com" className="text-blue-600 hover:underline text-sm">support@one2onelove.com</a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{t.legal}</h3>
                    <a href="mailto:legal@one2onelove.com" className="text-purple-600 hover:underline text-sm">legal@one2onelove.com</a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{t.website}</h3>
                    <a href="https://one2onelove.com" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline text-sm">one2onelove.com</a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-amber-200 bg-amber-50">
              <CardContent className="p-6 text-sm text-amber-900 leading-relaxed">
                {t.safety}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
