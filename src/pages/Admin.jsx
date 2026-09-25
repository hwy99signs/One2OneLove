import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowLeft, BarChart3, CalendarDays, CheckCircle2,
  Clock3, CreditCard, FileCheck2, Gauge, Heart, Loader2, LockKeyhole,
  Menu, MessageSquareText, RefreshCw, Search, ShieldCheck, TrendingUp,
  UserCheck, Users, X,
} from 'lucide-react';
import { getAdminAnalytics, getAdminDashboard } from '../lib/adminService';

const sections = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'feature-usage', label: 'Feature Usage', icon: Gauge },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'plans', label: 'Plans & Billing', icon: CreditCard },
  { id: 'love-notes', label: 'Love Notes', icon: Heart },
  { id: 'applications', label: 'Applications', icon: FileCheck2 },
  { id: 'moderation', label: 'Moderation', icon: MessageSquareText },
  { id: 'system', label: 'System', icon: Activity },
];

const toneMap = {
  rose: 'bg-rose-50 text-rose-600', blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600', slate: 'bg-slate-100 text-slate-600',
};

function cx(...values) { return values.filter(Boolean).join(' '); }
function number(value) { return Number(value || 0).toLocaleString(); }
function decimal(value) { return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 }); }
function money(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'USD').toUpperCase() }).format(Number(value || 0));
}
function date(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function statusTone(value) {
  const status = String(value || '').toLowerCase();
  if (['active','approved','paid','succeeded','success','published','sent','passed','delivered'].includes(status)) return 'green';
  if (['pending','trial','trialing','scheduled','unpublished'].includes(status)) return 'amber';
  if (['failed','rejected','banned','inactive','cancelled','canceled','past_due'].includes(status)) return 'red';
  return 'slate';
}

function Pill({ children, tone = 'slate' }) {
  const styles = {
    slate:'bg-slate-100 text-slate-700 border-slate-200', green:'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:'bg-amber-50 text-amber-700 border-amber-200', red:'bg-rose-50 text-rose-700 border-rose-200',
    blue:'bg-blue-50 text-blue-700 border-blue-200', purple:'bg-violet-50 text-violet-700 border-violet-200',
  };
  return <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', styles[tone] || styles.slate)}>{children}</span>;
}

function Metric({ icon: Icon, label, value, note, tone='rose' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</div>
        <div className={cx('rounded-xl p-2.5', toneMap[tone] || toneMap.rose)}><Icon size={20}/></div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, className='' }) {
  return <section className={cx('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm',className)}><div className="mb-4"><h3 className="font-bold text-slate-900">{title}</h3>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{children}</section>;
}
function TableShell({ children }) { return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">{children}</div>; }
function Empty({ children='No records yet.' }) { return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center text-sm text-slate-500">{children}</div>; }
function Heading({ title, subtitle }) { return <div className="mb-5"><h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>; }

function DeliveryHealth({ firstLabel, firstValue, passed, failed, pending }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-semibold text-blue-700">{firstLabel}</p><p className="mt-1 text-2xl font-black text-blue-900">{number(firstValue)}</p></div>
    <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold text-emerald-700">Passed</p><p className="mt-1 text-2xl font-black text-emerald-900">{number(passed)}</p></div>
    <div className="rounded-xl bg-rose-50 p-4"><p className="text-xs font-semibold text-rose-700">Failed</p><p className="mt-1 text-2xl font-black text-rose-900">{number(failed)}</p></div>
    <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-semibold text-amber-700">Pending</p><p className="mt-1 text-2xl font-black text-amber-900">{number(pending)}</p></div>
  </div>;
}

export default function Admin() {
  const navigate = useNavigate();
  const [section,setSection] = useState('overview');
  const [data,setData] = useState(null);
  const [analytics,setAnalytics] = useState(null);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [error,setError] = useState(null);
  const [query,setQuery] = useState('');
  const [mobileNav,setMobileNav] = useState(false);

  const load = async (refresh=false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [dashboardData,analyticsData] = await Promise.all([getAdminDashboard(),getAdminAnalytics()]);
      setData(dashboardData);
      setAnalytics(analyticsData);
    } catch (err) { setError(err); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { load(false); }, []);

  const filteredMembers = useMemo(() => {
    const members=data?.members || [], needle=query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter(m => [m.name,m.email,m.location,m.subscription_plan,m.user_type].filter(Boolean).some(v => String(v).toLowerCase().includes(needle)));
  },[data,query]);

  if (loading) return <div className="min-h-screen bg-slate-50 grid place-items-center p-4"><div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><Loader2 className="mx-auto animate-spin text-rose-500" size={34}/><h1 className="mt-4 text-xl font-bold">Loading One2OneLove Admin</h1><p className="mt-2 text-sm text-slate-500">Verifying administrator access and loading platform data.</p></div></div>;
  if (error) {
    const unauthorized=error.status===401;
    return <div className="min-h-screen bg-slate-50 grid place-items-center p-4"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><LockKeyhole className="mx-auto text-rose-600" size={38}/><h1 className="mt-4 text-xl font-bold">{unauthorized?'Sign in required':'Administrator access required'}</h1><p className="mt-2 text-sm text-slate-500">This dashboard is restricted to an authorized One2OneLove administrator account.</p><button onClick={()=>navigate(unauthorized?'/SignIn':'/Home')} className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Go back</button></div></div>;
  }

  const summary=data?.summary || {}, users=summary.users || {}, love=summary.loveNotes || {};
  const applications=data?.applications || [], moderation=data?.moderation || [], payments=data?.billing?.payments || [], movements=data?.billing?.changes || [];
  const loveNotes=data?.loveNotes || {}, featureUsage=data?.featureUsage || {}, features=featureUsage.features || [];
  const direct=analytics?.directDelivery || { sent:love.sent_total,passed:0,failed:0,pending:0,receiptTrackingActive:false };
  const topFeatures=features.filter(f=>f.total_activity>0).slice(0,6);

  const openAnalytics = () => window.location.assign('/Analytics');

  const nav = (
    <>
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white"><Heart size={20}/></div><div><div className="font-black text-slate-900">One2OneLove</div><div className="text-xs font-semibold text-rose-600">ADMIN CONTROL</div></div></div>
      </div>
      <nav className="space-y-1 p-3">
        <button onClick={()=>{openAnalytics();setMobileNav(false);}} className="mb-2 flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100"><TrendingUp size={18}/>Analytics</button>
        {sections.map(({id,label,icon:Icon}) => <button key={id} onClick={()=>{setSection(id);setMobileNav(false);}} className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition',section===id?'bg-rose-50 text-rose-700':'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}><Icon size={18}/>{label}</button>)}
      </nav>
      <div className="mt-auto border-t border-slate-200 p-4"><div className="mb-3 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800"><ShieldCheck size={16} className="mb-1"/>Secure admin-only access. Dashboard controls remain read-only during launch QA.</div><button onClick={()=>navigate('/Home')} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16}/>Exit Admin</button></div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">{nav}</aside>
      {mobileNav && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close" className="absolute inset-0 bg-slate-900/30" onClick={()=>setMobileNav(false)}/><aside className="relative flex h-full w-72 flex-col bg-white shadow-xl">{nav}<button className="absolute right-3 top-3 text-slate-500" onClick={()=>setMobileNav(false)}><X/></button></aside></div>}

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3"><button className="rounded-lg border border-slate-200 p-2 lg:hidden" onClick={()=>setMobileNav(true)}><Menu size={18}/></button><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Operations Dashboard</p><h1 className="text-lg font-bold text-slate-900">{sections.find(s=>s.id===section)?.label}</h1></div></div>
            <div className="flex items-center gap-2"><button onClick={openAnalytics} className="hidden items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 sm:inline-flex"><TrendingUp size={15}/>Analytics</button><Pill tone="blue">Preview</Pill><button onClick={()=>load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={refreshing?'animate-spin':''}/><span className="hidden sm:inline">Refresh</span></button></div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {section==='overview' && <div>
            <Heading title="Platform Overview" subtitle="A quick operating view of users, tiers, Love Notes, moderation and the features members are actually using."/>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Users} label="Total Members" value={number(users.total)} note={`${number(users.new_7d)} joined in the last 7 days`}/>
              <Metric icon={Heart} label="Love Notes Sent" value={number(love.sent_total)} note={`${number(love.sent_30d)} in the last 30 days`} tone="violet"/>
              <Metric icon={CalendarDays} label="People Using Scheduler" value={number(love.scheduler_users)} note={`${number(love.scheduler_users_30d)} in the last 30 days`} tone="blue"/>
              <Metric icon={TrendingUp} label="Feature Activity — 30 Days" value={number(features.reduce((sum,f)=>sum+Number(f.activity_30d||0),0))} note={`${features.filter(f=>Number(f.activity_30d||0)>0).length} features with activity`} tone="green"/>
              <Metric icon={FileCheck2} label="Pending Applications" value={number(summary.applications?.pending_total)} note="Professional and contributor applications" tone="blue"/>
              <Metric icon={MessageSquareText} label="Moderation Queue" value={number(summary.moderation?.pending_total)} note="Posts, comments, stories and reviews" tone="amber"/>
              <Metric icon={CreditCard} label="Payments Recorded" value={number(summary.payments?.recorded_payments)} note={`${number(summary.payments?.payments_this_month)} this month`} tone="violet"/>
              <Metric icon={UserCheck} label="Verified Profiles" value={number(users.verified)} note={`${number(users.inactive)} inactive profiles`} tone="green"/>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <Panel title="Tier Breakdown" subtitle="All three launch tiers are always shown, including zero-count tiers.">
                <div className="space-y-3">{(summary.plans||[]).map((plan,i)=><div key={plan.plan} className={cx('rounded-xl p-4',i===0?'bg-blue-50':i===1?'bg-violet-50':'bg-rose-50')}><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{plan.plan}</p><p className="text-2xl font-black text-slate-900">{number(plan.count)}</p></div><p className="text-xs text-slate-500">members</p></div>)}</div>
              </Panel>
              <Panel title="Scheduled Love Note Delivery Health" subtitle="How scheduled Love Notes are performing after they enter the scheduler.">
                <DeliveryHealth firstLabel="Scheduled" firstValue={love.scheduled_total} passed={love.scheduled_passed} failed={love.scheduled_failed} pending={love.scheduled_pending}/>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600"><Pill tone="blue">{number(love.scheduler_users)} people have scheduled</Pill><Pill tone="purple">{number(love.scheduled_30d)} schedules in 30 days</Pill></div>
              </Panel>
              <Panel title="Direct Love Note Delivery Health" subtitle="Direct sends are separated from scheduled sends so you can compare delivery performance.">
                <DeliveryHealth firstLabel="Sent" firstValue={direct.sent} passed={direct.passed} failed={direct.failed} pending={direct.pending}/>
                {!direct.receiptTrackingActive && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Passed, Failed and Pending will populate from carrier delivery receipts after the SMS provider callback is connected. Until then, they remain zero rather than estimating.</p>}
              </Panel>
            </div>

            <Panel title="Top Feature Activity" subtitle="Unique users and activity help show which parts of One2OneLove are attracting attention." className="mt-6">
              {topFeatures.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{topFeatures.map(f=><button key={f.feature} onClick={()=>setSection('feature-usage')} className="rounded-xl border border-slate-200 p-4 text-left hover:border-rose-200 hover:bg-rose-50/40"><div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-900">{f.feature}</p><Pill tone="purple">{number(f.unique_users)} users</Pill></div><div className="mt-3 flex gap-5 text-sm"><div><span className="block text-xs text-slate-400">30 days</span><strong>{number(f.activity_30d)}</strong></div><div><span className="block text-xs text-slate-400">All activity</span><strong>{number(f.total_activity)}</strong></div><div><span className="block text-xs text-slate-400">Avg/user</span><strong>{decimal(f.avg_per_user)}</strong></div></div></button>)}</div> : <Empty>Feature activity will appear as members use the platform.</Empty>}
            </Panel>
          </div>}

          {section==='feature-usage' && <div>
            <Heading title="Feature Usage Analytics" subtitle="See which features attract users, how many members use them, how often they are used, and when they were last active."/>
            <div className={cx('mb-5 rounded-xl border p-4 text-sm',featureUsage.liveTracking?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-amber-200 bg-amber-50 text-amber-800')}>{featureUsage.trackingMessage}</div>
            <TableShell><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Feature</th><th className="px-4 py-3">Unique Users</th><th className="px-4 py-3">7 Days</th><th className="px-4 py-3">30 Days</th><th className="px-4 py-3">Total Activity</th><th className="px-4 py-3">Avg / User</th><th className="px-4 py-3">Last Used</th></tr></thead><tbody className="divide-y divide-slate-100">{features.map(f=><tr key={f.feature} className="hover:bg-slate-50"><td className="px-4 py-3"><div className="font-semibold text-slate-900">{f.feature}</div><div className="text-xs text-slate-400">{f.category}</div></td><td className="px-4 py-3 font-bold text-slate-800">{number(f.unique_users)}</td><td className="px-4 py-3">{number(f.activity_7d)}</td><td className="px-4 py-3">{number(f.activity_30d)}</td><td className="px-4 py-3">{number(f.total_activity)}</td><td className="px-4 py-3">{decimal(f.avg_per_user)}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{date(f.last_used)}</td></tr>)}</tbody></table></TableShell>
          </div>}

          {section==='members' && <div><Heading title="Members" subtitle="Search recent signups, account status and access level."/><div className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><Search size={17} className="text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, email, plan or location" className="w-full bg-transparent text-sm outline-none"/></div><TableShell><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredMembers.map(m=><tr key={m.id}><td className="px-4 py-3"><div className="font-semibold">{m.name||'Unnamed member'}</div><div className="text-xs text-slate-500">{m.email}</div>{m.location&&<div className="text-xs text-slate-400">{m.location}</div>}</td><td className="px-4 py-3 text-slate-600">{m.user_type||'user'}</td><td className="px-4 py-3"><Pill tone="blue">{m.subscription_plan||'Premiere'}</Pill></td><td className="px-4 py-3"><Pill tone={m.banned?'red':statusTone(m.subscription_status)}>{m.banned?'banned':m.subscription_status||'active'}</Pill></td><td className="whitespace-nowrap px-4 py-3 text-slate-500">{date(m.created_at)}</td></tr>)}</tbody></table></TableShell></div>}

          {section==='plans' && <div><Heading title="Plans & Billing" subtitle="Tier distribution, plan changes and payment records. Stripe remains the source of truth for sensitive billing actions."/><div className="mb-6 grid gap-4 sm:grid-cols-3">{(summary.plans||[]).map((p,i)=><Metric key={p.plan} icon={CreditCard} label={p.plan} value={number(p.count)} note="members" tone={i===0?'blue':i===1?'violet':'rose'}/>)}</div><div className="grid gap-6 xl:grid-cols-2"><Panel title="Tier Movements">{movements.length?<div className="space-y-2">{movements.slice(0,25).map(item=><div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="font-semibold">{item.email||item.user_id}</div><div className="mt-1 text-slate-600">{item.from_plan||'—'} → {item.to_plan||'—'} · {item.change_type||'change'}</div><div className="mt-1 text-xs text-slate-400">{date(item.effective_date||item.created_at)}</div></div>)}</div>:<Empty>No plan movements recorded yet.</Empty>}</Panel><Panel title="Recent Payments">{payments.length?<div className="space-y-2">{payments.slice(0,25).map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><div><div className="font-semibold">{item.email||item.user_id}</div><div className="text-xs text-slate-400">{date(item.created_at)}</div></div><div className="text-right"><div className="font-bold">{money(item.amount,item.currency)}</div><Pill tone={statusTone(item.status)}>{item.status||'unknown'}</Pill></div></div>)}</div>:<Empty>No payment records yet.</Empty>}</Panel></div></div>}

          {section==='love-notes' && <div><Heading title="Love Notes Operations" subtitle="Monitor scheduler adoption, scheduled volume, successful deliveries and failures."/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={Users} label="Scheduler Users" value={number(loveNotes.schedulers?.users_total)} note={`${number(loveNotes.schedulers?.users_30d)} in 30 days`} tone="blue"/><Metric icon={CalendarDays} label="Schedules Created" value={number(loveNotes.schedulers?.schedules_total)} note={`${number(loveNotes.schedulers?.schedules_30d)} in 30 days`} tone="violet"/><Metric icon={CheckCircle2} label="Passed" value={number(love.scheduled_passed)} note="successful scheduled sends" tone="green"/><Metric icon={AlertTriangle} label="Failed" value={number(love.scheduled_failed)} note="delivery failures" tone="rose"/><Metric icon={Clock3} label="Avg Schedules / User" value={decimal(loveNotes.schedulers?.avg_schedules_per_user)} note="all-time scheduler frequency" tone="amber"/></div><div className="mt-6 grid gap-6 xl:grid-cols-2"><Panel title="Scheduled Delivery Health"><DeliveryHealth firstLabel="Scheduled" firstValue={love.scheduled_total} passed={love.scheduled_passed} failed={love.scheduled_failed} pending={love.scheduled_pending}/></Panel><Panel title="Direct Delivery Health"><DeliveryHealth firstLabel="Sent" firstValue={direct.sent} passed={direct.passed} failed={direct.failed} pending={direct.pending}/></Panel></div><div className="mt-6">{(loveNotes.recent||[]).length?<TableShell><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Note</th><th className="px-4 py-3">Delivery</th><th className="px-4 py-3">Scheduled</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{loveNotes.recent.map(item=><tr key={item.id}><td className="px-4 py-3"><div className="font-semibold">{item.note_title||'Love Note'}</div><div className="text-xs text-slate-500">{item.email||item.user_id}</div></td><td className="px-4 py-3">{item.delivery_method||'—'}{item.recipient_phone_masked&&<div className="text-xs text-slate-400">{item.recipient_phone_masked}</div>}</td><td className="whitespace-nowrap px-4 py-3 text-slate-500">{item.scheduled_date||'—'} {item.scheduled_time||''}</td><td className="px-4 py-3"><Pill tone={statusTone(item.status)}>{item.status||'unknown'}</Pill>{item.failure_reason&&<div className="mt-1 max-w-xs text-xs text-rose-600">{item.failure_reason}</div>}</td></tr>)}</tbody></table></TableShell>:<Empty>No scheduled Love Notes yet.</Empty>}</div></div>}

          {section==='applications' && <div><Heading title="Professional Applications" subtitle="Licensed professionals, relationship professionals and contributors."/>{applications.length?<div className="grid gap-4 lg:grid-cols-2">{applications.map(item=><div key={`${item.application_type}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.applicant_name||'Unnamed applicant'}</p><p className="text-sm text-slate-500">{item.email||'No email'}</p></div><Pill tone={statusTone(item.status)}>{item.status}</Pill></div><div className="mt-3 text-sm text-slate-600"><div>Type: {String(item.application_type||'').replaceAll('_',' ')}</div><div>Submitted: {date(item.created_at)}</div>{item.rejection_reason&&<div className="mt-2 rounded-lg bg-rose-50 p-2 text-rose-700">{item.rejection_reason}</div>}</div></div>)}</div>:<Empty>No professional applications yet.</Empty>}</div>}

          {section==='moderation' && <div><Heading title="Moderation Queue" subtitle="Pending community, story and review content in one place."/>{moderation.length?<div className="space-y-3">{moderation.map(item=><div key={`${item.content_type}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-slate-400">{String(item.content_type||'').replaceAll('_',' ')}</p><p className="mt-1 font-bold">{item.title||'Untitled content'}</p></div><Pill tone={statusTone(item.status)}>{item.status}</Pill></div>{item.excerpt&&<p className="mt-3 text-sm leading-6 text-slate-600">{item.excerpt}</p>}<p className="mt-3 text-xs text-slate-400">Submitted {date(item.created_at)}</p></div>)}</div>:<Empty>No items waiting in moderation.</Empty>}</div>}

          {section==='system' && <div><Heading title="System" subtitle="Administrator roles, AI usage and migration history. Secrets and credentials are never displayed."/><div className="grid gap-6 lg:grid-cols-3"><Panel title="AI Usage — 30 Days" className="lg:col-span-2">{(data?.system?.aiUsage30d||[]).length?<div className="space-y-2">{data.system.aiUsage30d.map(item=><div key={item.feature} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="font-semibold">{item.feature}</span><span className="text-sm text-slate-500">{number(item.uses)} uses · {number(item.users)} users</span></div>)}</div>:<Empty>No AI usage recorded.</Empty>}</Panel><Panel title="Auth Roles">{(data?.system?.authRoles||[]).map(item=><div key={item.role} className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="capitalize">{item.role}</span><strong>{number(item.count)}</strong></div>)}</Panel></div><Panel title="Migration History" className="mt-6">{(data?.system?.migrations||[]).length?<div className="space-y-2">{data.system.migrations.map(item=><div key={`${item.migration_key}-${item.applied_at}`} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-sm font-semibold">{item.migration_key}</span><span className="text-xs text-slate-400">{date(item.applied_at)}</span></div>{item.notes&&<p className="mt-1 text-xs text-slate-500">{item.notes}</p>}</div>)}</div>:<Empty>No migration records found.</Empty>}</Panel></div>}
        </div>
      </main>
    </div>
  );
}
