import {useEffect,useState} from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { useLanguage } from '@/Layout';
import InviteButton from './InviteButton';
const text={en:'Good game! Want to challenge someone?',es:'¡Buen juego! ¿Quieres desafiar a alguien?',fr:'Bravo ! Envie de défier quelqu’un ?',it:'Bella partita! Vuoi sfidare qualcuno?',de:'Gut gespielt! Möchtest du jemanden herausfordern?'};
export default function EndOfRoundInvite({game,finished=false}){
 const {currentLanguage}=useLanguage(),[dismissed,setDismissed]=useState(false),[seen,setSeen]=useState(false);
 useEffect(()=>{if(finished&&!seen)setSeen(true)},[finished,seen]);
 if(!seen||dismissed)return null;
 return <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-950 shadow" data-invite-game-end={game}>
   <span className="font-bold">{text[currentLanguage]||text.en}</span>
   <div className="flex items-center gap-2"><InviteButton game={game} surface="game_end"/><button data-analytics-id={'invite-end-dismiss-'+game} type="button" aria-label="Dismiss" onClick={()=>setDismissed(true)} className="rounded-full p-2 hover:bg-amber-100"><X size={18}/></button></div>
  </div>;
}
EndOfRoundInvite.propTypes={game:PropTypes.string.isRequired,finished:PropTypes.bool};
