import React,{useEffect,useState} from 'react';
import { toast } from 'sonner';
import { getGameEconomyAdmin } from '@/lib/adminService';

const money=c=>'$'+(Number(c||0)/100).toFixed(2);

export default function GameEconomyPanel(){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true);
  const load=async()=>{try{setLoading(true);setData(await getGameEconomyAdmin());}catch(e){toast.error(e?.message||'Unable to load game records.');}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  if(loading&&!data)return <div className="rounded-2xl border bg-white p-6 font-semibold text-slate-500">Loading Game Credit operations…</div>;
  const totals=data?.totals||{};
  return <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-950">Games & Historical Credit Accounting</h2>
      <p className="mt-1 text-sm text-slate-500">Games remain free forever. Historical Game Credit balances are not needed to play.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[['Issued',totals.issued],['Used',totals.used],['Expired',totals.expired],['Remaining',totals.remaining]].map(([label,value])=>
        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</div><div className="mt-2 text-3xl font-black text-slate-950">{money(value)}</div></div>)}
    </div>
    {data?.foundingGiveaway&&<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black">Founding Member Giveaway</h3>
      <p className="mt-1 text-xs font-semibold text-slate-500">Cohort claims for the first-100 / second-100 giveaway. Monthly founding Game Credit grants made so far: {(data.foundingGiveaway.monthlyGrants?.count||0)} ({money(data.foundingGiveaway.monthlyGrants?.cents||0)}).</p>
      <div className="mt-4 space-y-4">{(data.foundingGiveaway.tiers||[]).map(tier=>
        <div key={tier.tier} className="rounded-xl bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-black">{tier.tier==='first100'?'First 100':'Second 100'} <span className="ml-2 rounded-full bg-violet-200 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-violet-800">Claimed {tier.claimed}/{tier.cohortSize}</span></div>
            <div className="text-xs font-semibold text-slate-500">{(tier.qualifying||0)} qualifying accounts in this cohort range</div>
          </div>
          {tier.claimants?.length>0
            ? <div className="mt-3 space-y-1.5">{tier.claimants.map(c=>
                <div key={c.cohortNumber} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700">#{c.cohortNumber} {c.username?'@'+c.username:'—'} · {c.email||''}</span>
                  <span className="font-semibold text-slate-500">{c.status==='claimed'?('Claimed '+(c.claimedAt?new Date(c.claimedAt).toLocaleDateString('en-US'):'')+' · Love Note sends '+c.freeSendsUsed+'/'+c.freeSendsTotal):'Not claimed'}</span>
                </div>)}
              </div>
            : <div className="mt-2 text-xs font-semibold text-slate-400">No cohort members yet.</div>}
        </div>)}
      </div>
    </div>}
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-900">Games — FREE FOREVER</h3>
      <p className="mt-2 text-sm text-slate-600">Game pricing promotions are retired. All current and future One2OneLove games stay free for members without Credit charges. Historical Game Credit balances are informational only.</p>
    </div>
    {(data?.registry||[]).length>0&&<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black">Game Registry</h3>
      <div className="mt-3 space-y-2">{(data?.registry||[]).map(g=>
        <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-2 text-sm"><span className="font-black">{g.title}</span><span className="font-semibold text-slate-500">{g.category+' · '+g.route+' · '+(g.leaderboard?('Leaderboard: Top 5 ('+g.scoreLabel+')'):'No leaderboard')}</span></div>)}
      </div>
    </div>}
  </div>;
}
