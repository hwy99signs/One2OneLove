import { X, LockKeyhole, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function UnlockPriceDialog({ open,title,priceCents,priceLabel,description,balanceCents=null,busy=false,error='',onUnlock,onClose }) {
  if(!open) return null;
  const price = priceCents==null ? priceLabel : '$'+(Number(priceCents)/100).toFixed(2);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/40 bg-white p-6 text-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-label={title||'Unlock feature'} onMouseDown={e=>e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Close without purchasing" className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5"/></button>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-700"><LockKeyhole className="h-7 w-7"/></div>
        <h2 className="mt-4 text-center text-2xl font-black">{title||'Unlock this feature'}</h2>
        <div className="mt-3 text-center text-4xl font-black text-fuchsia-700">{price}</div>
        {description && <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-600">{description}</p>}
        {balanceCents!=null && <p className="mt-3 text-center text-xs font-bold text-slate-500">Your Credit balance: {'$'+(Number(balanceCents)/100).toFixed(2)}</p>}
        {error && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">{error}</div>}
        <Button type="button" onClick={onUnlock} disabled={busy||!onUnlock} className="mt-5 min-h-12 w-full rounded-xl bg-fuchsia-600 font-black text-white hover:bg-fuchsia-700 disabled:opacity-60">
          <CreditCard className="mr-2 h-4 w-4"/>{busy?'Unlocking…':'Unlock for '+price}
        </Button>
        <button type="button" onClick={onClose} className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-black text-slate-500 hover:bg-slate-100">No thanks — close</button>
        <p className="mt-3 text-center text-[11px] leading-4 text-slate-400">Viewing this price does not charge your account. Credit is deducted only after you choose Unlock.</p>
        <div className="mt-3 text-center"><Link to="/Credit" className="text-xs font-black text-blue-700 underline">Add Credit</Link></div>
      </div>
    </div>
  );
}
