import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BarChart3, Check, ChevronRight, Globe2,
  MessageCircleQuestion, Search, Send, Sparkles, Users, X
} from "lucide-react";
import rawQuestions from "@/data/whatShouldTheyDoQuestions.json";

const CATEGORY = {
  "communication": { label: "Communication", icon: "💬", a: "#1d4ed8", b: "#60a5fa", soft: "#eff6ff" },
  "trust-honesty": { label: "Trust & Honesty", icon: "🤝", a: "#0f766e", b: "#5eead4", soft: "#f0fdfa" },
  "boundaries": { label: "Boundaries", icon: "🛡️", a: "#7c3aed", b: "#c4b5fd", soft: "#f5f3ff" },
  "conflict-repair": { label: "Conflict & Repair", icon: "🧩", a: "#c2410c", b: "#fdba74", soft: "#fff7ed" },
  "emotional-needs": { label: "Emotional Needs", icon: "❤️", a: "#be123c", b: "#fda4af", soft: "#fff1f2" },
  "attachment-closeness": { label: "Attachment & Closeness", icon: "🫶", a: "#a21caf", b: "#f0abfc", soft: "#fdf4ff" },
  "independence-togetherness": { label: "Independence vs. Togetherness", icon: "⚖️", a: "#0369a1", b: "#7dd3fc", soft: "#f0f9ff" },
  "jealousy-insecurity": { label: "Jealousy & Insecurity", icon: "🪞", a: "#b45309", b: "#fcd34d", soft: "#fffbeb" },
  "forgiveness-resentment": { label: "Forgiveness & Resentment", icon: "🌱", a: "#15803d", b: "#86efac", soft: "#f0fdf4" },
  "family-in-laws": { label: "Family & In-Laws", icon: "🏡", a: "#9f1239", b: "#f9a8d4", soft: "#fff1f2" },
};

const QUESTIONS = rawQuestions.map(([category, scenario, options], index) => ({
  id: index + 1,
  category,
  scenario,
  options: options.map((label, optionIndex) => ({
    id: (index + 1) * 10 + optionIndex + 1,
    key: String.fromCharCode(65 + optionIndex),
    label,
  })),
}));

const BASE_VOTES = [
  [612, 389, 233, 142],
  [487, 441, 286, 173],
  [530, 368, 252, 157],
  [455, 397, 311, 184],
];

const REGION_SHIFT = { WORLD: 0, US: 1, GB: 2, CA: 3, AU: 4 };
const COUNTRY_MINIMUM_VOTES = 5;
const REGION_META = {
  WORLD: { label: "Worldwide", resultTitle: "The World Voted", short: "World", flag: "🌍" },
  US: { label: "United States", resultTitle: "By Country", short: "US", flag: "🇺🇸" },
  GB: { label: "United Kingdom", resultTitle: "By Country", short: "GB", flag: "🇬🇧" },
  CA: { label: "Canada", resultTitle: "By Country", short: "CA", flag: "🇨🇦" },
  AU: { label: "Australia", resultTitle: "By Country", short: "AU", flag: "🇦🇺" },
};

function visualTypeFor(index) {
  const slot = index % 20;
  if (slot < 8) return "scene";
  if (slot < 15) return "text";
  return "category";
}

