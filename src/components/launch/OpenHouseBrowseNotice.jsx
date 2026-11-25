import React from 'react';
import { DoorOpen, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/Layout';

// Member system disabled (owner ruling, 2026-11-25): there are no
// accounts on the free platform, so this notice no longer invites
// anyone to sign in or create an account. It simply explains that
// everything is open and that personal entries stay in this browser.
const COPY = {
  en:{ eyebrow:'ONE2ONELOVE OPEN HOUSE', title:'Explore this feature free', body:'One2OneLove is a free platform with no accounts. Everything here is open to everyone — your personal entries save privately in this browser, on this device.', protected:'No sign-up, no card — just start using it.' },
  es:{ eyebrow:'JORNADA DE PUERTAS ABIERTAS ONE2ONELOVE', title:'Explora esta función gratis', body:'One2OneLove es una plataforma gratuita y sin cuentas. Todo está abierto para todos: tus entradas personales se guardan de forma privada en este navegador, en este dispositivo.', protected:'Sin registro y sin tarjeta: empieza a usarlo ya.' },
  fr:{ eyebrow:'PORTES OUVERTES ONE2ONELOVE', title:'Explorez cette fonction gratuitement', body:'One2OneLove est une plateforme gratuite et sans comptes. Tout est ouvert à tous : vos entrées personnelles sont enregistrées en privé dans ce navigateur, sur cet appareil.', protected:'Aucune inscription, aucune carte — commencez tout de suite.' },
  it:{ eyebrow:'OPEN HOUSE ONE2ONELOVE', title:'Esplora questa funzione gratis', body:'One2OneLove è una piattaforma gratuita e senza account. Tutto è aperto a tutti: le tue voci personali si salvano in privato in questo browser, su questo dispositivo.', protected:'Nessuna registrazione, nessuna carta: inizia subito a usarla.' },
  de:{ eyebrow:'ONE2ONELOVE OPEN HOUSE', title:'Diese Funktion kostenlos erkunden', body:'One2OneLove ist eine kostenlose Plattform ohne Konten. Alles ist für alle offen — deine persönlichen Einträge werden privat in diesem Browser auf diesem Gerät gespeichert.', protected:'Keine Registrierung, keine Karte — einfach loslegen.' }
};

export default function OpenHouseBrowseNotice({ compact=false }) {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  return (
    <section className={`rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-cyan-50 ${compact?'p-3':'p-4 sm:p-5'} shadow-sm`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-amber-700"><DoorOpen className="h-4 w-4"/>{t.eyebrow}</div>
          <h2 className="mt-1 text-lg font-black text-slate-900">{t.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{t.body}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><ShieldCheck className="h-3.5 w-3.5"/>{t.protected}</p>
        </div>
      </div>
    </section>
  );
}
