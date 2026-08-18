import React, { useEffect, useState } from 'react';
import { Archive, Download, Loader2, LockKeyhole, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { createPrivacyRequest, listPrivacyRequests, privacyRequestsEnabled } from '@/lib/privacyRequestService';

const COPY = {
  en: { title: 'Privacy & Account Controls', subtitle: 'See the relaunch privacy boundary and manage account privacy requests.', signIn: 'Sign in to manage privacy requests.', signInButton: 'Sign In', discovery: 'Member discovery', discoveryText: 'Other signed-in members may discover your name, profile image, short bio, general location, relationship status and member-since date.', private: 'Account-private', privateText: 'Account email, anniversary, partner name, Love Language, private Chat, Love Notes and billing details are not part of the member directory.', exportTitle: 'Request a copy of my account data', exportText: 'This creates a private request for an account-data export. It does not generate or email an export until the reviewed backend fulfillment process is active.', exportButton: 'Request Data Export', deleteTitle: 'Request account deletion', deleteText: 'This creates a deletion request only. It does not immediately delete your account, messages, Love Notes, billing records or shared records.', deleteConfirm: 'Type DELETE to confirm that you want to submit an account-deletion request.', deleteButton: 'Request Account Deletion', staged: 'Privacy request intake is staged and not active in this development environment. No request is submitted while this control is off.', history: 'My request history', none: 'No privacy requests are recorded in this environment.', submitted: 'Request submitted.', existing: 'A request of this type is already pending or under review.' },
  es: { title: 'Privacidad y Controles de Cuenta', subtitle: 'Consulta los límites de privacidad y gestiona solicitudes de la cuenta.', signIn: 'Inicia sesión para gestionar solicitudes de privacidad.', signInButton: 'Iniciar Sesión', discovery: 'Descubrimiento de miembros', discoveryText: 'Otros miembros conectados pueden descubrir tu nombre, imagen, biografía corta, ubicación general, estado de relación y fecha de ingreso.', private: 'Privado de la cuenta', privateText: 'Correo de cuenta, aniversario, nombre de pareja, Lenguaje del Amor, Chat privado, Love Notes y facturación no forman parte del directorio.', exportTitle: 'Solicitar una copia de mis datos', exportText: 'Crea una solicitud privada de exportación. No genera ni envía datos hasta que el proceso revisado esté activo.', exportButton: 'Solicitar Exportación', deleteTitle: 'Solicitar eliminación de cuenta', deleteText: 'Crea solo una solicitud. No elimina inmediatamente tu cuenta ni datos compartidos.', deleteConfirm: 'Escribe DELETE para confirmar la solicitud de eliminación.', deleteButton: 'Solicitar Eliminación', staged: 'La recepción de solicitudes está preparada pero no activa en este entorno. No se envía ninguna solicitud mientras esté desactivada.', history: 'Historial de solicitudes', none: 'No hay solicitudes registradas en este entorno.', submitted: 'Solicitud enviada.', existing: 'Ya existe una solicitud de este tipo pendiente o en revisión.' },
  fr: { title: 'Confidentialité et Contrôles du Compte', subtitle: 'Consultez la limite de confidentialité et gérez les demandes liées au compte.', signIn: 'Connectez-vous pour gérer les demandes de confidentialité.', signInButton: 'Se Connecter', discovery: 'Découverte des membres', discoveryText: 'Les autres membres connectés peuvent découvrir votre nom, image, courte bio, localisation générale, statut de relation et date d’adhésion.', private: 'Privé au compte', privateText: 'E-mail du compte, anniversaire, nom du partenaire, Langage d’Amour, Chat privé, Love Notes et facturation ne figurent pas dans l’annuaire.', exportTitle: 'Demander une copie de mes données', exportText: 'Crée une demande privée d’export. Aucun export n’est généré ou envoyé avant l’activation du processus examiné.', exportButton: 'Demander un Export', deleteTitle: 'Demander la suppression du compte', deleteText: 'Crée uniquement une demande. Le compte et les données ne sont pas supprimés immédiatement.', deleteConfirm: 'Tapez DELETE pour confirmer la demande de suppression.', deleteButton: 'Demander la Suppression', staged: 'La réception des demandes est préparée mais inactive dans cet environnement. Aucune demande n’est envoyée tant qu’elle est désactivée.', history: 'Historique de mes demandes', none: 'Aucune demande enregistrée dans cet environnement.', submitted: 'Demande envoyée.', existing: 'Une demande de ce type est déjà en attente ou en cours de revue.' },
  it: { title: 'Privacy e Controlli Account', subtitle: 'Consulta i confini della privacy e gestisci le richieste dell’account.', signIn: 'Accedi per gestire le richieste privacy.', signInButton: 'Accedi', discovery: 'Scoperta membri', discoveryText: 'Altri membri autenticati possono scoprire nome, immagine, breve bio, posizione generale, stato della relazione e data di iscrizione.', private: 'Privato dell’account', privateText: 'Email account, anniversario, nome partner, Linguaggio dell’Amore, Chat privato, Love Notes e dati di fatturazione non fanno parte della directory.', exportTitle: 'Richiedi una copia dei miei dati', exportText: 'Crea una richiesta privata di esportazione. Non genera né invia un export finché il processo revisionato non è attivo.', exportButton: 'Richiedi Esportazione', deleteTitle: 'Richiedi eliminazione account', deleteText: 'Crea solo una richiesta. Non elimina immediatamente account o dati.', deleteConfirm: 'Digita DELETE per confermare la richiesta di eliminazione.', deleteButton: 'Richiedi Eliminazione', staged: 'La raccolta delle richieste è preparata ma non attiva in questo ambiente. Nessuna richiesta viene inviata quando è disattivata.', history: 'Cronologia richieste', none: 'Nessuna richiesta registrata in questo ambiente.', submitted: 'Richiesta inviata.', existing: 'Esiste già una richiesta di questo tipo in attesa o in revisione.' },
  de: { title: 'Datenschutz & Kontosteuerung', subtitle: 'Sieh die Datenschutzgrenzen und verwalte Kontoanfragen.', signIn: 'Melde dich an, um Datenschutzanfragen zu verwalten.', signInButton: 'Anmelden', discovery: 'Mitgliedersuche', discoveryText: 'Andere angemeldete Mitglieder können Name, Profilbild, kurze Bio, allgemeinen Ort, Beziehungsstatus und Beitrittsdatum sehen.', private: 'Kontoprivat', privateText: 'Konto-E-Mail, Jahrestag, Partnername, Liebessprache, privater Chat, Love Notes und Abrechnungsdaten sind nicht Teil des Verzeichnisses.', exportTitle: 'Kopie meiner Kontodaten anfordern', exportText: 'Erstellt eine private Exportanfrage. Ein Export wird erst nach Aktivierung des geprüften Prozesses erstellt oder versendet.', exportButton: 'Datenexport Anfordern', deleteTitle: 'Kontolöschung anfordern', deleteText: 'Erstellt nur eine Anfrage. Konto und Daten werden nicht sofort gelöscht.', deleteConfirm: 'Gib DELETE ein, um die Löschanfrage zu bestätigen.', deleteButton: 'Kontolöschung Anfordern', staged: 'Die Anfrageannahme ist vorbereitet, aber in dieser Umgebung nicht aktiv. Solange sie aus ist, wird keine Anfrage gesendet.', history: 'Meine Anfragen', none: 'In dieser Umgebung sind keine Anfragen gespeichert.', submitted: 'Anfrage gesendet.', existing: 'Eine Anfrage dieses Typs ist bereits ausstehend oder in Prüfung.' },
  nl: { title: 'Privacy & Accountbeheer', subtitle: 'Bekijk de privacygrens en beheer accountverzoeken.', signIn: 'Log in om privacyverzoeken te beheren.', signInButton: 'Inloggen', discovery: 'Leden ontdekken', discoveryText: 'Andere ingelogde leden kunnen naam, profielfoto, korte bio, algemene locatie, relatiestatus en lid-sindsdatum zien.', private: 'Privé voor je account', privateText: 'Account-e-mail, jubileum, partnernaam, Liefdestaal, privéchat, Love Notes en facturering staan niet in de ledendirectory.', exportTitle: 'Kopie van mijn accountgegevens aanvragen', exportText: 'Maakt een privé-exportverzoek. Er wordt niets gegenereerd of verzonden voordat het beoordeelde proces actief is.', exportButton: 'Gegevensexport Aanvragen', deleteTitle: 'Accountverwijdering aanvragen', deleteText: 'Maakt alleen een verzoek. Je account en gegevens worden niet onmiddellijk verwijderd.', deleteConfirm: 'Typ DELETE om het verwijderingsverzoek te bevestigen.', deleteButton: 'Accountverwijdering Aanvragen', staged: 'De aanvraagfunctie is voorbereid maar niet actief in deze omgeving. Er wordt niets verzonden zolang deze uit staat.', history: 'Mijn verzoeken', none: 'Geen privacyverzoeken in deze omgeving.', submitted: 'Verzoek ingediend.', existing: 'Er is al een verzoek van dit type in behandeling.' },
  pt: { title: 'Privacidade e Controles da Conta', subtitle: 'Veja os limites de privacidade e gerencie solicitações da conta.', signIn: 'Entre para gerenciar solicitações de privacidade.', signInButton: 'Entrar', discovery: 'Descoberta de membros', discoveryText: 'Outros membros conectados podem descobrir nome, imagem, bio curta, localização geral, status do relacionamento e data de entrada.', private: 'Privado da conta', privateText: 'E-mail da conta, aniversário, nome do parceiro, Linguagem do Amor, Chat privado, Love Notes e cobrança não fazem parte do diretório.', exportTitle: 'Solicitar uma cópia dos meus dados', exportText: 'Cria uma solicitação privada de exportação. Nada é gerado ou enviado até o processo revisado ser ativado.', exportButton: 'Solicitar Exportação', deleteTitle: 'Solicitar exclusão da conta', deleteText: 'Cria apenas uma solicitação. A conta e os dados não são excluídos imediatamente.', deleteConfirm: 'Digite DELETE para confirmar a solicitação de exclusão.', deleteButton: 'Solicitar Exclusão', staged: 'O recebimento de solicitações está preparado, mas não ativo neste ambiente. Nenhuma solicitação é enviada enquanto estiver desativado.', history: 'Minhas solicitações', none: 'Nenhuma solicitação registrada neste ambiente.', submitted: 'Solicitação enviada.', existing: 'Já existe uma solicitação desse tipo pendente ou em análise.' },
};

const typeLabel = (type) => type === 'account_deletion' ? 'Account deletion' : 'Data export';

export default function PrivacyCenter() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const enabled = privacyRequestsEnabled();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const load = async () => {
    if (!isAuthenticated || !enabled) return;
    setLoading(true);
    try { setRequests(await listPrivacyRequests()); }
    catch (error) { toast.error(error?.message || 'Unable to load privacy requests.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [isAuthenticated, enabled, user?.id]);

  const submit = async (type) => {
    if (!enabled || busy) return;
    if (type === 'account_deletion' && deleteConfirm.trim().toUpperCase() !== 'DELETE') return;
    setBusy(type);
    try {
      const before = requests.find((item) => item.request_type === type && ['submitted', 'in_review'].includes(item.status));
      const result = await createPrivacyRequest(type);
      toast.success(before ? t.existing : t.submitted);
      setDeleteConfirm('');
      await load();
      return result;
    } catch (error) {
      toast.error(error?.message || 'Unable to submit privacy request.');
    } finally { setBusy(''); }
  };

  if (!isAuthenticated) {
    return <main className="min-h-[70vh] bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 py-16"><Card className="mx-auto max-w-lg"><CardContent className="p-8 text-center"><LockKeyhole className="mx-auto h-12 w-12 text-purple-600" /><h1 className="mt-4 text-2xl font-black">{t.title}</h1><p className="mt-2 text-gray-600">{t.signIn}</p><Button className="mt-6" onClick={() => navigate('/SignIn?returnTo=%2FPrivacyCenter')}>{t.signInButton}</Button></CardContent></Card></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-center"><ShieldCheck className="mx-auto h-12 w-12 text-purple-700" /><h1 className="mt-4 text-4xl font-black text-gray-900">{t.title}</h1><p className="mx-auto mt-3 max-w-2xl text-gray-600">{t.subtitle}</p></div>
        {!enabled && <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{t.staged}</div>}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Card className="border-blue-200"><CardHeader><CardTitle className="flex items-center gap-2"><Archive className="h-5 w-5 text-blue-700" />{t.discovery}</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-gray-700">{t.discoveryText}</CardContent></Card>
          <Card className="border-slate-200"><CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-slate-700" />{t.private}</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-gray-700">{t.privateText}</CardContent></Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-purple-700" />{t.exportTitle}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-gray-600">{t.exportText}</p><Button className="mt-5" disabled={!enabled || Boolean(busy)} onClick={() => void submit('data_export')}>{busy === 'data_export' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}{t.exportButton}</Button></CardContent></Card>
          <Card className="border-red-200"><CardHeader><CardTitle className="flex items-center gap-2 text-red-900"><Trash2 className="h-5 w-5" />{t.deleteTitle}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-gray-600">{t.deleteText}</p><label className="mt-4 block text-sm font-semibold text-gray-700">{t.deleteConfirm}<Input className="mt-2" value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value.slice(0, 10))} autoComplete="off" /></label><Button variant="destructive" className="mt-5" disabled={!enabled || Boolean(busy) || deleteConfirm.trim().toUpperCase() !== 'DELETE'} onClick={() => void submit('account_deletion')}>{busy === 'account_deletion' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}{t.deleteButton}</Button></CardContent></Card>
        </div>

        <Card className="mt-8"><CardHeader><CardTitle>{t.history}</CardTitle></CardHeader><CardContent>{loading ? <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div> : !requests.length ? <p className="text-sm text-gray-500">{t.none}</p> : <div className="space-y-3">{requests.map((item) => <div key={item.id} className="flex flex-col justify-between gap-2 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center"><div><p className="font-bold text-gray-900">{typeLabel(item.request_type)}</p><p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700">{item.status}</span></div>)}</div>}</CardContent></Card>
      </div>
    </main>
  );
}
