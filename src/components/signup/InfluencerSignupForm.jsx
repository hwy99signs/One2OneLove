import React from 'react';
import { Users, Link as LinkIcon, FileText, Sparkles } from 'lucide-react';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Influencer Information', followers: 'Total Follower Count *', followersHelp: 'Combined followers across all platforms', links: 'Social Media Links *', linkHelp: 'At least one platform link is required', categories: 'Content Categories *', categoriesPlaceholder: 'e.g., Relationships, Lifestyle, Wellness (comma separated)', collaborations: 'Collaboration Types *', collaborationsPlaceholder: 'e.g., Sponsored Posts, Guest Content, Brand Partnerships (comma separated)', mediaKit: 'Media Kit URL', optional: '(Optional)', bio: 'Bio *', bioPlaceholder: 'Tell us about your content, audience, and what makes your work a good fit for One2OneLove.', bioCount: 'characters', instagram: 'Instagram URL', tiktok: 'TikTok URL', youtube: 'YouTube URL', other: 'Other Platform URL' },
  es: {
    title: 'Información del Influencer', followers: 'Total de Seguidores *', followersHelp: 'Seguidores combinados en todas las plataformas', links: 'Enlaces de Redes Sociales *', linkHelp: 'Se requiere al menos un enlace de plataforma', categories: 'Categorías de Contenido *', categoriesPlaceholder: 'p. ej., Relaciones, Estilo de Vida, Bienestar (separadas por comas)', collaborations: 'Tipos de Colaboración *', collaborationsPlaceholder: 'p. ej., Publicaciones Patrocinadas, Contenido Invitado, Alianzas de Marca (separadas por comas)', mediaKit: 'URL del Media Kit', optional: '(Opcional)', bio: 'Biografía *', bioPlaceholder: 'Cuéntanos sobre tu contenido, audiencia y por qué tu trabajo encaja con One2OneLove.', bioCount: 'caracteres', instagram: 'URL de Instagram', tiktok: 'URL de TikTok', youtube: 'URL de YouTube', other: 'URL de Otra Plataforma' },
  fr: {
    title: 'Informations Influenceur', followers: 'Nombre Total d’Abonnés *', followersHelp: 'Total cumulé sur toutes les plateformes', links: 'Liens des Réseaux Sociaux *', linkHelp: 'Au moins un lien de plateforme est requis', categories: 'Catégories de Contenu *', categoriesPlaceholder: 'ex. Relations, Lifestyle, Bien-être (séparées par des virgules)', collaborations: 'Types de Collaboration *', collaborationsPlaceholder: 'ex. Publications Sponsorisées, Contenu Invité, Partenariats de Marque (séparés par des virgules)', mediaKit: 'URL du Media Kit', optional: '(Facultatif)', bio: 'Bio *', bioPlaceholder: 'Présentez votre contenu, votre audience et ce qui rend votre travail pertinent pour One2OneLove.', bioCount: 'caractères', instagram: 'URL Instagram', tiktok: 'URL TikTok', youtube: 'URL YouTube', other: 'URL d’une Autre Plateforme' },
  it: {
    title: 'Informazioni Influencer', followers: 'Numero Totale di Follower *', followersHelp: 'Follower complessivi su tutte le piattaforme', links: 'Link ai Social Media *', linkHelp: 'È richiesto almeno un link a una piattaforma', categories: 'Categorie di Contenuto *', categoriesPlaceholder: 'es. Relazioni, Lifestyle, Benessere (separate da virgole)', collaborations: 'Tipi di Collaborazione *', collaborationsPlaceholder: 'es. Post Sponsorizzati, Contenuti Ospiti, Partnership di Brand (separati da virgole)', mediaKit: 'URL Media Kit', optional: '(Facoltativo)', bio: 'Bio *', bioPlaceholder: 'Raccontaci dei tuoi contenuti, del tuo pubblico e perché il tuo lavoro è adatto a One2OneLove.', bioCount: 'caratteri', instagram: 'URL Instagram', tiktok: 'URL TikTok', youtube: 'URL YouTube', other: 'URL Altra Piattaforma' },
  de: {
    title: 'Influencer-Informationen', followers: 'Gesamtzahl der Follower *', followersHelp: 'Zusammengefasste Follower über alle Plattformen', links: 'Social-Media-Links *', linkHelp: 'Mindestens ein Plattform-Link ist erforderlich', categories: 'Inhaltskategorien *', categoriesPlaceholder: 'z. B. Beziehungen, Lifestyle, Wellness (durch Kommas getrennt)', collaborations: 'Kooperationsarten *', collaborationsPlaceholder: 'z. B. Gesponserte Beiträge, Gastinhalte, Markenpartnerschaften (durch Kommas getrennt)', mediaKit: 'Media-Kit-URL', optional: '(Optional)', bio: 'Bio *', bioPlaceholder: 'Erzähle uns von deinen Inhalten, deiner Zielgruppe und warum deine Arbeit zu One2OneLove passt.', bioCount: 'Zeichen', instagram: 'Instagram-URL', tiktok: 'TikTok-URL', youtube: 'YouTube-URL', other: 'Andere Plattform-URL' },
};

