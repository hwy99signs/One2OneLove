import React from "react";
import { ArrowLeft, Gamepad2, Globe2, Vote } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WhatShouldTheyDoGame from "../features/whatShouldTheyDo/WhatShouldTheyDoGame";

export default function Games() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGame = searchParams.get("game");

  if (selectedGame === "what-should-they-do") {
    return (
      <WhatShouldTheyDoGame
        onExit={() => {
          const next = new URLSearchParams(searchParams);
          next.delete("game");
          setSearchParams(next, { replace: true });
        }}
      />
    );
  }

  const openWhatShouldTheyDo = () => {
    const next = new URLSearchParams(searchParams);
    next.set("game", "what-should-they-do");
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-rose-50">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-950 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools for Every Stage of Love
        </Link>

        <div className="mt-8 rounded-3xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-300 to-amber-300 px-6 py-8 md:px-10 md:py-10 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-black text-slate-900">
                <Gamepad2 className="w-4 h-4" />
                One2OneLove Games
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-black text-slate-950">Games</h1>
              <p className="mt-3 max-w-3xl text-lg md:text-xl text-slate-800 font-medium">
                Play, vote, compare perspectives, and enjoy new relationship and social games as they are added to One2OneLove.
              </p>
            </div>
            <div className="text-7xl" aria-hidden="true">🎮</div>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">Available Now</p>
              <h2 className="text-3xl font-black text-slate-950 mt-1">Choose a game</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={openWhatShouldTheyDo}
            className="w-full text-left rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-300"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-4xl shadow-sm" aria-hidden="true">
                🗳️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-950">What Should They Do?</h3>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">PLAY & VOTE</span>
                </div>
                <p className="mt-2 text-base md:text-lg text-slate-600 leading-relaxed">
                  Vote on real-life relationship dilemmas, see the global result, and compare how people in different countries voted.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-slate-700">
                  <span className="inline-flex items-center gap-2"><Vote className="w-4 h-4" /> One vote per dilemma</span>
                  <span className="inline-flex items-center gap-2"><Globe2 className="w-4 h-4" /> Global + country results</span>
                </div>
              </div>
              <div className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">
                Play Now
              </div>
            </div>
          </button>

          <p className="mt-6 text-center text-sm font-semibold text-slate-500">
            This Games area is built to grow as new One2OneLove games are added.
          </p>
        </div>
      </div>
    </div>
  );
}
