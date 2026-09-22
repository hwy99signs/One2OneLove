import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { findUserByEmail } from '@/lib/buddyService';
import { listMemories } from '@/lib/memoryService';
import { updateProfile } from '@/lib/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Calendar, Edit, Gift, Heart, Mail, MapPin, MessageCircle, Save, TrendingUp, User, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const copy = {
  en: { title:'Our Couple Profile', subtitle:'Your shared journey together', back:'Back', partner1:'You', partner2:'Partner', memberSince:'Member since', personalInfo:'Personal Information', relationshipInfo:'Relationship Information', email:'Email', location:'Location', partner:'Partner Name', partnerEmail:'Partner Email', anniversary:'Anniversary', loveLanguage:'Love Language', relationshipStatus:'Relationship Status', editProfile:'Edit Profile', saveChanges:'Save Changes', cancel:'Cancel', notSet:'Not set', quickActions:'Quick Actions Together', recentActivity:'Recent Memories', recommendationsTitle:'Ideas for You Both', noActivity:'No recent memories yet', memoryFallback:'Memory', viewAll:'View All', loading:'Loading couple profile…', saved:'Profile updated successfully.', failed:'Unable to update the profile right now.', actions:{ note:'Send Love Note', memory:'Create Memory', date:'Date Ideas' }, recs:{ quiz:['Take the Love Language Quiz','Compare how you each naturally give and receive care.'], date:['Plan a Date Night','Choose something meaningful from the Date Ideas library.'], memory:['Create a Memory','Capture a moment you want to remember together.'], goals:['Set Relationship Goals','Choose something meaningful to work toward together.'] }, statuses:{ single:'Single', dating:'Dating', engaged:'Engaged', married:'Married', complicated:'Complicated' }, languages:{ words_of_affirmation:'Words of Affirmation', quality_time:'Quality Time', receiving_gifts:'Receiving Gifts', acts_of_service:'Acts of Service', physical_touch:'Physical Touch' } },
  es: { title:'Nuestro Perfil de Pareja', subtitle:'Su recorrido compartido juntos', back:'Volver', partner1:'Tú', partner2:'Pareja', memberSince:'Miembro desde', personalInfo:'Información Personal', relationshipInfo:'Información de Relación', email:'Correo Electrónico', location:'Ubicación', partner:'Nombre de la Pareja', partnerEmail:'Correo de la Pareja', anniversary:'Aniversario', loveLanguage:'Lenguaje del Amor', relationshipStatus:'Estado de Relación', editProfile:'Editar Perfil', saveChanges:'Guardar Cambios', cancel:'Cancelar', notSet:'No establecido', quickActions:'Acciones Rápidas Juntos', recentActivity:'Recuerdos Recientes', recommendationsTitle:'Ideas para Ambos', noActivity:'Aún no hay recuerdos recientes', memoryFallback:'Recuerdo', viewAll:'Ver Todo', loading:'Cargando perfil de pareja…', saved:'Perfil actualizado correctamente.', failed:'No se pudo actualizar el perfil.', actions:{ note:'Enviar Nota de Amor', memory:'Crear Recuerdo', date:'Ideas para Citas' }, recs:{ quiz:['Hacer el Quiz de Lenguajes del Amor','Comparen cómo cada uno da y recibe afecto.'], date:['Planear una Cita','Elijan algo significativo de la biblioteca de Ideas para Citas.'], memory:['Crear un Recuerdo','Guarden un momento que quieran recordar juntos.'], goals:['Establecer Metas de Relación','Elijan algo significativo para trabajar juntos.'] }, statuses:{ single:'Soltero/a', dating:'Saliendo', engaged:'Comprometidos', married:'Casados', complicated:'Complicado' }, languages:{ words_of_affirmation:'Palabras de Afirmación', quality_time:'Tiempo de Calidad', receiving_gifts:'Recibir Regalos', acts_of_service:'Actos de Servicio', physical_touch:'Contacto Físico' } },
  fr: { title:'Notre Profil de Couple', subtitle:'Votre parcours partagé ensemble', back:'Retour', partner1:'Vous', partner2:'Partenaire', memberSince:'Membre depuis', personalInfo:'Informations Personnelles', relationshipInfo:'Informations sur la Relation', email:'E-mail', location:'Localisation', partner:'Nom du Partenaire', partnerEmail:'E-mail du Partenaire', anniversary:'Anniversaire', loveLanguage:'Langage de l’Amour', relationshipStatus:'Statut de Relation', editProfile:'Modifier le Profil', saveChanges:'Enregistrer', cancel:'Annuler', notSet:'Non défini', quickActions:'Actions Rapides Ensemble', recentActivity:'Souvenirs Récents', recommendationsTitle:'Idées pour Vous Deux', noActivity:'Aucun souvenir récent', memoryFallback:'Souvenir', viewAll:'Voir Tout', loading:'Chargement du profil du couple…', saved:'Profil mis à jour.', failed:'Impossible de mettre à jour le profil.', actions:{ note:'Envoyer une Note d’Amour', memory:'Créer un Souvenir', date:'Idées de Rendez-vous' }, recs:{ quiz:['Faire le Quiz des Langages de l’Amour','Comparez la façon dont chacun donne et reçoit naturellement de l’affection.'], date:['Planifier un Rendez-vous','Choisissez une idée significative dans la bibliothèque.'], memory:['Créer un Souvenir','Gardez un moment que vous souhaitez conserver ensemble.'], goals:['Fixer des Objectifs de Relation','Choisissez quelque chose d’important à construire ensemble.'] }, statuses:{ single:'Célibataire', dating:'En Couple', engaged:'Fiancés', married:'Mariés', complicated:'Compliqué' }, languages:{ words_of_affirmation:'Paroles Valorissantes', quality_time:'Moments de Qualité', receiving_gifts:'Recevoir des Cadeaux', acts_of_service:'Services Rendus', physical_touch:'Toucher Physique' } },
  it: { title:'Il Nostro Profilo di Coppia', subtitle:'Il vostro percorso condiviso insieme', back:'Indietro', partner1:'Tu', partner2:'Partner', memberSince:'Membro dal', personalInfo:'Informazioni Personali', relationshipInfo:'Informazioni sulla Relazione', email:'E-mail', location:'Posizione', partner:'Nome del Partner', partnerEmail:'E-mail del Partner', anniversary:'Anniversario', loveLanguage:'Linguaggio dell’Amore', relationshipStatus:'Stato della Relazione', editProfile:'Modifica Profilo', saveChanges:'Salva Modifiche', cancel:'Annulla', notSet:'Non impostato', quickActions:'Azioni Rapide Insieme', recentActivity:'Ricordi Recenti', recommendationsTitle:'Idee per Entrambi', noActivity:'Ancora nessun ricordo recente', memoryFallback:'Ricordo', viewAll:'Visualizza Tutto', loading:'Caricamento profilo di coppia…', saved:'Profilo aggiornato.', failed:'Impossibile aggiornare il profilo.', actions:{ note:'Invia Nota d’Amore', memory:'Crea Ricordo', date:'Idee per Appuntamenti' }, recs:{ quiz:['Fai il Quiz dei Linguaggi dell’Amore','Confrontate come ciascuno dà e riceve naturalmente affetto.'], date:['Pianifica un Appuntamento','Scegliete qualcosa di significativo dalla libreria di idee.'], memory:['Crea un Ricordo','Conservate un momento che volete ricordare insieme.'], goals:['Stabilite Obiettivi di Relazione','Scegliete qualcosa di significativo su cui lavorare insieme.'] }, statuses:{ single:'Single', dating:'Frequentazione', engaged:'Fidanzati', married:'Sposati', complicated:'Complicato' }, languages:{ words_of_affirmation:'Parole di Affermazione', quality_time:'Tempo di Qualità', receiving_gifts:'Ricevere Regali', acts_of_service:'Gesti di Servizio', physical_touch:'Contatto Fisico' } },
  de: { title:'Unser Paarprofil', subtitle:'Eure gemeinsame Reise', back:'Zurück', partner1:'Du', partner2:'Partner', memberSince:'Mitglied seit', personalInfo:'Persönliche Informationen', relationshipInfo:'Beziehungsinformationen', email:'E-Mail', location:'Standort', partner:'Partnername', partnerEmail:'Partner-E-Mail', anniversary:'Jahrestag', loveLanguage:'Liebessprache', relationshipStatus:'Beziehungsstatus', editProfile:'Profil Bearbeiten', saveChanges:'Änderungen Speichern', cancel:'Abbrechen', notSet:'Nicht festgelegt', quickActions:'Schnellaktionen Zusammen', recentActivity:'Letzte Erinnerungen', recommendationsTitle:'Ideen für Euch Beide', noActivity:'Noch keine aktuellen Erinnerungen', memoryFallback:'Erinnerung', viewAll:'Alle Anzeigen', loading:'Paarprofil wird geladen…', saved:'Profil erfolgreich aktualisiert.', failed:'Profil kann gerade nicht aktualisiert werden.', actions:{ note:'Liebesnachricht Senden', memory:'Erinnerung Erstellen', date:'Date-Ideen' }, recs:{ quiz:['Liebessprachen-Quiz Machen','Vergleicht, wie ihr Fürsorge am natürlichsten gebt und empfangt.'], date:['Ein Date Planen','Wählt etwas Bedeutungsvolles aus der Date-Ideen-Bibliothek.'], memory:['Eine Erinnerung Erstellen','Haltet einen Moment fest, den ihr gemeinsam bewahren möchtet.'], goals:['Beziehungsziele Setzen','Wählt etwas Bedeutungsvolles, an dem ihr gemeinsam arbeiten möchtet.'] }, statuses:{ single:'Single', dating:'Dating', engaged:'Verlobt', married:'Verheiratet', complicated:'Kompliziert' }, languages:{ words_of_affirmation:'Worte der Anerkennung', quality_time:'Gemeinsame Zeit', receiving_gifts:'Geschenke Erhalten', acts_of_service:'Hilfsbereitschaft', physical_touch:'Körperliche Berührung' } },
};

