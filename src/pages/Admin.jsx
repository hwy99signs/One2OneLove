import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowLeft, BarChart3, CalendarDays, CheckCircle2,
  Clock3, CreditCard, FileCheck2, Gauge, Heart, Loader2, LockKeyhole,
  Menu, MessageSquareText, RefreshCw, Search, ShieldCheck, TrendingUp,
  UserCheck, UserX, Trash2, RotateCcw, Users, X,
} from 'lucide-react';
import { changeMemberTier, getAdminAnalytics, getAdminDashboard, getAdminPresence, grantMemberAccessTime, manageMemberAccount, manageMemberAccountsBulk } from '../lib/adminService';
import { touchAdminMfa } from '../lib/adminMfaService';
import {
  ADMIN_AUTH_REDIRECT,
  ADMIN_IDLE_LIMIT_MS,
  claimAutoRedirect,
  isIdleFor,
} from '../lib/activityGuard';

const AUTO_REFRESH_MS = 15 * 60 * 1000;

const sections = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'feature-usage', label: 'Feature Usage', icon: Gauge },
  { id: 'chat-room', label: 'Chat Room', icon: MessageSquareText },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'plans', label: 'Plans & Billing', icon: CreditCard },
  { id: 'love-notes', label: 'Love Notes', icon: Heart },
  { id: 'applications', label: 'Applications', icon: FileCheck2 },
  { id: 'moderation', label: 'Moderation', icon: MessageSquareText },
  { id: 'support', label: 'Support & Reports', icon: MessageSquareText },
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

