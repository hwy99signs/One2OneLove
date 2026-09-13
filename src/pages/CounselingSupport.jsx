import React, { useState } from "react";
import { ArrowLeft, Users, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    backToSupport: "Back to Support",
    title: "Couples Support",
    subtitle: "Connect with licensed professionals specializing in couples therapy and relationship counseling",
    licensedProfessionals: "Licensed Professionals",
    relationshipFocused: "Relationship-Focused",
    provenResults: "Proven Results",
    whyChooseTitle: "Why Choose Relationship Support?",
    licensedProfsCard: { title: "Licensed Professionals", description: "All therapists are licensed and verified professionals" },
    relationshipFocusedCard: { title: "Relationship Focused", description: "Specialized training in couples therapy and relationship counseling" },
    provenResultsCard: { title: "Proven Results", description: "Evidence-based approaches with successful outcomes" },
    searchPlaceholder: "Search by name or specialty",
    allSpecialties: "All Specialties",
    specialties: { couplesTherapy: "Couples Therapy", familyCounseling: "Family Counseling", traumaRecovery: "Trauma Recovery", communication: "Communication", preMarital: "Pre-Marital" },
    allFormats: "All Formats",
    formats: { inPerson: "In-Person", remote: "Remote", hybrid: "Hybrid" },
    noTherapists: "There are currently no therapist profiles listed.",
    ctaTitle: "Ready to Strengthen Your Relationship?",
    ctaSubtitle: "Take the first step toward a stronger, more connected relationship with professional guidance",
    scheduleFreeConsultation: "Schedule Free Consultation"
  },
  es: {
    backToSupport: "Volver al Apoyo",
    title: "Apoyo para Parejas",
    subtitle: "Conéctate con profesionales licenciados especializados en terapia de pareja y asesoramiento de relaciones",
    licensedProfessionals: "Profesionales Licenciados",
    relationshipFocused: "Enfocado en Relaciones",
    provenResults: "Resultados Comprobados",
    whyChooseTitle: "¿Por Qué Elegir Apoyo para Relaciones?",
    licensedProfsCard: { title: "Profesionales Licenciados", description: "Todos los terapeutas están licenciados y son profesionales verificados" },
    relationshipFocusedCard: { title: "Enfocado en Relaciones", description: "Capacitación especializada en terapia de pareja y asesoramiento de relaciones" },
    provenResultsCard: { title: "Resultados Comprobados", description: "Enfoques basados en evidencia con resultados exitosos" },
    searchPlaceholder: "Buscar por nombre o especialidad",
    allSpecialties: "Todas las Especialidades",
    specialties: { couplesTherapy: "Terapia de Pareja", familyCounseling: "Asesoramiento Familiar", traumaRecovery: "Recuperación de Trauma", communication: "Comunicación", preMarital: "Prematrimonial" },
    allFormats: "Todos los Formatos",
    formats: { inPerson: "En Persona", remote: "Remoto", hybrid: "Híbrido" },
    noTherapists: "Actualmente no hay perfiles de terapeutas publicados.",
    ctaTitle: "¿Listo para Fortalecer Tu Relación?",
    ctaSubtitle: "Da el primer paso hacia una relación más fuerte y conectada con orientación profesional",
    scheduleFreeConsultation: "Programar Consulta Gratuita"
  },
  fr: {
    backToSupport: "Retour au Soutien",
    title: "Soutien aux Couples",
    subtitle: "Connectez-vous avec des professionnels agréés spécialisés en thérapie de couple et conseil relationnel",
    licensedProfessionals: "Professionnels Agréés",
    relationshipFocused: "Axé sur les Relations",
    provenResults: "Résultats Prouvés",
    whyChooseTitle: "Pourquoi Choisir le Soutien Relationnel?",
    licensedProfsCard: { title: "Professionnels Agréés", description: "Tous les thérapeutes sont des professionnels agréés et vérifiés" },
    relationshipFocusedCard: { title: "Axé sur les Relations", description: "Formation spécialisée en thérapie de couple et conseil relationnel" },
    provenResultsCard: { title: "Résultats Prouvés", description: "Approches fondées sur des preuves avec des résultats positifs" },
    searchPlaceholder: "Rechercher par nom ou spécialité",
    allSpecialties: "Toutes les Spécialités",
    specialties: { couplesTherapy: "Thérapie de Couple", familyCounseling: "Conseil Familial", traumaRecovery: "Récupération de Trauma", communication: "Communication", preMarital: "Pré-Marital" },
    allFormats: "Tous les Formats",
    formats: { inPerson: "En Personne", remote: "À Distance", hybrid: "Hybride" },
    noTherapists: "Aucun profil de thérapeute n’est actuellement publié.",
    ctaTitle: "Prêt à Renforcer Votre Relation?",
    ctaSubtitle: "Faites le premier pas vers une relation plus forte et connectée avec des conseils professionnels",
    scheduleFreeConsultation: "Planifier une Consultation Gratuite"
  },
  it: {
    backToSupport: "Torna al Supporto",
    title: "Supporto per Coppie",
    subtitle: "Connettiti con professionisti autorizzati specializzati in terapia di coppia e consulenza relazionale",
    licensedProfessionals: "Professionisti Autorizzati",
    relationshipFocused: "Focalizzato sulle Relazioni",
    provenResults: "Risultati Comprovati",
    whyChooseTitle: "Perché Scegliere il Supporto Relazionale?",
    licensedProfsCard: { title: "Professionisti Autorizzati", description: "Tutti i terapeuti sono professionisti autorizzati e verificati" },
    relationshipFocusedCard: { title: "Focalizzato sulle Relazioni", description: "Formazione specializzata in terapia di coppia e consulenza relazionale" },
    provenResultsCard: { title: "Risultati Comprovati", description: "Approcci basati sull'evidenza con risultati positivi" },
    searchPlaceholder: "Cerca per nome o specialità",
    allSpecialties: "Tutte le Specialità",
    specialties: { couplesTherapy: "Terapia di Coppia", familyCounseling: "Consulenza Familiare", traumaRecovery: "Recupero da Trauma", communication: "Comunicazione", preMarital: "Pre-Matrimoniale" },
    allFormats: "Tutti i Formati",
    formats: { inPerson: "Di Persona", remote: "Remoto", hybrid: "Ibrido" },
    noTherapists: "Al momento non sono pubblicati profili di terapeuti.",
    ctaTitle: "Pronto a Rafforzare la Tua Relazione?",
    ctaSubtitle: "Fai il primo passo verso una relazione più forte e connessa con una guida professionale",
    scheduleFreeConsultation: "Programma Consulenza Gratuita"
  },
  de: {
    backToSupport: "Zurück zur Unterstützung",
    title: "Paar-Unterstützung",
    subtitle: "Verbinden Sie sich mit lizenzierten Fachleuten, die auf Paartherapie und Beziehungsberatung spezialisiert sind",
    licensedProfessionals: "Lizenzierte Fachleute",
    relationshipFocused: "Beziehungsorientiert",
    provenResults: "Bewährte Ergebnisse",
    whyChooseTitle: "Warum Beziehungsunterstützung Wählen?",
    licensedProfsCard: { title: "Lizenzierte Fachleute", description: "Alle Therapeuten sind lizenzierte und verifizierte Fachleute" },
    relationshipFocusedCard: { title: "Beziehungsorientiert", description: "Spezialisierte Ausbildung in Paartherapie und Beziehungsberatung" },
    provenResultsCard: { title: "Bewährte Ergebnisse", description: "Evidenzbasierte Ansätze mit erfolgreichen Ergebnissen" },
    searchPlaceholder: "Suche nach Name oder Spezialität",
    allSpecialties: "Alle Spezialitäten",
    specialties: { couplesTherapy: "Paartherapie", familyCounseling: "Familienberatung", traumaRecovery: "Trauma-Erholung", communication: "Kommunikation", preMarital: "Vor der Ehe" },
    allFormats: "Alle Formate",
    formats: { inPerson: "Persönlich", remote: "Remote", hybrid: "Hybrid" },
    noTherapists: "Derzeit sind keine Therapeutenprofile veröffentlicht.",
    ctaTitle: "Bereit, Ihre Beziehung zu Stärken?",
    ctaSubtitle: "Machen Sie den ersten Schritt zu einer stärkeren, verbundeneren Beziehung mit professioneller Anleitung",
    scheduleFreeConsultation: "Kostenlose Beratung Planen"
  },
  nl: {
    backToSupport: "Terug naar Ondersteuning",
    title: "Koppel Ondersteuning",
    subtitle: "Maak verbinding met erkende professionals gespecialiseerd in relatietherapie en begeleiding",
    licensedProfessionals: "Erkende Professionals",
    relationshipFocused: "Relatiegericht",
    provenResults: "Bewezen Resultaten",
    whyChooseTitle: "Waarom Relatie Ondersteuning Kiezen?",
    licensedProfsCard: { title: "Erkende Professionals", description: "Alle therapeuten zijn erkende en geverifieerde professionals" },
    relationshipFocusedCard: { title: "Relatiegericht", description: "Gespecialiseerde training in relatietherapie en begeleiding" },
    provenResultsCard: { title: "Bewezen Resultaten", description: "Bewezen benaderingen met succesvolle resultaten" },
    searchPlaceholder: "Zoek op naam of specialiteit",
    allSpecialties: "Alle Specialiteiten",
    specialties: { couplesTherapy: "Relatietherapie", familyCounseling: "Gezinsbegeleiding", traumaRecovery: "Trauma Herstel", communication: "Communicatie", preMarital: "Pre-Huwelijks" },
    allFormats: "Alle Formaten",
    formats: { inPerson: "Persoonlijk", remote: "Op Afstand", hybrid: "Hybride" },
    noTherapists: "Er worden momenteel geen therapeutenprofielen vermeld.",
    ctaTitle: "Klaar om Je Relatie te Versterken?",
    ctaSubtitle: "Zet de eerste stap naar een sterkere, meer verbonden relatie met professionele begeleiding",
    scheduleFreeConsultation: "Plan Gratis Consultatie"
  },
  pt: {
    backToSupport: "Voltar ao Apoio",
    title: "Apoio para Casais",
    subtitle: "Conecte-se com profissionais licenciados especializados em terapia de casal e aconselhamento de relacionamento",
    licensedProfessionals: "Profissionais Licenciados",
    relationshipFocused: "Focado em Relacionamentos",
    provenResults: "Resultados Comprovados",
    whyChooseTitle: "Por Que Escolher Apoio ao Relacionamento?",
    licensedProfsCard: { title: "Profissionais Licenciados", description: "Todos os terapeutas são profissionais licenciados e verificados" },
    relationshipFocusedCard: { title: "Focado em Relacionamentos", description: "Treinamento especializado em terapia de casal e aconselhamento de relacionamento" },
    provenResultsCard: { title: "Resultados Comprovados", description: "Abordagens baseadas em evidências com resultados bem-sucedidos" },
    searchPlaceholder: "Pesquisar por nome ou especialidade",
    allSpecialties: "Todas as Especialidades",
    specialties: { couplesTherapy: "Terapia de Casal", familyCounseling: "Aconselhamento Familiar", traumaRecovery: "Recuperação de Trauma", communication: "Comunicação", preMarital: "Pré-Matrimonial" },
    allFormats: "Todos os Formatos",
    formats: { inPerson: "Presencial", remote: "Remoto", hybrid: "Híbrido" },
    noTherapists: "Atualmente não há perfis de terapeutas publicados.",
    ctaTitle: "Pronto para Fortalecer Seu Relacionamento?",
    ctaSubtitle: "Dê o primeiro passo em direção a um relacionamento mais forte e conectado com orientação profissional",
    scheduleFreeConsultation: "Agendar Consulta Gratuita"
  }
};

