import React, { useState } from "react";
import { ArrowLeft, Mail, Send, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const translations = {
  en: { title: "Contact One2OneLove", subtitle: "Send a message to the One2OneLove team.", back: "Back", name: "Your Name", email: "Your Email", subject: "Subject", message: "Message", send: "Send Message", sending: "Sending…", success: "Your message was received.", error: "We could not send your message. Please try again.", privacy: "Contact messages are stored privately for support follow-up. Other members cannot browse this queue.", required: "Please complete every field. Messages must contain at least 10 characters." },
  es: { title: "Contactar a One2OneLove", subtitle: "Envía un mensaje al equipo de One2OneLove.", back: "Volver", name: "Tu Nombre", email: "Tu Correo", subject: "Asunto", message: "Mensaje", send: "Enviar Mensaje", sending: "Enviando…", success: "Hemos recibido tu mensaje.", error: "No pudimos enviar tu mensaje. Inténtalo de nuevo.", privacy: "Los mensajes de contacto se almacenan de forma privada para seguimiento. Otros miembros no pueden consultar esta cola.", required: "Completa todos los campos. El mensaje debe contener al menos 10 caracteres." },
  fr: { title: "Contacter One2OneLove", subtitle: "Envoyez un message à l’équipe One2OneLove.", back: "Retour", name: "Votre Nom", email: "Votre E-mail", subject: "Sujet", message: "Message", send: "Envoyer le Message", sending: "Envoi…", success: "Votre message a été reçu.", error: "Nous n’avons pas pu envoyer votre message. Réessayez.", privacy: "Les messages sont stockés de façon privée pour le suivi du support. Les autres membres ne peuvent pas consulter cette file.", required: "Complétez tous les champs. Le message doit contenir au moins 10 caractères." },
  it: { title: "Contatta One2OneLove", subtitle: "Invia un messaggio al team One2OneLove.", back: "Indietro", name: "Il Tuo Nome", email: "La Tua Email", subject: "Oggetto", message: "Messaggio", send: "Invia Messaggio", sending: "Invio…", success: "Il tuo messaggio è stato ricevuto.", error: "Non è stato possibile inviare il messaggio. Riprova.", privacy: "I messaggi di contatto vengono archiviati privatamente per il follow-up del supporto. Gli altri membri non possono consultare questa coda.", required: "Completa tutti i campi. Il messaggio deve contenere almeno 10 caratteri." },
  de: { title: "One2OneLove Kontaktieren", subtitle: "Sende eine Nachricht an das One2OneLove-Team.", back: "Zurück", name: "Dein Name", email: "Deine E-Mail", subject: "Betreff", message: "Nachricht", send: "Nachricht Senden", sending: "Wird gesendet…", success: "Deine Nachricht wurde empfangen.", error: "Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.", privacy: "Kontaktnachrichten werden für die Support-Nachverfolgung privat gespeichert. Andere Mitglieder können diese Warteschlange nicht einsehen.", required: "Fülle alle Felder aus. Die Nachricht muss mindestens 10 Zeichen enthalten." },
};

export default function ContactUs() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      language: ['en', 'es', 'fr', 'it', 'de'].includes(currentLanguage) ? currentLanguage : 'en',
      user_id: user?.id || null,
    };
    if (!payload.name || !payload.email || !payload.subject || payload.message.length < 10) {
      toast.error(t.required);
      return;
    }

    setIsSending(true);
    const { error } = await supabase.from('contact_messages').insert(payload);
    setIsSending(false);
    if (error) {
      toast.error(t.error);
      return;
    }

    toast.success(t.success);
    setFormData((current) => ({ ...current, subject: '', message: '' }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-purple-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t.back}</Link>
        <header className="mt-8 text-center"><Mail className="mx-auto h-14 w-14 text-purple-700" aria-hidden="true" /><h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">{t.title}</h1><p className="mt-3 text-lg text-slate-600">{t.subtitle}</p></header>
        <Card className="mx-auto mt-8 max-w-3xl shadow-sm">
          <CardHeader><CardTitle>{t.title}</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-6 flex gap-3 rounded-2xl bg-purple-50 p-4 text-sm leading-6 text-purple-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{t.privacy}</p></div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-semibold text-slate-700">{t.name}<Input className="mt-2" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} maxLength={120} required /></label>
              <label className="block text-sm font-semibold text-slate-700">{t.email}<Input className="mt-2" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} maxLength={320} required /></label>
              <label className="block text-sm font-semibold text-slate-700">{t.subject}<Input className="mt-2" value={formData.subject} onChange={(event) => setFormData({ ...formData, subject: event.target.value })} maxLength={200} required /></label>
              <label className="block text-sm font-semibold text-slate-700">{t.message}<Textarea className="mt-2 min-h-36" value={formData.message} onChange={(event) => setFormData({ ...formData, message: event.target.value })} minLength={10} maxLength={5000} required /></label>
              <Button type="submit" disabled={isSending} className="w-full">{isSending ? t.sending : <><Send className="mr-2 h-4 w-4" aria-hidden="true" />{t.send}</>}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
