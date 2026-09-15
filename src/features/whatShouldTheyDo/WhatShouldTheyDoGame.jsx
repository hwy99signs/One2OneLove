import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Globe2,
  Loader2,
  MapPin,
  MessageCircleQuestion,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  IS_WSTD_PREVIEW_DEMO,
  getWhatShouldTheyDoQuestions,
  getWhatShouldTheyDoResults,
  submitWhatShouldTheyDoVote,
} from '@/lib/whatShouldTheyDo';

const BAR_STYLES = [
  'from-fuchsia-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-cyan-500 to-teal-500',
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

function AppHeader({ onExit, onSuggest }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5">
      <button
        type="button"
        onClick={onExit}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-label="Back to One2OneLove"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onSuggest}
        className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-sm font-black text-fuchsia-700 transition hover:bg-fuchsia-100"
      >
        <MessageCircleQuestion className="h-4 w-4" />
        Suggest a Question
      </button>
    </div>
  );
}

function BrandTitle() {
  return (
    <div className="px-6 pb-4 pt-5 text-center">
      <div className="text-[11px] font-black uppercase tracking-[0.28em] text-fuchsia-600">One2OneLove Games</div>
      <h1 className="mt-1 text-4xl font-black leading-none tracking-[-0.04em] text-slate-950 sm:text-[2.7rem]">
        What Should
        <span className="block text-fuchsia-600">They Do?</span>
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-slate-500">
        You decide. Then see what the world thinks.
      </p>
    </div>
  );
}