const COUPLE_PROFILE_LOCALES = { en:'en-US', es:'es-ES', fr:'fr-FR', it:'it-IT', de:'de-DE' };

function safeDate(value, language) {
  if (!value) return null;
  const raw = String(value);
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toLocaleDateString(COUPLE_PROFILE_LOCALES[language] || COUPLE_PROFILE_LOCALES.en);
}

function PersonCard({ label, person, editable, editData, setEditData, t, language }) {
  const created = person?.created_at || person?.created_date;
  const joined = created ? new Date(created).toLocaleDateString(COUPLE_PROFILE_LOCALES[language] || COUPLE_PROFILE_LOCALES.en, { month:'long', year:'numeric' }) : t.notSet;
  return (
    <Card className="h-full shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg"><User size={38}/></div>
        <CardTitle className="mt-3 text-2xl">{person?.name || person?.full_name || label}</CardTitle>
        <p className="text-sm text-gray-500">{t.memberSince} {joined}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="mb-3 font-black text-gray-900">{t.personalInfo}</h3>
          <div className="space-y-3">
            <Info icon={Mail} label={t.email} value={person?.email || t.notSet}/>
            {editable ? <EditField id="couples-profile-location" icon={MapPin} label={t.location} value={editData.location || ''} onChange={value => setEditData({...editData,location:value})}/> : <Info icon={MapPin} label={t.location} value={person?.location || t.notSet}/>} 
          </div>
        </section>
        <section>
          <h3 className="mb-3 font-black text-gray-900">{t.relationshipInfo}</h3>
          <div className="space-y-3">
            {editable ? (
              <div><label htmlFor="couples-profile-relationship-status" className="mb-1 block text-xs font-semibold text-gray-500">{t.relationshipStatus}</label><Select value={editData.relationship_status || ''} onValueChange={value => setEditData({...editData,relationship_status:value})}><SelectTrigger id="couples-profile-relationship-status" aria-label={t.relationshipStatus}><SelectValue placeholder={t.notSet}/></SelectTrigger><SelectContent>{Object.entries(t.statuses).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            ) : <Info icon={Heart} label={t.relationshipStatus} value={t.statuses[person?.relationship_status] || person?.relationship_status || t.notSet}/>}
            {editable ? <EditField id="couples-profile-partner-name" icon={Heart} label={t.partner} value={editData.partner_name || ''} onChange={value => setEditData({...editData,partner_name:value})}/> : <Info icon={Heart} label={t.partner} value={person?.partner_name || t.notSet}/>} 
            {editable ? <EditField id="couples-profile-partner-email" icon={Mail} label={t.partnerEmail} value={editData.partner_email || ''} onChange={value => setEditData({...editData,partner_email:value})} type="email"/> : null}
            {editable ? <EditField id="couples-profile-anniversary" icon={Calendar} label={t.anniversary} value={editData.anniversary_date || ''} onChange={value => setEditData({...editData,anniversary_date:value})} type="date"/> : <Info icon={Calendar} label={t.anniversary} value={safeDate(person?.anniversary_date, language) || t.notSet}/>} 
            {editable ? (
              <div><label htmlFor="couples-profile-love-language" className="mb-1 block text-xs font-semibold text-gray-500">{t.loveLanguage}</label><Select value={editData.love_language || ''} onValueChange={value => setEditData({...editData,love_language:value})}><SelectTrigger id="couples-profile-love-language" aria-label={t.loveLanguage}><SelectValue placeholder={t.notSet}/></SelectTrigger><SelectContent>{Object.entries(t.languages).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            ) : <Info icon={Heart} label={t.loveLanguage} value={t.languages[person?.love_language] || person?.love_language || t.notSet}/>} 
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function Info({ icon:Icon, label, value }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-pink-500"/><div><p className="text-xs text-gray-500">{label}</p><p className="break-words text-sm font-medium text-gray-900">{value}</p></div></div>;
}

function EditField({ id, icon:Icon, label, value, onChange, type='text' }) {
  return <div><label htmlFor={id} className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-500"><Icon size={14} className="text-pink-500"/>{label}</label><Input id={id} type={type} value={value} onChange={event => onChange(event.target.value)}/></div>;
}

export default function CouplesProfile() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const { user: currentUser, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing,setIsEditing] = useState(false);
  const [editData,setEditData] = useState({});

  const { data: partnerUser = null } = useQuery({
    queryKey:['partnerUser',currentUser?.partner_email],
    queryFn:async () => {
      if (!currentUser?.id || !currentUser?.partner_email) return null;
      return findUserByEmail(currentUser.partner_email);
    },
    enabled:!!currentUser?.id && !!currentUser?.partner_email,
  });

  const { data: memories = [] } = useQuery({
    queryKey:['couplesProfileMemories',currentUser?.id],
    queryFn:async () => {
      if (!currentUser?.id) return [];
      const items = await listMemories(currentUser.id);
      return [...items].sort((a,b) => new Date(b.created_at || b.memory_date || 0) - new Date(a.created_at || a.memory_date || 0)).slice(0,5);
    },
    enabled:!!currentUser?.id,
  });

  const updateMutation = useMutation({
    mutationFn:data => updateProfile(data),
    onSuccess:() => {
      queryClient.invalidateQueries({ queryKey:['currentUser'] });
      queryClient.invalidateQueries({ queryKey:['partnerUser'] });
      setIsEditing(false);
      toast.success(t.saved);
      window.setTimeout(() => window.location.reload(),500);
    },
    onError:error => { console.error('Profile update failed:', error); toast.error(t.failed); },
  });

  const startEdit = () => {
    setEditData({
      location:currentUser?.location || '', partner_name:currentUser?.partner_name || '', partner_email:currentUser?.partner_email || '',
      anniversary_date:currentUser?.anniversary_date ? String(currentUser.anniversary_date).slice(0,10) : '', love_language:currentUser?.love_language || '', relationship_status:currentUser?.relationship_status || '',
    });
    setIsEditing(true);
  };

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"><p className="font-semibold text-gray-600">{t.loading}</p></div>;

  const quickActions = [
    [Heart,t.actions.note,'LoveNotes','from-pink-500 to-rose-500'],
    [Calendar,t.actions.memory,'MemoryLane','from-purple-500 to-indigo-500'],
    [Gift,t.actions.date,'DateIdeas','from-orange-500 to-yellow-500'],
  ];
  const recommendations = [
    [Heart,...t.recs.quiz,'LoveLanguageQuiz'],
    [Calendar,...t.recs.date,'DateIdeas'],
    [MessageCircle,...t.recs.memory,'MemoryLane'],
    [TrendingUp,...t.recs.goals,'RelationshipGoals'],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <Link to={createPageUrl('Home')} className="mb-6 inline-flex items-center rounded-xl px-4 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600"><ArrowLeft size={20} className="mr-2"/>{t.back}</Link>

        <div className="mb-10 text-center"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl"><Users size={39}/></div><h1 className="text-4xl font-black text-gray-900 md:text-5xl">{t.title}</h1><p className="mt-2 text-xl text-gray-600">{t.subtitle}</p></div>

        <section className="mb-10"><h2 className="mb-5 text-2xl font-black text-gray-900">{t.quickActions}</h2><div className="grid gap-4 sm:grid-cols-3">{quickActions.map(([Icon,label,link,gradient]) => <Link key={link} to={createPageUrl(link)}><Card className="h-full transition hover:-translate-y-1 hover:shadow-xl"><CardContent className="p-5 text-center"><div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white`}><Icon size={27}/></div><p className="font-black text-gray-900">{label}</p></CardContent></Card></Link>)}</div></section>

        <div className="mb-10 grid gap-7 lg:grid-cols-2">
          <PersonCard label={t.partner1} person={currentUser} editable={isEditing} editData={editData} setEditData={setEditData} t={t} language={currentLanguage}/>
          <PersonCard label={t.partner2} person={partnerUser || { name:currentUser?.partner_name, email:currentUser?.partner_email }} editable={false} editData={{}} setEditData={()=>{}} t={t} language={currentLanguage}/>
        </div>

        <div className="mb-10 flex justify-center gap-3">{isEditing ? <><Button onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending} className="bg-gradient-to-r from-pink-500 to-purple-600"><Save size={17} className="mr-2"/>{t.saveChanges}</Button><Button variant="outline" onClick={() => setIsEditing(false)}><X size={17} className="mr-2"/>{t.cancel}</Button></> : <Button onClick={startEdit} className="bg-gradient-to-r from-pink-500 to-purple-600"><Edit size={17} className="mr-2"/>{t.editProfile}</Button>}</div>

        <Card className="mb-10 shadow-xl"><CardHeader><CardTitle className="flex items-center gap-2"><Calendar size={20}/>{t.recentActivity}</CardTitle></CardHeader><CardContent>{memories.length ? <div className="space-y-3">{memories.map(memory => <div key={memory.id} className="rounded-xl bg-gray-50 p-4"><p className="font-bold text-gray-900">{memory.title || t.memoryFallback}</p><p className="mt-1 text-sm text-gray-500">{safeDate(memory.memory_date || memory.created_at,currentLanguage) || ''}</p></div>)}<Link to={createPageUrl('MemoryLane')}><Button variant="outline" className="mt-2 w-full">{t.viewAll}<ArrowRight size={16} className="ml-2"/></Button></Link></div> : <div className="py-7 text-center"><p className="mb-4 text-gray-500">{t.noActivity}</p><Link to={createPageUrl('MemoryLane')}><Button variant="outline">{t.actions.memory}</Button></Link></div>}</CardContent></Card>

        <Card className="shadow-xl"><CardHeader><CardTitle>{t.recommendationsTitle}</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{recommendations.map(([Icon,title,description,link]) => <Link key={link} to={createPageUrl(link)} className="flex h-full flex-col rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 p-4 transition hover:shadow-md"><Icon size={20} className="text-purple-600"/><p className="mt-3 font-black text-gray-900">{title}</p><p className="mt-1 flex-1 text-sm leading-6 text-gray-600">{description}</p><ArrowRight size={16} className="ml-auto mt-3 text-gray-400"/></Link>)}</div></CardContent></Card>
      </div>
    </div>
  );
}
