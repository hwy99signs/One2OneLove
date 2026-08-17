import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarHeart,
  Check,
  Heart,
  LockKeyhole,
  Mail,
  MessageCircleHeart,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_NOTE = "You crossed my mind today, and that felt like a good enough reason to remind you how much you mean to me. ❤️";

const loadDraft = () => {
  try {
    const stored = sessionStorage.getItem("o2ol-love-note-draft");
    if (!stored) return { source: "new", recipientName: "", message: DEFAULT_NOTE };
    const parsed = JSON.parse(stored);
    const source = typeof parsed?.source === "string" ? parsed.source : "new";
    const recipientName = typeof parsed?.recipientName === "string" ? parsed.recipientName.trim().slice(0, 80) : "";
    const providedMessage = typeof parsed?.message === "string" ? parsed.message.trim().slice(0, 500) : "";
    return {
      source,
      recipientName,
      message: source === "reply" ? providedMessage : providedMessage || DEFAULT_NOTE,
    };
  } catch {
    return { source: "new", recipientName: "", message: DEFAULT_NOTE };
  }
};

export default function LoveNoteSendDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [initialDraft] = useState(loadDraft);
  const [senderName, setSenderName] = useState(user?.name || "");
  const [recipientName, setRecipientName] = useState(initialDraft.recipientName);
  const [delivery, setDelivery] = useState("text");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState(initialDraft.message);
  const [deliveryTime, setDeliveryTime] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!senderName.trim() && user?.name) setSenderName(user.name);
  }, [user?.name, senderName]);

  useEffect(() => {
    sessionStorage.removeItem("o2ol-love-note-draft");
  }, []);

  const senderLabel = senderName.trim() || "Your name";
  const recipientLabel = recipientName.trim() || "your person";
  const canContinue = Boolean(senderName.trim() && recipientName.trim() && contact.trim() && message.trim());
  const scheduleLabel = useMemo(() => {
    if (deliveryTime === "now") return "Send now";
    if (!scheduleDate || !scheduleTime) return "Choose date & time";
    return `${scheduleDate} at ${scheduleTime}`;
  }, [deliveryTime, scheduleDate, scheduleTime]);
  const today = new Date().toISOString().slice(0, 10);

  const previewRecipient = () => {
    sessionStorage.setItem(
      "o2ol-love-note-preview",
      JSON.stringify({
        senderName: senderName.trim(),
        recipientName: recipientName.trim(),
        message: message.trim(),
        delivery,
        contact: contact.trim(),
        deliveryTime,
        scheduleDate,
        scheduleTime,
      })
    );
    navigate("/LoveNoteRevealDemo");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/LoveNotes")}
          className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Love Notes
        </button>

        <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <section className="rounded-[2rem] border border-white bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100">
                <Heart className="h-6 w-6 fill-pink-500 text-pink-500" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">SEND A LOVE NOTE</div>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Make it personal. Keep the reveal private.</h1>
              </div>
            </div>

            {initialDraft.source === "reply" && initialDraft.recipientName && (
              <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-900">
                <div className="flex items-center gap-2 font-black"><MessageCircleHeart className="h-4 w-4" />Replying with a Love Note</div>
                <p className="mt-1">We carried {initialDraft.recipientName}'s name over for you. Write your reply, choose how their invitation should arrive, and review it before sending.</p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${
                    step >= item ? "bg-pink-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step > item ? <Check className="h-3.5 w-3.5" /> : <span>{item}</span>}
                  {item === 1 ? "Recipient" : item === 2 ? "Delivery" : "Review"}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="mt-8 space-y-5">
                <div>
                  <label className="text-sm font-black text-slate-700">Your name <span className="font-semibold text-slate-400">(shown to recipient)</span></label>
                  <input
                    value={senderName}
                    onChange={(event) => setSenderName(event.target.value.slice(0, 80))}
                    placeholder="e.g., Alex"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">The invitation and revealed Love Note identify the individual who sent it. One2OneLove appears as the delivery platform, not as the sender.</p>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">Recipient name</label>
                  <input
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value.slice(0, 80))}
                    placeholder="e.g., Jamie"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <div className="text-sm font-black text-slate-700">How should the invitation arrive?</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => { setDelivery("text"); setContact(""); }}
                      className={`rounded-2xl border p-4 text-left transition ${delivery === "text" ? "border-pink-300 bg-pink-50" : "border-slate-200 bg-white"}`}
                    >
                      <Phone className="h-5 w-5 text-pink-600" />
                      <div className="mt-2 font-black">Text message</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">They receive a short invitation and secure reveal link.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDelivery("email"); setContact(""); }}
                      className={`rounded-2xl border p-4 text-left transition ${delivery === "email" ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white"}`}
                    >
                      <Mail className="h-5 w-5 text-violet-600" />
                      <div className="mt-2 font-black">Email</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">A private invitation arrives without exposing the note.</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">{delivery === "text" ? "Mobile number" : "Email address"}</label>
                  <input
                    type={delivery === "text" ? "tel" : "email"}
                    value={contact}
                    onChange={(event) => setContact(event.target.value.slice(0, 160))}
                    placeholder={delivery === "text" ? "(555) 123-4567" : "jamie@example.com"}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">Your Love Note</label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, 500))}
                    rows={6}
                    placeholder={initialDraft.source === "reply" ? `Write your reply to ${recipientLabel}…` : "Write your Love Note…"}
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 leading-7 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                  />
                  <div className="mt-1 text-right text-xs font-bold text-slate-400">{message.length}/500</div>
                </div>

                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => setStep(2)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 px-5 py-3.5 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue to delivery <Send className="h-4 w-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-8 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryTime("now")}
                    className={`rounded-2xl border p-5 text-left ${deliveryTime === "now" ? "border-pink-300 bg-pink-50" : "border-slate-200"}`}
                  >
                    <Send className="h-5 w-5 text-pink-600" />
                    <div className="mt-3 font-black">Send now</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">Deliver the invitation as soon as the backend confirms it.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryTime("schedule")}
                    className={`rounded-2xl border p-5 text-left ${deliveryTime === "schedule" ? "border-violet-300 bg-violet-50" : "border-slate-200"}`}
                  >
                    <CalendarHeart className="h-5 w-5 text-violet-600" />
                    <div className="mt-3 font-black">Schedule it</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">Choose a moment that makes the note land just right.</div>
                  </button>
                </div>

                {deliveryTime === "schedule" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="date"
                      min={today}
                      value={scheduleDate}
                      onChange={(event) => setScheduleDate(event.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(event) => setScheduleTime(event.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                )}

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  <div className="flex items-center gap-2 font-black"><LockKeyhole className="h-4 w-4" />Private by design</div>
                  <p className="mt-1">The invitation identifies {senderLabel} but does not expose the Love Note itself. The message stays hidden until the recipient opens the secure reveal experience.</p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Back</button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={deliveryTime === "schedule" && (!scheduleDate || !scheduleTime)}
                    className="flex-1 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40"
                  >
                    Review
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-8 space-y-5">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">From</div><div className="mt-1 font-black">{senderLabel}</div></div>
                    <div><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Recipient</div><div className="mt-1 font-black">{recipientLabel}</div></div>
                    <div><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Delivery</div><div className="mt-1 font-black">{delivery === "text" ? "Text message" : "Email"}</div></div>
                    <div><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Contact</div><div className="mt-1 break-all font-black">{contact}</div></div>
                    <div><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">When</div><div className="mt-1 font-black">{scheduleLabel}</div></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  <span className="font-black">Development preview:</span> this screen does not send a real SMS or email yet. It lets us test the complete customer experience before connecting the delivery backend.
                </div>

                <button
                  type="button"
                  onClick={previewRecipient}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white shadow-xl"
                >
                  <Sparkles className="h-4 w-4 text-pink-300" />
                  Preview recipient experience
                </button>
                <button type="button" onClick={() => setStep(2)} className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Edit delivery</button>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-[2.25rem] bg-slate-950 p-4 shadow-2xl">
              <div className="rounded-[1.8rem] bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 p-6">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  <span>One2OneLove</span>
                  <span>Sender preview</span>
                </div>

                <div className="mx-auto mt-8 max-w-[19rem] -rotate-2 rounded-sm border border-yellow-300 bg-yellow-100 p-6 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-pink-600"><Heart className="h-4 w-4 fill-pink-500" /> Love Note</div>
                  <p className="mt-5 text-center text-lg font-semibold leading-8 text-slate-800">{message || "Your note will appear here."}</p>
                  <div className="mt-5 text-right text-sm font-bold text-slate-600">— {senderLabel} 💕</div>
                  <div className="mt-2 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Sent through One2OneLove</div>
                </div>

                <div className="mt-8 rounded-2xl border border-white bg-white/85 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <MessageCircleHeart className="mt-0.5 h-5 w-5 text-pink-600" />
                    <div>
                      <div className="font-black text-slate-950">What {recipientLabel} receives first</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">“💕 {senderLabel} sent you a private Love Note on One2OneLove. Tap to reveal it.”</p>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-xs font-black text-white"><LockKeyhole className="h-3.5 w-3.5" /> Reveal my Love Note</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
