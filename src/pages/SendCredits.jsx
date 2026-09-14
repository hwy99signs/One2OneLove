import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle2, CreditCard, Heart, Loader2, PlusCircle, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const COPY = {
  en: {
    title: 'Get More Love Note Sends',
    subtitle: 'Top up your extra SMS Love Note sends anytime. These sends stay in your account until you use them.',
    balance: 'Extra sends available',
    choose: 'Choose an amount',
    custom: 'Other amount',
    customHint: 'Enter a whole-dollar amount from $5 to $100.',
    sends: 'extra sends',
    buy: 'Continue to secure checkout',
    processing: 'Opening secure checkout…',
    success: 'Payment confirmed. Your extra sends have been added.',
    canceled: 'Checkout canceled. No charge was made.',
    secure: 'Payment is completed securely on Stripe. Buying extra sends does not change your monthly One2OneLove tier.',
    back: 'Back to Love Notes',
    recent: 'Recent replenishments',
    none: 'No extra-send purchases yet.',
    purchased: 'sends purchased',
    unavailable: 'Your balance could not be loaded right now. The purchase options are still available; sign in again if checkout asks you to.',
  },
  es: {
    title: 'Obtén Más Envíos de Notas de Amor', subtitle: 'Recarga envíos SMS extra cuando quieras. Permanecen en tu cuenta hasta que los uses.', balance: 'Envíos extra disponibles', choose: 'Elige un monto', custom: 'Otro monto', customHint: 'Ingresa un monto entero entre $5 y $100.', sends: 'envíos extra', buy: 'Continuar al pago seguro', processing: 'Abriendo pago seguro…', success: 'Pago confirmado. Tus envíos extra fueron añadidos.', canceled: 'Pago cancelado. No se realizó ningún cargo.', secure: 'El pago se completa de forma segura en Stripe. Comprar envíos extra no cambia tu plan mensual.', back: 'Volver a Notas de Amor', recent: 'Recargas recientes', none: 'Aún no hay compras de envíos extra.', purchased: 'envíos comprados', unavailable: 'No se pudo cargar tu saldo en este momento. Las opciones de compra siguen disponibles; vuelve a iniciar sesión si el pago te lo solicita.'
  },
  fr: {
    title: 'Obtenir Plus d’Envois de Notes d’Amour', subtitle: 'Rechargez des envois SMS supplémentaires à tout moment. Ils restent sur votre compte jusqu’à utilisation.', balance: 'Envois supplémentaires disponibles', choose: 'Choisissez un montant', custom: 'Autre montant', customHint: 'Saisissez un montant entier de 5 $ à 100 $.', sends: 'envois supplémentaires', buy: 'Continuer vers le paiement sécurisé', processing: 'Ouverture du paiement sécurisé…', success: 'Paiement confirmé. Vos envois supplémentaires ont été ajoutés.', canceled: 'Paiement annulé. Aucun débit n’a été effectué.', secure: 'Le paiement est effectué en toute sécurité sur Stripe. L’achat d’envois supplémentaires ne modifie pas votre forfait mensuel.', back: 'Retour aux Notes d’Amour', recent: 'Recharges récentes', none: 'Aucun achat d’envois supplémentaires pour le moment.', purchased: 'envois achetés', unavailable: 'Votre solde ne peut pas être chargé pour le moment. Les options d’achat restent disponibles; reconnectez-vous si le paiement le demande.'
  },
  it: {
    title: 'Ottieni Più Invii di Note d’Amore', subtitle: 'Ricarica invii SMS extra in qualsiasi momento. Restano nel tuo account finché non li usi.', balance: 'Invii extra disponibili', choose: 'Scegli un importo', custom: 'Altro importo', customHint: 'Inserisci un importo intero da $5 a $100.', sends: 'invii extra', buy: 'Continua al pagamento sicuro', processing: 'Apertura pagamento sicuro…', success: 'Pagamento confermato. Gli invii extra sono stati aggiunti.', canceled: 'Pagamento annullato. Non è stato effettuato alcun addebito.', secure: 'Il pagamento viene completato in modo sicuro su Stripe. L’acquisto di invii extra non modifica il tuo piano mensile.', back: 'Torna alle Note d’Amore', recent: 'Ricariche recenti', none: 'Nessun acquisto di invii extra.', purchased: 'invii acquistati', unavailable: 'Il saldo non può essere caricato in questo momento. Le opzioni di acquisto restano disponibili; accedi di nuovo se il checkout lo richiede.'
  },
  de: {
    title: 'Mehr Liebesnachrichten-Sendungen', subtitle: 'Lade zusätzliche SMS-Sendungen jederzeit auf. Sie bleiben in deinem Konto, bis du sie nutzt.', balance: 'Zusätzliche Sendungen verfügbar', choose: 'Betrag auswählen', custom: 'Anderer Betrag', customHint: 'Gib einen vollen Dollarbetrag zwischen $5 und $100 ein.', sends: 'zusätzliche Sendungen', buy: 'Weiter zur sicheren Zahlung', processing: 'Sichere Zahlung wird geöffnet…', success: 'Zahlung bestätigt. Deine zusätzlichen Sendungen wurden hinzugefügt.', canceled: 'Zahlung abgebrochen. Es wurde nichts berechnet.', secure: 'Die Zahlung erfolgt sicher über Stripe. Zusätzliche Sendungen ändern deinen monatlichen Tarif nicht.', back: 'Zurück zu Liebesnachrichten', recent: 'Letzte Aufladungen', none: 'Noch keine Käufe zusätzlicher Sendungen.', purchased: 'Sendungen gekauft', unavailable: 'Dein Guthaben kann gerade nicht geladen werden. Die Kaufoptionen bleiben verfügbar; melde dich erneut an, falls der Checkout dies verlangt.'
  },
};

