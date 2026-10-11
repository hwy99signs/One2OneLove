import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, WalletCards } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTokenWallet } from '@/lib/tokenService';

// Chrome strings reuse the Credit page's existing translations where they
// exist (balance / history / noHistory / loading in src/pages/Credit.jsx and
// the Open Credit Wallet action from the card this replaces). Title and the
// two lifetime labels are new entries in the same pattern.
const COPY={
  en:{title:'Credit & Billing',balance:'Credit Balance',purchased:'Lifetime Purchased',used:'Lifetime Used',history:'Recent Activity',noHistory:'No Credit activity yet.',loading:'Loading wallet…',action:'Open Credit Wallet'},
  es:{title:'Crédito y Facturación',balance:'Saldo de Crédito',purchased:'Total Comprado',used:'Total Usado',history:'Actividad Reciente',noHistory:'Aún no hay actividad de Crédito.',loading:'Cargando…',action:'Abrir Billetera de Crédito'},
  fr:{title:'Crédit et Facturation',balance:'Solde de Crédit',purchased:'Total Acheté',used:'Total Utilisé',history:'Activité Récente',noHistory:'Aucune activité de Crédit.',loading:'Chargement…',action:'Ouvrir le Portefeuille Crédit'},
  it:{title:'Credito e Fatturazione',balance:'Saldo Credito',purchased:'Totale Acquistato',used:'Totale Utilizzato',history:'Attività Recente',noHistory:'Nessuna attività di Credito.',loading:'Caricamento…',action:'Apri Portafoglio Credito'},
  de:{title:'Credit & Abrechnung',balance:'Credit-Guthaben',purchased:'Insgesamt Gekauft',used:'Insgesamt Verwendet',history:'Letzte Aktivität',noHistory:'Noch keine Credit-Aktivität.',loading:'Wird geladen…',action:'Credit-Wallet Öffnen'}
};

function money(cents){return '$'+(Number(cents||0)/100).toFixed(2);}
function signedMoney(cents){const v=Number(cents||0);return (v<0?'-':'+')+money(Math.abs(v));}

// Same label conventions as the admin Credit Activity list (Admin.jsx
// creditActivityLabel): purchases carry their package code, feature charges
// resolve through the wallet payload's own price list (studio_episode_unlock
// -> "Studio episode unlock", scratch_game_session -> "Scratch Game session").
function activityLabel(tx,featureLabels){
  const type=String(tx?.transaction_type||'').toLowerCase();
  const feature=featureLabels[tx?.feature_code]||tx?.feature_code||null;
  if(type==='purchase'||type==='auto_replenish')return tx?.package_code?`Credit purchase · ${tx.package_code}`:'Credit purchase';
  if(type==='reserve')return feature?`Spent · ${feature}`:'Credit spent';
  if(type==='release')return feature?`Released · ${feature}`:'Credit released';
  if(type==='grant')return 'Credit granted';
  if(type==='admin_adjustment')return 'Admin adjustment';
  if(type==='refund')return 'Refund';
  if(type==='founding_bonus')return 'Founding Member bonus';
  if(type==='migration_credit')return 'Membership conversion credit';
  return feature?`${type||'activity'} · ${feature}`:(type||'activity');
}

export default function CreditBillingCard({user,currentLanguage='en'}){
  const t=COPY[currentLanguage]||COPY.en;
  const [walletState,setWalletState]=useState(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    let cancelled=false;
    // Same member wallet endpoint the Credit page uses (GET /api/tokens/wallet).
    // If it cannot load — e.g. the member is not verified yet — the section
    // falls back to honest zeros instead of erroring the profile page.
    getTokenWallet()
      .then(data=>{if(!cancelled){setWalletState(data||null);setLoaded(true);}})
      .catch(()=>{if(!cancelled){setWalletState(null);setLoaded(true);}});
    return ()=>{cancelled=true;};
  },[user?.id]);

  const wallet=walletState?.wallet||null;
  const featureLabels={};
  (walletState?.featurePrices||[]).forEach(price=>{
    if(price?.feature_code)featureLabels[price.feature_code]=price.label||price.feature_code;
  });
  const activity=(walletState?.transactions||[]).slice(0,8);

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
      <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"><WalletCards className="h-6 w-6 text-white"/></div>
              <h3 className="text-2xl font-bold text-gray-900">{t.title}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.balance}</p>
              <div className="text-2xl font-black text-emerald-700">{money(wallet?.balance)}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!loaded?(
            <p className="text-sm text-gray-500">{t.loading}</p>
          ):(
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.purchased}</p>
                  <p className="mt-1 text-lg font-black text-gray-900">{money(wallet?.lifetime_purchased)}</p>
                </div>
                <div className="rounded-xl bg-white/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.used}</p>
                  <p className="mt-1 text-lg font-black text-gray-900">{money(wallet?.lifetime_used)}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-gray-900">{t.history}</p>
                {activity.length===0?(
                  <p className="text-sm text-gray-500">{t.noHistory}</p>
                ):(
                  <div className="space-y-2">
                    {activity.map(tx=>(
                      <div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{activityLabel(tx,featureLabels)}</div>
                          <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</div>
                        </div>
                        <div className={'font-black '+(Number(tx.wallet_delta)>=0?'text-emerald-600':'text-rose-600')}>{signedMoney(tx.wallet_delta)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <Link to="/Credit"><Button variant="outline" className="w-full"><Sparkles className="mr-2 h-4 w-4"/>{t.action}<ArrowRight className="ml-2 h-4 w-4"/></Button></Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
