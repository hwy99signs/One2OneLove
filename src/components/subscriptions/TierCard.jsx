import React from 'react';
import {Coins} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';

export default function TierCard({tier,onSelect,isSelected=false}){
  const name=tier?.name||'Free';
  const isTokenPackage=Boolean(tier?.tokens);
  return <Card className={`h-full border-2 ${isSelected?'border-violet-500':'border-slate-200'}`}>
    <CardHeader><CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-violet-600"/>{name}</CardTitle></CardHeader>
    <CardContent>
      <p className="text-sm leading-6 text-slate-600">{tier?.description||'Free verified One2OneLove account. Metered premium actions use O2OL Tokens.'}</p>
      <div className="mt-4 text-3xl font-black">{isTokenPackage ? String(tier.tokens)+' Tokens' : 'FREE'}</div>
      {isTokenPackage&&tier?.price!=null&&<div className="text-sm font-semibold text-slate-500">{'US$'+Number(tier.price).toFixed(2)+' one-time'}</div>}
      <Button onClick={()=>onSelect?.(tier||{name:'Free',price:0})} className="mt-5 w-full bg-slate-950 text-white">{isSelected?'Selected':isTokenPackage?'Choose Package':'Continue'}</Button>
    </CardContent>
  </Card>;
}
