import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  ChevronDown,
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

function GameControls({ onSuggest, onQuestions }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-4 py-3 sm:gap-6 sm:px-7">
        <button type="button" onClick={onQuestions} className="flex items-center gap-2 text-xs font-black text-[#17345f] transition hover:text-[#ff176b] sm:text-sm">
          <Search className="h-5 w-5" />
          <span>Questions</span>
        </button>
        <button type="button" onClick={onSuggest} className="flex items-center gap-2 text-xs font-black text-[#17345f] transition hover:text-[#ff176b] sm:text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1976f3] text-white sm:h-9 sm:w-9"><Plus className="h-5 w-5" /></span>
          <span>Suggest a Question</span>
        </button>
        <button type="button" onClick={onQuestions} className="hidden min-w-52 items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-slate-500 sm:flex lg:min-w-64">
          <Search className="h-4 w-4" />
          <span>Choose a Category</span>
        </button>
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
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide shadow-sm sm:text-xs ${dark ? 'bg-white/90 text-[#102f60]' : 'bg-white/85 text-[#102f60]'}`}>
      <CategoryIcon iconKey={theme.iconKey} className="h-4 w-4" /> {theme.label}
    </span>
  );
}

function GraphicFallback({ theme, compact = false }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: theme.gradient }} />
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/35" />
      <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/30" />
      <div className="absolute right-5 top-14 opacity-[0.17]" style={{ color: theme.accent }}>
        <CategoryIcon iconKey={theme.iconKey} className={compact ? 'h-20 w-20' : 'h-40 w-40 lg:h-52 lg:w-52'} />
      </div>
    </>
  );
}

function QuestionVisual({ question, index, totalQuestions, compact = false, showText = true }) {
  const { presentation, theme, sceneUrl } = getQuestionVisual(question, index);
  const [imageFailed, setImageFailed] = useState(false);
  const minHeight = compact ? 'min-h-[104px]' : 'min-h-[300px] sm:min-h-[360px] lg:min-h-[440px]';
  const textSize = compact ? 'text-xs leading-4 sm:text-sm sm:leading-5' : 'text-[1.28rem] leading-[1.08] sm:text-2xl lg:text-[2rem]';

  if (presentation === 'scene') {
    return (
      <div className={`relative overflow-hidden rounded-2xl shadow-lg ${minHeight}`}>
        <GraphicFallback theme={theme} compact={compact} />
        {!imageFailed && <img src={sceneUrl} alt={`${theme.label} dilemma scene`} className="absolute inset-0 h-full w-full object-cover" onError={() => setImageFailed(true)} />}
        {!imageFailed && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5" />}
        <div className="absolute left-3 top-3"><CategoryBadge theme={theme} dark={!imageFailed} /></div>
        {!compact && <div className={`absolute right-4 top-4 flex items-center gap-3 ${imageFailed ? 'text-[#102f60]' : 'text-white'}`}><span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-black backdrop-blur-sm">{index + 1}/{totalQuestions}</span><MoreHorizontal className="h-6 w-6" /></div>}
        {showText && <div className={`absolute inset-x-0 bottom-0 px-4 pb-4 pt-12 font-black sm:px-5 ${imageFailed ? 'text-[#102f60]' : 'text-white'} ${textSize}`}>{question.scenario}</div>}
      </div>
    );
  }

  if (presentation === 'graphic') {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-white/70 shadow-lg ${minHeight}`}>
        <GraphicFallback theme={theme} compact={compact} />
        <div className="absolute left-3 top-3"><CategoryBadge theme={theme} /></div>
        {!compact && <div className="absolute right-4 top-4 rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-black text-[#102f60]">{index + 1}/{totalQuestions}</div>}
        {showText && <div className={`absolute inset-x-0 bottom-0 p-4 font-black text-[#102f60] sm:p-5 ${textSize}`}>{question.scenario}</div>}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-100 shadow-lg ${minHeight}`} style={{ background: theme.gradient }}>
      <div className="absolute left-3 top-3"><CategoryBadge theme={theme} /></div>
      {!compact && <div className="absolute right-4 top-4 rounded-full bg-white/65 px-2.5 py-1 text-[10px] font-black text-[#102f60]">{index + 1}/{totalQuestions}</div>}
      <div className="absolute right-5 top-12 text-[4.5rem] font-black leading-none text-white/65 sm:text-[7rem] lg:text-[10rem]">“</div>
      {showText && <div className={`absolute inset-x-0 bottom-0 p-4 font-black text-[#102f60] sm:p-5 ${textSize}`}>{question.scenario}</div>}
    </div>
  );
}

