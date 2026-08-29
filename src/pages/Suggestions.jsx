import React from "react";
import { Lightbulb, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";

const translations = {
  en: { title: "Ideas & Feedback", subtitle: "The dedicated suggestion tracker is planned for post launch.", notice: "The previous form displayed a success message without actually saving the suggestion. We removed that misleading behavior. Until a real feedback backend is active, please use Contact Us so your message follows a functioning support path.", contact: "Contact One2OneLove", home: "Back Home" },
  es: { title: "Ideas y Comentarios", subtitle: "El sistema dedicado de sugerencias está previsto para después del lanzamiento.", notice: "El formulario anterior mostraba un mensaje de éxito sin guardar realmente la sugerencia. Eliminamos ese comportamiento engañoso. Hasta que exista un backend real para comentarios, usa Contacto para que tu mensaje siga una vía de soporte funcional.", contact: "Contactar a One2OneLove", home: "Volver al Inicio" },
  fr: { title: "Idées et Retours", subtitle: "Le système dédié aux suggestions est prévu après le lancement.", notice: "L’ancien formulaire affichait un message de réussite sans réellement enregistrer la suggestion. Ce comportement trompeur a été supprimé. Jusqu’à l’activation d’un véritable backend de retours, utilisez Contact afin que votre message passe par un canal de support fonctionnel.", contact: "Contacter One2OneLove", home: "Retour à l’Accueil" },
  it: { title: "Idee e Feedback", subtitle: "Il sistema dedicato ai suggerimenti è previsto dopo il lancio.", notice: "Il modulo precedente mostrava un messaggio di successo senza salvare davvero il suggerimento. Abbiamo rimosso quel comportamento fuorviante. Finché non sarà attivo un vero backend per i feedback, usa Contatti affinché il messaggio segua un percorso di supporto funzionante.", contact: "Contatta One2OneLove", home: "Torna alla Home" },
  de: { title: "Ideen & Feedback", subtitle: "Ein eigenes Vorschlagssystem ist für die Zeit nach dem Start geplant.", notice: "Das frühere Formular zeigte eine Erfolgsmeldung, ohne den Vorschlag tatsächlich zu speichern. Dieses irreführende Verhalten wurde entfernt. Bis ein echtes Feedback-Backend aktiv ist, nutzt bitte Kontakt, damit eure Nachricht über einen funktionierenden Supportweg eingeht.", contact: "One2OneLove Kontaktieren", home: "Zurück zur Startseite" },
};

export default function Suggestions() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  return <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 px-4 py-12 md:py-20"><div className="mx-auto max-w-4xl text-center"><Lightbulb className="mx-auto h-14 w-14 text-orange-600" aria-hidden="true"/><h1 className="mt-5 text-4xl font-bold text-slate-900 md:text-5xl">{t.title}</h1><p className="mt-4 text-lg text-slate-600">{t.subtitle}</p><Card className="mx-auto mt-8 max-w-3xl text-left"><CardContent className="p-6 md:p-8"><div className="flex gap-3 rounded-2xl bg-orange-50 p-5 text-sm leading-6 text-orange-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true"/><p>{t.notice}</p></div><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button asChild><Link to="/ContactUs"><Mail className="mr-2 h-4 w-4" aria-hidden="true"/>{t.contact}</Link></Button><Button asChild variant="outline"><Link to="/">{t.home}</Link></Button></div></CardContent></Card></div></main>;
}
