import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  ChevronRight,
  CreditCard,
  Eye,
  Globe2,
  Heart,
  HeartCrack,
  Home,
  Link,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  MoveHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  UsersRound,
  X,
} from 'lucide-react';
import {
  getWhatShouldTheyDoQuestions,
  submitWhatShouldTheyDoVote,
} from '@/lib/whatShouldTheyDo';
import {
  getQuestionVisual,
  getQuestionPresentation,
  getQuestionTheme,
} from './visualSystem';

const OPTION_STYLES = [
  { bg: 'bg-[#fff0f5]', iconBg: 'bg-[#ffd9e7]', icon: MessageCircle, iconColor: 'text-[#d91563]' },
  { bg: 'bg-[#eef5ff]', iconBg: 'bg-[#dceaff]', icon: CreditCard, iconColor: 'text-[#123a73]' },
  { bg: 'bg-[#ecfbf6]', iconBg: 'bg-[#d3f5e9]', icon: UsersRound, iconColor: 'text-[#073a64]' },
  { bg: 'bg-[#f3efff]', iconBg: 'bg-[#e7ddff]', icon: HeartCrack, iconColor: 'text-[#5b21b6]' },
];

const RESULT_STYLES = [
  'from-[#ff176b] to-[#ff4f91]',
  'from-[#2e67d1] to-[#6d8fff]',
  'from-[#1fa886] to-[#66d8bd]',
  'from-[#7c3aed] to-[#a78bfa]',
];

function CategoryIcon({ iconKey, className = 'h-5 w-5' }) {
  const icons = {
    message: MessageCircle,
    lock: Lock,
    shield: Shield,
    refresh: RefreshCw,
    heart: Heart,
    link: Link,
    split: MoveHorizontal,
    eye: Eye,
    heartRepair: HeartCrack,
    home: Home,
  };
  const Icon = icons[iconKey] || MessageCircle;
  return <Icon className={className} />;
}

function flagEmoji(countryCode) {
  if (!/^[A-Z]{2}$/.test(countryCode || '')) return '🌍';
  return String.fromCodePoint(...countryCode.split('').map(char => 127397 + char.charCodeAt(0)));
}

function countryName(countryCode) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

function GameControls({ onSuggest, onQuestions, searchQuery, onSearchChange, onSearch }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-3 sm:gap-5 sm:px-7 lg:gap-7">
        <button type="button" onClick={onQuestions} className="flex items-center gap-2 text-xs font-black text-[#17345f] transition hover:text-[#ff176b] sm:text-sm">
          <Search className="h-5 w-5 sm:h-6 sm:w-6" />
          <span>Questions</span>
        </button>
        <button type="button" onClick={onSuggest} className="flex items-center gap-2 text-xs font-black text-[#17345f] transition hover:text-[#ff176b] sm:text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1976f3] text-white shadow-sm sm:h-9 sm:w-9"><Plus className="h-5 w-5" /></span>
          <span>Suggest a Question</span>
        </button>
        <form onSubmit={onSearch} className="hidden items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-sm text-slate-500 sm:flex sm:w-52 lg:w-64">
          <Search className="h-4 w-4 shrink-0" />
          <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search dilemmas..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
        </form>
        <button type="button" onClick={onSearch} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[#17345f] sm:hidden" aria-label="Search dilemmas"><Search className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function GameBrandHeader() {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-6 sm:px-7 lg:px-0 lg:pt-7">
      <div className="min-w-0 flex-1">
        <h1 className="text-[2.05rem] font-black uppercase leading-[0.9] tracking-[-0.055em] text-[#102f60] sm:text-[3.1rem] lg:text-[4.4rem]">
          What Should<span className="block text-[#ff176b]">They Do?</span>
        </h1>
        <p className="mt-2 text-[13px] font-bold text-[#5c6b84] sm:text-lg lg:text-xl">Vote first. Then see what the world thinks.</p>
      </div>
      <div className="shrink-0 border-l border-slate-300 pl-3 pt-1 text-[9px] font-bold leading-[1.35] text-[#3e506f] sm:pl-6 sm:text-sm sm:leading-6 lg:text-lg lg:leading-7">
        <div>Real People.</div><div>Real Dilemmas.</div><div>Real Opinions.</div>
        <div className="mt-2 h-[2px] w-10 rotate-[-5deg] rounded-full bg-[#ff176b] sm:h-[3px] sm:w-16" />
      </div>
    </div>
  );
}

