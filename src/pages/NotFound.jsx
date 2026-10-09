import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { useLanguage } from '@/Layout';

const COPY={
 en:{title:'Page Not Found',body:'We could not find that One2OneLove page. The address may be outdated or typed incorrectly.',home:'Go to Home',back:'Go Back',path:'Requested address'},
 es:{title:'Página No Encontrada',body:'No pudimos encontrar esa página de One2OneLove. La dirección puede estar desactualizada o escrita incorrectamente.',home:'Ir al Inicio',back:'Volver',path:'Dirección solicitada'},
 fr:{title:'Page Introuvable',body:'Nous ne trouvons pas cette page One2OneLove. L’adresse est peut-être ancienne ou incorrecte.',home:'Accueil',back:'Retour',path:'Adresse demandée'},
 it:{title:'Pagina Non Trovata',body:'Non riusciamo a trovare questa pagina One2OneLove. L’indirizzo potrebbe essere vecchio o digitato in modo errato.',home:'Vai alla Home',back:'Indietro',path:'Indirizzo richiesto'},
 de:{title:'Seite Nicht Gefunden',body:'Diese One2OneLove-Seite wurde nicht gefunden. Die Adresse ist möglicherweise veraltet oder falsch eingegeben.',home:'Zur Startseite',back:'Zurück',path:'Angeforderte Adresse'},
};
export default function NotFound(){
 const {currentLanguage}=useLanguage(); const t=COPY[currentLanguage]||COPY.en; const location=useLocation();
 return <main className="min-h-[68vh] bg-gradient-to-b from-rose-50 via-white to-purple-50 px-4 py-16">
  <section className="mx-auto max-w-2xl rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xl">
   <SearchX className="mx-auto h-14 w-14 text-rose-500"/>
   <h1 className="mt-5 text-4xl font-black text-slate-950">{t.title}</h1>
   <p className="mx-auto mt-3 max-w-xl text-slate-600">{t.body}</p>
   <div className="mx-auto mt-5 max-w-xl rounded-xl bg-slate-50 px-4 py-3 text-left text-xs text-slate-500"><strong>{t.path}:</strong> <span className="break-all font-mono">{location.pathname}</span></div>
   <div className="mt-7 flex flex-wrap justify-center gap-3">
    <button type="button" onClick={()=>window.history.back()} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 font-bold text-slate-700"><ArrowLeft className="h-4 w-4"/>{t.back}</button>
    <Link to="/Home" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-3 font-black text-white"><Home className="h-4 w-4"/>{t.home}</Link>
   </div>
  </section>
 </main>;
}
