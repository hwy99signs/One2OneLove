import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, CreditCard, Heart, Loader2, LockKeyhole,
  RefreshCw, TrendingUp, Users,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getAdminAnalytics } from '../lib/adminService';

function number(value) { return Number(value || 0).toLocaleString(); }
function shortDate(value) {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

export default function Analytics() {
  const navigate = useNavigate();
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [error,setError] = useState(null);

  const load = async (refresh=false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try { setData(await getAdminAnalytics()); }
    catch (err) { setError(err); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { load(false); }, []);

  const signupTotal = useMemo(() => (data?.signups || []).reduce((sum,row)=>sum+Number(row.signups||0),0),[data]);
  const directTotal = useMemo(() => (data?.loveNotes || []).reduce((sum,row)=>sum+Number(row.direct_sent||0),0),[data]);
  const scheduledTotal = useMemo(() => (data?.loveNotes || []).reduce((sum,row)=>sum+Number(row.scheduled||0),0),[data]);
  const featureTotal = useMemo(() => (data?.featureDaily || []).reduce((sum,row)=>sum+Number(row.events||0),0),[data]);

  if (loading) return <div className="min-h-screen bg-slate-50 grid place-items-center p-4"><div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><Loader2 className="mx-auto animate-spin text-rose-500" size={34}/><h1 className="mt-4 text-xl font-bold">Loading Analytics</h1><p className="mt-2 text-sm text-slate-500">Building your One2OneLove trend view.</p></div></div>;
  if (error) {
    const unauthorized=error.status===401;
    return <div className="min-h-screen bg-slate-50 grid place-items-center p-4"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><LockKeyhole className="mx-auto text-rose-600" size={38}/><h1 className="mt-4 text-xl font-bold">{unauthorized?'Sign in required':'Administrator access required'}</h1><p className="mt-2 text-sm text-slate-500">Analytics is restricted to an authorized One2OneLove administrator account.</p><button onClick={()=>navigate(unauthorized?'/SignIn':'/Admin')} className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Go back</button></div></div>;
  }

  const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0' };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3"><button onClick={()=>navigate('/Admin')} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ArrowLeft size={18}/></button><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">One2OneLove Admin</p><h1 className="text-xl font-black">Analytics</h1></div></div>
          <button onClick={()=>load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={refreshing?'animate-spin':''}/>Refresh</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6"><h2 className="text-2xl font-black tracking-tight">30-Day Trend View</h2><p className="mt-1 text-sm text-slate-500">Graphs are built from actual One2OneLove records and feature-use events. They will become more meaningful as launch traffic grows.</p></div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} label="New Signups" value={number(signupTotal)} note="last 30 days"/>
          <Metric icon={Heart} label="Direct Love Notes" value={number(directTotal)} note="sent in last 30 days"/>
          <Metric icon={TrendingUp} label="Scheduled Love Notes" value={number(scheduledTotal)} note="created in last 30 days"/>
          <Metric icon={BarChart3} label="Tracked Feature Activity" value={number(featureTotal)} note="page-use events in last 30 days"/>
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

          <Panel title="Most-Used Features" subtitle="30-day activity by feature, combining tracked visits with saved feature actions where available.">
            <ChartFrame height={340}><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.featureRank||[]} layout="vertical" margin={{ top: 5,right: 20,left: 35,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="feature" width={125}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="activity" name="Activity"/></BarChart></ResponsiveContainer></ChartFrame>
          </Panel>

          <Panel title="Daily Feature Activity" subtitle="How often members are opening tracked features, plus unique users each day.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.featureDaily||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Legend/><Line type="monotone" dataKey="events" name="Feature events" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="users" name="Unique users" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
          </Panel>

          <Panel title="Community Activity" subtitle="Daily posts and comments.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.community||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Legend/><Line type="monotone" dataKey="posts" name="Posts" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="comments" name="Comments" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
          </Panel>

          <Panel title="Payment Activity" subtitle="Daily billing records created during the last 30 days.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.payments||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={shortDate} contentStyle={tooltipStyle}/><Line type="monotone" dataKey="payments" name="Payments" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></ChartFrame>
          </Panel>

          <Panel title="Current Tier Distribution" subtitle="Basic, Premier and Exclusive members right now.">
            <ChartFrame><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.tiers||[]} margin={{ top: 10,right: 15,left: -10,bottom: 0 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="plan"/><YAxis allowDecimals={false}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="count" name="Members"/></BarChart></ResponsiveContainer></ChartFrame>
          </Panel>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900"><div className="flex items-start gap-3"><CreditCard className="mt-0.5 shrink-0" size={18}/><div><strong>Direct-send delivery status:</strong> Sent is already measurable. Passed, Failed and Pending will start reflecting carrier delivery receipts when the SMS provider callback is connected. Until then, those values remain zero rather than guessing.</div></div></div>
      </main>
    </div>
  );
}
