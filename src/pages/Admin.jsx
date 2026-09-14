import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  Heart,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { getAdminDashboard } from '../lib/adminService';

const sections = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'plans', label: 'Plans & Billing', icon: CreditCard },
  { id: 'applications', label: 'Applications', icon: FileCheck2 },
  { id: 'moderation', label: 'Moderation', icon: MessageSquareText },
  { id: 'love-notes', label: 'Love Notes', icon: Heart },
  { id: 'system', label: 'System', icon: Activity },
];

function cx(...values) {
  return values.filter(Boolean).join(' ');
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function money(value, currency = 'USD') {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'USD').toUpperCase() }).format(amount);
}

function date(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function Pill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', tones[tone] || tones.slate)}>{children}</span>;
}

function statusTone(value) {
  const status = String(value || '').toLowerCase();
  if (['active', 'approved', 'paid', 'succeeded', 'success', 'published', 'sent'].includes(status)) return 'green';
  if (['pending', 'trial', 'trialing', 'unpublished'].includes(status)) return 'amber';
  if (['failed', 'rejected', 'banned', 'inactive', 'cancelled', 'canceled', 'past_due'].includes(status)) return 'red';
  return 'slate';
}

function StatCard({ icon: Icon, label, value, note, tone = 'rose' }) {
  const toneMap = {
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
        </div>
        <div className={cx('rounded-xl p-2.5', toneMap[tone] || toneMap.rose)}><Icon size={20} /></div>
      </div>
    </div>
  );
}

function TableShell({ children }) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">{children}</div>;
}

