import React from 'react';
import { Activity, CalendarDays, MessageSquareText, Users } from 'lucide-react';

const num = value => Number(value || 0).toLocaleString('en-US');
const avg = value => Number(value || 0).toFixed(1);
const panels = [
  ['Sent messages · 30d','sent_30d',MessageSquareText],
  ['Sent messages · 7d','sent_7d',Activity],
  ['Average characters','avg_characters',MessageSquareText],
  ['Love Notes queued · 30d','queued_love_notes_30d',CalendarDays],
];

export default function MessageFeatureIntelligence({data,onRefresh,refreshing=false}) {
  const d = data || {}, totals = d.totals || {},channels = d.channels || [];
  const repeated = d.repeatedMessages || [],memberUsage = d.memberFrequency || [];
  return <section data-admin-message-intelligence className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="message-intelligence-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 id="message-intelligence-title" className="text-xl font-black text-slate-900">Message & Feature Intelligence</h3>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">Rolling 30 days. Understand which feature sent messages, quantity, usage frequency and average length. Message text, titles, recipient details and content fingerprints are never displayed.</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={refreshing} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">{refreshing?'Refreshing…':'Refresh'}</button>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {panels.map(([label,key,Icon])=><div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Icon size={18} className="mb-3 text-indigo-600"/><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{key==='avg_characters'?avg(totals[key]):num(totals[key])}</p>
      </div>)}
    </div>
    <h4 className="mt-6 font-black text-slate-900">Messages Sent by Feature</h4>
    <p className="mt-1 text-xs text-slate-500">Sending and scheduling are different events. Sent totals exclude queued Love Notes.</p>
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[760px] w-full text-sm">
      <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500"><tr><th className="px-3 py-3">Feature</th><th className="px-3 py-3">7 days</th><th className="px-3 py-3">30 days</th><th className="px-3 py-3">Members</th><th className="px-3 py-3">Guest sessions</th><th className="px-3 py-3">Avg characters</th><th className="px-3 py-3">Est. words</th></tr></thead>
      <tbody className="divide-y divide-slate-100">
        {channels.map(r=><tr key={r.feature}><td className="px-3 py-3 font-semibold">{r.feature}</td><td className="px-3 py-3">{num(r.messages_7d)}</td><td className="px-3 py-3">{num(r.messages_30d)}</td><td className="px-3 py-3">{num(r.members)}</td><td className="px-3 py-3">{num(r.anonymous_sessions)}</td><td className="px-3 py-3">{avg(r.avg_characters)}</td><td className="px-3 py-3">{avg(r.estimated_words)}</td></tr>)}
        {!channels.length&&<tr><td className="px-4 py-5 text-slate-500" colSpan={7}>No sent messages in this 30-day period.</td></tr>}
      </tbody>
    </table></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <div><h4 className="font-black text-slate-900">Most Commonly Repeated Messages</h4>
        <p className="mt-1 text-xs text-slate-500">Same-message occurrences, ranked without revealing what anyone wrote. One-off messages are omitted.</p>
        <div className="mt-3 space-y-2">
          {repeated.map(r=><div key={r.frequency_rank} className="flex justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm"><div className="font-bold">Repeated message #{num(r.frequency_rank)}<p className="text-xs font-normal text-slate-500">{r.feature} · Avg. {avg(r.avg_characters)} characters</p></div><div className="font-black">{num(r.sends)} uses</div></div>)}
          {!repeated.length&&<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No identical messages were sent more than once during this period.</p>}
        </div>
      </div>
      <div><h4 className="font-black text-slate-900"><Users className="mr-2 inline h-4 w-4"/>Individual Member Feature Frequency</h4>
        <p className="mt-1 text-xs text-slate-500">Top 100 member-feature combinations · distinct active days, page openings, clicks, actions and messages sent.</p>
        <div className="mt-3 max-h-[450px] overflow-auto rounded-xl border border-slate-200"><table className="min-w-[660px] w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 font-black uppercase text-slate-500"><tr><th className="px-3 py-3">Member / Feature</th><th className="px-3 py-3">Days</th><th className="px-3 py-3">Opens</th><th className="px-3 py-3">Clicks</th><th className="px-3 py-3">Actions</th><th className="px-3 py-3">Sent</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{memberUsage.map((r,i)=><tr key={r.member_id+r.feature+i}><td className="px-3 py-3"><strong className="block">{r.member}</strong><span className="text-slate-500">{r.feature}</span></td><td className="px-3 py-3">{num(r.active_days)}</td><td className="px-3 py-3">{num(r.opens)}</td><td className="px-3 py-3">{num(r.clicks)}</td><td className="px-3 py-3">{num(r.actions)}</td><td className="px-3 py-3">{num(r.messages)}</td></tr>)}
          {!memberUsage.length&&<tr><td colSpan={6} className="px-4 py-5 text-center text-slate-500">No registered member activity in the reporting period.</td></tr>}</tbody>
        </table></div>
      </div>
    </div>
  </section>;
}
