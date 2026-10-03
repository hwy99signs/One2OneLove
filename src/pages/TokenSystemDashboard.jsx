import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {
  Activity,ArrowLeft,BarChart3,Coins,CreditCard,Database,Gamepad2,Gauge,Gift,
  History,Loader2,RefreshCw,ShieldCheck,Sparkles,Users,WalletCards
} from 'lucide-react';
import {getTokenSystemDashboard,adjustTokenWallet} from '@/lib/tokenAdminService';

const TABS=[
  ['overview','Overview',Gauge],
  ['wallets','Wallets',WalletCards],
  ['economics','Usage & Costs',BarChart3],
  ['pricing','Pricing & Packages',Coins],
  ['founders','Founders',Gift],
  ['legacy','Legacy Reconciliation',History],
  ['system','System',Database],
];

const n=value=>Number(value||0).toLocaleString();
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value||0));
const dt=value=>value?new Date(value).toLocaleString():'—';
const pct=(num,den)=>Number(den)>0?((Number(num)/Number(den))*100).toFixed(1)+'%':'—';

function Card({children,className=''}){return <div className={'rounded-2xl border border-slate-200 bg-white shadow-sm '+className}>{children}</div>;}
function Panel({title,subtitle,children,right=null}){return <Card><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="text-lg font-black text-slate-950">{title}</h2>{subtitle&&<p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{right}</div><div className="p-5">{children}</div></Card>;}
function Stat({icon:Icon,label,value,note,tone='violet'}){
  const tones={violet:'bg-violet-50 text-violet-700',amber:'bg-amber-50 text-amber-700',emerald:'bg-emerald-50 text-emerald-700',blue:'bg-blue-50 text-blue-700',rose:'bg-rose-50 text-rose-700',slate:'bg-slate-100 text-slate-700'};
  return <Card className="p-4"><div className={'inline-flex rounded-xl p-2 '+(tones[tone]||tones.violet)}><Icon className="h-5 w-5"/></div><div className="mt-3 text-2xl font-black text-slate-950">{value}</div><div className="text-sm font-bold text-slate-700">{label}</div>{note&&<div className="mt-1 text-xs text-slate-400">{note}</div>}</Card>;
}
function Badge({children,tone='slate'}){
  const tones={slate:'bg-slate-100 text-slate-700',green:'bg-emerald-100 text-emerald-700',amber:'bg-amber-100 text-amber-800',blue:'bg-blue-100 text-blue-700',rose:'bg-rose-100 text-rose-700',violet:'bg-violet-100 text-violet-700'};
  return <span className={'inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide '+(tones[tone]||tones.slate)}>{children}</span>;
}
function Empty({children='No records yet.'}){return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">{children}</div>;}

export default function TokenSystemDashboard(){
  const [data,setData]=useState(null);
  const [tab,setTab]=useState('overview');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');
  const [query,setQuery]=useState('');

  const load=async(silent=false)=>{
    if(!silent)setLoading(true);
    setError('');
    try{setData(await getTokenSystemDashboard());}
    catch(err){setError(err?.message||'Unable to load the Token System Dashboard.');}
    finally{setLoading(false);}
  };

  useEffect(()=>{load();},[]);

  const summary=data?.summary||{};
  const founderSummary=data?.founderSummary||{};
  const legacy=data?.legacySummary||{};
  const system=data?.systemCounts||{};

  const filteredWallets=useMemo(()=>{
    const q=query.trim().toLowerCase();
    const rows=data?.wallets||[];
    if(!q)return rows;
    return rows.filter(row=>[row.email,row.name,row.user_id,row.founding_number].some(v=>String(v||'').toLowerCase().includes(q)));
  },[data?.wallets,query]);

  const adjust=async(row)=>{
    const raw=window.prompt(`Adjust O2OL Tokens for ${row.email||row.user_id}. Use a positive number to add or a negative number to remove.`,'10');
    if(raw===null)return;
    const delta=Number.parseInt(String(raw),10);
    if(!Number.isInteger(delta)||delta===0||Math.abs(delta)>1000000){
      window.alert('Enter a non-zero whole number between -1,000,000 and 1,000,000.');
      return;
    }
    const reason=window.prompt('Reason for this Token adjustment (required):','');
    if(reason===null)return;
    if(!reason.trim()){window.alert('A reason is required for the audit ledger.');return;}
    if(!window.confirm(`${delta>0?'Add':'Remove'} ${Math.abs(delta)} Token${Math.abs(delta)===1?'':'s'} ${delta>0?'to':'from'} ${row.email||row.user_id}?`))return;
    setBusy(row.user_id);
    try{await adjustTokenWallet(row.user_id,delta,reason.trim());await load(true);}
    catch(err){window.alert(err?.message||'Unable to adjust this wallet.');}
    finally{setBusy('');}
  };

  if(loading&&!data)return <div className="min-h-screen bg-slate-950 px-4 py-16 text-white"><div className="mx-auto flex max-w-7xl items-center justify-center gap-3"><Loader2 className="h-7 w-7 animate-spin"/><span className="font-bold">Loading Token System Dashboard…</span></div></div>;

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,.28),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(245,158,11,.18),_transparent_35%)]">
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-violet-300"><Sparkles className="h-4 w-4"/>One2OneLove Control Center</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Token System Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Separate monitoring for the Free Account + O2OL Token architecture. The existing Admin dashboard remains independent and unchanged.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="green">Free Account Model</Badge>
              <Badge tone="amber">Calibration Mode</Badge>
              <Badge tone="violet">Admin MFA Protected</Badge>
              {data?.generatedAt&&<Badge>Updated {new Date(data.generatedAt).toLocaleTimeString()}</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/Admin" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4"/>Existing Admin</Link>
            <button onClick={()=>load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50"><RefreshCw className={'h-4 w-4 '+(loading?'animate-spin':'')}/>Refresh</button>
          </div>
        </div>
      </div>
    </div>

    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {error&&<div className="mb-5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-100">{error}</div>}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {TABS.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition '+(tab===id?'bg-white text-slate-950':'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10')}><Icon className="h-4 w-4"/>{label}</button>)}
      </div>

      {tab==='overview'&&<div className="space-y-6 text-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat icon={Users} label="Member Wallets" value={n(summary.wallet_count)} note="Admin excluded" tone="blue"/>
          <Stat icon={Coins} label="Outstanding Tokens" value={n(summary.outstanding_tokens)} note={`${n(summary.lifetime_used)} lifetime used`} tone="amber"/>
          <Stat icon={CreditCard} label="Token Revenue · 30d" value={money(Number(summary.token_revenue_cents_30d||0)/100)} note={`${n(summary.transactions_30d)} transactions`} tone="emerald"/>
          <Stat icon={Activity} label="Provider Cost · 30d" value={money(Number(summary.provider_cost_micros_30d||0)/1000000)} note={`${n(summary.tokens_charged_30d)} Tokens charged`} tone="rose"/>
          <Stat icon={Gift} label="Founders Reserved/Active" value={n(founderSummary.total)} note={`${Math.max(0,200-Number(founderSummary.total||0))} of 200 remaining`} tone="violet"/>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Token Flow" subtitle="Cumulative non-admin wallet movement.">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4"><div className="text-xs font-black uppercase text-emerald-700">Purchased</div><div className="mt-1 text-2xl font-black">{n(summary.lifetime_purchased)}</div></div>
              <div className="rounded-xl bg-violet-50 p-4"><div className="text-xs font-black uppercase text-violet-700">Granted</div><div className="mt-1 text-2xl font-black">{n(summary.lifetime_granted)}</div></div>
              <div className="rounded-xl bg-amber-50 p-4"><div className="text-xs font-black uppercase text-amber-700">Used</div><div className="mt-1 text-2xl font-black">{n(summary.lifetime_used)}</div></div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><strong>{n(summary.auto_replenish_enabled)}</strong> members currently have optional Auto-Replenish enabled.</div>
          </Panel>
          <Panel title="System Transition" subtitle="Old recurring records remain visible for reconciliation; they do not define current access.">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-blue-50 p-4"><div className="text-xs font-black uppercase text-blue-700">Free Accounts</div><div className="mt-1 text-2xl font-black">{n(legacy.free_account_records)}</div></div>
              <div className="rounded-xl bg-slate-100 p-4"><div className="text-xs font-black uppercase text-slate-600">Stripe-linked</div><div className="mt-1 text-2xl font-black">{n(legacy.stripe_linked_accounts)}</div></div>
              <div className="rounded-xl bg-amber-50 p-4"><div className="text-xs font-black uppercase text-amber-700">Legacy Active</div><div className="mt-1 text-2xl font-black">{n(legacy.legacy_active_records)}</div></div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">Historical subscriptions are frozen for reconciliation during Token Prelaunch. No automatic conversion is applied until Token economics are calibrated.</p>
          </Panel>
        </div>

        <Panel title="30-Day Feature Economics" subtitle="Actual provider-cost telemetry for member activity; Admin usage is excluded.">
          {(data?.featureEconomics||[]).length?<div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Feature</th><th className="px-3 py-2">Provider</th><th className="px-3 py-2">Events</th><th className="px-3 py-2">Users</th><th className="px-3 py-2">Tokens</th><th className="px-3 py-2">Provider Cost</th></tr></thead><tbody className="divide-y divide-slate-100">{data.featureEconomics.map((row,i)=><tr key={row.feature_code+'-'+row.provider+'-'+i}><td className="px-3 py-3 font-black">{row.feature_code}</td><td className="px-3 py-3">{row.provider||'—'}{row.provider_product&&<div className="text-xs text-slate-400">{row.provider_product}</div>}</td><td className="px-3 py-3">{n(row.events)}</td><td className="px-3 py-3">{n(row.users)}</td><td className="px-3 py-3">{n(row.tokens_charged)}</td><td className="px-3 py-3 font-black">{money(Number(row.provider_cost_micros||0)/1000000)}</td></tr>)}</tbody></table></div>:<Empty>No member cost telemetry has been recorded yet.</Empty>}
        </Panel>
      </div>}

      {tab==='wallets'&&<div className="space-y-6 text-slate-900">
        <Panel title="Member Token Wallets" subtitle="Live Token balances and lifetime movement. Token adjustments are independently audited in the Token ledger." right={<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search member…" className="w-64 max-w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"/>}>
          {filteredWallets.length?<div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Member</th><th className="px-3 py-2">Balance</th><th className="px-3 py-2">Purchased</th><th className="px-3 py-2">Used</th><th className="px-3 py-2">Granted</th><th className="px-3 py-2">Auto</th><th className="px-3 py-2">Founder</th><th className="px-3 py-2 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredWallets.map(row=><tr key={row.user_id}><td className="px-3 py-3"><div className="font-bold">{row.name||'Member'}</div><div className="text-xs text-slate-400">{row.email||row.user_id}</div></td><td className="px-3 py-3 text-lg font-black text-amber-700">{n(row.balance)}</td><td className="px-3 py-3">{n(row.lifetime_purchased)}</td><td className="px-3 py-3">{n(row.lifetime_used)}</td><td className="px-3 py-3">{n(row.lifetime_granted)}</td><td className="px-3 py-3">{row.auto_replenish_enabled?<Badge tone="green">On</Badge>:<Badge>Off</Badge>}</td><td className="px-3 py-3">{row.founding_number?<Badge tone="violet">#{row.founding_number}</Badge>:'—'}</td><td className="px-3 py-3 text-right"><button disabled={busy===row.user_id} onClick={()=>adjust(row)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{busy===row.user_id?'Working…':'Adjust Tokens'}</button></td></tr>)}</tbody></table></div>:<Empty>No matching wallets.</Empty>}
        </Panel>
        <Panel title="Recent Token Ledger" subtitle="Purchases, reservations/releases, refunds, grants, migration credits and audited Admin adjustments.">
          {(data?.transactions||[]).length?<div className="max-h-[650px] overflow-auto"><table className="min-w-full text-sm"><thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Member</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Feature / Package</th><th className="px-3 py-2">Delta</th><th className="px-3 py-2">Balance</th><th className="px-3 py-2">Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{data.transactions.map(tx=><tr key={tx.id}><td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{dt(tx.created_at)}</td><td className="px-3 py-3">{tx.email||tx.user_id}</td><td className="px-3 py-3"><Badge tone={Number(tx.wallet_delta)>=0?'green':'amber'}>{tx.transaction_type}</Badge></td><td className="px-3 py-3 text-xs">{tx.feature_code||tx.package_code||'—'}</td><td className={'px-3 py-3 font-black '+(Number(tx.wallet_delta)>=0?'text-emerald-700':'text-rose-700')}>{Number(tx.wallet_delta)>=0?'+':''}{n(tx.wallet_delta)}</td><td className="px-3 py-3">{n(tx.balance_after)}</td><td className="px-3 py-3">{tx.amount_cents==null?'—':money(Number(tx.amount_cents)/100)}</td></tr>)}</tbody></table></div>:<Empty>No Token transactions yet.</Empty>}
        </Panel>
      </div>}

      {tab==='economics'&&<div className="space-y-6 text-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Activity} label="Provider Cost · 30d" value={money(Number(summary.provider_cost_micros_30d||0)/1000000)} tone="rose"/>
          <Stat icon={Coins} label="Tokens Charged · 30d" value={n(summary.tokens_charged_30d)} tone="amber"/>
          <Stat icon={CreditCard} label="Token Revenue · 30d" value={money(Number(summary.token_revenue_cents_30d||0)/100)} tone="emerald"/>
          <Stat icon={BarChart3} label="Revenue / Cost" value={Number(summary.provider_cost_micros_30d)>0?(Number(summary.token_revenue_cents_30d||0)*10000/Number(summary.provider_cost_micros_30d)).toFixed(1)+'×':'—'} note="early calibration indicator" tone="violet"/>
        </div>
        <Panel title="Provider Economics by Metered Feature" subtitle="Input/output measurements and actual provider costs where available.">
          {(data?.featureEconomics||[]).length?<div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Feature</th><th className="px-3 py-2">Events</th><th className="px-3 py-2">Users</th><th className="px-3 py-2">Input Units</th><th className="px-3 py-2">Output Units</th><th className="px-3 py-2">Tokens</th><th className="px-3 py-2">Cost</th></tr></thead><tbody className="divide-y divide-slate-100">{data.featureEconomics.map((row,i)=><tr key={row.feature_code+i}><td className="px-3 py-3"><div className="font-black">{row.feature_code}</div><div className="text-xs text-slate-400">{row.provider} {row.provider_product||''}</div></td><td className="px-3 py-3">{n(row.events)}</td><td className="px-3 py-3">{n(row.users)}</td><td className="px-3 py-3">{n(row.provider_input_units||row.input_characters)}</td><td className="px-3 py-3">{n(row.provider_output_units||row.output_characters)}</td><td className="px-3 py-3">{n(row.tokens_charged)}</td><td className="px-3 py-3 font-black">{money(Number(row.provider_cost_micros||0)/1000000)}</td></tr>)}</tbody></table></div>:<Empty>Use the calibration harness to begin collecting provider economics.</Empty>}
        </Panel>
        <Panel title="Recent Calibration Events" subtitle="Raw per-event evidence used to calibrate Token prices. Admin events are labeled and excluded from member-economics totals above.">
          {(data?.recentCostEvents||[]).length?<div className="max-h-[700px] overflow-auto"><table className="min-w-full text-xs"><thead className="sticky top-0 bg-slate-50 text-left uppercase text-slate-500"><tr><th className="px-3 py-2">When / Feature</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Input Chars</th><th className="px-3 py-2">Context Chars</th><th className="px-3 py-2">Output Chars</th><th className="px-3 py-2">Input Tokens</th><th className="px-3 py-2">Cached</th><th className="px-3 py-2">Output Tokens</th><th className="px-3 py-2">Tokens Charged</th><th className="px-3 py-2">Provider Cost</th><th className="px-3 py-2">Cost / O2OL Token</th></tr></thead><tbody className="divide-y divide-slate-100">{data.recentCostEvents.map(row=>{const charged=Number(row.customer_tokens_charged||0);const costMicros=Number(row.provider_cost_micros||0);return <tr key={row.id}><td className="px-3 py-3"><div className="font-black">{row.feature_code}</div><div className="text-slate-400">{dt(row.created_at)}</div><div className="text-slate-400">{row.provider||'—'} {row.provider_product||''}</div></td><td className="px-3 py-3"><Badge tone={row.auth_role==='admin'?'violet':'blue'}>{row.auth_role||'user'}</Badge></td><td className="px-3 py-3">{n(row.input_characters)}</td><td className="px-3 py-3">{n(row.context_characters)}</td><td className="px-3 py-3">{n(row.output_characters)}</td><td className="px-3 py-3">{n(row.provider_input_units)}</td><td className="px-3 py-3">{n(row.provider_cached_input_units)}</td><td className="px-3 py-3">{n(row.provider_output_units)}</td><td className="px-3 py-3 font-black text-amber-700">{n(charged)}</td><td className="px-3 py-3 font-black">{money(costMicros/1000000)}</td><td className="px-3 py-3 font-black text-violet-700">{charged>0?money((costMicros/1000000)/charged):'—'}</td></tr>})}</tbody></table></div>:<Empty>No raw cost events have been recorded yet.</Empty>}
        </Panel>
        <Panel title="Calibration Sessions" subtitle="Admin calibration sessions are separated from member economics so testing cannot contaminate live usage numbers.">
          {(data?.calibrations||[]).length?<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.calibrations.map(row=><div key={row.id} className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between gap-2"><div><div className="font-black">{row.feature_code}</div><div className="text-xs text-slate-400">{row.email||row.user_id}</div></div><Badge tone={row.ended_at?'green':'amber'}>{row.ended_at?'Complete':'Running'}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div>Events<br/><strong>{n(row.cost_events)}</strong></div><div>Tokens<br/><strong>{n(row.customer_tokens_charged)}</strong></div><div>Cost<br/><strong>{money(Number(row.provider_cost_micros||0)/1000000)}</strong></div></div><div className="mt-3 text-xs text-slate-400">{dt(row.started_at)}</div></div>)}</div>:<Empty>No calibration sessions yet.</Empty>}
        </Panel>
      </div>}

      {tab==='pricing'&&<div className="grid gap-6 xl:grid-cols-2 text-slate-900">
        <Panel title="Token Packages" subtitle="Current Prelaunch package candidates. Calibration-only means they are not final economics.">
          <div className="space-y-3">{(data?.packages||[]).map(pkg=><div key={pkg.code} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"><div><div className="font-black">{pkg.label}</div><div className="font-mono text-xs text-slate-400">{pkg.code}</div><div className="mt-2 flex gap-2"><Badge tone={pkg.active?'green':'slate'}>{pkg.active?'Active':'Off'}</Badge>{pkg.calibration_only&&<Badge tone="amber">Calibration</Badge>}</div></div><div className="text-right"><div className="text-2xl font-black text-violet-700">{n(pkg.tokens)} Tokens</div><div className="text-sm font-bold text-slate-500">{money(Number(pkg.amount_cents)/100)}</div><div className="text-xs text-slate-400">{(Number(pkg.amount_cents)/Math.max(1,Number(pkg.tokens))).toFixed(2)}¢/Token</div></div></div>)}</div>
        </Panel>
        <Panel title="Metered Feature Prices" subtitle="Token price shown before each metered action.">
          <div className="space-y-3">{(data?.featurePrices||[]).map(row=><div key={row.feature_code} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"><div><div className="font-black">{row.label}</div><div className="font-mono text-xs text-slate-400">{row.feature_code}</div><div className="mt-2 flex gap-2">{row.calibration_only&&<Badge tone="amber">Calibration</Badge>}<Badge tone={row.active?'green':'slate'}>{row.active?'Active':'Off'}</Badge></div></div><div className="text-right"><div className="text-2xl font-black text-amber-700">{n(row.token_cost)}</div><div className="text-xs font-bold text-slate-500">Token{Number(row.token_cost)===1?'':'s'} / {row.pricing_unit}</div></div></div>)}</div>
        </Panel>
      </div>}

      {tab==='founders'&&<div className="space-y-6 text-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat icon={Gift} label="Founder Slots Used" value={n(founderSummary.total)} note="of 200" tone="violet"/>
          <Stat icon={ShieldCheck} label="Active" value={n(founderSummary.active)} tone="emerald"/>
          <Stat icon={History} label="Reserved" value={n(founderSummary.reserved)} tone="amber"/>
          <Stat icon={Users} label="First 100" value={n(founderSummary.first100)} tone="blue"/>
          <Stat icon={Users} label="Second 100" value={n(founderSummary.second100)} tone="slate"/>
        </div>
        <Panel title="Founder Registry" subtitle="Numbers are reserved and never recycled. Badge activation follows verified phone completion. Token benefits remain pending calibration until explicitly assigned.">
          {(data?.founders||[]).length?<div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Member</th><th className="px-3 py-2">Cohort</th><th className="px-3 py-2">Badge</th><th className="px-3 py-2">Founder Status</th><th className="px-3 py-2">Token Benefit</th><th className="px-3 py-2">Activated</th></tr></thead><tbody className="divide-y divide-slate-100">{data.founders.map(row=><tr key={row.user_id}><td className="px-3 py-3 text-lg font-black text-violet-700">#{row.founding_number}</td><td className="px-3 py-3"><div className="font-bold">{row.name||'Member'}</div><div className="text-xs text-slate-400">{row.email||row.user_id}</div></td><td className="px-3 py-3">{row.cohort}</td><td className="px-3 py-3">{row.badge_retained?<Badge tone="violet">Retained</Badge>:<Badge>Off</Badge>}</td><td className="px-3 py-3"><Badge tone={row.status==='active'?'green':row.status==='reserved'?'amber':'slate'}>{row.status}</Badge></td><td className="px-3 py-3">{Number(row.monthly_tokens)>0?`${n(row.monthly_tokens)} × ${n(row.months_total)} months`:<Badge tone="amber">Pending calibration</Badge>}</td><td className="px-3 py-3 text-xs text-slate-500">{dt(row.activated_at)}</td></tr>)}</tbody></table></div>:<Empty>No Founder slots have been claimed on this environment.</Empty>}
        </Panel>
      </div>}

      {tab==='legacy'&&<div className="space-y-6 text-slate-900">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={CreditCard} label="Stripe-linked Records" value={n(legacy.stripe_linked_accounts)} tone="slate"/>
          <Stat icon={History} label="Legacy Active Records" value={n(legacy.legacy_active_records)} note="reconciliation only" tone="amber"/>
          <Stat icon={Users} label="Free Account Records" value={n(legacy.free_account_records)} tone="blue"/>
        </div>
        <Panel title="Legacy-to-Token Conversion Preview" subtitle="Read-only reconciliation evidence. No quote shown here is automatically applied.">
          {(data?.conversionQuotes||[]).length?<div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Member</th><th className="px-3 py-2">Old Plan</th><th className="px-3 py-2">Paid</th><th className="px-3 py-2">Unused Value</th><th className="px-3 py-2">Proposed Tokens</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Created</th></tr></thead><tbody className="divide-y divide-slate-100">{data.conversionQuotes.map(row=><tr key={row.id}><td className="px-3 py-3">{row.email||row.user_id}</td><td className="px-3 py-3">{row.old_plan||'—'}</td><td className="px-3 py-3">{money(Number(row.amount_paid_cents||0)/100)}</td><td className="px-3 py-3">{money(Number(row.unused_value_cents||0)/100)}</td><td className="px-3 py-3 font-black text-violet-700">{n(row.proposed_tokens)}</td><td className="px-3 py-3"><Badge tone={row.status==='applied'?'green':'amber'}>{row.status}</Badge></td><td className="px-3 py-3 text-xs text-slate-500">{dt(row.created_at)}</td></tr>)}</tbody></table></div>:<Empty>No conversion previews have been generated. That is expected until calibration establishes the Token value.</Empty>}
        </Panel>
      </div>}

      {tab==='system'&&<div className="space-y-6 text-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Stat icon={Coins} label="Active Packages" value={n(system.active_packages)} tone="violet"/>
          <Stat icon={Gauge} label="Metered Features" value={n(system.active_metered_features)} tone="amber"/>
          <Stat icon={Activity} label="Cost Events" value={n(system.cost_events)} tone="rose"/>
          <Stat icon={BarChart3} label="Calibration Sessions" value={n(system.calibration_sessions)} tone="blue"/>
          <Stat icon={History} label="Conversion Quotes" value={n(system.conversion_quotes)} tone="slate"/>
          <Stat icon={Gamepad2} label="Game Passes" value={n(system.game_passes)} tone="emerald"/>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Reservation Integrity" subtitle="Reserved Tokens are consumed on successful delivery or released on failure.">
            {(data?.reservations||[]).length?<div className="space-y-3">{data.reservations.map(row=><div key={row.status} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><Badge tone={row.status==='consumed'?'green':row.status==='reserved'?'amber':'slate'}>{row.status}</Badge><div className="text-right"><div className="font-black">{n(row.count)} reservations</div><div className="text-xs text-slate-500">{n(row.tokens)} Tokens</div></div></div>)}</div>:<Empty>No Token reservations yet.</Empty>}
          </Panel>
          <Panel title="Game Access Passes" subtitle="Session access charged through Tokens rather than recurring tiers.">
            {(data?.gameSummary||[]).length?<div className="space-y-3">{data.gameSummary.map((row,i)=><div key={row.game+row.status+i} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><div className="font-black">{row.game}</div><div className="text-xs text-slate-400">{row.status}</div></div><div className="text-right"><div className="font-black">{n(row.passes)} passes</div><div className="text-xs text-slate-500">{n(row.tokens_charged)} Tokens</div></div></div>)}</div>:<Empty>No premium game passes yet.</Empty>}
          </Panel>
        </div>
        <Panel title="Architecture Separation" subtitle="The two Admin experiences intentionally remain independent.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center gap-2 font-black"><ShieldCheck className="h-5 w-5 text-blue-600"/>Existing Admin Dashboard</div><p className="mt-2 text-sm leading-6 text-slate-500">Original member-management, analytics, moderation and historical billing dashboard. Its page and service were restored unchanged.</p><Link to="/Admin" className="mt-4 inline-flex rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white">Open Existing Admin</Link></div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5"><div className="flex items-center gap-2 font-black text-violet-950"><Coins className="h-5 w-5 text-violet-600"/>Token System Dashboard</div><p className="mt-2 text-sm leading-6 text-violet-800">Free-account economics, Token wallets, Token ledger, provider cost telemetry, calibration, Founder conversion and usage-based feature monitoring.</p></div>
          </div>
        </Panel>
      </div>}
    </div>
  </div>;
}
