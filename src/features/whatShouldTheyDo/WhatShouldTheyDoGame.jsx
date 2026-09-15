import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  CreditCard,
  Globe2,
  Heart,
  HeartCrack,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import {
  getWhatShouldTheyDoQuestions,
  getWhatShouldTheyDoResults,
  submitWhatShouldTheyDoVote,
} from '@/lib/whatShouldTheyDo';

const FEATURE_IMAGE = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=85';
const NEXT_IMAGE = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=85';

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

function DesktopNav({ onExit, onSuggest }) {
  return (
    <header className="hidden border-b border-slate-200 bg-white lg:block">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-7 py-4">
        <button type="button" onClick={onExit} className="shrink-0">
          <img src="/assets/o2ol-logo.png" alt="One2OneLove" className="h-14 w-auto object-contain" />
        </button>

        <nav className="flex flex-1 items-center justify-center gap-10 text-sm font-bold text-[#17345f]">
          <button type="button" onClick={onExit} className="relative flex flex-col items-center gap-1 text-[#ff176b]">
            <Home className="h-7 w-7 fill-current" />
            <span>Home</span>
            <span className="absolute -bottom-4 h-1 w-11 rounded-full bg-[#ff176b]" />
          </button>
          <button type="button" className="flex flex-col items-center gap-1 hover:text-[#ff176b]">
            <Search className="h-7 w-7" />
            <span>Questions</span>
          </button>
          <button type="button" onClick={onSuggest} className="flex flex-col items-center gap-1 hover:text-[#ff176b]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1976f3] text-white shadow-md">
              <Plus className="h-6 w-6" />
            </span>
            <span className="-mt-1 max-w-[86px] text-center leading-4">Suggest a Question</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1 hover:text-[#ff176b]">
            <UserRound className="h-7 w-7" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="flex w-64 items-center gap-3 rounded-full bg-slate-100 px-5 py-3 text-sm text-slate-400">
          <Search className="h-5 w-5" />
          <span>Search dilemmas...</span>
        </div>
      </div>
    </header>
  );
}

function GameBrandHeader() {
  return (
    <div className="flex items-start justify-between gap-6 px-5 pt-5 sm:px-7 lg:px-0 lg:pt-7">
      <div>
        <h1 className="text-[2.25rem] font-black uppercase leading-[0.9] tracking-[-0.055em] text-[#102f60] sm:text-[3.1rem] lg:text-[4.4rem]">
          What Should
          <span className="block text-[#ff176b]">They Do?</span>
        </h1>
        <p className="mt-2 text-sm font-bold text-[#5c6b84] sm:text-lg lg:text-xl">
          Vote first. Then see what the world thinks.
        </p>
      </div>

      <div className="hidden shrink-0 border-l border-slate-300 pl-6 pt-2 text-sm font-bold leading-6 text-[#3e506f] sm:block lg:text-lg lg:leading-7">
        <div>Real People.</div>
        <div>Real Dilemmas.</div>
        <div>Real Opinions.</div>
        <div className="mt-2 h-[3px] w-16 rotate-[-5deg] rounded-full bg-[#ff176b]" />
      </div>
    </div>
  );
}

function FeaturedDilemma({ question }) {
  const category = (question.category || 'work').replaceAll('-', ' ');
  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-slate-900 shadow-lg lg:min-h-[420px]">
      <img src={FEATURE_IMAGE} alt="Person considering a difficult decision" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-black/5" />
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#1478f2] px-3 py-1.5 text-xs font-black uppercase text-white shadow-md">
        <BriefcaseBusiness className="h-4 w-4" /> {category}
      </div>
      <button type="button" className="absolute right-4 top-4 text-white/95" aria-label="Question options">
        <MoreHorizontal className="h-6 w-6" />
      </button>
      <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16 text-xl font-black leading-[1.08] text-white sm:text-2xl lg:px-7 lg:pb-7 lg:text-[2rem]">
        {question.scenario}
      </div>
    </div>
  );
}

