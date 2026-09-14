import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Globe2,
  Loader2,
  MapPin,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  getWhatShouldTheyDoQuestions,
  getWhatShouldTheyDoResults,
  submitWhatShouldTheyDoVote,
} from '@/lib/whatShouldTheyDo';

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

function ResultBars({ options = [], selectedOptionId }) {
  return (
    <div className="space-y-4">
      {options.map(option => (
        <div key={option.optionId} className="space-y-1.5">
          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="font-medium text-slate-800">
              {option.label}
              {Number(option.optionId) === Number(selectedOptionId) && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Your vote
                </span>
              )}
            </div>
            <div className="shrink-0 font-bold text-slate-900">{option.percentage}%</div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${option.percentage}%` }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
            />
          </div>
          <div className="text-xs text-slate-500">{option.votes.toLocaleString()} vote{option.votes === 1 ? '' : 's'}</div>
        </div>
      ))}
    </div>
  );
}

function ResultsPanel({ results, selectedOptionId, onNext, nextLabel }) {
  const [tab, setTab] = useState('global');
  const countries = results?.countries || [];

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-5"
    >
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Here’s what everybody said</h2>
        <p className="mt-1 text-sm text-slate-500">
          {results.totalVotes.toLocaleString()} total vote{results.totalVotes === 1 ? '' : 's'}
        </p>
      </div>

      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setTab('global')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
            tab === 'global' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Globe2 className="h-4 w-4" /> Global
        </button>
        <button
          type="button"
          onClick={() => setTab('country')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
            tab === 'country' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
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
            <Card key={country.countryCode} className="border-slate-200 shadow-none">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">{flagEmoji(country.countryCode)}</span>
                    <div>
                      <div className="font-black text-slate-900">{countryName(country.countryCode)}</div>
                      <div className="text-xs text-slate-500">{country.totalVotes.toLocaleString()} votes</div>
                    </div>
                  </div>
                </div>
                <ResultBars options={country.options} selectedOptionId={selectedOptionId} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <Users className="mx-auto mb-3 h-7 w-7 text-slate-400" />
          <div className="font-bold text-slate-800">Country results are building</div>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            A country appears here after at least 5 votes on this question. This keeps very small groups private and makes the comparison more useful.
          </p>
        </div>
      )}

      <Button
        type="button"
        onClick={onNext}
        className="h-12 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-bold hover:from-emerald-700 hover:to-teal-700"
      >
        {nextLabel}
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </motion.div>
  );
}

export default function WhatShouldTheyDoGame({ onExit }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const questionsQuery = useQuery({
    queryKey: ['what-should-they-do-questions'],
    queryFn: () => getWhatShouldTheyDoQuestions(30),
    staleTime: 60_000,
  });

  const questions = questionsQuery.data || [];
  const question = questions[questionIndex] || null;

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((questionIndex + 1) / questions.length) * 100);
  }, [questionIndex, questions.length]);

  const voteMutation = useMutation({
    mutationFn: ({ questionId, optionId }) => submitWhatShouldTheyDoVote(questionId, optionId),
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

  function resetForQuestion(index) {
    setQuestionIndex(index);
    setSelectedOptionId(null);
    setResults(null);
    setErrorMessage('');
  }

  function nextQuestion() {
    if (!questions.length) return;
    resetForQuestion((questionIndex + 1) % questions.length);
  }

  if (questionsQuery.isLoading) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-16">
        <div className="mx-auto flex max-w-xl items-center justify-center gap-3 rounded-2xl bg-white p-8 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          <span className="font-semibold text-slate-700">Loading the next dilemma…</span>
        </div>
      </div>
    );
  }

  if (questionsQuery.isError || !question) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-16">
        <Card className="mx-auto max-w-xl border-slate-200">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-black text-slate-900">The game isn’t ready to load yet.</h2>
            <p className="mt-2 text-sm text-slate-500">The question bank may still be initializing.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Button variant="outline" onClick={onExit}>Back</Button>
              <Button onClick={() => questionsQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={onExit}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to games
        </button>

        <div className="mb-5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          <span>What Should They Do?</span>
          <span>Question {questionIndex + 1} of {questions.length}</span>
        </div>
        <div className="mb-7 h-2 overflow-hidden rounded-full bg-white shadow-inner">
          <motion.div className="h-full rounded-full bg-emerald-500" animate={{ width: `${progress}%` }} />
        </div>

        <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-emerald-900/5">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white sm:px-8">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">{question.category.replaceAll('-', ' ')}</div>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">{question.prompt}</h1>
          </div>

          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {!results ? (
                <motion.div
                  key={`question-${question.id}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-6"
                >
                  <p className="text-lg font-semibold leading-8 text-slate-800 sm:text-xl">{question.scenario}</p>

                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <button
                        key={option.id}
                        type="button"
                        disabled={voteMutation.isPending || resultsMutation.isPending}
                        onClick={() => {
                          setSelectedOptionId(option.id);
                          voteMutation.mutate({ questionId: question.id, optionId: option.id });
                        }}
                        className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50/50 disabled:cursor-wait disabled:opacity-60"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="font-bold leading-6 text-slate-800">{option.label}</span>
                      </button>
                    ))}
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
                  )}

                  {(voteMutation.isPending || resultsMutation.isPending) && (
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Counting your vote…
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => resultsMutation.mutate(question.id)}
                    disabled={resultsMutation.isPending || voteMutation.isPending}
                    className="mx-auto block text-sm font-semibold text-slate-500 underline-offset-4 hover:text-emerald-700 hover:underline"
                  >
                    View results without voting
                  </button>
                </motion.div>
              ) : (
                <ResultsPanel
                  results={results}
                  selectedOptionId={selectedOptionId}
                  onNext={nextQuestion}
                  nextLabel={questionIndex === questions.length - 1 ? 'Start again' : 'Next question'}
                />
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Country comparison uses country-level request data only. It does not display a voter’s precise location.
        </p>
      </div>
    </div>
  );
}
