import {useEffect,useState} from 'react';
import {useLanguage} from '@/Layout';
import {readAttribution,resolveInvite} from '@/lib/inviteService';
const copy={
 en:name=>`${name} invited you to One2OneLove.`,es:name=>`${name} te invitó a One2OneLove.`,
 fr:name=>`${name} vous a invité sur One2OneLove.`,it:name=>`${name} ti ha invitato su One2OneLove.`,
 de:name=>`${name} hat dich zu One2OneLove eingeladen.`,
};
export default function InviteSignupBanner(){
 const{currentLanguage}=useLanguage(),[firstName,setFirstName]=useState(null);
 useEffect(()=>{let alive=true;const attr=readAttribution();if(!attr?.code)return;
  resolveInvite(attr.code).then(r=>{if(alive&&r?.valid&&r.inviterFirstName)setFirstName(r.inviterFirstName)}).catch(()=>{});
  return()=>{alive=false};
 },[]);
 if(!firstName)return null;
 return <div data-invite-signup-banner className="mx-auto mb-5 max-w-3xl rounded-2xl border border-fuchsia-200 bg-pink-50 px-5 py-4 text-center text-sm font-black text-fuchsia-900">{(copy[currentLanguage]||copy.en)(firstName)}</div>;
}