export default function InfluencerSignupForm({
  platformLinks,
  setPlatformLinks,
  followerCount,
  setFollowerCount,
  contentCategories,
  setContentCategories,
  collaborationTypes,
  setCollaborationTypes,
  mediaKitUrl,
  setMediaKitUrl,
  influencerBio,
  setInfluencerBio,
}) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const handleArrayInput = (value, setter) => {
    setter(value.split(',').map((item) => item.trim()).filter(Boolean));
  };

  const handlePlatformChange = (platform, value) => {
    setPlatformLinks({ ...platformLinks, [platform]: value });
  };

  return (
    <div className="space-y-4 rounded-xl border border-pink-200 bg-pink-50 p-4">
      <h3 className="flex items-center text-lg font-semibold text-gray-800">
        <Sparkles aria-hidden="true" className="mr-2 text-pink-600" size={20} />
        {t.title}
      </h3>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700"><Users aria-hidden="true" className="mr-2 inline" size={16} />{t.followers}</label>
        <input type="number" min="0" value={followerCount} onChange={(event) => setFollowerCount(event.target.value)} placeholder="50000" className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-pink-400" required />
        <p className="mt-1 text-xs text-gray-500">{t.followersHelp}</p>
      </div>

      <div className="space-y-2">
        <label className="mb-2 block text-sm font-medium text-gray-700"><LinkIcon aria-hidden="true" className="mr-2 inline" size={16} />{t.links}</label>
        {[
          ['instagram', t.instagram],
          ['tiktok', t.tiktok],
          ['youtube', t.youtube],
          ['other', t.other],
        ].map(([platform, placeholder]) => (
          <input key={platform} type="url" placeholder={placeholder} value={platformLinks[platform] || ''} onChange={(event) => handlePlatformChange(platform, event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-pink-400" />
        ))}
        <p className="text-xs text-gray-500">{t.linkHelp}</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">{t.categories}</label>
        <input type="text" placeholder={t.categoriesPlaceholder} onChange={(event) => handleArrayInput(event.target.value, setContentCategories)} className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-pink-400" required />
        {contentCategories.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{contentCategories.map((category) => <span key={category} className="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-800">{category}</span>)}</div>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">{t.collaborations}</label>
        <input type="text" placeholder={t.collaborationsPlaceholder} onChange={(event) => handleArrayInput(event.target.value, setCollaborationTypes)} className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-pink-400" required />
        {collaborationTypes.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{collaborationTypes.map((type) => <span key={type} className="rounded-full bg-purple-200 px-2 py-1 text-xs text-purple-800">{type}</span>)}</div>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">{t.mediaKit} <span className="text-xs font-normal text-gray-400">{t.optional}</span></label>
        <input type="url" value={mediaKitUrl} onChange={(event) => setMediaKitUrl(event.target.value)} placeholder="https://example.com/media-kit" className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-pink-400" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700"><FileText aria-hidden="true" className="mr-2 inline" size={16} />{t.bio}</label>
        <textarea value={influencerBio} onChange={(event) => setInfluencerBio(event.target.value.slice(0, 1000))} placeholder={t.bioPlaceholder} rows={4} className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-pink-400" required />
        <p className="mt-1 text-xs text-gray-500">{influencerBio.length}/1000 {t.bioCount}</p>
      </div>
    </div>
  );
}
