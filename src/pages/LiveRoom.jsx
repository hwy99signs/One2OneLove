import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MessageCircleHeart,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getLiveCommunityRoom, getRoomActivityLabel } from "@/lib/liveCommunityRooms";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";

export default function LiveRoom() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const room = getLiveCommunityRoom(searchParams.get("room"));
  const activityLabel = getRoomActivityLabel(room);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <Link to={createPageUrl("Community")} className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            All Live Rooms
          </Link>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-10">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-pink-300">Live Community Room</div>
                <h1 className="mt-2 text-3xl font-black tracking-tight">{room.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{room.description}</p>
              </div>

              {activityLabel ? (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  {activityLabel}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-sm font-black text-violet-200">
                  <Sparkles className="h-4 w-4" />
                  Host topic ready
                </div>
              )}
            </div>
          </div>

          <div className="min-h-[31rem] bg-gradient-to-b from-white to-slate-50 p-5 sm:p-7">
            {!activityLabel && (
              <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-violet-200 bg-violet-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-violet-700">
                  <Sparkles className="h-4 w-4" />
                  O2OL Host
                </div>
                <p className="mt-3 text-lg font-bold leading-7 text-violet-950">“{room.topic}”</p>
                <div className="mt-4 text-sm leading-6 text-violet-800/80">
                  The host opens with a real discussion topic so the room never has to advertise that it is empty. As soon as members begin talking, the host steps back.
                </div>
              </div>
            )}

            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center">
              <MessageCircleHeart className="mx-auto h-7 w-7 text-pink-500" />
              <div className="mt-3 font-black text-slate-800">Live member conversation will appear here.</div>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                This preview is the room shell only. The next backend step will connect real room presence, messages, reactions, and the active-member counter without touching production while we build.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
            {user ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  disabled
                  placeholder="Room messaging will be enabled after the live backend is connected."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-500 outline-none disabled:cursor-not-allowed"
                />
                <button disabled className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-400" aria-label="Send message">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-pink-100 bg-pink-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-black text-slate-900">Want to join this conversation?</div>
                  <div className="mt-1 text-sm text-slate-600">Sign in or create a free account to participate.</div>
                </div>
                <div className="flex gap-2">
                  <Link to={createPageUrl("SignIn")} className="rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-black text-pink-700">Sign in</Link>
                  <Link to={createPageUrl("SignUp")} className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-black text-white">Join free</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 font-black text-slate-900">
              <Users className="h-5 w-5 text-cyan-600" />
              Room activity
            </div>
            <div className="mt-4 text-sm leading-6 text-slate-600">
              When members are actively chatting, this area will show the real count. When they are not, the host topic takes its place instead of showing “0”.
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 font-black text-slate-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Room standard
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">Tell the story. Don’t expose the person.</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">No doxxing, targeted humiliation, threats, or turning a relationship discussion into a public attack.</p>
          </div>

          <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-600 to-violet-600 p-5 text-white shadow-lg">
            <Heart className="h-5 w-5 fill-white text-white" />
            <div className="mt-3 font-black">O2OL is built for the conversation after the match.</div>
            <p className="mt-2 text-sm leading-6 text-white/85">Connection, communication, growth, and everyday love.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