function Empty({ children = 'No records yet.' }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{children}</div>;
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setData(await getAdminDashboard());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(false); }, []);

  const filteredMembers = useMemo(() => {
    const members = data?.members || [];
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) => [member.name, member.email, member.location, member.subscription_plan, member.user_type]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(needle)));
  }, [data, query]);

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Loader2 className="animate-spin text-rose-500" size={32} />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Verifying administrator access</h1>
          <p className="mt-2 text-sm text-slate-500">Loading the private One2OneLove operations dashboard.</p>
        </div>
      </div>
    );
  }

  if (error) {
    const unauthorized = error.status === 401;
    return (
      <div className="min-h-[70vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><LockKeyhole /></div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">{unauthorized ? 'Sign in required' : 'Administrator access required'}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{unauthorized ? 'Sign in with an authorized One2OneLove administrator account to continue.' : 'This dashboard is restricted to accounts carrying the administrator role.'}</p>
          <button onClick={() => navigate(unauthorized ? '/SignIn' : '/Home')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">
            <ArrowLeft size={16} /> {unauthorized ? 'Go to Sign In' : 'Back to One2OneLove'}
          </button>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const userSummary = summary.users || {};
  const applications = data?.applications || [];
  const moderation = data?.moderation || [];
  const payments = data?.billing?.payments || [];
  const movements = data?.billing?.changes || [];
  const loveNotes = data?.loveNotes || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-600"><ShieldCheck size={17} /> One2OneLove Admin</div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Operations Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">Members, plans, Love Notes, applications, moderation, billing records and system activity.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="blue">Read-only preview</Pill>
              <button onClick={() => load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
              </button>
              <button onClick={() => navigate('/Home')} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"><ArrowLeft size={16} /> Exit</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)} className={cx('inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', section === id ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {section === 'overview' && (
          <div>
            <SectionHeader title="Overview" subtitle="The Trend2Content-style control view, adapted to the actual One2OneLove data model." />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Users} label="Total Members" value={number(userSummary.total)} note={`${number(userSummary.new_7d)} joined in the last 7 days`} />
              <StatCard icon={FileCheck2} label="Pending Applications" value={number(summary.applications?.pending_total)} note="Licensed, professional and contributor applications" tone="blue" />
              <StatCard icon={MessageSquareText} label="Moderation Queue" value={number(summary.moderation?.pending_total)} note="Stories, posts, comments and reviews" tone="amber" />
              <StatCard icon={Heart} label="Love Notes Sent" value={number(summary.loveNotes?.sent_total)} note={`${number(summary.loveNotes?.sent_30d)} in the last 30 days`} tone="violet" />
              <StatCard icon={Clock3} label="Scheduled Love Notes" value={number(summary.loveNotes?.scheduled_pending)} note={`${number(summary.loveNotes?.scheduled_failed)} failed delivery records`} tone="green" />
              <StatCard icon={CreditCard} label="Payments Recorded" value={number(summary.payments?.recorded_payments)} note={`${number(summary.payments?.payments_this_month)} this month`} tone="blue" />
              <StatCard icon={MessageSquareText} label="Community Posts" value={number(summary.community?.posts)} note={`${number(summary.community?.communities)} communities`} tone="violet" />
              <StatCard icon={UserCheck} label="Verified Profiles" value={number(userSummary.verified)} note={`${number(userSummary.inactive)} inactive profiles`} tone="green" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">Tier Breakdown</h3>
                <p className="mt-1 text-sm text-slate-500">A quick view of current plan distribution.</p>
                <div className="mt-4 space-y-3">
                  {(summary.plans || []).length ? summary.plans.map((plan) => (
                    <div key={plan.plan} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span className="font-medium text-slate-700">{plan.plan}</span><span className="text-lg font-bold text-slate-900">{number(plan.count)}</span>
                    </div>
                  )) : <Empty>No tier records yet.</Empty>}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">Love Note Delivery Health</h3>
                <p className="mt-1 text-sm text-slate-500">Useful for the scheduled Love Notes feature as delivery providers are connected.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-medium text-emerald-700">Sent</p><p className="mt-1 text-2xl font-bold text-emerald-900">{number(summary.loveNotes?.sent_total)}</p></div>
                  <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-medium text-amber-700">Pending</p><p className="mt-1 text-2xl font-bold text-amber-900">{number(summary.loveNotes?.scheduled_pending)}</p></div>
                  <div className="rounded-xl bg-rose-50 p-4"><p className="text-xs font-medium text-rose-700">Failed</p><p className="mt-1 text-2xl font-bold text-rose-900">{number(summary.loveNotes?.scheduled_failed)}</p></div>
                  <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-medium text-blue-700">Due now</p><p className="mt-1 text-2xl font-bold text-blue-900">{number(summary.loveNotes?.due_now)}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 'members' && (
          <div>
            <SectionHeader title="Members" subtitle="Recent signups, account status and current access level — one of the most useful ideas carried over from the Trend2Content admin dashboard." />
            <div className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><Search size={17} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, plan or location" className="w-full bg-transparent text-sm outline-none" /></div>
            <TableShell>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((member) => <tr key={member.id} className="align-top"><td className="px-4 py-3"><div className="font-semibold text-slate-900">{member.name || 'Unnamed member'}</div><div className="text-xs text-slate-500">{member.email}</div>{member.location && <div className="mt-1 text-xs text-slate-400">{member.location}</div>}</td><td className="px-4 py-3 text-slate-600">{member.user_type || 'user'}</td><td className="px-4 py-3"><Pill tone="blue">{member.subscription_plan || 'Basis'}</Pill></td><td className="px-4 py-3"><Pill tone={member.banned ? 'red' : statusTone(member.subscription_status)}>{member.banned ? 'banned' : member.subscription_status || 'active'}</Pill></td><td className="px-4 py-3 whitespace-nowrap text-slate-500">{date(member.created_at)}</td></tr>)}
                </tbody>
              </table>
            </TableShell>
          </div>
        )}

        {section === 'plans' && (
          <div>
            <SectionHeader title="Plans & Billing" subtitle="Tier distribution, plan movements and payment records. Paid cancellations/refunds remain Stripe-controlled rather than duplicated here." />
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <h3 className="mb-3 font-bold text-slate-900">Tier Movements</h3>
                {movements.length ? <TableShell><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Movement</th><th className="px-4 py-3">Effective</th></tr></thead><tbody className="divide-y divide-slate-100">{movements.map((item) => <tr key={item.id}><td className="px-4 py-3"><div className="font-medium text-slate-800">{item.email || item.user_id}</div><div className="text-xs text-slate-400">{item.change_type || 'plan change'}</div></td><td className="px-4 py-3 text-slate-600">{item.from_plan || '—'} → {item.to_plan || '—'}</td><td className="px-4 py-3 whitespace-nowrap text-slate-500">{date(item.effective_date || item.created_at)}</td></tr>)}</tbody></table></TableShell> : <Empty>No plan movements recorded yet.</Empty>}
              </div>
              <div>
                <h3 className="mb-3 font-bold text-slate-900">Recent Payments</h3>
                {payments.length ? <TableShell><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{payments.map((item) => <tr key={item.id}><td className="px-4 py-3"><div className="font-medium text-slate-800">{item.email || item.user_id}</div><div className="text-xs text-slate-400">{item.subscription_plan || '—'}</div></td><td className="px-4 py-3 font-semibold text-slate-800">{money(item.amount, item.currency)}</td><td className="px-4 py-3"><Pill tone={statusTone(item.status)}>{item.status || 'unknown'}</Pill></td><td className="px-4 py-3 whitespace-nowrap text-slate-500">{date(item.created_at)}</td></tr>)}</tbody></table></TableShell> : <Empty>No payment records yet.</Empty>}
              </div>
            </div>
          </div>
        )}

        {section === 'applications' && (
          <div>
            <SectionHeader title="Professional Applications" subtitle="Review the incoming licensed professional, relationship professional and contributor pipeline." />
            {applications.length ? <div className="grid gap-4 lg:grid-cols-2">{applications.map((item) => <div key={`${item.application_type}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{item.applicant_name || 'Unnamed applicant'}</p><p className="text-sm text-slate-500">{item.email || 'No email'}</p></div><Pill tone={statusTone(item.status)}>{item.status}</Pill></div><div className="mt-4 grid gap-2 text-sm text-slate-600"><div><span className="font-medium text-slate-700">Type:</span> {String(item.application_type || '').replaceAll('_', ' ')}</div><div><span className="font-medium text-slate-700">Submitted:</span> {date(item.created_at)}</div>{item.rejection_reason && <div className="rounded-lg bg-rose-50 p-2 text-rose-700">{item.rejection_reason}</div>}</div></div>)}</div> : <Empty>No professional applications yet.</Empty>}
          </div>
        )}

        {section === 'moderation' && (
          <div>
            <SectionHeader title="Moderation Queue" subtitle="Pending community and review content collected into one operations queue." />
            {moderation.length ? <div className="space-y-3">{moderation.map((item) => <div key={`${item.content_type}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{String(item.content_type || '').replaceAll('_', ' ')}</p><p className="mt-1 font-bold text-slate-900">{item.title || 'Untitled content'}</p></div><Pill tone={statusTone(item.status)}>{item.status}</Pill></div>{item.excerpt && <p className="mt-3 text-sm leading-6 text-slate-600">{item.excerpt}</p>}<p className="mt-3 text-xs text-slate-400">Submitted {date(item.created_at)}</p></div>)}</div> : <Empty>No items currently waiting in moderation.</Empty>}
          </div>
        )}

        {section === 'love-notes' && (
          <div>
            <SectionHeader title="Love Notes Operations" subtitle="Delivery status, scheduled volume and failures — especially important because Love Notes are becoming a major One2OneLove retention feature." />
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard icon={Heart} label="All Sent" value={number(loveNotes.sent?.total)} note={`${number(loveNotes.sent?.sent_7d)} in the last 7 days`} />
              <StatCard icon={Clock3} label="Scheduled" value={number(summary.loveNotes?.scheduled_total)} note={`${number(summary.loveNotes?.scheduled_pending)} pending`} tone="amber" />
              <StatCard icon={AlertTriangle} label="Failed" value={number(summary.loveNotes?.scheduled_failed)} note="Investigate delivery/provider problems" tone="rose" />
            </div>
            {(loveNotes.recent || []).length ? <TableShell><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Note</th><th className="px-4 py-3">Delivery</th><th className="px-4 py-3">Scheduled</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{loveNotes.recent.map((item) => <tr key={item.id}><td className="px-4 py-3"><div className="font-semibold text-slate-900">{item.note_title || 'Love Note'}</div><div className="text-xs text-slate-500">{item.email || item.user_id}</div></td><td className="px-4 py-3 text-slate-600">{item.delivery_method || '—'}{item.recipient_phone_masked && <div className="text-xs text-slate-400">{item.recipient_phone_masked}</div>}</td><td className="px-4 py-3 whitespace-nowrap text-slate-500">{item.scheduled_date || '—'} {item.scheduled_time || ''}<div className="text-xs text-slate-400">{item.scheduled_timezone || ''}</div></td><td className="px-4 py-3"><Pill tone={statusTone(item.status)}>{item.status || 'unknown'}</Pill>{item.failure_reason && <div className="mt-1 max-w-xs text-xs text-rose-600">{item.failure_reason}</div>}</td></tr>)}</tbody></table></TableShell> : <Empty>No scheduled Love Notes yet.</Empty>}
          </div>
        )}

        {section === 'system' && (
          <div>
            <SectionHeader title="System & AI" subtitle="Migration history, administrator roles and AI usage. No secrets or private credentials are shown here." />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"><h3 className="flex items-center gap-2 font-bold text-slate-900"><Sparkles size={17} className="text-violet-500" /> AI Usage — Last 30 Days</h3><div className="mt-4 space-y-2">{(data?.system?.aiUsage30d || []).length ? data.system.aiUsage30d.map((item) => <div key={item.feature} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="font-medium text-slate-700">{item.feature}</span><span className="text-sm text-slate-500">{number(item.uses)} uses · {number(item.users)} users</span></div>) : <Empty>No AI usage recorded yet.</Empty>}</div></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-bold text-slate-900">Auth Roles</h3><div className="mt-4 space-y-2">{(data?.system?.authRoles || []).map((item) => <div key={item.role} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="capitalize text-slate-700">{item.role}</span><span className="font-bold text-slate-900">{number(item.count)}</span></div>)}</div></div>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-bold text-slate-900">Migration History</h3><div className="mt-4 space-y-2">{(data?.system?.migrations || []).length ? data.system.migrations.map((item) => <div key={`${item.migration_key}-${item.applied_at}`} className="rounded-xl bg-slate-50 px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-sm font-semibold text-slate-800">{item.migration_key}</span><span className="text-xs text-slate-400">{date(item.applied_at)}</span></div>{item.notes && <p className="mt-1 text-xs text-slate-500">{item.notes}</p>}</div>) : <Empty>No migration records found.</Empty>}</div></div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <div className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0" size={18} /><div><span className="font-semibold">Safety boundary:</span> this preview dashboard is intentionally read-only. It can monitor users, plans, Love Notes, applications, moderation and billing records, but it cannot cancel subscriptions, issue refunds, ban users or change plan access.</div></div>
        </div>
      </div>
    </div>
  );
}
