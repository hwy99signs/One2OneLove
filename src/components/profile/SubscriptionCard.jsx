import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {ArrowRight,Coins,CreditCard,RefreshCw,ShieldCheck} from 'lucide-react';
import {motion} from 'framer-motion';
import {getTokenWallet} from '@/lib/tokenService';

const COPY={
  en:{title:'O2OL Token Wallet',free:'FREE verified account',balance:'Token Balance',buy:'Buy / Manage Tokens',auto:'Auto-Replenish',on:'On',off:'Off',purchased:'Purchased',used:'Used',granted:'Granted',founder:'Founding Member',founderPending:'Founder token benefit pending calibration',legacy:'Legacy Billing History',legacyBody:'Historical Premiere/Exclusive billing is retained only for reconciliation. It does not control current feature access.',loading:'Loading wallet…'},
  es:{title:'Billetera de Tokens O2OL',free:'Cuenta verificada GRATIS',balance:'Saldo de Tokens',buy:'Comprar / Gestionar Tokens',auto:'Recarga Automática',on:'Activa',off:'Inactiva',purchased:'Comprados',used:'Usados',granted:'Otorgados',founder:'Miembro Fundador',founderPending:'Beneficio de Tokens Fundador pendiente de calibración',legacy:'Historial de Facturación Anterior',legacyBody:'La facturación histórica Premiere/Exclusive se conserva solo para conciliación. No controla el acceso actual.',loading:'Cargando billetera…'},
  fr:{title:'Portefeuille de Jetons O2OL',free:'Compte vérifié GRATUIT',balance:'Solde de Jetons',buy:'Acheter / Gérer les Jetons',auto:'Recharge Automatique',on:'Activée',off:'Désactivée',purchased:'Achetés',used:'Utilisés',granted:'Accordés',founder:'Membre Fondateur',founderPending:'Avantage de Jetons Fondateur en attente de calibration',legacy:'Historique de Facturation',legacyBody:'Les anciens paiements Premiere/Exclusive sont conservés uniquement pour rapprochement. Ils ne contrôlent pas l’accès actuel.',loading:'Chargement du portefeuille…'},
  it:{title:'Portafoglio Token O2OL',free:'Account verificato GRATUITO',balance:'Saldo Token',buy:'Acquista / Gestisci Token',auto:'Ricarica Automatica',on:'Attiva',off:'Disattiva',purchased:'Acquistati',used:'Usati',granted:'Assegnati',founder:'Membro Fondatore',founderPending:'Vantaggio Token Fondatore in attesa di calibrazione',legacy:'Storico Fatturazione Precedente',legacyBody:'La fatturazione storica Premiere/Exclusive è conservata solo per riconciliazione. Non controlla l’accesso attuale.',loading:'Caricamento portafoglio…'},
  de:{title:'O2OL Token-Wallet',free:'KOSTENLOSES verifiziertes Konto',balance:'Token-Guthaben',buy:'Tokens Kaufen / Verwalten',auto:'Automatische Aufladung',on:'An',off:'Aus',purchased:'Gekauft',used:'Verwendet',granted:'Gewährt',founder:'Gründungsmitglied',founderPending:'Gründungs-Token-Vorteil wartet auf Kalibrierung',legacy:'Frühere Abrechnung',legacyBody:'Frühere Premiere/Exclusive-Abrechnung bleibt nur für den Abgleich erhalten. Sie steuert den aktuellen Funktionszugang nicht.',loading:'Wallet wird geladen…'}
};

export default function SubscriptionCard({user,currentLanguage='en'}){
  const t=COPY[currentLanguage]||COPY.en;
  const [wallet,setWallet]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    getTokenWallet().then(data=>{if(active)setWallet(data);}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false};
  },[user?.id]);

  const w=wallet?.wallet||{};
  const auto=wallet?.settings||{};
  const founderNumber=user?.founding_number||user?.foundingNumber||null;
  const founderBadge=user?.founding_badge_retained===true||user?.badge_retained===true||Boolean(founderNumber);
  const legacyPlan=String(user?.subscription_plan||'');
  const hasLegacy=Boolean(user?.stripe_subscription_id)||['Premiere','Exclusive','Premier'].includes(legacyPlan);

  return <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
    <Card className="h-full border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-amber-50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg"><Coins className="h-6 w-6"/></div><div><p className="text-sm font-semibold text-violet-700">{t.free}</p><h3 className="text-2xl font-black text-slate-950">{t.title}</h3></div></div>
          <div className="text-right"><div className="text-3xl font-black text-slate-950">{loading?'—':Number(w.balance||0)}</div><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Tokens</div></div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading?<div className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin"/>{t.loading}</div>:<>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white p-3 text-center shadow-sm"><div className="text-xs font-bold text-slate-500">{t.purchased}</div><div className="mt-1 text-lg font-black">{Number(w.lifetime_purchased||0)}</div></div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm"><div className="text-xs font-bold text-slate-500">{t.used}</div><div className="mt-1 text-lg font-black">{Number(w.lifetime_used||0)}</div></div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm"><div className="text-xs font-bold text-slate-500">{t.granted}</div><div className="mt-1 text-lg font-black">{Number(w.lifetime_granted||0)}</div></div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><CreditCard className="h-4 w-4"/>{t.auto}</span><span className={`rounded-full px-2.5 py-1 text-xs font-black ${auto.enabled?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{auto.enabled?t.on:t.off}</span></div>
        </>}
        {founderBadge&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 font-black text-amber-900"><ShieldCheck className="h-5 w-5"/>{t.founder}{founderNumber?` #${founderNumber}`:''}</div><p className="mt-1 text-xs leading-5 text-amber-800">{t.founderPending}</p></div>}
        {hasLegacy&&<div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-black text-slate-800">{t.legacy}{legacyPlan&&legacyPlan!=='Free'?` · ${legacyPlan}`:''}</div><p className="mt-1 text-xs leading-5 text-slate-500">{t.legacyBody}</p></div>}
        <Link to="/Tokens"><Button className="w-full bg-slate-950 text-white hover:bg-slate-800">{t.buy}<ArrowRight className="ml-2 h-4 w-4"/></Button></Link>
      </CardContent>
    </Card>
  </motion.div>;
}