function MiniVisual({ question, index }) {
  const { presentation, theme, sceneUrl } = getQuestionVisual(question, index);
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-32 sm:w-44 sm:shrink-0">
      <GraphicFallback theme={theme} compact />
      {presentation === 'scene' && !imageFailed && <img src={sceneUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setImageFailed(true)} />}
      {presentation === 'scene' && !imageFailed && <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />}
      <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase text-[#102f60]">{theme.label}</span>
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
            <button key={option.id} type="button" disabled={pending} onClick={() => onSelect(option.id)} className={`flex min-h-[66px] items-center gap-2 rounded-2xl px-3 py-3 text-left transition-all sm:gap-3 sm:px-4 lg:min-h-[72px] ${style.bg} ${selected ? 'ring-2 ring-[#ff176b] ring-offset-2 shadow-md' : 'hover:-translate-y-0.5 hover:shadow-sm'}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${style.iconBg} ${style.iconColor}`}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1 text-[11px] font-black leading-4 text-[#16345f] sm:text-sm lg:text-[15px]">{option.label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#31527b] sm:h-5 sm:w-5" />
            </button>
          );
        })}
      </div>
      {errorMessage && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{errorMessage}</div>}
      <button type="button" disabled={!selectedOptionId || pending} onClick={onVote} className="mt-auto flex min-h-[62px] w-full items-center justify-center gap-3 rounded-2xl bg-[#ff176b] px-5 py-3.5 text-base font-black text-white shadow-lg shadow-pink-500/20 transition hover:bg-[#ec0f60] disabled:cursor-not-allowed disabled:opacity-45 sm:text-lg">
        {pending ? <Loader2 className="h-6 w-6 animate-spin" /> : <BarChart3 className="h-6 w-6" />}<span>Cast Your Vote</span>{!pending && <ChevronRight className="h-5 w-5" />}
      </button>
    </div>
  );
}

