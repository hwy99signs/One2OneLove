import React from 'react';
import {ArrowLeft,ArrowRight,Coins,Heart} from 'lucide-react';
import {Button} from '@/components/ui/button';

export default function SubscriptionSelection({onBack,onSelectPlan}){
  return <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50 px-4 py-16">
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-violet-200 bg-white p-8 text-center shadow-xl">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white"><Heart className="h-8 w-8"/></div>
      <h1 className="mt-5 text-4xl font-black text-slate-950">Create Your FREE One2OneLove Account</h1>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">There is no recurring access plan to choose. Verify your free account, then use O2OL Tokens only when you choose a metered premium action.</p>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left"><div className="flex items-center gap-2 font-black text-amber-900"><Coins className="h-5 w-5"/>O2OL Tokens</div><p className="mt-1 text-sm leading-6 text-amber-800">Buying Tokens is optional. Package and feature prices are shown before purchase or use.</p></div>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {onBack&&<Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button>}
        <Button onClick={()=>onSelectPlan?.({name:'Free',accessModel:'free_tokens',price:0})} className="bg-slate-950 text-white">Continue to FREE Account<ArrowRight className="ml-2 h-4 w-4"/></Button>
      </div>
    </div>
  </div>;
}
