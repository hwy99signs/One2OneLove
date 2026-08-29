import React from 'react';
import { AlertTriangle, Heart, RefreshCw } from 'lucide-react';

const translations = {
  en: {
    title: 'Something went wrong.',
    copy: 'One2OneLove could not finish loading this page. Your account data has not been changed by this screen.',
    retry: 'Try Again',
    home: 'Return Home',
  },
  es: {
    title: 'Algo salió mal.',
    copy: 'One2OneLove no pudo terminar de cargar esta página. Esta pantalla no ha modificado los datos de tu cuenta.',
    retry: 'Intentar de Nuevo',
    home: 'Volver al Inicio',
  },
  fr: {
    title: 'Une erreur est survenue.',
    copy: 'One2OneLove n’a pas pu terminer le chargement de cette page. Cet écran n’a pas modifié les données de votre compte.',
    retry: 'Réessayer',
    home: 'Retour à l’Accueil',
  },
  it: {
    title: 'Si è verificato un problema.',
    copy: 'One2OneLove non ha potuto completare il caricamento della pagina. Questa schermata non ha modificato i dati del tuo account.',
    retry: 'Riprova',
    home: 'Torna alla Home',
  },
  de: {
    title: 'Etwas ist schiefgelaufen.',
    copy: 'One2OneLove konnte diese Seite nicht vollständig laden. Diese Ansicht hat deine Kontodaten nicht verändert.',
    retry: 'Erneut Versuchen',
    home: 'Zur Startseite',
  },
};

function currentCopy() {
  try {
    const language = window.localStorage.getItem('preferredLanguage') || 'en';
    return translations[language] || translations.en;
  } catch {
    return translations.en;
  }
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('O2OL application render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const t = currentCopy();

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xl md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-rose-700"><Heart className="h-5 w-5" /><span className="font-semibold">One2One Love</span></div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-4 leading-7 text-slate-600">{t.copy}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-5 py-3 font-semibold text-white hover:bg-rose-700"><RefreshCw className="mr-2 h-4 w-4" />{t.retry}</button>
            <button type="button" onClick={() => window.location.assign('/Home')} className="rounded-lg border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">{t.home}</button>
          </div>
        </div>
      </div>
    );
  }
}
