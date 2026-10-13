import React,{useEffect,useMemo,useState} from 'react';
import {Coins,CreditCard,RefreshCw,ShieldCheck,Play,Square,ArrowLeft,CheckCircle2,Phone,UserCheck} from 'lucide-react';
import {Link,useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {useAuth} from '@/contexts/AuthContext';
import {useLanguage} from '@/Layout';
import {createPageUrl} from '@/utils';
import {
  getTokenWallet,startTokenCheckout,confirmTokenCheckout,startPaymentMethodSetup,
  confirmPaymentMethodSetup,updateAutoReplenish,startCostCalibration,endCostCalibration,getCalibrationHistory,
  isPhoneVerificationError
} from '@/lib/tokenService';

const COPY={
 en:{title:'BUY CREDIT',sub:'Credit is plain US dollars for One2OneLove features — a $5.00 balance is five dollars. No points, no conversion. Keep Credit ready so premium features, locked content, games and AI conversations are available when you want them.',badge:'CREDIT · US DOLLARS · $1.00 = $1.00',balance:'Credit Balance',buy:'Add Credit',buyAccess:'Add Credit To Access',packages:'Add Credit',auto:'Auto-Replenish',autoBody:'Optional. When your balance falls to your refill point, we charge your saved card once for the amount you choose — so Credit is available when you choose a paid feature.',enable:'Enable Auto-Replenish',threshold:'Refill when my balance falls to ($)',cap:'Monthly Auto-Replenish cap ($)',consent:'I agree that One2OneLove may charge my saved card automatically each time my balance falls to my refill point, up to my monthly cap. I can turn this off at any time.',consentRequired:'Please tick the consent box to enable Auto-Replenish.',receiptNote:'Stripe emails you a receipt for every reload.',offNote:'Turning it off is one tap — no charges after that, ever, until you turn it back on.',payment:'Payment method',addCard:'Add / Change Card',history:'Recent Activity',noHistory:'No Credit activity yet.',cal:'Cost Calibration',calBody:'Admin-only measurement mode. Start a session, use the selected feature naturally, then end it to see the complete provider-usage totals.',start:'Start Cost Test',end:'End Cost Test',feature:'Feature',notes:'Notes',signed:'Create or sign in to a free verified account before adding Credit.',back:'Back',loading:'Loading wallet…',saved:'Auto-Replenish saved.',checkout:'Opening secure checkout…',calStarted:'Cost test started.',calEnded:'Cost test ended.',providerCost:'Provider cost',charsIn:'Characters in',charsOut:'Characters out',providerIn:'Provider input units',providerCached:'Cached input units',providerOut:'Provider output units',contextChars:'Context characters',o2olTokens:'Credit charged (cents)',costPerToken:'Provider cost / cent',packageTest:'Package under test',creditNote:'Credit is service credit for One2OneLove features only — non-transferable, no cash redemption.',pricesTitle:'Current Feature Prices',regionalNote:'Priced by the recipient\u2019s region — from $0.29 (USA & Canada)',gcHistory:'O2OL Bonus Game Credits Activity',noGcHistory:'No Bonus Game Credits activity yet.'},
 es:{title:'COMPRAR CRÉDITO',sub:'El Crédito son dólares estadounidenses para las funciones de One2OneLove: un saldo de $5.00 son cinco dólares. Sin puntos ni conversión.',badge:'CRÉDITO · DÓLARES USD · $1.00 = $1.00',balance:'Saldo de Crédito',buy:'Agregar Crédito',buyAccess:'Agregar Crédito para Acceder',packages:'Agregar Crédito',auto:'Recarga Automática',autoBody:'Opcional. Cuando tu saldo baje al punto de recarga, cobraremos una vez tu tarjeta guardada por el monto elegido, para que tengas Crédito disponible cuando elijas una función de pago.',enable:'Activar Recarga Automática',threshold:'Recargar cuando mi saldo baje a ($)',cap:'Límite mensual de Recarga Automática ($)',consent:'Acepto que One2OneLove cobre automáticamente mi tarjeta guardada cada vez que mi saldo baje al punto de recarga, hasta mi límite mensual. Puedo desactivarlo en cualquier momento.',consentRequired:'Marca la casilla de consentimiento para activar la Recarga Automática.',receiptNote:'Stripe te envía un recibo por correo en cada recarga.',offNote:'Desactivarlo es un toque: sin cargos después, hasta que lo vuelvas a activar.',payment:'Método de pago',addCard:'Agregar / Cambiar Tarjeta',history:'Actividad Reciente',noHistory:'Aún no hay actividad de Crédito.',cal:'Calibración de Costos',calBody:'Modo de medición solo para admin.',start:'Iniciar Prueba',end:'Finalizar Prueba',feature:'Función',notes:'Notas',signed:'Crea o inicia sesión en una cuenta gratuita verificada antes de agregar Crédito.',back:'Volver',loading:'Cargando…',saved:'Recarga guardada.',checkout:'Abriendo pago seguro…',calStarted:'Prueba iniciada.',calEnded:'Prueba finalizada.',providerCost:'Costo proveedor',charsIn:'Caracteres entrada',charsOut:'Caracteres salida',providerIn:'Unidades entrada',providerCached:'Unidades en caché',providerOut:'Unidades salida',contextChars:'Caracteres de contexto',o2olTokens:'Crédito cobrado (centavos)',costPerToken:'Costo proveedor / centavo',packageTest:'Paquete en prueba',creditNote:'El Crédito es crédito de servicio solo para funciones de One2OneLove: no transferible, sin reembolso en efectivo.',pricesTitle:'Precios Actuales de Funciones',regionalNote:'Precio según la región del destinatario: desde $0.29 (EE. UU. y Canadá)',gcHistory:'Actividad de Créditos de Juego Bonus O2OL',noGcHistory:'Aún no hay actividad de Créditos de Juego Bonus.'},
 fr:{title:'ACHETER DU CRÉDIT',sub:'Le Crédit est en dollars américains pour les fonctions One2OneLove : un solde de 5,00 $ vaut cinq dollars. Sans points ni conversion.',badge:'CRÉDIT · DOLLARS USD · 1,00 $ = 1,00 $',balance:'Solde de Crédit',buy:'Ajouter du Crédit',buyAccess:'Ajouter du Crédit pour Accéder',packages:'Ajouter du Crédit',auto:'Recharge Automatique',autoBody:'Optionnel. Quand votre solde atteint votre seuil de recharge, nous débitons une fois votre carte enregistrée du montant choisi — votre solde et votre Note d\u2019Amour hebdomadaire gratuite ne tombent jamais à zéro.',enable:'Activer la Recharge Automatique',threshold:'Recharger quand mon solde descend à ($)',cap:'Plafond mensuel de Recharge Automatique ($)',consent:'J\u2019accepte que One2OneLove débite automatiquement ma carte enregistrée chaque fois que mon solde atteint mon seuil, jusqu\u2019à mon plafond mensuel. Je peux désactiver à tout moment.',consentRequired:'Cochez la case de consentement pour activer la Recharge Automatique.',receiptNote:'Stripe vous envoie un reçu par e-mail à chaque recharge.',offNote:'Un toucher suffit pour la désactiver — plus aucun débit ensuite.',payment:'Moyen de paiement',addCard:'Ajouter / Changer la Carte',history:'Activité Récente',noHistory:'Aucune activité de Crédit.',cal:'Calibration des Coûts',calBody:'Mode de mesure réservé à l\u2019administration.',start:'Démarrer le Test',end:'Terminer le Test',feature:'Fonction',notes:'Notes',signed:'Créez ou connectez-vous à un compte gratuit vérifié avant d\u2019ajouter du Crédit.',back:'Retour',loading:'Chargement…',saved:'Recharge enregistrée.',checkout:'Ouverture du paiement sécurisé…',calStarted:'Test démarré.',calEnded:'Test terminé.',providerCost:'Coût fournisseur',charsIn:'Caractères entrée',charsOut:'Caractères sortie',providerIn:'Unités entrée',providerCached:'Unités en cache',providerOut:'Unités sortie',contextChars:'Caractères de contexte',o2olTokens:'Crédit débité (centimes)',costPerToken:'Coût fournisseur / centime',packageTest:'Forfait testé',creditNote:'Le Crédit est un crédit de service pour les fonctions One2OneLove uniquement — non transférable, aucun remboursement en espèces.',pricesTitle:'Prix Actuels des Fonctions',regionalNote:'Prix selon la région du destinataire — dès 0,29 $ (États-Unis et Canada)',gcHistory:'Activité des Crédits de Jeu Bonus O2OL',noGcHistory:'Aucune activité de Crédits de Jeu Bonus pour le moment.'},
 it:{title:'ACQUISTA CREDITO',sub:'Il Credito è in dollari USA per le funzioni One2OneLove: un saldo di $5,00 vale cinque dollari. Niente punti, niente conversioni.',badge:'CREDITO · DOLLARI USD · $1,00 = $1,00',balance:'Saldo Credito',buy:'Aggiungi Credito',buyAccess:'Aggiungi Credito per Accedere',packages:'Aggiungi Credito',auto:'Ricarica Automatica',autoBody:'Facoltativo. Quando il saldo scende alla soglia scelta, addebitiamo una volta la carta salvata per l\u2019importo scelto — così il saldo e la tua Nota d\u2019Amore settimanale gratuita non si interrompono mai.',enable:'Attiva Ricarica Automatica',threshold:'Ricarica quando il mio saldo scende a ($)',cap:'Limite mensile Ricarica Automatica ($)',consent:'Accetto che One2OneLove addebiti automaticamente la mia carta salvata ogni volta che il saldo scende alla soglia, fino al mio limite mensile. Posso disattivare in qualsiasi momento.',consentRequired:'Spunta la casella di consenso per attivare la Ricarica Automatica.',receiptNote:'Stripe ti invia una ricevuta via email per ogni ricarica.',offNote:'Un tocco la disattiva — nessun addebito dopo, finché non la riattivi.',payment:'Metodo di pagamento',addCard:'Aggiungi / Cambia Carta',history:'Attività Recente',noHistory:'Nessuna attività di Credito.',cal:'Calibrazione Costi',calBody:'Modalità di misurazione solo admin.',start:'Avvia Test',end:'Termina Test',feature:'Funzione',notes:'Note',signed:'Crea o accedi a un account gratuito verificato prima di aggiungere Credito.',back:'Indietro',loading:'Caricamento…',saved:'Ricarica salvata.',checkout:'Apertura pagamento sicuro…',calStarted:'Test avviato.',calEnded:'Test terminato.',providerCost:'Costo provider',charsIn:'Caratteri input',charsOut:'Caratteri output',providerIn:'Unità input',providerCached:'Unità input in cache',providerOut:'Unità output',contextChars:'Caratteri contesto',o2olTokens:'Credito addebitato (centesimi)',costPerToken:'Costo provider / centesimo',packageTest:'Pacchetto in prova',creditNote:'Il Credito è credito di servizio solo per le funzioni One2OneLove — non trasferibile, nessun rimborso in contanti.',pricesTitle:'Prezzi Attuali delle Funzioni',regionalNote:'Prezzo in base alla regione del destinatario — da $0,29 (USA e Canada)',gcHistory:'Attività Crediti di Gioco Bonus O2OL',noGcHistory:'Nessuna attività di Crediti di Gioco Bonus.'},
 de:{title:'CREDIT KAUFEN',sub:'Credit sind US-Dollar für One2OneLove-Funktionen: Ein Guthaben von $5,00 sind fünf Dollar. Keine Punkte, keine Umrechnung.',badge:'CREDIT · US-DOLLAR · $1,00 = $1,00',balance:'Credit-Guthaben',buy:'Credit Hinzufügen',buyAccess:'Credit Hinzufügen für Zugriff',packages:'Credit Hinzufügen',auto:'Automatische Aufladung',autoBody:'Optional. Wenn Ihr Guthaben auf Ihren Aufladepunkt fällt, belasten wir Ihre gespeicherte Karte einmal mit dem gewählten Betrag — damit Credit verfügbar ist, wenn Sie eine kostenpflichtige Funktion wählen.',enable:'Auto-Aufladung Aktivieren',threshold:'Aufladen, wenn mein Guthaben fällt auf ($)',cap:'Monatslimit Auto-Aufladung ($)',consent:'Ich stimme zu, dass One2OneLove meine gespeicherte Karte automatisch belastet, sobald mein Guthaben den Aufladepunkt erreicht, bis zu meinem Monatslimit. Ich kann dies jederzeit deaktivieren.',consentRequired:'Bitte bestätigen Sie die Einwilligung, um die Auto-Aufladung zu aktivieren.',receiptNote:'Stripe sendet Ihnen für jede Aufladung eine Quittung per E-Mail.',offNote:'Ein Tippen deaktiviert sie — danach keine Belastungen mehr.',payment:'Zahlungsmethode',addCard:'Karte Hinzufügen / Ändern',history:'Letzte Aktivität',noHistory:'Noch keine Credit-Aktivität.',cal:'Kostenkalibrierung',calBody:'Messmodus nur für Admin.',start:'Kostentest Starten',end:'Kostentest Beenden',feature:'Funktion',notes:'Notizen',signed:'Erstelle oder melde dich bei einem kostenlosen verifizierten Konto an, bevor du Credit hinzufügst.',back:'Zurück',loading:'Wird geladen…',saved:'Aufladung gespeichert.',checkout:'Sichere Zahlung wird geöffnet…',calStarted:'Kostentest gestartet.',calEnded:'Kostentest beendet.',providerCost:'Anbieterkosten',charsIn:'Zeichen rein',charsOut:'Zeichen raus',providerIn:'Provider Eingabe',providerCached:'Zwischengespeicherte Eingabe',providerOut:'Provider Ausgabe',contextChars:'Kontextzeichen',o2olTokens:'Berechneter Credit (Cent)',costPerToken:'Anbieterkosten / Cent',packageTest:'Testpaket',creditNote:'Credit ist Dienstguthaben nur für One2OneLove-Funktionen — nicht übertragbar, keine Barauszahlung.',pricesTitle:'Aktuelle Funktionspreise',regionalNote:'Preis nach Region des Empfängers — ab $0,29 (USA & Kanada)',gcHistory:'O2OL Bonus-Spielguthaben Aktivität',noGcHistory:'Noch keine Aktivität beim Bonus-Spielguthaben.'}
};

const CUSTOM_COPY={
 en:{title:'Custom Amount',hint:'Enter any amount from $1 to $1,000.',amount:'Amount ($)',button:'Add Custom Credit',invalid:'Enter an amount between $1.00 and $1,000.00.'},
 es:{title:'Monto Personalizado',hint:'Ingresa cualquier monto de $1 a $1,000.',amount:'Monto ($)',button:'Agregar Crédito',invalid:'Ingresa un monto entre $1.00 y $1,000.00.'},
 fr:{title:'Montant Personnalisé',hint:'Entrez un montant de 1 $ à 1 000 $.',amount:'Montant ($)',button:'Ajouter du Crédit',invalid:'Entrez un montant entre 1,00 $ et 1 000,00 $.'},
 it:{title:'Importo Personalizzato',hint:'Inserisci un importo da $1 a $1.000.',amount:'Importo ($)',button:'Aggiungi Credito',invalid:'Inserisci un importo tra $1,00 e $1.000,00.'},
 de:{title:'Eigener Betrag',hint:'Gib einen Betrag von $1 bis $1.000 ein.',amount:'Betrag ($)',button:'Credit Hinzufügen',invalid:'Gib einen Betrag zwischen $1,00 und $1.000,00 ein.'}
};

const GATE_COPY={
 en:{verifyTitle:'Verify Your Phone to Add Credit',verifyBody:'Buying Credit requires a verified phone number. Verify yours and you will come straight back here — your balance and the Credit packs will be waiting.',verifyButton:'Verify My Phone',failTitle:'Your Credit wallet could not be loaded',failBody:'Nothing was charged. Please try again.',retryButton:'Try Again',setupTitle:'Finish setting up your account',setupBody:'You are signed in, but your member profile is not complete yet — and your Credit wallet needs a finished profile before it can open. Complete your profile, then come back here: your balance and the Credit packs will be waiting.',setupButton:'Complete my profile',inactiveTitle:'This account is not active',inactiveBody:'This account has been paused, so your Credit wallet cannot open. Nothing was charged. If you believe this is a mistake, tap the chat icon on any page and we will look into it.',inactiveButton:'Back to Home',sessionTitle:'Please sign in again',sessionBody:'Your session has ended, so your Credit wallet cannot open. Sign in again to see your balance and activity.',sessionButton:'Sign in',},
 es:{verifyTitle:'Verifica Tu Teléfono para Agregar Crédito',verifyBody:'Comprar Crédito requiere un número de teléfono verificado. Verifica el tuyo y volverás aquí enseguida: tu saldo y los paquetes de Crédito estarán esperando.',verifyButton:'Verificar Mi Teléfono',failTitle:'No se pudo cargar tu billetera de Crédito',failBody:'No se realizó ningún cargo. Inténtalo de nuevo.',retryButton:'Intentar de Nuevo',setupTitle:'Termina de configurar tu cuenta',setupBody:'Iniciaste sesión, pero tu perfil de miembro aún no está completo, y tu billetera de Crédito necesita un perfil terminado para abrirse. Completa tu perfil y vuelve aquí: tu saldo y los paquetes de Crédito estarán esperando.',setupButton:'Completar mi perfil',inactiveTitle:'Esta cuenta no está activa',inactiveBody:'Esta cuenta ha sido pausada, por lo que tu billetera de Crédito no puede abrirse. No se realizó ningún cargo. Si crees que es un error, toca el ícono de chat en cualquier página y lo revisaremos.',inactiveButton:'Volver al inicio',sessionTitle:'Inicia sesión de nuevo',sessionBody:'Tu sesión terminó, por lo que tu billetera de Crédito no puede abrirse. Inicia sesión de nuevo para ver tu saldo y tu actividad.',sessionButton:'Iniciar sesión',},
 fr:{verifyTitle:'Vérifiez Votre Téléphone pour Ajouter du Crédit',verifyBody:'L’achat de Crédit exige un numéro de téléphone vérifié. Vérifiez le vôtre et vous reviendrez ici aussitôt : votre solde et les forfaits de Crédit vous y attendront.',verifyButton:'Vérifier Mon Téléphone',failTitle:'Votre portefeuille de Crédit n’a pas pu être chargé',failBody:'Aucun débit n’a été effectué. Réessayez.',retryButton:'Réessayer',setupTitle:'Terminez la configuration de votre compte',setupBody:'Vous êtes connecté, mais votre profil de membre n’est pas encore terminé — et votre portefeuille de Crédit a besoin d’un profil complet pour s’ouvrir. Complétez votre profil, puis revenez ici : votre solde et les forfaits de Crédit vous attendront.',setupButton:'Compléter mon profil',inactiveTitle:'Ce compte n’est pas actif',inactiveBody:'Ce compte a été mis en pause, donc votre portefeuille de Crédit ne peut pas s’ouvrir. Aucun débit n’a été effectué. Si vous pensez qu’il s’agit d’une erreur, touchez l’icône de discussion sur n’importe quelle page et nous examinerons la situation.',inactiveButton:'Retour à l’accueil',sessionTitle:'Veuillez vous reconnecter',sessionBody:'Votre session a pris fin, donc votre portefeuille de Crédit ne peut pas s’ouvrir. Reconnectez-vous pour voir votre solde et votre activité.',sessionButton:'Se connecter',},
 it:{verifyTitle:'Verifica il Tuo Telefono per Aggiungere Credito',verifyBody:'Per acquistare Credito serve un numero di telefono verificato. Verifica il tuo e tornerai subito qui: il tuo saldo e i pacchetti di Credito ti aspetteranno.',verifyButton:'Verifica il Mio Telefono',failTitle:'Impossibile caricare il tuo portafoglio di Credito',failBody:'Non è stato addebitato nulla. Riprova.',retryButton:'Riprova',setupTitle:'Completa la configurazione del tuo account',setupBody:'Hai effettuato l’accesso, ma il tuo profilo membro non è ancora completo — e il tuo portafoglio di Credito ha bisogno di un profilo completato per aprirsi. Completa il tuo profilo e torna qui: il tuo saldo e i pacchetti di Credito ti aspetteranno.',setupButton:'Completa il mio profilo',inactiveTitle:'Questo account non è attivo',inactiveBody:'Questo account è stato messo in pausa, quindi il tuo portafoglio di Credito non può aprirsi. Non è stato addebitato nulla. Se ritieni che sia un errore, tocca l’icona della chat su qualsiasi pagina e controlleremo.',inactiveButton:'Torna alla Home',sessionTitle:'Accedi di nuovo',sessionBody:'La tua sessione è terminata, quindi il tuo portafoglio di Credito non può aprirsi. Accedi di nuovo per vedere il tuo saldo e la tua attività.',sessionButton:'Accedi',},
 de:{verifyTitle:'Telefon Bestätigen, um Credit Hinzuzufügen',verifyBody:'Für den Kauf von Credit ist eine bestätigte Telefonnummer erforderlich. Bestätigen Sie Ihre Nummer und Sie gelangen sofort hierher zurück — Ihr Guthaben und die Credit-Pakete warten auf Sie.',verifyButton:'Mein Telefon Bestätigen',failTitle:'Ihr Credit-Guthaben konnte nicht geladen werden',failBody:'Es wurde nichts berechnet. Bitte versuchen Sie es erneut.',retryButton:'Erneut Versuchen',setupTitle:'Schließen Sie die Einrichtung Ihres Kontos ab',setupBody:'Sie sind angemeldet, aber Ihr Mitgliederprofil ist noch nicht vollständig — und Ihre Credit-Wallet braucht ein fertiges Profil, um sich zu öffnen. Vervollständigen Sie Ihr Profil und kommen Sie hierher zurück: Ihr Guthaben und die Credit-Pakete warten auf Sie.',setupButton:'Mein Profil vervollständigen',inactiveTitle:'Dieses Konto ist nicht aktiv',inactiveBody:'Dieses Konto wurde pausiert, daher kann sich Ihre Credit-Wallet nicht öffnen. Es wurde nichts berechnet. Wenn Sie glauben, dass dies ein Fehler ist, tippen Sie auf einer beliebigen Seite auf das Chat-Symbol und wir prüfen es.',inactiveButton:'Zurück zur Startseite',sessionTitle:'Bitte melden Sie sich erneut an',sessionBody:'Ihre Sitzung ist beendet, daher kann sich Ihre Credit-Wallet nicht öffnen. Melden Sie sich erneut an, um Ihr Guthaben und Ihre Aktivität zu sehen.',sessionButton:'Anmelden',}
};

function money(cents){return '$'+(Number(cents||0)/100).toFixed(2);}
function signedMoney(cents){const v=Number(cents||0);return (v<0?'-':'+')+money(Math.abs(v));}
function gameCreditExpiryText(at){
 if(!at)return '';
 const ms=Math.max(0,new Date(at).getTime()-Date.now()),d=Math.floor(ms/86400000),h=Math.floor((ms%86400000)/3600000);
 return `Game Credits expire in ${d} days, ${h} hours.`;
}
function micros(value){return '$'+(Number(value||0)/1000000).toFixed(6);}
function txLabel(tx){
 const map={purchase:'Credit purchase',reserve:'Paid with Credit',release:'Credit returned',refund:'Refund',grant:'Credit grant',founding_bonus:'Founding Member bonus',migration_credit:'Membership conversion credit',auto_replenish:'Auto-Replenish',admin_adjustment:'Admin adjustment'};
 return map[tx.transaction_type]||tx.transaction_type;
}

function gcTxLabel(row){
 const map={signup_bonus:'Verification bonus',admin_grant:'Bonus gift',promo_grant:'Promotion bonus',spend:'Game play',expire:'Expired unused balance'};
 const base=map[row.kind]||row.kind;
 return row.game?`${base} · ${row.game}`:base;
}

export default function Credit(){
 const {currentLanguage}=useLanguage();
 const {user,isAuthenticated}=useAuth();
 const [params,setParams]=useSearchParams();
 const t=COPY[currentLanguage]||COPY.en;
 const customText=CUSTOM_COPY[currentLanguage]||CUSTOM_COPY.en;
 const [state,setState]=useState(null);
 const [loadError,setLoadError]=useState(null);
 const gateText=GATE_COPY[currentLanguage]||GATE_COPY.en;
 const verifyPhoneUrl=`/VerifyPhone?redirect=${encodeURIComponent('/Credit')}`;
 const goVerifyPhone=()=>{window.location.assign(verifyPhoneUrl);};
 const handleGateError=(e,fallback)=>{if(isPhoneVerificationError(e)){goVerifyPhone();return;}toast.error(e?.message||fallback);};
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState('');
 const [trigger,setTrigger]=useState('5');
 const [cap,setCap]=useState('50');
 const [autoConsent,setAutoConsent]=useState(false);
 const [autoPackage,setAutoPackage]=useState('credit_10');
 const [autoEnabled,setAutoEnabled]=useState(false);
 const [customAmount,setCustomAmount]=useState('');
 const [feature,setFeature]=useState('bianca_response');
 const [calPackage,setCalPackage]=useState('starter');
 const [notes,setNotes]=useState('');
 const [lastSummary,setLastSummary]=useState(null);
 const isAdmin=String(user?.role||'').toLowerCase()==='admin';
 const requestedReturn=params.get('return')||'';
 const returnTo=requestedReturn.startsWith('/')&&!requestedReturn.startsWith('//')?requestedReturn:createPageUrl('Home');
 const onboarding=params.get('onboarding')==='1';

 const refresh=async()=>{
  if(!isAuthenticated){setLoading(false);return;}
  try{
   const data=await getTokenWallet();setState(data);setLoadError(null);
   setTrigger(String(Number(data?.settings?.trigger_balance??500)/100));
   setCap(data?.settings?.monthly_cap_cents==null?'':String(Number(data.settings.monthly_cap_cents)/100));
   setAutoPackage(data?.settings?.package_code||'credit_10');
   setAutoEnabled(Boolean(data?.settings?.enabled));
   setAutoConsent(Boolean(data?.settings?.consent_at));
  }catch(e){setLoadError(e);if(state)toast.error(e?.message||'Unable to load Credit wallet.');}
  finally{setLoading(false);}
 };

 useEffect(()=>{refresh();},[isAuthenticated,user?.id]);
 useEffect(()=>{
  if(!isAuthenticated)return;
  const checkout=params.get('checkout'),sid=params.get('session_id'),pm=params.get('payment_method');
  if(checkout==='success'&&sid){
   setBusy('confirm');
   confirmTokenCheckout(sid).then(()=>{toast.success('Credit added to your wallet.');setParams({...(onboarding?{onboarding:'1'}:{}),return:returnTo});return refresh();}).catch(e=>toast.error(e?.message||'Unable to confirm Credit purchase.')).finally(()=>setBusy(''));
  } else if(pm==='success'&&sid){
   setBusy('setup');
   confirmPaymentMethodSetup(sid).then(()=>{toast.success('Payment method saved for optional Auto-Replenish.');setParams({});return refresh();}).catch(e=>toast.error(e?.message||'Unable to confirm payment method.')).finally(()=>setBusy(''));
  } else if(checkout==='cancelled'||pm==='cancelled'){setParams({...(onboarding?{onboarding:'1'}:{}),return:returnTo});}
 },[isAuthenticated]);

 const packages=state?.packages||[];
 const purchasePackages=packages.filter(pkg=>!pkg.calibration_only&&['credit_5','credit_10','credit_15','credit_20'].includes(pkg.code));
 const prices=state?.featurePrices||[];
 const active=state?.activeCalibration||null;
 const selectedAutoPackage=useMemo(()=>purchasePackages.find(pkg=>pkg.code===autoPackage)||null,[purchasePackages,autoPackage]);
 const maxAutoTrigger=Number(selectedAutoPackage?.tokens||0)/100;
 const selectedCalibrationPackage=useMemo(()=>packages.find(pkg=>pkg.code===calPackage)||packages[0]||null,[packages,calPackage]);
 useEffect(()=>{if(packages.length&&!packages.some(pkg=>pkg.code===calPackage))setCalPackage(packages[0].code);},[packages,calPackage]);

 const buy=async(code)=>{
  setBusy(code);
  try{const data=await startTokenCheckout(code,returnTo);if(data?.checkout?.url)window.location.assign(data.checkout.url);}
  catch(e){handleGateError(e,'Unable to open checkout.');setBusy('');}
 };
 const buyCustom=async()=>{
  const dollars=Number(customAmount);
  const cents=Math.round(dollars*100);
  if(!Number.isFinite(dollars)||cents<100||cents>100000){toast.error(customText.invalid);return;}
  setBusy('custom_credit');
  try{const data=await startTokenCheckout('custom_credit',returnTo,cents);if(data?.checkout?.url)window.location.assign(data.checkout.url);}
  catch(e){handleGateError(e,'Unable to open checkout.');setBusy('');}
 };
 const setupCard=async()=>{
  setBusy('card');
  try{const data=await startPaymentMethodSetup();if(data?.checkout?.url)window.location.assign(data.checkout.url);}
  catch(e){handleGateError(e,'Unable to set up card.');setBusy('');}
 };
 const saveAuto=async()=>{
  if(autoEnabled&&!autoConsent&&!state?.settings?.consent_at){toast.error(t.consentRequired);return;}
  setBusy('auto');
  try{
   await updateAutoReplenish({
    enabled:autoEnabled,
    packageCode:autoPackage,
    triggerBalance:Math.round(Number(trigger||0)*100),
    monthlyCapCents:cap===''?null:Math.round(Number(cap||0)*100),
    consentGiven:autoConsent,
   });
   toast.success(t.saved);await refresh();
  }
  catch(e){handleGateError(e,'Unable to save Auto-Replenish.');}
  finally{setBusy('');}
 };
 const startCalibration=async()=>{
  setBusy('cal');
  try{await startCostCalibration({featureCode:feature,packageCode:selectedCalibrationPackage?.code||null,notes});toast.success(t.calStarted);setNotes('');await refresh();}
  catch(e){toast.error(e?.message||'Unable to start cost test.');}
  finally{setBusy('');}
 };
 const endCalibration=async()=>{
  if(!active?.id)return;
  setBusy('cal');
  try{const data=await endCostCalibration(active.id);setLastSummary(data?.summary||null);toast.success(t.calEnded);await refresh();}
  catch(e){toast.error(e?.message||'Unable to end cost test.');}
  finally{setBusy('');}
 };

 if(!isAuthenticated)return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4 py-12"><div className="mx-auto max-w-xl rounded-[28px] border bg-white p-8 text-center shadow-xl"><Coins className="mx-auto h-12 w-12 text-violet-600"/><h1 className="mt-4 text-3xl font-black">{t.title}</h1><p className="mt-3 text-slate-600">{t.signed}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to={`/SignUp?source=buy-credit&feature=credit&return=${encodeURIComponent(returnTo)}`} className="inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">Create FREE Account</Link><Link to={`/SignIn?source=buy-credit&redirect=${encodeURIComponent(returnTo)}`} className="inline-flex rounded-2xl border-2 border-slate-300 bg-white px-6 py-3 font-black text-slate-800">Sign In</Link></div></div></main>;
 if(loading)return <div className="min-h-[60vh] grid place-items-center font-bold text-slate-500">{t.loading}</div>;
 if(!state){
  // The wallet did not load. Never dress up empty defaults as a real wallet
  // (a $0.00 "balance", missing packs and a dead checkout button) — and never
  // show the generic failure card for a state that has its own plain
  // message. Every refusal the API names maps to the screen that tells the
  // member the truth about THEIR account:
  //   phone not verified  -> the verification door
  //   profile not ready   -> finish setting up your account
  //   account not active  -> say so, with the support path
  //   session ended       -> sign in again
  //   anything else       -> a genuine failure: the retry card
  const gateShell=(inner)=><main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4 py-12"><div className="mx-auto max-w-xl rounded-[28px] border bg-white p-8 text-center shadow-xl">{inner}</div></main>;
  if(isPhoneVerificationError(loadError))return gateShell(<><Phone className="mx-auto h-12 w-12 text-violet-600"/><h1 className="mt-4 text-3xl font-black">{gateText.verifyTitle}</h1><p className="mt-3 text-slate-600">{gateText.verifyBody}</p><button onClick={goVerifyPhone} className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">{gateText.verifyButton}</button></>);
  const gateCode=loadError?.payload?.error?.code||loadError?.code||'';
  const gateStatus=Number(loadError?.status||0);
  const gateMessage=String(loadError?.message||'');
  if(gateStatus===409||gateCode==='profile_not_ready'||/profile is not ready/i.test(gateMessage))return gateShell(<><UserCheck className="mx-auto h-12 w-12 text-violet-600"/><h1 className="mt-4 text-3xl font-black">{gateText.setupTitle}</h1><p className="mt-3 text-slate-600">{gateText.setupBody}</p><Link to={createPageUrl('Profile')} className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">{gateText.setupButton}</Link></>);
  if(gateCode==='account_inactive'||/account is not active/i.test(gateMessage))return gateShell(<><ShieldCheck className="mx-auto h-12 w-12 text-violet-600"/><h1 className="mt-4 text-3xl font-black">{gateText.inactiveTitle}</h1><p className="mt-3 text-slate-600">{gateText.inactiveBody}</p><Link to={createPageUrl('Home')} className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">{gateText.inactiveButton}</Link></>);
  if(gateStatus===401||gateCode==='unauthorized')return gateShell(<><RefreshCw className="mx-auto h-12 w-12 text-violet-600"/><h1 className="mt-4 text-3xl font-black">{gateText.sessionTitle}</h1><p className="mt-3 text-slate-600">{gateText.sessionBody}</p><Link to={`/SignIn?source=buy-credit&redirect=${encodeURIComponent(returnTo)}`} className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">{gateText.sessionButton}</Link></>);
  return gateShell(<><Coins className="mx-auto h-12 w-12 text-violet-600"/><h1 className="mt-4 text-3xl font-black">{gateText.failTitle}</h1><p className="mt-3 text-slate-600">{gateText.failBody}</p><button onClick={()=>{setLoading(true);refresh();}} className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">{gateText.retryButton}</button></>);
 }

 return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4 py-8">
  <div className="mx-auto max-w-6xl">
   <Link to={createPageUrl('Home')} className="mb-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white"><ArrowLeft className="h-4 w-4"/>{t.back}</Link>
   <div className="rounded-[30px] bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 p-7 text-white shadow-2xl sm:p-10">
    <div className="flex flex-wrap items-center justify-between gap-6">
     <div><div className="text-xs font-black uppercase tracking-[.2em] text-fuchsia-200">One2OneLove</div><h1 className="mt-2 text-4xl font-black sm:text-5xl">{t.title}</h1><p className="mt-3 max-w-2xl text-white/70">{t.sub}</p><div className="mt-4 inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-200">{t.badge}</div></div>
     <div className="min-w-[230px] rounded-3xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur"><div className="text-xs font-black uppercase tracking-wider text-white/60">{t.balance}</div><div className="mt-1 text-5xl font-black">{money(state?.wallet?.balance)}</div><div className="mt-1 text-sm font-bold text-fuchsia-200">$ CREDIT</div><div className="mx-auto my-4 h-px w-full bg-white/15"/><div className="text-3xl font-black text-emerald-300">{money(state?.gameCredit?.balanceCents)}</div><div className="mt-1 text-sm font-bold text-emerald-200">O2OL BONUS GAME CREDITS</div>{state?.gameCredit?.nextExpiryAt&&<div className="mt-2 text-xs font-semibold text-white/60">{gameCreditExpiryText(state.gameCredit.nextExpiryAt)} · {money(state?.gameCredit?.nextExpiryCents)} expires next</div>}</div>
    </div>
   </div>
   <p className="mt-5 max-w-3xl text-sm font-semibold text-slate-600">O2OL Bonus Game Credits are applied before paid Credit when you play a One2OneLove game. They cannot be purchased, transferred, withdrawn, or used for non-game features.</p>

   <section className="mt-7">
    <h2 className="text-2xl font-black text-slate-950">{t.packages}</h2>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
     {purchasePackages.map(pkg=><div key={pkg.code} className={'flex min-h-[210px] flex-col rounded-[22px] border bg-white p-4 shadow-sm '+(pkg.code==='credit_10'?'border-violet-300 ring-2 ring-violet-100':'border-slate-200')}>
      <div className="text-xs font-black uppercase tracking-wide text-violet-600">{pkg.label}</div>
      <div className="mt-2 text-3xl font-black">{money(pkg.tokens)}</div>
      <div className="text-sm font-bold text-slate-500">Credit</div>
      <button onClick={()=>buy(pkg.code)} disabled={!!busy} className="mt-auto w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy===pkg.code?t.checkout:t.buy}</button>
     </div>)}
     <div className="flex min-h-[210px] flex-col rounded-[22px] border border-fuchsia-300 bg-white p-4 shadow-sm ring-2 ring-fuchsia-50">
      <div className="text-xs font-black uppercase tracking-wide text-fuchsia-700">{customText.title}</div>
      <label className="mt-3 text-xs font-bold text-slate-600">{customText.amount}
       <input type="number" min="1" max="1000" step="0.01" inputMode="decimal" value={customAmount} onChange={e=>setCustomAmount(e.target.value)} placeholder="25.00" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-lg font-black text-slate-900"/>
      </label>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">{customText.hint}</p>
      <button onClick={buyCustom} disabled={!!busy} className="mt-auto w-full rounded-xl bg-fuchsia-700 px-3 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy==='custom_credit'?t.checkout:customText.button}</button>
     </div>
    </div>
    <p className="mt-3 text-xs text-slate-500">{t.creditNote}</p>
   </section>

   <section className="mt-7 grid gap-5 lg:grid-cols-2">
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
     <div className="flex items-start gap-3"><RefreshCw className="mt-1 h-6 w-6 text-violet-600"/><div><h2 className="text-xl font-black">{t.auto}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{t.autoBody}</p></div></div>
     <label className="mt-5 flex items-center gap-3 font-bold"><input type="checkbox" checked={autoEnabled} onChange={e=>setAutoEnabled(e.target.checked)} className="h-5 w-5"/>{t.enable}</label>
     <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-bold">{t.threshold}<input type="number" min="0" step="0.01" max={maxAutoTrigger||undefined} value={trigger} onChange={e=>setTrigger(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2"/></label>
      <label className="text-sm font-bold">{t.packages}<select value={autoPackage} onChange={e=>setAutoPackage(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2">{purchasePackages.map(p=><option key={p.code} value={p.code}>{p.label} — {p.calibration_only?p.tokens+' units':money(p.tokens)}</option>)}</select></label>
      <label className="text-sm font-bold sm:col-span-2">{t.cap}<input type="number" min="0" step="1" value={cap} onChange={e=>setCap(e.target.value)} placeholder="50" className="mt-2 w-full rounded-xl border px-3 py-2"/></label>
     </div>
     {autoEnabled&&<label className="mt-4 flex items-start gap-3 rounded-xl bg-violet-50 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={autoConsent} onChange={e=>setAutoConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0"/>{t.consent}</label>}
     <div className="mt-4 flex flex-wrap gap-3"><button onClick={setupCard} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-black"><CreditCard className="h-4 w-4"/>{t.addCard}</button><button onClick={saveAuto} disabled={!!busy} className="rounded-xl bg-violet-600 px-4 py-2 font-black text-white">Save</button></div>
     <div className="mt-3 space-y-1 text-xs text-slate-500">
      <div>{state?.settings?.payment_method_saved?<span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4"/>Payment method stored securely by Stripe</span>:'No saved payment method for Auto-Replenish.'}</div>
      <div>{t.receiptNote}</div>
      <div>{t.offNote}</div>
     </div>
    </div>

    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{t.history}</h2><div className="mt-4 max-h-80 space-y-3 overflow-y-auto">{(state?.transactions||[]).length===0?<p className="text-sm text-slate-500">{t.noHistory}</p>:(state.transactions||[]).map(tx=><div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><div><div className="text-sm font-bold">{txLabel(tx)}</div><div className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</div></div><div className={'font-black '+(Number(tx.wallet_delta)>=0?'text-emerald-600':'text-rose-600')}>{signedMoney(tx.wallet_delta)}</div></div>)}</div></div>

    <div className="mt-6 rounded-[26px] border border-emerald-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{t.gcHistory}</h2><div className="mt-4 max-h-80 space-y-3 overflow-y-auto">{(state?.gameCredit?.ledger||[]).length===0?<p className="text-sm text-slate-500">{t.noGcHistory}</p>:(state.gameCredit.ledger||[]).map((row,idx)=><div key={idx} className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/60 px-4 py-3"><div><div className="text-sm font-bold">{gcTxLabel(row)}</div>{row.note&&<div className="text-xs font-semibold text-emerald-700">{row.note}</div>}<div className="text-xs text-slate-500">{new Date(row.created_at).toLocaleString()}{row.expires_at&&Number(row.amount_cents)>0?` · expires ${new Date(row.expires_at).toLocaleDateString()}`:''}</div></div><div className={'font-black '+(Number(row.amount_cents)>=0?'text-emerald-600':'text-rose-600')}>{signedMoney(row.amount_cents)}</div></div>)}</div></div>
   </section>

   <section className="mt-7 rounded-[26px] border border-violet-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-black">{t.pricesTitle}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{prices.map(p=><div key={p.feature_code} className="rounded-xl bg-violet-50 px-4 py-3"><div className="font-bold">{p.label}</div><div className="mt-1 text-sm">{p.feature_code==='love_note_send'?<strong>{t.regionalNote}</strong>:<><strong>{money(p.token_cost)}</strong> / {p.pricing_unit}</>}</div></div>)}</div>
   </section>

   {!isAdmin&&<div className="mt-10 border-t border-slate-200 pt-6 text-center"><Link to={returnTo} className="text-xs font-semibold text-slate-400 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-600">Skip for now</Link></div>}

   {isAdmin&&<section className="mt-7 rounded-[28px] border-2 border-dashed border-amber-300 bg-amber-50 p-6">
    <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 text-amber-700"/><div><h2 className="text-xl font-black text-amber-950">{t.cal}</h2><p className="mt-1 text-sm leading-6 text-amber-900/80">{t.calBody}</p></div></div>
    {active?<div className="mt-5 rounded-2xl bg-white p-5"><div className="text-xs font-black uppercase text-emerald-600">TEST RUNNING</div><div className="mt-1 text-lg font-black">{active.feature_code}</div><div className="mt-1 text-sm font-semibold text-amber-800">{t.packageTest}: {active.package_code||'—'}</div><div className="mt-1 text-sm text-slate-500">Started {new Date(active.started_at).toLocaleString()} · Starting balance {active.starting_balance}</div><button onClick={endCalibration} disabled={!!busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-black text-white"><Square className="h-4 w-4"/>{t.end}</button></div>:
     <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"><label className="text-xs font-black uppercase text-amber-900">{t.feature}<select value={feature} onChange={e=>setFeature(e.target.value)} className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-3 normal-case"><option value="all">All metered features</option>{prices.map(p=><option key={p.feature_code} value={p.feature_code}>{p.label}</option>)}</select></label><label className="text-xs font-black uppercase text-amber-900">{t.packageTest}<select value={calPackage} onChange={e=>setCalPackage(e.target.value)} className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-3 normal-case">{packages.map(p=><option key={p.code} value={p.code}>{p.label} — {p.calibration_only?p.tokens+' units':money(p.tokens)} — {money(p.amount_cents)}</option>)}</select></label><label className="text-xs font-black uppercase text-amber-900">{t.notes}<input value={notes} onChange={e=>setNotes(e.target.value)} placeholder={t.notes} className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-3 normal-case"/></label><button onClick={startCalibration} disabled={!!busy||!selectedCalibrationPackage} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-black text-white disabled:opacity-50"><Play className="h-4 w-4"/>{t.start}</button></div>}
    {lastSummary&&<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{[[t.providerCost,micros(lastSummary.provider_cost_micros)],[t.charsIn,lastSummary.input_characters],[t.contextChars,lastSummary.context_characters],[t.charsOut,lastSummary.output_characters],[t.providerIn,lastSummary.provider_input_units],[t.providerCached,lastSummary.provider_cached_input_units],[t.providerOut,lastSummary.provider_output_units],[t.o2olTokens,lastSummary.customer_tokens_charged],[t.costPerToken,Number(lastSummary.customer_tokens_charged||0)>0?micros(Number(lastSummary.provider_cost_micros||0)/Number(lastSummary.customer_tokens_charged||1)):'—']].map(([k,v])=><div key={k} className="rounded-xl bg-white p-4"><div className="text-xs font-black uppercase text-slate-500">{k}</div><div className="mt-1 text-xl font-black">{v}</div></div>)}</div>}
   </section>}
  </div>
 </main>;
}