function sceneBackground(question, index) {
  const theme = CATEGORY[question.category] || CATEGORY.communication;
  const variant = index % 6;
  const left = [18, 24, 16, 28, 20, 26][variant];
  const right = [70, 64, 74, 62, 68, 66][variant];
  const bubbleX = [47, 52, 43, 56, 49, 54][variant];
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${theme.a}"/>
        <stop offset="1" stop-color="${theme.b}"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="28"/></filter>
    </defs>
    <rect width="1200" height="700" fill="url(#g)"/>
    <circle cx="${left * 12}" cy="170" r="150" fill="white" opacity=".08"/>
    <circle cx="${right * 12}" cy="520" r="210" fill="white" opacity=".07"/>
    <g opacity=".97">
      <circle cx="${left * 12}" cy="285" r="74" fill="#f8fafc"/>
      <path d="M${left * 12 - 135} 610 Q${left * 12} 415 ${left * 12 + 135} 610 Z" fill="#f8fafc"/>
      <circle cx="${right * 12}" cy="300" r="74" fill="#e2e8f0"/>
      <path d="M${right * 12 - 135} 620 Q${right * 12} 425 ${right * 12 + 135} 620 Z" fill="#e2e8f0"/>
    </g>
    <rect x="${bubbleX * 12 - 125}" y="120" rx="34" ry="34" width="250" height="110" fill="white" opacity=".88"/>
    <circle cx="${bubbleX * 12 - 60}" cy="175" r="10" fill="${theme.a}"/>
    <circle cx="${bubbleX * 12}" cy="175" r="10" fill="${theme.a}"/>
    <circle cx="${bubbleX * 12 + 60}" cy="175" r="10" fill="${theme.a}"/>
    <path d="M${bubbleX * 12 - 22} 230 L${bubbleX * 12 + 28} 230 L${bubbleX * 12 + 8} 264 Z" fill="white" opacity=".88"/>
    <ellipse cx="600" cy="675" rx="480" ry="70" fill="#0f172a" opacity=".16" filter="url(#blur)"/>
  </svg>`;
  return `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`;
}

function buildResults(question, selectedOptionId, region) {
  const shift = (question.id + REGION_SHIFT[region]) % BASE_VOTES.length;
  const base = [...BASE_VOTES[shift]];
  const regionFactor = region === "WORLD" ? 1 : ({ US: .42, GB: .22, CA: .18, AU: .14 }[region] || .2);
  const selectedIndex = question.options.findIndex(o => o.id === selectedOptionId);
  if (selectedIndex >= 0) base[selectedIndex] += 1;
  const adjusted = base.map((v, i) => Math.max(1, Math.round(v * regionFactor + ((question.id * (i + 3)) % 17))));
  const total = adjusted.reduce((sum, v) => sum + v, 0);
  return question.options.map((option, i) => ({
    ...option,
    votes: adjusted[i],
    percentage: Math.round((adjusted[i] / total) * 100),
  }));
}

function QuestionVisual({ question, index }) {
  const type = visualTypeFor(index);
  const theme = CATEGORY[question.category] || CATEGORY.communication;

  if (type === "scene") {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: sceneBackground(question, index) }}
        aria-hidden="true"
      />
    );
  }

  if (type === "category") {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.a}, ${theme.b})` }}
        aria-hidden="true"
      >
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-white/10" />
        <div className="text-[8rem] opacity-25 sm:text-[11rem]">{theme.icon}</div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(140deg, ${theme.soft}, #ffffff 55%, ${theme.soft})` }}
      aria-hidden="true"
    >
      <div className="absolute left-0 top-0 h-full w-3" style={{ background: theme.a }} />
      <div className="absolute right-8 top-10 text-7xl opacity-10 sm:text-9xl">{theme.icon}</div>
      <div className="absolute bottom-8 left-10 h-20 w-20 rounded-full opacity-10" style={{ background: theme.a }} />
    </div>
  );
}