function CategoryBadge({ theme, dark = false }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide shadow-sm sm:text-xs ${dark ? 'bg-white/90 text-[#102f60]' : 'bg-white/80 text-[#102f60]'}`}>
      <CategoryIcon iconKey={theme.iconKey} className="h-4 w-4" /> {theme.label}
    </span>
  );
}

function QuestionVisual({ question, index, totalQuestions, compact = false }) {
  const { presentation, theme, sceneUrl } = getQuestionVisual(question, index);
  const minHeight = compact ? 'min-h-[118px]' : 'min-h-[285px] sm:min-h-[340px] lg:min-h-[420px]';
  const textSize = compact ? 'text-[11px] leading-4 sm:text-sm sm:leading-5' : 'text-[1.25rem] leading-[1.08] sm:text-2xl lg:text-[2rem]';

  if (presentation === 'scene') {
    return (
      <div className={`relative overflow-hidden rounded-2xl shadow-lg ${minHeight}`} style={{ background: theme.gradient }}>
        <img src={sceneUrl} alt={`${theme.label} dilemma scene`} className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5" />
        <div className="absolute left-3 top-3"><CategoryBadge theme={theme} dark /></div>
        {!compact && <div className="absolute right-4 top-4 flex items-center gap-3 text-white"><span className="rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-black backdrop-blur-sm">{index + 1}/{totalQuestions}</span><MoreHorizontal className="h-6 w-6" /></div>}
        <div className={`absolute inset-x-0 bottom-0 px-4 pb-4 pt-12 font-black text-white sm:px-5 ${textSize}`}>{question.scenario}</div>
      </div>
    );
  }

  if (presentation === 'graphic') {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-white/70 shadow-lg ${minHeight}`} style={{ background: theme.gradient }}>
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/40" />
        <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/35" />
        <div className="absolute right-5 top-14 opacity-[0.13]" style={{ color: theme.accent }}><CategoryIcon iconKey={theme.iconKey} className={compact ? 'h-20 w-20' : 'h-40 w-40 lg:h-52 lg:w-52'} /></div>
        <div className="absolute left-3 top-3"><CategoryBadge theme={theme} /></div>
        {!compact && <div className="absolute right-4 top-4 rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-black text-[#102f60]">{index + 1}/{totalQuestions}</div>}
        <div className={`absolute inset-x-0 bottom-0 p-4 font-black text-[#102f60] sm:p-5 ${textSize}`}>{question.scenario}</div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-100 shadow-lg ${minHeight}`} style={{ background: theme.gradient }}>
      <div className="absolute left-3 top-3"><CategoryBadge theme={theme} /></div>
      {!compact && <div className="absolute right-4 top-4 rounded-full bg-white/65 px-2.5 py-1 text-[10px] font-black text-[#102f60]">{index + 1}/{totalQuestions}</div>}
      <div className="absolute right-5 top-12 text-[4.5rem] font-black leading-none text-white/65 sm:text-[7rem] lg:text-[10rem]">“</div>
      <div className={`absolute inset-x-0 bottom-0 p-4 font-black text-[#102f60] sm:p-5 ${textSize}`}>{question.scenario}</div>
    </div>
  );
}