function AnswerChoices({ question, selectedOptionId, onSelect, onVote, pending, errorMessage }) {
  return (
    <div className="flex h-full flex-col gap-3">
      {question.options.map((option, index) => {
        const style = OPTION_STYLES[index % OPTION_STYLES.length];
        const Icon = style.icon;
        const selected = Number(selectedOptionId) === Number(option.id);
        return (
          <button
            key={option.id}
            type="button"
            disabled={pending}
            onClick={() => onSelect(option.id)}
            className={`flex min-h-[66px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${style.bg} ${selected ? 'ring-3 ring-[#ff176b] ring-offset-2 shadow-md' : 'hover:-translate-y-0.5 hover:shadow-sm'}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.iconBg} ${style.iconColor}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-black text-[#16345f] sm:text-[15px]">{option.label}</span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#31527b]" />
          </button>
        );
      })}

      {errorMessage && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{errorMessage}</div>}

      <button
        type="button"
        disabled={!selectedOptionId || pending}
        onClick={onVote}
        className="mt-auto flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl bg-[#ff176b] px-5 py-4 text-lg font-black text-white shadow-lg shadow-pink-500/20 transition hover:bg-[#ec0f60] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {pending ? <Loader2 className="h-6 w-6 animate-spin" /> : <BarChart3 className="h-6 w-6" />}
        <span>Cast Your Vote</span>
        {!pending && <ChevronRight className="h-5 w-5" />}
      </button>
    </div>
  );
}

function AnotherQuestionCard({ question, onOpen }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(24,52,95,0.08)] ring-1 ring-slate-100">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#52657f]">Another Question</span>
        <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 text-xs font-black text-[#1d3557]">
          See All <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <button type="button" onClick={onOpen} className="w-full overflow-hidden rounded-xl text-left">
        <div className="relative overflow-hidden rounded-xl">
          <img src={NEXT_IMAGE} alt="Another relationship dilemma" className="h-36 w-full object-cover" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#ff176b] px-3 py-1 text-[10px] font-black uppercase text-white">
            <Heart className="h-3 w-3 fill-current" /> Relationships
          </span>
        </div>
        <div className="flex items-center gap-3 px-1 pb-1 pt-3">
          <p className="flex-1 text-sm font-black leading-5 text-[#112f5e]">
            {question?.scenario || 'Tanya wants to help her mother financially, but her husband says they cannot afford it. What should she do?'}
          </p>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#31527b]" />
        </div>
      </button>
    </div>
  );
}

function MobileBottomNav({ onExit, onSuggest, onQuestions }) {
  return (
    <div className="sticky bottom-0 z-20 mt-5 border-t border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 text-[10px] font-bold text-[#24436b]">
        <button type="button" onClick={onExit} className="flex flex-col items-center gap-1 text-[#ff176b]">
          <Home className="h-6 w-6 fill-current" /> Home
        </button>
        <button type="button" onClick={onQuestions} className="flex flex-col items-center gap-1">
          <Search className="h-6 w-6" /> Questions
        </button>
        <button type="button" onClick={onSuggest} className="flex flex-col items-center gap-0">
          <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#1976f3] text-white shadow-lg">
            <Plus className="h-7 w-7" />
          </span>
          <span className="mt-1 leading-3">Suggest<br />a Question</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-1">
          <UserRound className="h-6 w-6" /> Profile
        </button>
      </div>
    </div>
  );
}

function ResultBars({ options = [], selectedOptionId }) {
  return (
    <div className="space-y-5">
      {options.map((option, index) => {
        const chosen = Number(option.optionId) === Number(selectedOptionId);
        return (
          <div key={option.optionId}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm font-bold text-[#16345f]">
              <span>{option.label}{chosen ? ' · Your vote' : ''}</span>
              <span className="text-base font-black">{option.percentage}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div initial={{ width: 0 }} animate={{ width: `${option.percentage}%` }} className={`h-full rounded-full bg-gradient-to-r ${RESULT_STYLES[index % RESULT_STYLES.length]}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultsView({ question, results, selectedOptionId, onNext }) {
  const [tab, setTab] = useState('global');
  const countries = results?.countries || [];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl px-5 pb-10 lg:px-0">
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_16px_50px_rgba(24,52,95,0.12)] ring-1 ring-slate-100">
        <div className="bg-[#102f60] px-6 py-7 text-center text-white">
          <BarChart3 className="mx-auto h-8 w-8" />
          <div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-pink-300">The World Voted</div>
          <h2 className="mt-2 text-3xl font-black">Here’s what everybody said.</h2>
          <p className="mt-2 text-sm font-semibold text-slate-300">{results.totalVotes.toLocaleString()} total votes</p>
        </div>
        <div className="p-5 sm:p-7">
          <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-[#16345f]">{question.scenario}</div>
          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            <button type="button" onClick={() => setTab('global')} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${tab === 'global' ? 'bg-white text-[#ff176b] shadow-sm' : 'text-slate-500'}`}>
              <Globe2 className="h-4 w-4" /> Global
            </button>
            <button type="button" onClick={() => setTab('country')} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${tab === 'country' ? 'bg-white text-[#ff176b] shadow-sm' : 'text-slate-500'}`}>
              <MapPin className="h-4 w-4" /> By Country
            </button>
          </div>
          {tab === 'global' ? (
            <ResultBars options={results.global} selectedOptionId={selectedOptionId} />
          ) : countries.length ? (
            <div className="space-y-4">
              {countries.map(country => (
                <div key={country.countryCode} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl">{flagEmoji(country.countryCode)}</span>
                    <div>
                      <div className="font-black text-[#16345f]">{countryName(country.countryCode)}</div>
                      <div className="text-xs text-slate-400">{country.totalVotes.toLocaleString()} votes</div>
                    </div>
                  </div>
                  <ResultBars options={country.options} selectedOptionId={selectedOptionId} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center text-sm font-semibold text-slate-500">Country results appear after at least 5 votes in a country.</div>
          )}
          <button type="button" onClick={onNext} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff176b] px-5 py-4 text-lg font-black text-white">
            Next Question <ChevronRight className="h-5 w-5" />
          </button>
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff176b]">Your Turn</div>
            <h2 className="mt-1 text-2xl font-black text-[#102f60]">Suggest a Question</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        {!submitted ? (
          <form onSubmit={(event) => { event.preventDefault(); if (text.trim()) setSubmitted(true); }} className="mt-5">
            <p className="text-sm font-semibold leading-6 text-slate-500">Share an anonymous real-life dilemma you want the world to vote on.</p>
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Type your question here..." className="mt-4 min-h-36 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none focus:border-[#ff176b]" />
            <button type="submit" disabled={!text.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff176b] px-5 py-4 font-black text-white disabled:opacity-40">
              <Send className="h-4 w-4" /> Send My Question
            </button>
          </form>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-[#ff176b]"><Heart className="h-7 w-7 fill-current" /></div>
            <h3 className="mt-4 text-2xl font-black text-[#102f60]">Question received.</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">Look out for what the world thinks of your question.</p>
            <button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl bg-[#102f60] px-5 py-4 font-black text-white">Back to Voting</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function WhatShouldTheyDoGame({ onExit }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);

  const questionsQuery = useQuery({
    queryKey: ['what-should-they-do-questions'],
    queryFn: () => getWhatShouldTheyDoQuestions(30),
    staleTime: 60_000,
  });

  const questions = questionsQuery.data || [];
  const question = questions[questionIndex] || null;
  const nextQuestionPreview = questions.length > 1 ? questions[(questionIndex + 1) % questions.length] : null;

  const voteMutation = useMutation({
    mutationFn: ({ questionId, optionId }) => submitWhatShouldTheyDoVote(questionId, optionId),
    onSuccess: payload => {
      setSelectedOptionId(payload.selectedOptionId);
      setResults(payload.results);
      setErrorMessage('');
    },
    onError: error => setErrorMessage(error?.message || 'Your vote could not be recorded. Please try again.'),
  });

  function nextQuestion() {
    if (!questions.length) return;
    setQuestionIndex((questionIndex + 1) % questions.length);
    setSelectedOptionId(null);
    setResults(null);
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (questionsQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-7 w-7 animate-spin text-[#ff176b]" /></div>;
  }

  if (questionsQuery.isError || !question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 p-7 text-center shadow-lg">
          <h2 className="text-xl font-black text-[#102f60]">The game isn’t ready to load yet.</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">The question bank may still be initializing.</p>
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" onClick={onExit} className="rounded-xl border border-slate-200 px-4 py-3 font-bold">Back</button>
            <button type="button" onClick={() => questionsQuery.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-[#ff176b] px-4 py-3 font-bold text-white"><RefreshCw className="h-4 w-4" /> Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#102f60]">
      <DesktopNav onExit={onExit} onSuggest={() => setShowSuggest(true)} />

      <main className="mx-auto w-full max-w-7xl pb-0 lg:px-7 lg:pb-12">
        <div className="lg:hidden">
          <button type="button" onClick={onExit} className="ml-4 mt-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[#102f60] shadow-sm" aria-label="Back"><ArrowLeft className="h-4 w-4" /></button>
        </div>
        <GameBrandHeader />

        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div key={`q-${question.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-5 pb-4 pt-5 sm:px-7 lg:px-0 lg:pb-0">
              <div className="grid gap-4 lg:grid-cols-[1.65fr_0.95fr_0.92fr] lg:items-stretch lg:gap-5">
                <FeaturedDilemma question={question} />
                <AnswerChoices
                  question={question}
                  selectedOptionId={selectedOptionId}
                  onSelect={(id) => { setSelectedOptionId(id); setErrorMessage(''); }}
                  onVote={() => voteMutation.mutate({ questionId: question.id, optionId: selectedOptionId })}
                  pending={voteMutation.isPending}
                  errorMessage={errorMessage}
                />
                <AnotherQuestionCard question={nextQuestionPreview} onOpen={nextQuestion} />
              </div>

              <div className="mt-4 lg:hidden">
                <AnotherQuestionCard question={nextQuestionPreview} onOpen={nextQuestion} />
              </div>
            </motion.div>
          ) : (
            <ResultsView question={question} results={results} selectedOptionId={selectedOptionId} onNext={nextQuestion} />
          )}
        </AnimatePresence>
      </main>

      <MobileBottomNav onExit={onExit} onSuggest={() => setShowSuggest(true)} onQuestions={nextQuestion} />
      {showSuggest && <SuggestQuestionModal onClose={() => setShowSuggest(false)} />}
    </div>
  );
}