function Metric({ icon: Icon, label, value, note, tone='rose', onClick }) {
  const interactiveProps = onClick ? {
    role: 'button',
    tabIndex: 0,
    onClick,
    onKeyDown: event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    },
  } : {};
  return (
    <div {...interactiveProps} className={cx('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm',onClick&&'cursor-pointer transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-amber-100')}>
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
function TableShell({ children, scrollHeight }) { if (!scrollHeight) return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">{children}</div>; return <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-slate-50" style={{ maxHeight: scrollHeight }}>{children}</div>; }
function Empty({ children='No records yet.' }) { return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center text-sm text-slate-500">{children}</div>; }
function Heading({ title, subtitle }) { return <div className="mb-5"><h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>; }

function FeatureWindowGrid({ rows, windows=[7,14,21,30] }) {
  return <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
    <div className="grid grid-cols-[1.35fr_repeat(4,minmax(48px,1fr))] bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500">
      <div className="px-3 py-2">Metric</div>{windows.map(d=><div key={d} className="px-2 py-2 text-center">{d}d</div>)}
    </div>
    {rows.map(row=><div key={row.label} className="grid grid-cols-[1.35fr_repeat(4,minmax(48px,1fr))] border-t border-slate-100 text-xs">
      <div className="px-3 py-2 font-semibold text-slate-700">{row.label}</div>
      {windows.map(d=><div key={d} className="px-2 py-2 text-center font-black text-slate-900">{number(row.values?.[d]||0)}</div>)}
    </div>)}
  </div>;
}

function FeatureTopFive({ title='Top 5', items=[], windows=[7,14,21,30], fixedSlots=false }) {
  const visibleItems = fixedSlots ? Array.from({ length:5 }, (_,index)=>items[index]||null) : items;
  return <div className="mt-4">
    <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
    {visibleItems.length ? <div className="space-y-2">{visibleItems.map((item,index)=><div key={item?.name||('empty-'+index)} className={cx('rounded-xl p-3',item?'bg-slate-50':'border border-dashed border-slate-200 bg-white')}>
      <div className="flex items-start justify-between gap-3"><span className={cx('text-sm font-bold',item?'text-slate-800':'text-slate-400')}>{index+1}. {item?.name||'No activity yet'}</span><span className={cx('text-xs font-black',item?'text-purple-700':'text-slate-300')}>{item?(number(item.counts?.[30]||0)+' / 30d'):'—'}</span></div>
      <div className="mt-2 grid grid-cols-4 gap-2 text-center text-[11px] text-slate-500">{windows.map(d=><div key={d}><span className="block">{d}d</span><strong className={item?'text-slate-800':'text-slate-300'}>{item?number(item.counts?.[d]||0):'—'}</strong></div>)}</div>
    </div>)}</div> : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-400">No ranked activity yet.</div>}
  </div>;
}

function FeatureActivityCard({ title, subtitle, rows, topTitle, topItems, windows=[7,14,21,30], fixedTopSlots=false }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h4 className="font-black text-slate-900">{title}</h4>
    {subtitle&&<p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}
    <FeatureWindowGrid rows={rows} windows={windows}/>
    {topTitle&&<FeatureTopFive title={topTitle} items={topItems||[]} windows={windows} fixedSlots={fixedTopSlots}/>}
  </div>;
}


function BreakdownList({ items=[] }) {
  return <div className="space-y-2">{items.map(item=><div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
    <span className="font-semibold text-slate-700">{item.label}</span>
    <span className="text-right"><strong className="text-slate-900">{number(item.count)}</strong><span className="ml-2 text-xs text-slate-500">{decimal(item.percentage)}%</span></span>
  </div>)}</div>;
}

function Relationship100Averages({ rows=[], hasResponses=false }) {
  return <div className="overflow-hidden rounded-xl border border-slate-200">
    <div className="grid grid-cols-[72px_minmax(0,1fr)_110px] bg-slate-50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
      <div>Question</div><div>Relationship 100 item</div><div className="text-right">Average</div>
    </div>
    {rows.map(row=><div key={row.key} className="grid grid-cols-[72px_minmax(0,1fr)_110px] items-center border-t border-slate-100 px-3 py-3 text-sm">
      <div className="font-black text-violet-700">Q{row.number}</div>
      <div className="font-semibold text-slate-800">{row.label}</div>
      <div className="text-right text-lg font-black text-slate-900">{hasResponses?(decimal(row.average)+'%'):'—'}</div>
    </div>)}
  </div>;
}

const O2OL_SHOW_PLATFORM_META = [
  ['o2ol-chat-room','O2OL Chat Room'],
  ['facebook','Facebook'],
  ['instagram','Instagram'],
  ['threads','Threads'],
  ['tiktok','TikTok'],
  ['x','X'],
  ['youtube','YouTube'],
  ['pinterest','Pinterest'],
  ['linkedin','LinkedIn'],
];

const RESPONDENT_LABELS=['Man','Woman','Nonbinary','Prefer not to say'];
const PARTNER_LABELS=['Man','Woman','Nonbinary','Prefer not to say','Not currently partnered'];

function normalizeIdentityBreakdown(items=[],labels=[]) {
  const counts=Object.fromEntries(labels.map(label=>[label,0]));
  for (const item of items) if (counts[item?.label] !== undefined) counts[item.label]+=Number(item.count||0);
  const total=Object.values(counts).reduce((sum,value)=>sum+value,0);
  return labels.map(label=>({label,count:counts[label],percentage:total?Math.round((counts[label]*1000)/total)/10:0}));
}

function platformVotingRows(showVoting={}) {
  const provided=Array.isArray(showVoting.platforms)?showVoting.platforms:[];
  const template=showVoting.relationship100||[];
  return O2OL_SHOW_PLATFORM_META.map(([id,label])=>{
    const found=provided.find(item=>item?.id===id)||{};
    const valid=Number(found.validResponses||0);
    const relationship100=(found.relationship100?.length?found.relationship100:template).map(row=>({...row,average:Number(row.average||0)}));
    const rawRelationship={};
    for(const row of relationship100){
      const supplied=Number(found.rawTotals?.relationship100?.[row.key]);
      rawRelationship[row.key]=Number.isFinite(supplied)?supplied:Number(row.average||0)*valid;
    }
    return {
      id,label,
      connected:found.connected === true,
      validResponses:valid,
      excludedResponses:Number(found.excludedResponses||0),
      excludedReasons:Array.isArray(found.excludedReasons)?found.excludedReasons:[],
      commentCount:Number(found.commentCount||0),
      lastUpdated:found.lastUpdated||null,
      rawTotals:{
        relationship100:rawRelationship,
        expenseSplit:{
          man:Number.isFinite(Number(found.rawTotals?.expenseSplit?.man))?Number(found.rawTotals.expenseSplit.man):Number(found.expenseSplit?.manAverage||0)*valid,
          woman:Number.isFinite(Number(found.rawTotals?.expenseSplit?.woman))?Number(found.rawTotals.expenseSplit.woman):Number(found.expenseSplit?.womanAverage||0)*valid,
        },
      },
      relationship100,
      expenseSplit:{
        number:10,
        label:found.expenseSplit?.label||showVoting.expenseSplit?.label||'Household bills / shared expenses',
        manAverage:Number(found.expenseSplit?.manAverage||0),
        womanAverage:Number(found.expenseSplit?.womanAverage||0),
      },
      demographics:{
        respondentIdentity:normalizeIdentityBreakdown(found.demographics?.respondentIdentity||[],RESPONDENT_LABELS),
        partnerIdentity:normalizeIdentityBreakdown(found.demographics?.partnerIdentity||[],PARTNER_LABELS),
      },
    };
  });
}

function combinedPlatformVoting(platforms=[],showVoting={}) {
  const validResponses=platforms.reduce((sum,item)=>sum+Number(item.validResponses||0),0);
  const excludedResponses=platforms.reduce((sum,item)=>sum+Number(item.excludedResponses||0),0);
  const commentCount=platforms.reduce((sum,item)=>sum+Number(item.commentCount||0),0);
  const template=showVoting.relationship100||platforms[0]?.relationship100||[];
  const relationship100=template.map(row=>{
    const raw=platforms.reduce((sum,item)=>sum+Number(item.rawTotals?.relationship100?.[row.key]||0),0);
    return {...row,average:validResponses?raw/validResponses:0};
  });
  const manRaw=platforms.reduce((sum,item)=>sum+Number(item.rawTotals?.expenseSplit?.man||0),0);
  const womanRaw=platforms.reduce((sum,item)=>sum+Number(item.rawTotals?.expenseSplit?.woman||0),0);
  const latest=platforms.map(item=>item.lastUpdated).filter(Boolean).sort((a,b)=>new Date(b)-new Date(a))[0]||null;
  return {
    id:'all',label:'All Platforms',connected:true,connectedPlatforms:platforms.filter(item=>item.connected).length,validResponses,excludedResponses,commentCount,lastUpdated:latest,
    excludedReasons:platforms.flatMap(item=>item.excludedReasons||[]),
    relationship100,
    expenseSplit:{
      number:10,
      label:showVoting.expenseSplit?.label||'Household bills / shared expenses',
      manAverage:validResponses?manRaw/validResponses:0,
      womanAverage:validResponses?womanRaw/validResponses:0,
    },
    demographics:{
      respondentIdentity:normalizeIdentityBreakdown(platforms.flatMap(item=>item.demographics?.respondentIdentity||[]),RESPONDENT_LABELS),
      partnerIdentity:normalizeIdentityBreakdown(platforms.flatMap(item=>item.demographics?.partnerIdentity||[]),PARTNER_LABELS),
    },
  };
}

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
  const isPrelaunchAdminPreview = window.location.hostname === 'one2onelove-prelaunch.hwy99signs.workers.dev';
  const visibleSections = isPrelaunchAdminPreview ? sections.filter(item => item.id === 'chat-room') : sections;
  const [section,setSection] = useState(isPrelaunchAdminPreview ? 'chat-room' : 'overview');
  const [data,setData] = useState(null);
  const [analytics,setAnalytics] = useState(null);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [error,setError] = useState(null);
  const [query,setQuery] = useState('');
  const [memberViewFilter,setMemberViewFilter] = useState('all');
  const [mobileNav,setMobileNav] = useState(false);
  const [memberActionId,setMemberActionId] = useState(null);
  const [selectedMemberIds,setSelectedMemberIds] = useState([]);
  const [bulkMemberAction,setBulkMemberAction] = useState(false);
  const [votingPlatform,setVotingPlatform] = useState('all');
  const [registryRange,setRegistryRange] = useState('30d');
  const registryRangeRef = useRef('30d');
  const dataRef = useRef(null);
  const loadInFlightRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  const [presenceNow,setPresenceNow] = useState(null);
  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const payload = await getAdminPresence();
        if (active && payload?.ok) setPresenceNow(Number(payload.onlineNow || 0));
      } catch {}
    };
    tick();
    const timer = window.setInterval(tick, 20000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const load = async (refresh=false) => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    refresh ? setRefreshing(true) : setLoading(true);
    if (!refresh) setError(null);
    const fetchBundle = async () => Promise.all([getAdminDashboard(registryRangeRef.current),getAdminAnalytics()]);
    try {
      let result;
      let lastError = null;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          result = await fetchBundle();
          lastError = null;
          break;
        } catch (attemptError) {
          lastError = attemptError;
          if (![401,428,429,500,502,503,504].includes(attemptError?.status) || attempt === 3) break;
          await new Promise(resolve => window.setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
      if (!result) throw lastError || new Error('Unable to load Admin dashboard.');
      const [dashboardData,analyticsData] = result;
      setData(dashboardData);
      dataRef.current = dashboardData;
      setAnalytics(analyticsData);
      lastRefreshAtRef.current = Date.now();
      setError(null);
    } catch (err) {
      if (!refresh || !dataRef.current) {
        setError(err);
      } else if (err?.status === 428) {
        // Guarded: if the admin auth screens start bouncing (Admin <->
        // AdminAccess), stop redirecting and surface the error instead of
        // reloading forever (2026-10-08 polling fix).
        if (claimAutoRedirect(ADMIN_AUTH_REDIRECT.key, ADMIN_AUTH_REDIRECT.limit, ADMIN_AUTH_REDIRECT.windowMs)) {
          window.location.replace('/AdminAccess');
        } else {
          setError(err);
        }
      } else if (err?.status === 401) {
        if (claimAutoRedirect(ADMIN_AUTH_REDIRECT.key, ADMIN_AUTH_REDIRECT.limit, ADMIN_AUTH_REDIRECT.windowMs)) {
          window.location.replace('/SignIn');
        } else {
          setError(err);
        }
      } else {
        console.warn('Admin background refresh failed; keeping the current dashboard visible.', err);
      }
    } finally {
      loadInFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    load(false);
  }, []);

  useEffect(() => {
    let active = true;
    const refreshIfDue = () => {
      if (!active || document.visibilityState !== 'visible') return;
      if (isIdleFor(ADMIN_IDLE_LIMIT_MS)) return;
      const elapsed = Date.now() - Number(lastRefreshAtRef.current || 0);
      if (elapsed >= AUTO_REFRESH_MS) load(true);
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
    if (isPrelaunchAdminPreview) return undefined;
    let active = true;
    const keepAdminSessionAlive = () => {
      if (!active || document.visibilityState !== 'visible') return;
      if (isIdleFor(ADMIN_IDLE_LIMIT_MS)) return;
      touchAdminMfa().catch(error => {
        // Do not eject the Admin for a transient heartbeat failure. The next
        // successful request can recover through the signed Admin MFA cookie.
        console.warn('Admin session heartbeat missed; keeping dashboard active.', error);
      });
    };
    keepAdminSessionAlive();
    const timer = window.setInterval(keepAdminSessionAlive, 10 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const memberCounts = useMemo(() => {
    const members=(data?.members || []).filter(m => m.auth_role !== 'admin');
    return {
      all: members.length,
      registeredFree: members.filter(m => m.subscription_plan === 'Registered Free' || m.subscription_status === 'registered_free').length,
      pendingVerification: members.filter(m => !(m.is_verified && m.phone_verified)).length,
    };
  },[data]);

  const filteredMembers = useMemo(() => {
    const members=data?.members || [], needle=query.trim().toLowerCase();
    let filtered=members;
    if (memberViewFilter === 'pending-verification') {
      filtered=members.filter(m => m.auth_role !== 'admin' && !(m.is_verified && m.phone_verified));
    } else if (memberViewFilter === 'registered-free') {
      filtered=members.filter(m => m.auth_role !== 'admin' && (m.subscription_plan === 'Registered Free' || m.subscription_status === 'registered_free'));
    }
    if (!needle) return filtered;
    return filtered.filter(m => [m.name,m.username,m.email,m.location,m.subscription_plan,m.subscription_status,m.user_type].filter(Boolean).some(v => String(v).toLowerCase().includes(needle)));
  },[data,query,memberViewFilter]);

  if (loading) return <div className="min-h-screen bg-slate-50 grid place-items-center p-4"><div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><Loader2 className="mx-auto animate-spin text-rose-500" size={34}/><h1 className="mt-4 text-xl font-bold">Loading One2OneLove Admin</h1><p className="mt-2 text-sm text-slate-500">Verifying administrator access and loading platform data.</p></div></div>;
  if (error) {
    const unauthorized=error.status===401;
    return <div className="min-h-screen bg-slate-50 grid place-items-center p-4"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><LockKeyhole className="mx-auto text-rose-600" size={38}/><h1 className="mt-4 text-xl font-bold">{unauthorized?'Sign in required':'Administrator access required'}</h1><p className="mt-2 text-sm text-slate-500">This dashboard is restricted to an authorized One2OneLove administrator account.</p><button onClick={()=>navigate(unauthorized?'/SignIn':'/Home')} className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Go back</button></div></div>;
  }

  const summary=data?.summary || {}, users=summary.users || {}, love=summary.loveNotes || {};
  const applications=data?.applications || [], moderation=data?.moderation || [], payments=data?.billing?.payments || [], movements=data?.billing?.changes || [];
  const loveNotes=data?.loveNotes || {}, featureUsage=data?.featureUsage || {}, clickAnalytics=data?.clickAnalytics || {};
  const visitorRegistry=data?.visitorRegistry || {}, visitorFunnel=visitorRegistry.funnel || {}, visitorRows=visitorRegistry.visitors || [];
  const supportFeedback=data?.supportFeedback || {}, supportSummary=supportFeedback.summary || {}, supportRows=supportFeedback.recent || [];
  const clickSummary=clickAnalytics.summary || {};
  const features=[...(featureUsage.features || [])].sort((a,b)=>String(a?.feature||'').localeCompare(String(b?.feature||''),undefined,{sensitivity:'base'}));
  const topFeatureActivity=data?.topFeatureActivity || {};
  const featureWindows=topFeatureActivity.windows || [7,14,21,30];
  const chatRoom=data?.chatRoom || {};
  const showVoting=chatRoom.showVoting || {};
  const conversationTopics=chatRoom.conversations || [];
  const totalConversationComments=conversationTopics.reduce((sum,item)=>sum+Number(item.comments||0),0);
  const votingPlatforms=platformVotingRows(showVoting);
  const allPlatformsVoting=combinedPlatformVoting(votingPlatforms,showVoting);
  const selectedVoting=votingPlatform==='all'
    ? allPlatformsVoting
    : (votingPlatforms.find(item=>item.id===votingPlatform)||allPlatformsVoting);
  const direct=analytics?.directDelivery || { sent:love.sent_total,passed:0,failed:0,pending:0,receiptTrackingActive:false };

  const openAnalytics = () => window.location.assign('/Analytics');
  const openPendingVerificationMembers = () => {
    setQuery('');
    setMemberViewFilter('pending-verification');
    setSection('members');
    setMobileNav(false);
  };

  const handleMemberAction = async (member, action) => {
    if (member.auth_role === 'admin') return;
    const verb = action === 'restore' ? 'restore' : action;
    const confirmation = action === 'delete'
      ? `Delete ${member.email}? This is a reversible account deletion: access is blocked immediately, but the account can be restored later from this dashboard.`
      : action === 'suspend'
        ? `Suspend ${member.email}? The member will lose access until you restore the account.`
        : `Restore ${member.email}? The member will regain account access.`;
    if (!window.confirm(confirmation)) return;

    let reason = '';
    if (action !== 'restore') {
      const entered = window.prompt(action === 'delete' ? 'Reason for deletion (optional):' : 'Reason for suspension (optional):', '');
      if (entered === null) return;
      reason = entered;
    }

    setMemberActionId(member.id);
    try {
      await manageMemberAccount(member.id, action, reason);
      await load(true);
    } catch (err) {
      window.alert(err?.message || `Unable to ${verb} this member.`);
    } finally {
      setMemberActionId(null);
    }
  };

  const handleGrantAccessTime = async (member, unit) => {
    if (member.auth_role === 'admin' || !unit) return;

    let amount = 1;
    if (unit !== 'unlimited') {
      const enteredAmount = window.prompt(`How many ${unit} should be added?`, '1');
      if (enteredAmount === null) return;
      amount = Number.parseInt(String(enteredAmount), 10);
      if (!Number.isInteger(amount) || amount < 1 || amount > 10000) {
        window.alert('Enter a whole number from 1 to 10,000.');
        return;
      }
    } else if (!window.confirm(`Give ${member.email} unlimited membership access?`)) {
      return;
    }

    setMemberActionId(member.id);
    try {
      await grantMemberAccessTime(member.id, unit, amount);
      await load(true);
    } catch (err) {
      window.alert(err?.message || 'Unable to add access time to this member.');
    } finally {
      setMemberActionId(null);
    }
  };

  const handleChangeTier = async (member, target) => {
    if (member.auth_role === 'admin' || !target) return;

    const current = String(member.subscription_plan || 'Premiere');
    if (target === current) return;
    const action = target === 'Exclusive' ? 'UPGRADE' : 'DOWNGRADE';

    if (!window.confirm(`${action} ${member.email} from ${current} to ${target}?`)) return;

    setMemberActionId(member.id);
    try {
      await changeMemberTier(member.id, target);
      await load(true);
    } catch (err) {
      window.alert(err?.message || `Unable to ${action.toLowerCase()} this member.`);
    } finally {
      setMemberActionId(null);
    }
  };

  const handleBulkMemberAction = async (action) => {
    const selected = (data?.members || []).filter(m => selectedMemberIds.includes(m.id) && m.auth_role !== 'admin');
    if (!selected.length) return;
    const label = action === 'delete' ? 'delete' : 'suspend';
    if (!window.confirm(`${label === 'delete' ? 'Delete' : 'Suspend'} ${selected.length} selected account${selected.length===1?'':'s'}? ${label === 'delete' ? 'Deleted accounts remain restorable from this dashboard.' : 'They will lose access until restored.'}`)) return;
    const entered = window.prompt(`Reason for bulk ${label} (optional):`, '');
    if (entered === null) return;
    setBulkMemberAction(true);
    try {
      await manageMemberAccountsBulk(selected.map(m=>m.id), action, entered);
      setSelectedMemberIds([]);
      await load(true);
    } catch (err) {
      window.alert(err?.message || `Unable to ${label} selected accounts.`);
    } finally {
      setBulkMemberAction(false);
    }
  };

  const selectableMembers = filteredMembers.filter(m => m.auth_role !== 'admin');
  const allVisibleSelected = selectableMembers.length > 0 && selectableMembers.every(m => selectedMemberIds.includes(m.id));
  const toggleVisibleSelection = () => {
    const visibleIds = selectableMembers.map(m => m.id);
    setSelectedMemberIds(current => allVisibleSelected
      ? current.filter(id => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  };


  const nav = (
    <>
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center gap-3"><img src="/assets/o2ol-approved-logo.png" alt="One2OneLove" className="h-12 w-12 object-contain"/><div><div className="font-black text-slate-900">One2OneLove</div><div className="text-xs font-semibold text-rose-600">ADMIN CONTROL</div></div></div>
      </div>
      <nav className="space-y-1 p-3">
        {!isPrelaunchAdminPreview && <button onClick={()=>{openAnalytics();setMobileNav(false);}} className="mb-2 flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100"><TrendingUp size={18}/>Analytics</button>}
        {visibleSections.map(({id,label,icon:Icon}) => <button key={id} onClick={()=>{setSection(id);setMobileNav(false);}} className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition',section===id?'bg-rose-50 text-rose-700':'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}><Icon size={18}/>{label}</button>)}
      </nav>
      <div className="mt-auto border-t border-slate-200 p-4"><div className="mb-3 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800"><ShieldCheck size={16} className="mb-1"/>Secure admin-only access. Member account controls are available only to authorized administrators.</div><button onClick={()=>navigate('/Home')} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16}/>Exit Admin</button></div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">{nav}</aside>
      {mobileNav && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close" className="absolute inset-0 bg-slate-900/30" onClick={()=>setMobileNav(false)}/><aside className="relative flex h-full w-72 flex-col bg-white shadow-xl">{nav}<button className="absolute right-3 top-3 text-slate-500" onClick={()=>setMobileNav(false)}><X/></button></aside></div>}

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:flex-nowrap sm:gap-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3"><button className="rounded-lg border border-slate-200 p-2 lg:hidden" onClick={()=>setMobileNav(true)}><Menu size={18}/></button><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Operations Dashboard</p><h1 className="text-lg font-bold text-slate-900">{visibleSections.find(s=>s.id===section)?.label}</h1></div></div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">{!isPrelaunchAdminPreview && <button onClick={openAnalytics} className="hidden items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 sm:inline-flex"><TrendingUp size={15}/>Analytics</button>}<Pill tone={isPrelaunchAdminPreview?'amber':'blue'}>{isPrelaunchAdminPreview?'Read-only Prelaunch':'Production'}</Pill><span className="hidden md:inline-flex"><Pill tone="green">Auto-refresh · 15 min</Pill></span><button onClick={()=>load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={refreshing?'animate-spin':''}/><span className="hidden sm:inline">Refresh</span></button></div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {section==='overview' && <div>
            <Heading title="Platform Overview" subtitle="A quick operating view of users, tiers, Love Notes, moderation and the features visitors and members are actually using."/>
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><strong>Analytics rules:</strong> Administrator activity is intentionally excluded from visitor, click and feature-usage totals so your own testing does not inflate audience numbers. “Today” and “this month” use America/Chicago; rolling 24-hour and 7/30-day windows remain true elapsed-time windows.</div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Users} label="Total Sign-ups" value={number(users.total)} note={`${number(users.new_7d)} joined in the last 7 days`}/>
              <Metric icon={UserCheck} label="Registered Free Accounts" value={number(users.registered_free)} note="free member profiles · no paid subscription" tone="blue"/>
              <Metric icon={Clock3} label="Pending Verification" value={number(users.pending_verification)} note="Click to view the accounts and missing verification step" tone="amber" onClick={openPendingVerificationMembers}/>
              <Metric icon={Heart} label="Love Notes Sent" value={number(love.sent_total)} note={`${number(love.sent_30d)} in the last 30 days`} tone="violet"/>
              <Metric icon={CalendarDays} label="People Using Scheduler" value={number(love.scheduler_users)} note={`${number(love.scheduler_users_30d)} in the last 30 days`} tone="blue"/>
              <Metric icon={TrendingUp} label="Feature Activity — 30 Days" value={number(features.reduce((sum,f)=>sum+Number(f.activity_30d||0),0))} note={`${features.filter(f=>Number(f.activity_30d||0)>0).length} features used · all visitors`} tone="green"/>
              <Metric icon={FileCheck2} label="Pending Applications" value={number(summary.applications?.pending_total)} note="Professional and contributor applications" tone="blue"/>
              <Metric icon={MessageSquareText} label="Moderation Queue" value={number(summary.moderation?.pending_total)} note="Posts, comments, stories and reviews" tone="amber"/>
              <Metric icon={CreditCard} label="Payments Recorded" value={number(summary.payments?.recorded_payments)} note={`${number(summary.payments?.payments_this_month)} this month`} tone="violet"/>
              <Metric icon={UserCheck} label="Fully Verified Members" value={number(users.verified)} note={`Email ${number(users.email_verified)} · Phone ${number(users.phone_verified)} · both required`} tone="green"/>
            </div>

            <Panel title="Signup & Free Account Funnel" subtitle="Separates people visiting signup from accounts that were actually created. These are real account records, not anonymous clicks." className="mt-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Sign-ups</p><p className="mt-1 text-2xl font-black text-slate-900">{number(users.total)}</p></div>
                <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Registered Free</p><p className="mt-1 text-2xl font-black text-slate-900">{number(users.registered_free)}</p></div>
                <div className="rounded-xl bg-violet-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-700">Subscribed</p><p className="mt-1 text-2xl font-black text-slate-900">{number(users.subscribed)}</p></div>
                <button type="button" onClick={openPendingVerificationMembers} className="rounded-xl bg-amber-50 p-4 text-left transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-100"><p className="text-xs font-bold uppercase tracking-wide text-amber-700">Pending Verification</p><p className="mt-1 text-2xl font-black text-slate-900">{number(users.pending_verification)}</p><p className="mt-1 text-[11px] font-semibold text-amber-700">View accounts →</p></button>
                <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Fully Verified</p><p className="mt-1 text-2xl font-black text-slate-900">{number(users.verified)}</p></div>
                <div className="rounded-xl bg-rose-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-rose-700">Auth Only / No Profile</p><p className="mt-1 text-2xl font-black text-slate-900">{number(users.auth_only_no_profile)}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs"><Pill tone="blue">{number(users.signups_today)} signups today</Pill><Pill tone="purple">{number(users.signups_24h)} in the last 24 hours</Pill></div>
            </Panel>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <Panel title="Membership Breakdown" subtitle="Registered Free plus both paid membership tiers are always shown, including zero-count groups — plus the visitors who signed up, from the Visitor Registry.">
                <div className="space-y-3">{(summary.plans||[]).map((plan,i)=><div key={plan.plan} className={cx('rounded-xl p-4',i===0?'bg-blue-50':i===1?'bg-violet-50':'bg-rose-50')}><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{plan.plan}</p><p className="text-2xl font-black text-slate-900">{number(plan.count)}</p></div><p className="text-xs text-slate-500">accounts</p></div>)}</div>
                <div className="mt-3 rounded-xl bg-emerald-50 p-4"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Signed-Up Visitors</p><p className="text-2xl font-black text-slate-900">{number(Math.max(0,Number(visitorFunnel.total_visitors||0)-Number(visitorFunnel.anonymous_visitors||0)))}</p></div><p className="text-xs text-slate-500">from Visitor Registry / Audience Intelligence · of {number(visitorFunnel.total_visitors)} tracked visitors</p></div>
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

            <Panel title="Top Feature Activity" subtitle="Operational activity for the six launch areas you want to watch most closely. Each card uses rolling 7, 14, 21 and 30-day windows." className="mt-6">
              <div className="grid gap-4 xl:grid-cols-2">
                <FeatureActivityCard
                  title="Subscription / Billing"
                  subtitle="Page accesses plus member accounts created with or without a Stripe subscription connection."
                  windows={featureWindows}
                  rows={[
                    {label:'Page accesses',values:topFeatureActivity.subscriptionBilling?.accesses},
                    {label:'With CC',values:topFeatureActivity.subscriptionBilling?.withCard},
                    {label:'Without CC',values:topFeatureActivity.subscriptionBilling?.withoutCard},
                  ]}
                />
                <FeatureActivityCard
                  title="Date Ideas"
                  subtitle="Page usage and saved/favorited date ideas."
                  windows={featureWindows}
                  rows={[
                    {label:'Page accesses',values:topFeatureActivity.dateIdeas?.used},
                    {label:'Saved',values:topFeatureActivity.dateIdeas?.saved},
                  ]}
                  topTitle="Top 5 saved date ideas"
                  topItems={topFeatureActivity.dateIdeas?.top}
                />
                <FeatureActivityCard
                  title="LGBTQ+ Support"
                  subtitle="Page accesses plus the most-used LGBTQ+ articles, chat/resources and support actions."
                  windows={featureWindows}
                  rows={[{label:'Page accesses',values:topFeatureActivity.lgbtq?.accesses}]}
                  topTitle="Top 5 features"
                  topItems={topFeatureActivity.lgbtq?.top}
                  fixedTopSlots
                />
                <FeatureActivityCard
                  title="Love Notes"
                  subtitle="Love Notes sent and scheduled, with the most-used note categories."
                  windows={featureWindows}
                  rows={[
                    {label:'Page accesses',values:topFeatureActivity.loveNotes?.accesses},
                    {label:'Sent',values:topFeatureActivity.loveNotes?.sent},
                    {label:'Scheduled',values:topFeatureActivity.loveNotes?.scheduled},
                  ]}
                  topTitle="Top 5 categories"
                  topItems={topFeatureActivity.loveNotes?.top}
                />
                <FeatureActivityCard
                  title="Relationship Support"
                  subtitle="Relationship Support page accesses and the most-used support tools."
                  windows={featureWindows}
                  rows={[{label:'Page accesses',values:topFeatureActivity.relationshipSupport?.accesses}]}
                  topTitle="Top 5 features"
                  topItems={topFeatureActivity.relationshipSupport?.top}
                  fixedTopSlots
                />
                <FeatureActivityCard
                  title="Podcasts"
                  subtitle="Podcast library accesses and the most-opened podcasts."
                  windows={featureWindows}
                  rows={[{label:'Page accesses',values:topFeatureActivity.podcasts?.accesses}]}
                  topTitle="Top 5 podcasts"
                  topItems={topFeatureActivity.podcasts?.top}
                />
              </div>
            </Panel>
          </div>}

          {section==='feature-usage' && <div>
            <Heading title="Feature & Click Analytics" subtitle="Tracks normal UI clicks from non-registered Open House visitors, registered users without a paid subscription, and subscribed members. Administrator activity is excluded."/>
            <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Activity} label="All Clicks" value={number(clickSummary.clicks_30d)} note={`${number(clickSummary.total_clicks)} since analytics baseline`} tone="blue"/>
              <Metric icon={Users} label="Non-Registered Clicks" value={number(clickSummary.anonymous_30d)} note={`${number(clickSummary.unique_anonymous_30d)} unique anonymous visitors · 30 days`} tone="violet"/>
              <Metric icon={UserCheck} label="Registered Free Clicks" value={number(clickSummary.registered_free_30d)} note={`${number(clickSummary.unique_registered_free_30d)} unique registered-free users · 30 days`} tone="amber"/>
              <Metric icon={CreditCard} label="Subscribed Clicks" value={number(clickSummary.subscribed_30d)} note={`${number(clickSummary.unique_subscribed_30d)} unique subscribed users · 30 days`} tone="green"/>
            </div>
            <div className={cx('mb-5 rounded-xl border p-4 text-sm',clickAnalytics.liveTracking?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-amber-200 bg-amber-50 text-amber-800')}>{clickAnalytics.trackingMessage || 'All-visitor click tracking has not produced data yet.'}</div>
            <div className="mb-6 grid gap-6 xl:grid-cols-2">
              <Panel title="Top Clicked Pages — 30 Days">
                {(clickAnalytics.topRoutes||[]).length?<div className="space-y-2">{clickAnalytics.topRoutes.map(item=><div key={item.route} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate font-semibold">{item.route}</span><strong>{number(item.clicks)}</strong></div><div className="mt-1 text-xs text-slate-500">Anonymous {number(item.anonymous)} · Registered free {number(item.registered_free)} · Subscribed {number(item.subscribed)}</div></div>)}</div>:<Empty>No public clicks recorded yet.</Empty>}
              </Panel>
              <Panel title="Top Clicked Features — 30 Days">
                {(clickAnalytics.topFeatures||[]).length?<div className="space-y-2">{clickAnalytics.topFeatures.map(item=><div key={item.feature} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate font-semibold">{item.feature}</span><strong>{number(item.clicks)}</strong></div><div className="mt-1 text-xs text-slate-500">Anonymous {number(item.anonymous)} · Registered free {number(item.registered_free)} · Subscribed {number(item.subscribed)}</div></div>)}</div>:<Empty>No feature clicks recorded yet.</Empty>}
              </Panel>
            </div>
            <div className={cx('mb-5 rounded-xl border p-4 text-sm',featureUsage.liveTracking?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-amber-200 bg-amber-50 text-amber-800')}>{featureUsage.trackingMessage}</div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr_1.2fr_1fr_1.5fr] items-center border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <div>Feature</div>
                  <div>Unique Visitors / Users</div>
                  <div>7 Days</div>
                  <div>30 Days</div>
                  <div>Total Activity</div>
                  <div>Avg / Visitor</div>
                  <div>Last Used</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {features.map(f=>(
                    <div key={f.feature} className="grid grid-cols-[2.2fr_1fr_1fr_1fr_1.2fr_1fr_1.5fr] items-center px-4 py-3 text-sm hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-900">{f.feature}</div>
                        <div className="text-xs text-slate-400">{f.category}</div>
                      </div>
                      <div className="font-bold text-slate-800">{number(f.unique_users)}</div>
                      <div>{number(f.activity_7d)}</div>
                      <div>{number(f.activity_30d)}</div>
                      <div>{number(f.total_activity)}</div>
                      <div>{decimal(f.avg_per_user)}</div>
                      <div className="whitespace-nowrap text-xs text-slate-500">{date(f.last_used)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>}

          {section==='chat-room' && <div>
            <Heading title="Chat Room Analytics" subtitle="O2OL Show voting, audience demographics and live conversation volume by topic."/>
            {isPrelaunchAdminPreview && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Prelaunch read-only preview:</strong> Admin verification is temporarily bypassed only on this isolated preview URL. Chat comment counts come from the prelaunch R2 Chat data. Production member, billing and Admin-control data are not exposed here.</div>}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Metric icon={BarChart3} label="O2OL Show Votes" value={number(allPlatformsVoting.validResponses)} note="recorded responses from connected voting sources" tone="violet"/>
              <Metric icon={MessageSquareText} label="Chat Comments" value={number(totalConversationComments)} note="approved comments across tracked topics" tone="blue"/>
              <Metric icon={Users} label="Conversation Topics" value={number(conversationTopics.length)} note="rooms and member-created topics" tone="green"/>
              <Metric icon={Clock3} label="Last Show Update" value={allPlatformsVoting.lastUpdated?'Recorded':'—'} note={allPlatformsVoting.lastUpdated?date(allPlatformsVoting.lastUpdated):'No responses yet'} tone="amber"/>
            </div>

            <Panel
              title="O2OL Show Voting"
              subtitle={`TOPIC: ${showVoting.topicTitle||'Who Should Apologize First?'} · ${selectedVoting.label} · ${number(selectedVoting.validResponses)} valid response${Number(selectedVoting.validResponses||0)===1?'':'s'} · Admin sees live anonymous aggregates; public averages remain on the approved 7-day reveal schedule.`}
            >
              {votingPlatform!=='all' && selectedVoting.connected===false && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><strong>{selectedVoting.label} is not connected to O2OL Show vote ingestion yet.</strong> A zero here means no connected data source, not proof that the platform had zero public votes or comments.</div>}
              <div className="mb-5 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2">
                  {[['all','All Platforms'],...O2OL_SHOW_PLATFORM_META].map(([id,label])=><button
                    type="button"
                    key={id}
                    onClick={()=>setVotingPlatform(id)}
                    className={cx('rounded-full border px-4 py-2 text-sm font-black transition',votingPlatform===id?'border-violet-600 bg-violet-600 text-white shadow-sm':'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700')}
                  >{label}</button>)}
                </div>
              </div>
              <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-emerald-700">Valid responses</p><p className="mt-1 text-2xl font-black text-emerald-950">{number(selectedVoting.validResponses)}</p></div>
                <div className="rounded-xl bg-rose-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-rose-700">Excluded</p><p className="mt-1 text-2xl font-black text-rose-950">{number(selectedVoting.excludedResponses)}</p></div>
                <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-blue-700">Comments</p><p className="mt-1 text-2xl font-black text-blue-950">{number(selectedVoting.commentCount)}</p></div>
                <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-amber-700">Last update</p><p className="mt-1 text-sm font-black text-amber-950">{selectedVoting.lastUpdated?date(selectedVoting.lastUpdated):'—'}</p></div>
              </div>
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <strong>All Platforms math:</strong> raw percentage sums are combined first, then divided by total valid responses. Platform averages are never averaged against each other.
              </div>
              <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
                <strong>Excluded-response reasons:</strong>{' '}
                {selectedVoting.excludedReasons?.length ? selectedVoting.excludedReasons.join(' · ') : 'None recorded for this platform.'}
              </div>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">Questions 1–9</p>
                      <p className="mt-1 text-sm text-slate-500">Each value is the average percentage assigned to that Relationship 100 priority.</p>
                    </div>
                    <Pill tone="purple">{number(selectedVoting.validResponses)} valid</Pill>
                  </div>
                  <Relationship100Averages rows={selectedVoting.relationship100||[]} hasResponses={Number(selectedVoting.validResponses||0)>0}/>
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div><p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Question 10</p><p className="mt-1 font-bold text-slate-900">{selectedVoting.expenseSplit?.label||'Household bills / shared expenses'}</p></div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 shadow-sm">Total 100%</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Man</p><p className="mt-1 text-3xl font-black text-slate-900">{Number(selectedVoting.validResponses||0)>0?(decimal(selectedVoting.expenseSplit?.manAverage)+'%'):'—'}</p></div>
                      <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Woman</p><p className="mt-1 text-3xl font-black text-slate-900">{Number(selectedVoting.validResponses||0)>0?(decimal(selectedVoting.expenseSplit?.womanAverage)+'%'):'—'}</p></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Respondent identity</p>
                    <BreakdownList items={selectedVoting.demographics?.respondentIdentity||[]}/>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">How does your partner identify?</p>
                    <BreakdownList items={selectedVoting.demographics?.partnerIdentity||[]}/>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title="Conversation by Topic / # of Comments"
              subtitle="Every active Chat Room and each newly created conversation topic automatically becomes a new data line here."
              className="mt-6"
            >
              {conversationTopics.length ? <>
                <div className="space-y-2 sm:hidden">
                  {conversationTopics.map(item=><div key={item.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="break-words font-semibold text-slate-900">{item.topic}</p><p className="mt-1 text-xs text-slate-500">{item.source||'Chat Room'} · {date(item.createdAt)}</p></div>
                      <div className="shrink-0 text-right"><p className="text-2xl font-black text-slate-900">{number(item.comments)}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Comments</p></div>
                    </div>
                  </div>)}
                </div>
                <div className="hidden sm:block"><TableShell><table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-4 py-3">Topic</th><th className="px-4 py-3">Source</th><th className="px-4 py-3 text-right"># Comments</th><th className="px-4 py-3">Created</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {conversationTopics.map(item=><tr key={item.key} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.topic}</td>
                      <td className="px-4 py-3 text-slate-500">{item.source||'Chat Room'}</td>
                      <td className="px-4 py-3 text-right text-lg font-black text-slate-900">{number(item.comments)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{date(item.createdAt)}</td>
                    </tr>)}
                  </tbody>
                </table></TableShell></div>
              </> : <Empty>No Chat Room topics or comments have been recorded yet.</Empty>}
            </Panel>
          </div>}

          {section==='members' && <div>
            <Heading title="All Sign-ups" subtitle="Every stored O2OL registration from the beginning to now. Registered Free accounts remain visible here even when they have never purchased a subscription."/>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <Metric icon={Activity} label="On Site Right Now" value={presenceNow === null ? '—' : number(presenceNow)} note="pages open now · updates every 20 seconds · admins excluded" tone="green"/>
              <Metric icon={Activity} label="Active (Last 5 Min)" value={number(visitorFunnel.online_now)} note="visitor IDs active in the last 5 minutes · admins excluded" tone="green"/>
              <Metric icon={Users} label="Anonymous Visitors" value={number(visitorFunnel.anonymous_visitors)} note={`${number(visitorFunnel.total_visitors)} visitor IDs tracked`} tone="slate"/>
              <Metric icon={UserCheck} label="Registered Free" value={number(visitorFunnel.registered_free)} note={`${number(visitorFunnel.promo_opt_ins)} promotional email opt-ins`} tone="blue"/>
              <Metric icon={CreditCard} label="Credit Buyers" value={number(visitorFunnel.token_buyers)} note="members with a paid Credit purchase" tone="violet"/>
              <Metric icon={TrendingUp} label="Paid Activity" value={money(Number(visitorFunnel.paid_activity_cents||0)/100)} note="Credit purchases + auto-replenish" tone="green"/>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button type="button" onClick={()=>{setMemberViewFilter('all');setQuery('');}} className={cx('rounded-xl border px-4 py-2 text-sm font-black',memberViewFilter==='all'?'border-slate-900 bg-slate-900 text-white':'border-slate-200 bg-white text-slate-700')}>All Sign-ups · {number(memberCounts.all)}</button>
              <button type="button" onClick={()=>{setMemberViewFilter('registered-free');setQuery('');}} className={cx('rounded-xl border px-4 py-2 text-sm font-black',memberViewFilter==='registered-free'?'border-blue-600 bg-blue-600 text-white':'border-blue-200 bg-blue-50 text-blue-800')}>Registered Free · {number(memberCounts.registeredFree)}</button>
              <button type="button" onClick={()=>{setMemberViewFilter('pending-verification');setQuery('');}} className={cx('rounded-xl border px-4 py-2 text-sm font-black',memberViewFilter==='pending-verification'?'border-amber-600 bg-amber-600 text-white':'border-amber-200 bg-amber-50 text-amber-800')}>Pending Verification · {number(memberCounts.pendingVerification)}</button>
            </div>
            {memberViewFilter==='registered-free' && <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"><strong>Registered Free — all time.</strong><span className="ml-2 text-blue-700">These are actual accounts with stored registration records. The table shows the saved name, email, signup date and verification state.</span></div>}
            {memberViewFilter==='pending-verification' && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><div><strong>Pending Verification only</strong><span className="ml-2 text-amber-700">Showing accounts missing email and/or phone verification.</span></div><button type="button" onClick={()=>setMemberViewFilter('all')} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-black text-amber-800 hover:bg-amber-100">Show all sign-ups</button></div>}
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Search size={17} className="text-slate-400"/>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, email, plan or location" className="w-full bg-transparent text-sm outline-none"/>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">{selectedMemberIds.length} selected</span>
                <button disabled={!selectedMemberIds.length || bulkMemberAction} onClick={()=>handleBulkMemberAction('suspend')} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 disabled:opacity-40"><UserX size={14}/>Suspend selected</button>
                <button disabled={!selectedMemberIds.length || bulkMemberAction} onClick={()=>handleBulkMemberAction('delete')} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-40">{bulkMemberAction?<Loader2 size={14} className="animate-spin"/>:<Trash2 size={14}/>}Delete selected</button>
                {selectedMemberIds.length>0&&<button onClick={()=>setSelectedMemberIds([])} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Clear</button>}
              </div>
            </div>
            <TableShell scrollHeight={800}><table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all visible members" checked={allVisibleSelected} onChange={toggleVisibleSelection}/></th><th className="px-4 py-3">Member</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">{filteredMembers.map(m=>{
                const state=m.account_state || (m.banned?'suspended':m.is_active===false?'suspended':'active');
                const busy=memberActionId===m.id;
                const protectedAdmin=m.auth_role==='admin';
                const selected=selectedMemberIds.includes(m.id);
                const signupState = !m.auth_ready ? 'Authentication record missing' : !m.profile_ready ? 'Profile recovery pending' : !m.is_verified ? 'Email verification pending' : (!protectedAdmin && !m.phone_verified ? 'Phone verification pending' : null);
                return <tr key={m.id} className={selected?'bg-rose-50/40':''}>
                  <td className="px-4 py-3">{protectedAdmin?<span className="text-slate-300">—</span>:<input type="checkbox" aria-label={`Select ${m.email}`} checked={selected} onChange={()=>setSelectedMemberIds(current=>selected?current.filter(id=>id!==m.id):[...current,m.id])}/>}</td>
                  <td className="px-4 py-3"><div className="font-semibold">{m.username?('@'+m.username):(m.name||'Unnamed member')}</div>{m.username&&m.name&&m.name!==m.username&&<div className="text-xs text-slate-500">{m.name}</div>}<div className="text-xs text-slate-500">{m.email}</div><div className="mt-1 text-[11px] font-semibold text-slate-400">Promotional email: {m.marketing_email_opt_in?'Yes':'No'}</div>{m.location&&<div className="text-xs text-slate-400">{m.location}</div>}</td>
                  <td className="px-4 py-3 text-slate-600">{m.user_type||'user'}{protectedAdmin&&<div className="mt-1"><Pill tone="purple">Protected Admin</Pill></div>}</td>
                  <td className="px-4 py-3"><Pill tone="blue">{m.subscription_plan||'Registered Free'}</Pill>{m.token_buyer&&<div className="mt-1"><Pill tone="violet">Credit Buyer</Pill></div>}{m.subscription_end_date&&<div className="mt-1 text-xs font-semibold text-slate-500">{new Date(m.subscription_end_date).getUTCFullYear()>=9999?'Access: Unlimited':`Access until ${date(m.subscription_end_date)}`}</div>}</td>
                  <td className="px-4 py-3"><Pill tone={state==='active'?'green':state==='deleted'?'red':'amber'}>{state}</Pill>{signupState&&<div className="mt-1 max-w-xs text-xs font-semibold text-amber-700">{signupState}</div>}{m.ban_reason&&state!=='active'&&<div className="mt-1 max-w-xs text-xs text-slate-400">{String(m.ban_reason).replace(/^O2OL_(?:DELETED|SUSPENDED):\s*/,'')}</div>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{date(m.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {protectedAdmin ? <span className="text-xs font-semibold text-slate-400">Protected</span> : <>
                        <select
                          disabled={busy}
                          defaultValue=""
                          onChange={event=>{const unit=event.target.value;event.target.value='';if(unit)handleGrantAccessTime(m,unit);}}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 outline-none disabled:opacity-50"
                          aria-label={`Add access time for ${m.email}`}
                        >
                          <option value="" disabled>Add Time ▾</option>
                          <option value="hours">Hours…</option>
                          <option value="days">Days…</option>
                          <option value="weeks">Weeks…</option>
                          <option value="unlimited">Unlimited</option>
                        </select>
                        <select
                          disabled={busy}
                          value={m.subscription_plan==='Registered Free'?'':(m.subscription_plan==='Exclusive'?'Exclusive':'Premiere')}
                          onChange={event=>{ if(event.target.value) handleChangeTier(m,event.target.value); }}
                          className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700 outline-none disabled:opacity-50"
                          aria-label={`Change membership tier for ${m.email}`}
                        >
                          <option value="" disabled>Set tier…</option>
                          <option value="Premiere">Premiere</option>
                          <option value="Exclusive">Exclusive</option>
                        </select>
                        {state==='active' ? <>
                          <button disabled={busy} onClick={()=>handleMemberAction(m,'suspend')} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-50"><UserX size={14}/>Suspend</button>
                          <button disabled={busy} onClick={()=>handleMemberAction(m,'delete')} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50"><Trash2 size={14}/>Delete</button>
                        </> : <button disabled={busy} onClick={()=>handleMemberAction(m,'restore')} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 disabled:opacity-50">{busy?<Loader2 size={14} className="animate-spin"/>:<RotateCcw size={14}/>}Restore</button>}
                      </>}
                    </div>
                  </td>
                </tr>;
              })}</tbody>
            </table></TableShell>

            <Panel title="Visitor Registry / Audience Intelligence" subtitle="Persistent visitor history. Anonymous browser activity remains anonymous until the visitor voluntarily creates an account; then the existing visitor ID is linked to that Registered Free member." className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{number(visitorRows.length)} visitors · {{ '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days', all: 'all time' }[registryRange]}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Visitor Registry date range">
                  {[['7d','7 days'],['30d','30 days'],['90d','90 days'],['all','All time']].map(([value,label]) => (
                    <button key={value} type="button" onClick={() => { registryRangeRef.current = value; setRegistryRange(value); load(true); }} className={`rounded-full px-3 py-1.5 text-xs font-bold ${registryRange === value ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>
                  ))}
                </div>
              </div>
              {visitorRows.length ? <TableShell scrollHeight={780}><table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Visitor / Member</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">First / Last Seen</th>
                    <th className="px-4 py-3 text-right">Visits</th>
                    <th className="px-4 py-3">Source / Language</th>
                    <th className="px-4 py-3">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visitorRows.map(v=><tr key={v.visitor_id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{v.username?('@'+v.username):(v.email||('Visitor '+String(v.visitor_id).slice(0,8)))}</div>
                      {v.email&&<div className="text-xs text-slate-500">{v.email}</div>}
                      <div className="mt-1 font-mono text-[10px] text-slate-400">{String(v.visitor_id).slice(0,24)}</div>
                      {v.user_id&&<div className="mt-1 text-[11px] font-semibold text-slate-500">Promo email: {v.marketing_email_opt_in?'Yes':'No'}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={v.audience_status==='Credit Buyer'?'violet':v.audience_status==='Registered Free'?'blue':'slate'}>{v.audience_status==='Token Buyer'?'Credit Buyer':(v.audience_status||'Anonymous Visitor')}</Pill>{v.is_online&&<div className="mt-1"><Pill tone="green">On site now</Pill></div>}
                      {Number(v.paid_cents||0)>0&&<div className="mt-1 text-xs font-bold text-emerald-700">{(Number(v.paid_cents)/100).toLocaleString('en-US',{style:'currency',currency:'USD'})} paid</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500"><div>{date(v.first_seen)}</div><div className="mt-1 font-semibold text-slate-700">{date(v.last_seen)}</div></td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">{number(v.visits)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600"><div className="font-semibold">{v.original_source||'direct'}</div><div className="mt-1 uppercase">{v.language||'en'}</div></td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div><strong>{number(v.page_views)}</strong> views · <strong>{number(v.clicks)}</strong> clicks · <strong>{number(v.actions)}</strong> actions</div>
                      {v.current_route&&<div className="mt-1 font-semibold text-blue-700">Current/last route: {v.current_route}</div>}<div className="mt-1 max-w-md break-words text-slate-400">{(v.features||[]).slice(0,6).join(' · ') || (v.pages||[]).slice(0,6).join(' · ') || 'No labeled feature activity yet'}</div>
                    </td>
                  </tr>)}
                </tbody>
              </table></TableShell> : <Empty>No visitor activity in this date range yet. Try a wider range.</Empty>}
            </Panel>
          </div>}

          {section==='plans' && <div><Heading title="Plans & Billing" subtitle="Tier distribution, plan changes and payment records. Stripe remains the source of truth for sensitive billing actions."/><div className="mb-6 grid gap-4 sm:grid-cols-3">{(summary.plans||[]).map((p,i)=><Metric key={p.plan} icon={CreditCard} label={p.plan} value={number(p.count)} note="members" tone={i===0?'blue':i===1?'violet':'rose'}/>)}</div><div className="grid gap-6 xl:grid-cols-2"><Panel title="Tier Movements">{movements.length?<div className="space-y-2">{movements.slice(0,25).map(item=><div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="font-semibold">{item.email||item.user_id}</div><div className="mt-1 text-slate-600">{item.from_plan||'—'} → {item.to_plan||'—'} · {item.change_type||'change'}</div><div className="mt-1 text-xs text-slate-400">{date(item.effective_date||item.created_at)}</div></div>)}</div>:<Empty>No plan movements recorded yet.</Empty>}</Panel><Panel title="Recent Payments">{payments.length?<div className="space-y-2">{payments.slice(0,25).map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><div><div className="font-semibold">{item.email||item.user_id}</div><div className="text-xs text-slate-400">{date(item.created_at)}</div></div><div className="text-right"><div className="font-bold">{money(item.amount,item.currency)}</div><Pill tone={statusTone(item.status)}>{item.status||'unknown'}</Pill></div></div>)}</div>:<Empty>No payment records yet.</Empty>}</Panel></div></div>}

          {section==='love-notes' && <div><Heading title="Love Notes Operations" subtitle="Monitor scheduler adoption, scheduled volume, successful deliveries and failures."/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={Users} label="Scheduler Users" value={number(loveNotes.schedulers?.users_total)} note={`${number(loveNotes.schedulers?.users_30d)} in 30 days`} tone="blue"/><Metric icon={CalendarDays} label="Schedules Created" value={number(loveNotes.schedulers?.schedules_total)} note={`${number(loveNotes.schedulers?.schedules_30d)} in 30 days`} tone="violet"/><Metric icon={CheckCircle2} label="Passed" value={number(love.scheduled_passed)} note="successful scheduled sends" tone="green"/><Metric icon={AlertTriangle} label="Failed" value={number(love.scheduled_failed)} note="delivery failures" tone="rose"/><Metric icon={Clock3} label="Avg Schedules / User" value={decimal(loveNotes.schedulers?.avg_schedules_per_user)} note="all-time scheduler frequency" tone="amber"/></div><div className="mt-6 grid gap-6 xl:grid-cols-2"><Panel title="Scheduled Delivery Health"><DeliveryHealth firstLabel="Scheduled" firstValue={love.scheduled_total} passed={love.scheduled_passed} failed={love.scheduled_failed} pending={love.scheduled_pending}/></Panel><Panel title="Direct Delivery Health"><DeliveryHealth firstLabel="Sent" firstValue={direct.sent} passed={direct.passed} failed={direct.failed} pending={direct.pending}/></Panel></div><div className="mt-6">{(loveNotes.recent||[]).length?<TableShell><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Note</th><th className="px-4 py-3">Delivery</th><th className="px-4 py-3">Scheduled</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{loveNotes.recent.map(item=><tr key={item.id}><td className="px-4 py-3"><div className="font-semibold">{item.note_title||'Love Note'}</div><div className="text-xs text-slate-500">{item.email||item.user_id}</div></td><td className="px-4 py-3">{item.delivery_method||'—'}{item.recipient_phone_masked&&<div className="text-xs text-slate-400">{item.recipient_phone_masked}</div>}</td><td className="whitespace-nowrap px-4 py-3 text-slate-500">{item.scheduled_date||'—'} {item.scheduled_time||''}</td><td className="px-4 py-3"><Pill tone={statusTone(item.status)}>{item.status||'unknown'}</Pill>{item.failure_reason&&<div className="mt-1 max-w-xs text-xs text-rose-600">{item.failure_reason}</div>}</td></tr>)}</tbody></table></TableShell>:<Empty>No scheduled Love Notes yet.</Empty>}</div></div>}

          {section==='applications' && <div><Heading title="Professional Applications" subtitle="Licensed professionals, relationship professionals and contributors."/>{applications.length?<div className="grid gap-4 lg:grid-cols-2">{applications.map(item=><div key={`${item.application_type}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.applicant_name||'Unnamed applicant'}</p><p className="text-sm text-slate-500">{item.email||'No email'}</p></div><Pill tone={statusTone(item.status)}>{item.status}</Pill></div><div className="mt-3 text-sm text-slate-600"><div>Type: {String(item.application_type||'').replaceAll('_',' ')}</div><div>Submitted: {date(item.created_at)}</div>{item.rejection_reason&&<div className="mt-2 rounded-lg bg-rose-50 p-2 text-rose-700">{item.rejection_reason}</div>}</div></div>)}</div>:<Empty>No professional applications yet.</Empty>}</div>}

          {section==='moderation' && <div><Heading title="Moderation Queue" subtitle="Pending community, story and review content in one place."/>{moderation.length?<div className="space-y-3">{moderation.map(item=><div key={`${item.content_type}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-slate-400">{String(item.content_type||'').replaceAll('_',' ')}</p><p className="mt-1 font-bold">{item.title||'Untitled content'}</p></div><Pill tone={statusTone(item.status)}>{item.status}</Pill></div>{item.excerpt&&<p className="mt-3 text-sm leading-6 text-slate-600">{item.excerpt}</p>}<p className="mt-3 text-xs text-slate-400">Submitted {date(item.created_at)}</p></div>)}</div>:<Empty>No items waiting in moderation.</Empty>}</div>}

          {section==='support' && <div>
            <Heading title="Support & Problem Reports" subtitle="In-site support submissions and bug reports. The public support identity is support@one2onelove.com; no ERANT technical-support address is exposed to visitors."/>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Metric icon={MessageSquareText} label="All Reports" value={number(supportSummary.total)} note="suggestions + support + bug reports" tone="blue"/>
              <Metric icon={AlertTriangle} label="New / Unreviewed" value={number(supportSummary.new_count)} note="status = new" tone="amber"/>
              <Metric icon={Activity} label="Open Bug Reports" value={number(supportSummary.bug_count)} note="bug reports not closed" tone="rose"/>
            </div>
            {supportRows.length?<TableShell><table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">From</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Received</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{supportRows.map(item=><tr key={item.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3"><Pill tone={item.suggestion_type==='bug'?'red':'blue'}>{String(item.suggestion_type||'other').replaceAll('_',' ')}</Pill></td>
                <td className="px-4 py-3"><div className="font-semibold">{item.name||'Anonymous'}</div><div className="text-xs text-slate-500">{item.email||'No email supplied'}</div></td>
                <td className="max-w-xl whitespace-pre-wrap px-4 py-3 leading-6 text-slate-700">{item.suggestion}</td>
                <td className="px-4 py-3"><Pill tone={statusTone(item.status)}>{item.status||'new'}</Pill></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{date(item.created_at)}</td>
              </tr>)}</tbody>
            </table></TableShell>:<Empty>No support or problem reports yet.</Empty>}
          </div>}

          {section==='system' && <div><Heading title="System" subtitle="Administrator roles, AI usage and migration history. Secrets and credentials are never displayed."/><div className="grid gap-6 lg:grid-cols-3"><Panel title="AI Usage — 30 Days" className="lg:col-span-2">{(data?.system?.aiUsage30d||[]).length?<div className="space-y-2">{data.system.aiUsage30d.map(item=><div key={item.feature} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="font-semibold">{item.feature}</span><span className="text-sm text-slate-500">{number(item.uses)} uses · {number(item.users)} users</span></div>)}</div>:<Empty>No AI usage recorded.</Empty>}</Panel><Panel title="Non-Admin Auth Roles">{(data?.system?.authRoles||[]).map(item=><div key={item.role} className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="capitalize">{item.role}</span><strong>{number(item.count)}</strong></div>)}</Panel></div><Panel title="Migration History" className="mt-6">{(data?.system?.migrations||[]).length?<div className="space-y-2">{data.system.migrations.map(item=><div key={`${item.migration_key}-${item.applied_at}`} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-sm font-semibold">{item.migration_key}</span><span className="text-xs text-slate-400">{date(item.applied_at)}</span></div>{item.notes&&<p className="mt-1 text-xs text-slate-500">{item.notes}</p>}</div>)}</div>:<Empty>No migration records found.</Empty>}</Panel></div>}
        </div>
      </main>
    </div>
  );
}
