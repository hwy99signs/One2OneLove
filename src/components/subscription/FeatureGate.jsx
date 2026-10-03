import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Coins,Lock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card,CardContent} from '@/components/ui/card';
import {useAuth} from '@/contexts/AuthContext';
import {useFeatureAccess} from '@/hooks/useFeatureAccess';
import {motion} from 'framer-motion';

export default function FeatureGate({feature,children,fallback=null,showUpgradePrompt=true}){
  const {user}=useAuth();
  const {hasAccess}=useFeatureAccess(feature);
  if(hasAccess)return <>{children}</>;
  if(fallback)return <>{fallback}</>;
  if(!showUpgradePrompt)return null;

  const signedIn=Boolean(user?.id);
  return <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full">
    <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-amber-50">
      <CardContent className="py-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg"><Lock className="h-8 w-8"/></div>
        <h3 className="mt-4 text-2xl font-black text-slate-950">{signedIn?'Verify Your Free Account':'Create a FREE Account'}</h3>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">{signedIn?'Complete phone verification to use protected member actions. Metered premium actions show their O2OL Token cost before use.':'One2OneLove membership is free. Create an account and verify your email and phone to participate; buy Tokens only when you choose a metered premium service.'}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={signedIn?'/VerifyPhone':'/SignUp?type=individual'}><Button className="bg-slate-950 text-white">{signedIn?'Verify Phone':'Create FREE Account'}<ArrowRight className="ml-2 h-4 w-4"/></Button></Link>
          {signedIn&&<Link to="/Tokens"><Button variant="outline"><Coins className="mr-2 h-4 w-4"/>Token Wallet</Button></Link>}
        </div>
      </CardContent>
    </Card>
  </motion.div>;
}

export function FeatureLockBadge({feature,className=''}){
  const {hasAccess}=useFeatureAccess(feature);
  if(hasAccess)return null;
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold text-violet-700 ${className}`}><Lock className="h-3 w-3"/>Free Account</span>;
}

export function FeatureAccessMessage({feature}){
  const {hasAccess}=useFeatureAccess(feature);
  if(hasAccess)return null;
  return <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
    <div className="flex items-start gap-3"><Lock className="mt-0.5 h-5 w-5 shrink-0 text-violet-700"/><div><p className="text-sm font-black text-slate-900">Verified free account required</p><p className="mt-1 text-sm text-slate-600">Create or verify your free One2OneLove account. If this action is metered, its O2OL Token cost will be shown before use.</p><Link to="/SignUp?type=individual"><Button size="sm" variant="outline" className="mt-2">Create FREE Account<ArrowRight className="ml-1 h-3 w-3"/></Button></Link></div></div>
  </div>;
}
