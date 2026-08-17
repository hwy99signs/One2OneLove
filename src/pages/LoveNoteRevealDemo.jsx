import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, LockKeyhole, MessageCircleHeart, Save, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function LoveNoteRevealDemo() {
  const [revealed, setRevealed] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link to={createPageUrl("LoveNotes")} className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Back to Love Notes
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2.25rem] bg-slate-950 p-4 shadow-2xl">
          <div className="min-h-[38rem] rounded-[1.8rem] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-pink-600">One2OneLove</div>
                <div className="mt-1 text-sm font-bold text-slate-500">Private Love Note preview</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50">
                <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
              </div>
            </div>

            {!revealed ? (
              <div className="flex min-h-[30rem] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <LockKeyhole className="h-7 w-7" />
                </div>
                <div className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-violet-600">A private message is waiting</div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Someone sent you a Love Note.</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                  In the live version, the recipient reaches this screen from a secure invitation after signing in or creating a free One2OneLove account. The message stays hidden until the reveal.
                </p>
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-pink-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Reveal my Love Note
                </button>
              </div>
            ) : (
              <div className="py-8">
                <div className="text-center text-xs font-black uppercase tracking-[0.16em] text-pink-600">Your Love Note</div>
                <div className="mx-auto mt-8 max-w-[20rem] -rotate-2 rounded-sm border border-yellow-300 bg-yellow-100 p-7 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-pink-600">
                    <Heart className="h-4 w-4 fill-pink-500" />
                    One2OneLove
                  </div>
                  <p className="mt-6 text-center text-lg font-semibold leading-8 text-slate-800">
                    You crossed my mind today, and that felt like a good enough reason to remind you how much you mean to me. ❤️
                  </p>
                  <div className="mt-6 text-right text-sm font-bold text-slate-600">— Someone who loves you 💕</div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Link to="/LoveNotesCollection" className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white">
                    <MessageCircleHeart className="h-4 w-4" />
                    Reply with a Love Note
                  </Link>
                  <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                    <Save className="h-4 w-4" />
                    Save this note
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  <span className="font-black">Growth loop:</span> the recipient can reply, save the note, or send another Love Note without leaving One2OneLove. This demo shows the experience only; secure invitation tokens and persistence will be connected when the backend migration stage is available.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
