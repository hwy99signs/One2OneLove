import { Link } from 'react-router-dom';
import { FEATURE_PRICING } from '@/lib/featurePricing';
export default function FeaturePricing(){
  const groups=FEATURE_PRICING.reduce((acc,row)=>{(acc[row.category]||(acc[row.category]=[])).push(row);return acc;},{});
  return <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-pink-50 px-4 py-10"><section className="mx-auto max-w-7xl">
    <div className="rounded-[2rem] bg-gradient-to-r from-indigo-950 via-violet-800 to-fuchsia-700 p-7 text-white shadow-xl sm:p-10"><div className="text-xs font-black uppercase tracking-[.2em] text-amber-200">One2OneLove Feature Pricing</div><h1 className="mt-2 text-4xl font-black sm:text-5xl">No subscriptions. Pay only for what you choose.</h1><p className="mt-4 max-w-3xl text-white/80">Free social features stay free. For a locked feature, click it to see the price first. Nothing is deducted until you explicitly choose Unlock.</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/Credit" className="rounded-full bg-amber-300 px-5 py-3 font-black text-indigo-950">Add Credit</Link><Link to="/Home" className="rounded-full border border-white/30 px-5 py-3 font-black text-white">Back to One2OneLove</Link></div></div>
    <div className="mt-8 space-y-8">{Object.entries(groups).map(([group,rows])=><section key={group} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"><h2 className="bg-slate-950 px-5 py-4 text-xl font-black text-white">{group}</h2><div className="divide-y divide-slate-100">{rows.map(row=><div key={row.code} className="grid gap-3 p-5 md:grid-cols-[1.25fr_2fr_2fr_1.2fr]"><div className="font-black text-slate-900">{row.feature}</div><div><div className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Free portion</div><div className="mt-1 text-sm leading-6 text-slate-600">{row.free}</div></div><div><div className="text-[11px] font-black uppercase tracking-wider text-fuchsia-700">Paid portion</div><div className="mt-1 text-sm leading-6 text-slate-600">{row.paid}</div></div><div className="md:text-right"><div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Price</div><div className="mt-1 font-black text-indigo-800">{row.priceLabel}</div></div></div>)}</div></section>)}</div>
    <section className="mt-8 overflow-hidden rounded-[1.5rem] border border-rose-200 bg-white shadow-sm">
      <h2 className="bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-4 text-xl font-black text-white">Love Note SMS delivery by region</h2>
      <p className="px-5 pt-4 text-sm leading-6 text-slate-600">The exact destination price is shown again before the Love Note is sent. Writing and scheduling your own note remain free; AI writing is billed separately at $0.25 per generation.</p>
      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['United States & Canada','$0.29'],
          ['United Kingdom','$0.39'],
          ['Europe','$0.59'],
          ['Oceania','$0.39'],
          ['Asia','$0.69'],
          ['Latin America & Caribbean','$0.79'],
          ['Africa','$1.49'],
          ['Middle East','$0.99'],
        ].map(([region,price])=><div key={region} className="flex items-center justify-between gap-3 bg-white p-4"><span className="text-sm font-bold text-slate-700">{region}</span><span className="font-black text-rose-700">{price}/SMS</span></div>)}
      </div>
    </section>
    <p className="mx-auto mt-8 max-w-4xl text-center text-xs leading-5 text-slate-500">One-time unlocks remain unlocked for that account. Purchased reports include viewing and download/export. SMS prices depend on the recipient's destination and are shown before sending.</p>
  </section></main>;
}
