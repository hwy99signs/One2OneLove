import React from 'react';
import { Link } from 'react-router-dom';
import { DoorOpen, LockKeyhole } from 'lucide-react';
import { useLanguage } from '@/Layout';
import { useAuth } from '@/contexts/AuthContext';

const COPY = {
  en:{ eyebrow:'ONE2ONELOVE OPEN HOUSE', title:'Explore this feature free', body:'You can look around without an account. Sign in or create an account when you want to save personal information, post, or use protected member actions.', signIn:'Sign In', signUp:'Create Account', memberAction:'Credit & Billing', protected:'Personal actions stay private and protected.' },
  es:{ eyebrow:'JORNADA DE PUERTAS ABIERTAS ONE2ONELOVE', title:'Explora esta función gratis', body:'Puedes explorar sin una cuenta. Inicia sesión o crea una cuenta cuando quieras guardar información personal, publicar o usar acciones protegidas para miembros.', signIn:'Iniciar sesión', signUp:'Crear cuenta', memberAction:'Crédito y Facturación', protected:'Las acciones personales permanecen privadas y protegidas.' },
  fr:{ eyebrow:'PORTES OUVERTES ONE2ONELOVE', title:'Explorez cette fonction gratuitement', body:'Vous pouvez parcourir cette fonction sans compte. Connectez-vous ou créez un compte pour enregistrer des informations personnelles, publier ou utiliser des actions membres protégées.', signIn:'Se connecter', signUp:'Créer un compte', memberAction:'Crédit et Facturation', protected:'Les actions personnelles restent privées et protégées.' },
  it:{ eyebrow:'OPEN HOUSE ONE2ONELOVE', title:'Esplora questa funzione gratis', body:'Puoi esplorare senza un account. Accedi o crea un account quando vuoi salvare informazioni personali, pubblicare o usare azioni protette per i membri.', signIn:'Accedi', signUp:'Crea account', memberAction:'Credito e Fatturazione', protected:'Le azioni personali restano private e protette.' },
  de:{ eyebrow:'ONE2ONELOVE OPEN HOUSE', title:'Diese Funktion kostenlos erkunden', body:'Du kannst diese Funktion ohne Konto ansehen. Melde dich an oder erstelle ein Konto, wenn du persönliche Informationen speichern, posten oder geschützte Mitgliederaktionen nutzen möchtest.', signIn:'Anmelden', signUp:'Konto erstellen', memberAction:'Credit & Abrechnung', protected:'Persönliche Aktionen bleiben privat und geschützt.' }
};

export default function OpenHouseBrowseNotice({ compact=false }) {
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const t = COPY[currentLanguage] || COPY.en;
  return (
    <section className={`rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-cyan-50 ${compact?'p-3':'p-4 sm:p-5'} shadow-sm`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-amber-700"><DoorOpen className="h-4 w-4"/>{t.eyebrow}</div>
          <h2 className="mt-1 text-lg font-black text-slate-900">{t.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{t.body}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><LockKeyhole className="h-3.5 w-3.5"/>{t.protected}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {user?.id ? (
            <Link to="/Subscription?source=open-house" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-slate-800">{t.memberAction}</Link>
          ) : (
            <>
              <Link to="/SignIn?source=open-house" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">{t.signIn}</Link>
              <Link to="/SignUp?source=open-house" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-slate-800">{t.signUp}</Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
