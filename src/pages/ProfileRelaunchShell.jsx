import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/Layout';
import ProfileRelaunchSafe from './ProfileRelaunchSafe';

const COPY = {
  en: 'Privacy & Account Controls',
  es: 'Privacidad y Controles de Cuenta',
  fr: 'Confidentialité et Contrôles du Compte',
  it: 'Privacy e Controlli Account',
  de: 'Datenschutz & Kontosteuerung',
  nl: 'Privacy & Accountbeheer',
  pt: 'Privacidade e Controles da Conta',
};

export default function ProfileRelaunchShell() {
  const { currentLanguage } = useLanguage();
  const label = COPY[currentLanguage] || COPY.en;

  return (
    <div className="relative">
      <ProfileRelaunchSafe />
      <div className="fixed bottom-5 right-5 z-30 sm:bottom-7 sm:right-7">
        <Link
          to="/PrivacyCenter"
          className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-3 text-sm font-bold text-purple-800 shadow-xl transition hover:border-purple-300 hover:bg-purple-50 focus:outline-none focus:ring-4 focus:ring-purple-100"
          aria-label={label}
        >
          <ShieldCheck className="h-5 w-5" />
          <span className="hidden sm:inline">{label}</span>
        </Link>
      </div>
    </div>
  );
}
