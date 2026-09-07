import React from "react";
import { ArrowLeft, Users, ShieldCheck, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Counseling Directory",
    comingSoon: "Coming Soon",
    subtitle: "A future directory for verified licensed relationship and couples professionals",
    body: "One2OneLove will not list counselors, therapists, or other professionals here until their credentials and participation have been appropriately verified.",
    verified: "Verified Professionals",
    verifiedBody: "Only professionals whose credentials and participation are confirmed will be displayed.",
    scope: "Clear Professional Roles",
    scopeBody: "Profiles will clearly identify professional role, credentials, and the services they provide.",
    noClaims: "No Placeholder Claims",
    noClaimsBody: "We will not display invented ratings, outcomes, session counts, or availability.",
    back: "Back to Relationship Support"
  },
  es: {
    title: "Directorio de Consejería",
    comingSoon: "Próximamente",
    subtitle: "Un futuro directorio de profesionales licenciados y verificados en relaciones y parejas",
    body: "One2OneLove no mostrará consejeros, terapeutas u otros profesionales hasta que sus credenciales y participación hayan sido verificadas adecuadamente.",
    verified: "Profesionales Verificados",
    verifiedBody: "Solo se mostrarán profesionales cuyas credenciales y participación estén confirmadas.",
    scope: "Roles Profesionales Claros",
    scopeBody: "Los perfiles identificarán claramente el rol profesional, las credenciales y los servicios ofrecidos.",
    noClaims: "Sin Afirmaciones de Ejemplo",
    noClaimsBody: "No mostraremos calificaciones, resultados, cantidad de sesiones ni disponibilidad inventados.",
    back: "Volver al Apoyo para Relaciones"
  },
  fr: {
    title: "Annuaire de Conseillers",
    comingSoon: "Bientôt Disponible",
    subtitle: "Un futur annuaire de professionnels agréés et vérifiés pour les relations et les couples",
    body: "One2OneLove n'affichera aucun conseiller, thérapeute ou autre professionnel tant que ses qualifications et sa participation n'auront pas été correctement vérifiées.",
    verified: "Professionnels Vérifiés",
    verifiedBody: "Seuls les professionnels dont les qualifications et la participation sont confirmées seront affichés.",
    scope: "Rôles Professionnels Clairs",
    scopeBody: "Les profils préciseront clairement le rôle, les qualifications et les services proposés.",
    noClaims: "Aucune Affirmation Fictive",
    noClaimsBody: "Nous n'afficherons pas de notes, résultats, nombres de séances ou disponibilités inventés.",
    back: "Retour au Soutien Relationnel"
  },
  it: {
    title: "Elenco di Consulenza",
    comingSoon: "Prossimamente",
    subtitle: "Un futuro elenco di professionisti autorizzati e verificati per relazioni e coppie",
    body: "One2OneLove non mostrerà consulenti, terapeuti o altri professionisti finché credenziali e partecipazione non saranno adeguatamente verificate.",
    verified: "Professionisti Verificati",
    verifiedBody: "Saranno mostrati solo professionisti con credenziali e partecipazione confermate.",
    scope: "Ruoli Professionali Chiari",
    scopeBody: "I profili indicheranno chiaramente ruolo professionale, credenziali e servizi offerti.",
    noClaims: "Nessuna Affermazione Fittizia",
    noClaimsBody: "Non mostreremo valutazioni, risultati, numeri di sessioni o disponibilità inventati.",
    back: "Torna al Supporto per le Relazioni"
  },
  de: {
    title: "Beratungsverzeichnis",
    comingSoon: "Demnächst",
    subtitle: "Ein zukünftiges Verzeichnis verifizierter lizenzierter Fachleute für Beziehungen und Paare",
    body: "One2OneLove wird keine Berater, Therapeuten oder andere Fachleute anzeigen, bevor deren Qualifikationen und Teilnahme angemessen überprüft wurden.",
    verified: "Verifizierte Fachleute",
    verifiedBody: "Es werden nur Fachleute angezeigt, deren Qualifikationen und Teilnahme bestätigt sind.",
    scope: "Klare Berufliche Rollen",
    scopeBody: "Profile weisen Rolle, Qualifikationen und angebotene Leistungen klar aus.",
    noClaims: "Keine Platzhalter-Angaben",
    noClaimsBody: "Wir zeigen keine erfundenen Bewertungen, Ergebnisse, Sitzungszahlen oder Verfügbarkeiten an.",
    back: "Zurück zur Beziehungsunterstützung"
  }
};

export default function CounselingSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const items = [
    { icon: ShieldCheck, title: t.verified, body: t.verifiedBody },
    { icon: Users, title: t.scope, body: t.scopeBody },
    { icon: Heart, title: t.noClaims, body: t.noClaimsBody }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          to={createPageUrl("CoupleSupport")}
          className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t.back}
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-green-600 rounded-full mb-6 shadow-xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold mb-4 ml-3">{t.comingSoon}</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-5">{t.subtitle}</p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">{t.body}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white rounded-2xl border border-teal-100 p-6 shadow-md">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h2>
                <p className="text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
