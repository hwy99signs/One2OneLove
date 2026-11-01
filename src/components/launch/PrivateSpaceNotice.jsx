import React from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useLanguage } from '@/Layout';
const TEXT={
 en:{title:'Your private space',body:'Public features are open without an account. Signing in is only needed to access your saved records, private conversations or member-only personal information.',signIn:'Sign in to your private space',back:'Explore free features'},
 es:{title:'Tu espacio privado',body:'Las funciones públicas están abiertas sin cuenta. Inicia sesión solo para ver tus datos guardados o conversaciones privadas.',signIn:'Acceder a tu espacio privado',back:'Explorar funciones gratuitas'},
 fr:{title:'Votre espace privé',body:'Les fonctionnalités publiques sont ouvertes sans compte. Connectez-vous uniquement pour vos données enregistrées et conversations privées.',signIn:'Accéder à votre espace privé',back:'Explorer les fonctions gratuites'},
 it:{title:'Il tuo spazio privato',body:'Le funzionalità pubbliche sono accessibili senza account. Accedi solo per i dati salvati e le conversazioni private.',signIn:'Accedi al tuo spazio privato',back:'Esplora le funzioni gratuite'},
 de:{title:'Dein privater Bereich',body:'Öffentliche Funktionen sind ohne Konto nutzbar. Melde dich nur für gespeicherte persönliche Daten und private Gespräche an.',signIn:'Zum privaten Bereich anmelden',back:'Kostenlose Funktionen entdecken'},
};
export default function PrivateSpaceNotice({path='/'}) {
 const {currentLanguage}=useLanguage(),t=TEXT[currentLanguage]||TEXT.en;
 return <section data-private-space-notice className="grid min-h-[65vh] place-items-center bg-gradient-to-br from-rose-50 via-white to-purple-50 p-5">
  <div className="w-full max-w-xl rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-lg">
   <LockKeyhole className="mx-auto h-11 w-11 text-purple-700"/>
   <h1 className="mt-5 text-2xl font-black text-slate-900">{t.title}</h1>
   <p className="mt-3 text-slate-600">{t.body}</p>
   <div className="mt-6 flex flex-wrap justify-center gap-3"><Link data-analytics-id="private-space-signin" to={'/SignIn?redirect='+encodeURIComponent(path)} className="rounded-xl bg-purple-700 px-5 py-3 font-bold text-white">{t.signIn}</Link>
    <Link to="/CooperativeGames" className="rounded-xl border border-purple-200 px-5 py-3 font-bold text-purple-700">{t.back}</Link></div>
  </div>
 </section>;
}
