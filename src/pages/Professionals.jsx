import React from 'react';
import { ArrowLeft, BadgeCheck, BriefcaseBusiness } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './Layout';

const COPY = {
  en:{ badge:'NOW ON-BOARDING', title:'Therapists & Professionals', coming:'PROFESSIONAL DIRECTORY COMING SOON', body:'We are currently onboarding qualified licensed therapists, counselors, relationship coaches, educators and relationship-focused professionals.', check:'CHECK BACK LATER', apply:'Are you a professional?', applyBody:'Apply now to be considered for the One2OneLove professional network.', applyButton:'Apply to Join', back:'Back to Home' },
  es:{ badge:'AHORA INCORPORANDO', title:'Terapeutas y Profesionales', coming:'DIRECTORIO PROFESIONAL PRÓXIMAMENTE', body:'Actualmente estamos incorporando terapeutas licenciados, consejeros, coaches de relaciones, educadores y otros profesionales cualificados.', check:'VUELVE MÁS TARDE', apply:'¿Eres profesional?', applyBody:'Solicita ahora ser considerado para la red profesional de One2OneLove.', applyButton:'Solicitar Unirse', back:'Volver al Inicio' },
  fr:{ badge:'RECRUTEMENT EN COURS', title:'Thérapeutes et Professionnels', coming:'ANNUAIRE PROFESSIONNEL BIENTÔT DISPONIBLE', body:'Nous intégrons actuellement des thérapeutes agréés, conseillers, coaches relationnels, éducateurs et autres professionnels qualifiés.', check:'REVENEZ BIENTÔT', apply:'Êtes-vous professionnel ?', applyBody:'Candidatez maintenant pour rejoindre le réseau professionnel One2OneLove.', applyButton:'Postuler', back:'Retour à l’Accueil' },
  it:{ badge:'ORA IN INSERIMENTO', title:'Terapeuti e Professionisti', coming:'DIRECTORY PROFESSIONALE IN ARRIVO', body:'Stiamo inserendo terapeuti abilitati, consulenti, coach relazionali, educatori e altri professionisti qualificati.', check:'TORNA PIÙ TARDI', apply:'Sei un professionista?', applyBody:'Candidati ora per entrare nella rete professionale One2OneLove.', applyButton:'Candidati', back:'Torna alla Home' },
  de:{ badge:'JETZT IN AUFNAHME', title:'Therapeuten & Fachkräfte', coming:'PROFESSIONELLES VERZEICHNIS KOMMT BALD', body:'Wir nehmen derzeit qualifizierte lizenzierte Therapeuten, Berater, Beziehungscoaches, Pädagogen und weitere Fachkräfte auf.', check:'BITTE SPÄTER WIEDERKOMMEN', apply:'Sind Sie Fachkraft?', applyBody:'Bewerben Sie sich jetzt für das professionelle One2OneLove-Netzwerk.', applyButton:'Jetzt Bewerben', back:'Zurück zur Startseite' },
};

export default function Professionals() {
  const navigate=useNavigate();
  const { currentLanguage }=useLanguage();
  const t=COPY[currentLanguage]||COPY.en;
  return <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
    <div className="mx-auto max-w-5xl">
      <button onClick={()=>navigate('/Home')} className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-purple-700"><ArrowLeft size={18}/>{t.back}</button>
      <div className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-xl">
        <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500"/>
        <div className="p-7 text-center sm:p-12">
          <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-black tracking-[0.18em] text-emerald-800">{t.badge}</span>
          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg"><BadgeCheck size={30}/></div>
          <h1 className="mt-5 text-4xl font-black text-slate-900 sm:text-5xl">{t.title}</h1>
          <p className="mt-5 text-lg font-black tracking-wide text-purple-700">{t.coming}</p>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">{t.body}</p>
          <div className="mx-auto mt-7 max-w-xl rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-5 text-xl font-black text-slate-500">{t.check}</div>
        </div>
        <div className="border-t border-slate-100 bg-gradient-to-r from-purple-50 to-blue-50 p-7 sm:p-9">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white"><BriefcaseBusiness size={27}/></div>
            <div className="flex-1"><h2 className="text-xl font-black text-slate-900">{t.apply}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{t.applyBody}</p></div>
            <button onClick={()=>navigate('/SignUp')} className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-3 text-sm font-black text-white shadow-sm hover:shadow-md">{t.applyButton}</button>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
