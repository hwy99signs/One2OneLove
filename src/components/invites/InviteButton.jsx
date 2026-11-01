import React,{useState} from 'react';
import { UserPlus } from 'lucide-react';
import { useLanguage } from '@/Layout';
import InviteSheet from './InviteSheet';
const copy={en:'Invite someone to play',es:'Invita a alguien a jugar',fr:'Inviter quelqu’un à jouer',it:'Invita qualcuno a giocare',de:'Jemanden zum Spielen einladen'};
export default function InviteButton({game,surface='game_button',className=''}) {
 const {currentLanguage}=useLanguage(),[open,setOpen]=useState(false);
 return <>
  <button type="button" data-analytics-id={'invite-open-'+game} onClick={()=>setOpen(true)} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2.5 text-sm font-black text-white shadow-lg hover:from-fuchsia-600 hover:to-purple-700 ${className}`}><UserPlus size={18}/>{copy[currentLanguage]||copy.en}</button>
  <InviteSheet open={open} onClose={()=>setOpen(false)} game={game} surface={surface}/>
 </>;
}
