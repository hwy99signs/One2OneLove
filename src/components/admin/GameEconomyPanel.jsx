import React,{useEffect,useState} from 'react';
import { toast } from 'sonner';
import { createGamePromotion,deleteGamePromotion,getGameEconomyAdmin,updateGamePromotion } from '@/lib/adminService';

const money=c=>'$'+(Number(c||0)/100).toFixed(2);

export default function GameEconomyPanel(){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true);
  const [form,setForm]=useState({name:'',kind:'free_play',percent:50,startsAt:'',endsAt:'',recurrence:'none',recurrenceDay:5,games:'ALL',audience:'all',active:false});
  const load=async()=>{try{setLoading(true);setData(await getGameEconomyAdmin());}catch(e){toast.error(e?.message||'Unable to load Game Credits.');}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const saveNew=async()=>{
    try{
      await createGamePromotion({...form,games:form.games==='ALL'?'ALL':String(form.games).split(',').map(x=>x.trim()).filter(Boolean),active:false});
      toast.success('Promotion created.');setForm(v=>({...v,name:'',active:false}));await load();
    }catch(e){toast.error(e?.message||'Unable to create promotion.');}
  };
  const remove=async p=>{
    if(!window.confirm('Delete promotion "'+p.name+'"? This cannot be undone.'))return;
    try{ await deleteGamePromotion(p.id); toast.success('Promotion deleted.'); await load(); }
    catch(e){ toast.error(e?.message||'Unable to delete promotion.'); }
  };
  const stateLabel=p=>{
    if(!p.active)return 'Disabled';
    const now=Date.now();
    if(p.starts_at&&new Date(p.starts_at).getTime()>now)return 'Scheduled';
    if(p.ends_at&&new Date(p.ends_at).getTime()<now)return 'Ended';
    return 'Live';
  };
  const toggle=async p=>{
    try{
      await updateGamePromotion(p.id,{
        name:p.name,kind:p.kind,percent:p.percent,grantCents:p.grant_cents,grantExpiryDays:p.grant_expiry_days,
        startsAt:p.starts_at,endsAt:p.ends_at,recurrence:p.recurrence,recurrenceDay:p.recurrence_day,
        games:p.games,audience:p.audience,active:!p.active
      });
      await load();
    }catch(e){toast.error(e?.message||'Unable to update promotion.');}
  };
  if(loading&&!data)return <div className="rounded-2xl border bg-white p-6 font-semibold text-slate-500">Loading Game Credit operations…</div>;
  const totals=data?.totals||{};
  return <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-black text-slate-950">Game Credits & Promotions</h2>
      <p className="mt-1 text-sm text-slate-500">Promotional Game Credit is games-only. Normal game prices stay unchanged while promotions temporarily alter the resolved price.</p>
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
      <h3 className="text-lg font-black">Promotions</h3>
      <div className="mt-4 space-y-3">{(data?.promotions||[]).map(p=>
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
          <div><div className="font-black">{p.name} <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-slate-700">{stateLabel(p)}</span></div><div className="text-xs font-semibold text-slate-500">{p.kind+' · '+(p.recurrence==='weekly'?('weekly day '+p.recurrence_day):'one-time')+' · '+(p.games==='ALL'?'ALL games':Array.isArray(p.games)?p.games.join(', '):String(p.games))}</div><div className="mt-1 text-xs text-slate-500">{(p.players||0)+' players · '+(p.plays||0)+' plays · '+(p.returnedWithin7Days||0)+' returned in 7d · '+(p.becamePayingPlayers||0)+' later paid'+((p.perGame||[]).length?' · '+p.perGame.map(g=>g.game+': '+g.plays).join(' · '):'')}</div></div>
          <div className="flex gap-2"><button onClick={()=>toggle(p)} className={'rounded-xl px-4 py-2 text-sm font-black '+(p.active?'bg-emerald-600 text-white':'bg-slate-200 text-slate-700')}>{p.active?'Enabled':'Disabled'}</button><button onClick={()=>remove(p)} className="rounded-xl bg-red-100 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-200">Delete</button></div>
        </div>)}
      </div>
    </div>
    {(data?.registry||[]).length>0&&<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black">Game Registry</h3>
      <div className="mt-3 space-y-2">{(data?.registry||[]).map(g=>
        <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-2 text-sm"><span className="font-black">{g.title}</span><span className="font-semibold text-slate-500">{g.category+' · '+g.route+' · '+(g.leaderboard?('Leaderboard: Top 5 ('+g.scoreLabel+')'):'No leaderboard')}</span></div>)}
      </div>
    </div>}
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black">Create Promotion</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Promotion name" className="rounded-xl border p-3"/>
        <select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})} className="rounded-xl border p-3"><option value="free_play">Free play</option><option value="percent_off">Percent off</option><option value="credit_grant">Credit grant</option></select>
        {form.kind==='percent_off'&&<input type="number" min="0" max="100" value={form.percent} onChange={e=>setForm({...form,percent:Number(e.target.value)})} className="rounded-xl border p-3" placeholder="Percent"/>}
        <select value={form.recurrence} onChange={e=>setForm({...form,recurrence:e.target.value})} className="rounded-xl border p-3"><option value="none">One-time</option><option value="weekly">Weekly</option></select>
        {form.recurrence==='weekly'&&<select value={form.recurrenceDay} onChange={e=>setForm({...form,recurrenceDay:Number(e.target.value)})} className="rounded-xl border p-3">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=><option key={d} value={i}>{d}</option>)}</select>}
        <input value={form.games} onChange={e=>setForm({...form,games:e.target.value})} placeholder="ALL or comma-separated game ids" className="rounded-xl border p-3"/>
        <select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})} className="rounded-xl border p-3"><option value="all">All members</option><option value="new_members">New members</option></select>
        <input type="datetime-local" value={form.startsAt} onChange={e=>setForm({...form,startsAt:e.target.value||null})} className="rounded-xl border p-3"/>
        <input type="datetime-local" value={form.endsAt} onChange={e=>setForm({...form,endsAt:e.target.value||null})} className="rounded-xl border p-3"/>
      </div>
      <button onClick={saveNew} disabled={!form.name.trim()} className="mt-4 rounded-xl bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-40">Create disabled promotion</button>
    </div>
  </div>;
}
