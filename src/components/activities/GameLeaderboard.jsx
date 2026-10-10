import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export default function GameLeaderboard({game,compact=false,className=''}) {
  const {user}=useAuth();
  const {data,isLoading}=useQuery({
    queryKey:['gameLeaderboard',game,user?.id],
    queryFn:()=>apiRequest('/api/games/leaderboard?game='+encodeURIComponent(game)),
    enabled:Boolean(user?.id&&game),
    staleTime:30_000,
  });
  if(!user?.id||data?.enabled===false)return null;
  const rows=data?.rows||[];
  return (
    <div className={`rounded-2xl border border-amber-200 bg-amber-50/70 ${compact?'p-3':'p-4'} ${className}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800">
        <Trophy className="h-4 w-4"/> Top 5
      </div>
      {isLoading?<div className="text-xs font-semibold text-slate-500">Loading scores…</div>:
       rows.length?<div className="space-y-1.5">{rows.map(row=>
        <div key={row.rank} className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${row.isViewer?'bg-amber-200/70 font-black':'bg-white/70'}`}>
          <span><strong className="mr-2">{row.rank}.</strong>{row.firstName}</span>
          <span className="font-black">{Number(row.score).toLocaleString()} {data?.scoreLabel||''}</span>
        </div>)}</div>:
       <div className="text-xs font-semibold text-slate-600">No scores yet — be the first on the board.</div>}
    </div>
  );
}
