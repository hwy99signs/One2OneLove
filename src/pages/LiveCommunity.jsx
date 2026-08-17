import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  MessageCircleHeart,
  MessagesSquare,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { LIVE_COMMUNITY_ROOMS, getRoomActivityLabel } from "@/lib/liveCommunityRooms";
import { observeRoomPresence } from "@/lib/roomPresenceService";

const roomStyles = {
  rose: "from-rose-50 to-orange-50 border-rose-100",
  violet: "from-violet-50 to-fuchsia-50 border-violet-100",
  sky: "from-sky-50 to-cyan-50 border-sky-100",
  amber: "from-amber-50 to-yellow-50 border-amber-100",
  emerald: "from-emerald-50 to-teal-50 border-emerald-100",
};

const roomIconStyles = {
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
  sky: "bg-sky-100 text-sky-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

function RoomActivity({ room, activeCount }) {
  const activityLabel = getRoomActivityLabel(activeCount);

  if (activityLabel) {
    return (
      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-black text-emerald-800">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
          {activityLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-violet-700">
        <Sparkles className="h-3.5 w-3.5" />
        O2OL Host is asking
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">“{room.topic}”</p>
    </div>
  );
}

export default function LiveCommunity() {
  const [roomCounts, setRoomCounts] = useState({});

  useEffect(() => {
    const cleanups = LIVE_COMMUNITY_ROOMS.map((room) =>
      observeRoomPresence(room.slug, (count) => {
        setRoomCounts((current) => ({ ...current, [room.slug]: count }));
      })
    );

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-rose-50 via-white to-cyan-50">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-cyan-200/35 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/90 px-4 py-2 text-sm font-black text-pink-700 shadow-sm">
              <Radio className="h-4 w-4" />
              LIVE COMMUNITY
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Real conversations about real relationships.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              Pick a room, see what people are talking about, and join when you have something to say. If a room gets quiet, the O2OL Host keeps a thoughtful conversation ready instead of showing an empty room.
            </p>
          </div>

          <div className="mx-auto mt-9 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-bold text-slate-600">
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-cyan-600" />Live member activity</span>
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" />AI-hosted conversation starters</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />Respectful community rules</span>
          </div>
        </div>
      </section>

      <section className="bg-slate-50/70 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-pink-600">Choose your room</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Where do you want to talk?</h2>
            </div>
            <div className="max-w-md text-sm leading-6 text-slate-500">
              Active rooms show the real number of signed-in members currently inside. Quiet rooms show the host’s current topic instead — never a fake number.
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {LIVE_COMMUNITY_ROOMS.map((room) => (
              <Link
                key={room.slug}
                to={`/LiveRoom?room=${room.slug}`}
                className={`group flex min-h-[28rem] flex-col rounded-[2rem] border bg-gradient-to-br p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${roomStyles[room.accent]}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${roomIconStyles[room.accent]}`}>
                  <MessagesSquare className="h-6 w-6" />
                </div>

                <h3 className="mt-6 text-xl font-black leading-tight text-slate-950">{room.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{room.description}</p>

                <RoomActivity room={room} activeCount={roomCounts[room.slug] || 0} />

                <div className="mt-auto pt-6">
                  <div className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                    Join the conversation
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10">
          <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-6 w-6 text-pink-300" />
            </div>
            <div className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-pink-300">How the O2OL Host behaves</div>
            <div className="mt-4 text-2xl font-black leading-9 sm:text-3xl">
              If humans are talking, listen. If humans stop talking, invite. If the invitation works, disappear again.
            </div>
          </div>

          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">The point is people</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">The AI keeps the door open. It does not take over the room.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The host can welcome someone into a quiet room, offer a fresh question when conversation stalls, and step back as soon as members begin talking to one another.
            </p>
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-pink-100 bg-pink-50 p-4 text-sm leading-6 text-slate-700">
              <MessageCircleHeart className="mt-0.5 h-5 w-5 shrink-0 text-pink-600" />
              <div><span className="font-black">Community rule:</span> Tell the story. Don’t expose the person.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-gradient-to-r from-pink-600 via-rose-500 to-violet-600 px-6 py-10 text-center text-white shadow-xl sm:px-10">
          <Heart className="mx-auto h-7 w-7 fill-white text-white" />
          <h2 className="mt-4 text-3xl font-black tracking-tight">Come as you are. Talk about what’s real.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/90">You do not need the perfect answer. You just need a room where the conversation feels worth joining.</p>
        </div>
      </section>
    </main>
  );
}
