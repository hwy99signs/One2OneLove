import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, BarChart3, CreditCard, Heart, Loader2, LockKeyhole,
  RefreshCw, TrendingUp, Users,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getAdminAnalytics } from '../lib/adminService';
import { touchAdminMfa } from '../lib/adminMfaService';
import { featureForPath, prettifyRoute, controlTypeName, clickAudienceLabel } from '../lib/interactionAnalytics';
import { ADMIN_IDLE_LIMIT_MS, isIdleFor } from '../lib/activityGuard';

const AUTO_REFRESH_MS = 15 * 60 * 1000;

function number(value) { return Number(value || 0).toLocaleString(); }
function shortDate(value) {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function shortDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString(undefined, { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
}
// Recent Click Details display derivation. New clicks are always stored
// with a name (client derivation + server backstop), so a row reaching this
// fallback has NO stored label — it was recorded before complete labeling,
// and the panel says so honestly while still showing the best name the
// stored facts (destination, route, control type) support. No row renders
// without a name.
function storedDestinationName(destination) {
  const text = String(destination || '').trim();
  if (!text) return null;
  if (text.startsWith('external:')) {
    const host = text.slice('external:'.length).trim();
    return host ? `External — ${host}` : null;
  }
  return featureForPath(text) || prettifyRoute(text);
}
function clickDisplayName(row) {
  if (row.control_key) return row.control_key;
  const place = storedDestinationName(row.destination)
    || featureForPath(row.route)
    || prettifyRoute(row.route);
  return `${place} — ${controlTypeName(row.control_type)} (older event)`;
}
function clickFeatureDestination(row) {
  if (row.feature) return row.feature;
  if (row.destination && !String(row.destination).startsWith('external:')) {
    const named = featureForPath(row.destination);
    if (named) return named;
  }
  if (row.destination) return row.destination;
  return featureForPath(row.route) || '—';
}

function Panel({ title, subtitle, children }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-bold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{children}</section>;
}
function Metric({ icon: Icon, label, value, note }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-black text-slate-900">{value}</p>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</div><div className="rounded-xl bg-rose-50 p-2.5 text-rose-600"><Icon size={20}/></div></div></div>;
}
function ChartFrame({ children, height = 300 }) {
  return <div style={{ height }} className="w-full">{children}</div>;
}

// "Most-Used Features" is a labeled bar list, not a Recharts category-axis
// chart: Recharts drops category labels that would overlap (default
// interval="preserveEnd"), which hid feature names while their bars kept
// rendering. Here every feature prints its full name once, each series gets
// its own bar, and the value is printed at the end of the bar — no bar can
// render without a name or a readable number. Stored feature values are
// already display names; anything unexpected shows its raw value rather
// than disappearing.
const FEATURE_RANK_SERIES = [
  { key: 'page_views', name: 'Feature opens', color: '#e11d48' },
  { key: 'clicks', name: 'Clicks', color: '#2563eb' },
  { key: 'actions', name: 'Actions', color: '#059669' },
];
function FeatureRankList({ rows }) {
  const list = rows || [];
  if (!list.length) return <div className="py-8 text-center text-sm text-slate-500">No feature activity has been recorded in this 30-day window yet.</div>;
  const max = Math.max(1, ...list.flatMap(row => FEATURE_RANK_SERIES.map(series => Number(row[series.key] || 0))));
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1">
        {FEATURE_RANK_SERIES.map(series => (
          <span key={series.key} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: series.color }} />{series.name}</span>
        ))}
      </div>
      <div className="space-y-4">
        {list.map((row, index) => (
          <div key={`${row.feature || 'unnamed'}-${index}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm font-bold text-slate-900">{row.feature || 'Unnamed feature'}</p>
              <p className="text-xs text-slate-500">{number(row.activity)} total · {number(row.users)} unique visitors / users</p>
            </div>
            <div className="mt-1.5 space-y-1">
              {FEATURE_RANK_SERIES.map(series => {
                const value = Number(row[series.key] || 0);
                return (
                  <div key={series.key} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-xs text-slate-500">{series.name}</span>
                    <div className="h-3.5 min-w-0 flex-1 rounded bg-slate-100">
                      <div className="h-3.5 rounded" style={{ width: `${value ? Math.max(1.5, (value / max) * 100) : 0}%`, background: series.color }} />
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs font-bold text-slate-900">{number(value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EdgeStat({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{number(value)}</p></div>;
}

// "At the Door — Cloudflare Counts": the edge view of the same traffic the
// Site Usage panel records from inside the app. Cloudflare counts every
// arrival (bots, crawlers and link previews included), so these numbers
// always run higher — the panel says so in its own subtitle rather than
// letting the gap look like missing data. Days are Cloudflare's UTC days,
// shown as reported. When the Cloudflare connection is not configured on
// this Worker yet, the panel renders a calm explanation naming the exact
// missing setting — never an error dump.
function EdgeCountsPanel({ edge, tooltipStyle }) {
  const definition = 'Counts every arrival at the site, including bots, crawlers and link previews. These numbers will always be higher than the visitor activity recorded inside the site.';
  if (!edge || !edge.connected) {
    const missing = Array.isArray(edge?.missing) && edge.missing.length
      ? edge.missing
      : ['CLOUDFLARE_ANALYTICS_TOKEN', 'CLOUDFLARE_ZONE_ID'];
    return (
      <Panel title="At the Door — Cloudflare Counts" subtitle={definition}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-slate-900">Edge counts not connected yet</p>
          {edge?.reason === 'unavailable' ? (
            <p className="mt-1">Cloudflare did not return counts on the last check. Nothing is broken on the site — this panel tries again on the next refresh.</p>
          ) : (
            <p className="mt-1">This panel lights up once {missing.map((name, index) => (<span key={name}>{index > 0 ? ' and ' : ''}<code className="rounded bg-slate-200/70 px-1.5 py-0.5 text-xs font-semibold text-slate-800">{name}</code></span>))} {missing.length === 1 ? 'is' : 'are'} added to this Worker&rsquo;s settings. Until then there is nothing to show here — the in-site counts above keep working as always.</p>
          )}
        </div>
      </Panel>
    );
  }
  return (
    <Panel title="At the Door — Cloudflare Counts" subtitle={definition}>
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Today so far · {shortDate(edge.today?.date)}</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <EdgeStat label="Visits (unique visitors)" value={edge.today?.visits}/>
        <EdgeStat label="Pageviews" value={edge.today?.pageViews}/>
        <EdgeStat label="Requests" value={edge.today?.requests}/>
      </div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Last 30 days</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <EdgeStat label="Visits (unique visitors)" value={edge.totals?.visits}/>
        <EdgeStat label="Pageviews" value={edge.totals?.pageViews}/>
        <EdgeStat label="Requests" value={edge.totals?.requests}/>
      </div>
      <ChartFrame height={300}><ResponsiveContainer width="100%" height="100%"><LineChart data={edge.days || []} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Legend/><Line type="monotone" dataKey="requests" name="Requests" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="pageViews" name="Pageviews" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="visits" name="Visits" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
      <p className="mt-4 text-xs leading-5 text-slate-500">Days are Cloudflare&rsquo;s own days (UTC), shown exactly as Cloudflare reports them; today&rsquo;s row is still counting. Counts refresh about every 15 minutes.</p>
    </Panel>
  );
}

export default function Analytics() {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [error,setError] = useState(null);
  const [refreshError,setRefreshError] = useState(null);
  const dataRef = useRef(null);
  const loadInFlightRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  const load = async (refresh=false) => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    refresh ? setRefreshing(true) : setLoading(true);
    if (!refresh) setError(null);
    try {
      const next = await getAdminAnalytics();
      setData(next);
      dataRef.current = next;
      lastRefreshAtRef.current = Date.now();
      setError(null);
    } catch (err) {
      if (!refresh || !dataRef.current || [401,403].includes(err?.status)) setError(err);
      else {
        setRefreshError(err);
        console.warn('Analytics refresh failed; displayed values may be stale.', err);
      }
    } finally {
      loadInFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { load(false); }, []);

  useEffect(() => {
    let active = true;
    const refreshIfDue = () => {
      if (!active || document.visibilityState !== 'visible') return;
      if (isIdleFor(ADMIN_IDLE_LIMIT_MS)) return;
      if (Date.now() - Number(lastRefreshAtRef.current || 0) >= AUTO_REFRESH_MS) load(true);
    };
    const timer = window.setInterval(refreshIfDue, AUTO_REFRESH_MS);
    document.addEventListener('visibilitychange', refreshIfDue);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfDue);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const keepAdminSessionAlive = () => {
      if (!active || document.visibilityState !== 'visible') return;
      touchAdminMfa().catch(err => {
        setRefreshError(current => current || err);
        console.warn('Analytics Admin session heartbeat missed.', err);
      });
    };
    keepAdminSessionAlive();
    const timer = window.setInterval(keepAdminSessionAlive, 10 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const signupTotal = useMemo(() => (data?.signups || []).reduce((sum,row)=>sum+Number(row.signups||0),0),[data]);
  const directTotal = useMemo(() => (data?.loveNotes || []).reduce((sum,row)=>sum+Number(row.direct_sent||0),0),[data]);
  const scheduledTotal = useMemo(() => (data?.loveNotes || []).reduce((sum,row)=>sum+Number(row.scheduled||0),0),[data]);
  const featureTotal = useMemo(() => (data?.featureDailyAll || []).reduce((sum,row)=>sum+Number(row.events||0),0),[data]);
  const languageRows = useMemo(() => {
    const rows = data?.languageUsage || [];
    const knownEvents = rows.reduce((sum,row)=>sum+Number(row.total_events||0),0);
    return rows.map(row => ({
      ...row,
      share: knownEvents ? Math.round((Number(row.total_events||0) / knownEvents) * 1000) / 10 : 0,
    }));
  },[data]);
  const languageChartMax = useMemo(() => {
    const rawMax = Math.max(0,...languageRows.flatMap(row => [
      Number(row.unique_visitors||0),
      Number(row.page_views||0),
      Number(row.clicks||0),
      Number(row.actions||0),
    ]));
    return Math.max(100, Math.ceil(rawMax / 100) * 100);
  },[languageRows]);
  const languageMinorTicks = useMemo(() => Array.from(
    { length: Math.floor(languageChartMax / 10) + 1 },
    (_, i) => i * 10
  ),[languageChartMax]);
  const languageMajorTicks = useMemo(() => languageMinorTicks.filter(value => value % 100 === 0),[languageMinorTicks]);
  const trafficRows = useMemo(() => {
    return [...(data?.trafficSources || [])]
      .map(row => ({
        ...row,
        engagement_rate: Number(row.landings||0)
          ? Math.round((Number(row.engaged_sessions||0) / Number(row.landings||0)) * 1000) / 10
          : 0,
      }))
      .sort((a,b) => Number(b.unique_visitors||0) - Number(a.unique_visitors||0) || Number(b.landings||0) - Number(a.landings||0));
  },[data]);
  const topTrafficSource = trafficRows.find(row => Number(row.unique_visitors||0) > 0) || null;

  if (loading) return <div className="min-h-screen bg-slate-50 grid place-items-center p-4"><div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><Loader2 className="mx-auto animate-spin text-rose-500" size={34}/><h1 className="mt-4 text-xl font-bold">Loading Analytics</h1><p className="mt-2 text-sm text-slate-500">Building your One2OneLove trend view.</p></div></div>;
  if (error) {
    const unauthorized=error.status===401;
    return <div className="min-h-screen bg-slate-50 grid place-items-center p-4"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><LockKeyhole className="mx-auto text-rose-600" size={38}/><h1 className="mt-4 text-xl font-bold">{unauthorized?'Sign in required':'Administrator access required'}</h1><p className="mt-2 text-sm text-slate-500">Analytics is restricted to an authorized One2OneLove administrator account.</p><button onClick={()=>window.location.assign(unauthorized?'/SignIn':'/Admin')} className="mt-6 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Go back</button></div></div>;
  }

  const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0' };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3"><button onClick={()=>window.location.assign('/Admin')} className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"><ArrowLeft size={18}/></button><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">One2OneLove Admin</p><h1 className="text-xl font-black">Analytics</h1></div></div>
          <div className="flex items-center gap-2"><span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline">Auto-refresh · 15 min</span><button onClick={()=>load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={refreshing?'animate-spin':''}/>Refresh</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {refreshError && <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>Analytics refresh needs attention.</strong> The values below may be from the last successful refresh. Use Refresh; if Admin verification is requested, complete it and return here.</div>}
        <div className="mb-6"><h2 className="text-2xl font-black tracking-tight">30-Day Trend View</h2><p className="mt-1 text-sm text-slate-500">Graphs are built from actual One2OneLove records and feature-use events. They will become more meaningful as launch traffic grows.</p></div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} label="New Signups" value={number(signupTotal)} note="last 30 days"/>
          <Metric icon={Heart} label="Direct Love Notes" value={number(directTotal)} note="sent in last 30 days"/>
          <Metric icon={TrendingUp} label="Scheduled Love Notes" value={number(scheduledTotal)} note="created in last 30 days"/>
          <Metric icon={BarChart3} label="Tracked Feature Activity" value={number(featureTotal)} note="all visitors · opens + clicks + actions · last 30 days"/>
        </div>

        <div className="mt-6">
          <Panel title="Site Usage — All Visitors" subtitle="Rolling 30-day view of the entire public One2OneLove site. Includes anonymous Open House visitors and registered members; administrator activity is excluded.">
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Page Views</p><p className="mt-1 text-2xl font-black text-slate-900">{number(data?.siteUsageSummary?.page_views)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Meaningful Clicks</p><p className="mt-1 text-2xl font-black text-slate-900">{number(data?.siteUsageSummary?.clicks)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Unique Users / Visitors</p><p className="mt-1 text-2xl font-black text-slate-900">{number(data?.siteUsageSummary?.unique_visitors)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Anonymous Visitors</p><p className="mt-1 text-2xl font-black text-slate-900">{number(data?.siteUsageSummary?.anonymous_visitors)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Registered Users</p><p className="mt-1 text-2xl font-black text-slate-900">{number(data?.siteUsageSummary?.registered_users)}</p></div>
            </div>
            <ChartFrame height={340}><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.siteUsage||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Legend/><Line type="monotone" dataKey="page_views" name="Page views" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="clicks" name="Clicks" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="visitors" name="Unique visitors / day" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
          </Panel>
        </div>

        <div className="mt-6">
          <EdgeCountsPanel edge={data?.edgeCounts} tooltipStyle={tooltipStyle}/>
        </div>

        <div className="mt-6">
          <Panel title="Traffic by Platform" subtitle="Rolling 30-day attribution for the source that brought each visit to One2OneLove. UTM source is used when present; otherwise a privacy-safe referring-platform match is used.">
            {topTrafficSource && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Top Traffic Source</p>
              <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1"><p className="text-2xl font-black text-slate-900">{topTrafficSource.label}</p><p className="text-sm font-semibold text-slate-600">{number(topTrafficSource.unique_visitors)} unique visitors · {number(topTrafficSource.landings)} visits</p></div>
            </div>}
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <ChartFrame height={390}><ResponsiveContainer width="100%" height="100%"><BarChart data={trafficRows} layout="vertical" margin={{ top: 5,right: 15,left: 18,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="label" width={80}/><Tooltip contentStyle={tooltipStyle}/><Legend/><Bar dataKey="unique_visitors" name="Unique visitors"/><Bar dataKey="landings" name="Visits"/></BarChart></ResponsiveContainer></ChartFrame>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500"><th className="px-3 py-2">Source</th><th className="px-3 py-2 text-right">Visitors</th><th className="px-3 py-2 text-right">Visits</th><th className="px-3 py-2 text-right">Views</th><th className="px-3 py-2 text-right">Clicks</th><th className="px-3 py-2 text-right">Engaged</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{trafficRows.map(row=><tr key={row.source}><td className="px-3 py-3 font-semibold text-slate-900">{row.label}</td><td className="px-3 py-3 text-right font-bold">{number(row.unique_visitors)}</td><td className="px-3 py-3 text-right">{number(row.landings)}</td><td className="px-3 py-3 text-right">{number(row.page_views)}</td><td className="px-3 py-3 text-right">{number(row.clicks)}</td><td className="px-3 py-3 text-right font-bold">{Number(row.engagement_rate||0).toLocaleString(undefined,{maximumFractionDigits:1})}%</td></tr>)}</tbody>
                </table>
              </div>
            </div>
            {Number(data?.trafficSourceUnknownEvents||0)>0 && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">{number(data.trafficSourceUnknownEvents)} older interaction events were recorded before traffic-source attribution was enabled. They are left unclassified rather than guessed.</div>}
            <p className="mt-4 text-xs leading-5 text-slate-500">For the cleanest ad comparison, use links with standard <span className="font-semibold">utm_source</span> values such as facebook, instagram, threads, tiktok, x, youtube, linkedin or pinterest. Direct means no external source was available; Other means an external source was present but did not match one of those platforms.</p>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title="Usage by Language" subtitle="Shows the interface language active when each page view, click or meaningful feature action occurred. A person who actively uses more than one language can appear in more than one language's unique-user count.">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <ChartFrame height={330}><ResponsiveContainer width="100%" height="100%"><BarChart data={languageRows} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="2 4" opacity={0.28}/><XAxis dataKey="label"/><YAxis allowDecimals={false} domain={[0,languageChartMax]} ticks={languageMinorTicks} interval={0} tickFormatter={(value)=>value%100===0?value:''}/>{languageMajorTicks.map(value=><ReferenceLine key={value} y={value} strokeWidth={1.4}/>) }<Tooltip contentStyle={tooltipStyle}/><Legend/><Bar dataKey="unique_visitors" name="Unique users / visitors"/><Bar dataKey="page_views" name="Page views"/><Bar dataKey="clicks" name="Clicks"/><Bar dataKey="actions" name="Actions"/></BarChart></ResponsiveContainer></ChartFrame>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500"><th className="px-3 py-2">Language</th><th className="px-3 py-2 text-right">Users / Visitors</th><th className="px-3 py-2 text-right">Registered</th><th className="px-3 py-2 text-right">Anonymous</th><th className="px-3 py-2 text-right">Views</th><th className="px-3 py-2 text-right">Clicks</th><th className="px-3 py-2 text-right">Actions</th><th className="px-3 py-2 text-right">Usage Share</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{languageRows.map(row=><tr key={row.language}><td className="px-3 py-3 font-semibold text-slate-900">{row.label}</td><td className="px-3 py-3 text-right font-bold">{number(row.unique_visitors)}</td><td className="px-3 py-3 text-right">{number(row.registered_users)}</td><td className="px-3 py-3 text-right">{number(row.anonymous_visitors)}</td><td className="px-3 py-3 text-right">{number(row.page_views)}</td><td className="px-3 py-3 text-right">{number(row.clicks)}</td><td className="px-3 py-3 text-right">{number(row.actions)}</td><td className="px-3 py-3 text-right font-bold">{Number(row.share||0).toLocaleString(undefined,{maximumFractionDigits:1})}%</td></tr>)}</tbody>
                </table>
              </div>
            </div>
            {Number(data?.languageUnknownEvents||0)>0 && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">{number(data.languageUnknownEvents)} interaction events in this 30-day window were recorded before language attribution was enabled, so they are intentionally not guessed into one of the five languages.</div>}
            <p className="mt-4 text-xs leading-5 text-slate-500">Languages tracked: English, Spanish, French, Italian and German. Language tracking applies to both anonymous and registered traffic.</p>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title="Recent Click Details" subtitle="The most recent on-site clicks from non-admin visitors. Every new click is recorded with a name — a control without its own label is named from its text, its destination, or its page. Rows marked (older event) were recorded before complete labeling; they show the best name their stored page and destination support.">
            {/* Vertical scroll window: sticky header + exactly 12 rows visible. Header = 16px line (text-xs) + 16px padding (py-2) + 1px border = 33px; row = 20px line (text-sm) + 24px padding (py-3) = 44px; 33 + 12 x 44 = 561px. */}
            <div className="overflow-auto" style={{ maxHeight: 561 }}>
              <table className="min-w-full text-sm">
                <thead><tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500"><th className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2">Time</th><th className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2">Audience</th><th className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2">Source</th><th className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2">Page</th><th className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2">Clicked</th><th className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2">Feature / Destination</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{(data?.recentClicks||[]).map((row,index)=><tr key={`${row.created_at}-${index}`}><td className="whitespace-nowrap px-3 py-3">{shortDateTime(row.created_at)}</td><td className="px-3 py-3">{clickAudienceLabel(row)}</td><td className="px-3 py-3">{row.traffic_source||'Unclassified'}</td><td className="px-3 py-3 font-medium">{row.route||'—'}</td><td className="px-3 py-3 font-semibold">{clickDisplayName(row)}</td><td className="px-3 py-3">{clickFeatureDestination(row)}</td></tr>)}</tbody>
              </table>
              {!(data?.recentClicks||[]).length && <div className="py-8 text-center text-sm text-slate-500">No non-admin clicks have been recorded in this 30-day window yet.</div>}
            </div>
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Panel title="Member Signups" subtitle="Daily new One2OneLove accounts.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.signups||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Line type="monotone" dataKey="signups" name="Signups" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
          </Panel>

          <Panel title="Love Notes Usage" subtitle="Direct sends compared with notes added to the scheduler.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.loveNotes||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Legend/><Line type="monotone" dataKey="direct_sent" name="Direct sent" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="scheduled" name="Scheduled" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
          </Panel>

          <Panel title="Scheduled Love Note Delivery Health" subtitle="Daily passed, failed and pending scheduled deliveries.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.scheduledHealth||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Legend/><Bar dataKey="passed" name="Passed"/><Bar dataKey="failed" name="Failed"/><Bar dataKey="pending" name="Pending"/></BarChart></ResponsiveContainer></ChartFrame>
          </Panel>

          <Panel title="Most-Used Features — All Visitors" subtitle="Actual feature opens, clicks and meaningful feature actions from anonymous visitors, registered-free users and subscribers. Admin activity is excluded.">
            <FeatureRankList rows={data?.featureRankAll || []} />
          </Panel>

          <Panel title="Daily Feature Activity — All Visitors" subtitle="Shows feature opens, ordinary clicks and meaningful actions such as opening a podcast, using an LGBTQ+ resource or selecting a Love Note category.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.featureDailyAll||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Legend/><Line type="monotone" dataKey="page_views" name="Feature opens" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="clicks" name="Clicks" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="actions" name="Actions" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="users" name="Unique visitors / users" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
          </Panel>

          <Panel title="Community Activity" subtitle="Daily posts and comments.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.community||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Legend/><Line type="monotone" dataKey="posts" name="Posts" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="comments" name="Comments" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
          </Panel>

          <Panel title="Payment Activity" subtitle="Daily billing records created during the last 30 days.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.payments||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Line type="monotone" dataKey="payments" name="Payments" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
          </Panel>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900"><div className="flex items-start gap-3"><CreditCard className="mt-0.5 shrink-0" size={18}/><div><strong>Direct-send delivery status:</strong> Sent is already measurable. Passed, Failed and Pending will start reflecting carrier delivery receipts when the SMS provider callback is connected. Until then, those values remain zero rather than guessing.</div></div></div>
      </main>
    </div>
  );
}
