import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Flag,
  Heart,
  MessageCircleHeart,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { getLiveCommunityRoom, getRoomActivityLabel } from "@/lib/liveCommunityRooms";
import { joinRoomPresence } from "@/lib/roomPresenceService";
import {
  deleteOwnRoomMessage,
  getRoomMessages,
  REACTIONS,
  REPORT_REASONS,
  reportRoomMessage,
  sendRoomMessage,
  subscribeToRoomMessages,
  toggleRoomReaction,
} from "@/lib/liveRoomMessageService";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";

const HOST_IDLE_MS = 90_000;

const timeLabel = (value) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));

function ReactionBar({ message, userId, onToggle }) {
  const counts = useMemo(() => {
    const result = {};
    (message.room_message_reactions || []).forEach((reaction) => {
      result[reaction.emoji] = (result[reaction.emoji] || 0) + 1;
    });
    return result;
  }, [message.room_message_reactions]);

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {REACTIONS.map((emoji) => {
        const selected = (message.room_message_reactions || []).some(
          (reaction) => reaction.user_id === userId && reaction.emoji === emoji
        );

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(message, emoji)}
            className={`rounded-full border px-2.5 py-1 text-xs transition ${
              selected
                ? "border-pink-300 bg-pink-50 text-pink-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            aria-label={`React ${emoji}`}
          >
            {emoji}{counts[emoji] ? ` ${counts[emoji]}` : ""}
          </button>
        );
      })}
    </div>
  );
}

function ReportDialog({ message, reason, details, status, onReason, onDetails, onClose, onSubmit }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
      <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-label="Report message">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-pink-600">Community safety</div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Report this message</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close report dialog">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <div className="font-black text-slate-800">{message.sender_name}</div>
          <div className="mt-1 line-clamp-3">{message.content}</div>
        </div>

        <label className="mt-5 block text-sm font-black text-slate-800">Why are you reporting it?</label>
        <select
          value={reason}
          onChange={(event) => onReason(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-pink-300"
        >
          <option value="">Select a reason</option>
          {REPORT_REASONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-black text-slate-800">Additional details <span className="font-semibold text-slate-400">(optional)</span></label>
        <textarea
          value={details}
          onChange={(event) => onDetails(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Add context that will help us review the report."
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-pink-300"
        />
        <div className="mt-1 text-right text-[11px] font-semibold text-slate-400">{details.length}/500</div>

        {status && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{status}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600">Cancel</button>
          <button type="button" onClick={onSubmit} disabled={!reason} className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">Submit report</button>
        </div>
      </div>
    </div>
  );
}

export default function LiveRoom() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const room = getLiveCommunityRoom(searchParams.get("room"));
  const [activeCount, setActiveCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [backendReady, setBackendReady] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const messagesEndRef = useRef(null);
  const activityLabel = getRoomActivityLabel(activeCount);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setActiveCount(0);
    if (!user?.id) return undefined;
    return joinRoomPresence(room.slug, user, setActiveCount);
  }, [room.slug, user?.id]);

  const loadMessages = useCallback(async () => {
    if (!user?.id) {
      setMessages([]);
      setBackendReady(null);
      return;
    }

    try {
      const result = await getRoomMessages(room.slug);
      setBackendReady(result.ready);
      setMessages(result.messages);
      setMessageError("");
    } catch (error) {
      console.error("Failed to load room messages:", error);
      setBackendReady(false);
      setMessageError("The room message service could not load yet.");
    }
  }, [room.slug, user?.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!backendReady || !user?.id) return undefined;
    return subscribeToRoomMessages(room.slug, loadMessages);
  }, [backendReady, loadMessages, room.slug, user?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  const lastMessageAt = messages.length
    ? new Date(messages[messages.length - 1].created_at).getTime()
    : 0;
  const roomHasGoneQuiet = backendReady === true && messages.length > 0 && clock - lastMessageAt >= HOST_IDLE_MS;
  const showHostPrompt = !backendReady || messages.length === 0 || roomHasGoneQuiet;

  const handleSend = async (event) => {
    event.preventDefault();
    if (!backendReady || !user?.id || !draft.trim()) return;

    setSending(true);
    setMessageError("");
    try {
      await sendRoomMessage(room.slug, user, draft);
      setDraft("");
      setClock(Date.now());
      await loadMessages();
    } catch (error) {
      console.error("Failed to send room message:", error);
      setMessageError(error?.message || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (message, emoji) => {
    try {
      await toggleRoomReaction(message, user?.id, emoji);
      await loadMessages();
    } catch (error) {
      console.error("Failed to update reaction:", error);
      setMessageError("Reaction could not be updated.");
    }
  };

  const handleDelete = async (message) => {
    if (!user?.id || message.user_id !== user.id) return;
    const confirmed = window.confirm("Delete this message from the room?");
    if (!confirmed) return;

    try {
      await deleteOwnRoomMessage(message.id, user.id);
      await loadMessages();
    } catch (error) {
      console.error("Failed to delete room message:", error);
      setMessageError("Your message could not be deleted.");
    }
  };

  const openReport = (message) => {
    setReportTarget(message);
    setReportReason("");
    setReportDetails("");
    setReportStatus("");
  };

  const closeReport = () => {
    setReportTarget(null);
    setReportReason("");
    setReportDetails("");
    setReportStatus("");
  };

  const submitReport = async () => {
    if (!reportTarget || !user?.id || !reportReason) return;
    setReportStatus("");
    try {
      await reportRoomMessage(reportTarget.id, user.id, reportReason, reportDetails);
      setReportStatus("Report submitted for review.");
      window.setTimeout(closeReport, 900);
    } catch (error) {
      console.error("Failed to report room message:", error);
      setReportStatus(error?.message || "Report could not be submitted.");
    }
  };

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

          <div className="max-h-[65vh] min-h-[31rem] overflow-y-auto bg-gradient-to-b from-white to-slate-50 p-5 sm:p-7">
            {showHostPrompt && (
              <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-violet-200 bg-violet-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-violet-700">
                  <Sparkles className="h-4 w-4" />
                  O2OL Host
                </div>
                <p className="mt-3 text-lg font-bold leading-7 text-violet-950">“{room.topic}”</p>
                <div className="mt-4 text-sm leading-6 text-violet-800/80">
                  {roomHasGoneQuiet
                    ? "The room has been quiet for a bit, so the host offers one invitation back into the conversation. Once members begin talking again, the host steps away."
                    : "A conversation is always waiting here. Once members start talking, the host moves into the background."}
                </div>
              </div>
            )}

            {user && backendReady === true && messages.length > 0 && (
              <div className="mx-auto mt-5 max-w-3xl space-y-4">
                {messages.map((message) => {
                  const mine = message.user_id === user.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`group max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-pink-600 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                        <div className={`flex items-center gap-2 text-xs font-black ${mine ? "text-pink-100" : "text-slate-500"}`}>
                          <span>{mine ? "You" : message.sender_name}</span>
                          <span>·</span>
                          <span>{timeLabel(message.created_at)}</span>
                          {mine ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(message)}
                              className="ml-auto rounded-full p-1 opacity-70 transition hover:bg-white/15 hover:opacity-100"
                              aria-label="Delete your message"
                              title="Delete your message"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openReport(message)}
                              className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                              aria-label="Report message"
                              title="Report message"
                            >
                              <Flag className="h-3 w-3" />
                              Report
                            </button>
                          )}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{message.content}</div>
                        <ReactionBar message={message} userId={user.id} onToggle={handleReaction} />
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {user && backendReady === false && (
              <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-6 text-center">
                <MessageCircleHeart className="mx-auto h-7 w-7 text-amber-600" />
                <div className="mt-3 font-black text-slate-900">Group messaging is built and waiting for database activation.</div>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                  The realtime interface, reactions, member message deletion, and reporting controls are prepared on the development branch. The approved messaging migration has not been applied yet.
                </p>
              </div>
            )}

            {messageError && <div className="mx-auto mt-4 max-w-2xl text-center text-sm font-semibold text-red-600">{messageError}</div>}
          </div>

          <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
            {user ? (
              <div>
                <form onSubmit={handleSend} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    disabled={!backendReady || sending}
                    maxLength={2000}
                    placeholder={backendReady ? "Say something to the room…" : "Messaging will unlock after the secure room tables are activated."}
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!backendReady || sending || !draft.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600 text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <div className="mt-2 flex justify-between px-1 text-[11px] font-semibold text-slate-400">
                  <span>Be real. Be respectful. Tell the story, not the person.</span>
                  <span>{draft.length}/2000</span>
                </div>
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
              {activityLabel
                ? `${activityLabel}. This count reflects signed-in members currently inside this room.`
                : "When signed-in members are inside this room, their real count appears here. Otherwise the host topic takes its place instead of showing ‘0’."}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 font-black text-slate-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Room standard
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">Tell the story. Don’t expose the person.</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">No doxxing, targeted humiliation, threats, or turning a relationship discussion into a public attack. Members can report another member’s message for review.</p>
          </div>

          <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-5">
            <div className="flex items-center gap-2 font-black text-violet-950">
              <Sparkles className="h-5 w-5 text-violet-600" />
              AI Host rhythm
            </div>
            <p className="mt-3 text-sm leading-6 text-violet-900/75">Humans talking: host listens. About 90 seconds of quiet: host invites. Conversation resumes: host disappears again.</p>
          </div>

          <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-600 to-violet-600 p-5 text-white shadow-lg">
            <Heart className="h-5 w-5 fill-white text-white" />
            <div className="mt-3 font-black">O2OL is built for the conversation after the match.</div>
            <p className="mt-2 text-sm leading-6 text-white/85">Connection, communication, growth, and everyday love.</p>
          </div>
        </aside>
      </section>

      <ReportDialog
        message={reportTarget}
        reason={reportReason}
        details={reportDetails}
        status={reportStatus}
        onReason={setReportReason}
        onDetails={setReportDetails}
        onClose={closeReport}
        onSubmit={submitReport}
      />
    </main>
  );
}
