import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSavedLoveNotes, removeSavedLoveNote } from "@/lib/loveNoteSaveService";

export default function SavedLoveNotes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  const loadNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSavedLoveNotes();
      setNotes(data);
    } catch (loadError) {
      console.warn("Saved Love Notes unavailable:", loadError);
      setError("Saved Love Notes are staged for the relaunch but the database feature has not been activated yet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  const removeNote = async (invitationId) => {
    setRemovingId(invitationId);
    setError("");
    try {
      await removeSavedLoveNote(invitationId);
      setNotes((current) => current.filter((item) => item.invitation_id !== invitationId));
    } catch (removeError) {
      console.warn("Unable to remove saved Love Note:", removeError);
      setError("We could not update your saved Love Notes. Please try again later.");
    } finally {
      setRemovingId("");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate("/LoveNotes")} className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to Love Notes
        </button>

        <header className="mt-7 rounded-[2rem] border border-white bg-white p-7 shadow-xl sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-pink-700">
            <Heart className="h-4 w-4 fill-pink-500 text-pink-500" /> One2OneLove
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight">Saved Love Notes</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Keep the Love Notes that matter to you in one private place.</p>
        </header>

        {error && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</div>}

        {loading ? (
          <div className="mt-8 flex items-center justify-center rounded-[1.75rem] bg-white p-12 shadow-sm"><Loader2 className="h-6 w-6 animate-spin text-pink-600" /></div>
        ) : notes.length ? (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {notes.map((item) => {
              const note = item.love_note_invitations || {};
              return (
                <article key={item.id} className="rounded-[1.75rem] border border-white bg-white p-6 shadow-lg">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-pink-600">From {note.sender_name || "Someone special"}</div>
                  <div className="mt-5 -rotate-1 rounded-sm border border-yellow-300 bg-yellow-100 p-6 shadow-md">
                    <p className="text-base font-semibold leading-7 text-slate-800">{note.note_content || "Love Note"}</p>
                    <div className="mt-5 text-right text-sm font-bold text-slate-600">— {note.sender_name || "Someone special"} 💕</div>
                  </div>
                  <button type="button" onClick={() => removeNote(item.invitation_id)} disabled={removingId === item.invitation_id} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-red-600 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" /> Remove from saved
                  </button>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <Heart className="mx-auto h-8 w-8 text-pink-300" />
            <div className="mt-4 text-lg font-black">No saved Love Notes yet</div>
            <p className="mt-2 text-sm text-slate-500">When saving is activated, notes you choose to keep will appear here.</p>
          </div>
        )}
      </div>
    </main>
  );
}