function AnswerChoices({ question, selectedOptionId, onSelect, onVote, pending, errorMessage }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {question.options.map((option, index) => {
          const style = OPTION_STYLES[index % OPTION_STYLES.length];
          const Icon = style.icon;
          const selected = Number(selectedOptionId) === Number(option.id);
          return (
            <button key={option.id} type="button" disabled={pending} onClick={() => onSelect(option.id)} className={`flex min-h-[60px] items-center gap-2 rounded-2xl px-3 py-3 text-left transition-all sm:gap-3 sm:px-4 lg:min-h-[66px] ${style.bg} ${selected ? 'ring-2 ring-[#ff176b] ring-offset-2 shadow-md' : 'hover:-translate-y-0.5 hover:shadow-sm'}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${style.iconBg} ${style.iconColor}`}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1 text-[11px] font-black leading-4 text-[#16345f] sm:text-sm lg:text-[15px]">{option.label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#31527b] sm:h-5 sm:w-5" />
            </button>
          );
        })}
      </div>
      {errorMessage && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{errorMessage}</div>}
      <button type="button" disabled={!selectedOptionId || pending} onClick={onVote} className="mt-auto flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-[#ff176b] px-5 py-3.5 text-base font-black text-white shadow-lg shadow-pink-500/20 transition hover:bg-[#ec0f60] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[64px] sm:text-lg">
        {pending ? <Loader2 className="h-6 w-6 animate-spin" /> : <BarChart3 className="h-6 w-6" />}<span>Cast Your Vote</span>{!pending && <ChevronRight className="h-5 w-5" />}
      </button>
    </div>
  );
}

function AnotherQuestionCard({ question, index, totalQuestions, onOpen, onSeeAll }) {
  if (!question) return null;
  return (
    <div className="rounded-2xl bg-white p-3 shadow-[0_10px_30px_rgba(24,52,95,0.08)] ring-1 ring-slate-100 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52657f] sm:text-[11px]">Another Question</span>
        <button type="button" onClick={onSeeAll} className="inline-flex items-center gap-1 text-[10px] font-black text-[#1d3557] sm:text-xs">See All <ChevronRight className="h-4 w-4" /></button>
      </div>
      <button type="button" onClick={onOpen} className="w-full text-left"><QuestionVisual question={question} index={index} totalQuestions={totalQuestions} compact /></button>
    </div>
  );
}

function QuestionTypePill({ index }) {
  const type = getQuestionPresentation(index);
  const labels = { scene: 'Scene', text: 'Text', graphic: 'Graphic' };
  return <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-500">{labels[type]}</span>;
}

function QuestionsBrowser({ questions, initialQuery, onClose, onSelect }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [category, setCategory] = useState('all');
  const categories = useMemo(() => [...new Set(questions.map(item => item.category))], [questions]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return questions.filter(item => {
      const theme = getQuestionTheme(item.category);
      const categoryMatch = category === 'all' || item.category === category;
      const queryMatch = !q || `${item.scenario} ${theme.label} ${item.options.map(option => option.label).join(' ')}`.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [questions, query, category]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102f60]/65 p-3 backdrop-blur-sm sm:p-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div><div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff176b]">Question Bank</div><h2 className="mt-1 text-2xl font-black text-[#102f60] sm:text-3xl">Browse What Should They Do?</h2><p className="mt-1 text-sm font-semibold text-slate-500">{questions.length} questions · {categories.length} categories · hybrid visual system</p></div>
            <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2.5 text-slate-600"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3"><Search className="h-5 w-5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions, categories, or answers..." className="min-w-0 flex-1 bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400" /></div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setCategory('all')} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black ${category === 'all' ? 'bg-[#102f60] text-white' : 'bg-slate-100 text-[#17345f]'}`}>All {questions.length}</button>
            {categories.map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black ${category === item ? 'bg-[#ff176b] text-white' : 'bg-slate-100 text-[#17345f]'}`}>{getQuestionTheme(item).label} · {questions.filter(question => question.category === item).length}</button>)}
          </div>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
          {filtered.map((item) => {
            const index = questions.findIndex(question => question.id === item.id);
            return (
              <button key={item.id} type="button" onClick={() => onSelect(index)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-[#ff176b] hover:shadow-md">
                <QuestionVisual question={item} index={index} totalQuestions={questions.length} compact />
                <div className="flex items-center justify-between gap-3 p-3"><span className="text-xs font-black text-[#ff176b]">Open question #{index + 1}</span><QuestionTypePill index={index} /></div>
              </button>
            );
          })}
          {!filtered.length && <div className="col-span-full py-12 text-center font-bold text-slate-500">No questions matched that search.</div>}
        </div>
      </motion.div>
    </div>
  );
}

