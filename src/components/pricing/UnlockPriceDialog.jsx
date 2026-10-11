import { X, LockKeyhole, CreditCard, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnlockPriceDialog({
  open,title,priceCents,priceLabel,terms,description,balanceCents=null,gameCreditCents=null,promotion=null,
  busy=false,error='',onUnlock,onClose,creditReturn=null
}) {
  if(!open) return null;
  const numericPrice=priceCents==null?null:Number(priceCents);
  const price=numericPrice==null?priceLabel:'$'+(numericPrice/100).toFixed(2);
  const freeToday=Boolean(promotion?.free);
  const combinedBalance=Number(balanceCents||0)+Number(gameCreditCents||0);
  const shortOnCredit=!freeToday&&numericPrice!=null&&balanceCents!=null&&combinedBalance<numericPrice;
  const goAddCredit=()=>{
    const returnTo=creditReturn||window.location.pathname+window.location.search;
    window.location.assign('/Credit?return='+encodeURIComponent(returnTo));
  };
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/40 bg-white p-6 text-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-label={title||'Unlock feature'} onMouseDown={e=>e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5"/></button>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-700"><LockKeyhole className="h-7 w-7"/></div>
        <h2 className="mt-4 text-center text-2xl font-black">{title||'Unlock this feature'}</h2>
        <div className="mt-3 text-center text-4xl font-black text-fuchsia-700">{freeToday?'$0.00':price}</div>
        {freeToday&&<div className="mt-2 text-center text-sm font-black text-emerald-700">Free today — {promotion?.name||'promotion'}</div>}
        {(terms||description)&&<p className="mx-auto mt-3 max-w-sm text-center text-sm font-bold leading-6 text-slate-600">{terms||description}</p>}
        {!freeToday&&gameCreditCents!=null&&Number(gameCreditCents)>0&&(
          <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
            <WalletCards className="h-4 w-4"/>Game Credit balance: {'$'+(Number(gameCreditCents)/100).toFixed(2)} (applied first)
          </div>
        )}
        {!freeToday&&balanceCents!=null&&(
          <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
            <WalletCards className="h-4 w-4"/>Credit balance: {'$'+(Number(balanceCents)/100).toFixed(2)}
          </div>
        )}
        {error&&!shortOnCredit&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">{error}</div>}
        <Button
          type="button"
          onClick={shortOnCredit?goAddCredit:onUnlock}
          disabled={busy||(!shortOnCredit&&!onUnlock)}
          className="mt-5 min-h-12 w-full rounded-xl bg-fuchsia-600 font-black text-white hover:bg-fuchsia-700 disabled:opacity-60"
        >
          <CreditCard className="mr-2 h-4 w-4"/>
          {busy?'Unlocking…':shortOnCredit?'Add Credit':'Unlock'}
        </Button>
      </div>
    </div>
  );
}
