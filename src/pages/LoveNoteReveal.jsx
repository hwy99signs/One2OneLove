import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Heart, LockKeyhole, MessageCircleHeart, Save, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { revealLoveNote } from "@/lib/loveNoteRevealService";

export default function LoveNoteReveal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const token = (searchParams.get("token") || "").trim();
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const returnTo = useMemo(
    () => `/LoveNoteReveal?token=${encodeURIComponent(token)}`,
    [token]
  );
  const signInUrl = `/SignIn?returnTo=${encodeURIComponent(returnTo)}`;
  const signUpUrl = `/SignUp?returnTo=${encodeURIComponent(returnTo)}`;

  const handleReveal = async () => {
    if (!token || isRevealing) return;
    setIsRevealing(true);
    setError("");
    try {
      const data = await revealLoveNote(token);
      setRevealed(data);
    } catch (revealError) {
      console.warn("Love Note reveal unavailable:", revealError);
      setError("This secure Love Note cannot be opened yet. The private reveal backend is staged but has not been activated on the database.");
    } finally {
      setIsRevealing(false);
    }
  };

  const replyWithLoveNote = () => {
    sessionStorage.setItem(
      "o2ol-love-note-draft",
      JSON.stringify({
        source: "reply",
        recipientName: revealed?.sender_name || "",
        message: "",
      })
    );
    navigate("/LoveNotes/Send");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-xl">
        <div className="overflow-hidden rounded-[2.25rem] bg-slate-950 p-4 shadow-2xl">
          <div className="min-h-[38rem] rounded-[1.8rem] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-pink-600">One2OneLove</div>
                <div className="mt-1 text-sm font-bold text-slate-500">Private Love Note</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50">
                <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
              </div>
            </div>

            {!token ? (
              <div className="flex min-h-[30rem] flex-col items-center justify-center text-center">
                <LockKeyhole className="h-12 w-12 text-slate-300" />
                <h1 className="mt-5 text-2xl font-black">This Love Note link is incomplete.</h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">Open the private link that arrived in your One2OneLove invitation.</p>
                <Link to="/LoveNotes" className="mt-7 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-black text-white">Go to Love Notes</Link>
              </div>
            ) : !revealed ? (
              <div className="flex min-h-[30rem] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <LockKeyhole className="h-7 w-7" />
                </div>
                <div className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-violet-600">A private message is waiting</div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">You received a Love Note.</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">The message itself stays hidden until you sign in and choose to reveal it.</p>

                {isLoading ? (
                  <div className="mt-7 text-sm font-bold text-slate-500">Checking your account…</div>
                ) : user ? (
                  <button
                    type="button"
                    onClick={handleReveal}
                    disabled={isRevealing}
                    className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isRevealing ? "Opening…" : "Reveal my Love Note"}
                  </button>
                ) : (
                  <div className="mt-7 grid w-full max-w-sm gap-3 sm:grid-cols-2">
                    <Link to={signInUrl} className="rounded-2xl bg-pink-600 px-5 py-3 text-sm font-black text-white">Sign in to reveal</Link>
                    <Link to={signUpUrl} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Create free account</Link>
                  </div>
                )}

                {error && (
                  <div className="mt-6 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</div>
                )}
              </div>
            ) : (
              <div className="py-8">
                <div className="text-center text-xs font-black uppercase tracking-[0.16em] text-pink-600">Your Love Note</div>
                <div className="mx-auto mt-8 max-w-[20rem] -rotate-2 rounded-sm border border-yellow-300 bg-yellow-100 p-7 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-pink-600">
                    <Heart className="h-4 w-4 fill-pink-500" />
                    One2OneLove
                  </div>
                  <p className="mt-6 text-center text-lg font-semibold leading-8 text-slate-800">{revealed.note_content}</p>
                  <div className="mt-6 text-right text-sm font-bold text-slate-600">— {revealed.sender_name} 💕</div>
                  <div className="mt-2 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Sent privately through One2OneLove</div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={replyWithLoveNote} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white">
                    <MessageCircleHeart className="h-4 w-4" />
                    Reply with a Love Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaved(true)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black ${saved ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}
                  >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Saved" : "Save this note"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