function ResultBars({ options = [], selectedOptionId }) {
  return <div className="space-y-5">{options.map((option, index) => {
    const chosen = Number(option.optionId) === Number(selectedOptionId);
    return <div key={option.optionId}><div className="mb-2 flex items-center justify-between gap-4 text-sm font-bold text-[#16345f]"><span>{option.label}{chosen ? ' · Your vote' : ''}</span><span className="text-base font-black">{option.percentage}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><motion.div initial={{ width: 0 }} animate={{ width: `${option.percentage}%` }} className={`h-full rounded-full bg-gradient-to-r ${RESULT_STYLES[index % RESULT_STYLES.length]}`} /></div></div>;
  })}</div>;
}

function ResultsView({ question, results, selectedOptionId, onNext }) {
  const [tab, setTab] = useState('global');
  const countries = results?.countries || [];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl px-5 pb-10 pt-5 lg:px-0">
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_16px_50px_rgba(24,52,95,0.12)] ring-1 ring-slate-100">
        <div className="bg-[#102f60] px-6 py-7 text-center text-white"><BarChart3 className="mx-auto h-8 w-8" /><div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-pink-300">The World Voted</div><h2 className="mt-2 text-3xl font-black">Here’s what everybody said.</h2><p className="mt-2 text-sm font-semibold text-slate-300">{results.totalVotes.toLocaleString()} total votes</p></div>
        <div className="p-5 sm:p-7">
          <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-[#16345f]">{question.scenario}</div>
          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1"><button type="button" onClick={() => setTab('global')} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${tab === 'global' ? 'bg-white text-[#ff176b] shadow-sm' : 'text-slate-500'}`}><Globe2 className="h-4 w-4" /> Global</button><button type="button" onClick={() => setTab('country')} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${tab === 'country' ? 'bg-white text-[#ff176b] shadow-sm' : 'text-slate-500'}`}><MapPin className="h-4 w-4" /> By Country</button></div>
          {tab === 'global' ? <ResultBars options={results.global} selectedOptionId={selectedOptionId} /> : countries.length ? <div className="space-y-4">{countries.map(country => <div key={country.countryCode} className="rounded-2xl border border-slate-200 p-4"><div className="mb-4 flex items-center gap-3"><span className="text-2xl">{flagEmoji(country.countryCode)}</span><div><div className="font-black text-[#16345f]">{countryName(country.countryCode)}</div><div className="text-xs text-slate-400">{country.totalVotes.toLocaleString()} votes</div></div></div><ResultBars options={country.options} selectedOptionId={selectedOptionId} /></div>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center text-sm font-semibold text-slate-500">Country results appear after at least 5 votes in a country.</div>}
          <button type="button" onClick={onNext} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff176b] px-5 py-4 text-lg font-black text-white">Next Question <ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestQuestionModal({ onClose }) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#102f60]/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md rounded-t-[30px] bg-white p-6 shadow-2xl sm:rounded-[30px]">
        <div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff176b]">Your Turn</div><h2 className="mt-1 text-2xl font-black text-[#102f60]">Suggest a Question</h2></div><button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-600"><X className="h-5 w-5" /></button></div>
        {!submitted ? <form onSubmit={(event) => { event.preventDefault(); if (text.trim()) setSubmitted(true); }} className="mt-5"><p className="text-sm font-semibold leading-6 text-slate-500">Share an anonymous real-life dilemma you want the world to vote on.</p><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Type your question here..." className="mt-4 min-h-36 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none focus:border-[#ff176b]" /><button type="submit" disabled={!text.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff176b] px-5 py-4 font-black text-white disabled:opacity-40"><Send className="h-4 w-4" /> Send My Question</button></form> : <div className="py-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-[#ff176b]"><Heart className="h-7 w-7 fill-current" /></div><h3 className="mt-4 text-2xl font-black text-[#102f60]">Question received.</h3><p className="mt-2 text-sm font-semibold text-slate-500">Look out for what the world thinks of your question.</p><button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl bg-[#102f60] px-5 py-4 font-black text-white">Back to Voting</button></div>}
      </motion.div>
    </div>
  );
}

export default function WhatShouldTheyDoGameHybrid({ onExit }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const questionsQuery = useQuery({ queryKey: ['what-should-they-do-questions'], queryFn: () => getWhatShouldTheyDoQuestions(150), staleTime: 60_000 });
  const questions = questionsQuery.data || [];
  const question = questions[questionIndex] || null;
  const nextIndex = questions.length ? (questionIndex + 1) % questions.length : 0;
  const nextQuestionPreview = questions[nextIndex] || null;

  const voteMutation = useMutation({
    mutationFn: ({ questionId, optionId }) => submitWhatShouldTheyDoVote(questionId, optionId),
    onSuccess: payload => { setSelectedOptionId(payload.selectedOptionId); setResults(payload.results); setErrorMessage(''); },
    onError: error => setErrorMessage(error?.message || 'Your vote could not be recorded. Please try again.'),
  });

  function showQuestionAt(index) {
    if (!questions.length) return;
    setQuestionIndex((index + questions.length) % questions.length);
    setSelectedOptionId(null); setResults(null); setErrorMessage(''); setShowQuestions(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextQuestion() { showQuestionAt(questionIndex + 1); }
  function openSearch(event) { event?.preventDefault?.(); setShowQuestions(true); }

  if (questionsQuery.isLoading) return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-7 w-7 animate-spin text-[#ff176b]" /></div>;
  if (questionsQuery.isError || !question) return <div className="flex min-h-screen items-center justify-center bg-white px-5"><div className="w-full max-w-md rounded-3xl border border-slate-200 p-7 text-center shadow-lg"><h2 className="text-xl font-black text-[#102f60]">The game isn’t ready to load yet.</h2><p className="mt-2 text-sm font-semibold text-slate-500">The question bank may still be initializing.</p><div className="mt-5 flex justify-center gap-3"><button type="button" onClick={onExit} className="rounded-xl border border-slate-200 px-4 py-3 font-bold">Back</button><button type="button" onClick={() => questionsQuery.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-[#ff176b] px-4 py-3 font-bold text-white"><RefreshCw className="h-4 w-4" /> Try Again</button></div></div></div>;

  return (
    <div className="min-h-screen bg-white text-[#102f60]">
      <GameControls onSuggest={() => setShowSuggest(true)} onQuestions={() => setShowQuestions(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearch={openSearch} />
      <main className="mx-auto w-full max-w-7xl pb-8 lg:px-7 lg:pb-12">
        <GameBrandHeader />
        <AnimatePresence mode="wait">
          {!results ? <motion.div key={`q-${question.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-5 pb-4 pt-5 sm:px-7 lg:px-0 lg:pb-0">
            <div className="grid gap-4 lg:grid-cols-[1.65fr_0.95fr_0.92fr] lg:items-stretch lg:gap-5">
              <QuestionVisual question={question} index={questionIndex} totalQuestions={questions.length} />
              <AnswerChoices question={question} selectedOptionId={selectedOptionId} onSelect={(id) => { setSelectedOptionId(id); setErrorMessage(''); }} onVote={() => voteMutation.mutate({ questionId: question.id, optionId: selectedOptionId })} pending={voteMutation.isPending} errorMessage={errorMessage} />
              <div className="hidden lg:block"><AnotherQuestionCard question={nextQuestionPreview} index={nextIndex} totalQuestions={questions.length} onOpen={nextQuestion} onSeeAll={() => setShowQuestions(true)} /></div>
            </div>
            <div className="mt-4 lg:hidden"><AnotherQuestionCard question={nextQuestionPreview} index={nextIndex} totalQuestions={questions.length} onOpen={nextQuestion} onSeeAll={() => setShowQuestions(true)} /></div>
          </motion.div> : <ResultsView question={question} results={results} selectedOptionId={selectedOptionId} onNext={nextQuestion} />}
        </AnimatePresence>
      </main>
      {showQuestions && <QuestionsBrowser questions={questions} initialQuery={searchQuery} onClose={() => setShowQuestions(false)} onSelect={showQuestionAt} />}
      {showSuggest && <SuggestQuestionModal onClose={() => setShowSuggest(false)} />}
    </div>
  );
}
