import React from 'react';
import { Building, Briefcase, FileText, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Professional Information', org: 'Practice / Organization Name *', orgPlaceholder: 'e.g., Wellness Coaching Services', type: 'Practice Type *', select: 'Select type...', types: [['private_practice', 'Private Practice'], ['group_practice', 'Group Practice'], ['clinic', 'Clinic / Center'], ['coaching_business', 'Coaching Business'], ['consulting', 'Consulting'], ['nonprofit', 'Non-Profit'], ['media', 'Media / Publishing'], ['independent', 'Independent Professional'], ['other', 'Other']], website: 'Website URL', optional: '(Optional)', services: 'Services You Offer *', servicesPlaceholder: 'Describe the services you provide and who they are designed to help.', bio: 'Professional Bio *', bioPlaceholder: 'Tell us about your background, credentials, experience, and approach.', characters: 'characters', note: 'Your application will be reviewed before any professional profile is approved or promoted on One2OneLove.' },
  es: {
    title: 'Información Profesional', org: 'Nombre de la Práctica / Organización *', orgPlaceholder: 'p. ej., Servicios de Coaching de Bienestar', type: 'Tipo de Práctica *', select: 'Seleccionar tipo...', types: [['private_practice', 'Práctica Privada'], ['group_practice', 'Práctica Grupal'], ['clinic', 'Clínica / Centro'], ['coaching_business', 'Negocio de Coaching'], ['consulting', 'Consultoría'], ['nonprofit', 'Organización Sin Fines de Lucro'], ['media', 'Medios / Publicaciones'], ['independent', 'Profesional Independiente'], ['other', 'Otro']], website: 'URL del Sitio Web', optional: '(Opcional)', services: 'Servicios que Ofrece *', servicesPlaceholder: 'Describe los servicios que prestas y a quién están destinados.', bio: 'Biografía Profesional *', bioPlaceholder: 'Cuéntanos sobre tu formación, credenciales, experiencia y enfoque.', characters: 'caracteres', note: 'Tu solicitud será revisada antes de que cualquier perfil profesional sea aprobado o promocionado en One2OneLove.' },
  fr: {
    title: 'Informations Professionnelles', org: 'Nom du Cabinet / de l’Organisation *', orgPlaceholder: 'ex. Services de Coaching Bien-être', type: 'Type de Pratique *', select: 'Sélectionner un type...', types: [['private_practice', 'Cabinet Privé'], ['group_practice', 'Cabinet de Groupe'], ['clinic', 'Clinique / Centre'], ['coaching_business', 'Entreprise de Coaching'], ['consulting', 'Conseil'], ['nonprofit', 'Association'], ['media', 'Médias / Édition'], ['independent', 'Professionnel Indépendant'], ['other', 'Autre']], website: 'URL du Site Web', optional: '(Facultatif)', services: 'Services Proposés *', servicesPlaceholder: 'Décrivez les services que vous proposez et les personnes auxquelles ils s’adressent.', bio: 'Bio Professionnelle *', bioPlaceholder: 'Présentez votre parcours, vos qualifications, votre expérience et votre approche.', characters: 'caractères', note: 'Votre candidature sera examinée avant qu’un profil professionnel soit approuvé ou mis en avant sur One2OneLove.' },
  it: {
    title: 'Informazioni Professionali', org: 'Nome Studio / Organizzazione *', orgPlaceholder: 'es. Servizi di Coaching per il Benessere', type: 'Tipo di Attività *', select: 'Seleziona tipo...', types: [['private_practice', 'Studio Privato'], ['group_practice', 'Studio Associato'], ['clinic', 'Clinica / Centro'], ['coaching_business', 'Attività di Coaching'], ['consulting', 'Consulenza'], ['nonprofit', 'Non-Profit'], ['media', 'Media / Editoria'], ['independent', 'Professionista Indipendente'], ['other', 'Altro']], website: 'URL Sito Web', optional: '(Facoltativo)', services: 'Servizi Offerti *', servicesPlaceholder: 'Descrivi i servizi che offri e a chi sono rivolti.', bio: 'Bio Professionale *', bioPlaceholder: 'Raccontaci del tuo percorso, qualifiche, esperienza e approccio.', characters: 'caratteri', note: 'La candidatura verrà esaminata prima che un profilo professionale venga approvato o promosso su One2OneLove.' },
  de: {
    title: 'Fachliche Informationen', org: 'Praxis- / Organisationsname *', orgPlaceholder: 'z. B. Wellness Coaching Services', type: 'Art der Tätigkeit *', select: 'Typ auswählen...', types: [['private_practice', 'Privatpraxis'], ['group_practice', 'Gemeinschaftspraxis'], ['clinic', 'Klinik / Zentrum'], ['coaching_business', 'Coaching-Unternehmen'], ['consulting', 'Beratung'], ['nonprofit', 'Gemeinnützige Organisation'], ['media', 'Medien / Verlag'], ['independent', 'Selbstständige Fachperson'], ['other', 'Andere']], website: 'Website-URL', optional: '(Optional)', services: 'Angebotene Leistungen *', servicesPlaceholder: 'Beschreibe deine Leistungen und für wen sie gedacht sind.', bio: 'Professionelle Bio *', bioPlaceholder: 'Erzähle uns von deinem Hintergrund, Qualifikationen, Erfahrung und Ansatz.', characters: 'Zeichen', note: 'Deine Bewerbung wird geprüft, bevor ein professionelles Profil auf One2OneLove freigegeben oder hervorgehoben wird.' },
};

export default function OtherUserSignupForm({
  organizationName,
  setOrganizationName,
  organizationType,
  setOrganizationType,
  serviceDescription,
  setServiceDescription,
  websiteUrl,
  setWebsiteUrl,
  otherUserBio,
  setOtherUserBio,
}) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <h3 className="flex items-center text-lg font-semibold text-gray-800"><Building aria-hidden="true" className="mr-2 text-blue-600" size={20} />{t.title}</h3>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700"><Building aria-hidden="true" className="mr-2 inline" size={16} />{t.org}</label>
        <input type="text" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder={t.orgPlaceholder} className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-400" required />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700"><Briefcase aria-hidden="true" className="mr-2 inline" size={16} />{t.type}</label>
        <div className="relative">
          <select value={organizationType} onChange={(event) => setOrganizationType(event.target.value)} className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-400" required>
            <option value="">{t.select}</option>
            {t.types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <ChevronDown aria-hidden="true" size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700"><Globe aria-hidden="true" className="mr-2 inline" size={16} />{t.website} <span className="text-xs font-normal text-gray-400">{t.optional}</span></label>
        <input type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://example.com" className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-400" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">{t.services}</label>
        <textarea value={serviceDescription} onChange={(event) => setServiceDescription(event.target.value.slice(0, 500))} placeholder={t.servicesPlaceholder} rows={3} className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-400" required />
        <p className="mt-1 text-xs text-gray-500">{serviceDescription.length}/500 {t.characters}</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700"><FileText aria-hidden="true" className="mr-2 inline" size={16} />{t.bio}</label>
        <textarea value={otherUserBio} onChange={(event) => setOtherUserBio(event.target.value.slice(0, 1000))} placeholder={t.bioPlaceholder} rows={4} className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-400" required />
        <p className="mt-1 text-xs text-gray-500">{otherUserBio.length}/1000 {t.characters}</p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-100 p-3"><p className="text-sm text-blue-800">{t.note}</p></div>
    </div>
  );
}