function ProgressDots({ current, total }) {
  const shown = Math.min(total, 8);
  const active = total ? Math.min(current, shown - 1) : 0;
  return (
    <div className="flex items-center justify-center gap-1.5 px-6 pb-5" aria-label={`Question ${current + 1} of ${total}`}>
      {Array.from({ length: shown }).map((_, index) => (
        <span
          key={index}
          className={`h-1.5 rounded-full transition-all ${index === active ? 'w-7 bg-fuchsia-600' : 'w-2 bg-slate-200'}`}
        />
      ))}
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
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="text-sm font-bold leading-5 text-slate-800">
                {option.label}
                {chosen && (
                  <span className="ml-2 inline-flex rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-fuchsia-700">
                    Your vote
                  </span>
                )}
              </div>
              <div className="shrink-0 text-lg font-black text-slate-950">{option.percentage}%</div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${option.percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${BAR_STYLES[index % BAR_STYLES.length]}`}
              />
            </div>
            <div className="mt-1 text-[11px] font-semibold text-slate-400">
              {option.votes.toLocaleString()} vote{option.votes === 1 ? '' : 's'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultsScreen({ results, selectedOptionId, onNext, nextLabel, question }) {
  const [tab, setTab] = useState('global');
  const countries = results?.countries || [];

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-5 pb-6"
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <div className="bg-slate-950 px-6 py-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-300">The World Voted</div>
          <h2 className="mt-2 text-2xl font-black leading-tight">Here’s what everybody said.</h2>
          <div className="mt-2 text-sm font-semibold text-slate-300">
            {results.totalVotes.toLocaleString()} total vote{results.totalVotes === 1 ? '' : 's'}
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="mb-5 rounded-2xl bg-slate-50 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">The dilemma</div>
            <div className="mt-1 text-sm font-bold leading-6 text-slate-800">{question.scenario}</div>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab('global')}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                tab === 'global' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Globe2 className="h-4 w-4" /> Global
            </button>
            <button
              type="button"
              onClick={() => setTab('country')}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                tab === 'country' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-slate-500'
              }`}
            >
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
                    <span className="text-2xl" aria-hidden="true">{flagEmoji(country.countryCode)}</span>
                    <div>
                      <div className="font-black text-slate-950">{countryName(country.countryCode)}</div>
                      <div className="text-xs font-semibold text-slate-400">{country.totalVotes.toLocaleString()} votes</div>
                    </div>
                  </div>
                  <ResultBars options={country.options} selectedOptionId={selectedOptionId} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <Users className="mx-auto mb-3 h-7 w-7 text-slate-400" />
              <div className="font-black text-slate-800">Country results are building.</div>
              <p className="mt-1 text-sm leading-6 text-slate-500">A country appears after at least 5 votes on this question.</p>
            </div>
          )}

          <button
            type="button"
            onClick={onNext}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-fuchsia-600/20 transition hover:bg-fuchsia-700"
          >
            {nextLabel}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function QuestionScreen({ question, questionIndex, totalQuestions, voteMutation, resultsMutation, errorMessage }) {
  return (
    <motion.div
      key={`question-${question.id}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-5 pb-6"
    >
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-pink-500 to-orange-400 px-6 py-7 text-white">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm">
                {question.category.replaceAll('-', ' ')}
              </span>
              <span className="text-xs font-black text-white/80">{questionIndex + 1}/{totalQuestions}</span>
            </div>
            <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-fuchsia-600 shadow-lg">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="mt-5 text-[1.42rem] font-black leading-[1.28] tracking-[-0.02em] sm:text-[1.55rem]">
              {question.scenario}
            </p>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="mb-4 text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">What’s your call?</div>
            <h2 className="mt-1 text-xl font-black text-slate-950">What should they do?</h2>
          </div>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                disabled={voteMutation.isPending || resultsMutation.isPending}
                onClick={() => voteMutation.mutate({ questionId: question.id, optionId: option.id })}
                className="group flex w-full items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-fuchsia-400 hover:bg-fuchsia-50/60 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white transition group-hover:bg-fuchsia-600">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="pr-2 text-sm font-black leading-5 text-slate-800 sm:text-[15px]">{option.label}</span>
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{errorMessage}</div>
          )}

          {(voteMutation.isPending || resultsMutation.isPending) && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Counting your vote…
            </div>
          )}

          <button
            type="button"
            onClick={() => resultsMutation.mutate(question.id)}
            disabled={resultsMutation.isPending || voteMutation.isPending}
            className="mx-auto mt-5 block text-xs font-bold text-slate-400 underline-offset-4 transition hover:text-fuchsia-700 hover:underline"
          >
            See what the world thinks without voting
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestQuestionModal({ onClose }) {
  const [questionText, setQuestionText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (!questionText.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md rounded-t-[32px] bg-white p-6 shadow-2xl sm:rounded-[32px]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-600">Your turn</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Suggest a Question</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={submit} className="mt-5">
            <p className="text-sm font-semibold leading-6 text-slate-500">
              Give us a real-life relationship dilemma. Keep it anonymous and tell us what you want the world to vote on.
            </p>
            <textarea
              value={questionText}
              onChange={event => setQuestionText(event.target.value)}
              placeholder="Example: My partner wants to move for a new job, but I don’t want to leave my family. What should we do?"
              className="mt-4 min-h-36 w-full resize-none rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-400 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!questionText.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white transition hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" /> Send My Question
            </button>
          </form>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-700">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-2xl font-black text-slate-950">Question received.</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Look out for what the world thinks of your question.
            </p>
            <button type="button" onClick={onClose} className="mt-6 w-full rounded-2xl bg-fuchsia-600 px-5 py-4 font-black text-white">
              Back to Voting
            </button>
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

  const progressIndex = useMemo(() => {
    if (!questions.length) return 0;
    return questionIndex % Math.min(questions.length, 8);
  }, [questionIndex, questions.length]);

  const voteMutation = useMutation({
    mutationFn: ({ questionId, optionId }) => submitWhatShouldTheyDoVote(questionId, optionId),
    onMutate: ({ optionId }) => {
      setSelectedOptionId(optionId);
      setErrorMessage('');
    },
    onSuccess: payload => {
      setSelectedOptionId(payload.selectedOptionId);
      setResults(payload.results);
      setErrorMessage('');
    },
    onError: error => setErrorMessage(error?.message || 'Your vote could not be recorded. Please try again.'),
  });

  const resultsMutation = useMutation({
    mutationFn: questionId => getWhatShouldTheyDoResults(questionId),
    onSuccess: payload => {
      setResults(payload.results);
      setErrorMessage('');
    },
    onError: error => setErrorMessage(error?.message || 'Results could not be loaded. Please try again.'),
  });

  function nextQuestion() {
    if (!questions.length) return;
    setQuestionIndex((questionIndex + 1) % questions.length);
    setSelectedOptionId(null);
    setResults(null);
    setErrorMessage('');
  }

  if (questionsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff9f5] px-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 font-bold text-slate-700 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin text-fuchsia-600" /> Loading the next dilemma…
        </div>
      </div>
    );
  }

  if (questionsQuery.isError || !question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff9f5] px-5">
        <div className="w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-xl">
          <h2 className="text-xl font-black text-slate-950">The game isn’t ready to load yet.</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">The question bank may still be initializing.</p>
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" onClick={onExit} className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700">Back</button>
            <button type="button" onClick={() => questionsQuery.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 font-bold text-white">
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffe8f3_0,_#fff9f5_32%,_#f7f5ff_100%)] px-0 py-0 sm:px-5 sm:py-8">
      <div className="mx-auto min-h-screen w-full max-w-[470px] overflow-hidden bg-[#fffdfb] sm:min-h-0 sm:rounded-[36px] sm:border sm:border-white sm:shadow-[0_24px_90px_rgba(83,49,85,0.18)]">
        <AppHeader onExit={onExit} onSuggest={() => setShowSuggest(true)} />
        <BrandTitle />
        <ProgressDots current={progressIndex} total={questions.length} />

        {IS_WSTD_PREVIEW_DEMO && (
          <div className="mx-5 mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
            Preview: sample vote totals are being used here. Nothing on this preview is writing votes to the live One2OneLove database.
          </div>
        )}

        <AnimatePresence mode="wait">
          {!results ? (
            <QuestionScreen
              question={question}
              questionIndex={questionIndex}
              totalQuestions={questions.length}
              voteMutation={voteMutation}
              resultsMutation={resultsMutation}
              errorMessage={errorMessage}
            />
          ) : (
            <ResultsScreen
              results={results}
              selectedOptionId={selectedOptionId}
              onNext={nextQuestion}
              nextLabel={questionIndex === questions.length - 1 ? 'Start Again' : 'Next Question'}
              question={question}
            />
          )}
        </AnimatePresence>

        <div className="px-7 pb-7 text-center text-[10px] font-semibold leading-5 text-slate-400">
          Country comparisons use country-level data only. Precise voter locations are not displayed.
        </div>
      </div>

      {showSuggest && <SuggestQuestionModal onClose={() => setShowSuggest(false)} />}
    </div>
  );
}