function UpNextCard({ question, index, onOpen, position }) {
  if (!question) return null;
  const theme = getQuestionTheme(question.category);
  return (
    <button type="button" onClick={onOpen} className="group flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_8px_25px_rgba(24,52,95,0.06)] transition hover:-translate-y-0.5 hover:border-[#ff176b] hover:shadow-md sm:flex-row sm:items-center">
      <MiniVisual question={question} index={index} />
      <div className="min-w-0 flex-1 py-1">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase text-white" style={{ background: theme.accent }}>
            <CategoryIcon iconKey={theme.iconKey} className="h-3.5 w-3.5" /> {theme.label}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{position}</span>
        </div>
        <p className="line-clamp-4 text-sm font-black leading-5 text-[#102f60] sm:text-[15px]">{question.scenario}</p>
      </div>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-full bg-blue-50 text-[#1976f3] transition group-hover:bg-[#ff176b] group-hover:text-white sm:self-center">
        <ChevronRight className="h-6 w-6" />
      </span>
    </button>
  );
}

function UpNextSection({ questions, questionIndex, onOpen, onSeeAll }) {
  if (questions.length < 2) return null;
  const firstIndex = (questionIndex + 1) % questions.length;
  const secondIndex = (questionIndex + 2) % questions.length;
  return (
    <section className="mt-7 pb-4">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#102f60] sm:text-3xl">Up Next</h2>
          <p className="text-sm font-bold text-[#66758d] sm:text-base">More real dilemmas. What would you do?</p>
        </div>
        <button type="button" onClick={onSeeAll} className="hidden items-center gap-1 text-sm font-black text-[#1768c4] sm:flex">See All Questions <ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <UpNextCard question={questions[firstIndex]} index={firstIndex} position="Next" onOpen={() => onOpen(firstIndex)} />
        <UpNextCard question={questions[secondIndex]} index={secondIndex} position="Following" onOpen={() => onOpen(secondIndex)} />
      </div>
      <button type="button" onClick={onSeeAll} className="mt-4 flex items-center gap-1 text-sm font-black text-[#1768c4] sm:hidden">See All Questions <ChevronRight className="h-4 w-4" /></button>
    </section>
  );
}

function QuestionsBrowser({ questions, onClose, onSelect }) {
  const [category, setCategory] = useState('all');
  const categories = useMemo(() => [...new Set(questions.map(item => item.category))], [questions]);
  const filtered = useMemo(() => category === 'all' ? questions : questions.filter(item => item.category === category), [questions, category]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102f60]/65 p-2 backdrop-blur-sm sm:p-5">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-5 sm:px-8 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div><div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff176b]">Question Bank</div><h2 className="mt-1 text-2xl font-black leading-tight text-[#102f60] sm:text-4xl">Browse What Should They Do?</h2><p className="mt-2 text-sm font-semibold text-slate-500 sm:text-base">{filtered.length} of {questions.length} questions · {categories.length} categories</p></div>
            <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2.5 text-slate-600" aria-label="Close question bank"><X className="h-5 w-5" /></button>
          </div>
          <label className="mt-5 block">
            <span className="sr-only">Choose a Category</span>
            <div className="relative flex min-h-14 items-center rounded-2xl border-2 border-slate-200 bg-slate-50 focus-within:border-[#1976f3]">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-[#56708f]" />
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-14 w-full appearance-none bg-transparent pl-12 pr-12 text-base font-bold text-[#17345f] outline-none sm:text-lg">
                <option value="all">Choose a Category — All Categories ({questions.length})</option>
                {categories.map(item => <option key={item} value={item}>{getQuestionTheme(item).label} ({questions.filter(question => question.category === item).length})</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 h-5 w-5 text-[#56708f]" />
            </div>
          </label>
        </div>
        <div className="space-y-4 p-4 sm:p-8">
          {filtered.map((item) => {
            const index = questions.findIndex(question => question.id === item.id);
            const theme = getQuestionTheme(item.category);
            return (
              <button key={item.id} type="button" onClick={() => onSelect(index)} className="group flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#ff176b] hover:shadow-md sm:flex-row sm:items-center sm:p-5">
                <MiniVisual question={item} index={index} />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#1768c4] sm:text-xs"><CategoryIcon iconKey={theme.iconKey} className="h-3.5 w-3.5" /> {theme.label}</span><span className="text-sm font-black text-slate-400">#{index + 1}</span></div>
                  <p className="text-[17px] font-black leading-6 text-[#102f60] sm:text-xl sm:leading-7">{item.scenario}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-[#ff176b] sm:text-base">Open question <ChevronRight className="h-4 w-4" /></span>
                </div>
              </button>
            );
          })}
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

export default function WhatShouldTheyDoGameUpNext({ onExit }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  const questionsQuery = useQuery({ queryKey: ['what-should-they-do-questions'], queryFn: () => getWhatShouldTheyDoQuestions(150), staleTime: 60_000 });
  const questions = questionsQuery.data || [];
  const question = questions[questionIndex] || null;

  const voteMutation = useMutation({
    mutationFn: ({ questionId, optionId }) => submitWhatShouldTheyDoVote(questionId, optionId),
    onSuccess: payload => { setSelectedOptionId(payload.selectedOptionId); setResults(payload.results); setErrorMessage(''); },
    onError: error => setErrorMessage(error?.message || 'Your vote could not be recorded. Please try again.'),
  });

  function showQuestionAt(index) {
    if (!questions.length) return;
    setQuestionIndex((index + questions.length) % questions.length);
    setSelectedOptionId(null);
    setResults(null);
    setErrorMessage('');
    setShowQuestions(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextQuestion() { showQuestionAt(questionIndex + 1); }

  if (questionsQuery.isLoading) return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-7 w-7 animate-spin text-[#ff176b]" /></div>;
  if (questionsQuery.isError || !question) return <div className="flex min-h-screen items-center justify-center bg-white px-5"><div className="w-full max-w-md rounded-3xl border border-slate-200 p-7 text-center shadow-lg"><h2 className="text-xl font-black text-[#102f60]">The game isn’t ready to load yet.</h2><p className="mt-2 text-sm font-semibold text-slate-500">The question bank may still be initializing.</p><div className="mt-5 flex justify-center gap-3"><button type="button" onClick={onExit} className="rounded-xl border border-slate-200 px-4 py-3 font-bold">Back</button><button type="button" onClick={() => questionsQuery.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-[#ff176b] px-4 py-3 font-bold text-white"><RefreshCw className="h-4 w-4" /> Try Again</button></div></div></div>;

  return (
    <div className="min-h-screen bg-white text-[#102f60]">
      <GameControls onSuggest={() => setShowSuggest(true)} onQuestions={() => setShowQuestions(true)} />
      <main className="mx-auto w-full max-w-7xl pb-8 lg:px-7 lg:pb-12">
        <GameBrandHeader />
        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div key={`q-${question.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-5 pb-4 pt-5 sm:px-7 lg:px-0">
              <div className="rounded-[26px] bg-white p-0 shadow-[0_12px_36px_rgba(24,52,95,0.08)] ring-1 ring-slate-100 sm:p-4">
                <div className="grid gap-4 lg:grid-cols-[1.08fr_1fr] lg:items-stretch lg:gap-5">
                  <QuestionVisual question={question} index={questionIndex} totalQuestions={questions.length} />
                  <AnswerChoices question={question} selectedOptionId={selectedOptionId} onSelect={(id) => { setSelectedOptionId(id); setErrorMessage(''); }} onVote={() => voteMutation.mutate({ questionId: question.id, optionId: selectedOptionId })} pending={voteMutation.isPending} errorMessage={errorMessage} />
                </div>
              </div>
              <UpNextSection questions={questions} questionIndex={questionIndex} onOpen={showQuestionAt} onSeeAll={() => setShowQuestions(true)} />
            </motion.div>
          ) : <ResultsView question={question} results={results} selectedOptionId={selectedOptionId} onNext={nextQuestion} />}
        </AnimatePresence>
      </main>
      {showQuestions && <QuestionsBrowser questions={questions} onClose={() => setShowQuestions(false)} onSelect={showQuestionAt} />}
      {showSuggest && <SuggestQuestionModal onClose={() => setShowSuggest(false)} />}
    </div>
  );
}
