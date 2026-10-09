import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock3, Home } from 'lucide-react';
import { useLanguage } from '@/Layout';

const COPY={
 en:{eyebrow:'ONE2ONELOVE',title:'This Feature Is Not Available Yet',body:'This link points to a feature that is not part of the current launch. Nothing is broken — we are keeping unfinished features out of the live experience until they are ready.',home:'Go to Home',back:'Go Back'},
 es:{eyebrow:'ONE2ONELOVE',title:'Esta Función Aún No Está Disponible',body:'Este enlace apunta a una función que todavía no forma parte del lanzamiento actual. No está rota; la mantenemos fuera de la experiencia hasta que esté lista.',home:'Ir al Inicio',back:'Volver'},
 fr:{eyebrow:'ONE2ONELOVE',title:'Cette Fonction N’est Pas Encore Disponible',body:'Ce lien mène à une fonction qui ne fait pas encore partie du lancement actuel. Rien n’est cassé; nous la gardons hors de l’expérience jusqu’à ce qu’elle soit prête.',home:'Accueil',back:'Retour'},
 it:{eyebrow:'ONE2ONELOVE',title:'Questa Funzione Non È Ancora Disponibile',body:'Questo link porta a una funzione che non fa ancora parte del lancio attuale. Non è rotta; la teniamo fuori dall’esperienza finché non è pronta.',home:'Vai alla Home',back:'Indietro'},
 de:{eyebrow:'ONE2ONELOVE',title:'Diese Funktion Ist Noch Nicht Verfügbar',body:'Dieser Link führt zu einer Funktion, die noch nicht Teil des aktuellen Starts ist. Nichts ist kaputt; unfertige Funktionen bleiben verborgen, bis sie bereit sind.',home:'Zur Startseite',back:'Zurück'},
};
export default function FeatureUnavailable({feature}){
 const {currentLanguage}=useLanguage(); const t=COPY[currentLanguage]||COPY.en;
 return <main className="min-h-[68vh] bg-gradient-to-b from-amber-50 via-white to-rose-50 px-4 py-16">
  <section className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
   <Clock3 className="mx-auto h-14 w-14 text-amber-500"/>
   <p className="mt-4 text-xs font-black uppercase tracking-[.18em] text-amber-700">{t.eyebrow}</p>
   <h1 className="mt-2 text-3xl font-black text-slate-950">{t.title}</h1>
   {feature&&<p className="mt-2 text-sm font-bold text-slate-500">{feature}</p>}
   <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">{t.body}</p>
   <div className="mt-7 flex flex-wrap justify-center gap-3">
    <button type="button" onClick={()=>window.history.back()} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 font-bold text-slate-700"><ArrowLeft className="h-4 w-4"/>{t.back}</button>
    <Link to="/Home" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-black text-white"><Home className="h-4 w-4"/>{t.home}</Link>
   </div>
  </section>
 </main>;
}
