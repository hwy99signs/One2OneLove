import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Clock, Heart, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';
import { relationshipArticleLibrary } from '@/data/relationshipArticleLibrary';

const copy = {
  en: { title:'Relationship Library', subtitle:'Practical, plain-language guidance for healthier relationships.', back:'Back to Support', all:'All', communication:'Communication', trust:'Trust & Boundaries', conflict:'Conflict & Repair', marriage:'Marriage', dating:'Dating', read:'Read Guide', minutes:'min read', takeaways:'Key ideas to take with you', close:'Back to Library', editorial:'One2OneLove Relationship Library', disclaimer:'Educational guidance only. It is not a substitute for individualized medical, mental-health, legal, or safety advice.' },
  es: { title:'Biblioteca de Relaciones', subtitle:'Orientación práctica y clara para relaciones más saludables.', back:'Volver al Apoyo', all:'Todos', communication:'Comunicación', trust:'Confianza y Límites', conflict:'Conflicto y Reparación', marriage:'Matrimonio', dating:'Citas', read:'Leer Guía', minutes:'min de lectura', takeaways:'Ideas clave para llevar contigo', close:'Volver a la Biblioteca', editorial:'Biblioteca de Relaciones One2OneLove', disclaimer:'Contenido educativo solamente. No sustituye asesoramiento médico, de salud mental, legal o de seguridad individualizado.' },
  fr: { title:'Bibliothèque des Relations', subtitle:'Des conseils pratiques et accessibles pour des relations plus saines.', back:'Retour au Soutien', all:'Tous', communication:'Communication', trust:'Confiance et Limites', conflict:'Conflit et Réparation', marriage:'Mariage', dating:'Rencontres', read:'Lire le Guide', minutes:'min de lecture', takeaways:'Idées clés à retenir', close:'Retour à la Bibliothèque', editorial:'Bibliothèque Relationnelle One2OneLove', disclaimer:'Contenu éducatif uniquement. Il ne remplace pas un avis médical, psychologique, juridique ou de sécurité personnalisé.' },
  it: { title:'Biblioteca delle Relazioni', subtitle:'Indicazioni pratiche e chiare per relazioni più sane.', back:'Torna al Supporto', all:'Tutti', communication:'Comunicazione', trust:'Fiducia e Confini', conflict:'Conflitto e Riparazione', marriage:'Matrimonio', dating:'Incontri', read:'Leggi la Guida', minutes:'min di lettura', takeaways:'Idee chiave da portare con te', close:'Torna alla Biblioteca', editorial:'Biblioteca Relazionale One2OneLove', disclaimer:'Contenuto esclusivamente educativo. Non sostituisce consulenza medica, psicologica, legale o di sicurezza personalizzata.' },
  de: { title:'Beziehungsbibliothek', subtitle:'Praktische, verständliche Orientierung für gesündere Beziehungen.', back:'Zurück zur Unterstützung', all:'Alle', communication:'Kommunikation', trust:'Vertrauen und Grenzen', conflict:'Konflikt und Reparatur', marriage:'Ehe', dating:'Dating', read:'Leitfaden Lesen', minutes:'Min. Lesezeit', takeaways:'Wichtige Gedanken zum Mitnehmen', close:'Zurück zur Bibliothek', editorial:'One2OneLove Beziehungsbibliothek', disclaimer:'Nur zu Bildungszwecken. Kein Ersatz für individuelle medizinische, psychologische, rechtliche oder sicherheitsbezogene Beratung.' },
};

const categoryIcons = {
  communication: MessageCircle,
  trust: ShieldCheck,
  conflict: Sparkles,
  marriage: Heart,
  dating: Heart,
};

export default function ArticlesSupport() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const articles = relationshipArticleLibrary[currentLanguage] || relationshipArticleLibrary.en;
  const [category, setCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filtered = useMemo(() => category === 'all' ? articles : articles.filter(article => article.category === category), [articles, category]);
  const categories = [
    ['all', t.all],
    ['communication', t.communication],
    ['trust', t.trust],
    ['conflict', t.conflict],
    ['marriage', t.marriage],
    ['dating', t.dating],
  ];

  if (selectedArticle) {
    const Icon = categoryIcons[selectedArticle.category] || BookOpen;
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-8">
        <article className="mx-auto max-w-4xl rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-10">
          <button type="button" onClick={() => setSelectedArticle(null)} className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-700">
            <ArrowLeft size={18}/>{t.close}
          </button>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-sm"><Icon size={28}/></div>
          <p className="text-sm font-black uppercase tracking-wide text-purple-600">{t.editorial}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">{selectedArticle.title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{selectedArticle.summary}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600"><Clock size={15}/>{selectedArticle.readTime} {t.minutes}</div>

          <div className="mt-8 rounded-3xl border border-purple-100 bg-purple-50/60 p-5 sm:p-7">
            <h2 className="text-xl font-black text-slate-900">{t.takeaways}</h2>
            <div className="mt-5 space-y-5">
              {selectedArticle.takeaways.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm font-black text-white">{index + 1}</div>
                  <p className="pt-0.5 leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <ShieldCheck className="mt-0.5 shrink-0 text-slate-500" size={18}/><p>{t.disclaimer}</p>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="sticky top-0 z-30 border-b border-purple-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5">
          <Link to={createPageUrl('CoupleSupport')} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-700"><ArrowLeft size={18}/>{t.back}</Link>
          <div className="min-w-0"><h1 className="truncate text-2xl font-black text-slate-900">{t.title}</h1><p className="hidden text-sm text-slate-600 sm:block">{t.subtitle}</p></div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="mb-8 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap gap-2">
            {categories.map(([id, label]) => (
              <button key={id} type="button" onClick={() => setCategory(id)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${category === id ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50'}`}>{label}</button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article, index) => {
            const Icon = categoryIcons[article.category] || BookOpen;
            return (
              <motion.article key={article.id} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:index * 0.04 }} className="flex h-full flex-col rounded-3xl border border-purple-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700"><Icon size={24}/></div>
                <div className="mt-5 flex-1"><p className="text-xs font-black uppercase tracking-wide text-purple-600">{categories.find(([id]) => id === article.category)?.[1]}</p><h2 className="mt-2 text-xl font-black leading-7 text-slate-900">{article.title}</h2><p className="mt-3 leading-6 text-slate-600">{article.summary}</p></div>
                <div className="mt-6 flex items-center justify-between gap-4"><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Clock size={14}/>{article.readTime} {t.minutes}</span><button type="button" onClick={() => setSelectedArticle(article)} className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2.5 text-sm font-black text-white shadow-sm">{t.read}</button></div>
              </motion.article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
