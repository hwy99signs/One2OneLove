import React,{useCallback,useEffect,useState} from 'react';
import {BarChart3,RefreshCw,ShieldAlert} from 'lucide-react';
import {apiRequest} from '@/lib/apiClient';
import {useLanguage} from '@/Layout';
const copy={
 en:{title:'Invite Growth & Referrals',subtitle:'From shared links to verified accounts. Owner/test activity is excluded.',refresh:'Refresh',from:'From',to:'To',shares:'Invites opened',visits:'Landing visits',signups:'Registrations',verified:'Verified referrals',rejected:'Rejected',members:'Verified site members',goal:'Progress to 5,000 members',games:'By game',surfaces:'By source',channels:'By share channel',top:'Top inviters',name:'Inviter',qualified:'Verified referrals',disable:'Disable code',confirm:'Disable this invitation code? Existing historical statistics remain.',error:'Unable to retrieve invite analytics.',empty:'No invite activity in this period.'},
 es:{title:'Crecimiento e Invitaciones',subtitle:'De enlaces compartidos a cuentas verificadas. Se excluyen las pruebas.',refresh:'Actualizar',from:'Desde',to:'Hasta',shares:'Enlaces compartidos',visits:'Visitas',signups:'Registros',verified:'Referidos verificados',rejected:'Rechazados',members:'Miembros verificados',goal:'Meta de 5.000 miembros',games:'Por juego',surfaces:'Por origen',channels:'Por canal',top:'Principales invitadores',name:'Invitador',qualified:'Referidos verificados',disable:'Desactivar código',confirm:'¿Desactivar este código de invitación?',error:'No se pueden mostrar estadísticas.',empty:'Sin actividad en este periodo.'},
 fr:{title:'Croissance et Invitations',subtitle:'Des liens partagés aux comptes vérifiés, hors tests.',refresh:'Actualiser',from:'Du',to:'Au',shares:'Partages',visits:'Visites',signups:'Inscriptions',verified:'Invités vérifiés',rejected:'Rejetés',members:'Membres vérifiés',goal:'Objectif 5 000 membres',games:'Par jeu',surfaces:'Par origine',channels:'Par canal',top:'Meilleurs invitants',name:'Invitant',qualified:'Invités vérifiés',disable:'Désactiver le code',confirm:'Désactiver ce code ?',error:'Statistiques indisponibles.',empty:'Aucune activité.'},
 it:{title:'Crescita e Inviti',subtitle:'Dai link condivisi agli account verificati, esclusi i test.',refresh:'Aggiorna',from:'Dal',to:'Al',shares:'Condivisioni',visits:'Visite',signups:'Iscrizioni',verified:'Invitati verificati',rejected:'Rifiutati',members:'Membri verificati',goal:'Obiettivo 5.000 membri',games:'Per gioco',surfaces:'Per origine',channels:'Per canale',top:'Migliori invitanti',name:'Invitante',qualified:'Invitati verificati',disable:'Disattiva codice',confirm:'Disattivare il codice?',error:'Statistiche non disponibili.',empty:'Nessuna attività.'},
 de:{title:'Einladungen & Wachstum',subtitle:'Von geteilten Links bis verifizierte Konten; Tests ausgeschlossen.',refresh:'Aktualisieren',from:'Von',to:'Bis',shares:'Geteilte Links',visits:'Besuche',signups:'Anmeldungen',verified:'Bestätigte Empfehlungen',rejected:'Abgelehnt',members:'Verifizierte Mitglieder',goal:'Ziel: 5.000 Mitglieder',games:'Nach Spiel',surfaces:'Nach Quelle',channels:'Nach Kanal',top:'Top-Einladende',name:'Einladende Person',qualified:'Bestätigte Empfehlungen',disable:'Code deaktivieren',confirm:'Diesen Code deaktivieren?',error:'Statistiken nicht verfügbar.',empty:'Noch keine Aktivität.'},
};
const day=d=>d.toISOString().slice(0,10);
const number=v=>Number(v||0).toLocaleString('en-US');
export default function InvitesPanel(){
 const{currentLanguage}=useLanguage(),t=copy[currentLanguage]||copy.en;
 const[from,setFrom]=useState(day(new Date(Date.now()-30*86400000))),[to,setTo]=useState(day(new Date())),[data,setData]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const refresh=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const q=new URLSearchParams({from:new Date(from+'T00:00:00').toISOString(),to:new Date(to+'T23:59:59').toISOString()});
   setData(await apiRequest('/api/admin/invites/summary?'+q));
  }catch(e){setError(e?.message||t.error)}finally{setLoading(false)}
 },[from,to,t.error]);
 useEffect(()=>{refresh()},[refresh]);
 const disable=async userId=>{
  if(!window.confirm(t.confirm))return;
  try{await apiRequest('/api/admin/invites/codes/'+encodeURIComponent(userId)+'/disable',{method:'POST',body:{}});
   await refresh()}catch(e){setError(e?.message||t.error)}
 };
 const events=data?.events||[],referrals=data?.referrals||[],top=data?.top||[];
 const group=(name,values,key)=> <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">{name}</h3>
  <div className="mt-3 max-h-80 overflow-auto">{values.length?values.map((v,i)=><div key={i} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm"><span>{v[key]||'—'} · {v.event||v.status||''}</span><strong>{number(v.total)}</strong></div>):<p className="text-sm text-slate-500">{t.empty}</p>}</div></section>;
 const totals=data?.totals||{},value=Math.min(100,100*(Number(data?.verifiedMembers||0)/5000));
 return <div data-admin-invites-panel className="space-y-5">
   <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-black">{t.title}</h2><p className="text-sm text-slate-600">{t.subtitle}</p></div><button type="button" disabled={loading} onClick={refresh} data-analytics-id="admin-invites-refresh" className="inline-flex gap-2 rounded-xl bg-purple-700 px-4 py-3 font-bold text-white"><RefreshCw size={17}/>{t.refresh}</button></header>
   <div className="flex flex-wrap gap-4"><label className="text-xs font-bold">{t.from}<input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="mt-1 block rounded-lg border p-2"/></label><label className="text-xs font-bold">{t.to}<input type="date" value={to} onChange={e=>setTo(e.target.value)} className="mt-1 block rounded-lg border p-2"/></label></div>
   {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700"><ShieldAlert className="mr-2 inline" size={17}/>{error}</p>}
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[[t.shares,totals.sharesOpened],[t.visits,totals.landings],[t.signups,totals.signups],[t.verified,totals.qualified],[t.rejected,totals.rejected],[t.members,data?.verifiedMembers]].map(([label,v],i)=><div key={i} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-purple-700">{number(v)}</p></div>)}</div>
   <div className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="font-black">{t.goal}</h3><div className="mt-3 h-4 overflow-hidden rounded-full bg-purple-100"><div className="h-full rounded-full bg-pink-600" style={{width:value+'%'}}/></div><p className="mt-2 text-sm">{number(data?.verifiedMembers)} / 5,000</p></div>
   <div className="grid gap-4 lg:grid-cols-3">{group(t.games,[...events,...referrals].filter(x=>x.game),'game')}{group(t.surfaces,events,'surface')}{group(t.channels,events.filter(x=>x.channel),'channel')}</div>
   <section className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="font-black">{t.top}</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead><tr><th className="p-2">{t.name}</th><th className="p-2">{t.qualified}</th><th className="p-2">Code</th><th className="p-2"/></tr></thead><tbody>{top.map(r=><tr key={r.user_id} className="border-t"><td className="p-2">{r.name}</td><td className="p-2">{number(r.qualified)}</td><td className="p-2 font-mono">{r.code||'—'}</td><td className="p-2"><button disabled={!r.code} onClick={()=>disable(r.user_id)} className="rounded-lg border border-red-200 px-3 py-2 text-red-700">{t.disable}</button></td></tr>)}</tbody></table></div></section>
 </div>;
}