async function parse(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return payload;
}
async function getBalance() {
  return parse(await fetch('/api/send-credits/balance', { credentials: 'include', headers: { accept: 'application/json' } }));
}
async function startCheckout(amountCents) {
  return parse(await fetch('/api/send-credits/checkout', {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amountCents }),
  }));
}
async function confirmCheckout(sessionId) {
  return parse(await fetch('/api/send-credits/confirm', {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId }),
  }));
}

export default function SendCredits() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [currentLanguage] = useState(() => {
    try { return window.localStorage.getItem('preferredLanguage') || 'en'; } catch (_) { return 'en'; }
  });
  const t = COPY[currentLanguage] || COPY.en;
  const [wallet, setWallet] = useState(null);
  const [selected, setSelected] = useState(500);
  const [other, setOther] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const packages = [
    { amountCents: 500, label: '$5', sends: 10 },
    { amountCents: 1000, label: '$10', sends: 20 },
    { amountCents: 1500, label: '$15', sends: 30 },
  ];

  const chosenAmount = useMemo(() => {
    if (selected !== 'other') return Number(selected);
    const dollars = Number(other);
    return Number.isInteger(dollars) && dollars >= 5 && dollars <= 100 ? dollars * 100 : null;
  }, [selected, other]);
  const chosenSends = chosenAmount ? chosenAmount / 50 : 0;

  const refresh = async () => {
    const data = await getBalance();
    setWallet(data.wallet || null);
    setLoadError(false);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const payment = params.get('payment');
        const sessionId = params.get('session_id');
        if (payment === 'success' && sessionId) {
          const result = await confirmCheckout(sessionId);
          if (active) {
            setWallet(result.wallet || null);
            setLoadError(false);
            toast.success(t.success);
            setParams({}, { replace: true });
          }
        } else {
          if (payment === 'canceled') {
            toast.message(t.canceled);
            setParams({}, { replace: true });
          }
          if (active) await refresh();
        }
      } catch (error) {
        if (active) {
          setLoadError(true);
          toast.error(error.message || 'Unable to load your send balance.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const checkout = async () => {
    if (!chosenAmount) {
      toast.error(t.customHint);
      return;
    }
    setWorking(true);
    try {
      const result = await startCheckout(chosenAmount);
      if (!result?.url) throw new Error('Stripe checkout could not be opened.');
      window.location.assign(result.url);
    } catch (error) {
      if (error.status === 401) {
        toast.error('Please sign in again before purchasing extra sends.');
      } else {
        toast.error(error.message || 'Unable to open checkout.');
      }
      setWorking(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-pink-50 via-white to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate('/LoveNotes')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-pink-700 hover:text-pink-800">
          <ArrowLeft size={17}/>{t.back}
        </button>

        <div className="rounded-3xl border border-pink-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600"><Heart size={25}/></div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h1>
              <p className="mt-2 text-slate-600">{t.subtitle}</p>
            </div>
            <div className="min-w-52 rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-semibold text-purple-700">{t.balance}</p>
              <p className="mt-1 text-4xl font-black text-purple-900">{loading ? '—' : Number(wallet?.availableSends || 0).toLocaleString()}</p>
            </div>
          </div>

          {loadError && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <AlertCircle className="mt-0.5 shrink-0" size={18}/><span>{t.unavailable}</span>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">{t.choose}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map(item => (
                <button key={item.amountCents} type="button" onClick={() => setSelected(item.amountCents)} className={`rounded-2xl border-2 p-5 text-left transition ${selected===item.amountCents?'border-pink-500 bg-pink-50 shadow-sm':'border-slate-200 bg-white hover:border-pink-300'}`}>
                  <div className="text-2xl font-black text-slate-900">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-pink-600">+ {item.sends} {t.sends}</div>
                </button>
              ))}
              <button type="button" onClick={() => setSelected('other')} className={`rounded-2xl border-2 p-5 text-left transition ${selected==='other'?'border-pink-500 bg-pink-50 shadow-sm':'border-slate-200 bg-white hover:border-pink-300'}`}>
                <div className="text-2xl font-black text-slate-900">{t.custom}</div>
                <div className="mt-1 text-sm font-semibold text-pink-600">$5–$100</div>
              </button>
            </div>

            {selected === 'other' && (
              <div className="mt-4 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="text-sm font-semibold text-slate-700">{t.custom}</label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-500">$</span>
                  <input type="number" min="5" max="100" step="1" value={other} onChange={e=>setOther(e.target.value)} placeholder="20" className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"/>
                </div>
                <p className="mt-2 text-xs text-slate-500">{t.customHint}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-emerald-900"><CheckCircle2 size={18}/>{chosenAmount ? `$${(chosenAmount/100).toFixed(0)} = ${chosenSends} ${t.sends}` : t.customHint}</div>
                <p className="mt-1 text-xs text-emerald-800">2 sends per $1 · credits do not expire while your account remains active.</p>
              </div>
              <button onClick={checkout} disabled={!chosenAmount || working} className="inline-flex min-w-64 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-bold text-white shadow-sm transition hover:from-pink-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">
                {working ? <Loader2 size={18} className="animate-spin"/> : <CreditCard size={18}/>} {working ? t.processing : t.buy}
              </button>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <ShieldCheck className="mt-0.5 shrink-0 text-slate-500" size={19}/><span>{t.secure}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2"><PlusCircle className="text-pink-500" size={20}/><h2 className="font-bold text-slate-900">{t.recent}</h2></div>
          <div className="mt-4 space-y-2">
            {(wallet?.purchases || []).length ? wallet.purchases.map((item,index) => (
              <div key={`${item.created_at}-${index}`} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div><div className="font-semibold text-slate-800">+{item.sends_purchased} {t.purchased}</div><div className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</div></div>
                <div className="font-bold text-slate-900">${(Number(item.amount_cents||0)/100).toFixed(2)}</div>
              </div>
            )) : <p className="text-sm text-slate-500">{t.none}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