export default function CounselingSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");

  const counselors = [];

  const filteredCounselors = counselors.filter(counselor => {
    const matchesSearch = searchQuery === "" ||
      counselor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      counselor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "all" || counselor.expertise.includes(selectedSpecialty);
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Link to={createPageUrl("CoupleSupport")} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t.backToSupport}
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-white/90 mb-6">{t.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30">{t.licensedProfessionals}</Button>
            <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30">{t.relationshipFocused}</Button>
            <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30">{t.provenResults}</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t.whyChooseTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{t.licensedProfsCard.title}</h3>
                <p className="text-sm text-gray-600">{t.licensedProfsCard.description}</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Heart className="w-12 h-12 text-pink-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{t.relationshipFocusedCard.title}</h3>
                <p className="text-sm text-gray-600">{t.relationshipFocusedCard.description}</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Star className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{t.provenResultsCard.title}</h3>
                <p className="text-sm text-gray-600">{t.provenResultsCard.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Input
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12"
          />
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="h-12"><SelectValue placeholder={t.allSpecialties} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allSpecialties}</SelectItem>
              <SelectItem value="Couples Therapy">{t.specialties.couplesTherapy}</SelectItem>
              <SelectItem value="Family Counseling">{t.specialties.familyCounseling}</SelectItem>
              <SelectItem value="Trauma Recovery">{t.specialties.traumaRecovery}</SelectItem>
              <SelectItem value="Communication">{t.specialties.communication}</SelectItem>
              <SelectItem value="Pre-Marital">{t.specialties.preMarital}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger className="h-12"><SelectValue placeholder={t.allFormats} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allFormats}</SelectItem>
              <SelectItem value="in-person">{t.formats.inPerson}</SelectItem>
              <SelectItem value="remote">{t.formats.remote}</SelectItem>
              <SelectItem value="hybrid">{t.formats.hybrid}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCounselors.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="py-12 text-center text-gray-600 text-lg">
                {t.noTherapists}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white">
          <Heart className="w-12 h-12 mx-auto mb-4 fill-current" />
          <h2 className="text-3xl font-bold mb-4">{t.ctaTitle}</h2>
          <p className="text-lg mb-6 opacity-90">{t.ctaSubtitle}</p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">{t.scheduleFreeConsultation}</Button>
        </div>
      </div>
    </div>
  );
}