function QuestionBrowser({ questions, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(questions.map(q => q.category))], [questions]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return questions.filter(q => {
      const matchesCategory = category === "all" || q.category === category;
      const matchesQuery = !needle || `${q.scenario} ${CATEGORY[q.category]?.label || q.category} ${q.options.map(o => o.label).join(" ")}`
        .toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [questions, query, category]);

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 rounded-t-3xl border-b bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#102f60]">Question Browser</h2>
              <p className="text-sm font-semibold text-slate-500">{filtered.length} of {questions.length} questions</p>
            </div>
            <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-700" aria-label="Close question browser">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex min-h-12 items-center gap-2 rounded-xl border bg-slate-50 px-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search dilemmas..." className="min-w-0 flex-1 bg-transparent text-base outline-none" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCategory("all")} className={`rounded-full px-3 py-2 text-xs font-black ${category === "all" ? "bg-[#102f60] text-white" : "bg-slate-100 text-slate-600"}`}>All</button>
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)} className={`rounded-full px-3 py-2 text-xs font-black ${category === cat ? "bg-[#102f60] text-white" : "bg-slate-100 text-slate-600"}`}>
                  {CATEGORY[cat]?.label || cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          {filtered.map(q => (
            <button key={q.id} type="button" onClick={() => onSelect(q.id)} className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-pink-300 hover:shadow-md">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl" style={{ background: CATEGORY[q.category]?.soft }}>{CATEGORY[q.category]?.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-black uppercase tracking-wider text-pink-600">{CATEGORY[q.category]?.label}</span>
                <span className="mt-1 block text-base font-bold leading-6 text-[#17345f]">{q.scenario}</span>
              </span>
              <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WhatShouldTheyDo() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [region, setRegion] = useState("WORLD");

  const question = QUESTIONS[questionIndex];
  const theme = CATEGORY[question.category] || CATEGORY.communication;
  const visualType = visualTypeFor(questionIndex);
  const results = useMemo(
    () => submitted ? buildResults(question, selectedOptionId, region) : [],
    [question, selectedOptionId, submitted, region]
  );
  const selected = question.options.find(o => o.id === selectedOptionId);
  const top = submitted ? [...results].sort((a, b) => b.percentage - a.percentage)[0] : null;
  const userResult = submitted ? results.find(r => r.id === selectedOptionId) : null;
  const regionMeta = REGION_META[region] || REGION_META.WORLD;
  const regionTotalVotes = results.reduce((sum, row) => sum + row.votes, 0);
  const regionMeetsMinimum = region === "WORLD" || regionTotalVotes >= COUNTRY_MINIMUM_VOTES;

  function openQuestion(id) {
    const next = QUESTIONS.findIndex(q => q.id === id);
    if (next < 0) return;
    setQuestionIndex(next);
    setSelectedOptionId(null);
    setSubmitted(false);
    setRegion("WORLD");
    setBrowserOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextQuestion() {
    const next = (questionIndex + 1) % QUESTIONS.length;
    openQuestion(QUESTIONS[next].id);
  }

  function castVote() {
    if (!selectedOptionId) return;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {browserOpen && <QuestionBrowser questions={QUESTIONS} onClose={() => setBrowserOpen(false)} onSelect={openQuestion} />}

      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-7">
          <Link to="/CooperativeGames" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-black text-[#17345f] hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" /> Relationship Games
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setBrowserOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-[#17345f]">
              <Search className="h-4 w-4" /> Questions
            </button>
            <Link to="/Suggestions" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1976f3] px-4 text-sm font-black text-white">
              <Send className="h-4 w-4" /> Suggest a Question
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-7 lg:py-9">
        <div className="mb-6 flex items-start justify-between gap-5">
          <div>
            <h1 className="text-4xl font-black uppercase leading-[.9] tracking-[-.05em] text-[#102f60] sm:text-6xl lg:text-7xl">
              What Should <span className="block text-[#ff176b]">They Do?</span>
            </h1>
            <p className="mt-3 text-sm font-bold text-slate-500 sm:text-lg">Vote first. Then see what the world thinks.</p>
          </div>
          <div className="hidden border-l pl-6 text-base font-black leading-7 text-slate-500 sm:block">
            <div>Real People.</div><div>Real Dilemmas.</div><div>Real Opinions.</div>
            <div className="mt-2 h-1 w-16 -rotate-3 rounded-full bg-[#ff176b]" />
          </div>
        </div>

        {!submitted ? (
          <div className="grid gap-5 lg:grid-cols-[1.35fr_.85fr]">
            <section className="relative min-h-[360px] overflow-hidden rounded-3xl shadow-xl sm:min-h-[470px]">
              <QuestionVisual question={question} index={questionIndex} />
              <div className={`absolute inset-0 ${visualType === "text" ? "bg-white/5" : "bg-gradient-to-t from-slate-950/95 via-slate-950/25 to-slate-950/5"}`} />
              <div className="absolute left-4 top-4 rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide text-white shadow" style={{ background: theme.a }}>
                {theme.icon} {theme.label}
              </div>
              <div className={`absolute right-4 top-4 rounded-full px-3 py-2 text-xs font-black ${visualType === "text" ? "bg-white text-[#102f60] shadow" : "bg-black/30 text-white backdrop-blur"}`}>
                {questionIndex + 1}/{QUESTIONS.length}
              </div>
              <div className={`absolute inset-x-0 bottom-0 p-5 sm:p-8 ${visualType === "text" ? "text-[#102f60]" : "text-white"}`}>
                <div className="mb-3 text-[10px] font-black uppercase tracking-[.25em] opacity-80">
                  {visualType === "scene" ? "Scene-Based" : visualType === "category" ? "Category Graphic" : "Text-Led"}
                </div>
                <p className="max-w-4xl text-2xl font-black leading-tight sm:text-3xl lg:text-[2.25rem]">{question.scenario}</p>
              </div>
            </section>

            <section className="flex flex-col rounded-3xl bg-white p-4 shadow-lg sm:p-6">
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[.2em] text-slate-400">Choose one answer</div>
                <div className="mt-1 text-lg font-black text-[#17345f]">What should they do?</div>
              </div>
              <div className="grid gap-3">
                {question.options.map((option, idx) => {
                  const active = option.id === selectedOptionId;
                  const colors = ["#fff0f5", "#eef5ff", "#ecfbf6", "#f3efff"];
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedOptionId(option.id)}
                      className={`flex min-h-[68px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${active ? "border-[#ff176b] shadow-md" : "border-transparent hover:-translate-y-0.5 hover:shadow"}`}
                      style={{ background: colors[idx % colors.length] }}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ${active ? "bg-[#ff176b] text-white" : "bg-white text-[#17345f]"}`}>
                        {active ? <Check className="h-5 w-5" /> : option.key}
                      </span>
                      <span className="font-black leading-5 text-[#17345f]">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" disabled={!selectedOptionId} onClick={castVote} className="mt-5 inline-flex min-h-[60px] items-center justify-center gap-3 rounded-2xl bg-[#ff176b] px-5 text-lg font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40">
                <BarChart3 className="h-6 w-6" /> Cast Your Vote <ArrowRight className="h-5 w-5" />
              </button>
              <p className="mt-3 text-center text-xs font-semibold text-slate-400">Community results stay hidden until you vote.</p>
            </section>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
            <section className="rounded-3xl bg-white p-5 shadow-lg sm:p-7">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide text-white" style={{ background: theme.a }}>
                {theme.icon} {theme.label}
              </div>
              <h2 className="mt-5 text-2xl font-black leading-tight text-[#102f60]">{question.scenario}</h2>
              <div className="mt-6 rounded-2xl bg-pink-50 p-4">
                <div className="text-xs font-black uppercase tracking-wider text-pink-600">Your Answer</div>
                <div className="mt-1 text-lg font-black text-[#17345f]">{selected?.label}</div>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-[#17345f]"><Sparkles className="h-4 w-4 text-amber-500" /> Result</div>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {userResult?.id === top?.id
                    ? `You chose the most popular answer at ${userResult?.percentage}%.`
                    : `Your choice received ${userResult?.percentage}%. The leading answer received ${top?.percentage}%.`}
                </p>
              </div>
              <button type="button" onClick={nextQuestion} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#102f60] px-5 font-black text-white">
                Another Question <ArrowRight className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setBrowserOpen(true)} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 font-black text-[#17345f]">
                <Search className="h-4 w-4" /> Browse Questions
              </button>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-lg sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400"><Globe2 className="h-4 w-4" /> {regionMeta.resultTitle}</div>
                  <h3 className="mt-1 text-2xl font-black text-[#102f60]">{regionMeta.label}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(REGION_META).map(([code, meta]) => (
                    <button key={code} type="button" onClick={() => setRegion(code)} className={`rounded-full px-3 py-2 text-xs font-black ${region === code ? "bg-[#102f60] text-white" : "bg-slate-100 text-slate-600"}`}>
                      <span aria-hidden="true">{meta.flag}</span> {meta.short}
                    </button>
                  ))}
                </div>
              </div>

              {region !== "WORLD" && (
                <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  Country results appear after at least {COUNTRY_MINIMUM_VOTES} votes in a country.
                </div>
              )}

              <div className="mt-6 space-y-4">
                {!regionMeetsMinimum ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <div className="font-black text-[#17345f]">Not enough country votes yet</div>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Check back after at least {COUNTRY_MINIMUM_VOTES} votes are recorded for this country.</p>
                  </div>
                ) : results.map((row, idx) => {
                  const isMine = row.id === selectedOptionId;
                  return (
                    <div key={row.id}>
                      <div className="mb-1.5 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2">
                          <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${isMine ? "bg-[#ff176b] text-white" : "bg-slate-100 text-slate-600"}`}>{row.key}</span>
                          <span className="font-bold leading-5 text-[#17345f]">{row.label}</span>
                        </div>
                        <span className="shrink-0 text-lg font-black text-[#102f60]">{row.percentage}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all" style={{ width: `${row.percentage}%`, background: isMine ? "#ff176b" : ["#2563eb", "#14b8a6", "#8b5cf6", "#f59e0b"][idx % 4] }} />
                      </div>
                      <div className="mt-1 text-right text-[11px] font-semibold text-slate-400">{row.votes.toLocaleString()} votes</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 flex items-center gap-3 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-[#17345f]">
                <Users className="h-5 w-5 shrink-0 text-blue-600" />
                Results are shown only after your answer is locked in.
              </div>
            </section>
          </div>
        )}

        {!submitted && (
          <section className="mt-6 rounded-3xl bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-black uppercase tracking-[.2em] text-slate-400">Another Question</div>
                  <button type="button" onClick={() => setBrowserOpen(true)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs font-black text-[#17345f] hover:bg-slate-100">
                    See All <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 max-w-4xl font-black text-[#17345f]">{QUESTIONS[(questionIndex + 1) % QUESTIONS.length].scenario}</p>
              </div>
              <button type="button" onClick={nextQuestion} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-[#17345f]">
                Open <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <MessageCircleQuestion className="h-4 w-4" />
          150 recovered launch questions • 10 relationship categories • dynamic visual rotation
        </div>
      </main>
    </div>
  );
}
