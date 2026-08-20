import { supabase } from "./supabase";

const REACTIONS = ["❤️", "👍", "😂", "👏", "🤔"];
const ROOM_SLUGS = new Set([
  "global-relationship-room",
  "vent-room",
  "modern-dating-unfiltered",
  "love-talk",
  "marriage-matters",
  "starting-over",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or targeted humiliation" },
  { value: "personal_information", label: "Sharing private or identifying information" },
  { value: "threats", label: "Threats or unsafe behavior" },
  { value: "spam", label: "Spam or disruptive posting" },
  { value: "other", label: "Something else" },
];

const codedError = (code) => {
  const error = new Error("");
  error.code = code;
  return error;
};

const isMissingRoomBackend = (error) =>
  error?.code === "PGRST205" ||
  error?.code === "42P01" ||
  /room_messages|room_message_reactions|room_message_reports/i.test(error?.message || "");

const requireCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) throw codedError("O2OL_ROOM_AUTH_REQUIRED");
  return data.user;
};

const requireRoomSlug = (roomSlug) => {
  const slug = String(roomSlug || "").trim();
  if (!ROOM_SLUGS.has(slug)) throw codedError("O2OL_ROOM_INVALID");
  return slug;
};

const requireMessageId = (messageId) => {
  const id = String(messageId || "").trim();
  if (!UUID_PATTERN.test(id)) throw codedError("O2OL_ROOM_MESSAGE_INVALID");
  return id;
};

const aggregateReactions = (rows = [], currentUserId = null) => {
  const grouped = new Map();
  for (const row of rows || []) {
    const emoji = row?.emoji;
    if (!emoji) continue;
    const current = grouped.get(emoji) || { reaction: emoji, count: 0, reacted_by_me: false };
    current.count += 1;
    if (currentUserId && row.user_id === currentUserId) current.reacted_by_me = true;
    grouped.set(emoji, current);
  }
  return Array.from(grouped.values());
};

export async function getRoomMessages(roomSlug, limit = 80) {
  const slug = requireRoomSlug(roomSlug);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 80, 100));
  const { data, error } = await supabase
    .from("room_messages")
    .select("id, room_slug, user_id, sender_name, content, message_type, created_at, room_message_reactions(id, user_id, emoji)")
    .eq("room_slug", slug)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(safeLimit);

  if (error) {
    if (isMissingRoomBackend(error)) return { ready: false, messages: [] };
    throw codedError("O2OL_ROOM_MESSAGES_LOAD_FAILED");
  }

  return { ready: true, messages: data || [] };
}

// Compatibility signature retained for older callers, but `user` is deliberately ignored.
// Message identity/name/type are database-derived by the Live Room BEFORE INSERT trigger.
export async function sendRoomMessage(roomSlug, _user, content) {
  await requireCurrentUser();
  const slug = requireRoomSlug(roomSlug);
  const trimmed = String(content || "").trim();
  if (!trimmed) throw codedError("O2OL_ROOM_MESSAGE_REQUIRED");
  if (trimmed.length > 2000) throw codedError("O2OL_ROOM_MESSAGE_TOO_LONG");

  const { data, error } = await supabase
    .from("room_messages")
    .insert({ room_slug: slug, content: trimmed })
    .select("id, room_slug, user_id, sender_name, content, message_type, created_at")
    .single();

  if (error) throw codedError("O2OL_ROOM_MESSAGE_SEND_FAILED");
  return data;
}

// Compatibility signature retained; delete ownership always comes from Auth.
export async function deleteOwnRoomMessage(messageId, _userId) {
  const user = await requireCurrentUser();
  const id = requireMessageId(messageId);

  const { error } = await supabase
    .from("room_messages")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("message_type", "member");

  if (error) throw codedError("O2OL_ROOM_MESSAGE_DELETE_FAILED");
}

// Compatibility signature retained; reporter ownership always comes from Auth. The first
// insert matches the staged content-only grant. A 23502 fallback preserves development
// compatibility with the earlier live schema until the identity-hardening migration is applied.
export async function reportRoomMessage(messageId, _reporterId, reason, details = "") {
  const user = await requireCurrentUser();
  const id = requireMessageId(messageId);
  const safeDetails = String(details || "").trim();
  if (!REPORT_REASONS.some((item) => item.value === reason)) throw codedError("O2OL_ROOM_REPORT_REASON_INVALID");
  if (safeDetails.length > 500) throw codedError("O2OL_ROOM_REPORT_DETAILS_TOO_LONG");

  const payload = { message_id: id, reason, details: safeDetails || null };
  let { error } = await supabase.from("room_message_reports").insert(payload);

  if (error?.code === "23502") {
    ({ error } = await supabase.from("room_message_reports").insert({ ...payload, reporter_id: user.id }));
  }

  if (error) {
    if (isMissingRoomBackend(error)) throw codedError("O2OL_ROOM_REPORTING_NOT_READY");
    if (error.code === "23505") throw codedError("O2OL_ROOM_REPORT_DUPLICATE");
    throw codedError("O2OL_ROOM_REPORT_FAILED");
  }
}

// Compatibility signature retained; reaction ownership always comes from Auth.
export async function toggleRoomReaction(message, _userId, emoji) {
  const user = await requireCurrentUser();
  if (!REACTIONS.includes(emoji)) throw codedError("O2OL_ROOM_REACTION_INVALID");
  const messageId = requireMessageId(message?.id);

  const existing = (message?.room_message_reactions || []).find(
    (reaction) => reaction.user_id === user.id && reaction.emoji === emoji
  );

  if (existing) {
    const { error } = await supabase
      .from("room_message_reactions")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) throw codedError("O2OL_ROOM_REACTION_UPDATE_FAILED");
    return "removed";
  }

  let { error } = await supabase.from("room_message_reactions").insert({ message_id: messageId, emoji });
  if (error?.code === "23502") {
    ({ error } = await supabase.from("room_message_reactions").insert({ message_id: messageId, user_id: user.id, emoji }));
  }
  if (error) throw codedError("O2OL_ROOM_REACTION_UPDATE_FAILED");
  return "added";
}

export function subscribeToRoomMessages(roomSlug, onChange) {
  const slug = requireRoomSlug(roomSlug);
  let timer = null;
  const scheduleChange = () => {
    if (timer) return;
    timer = window.setTimeout(() => {
      timer = null;
      onChange?.();
    }, 200);
  };

  const channel = supabase
    .channel(`o2ol-room-messages:${slug}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_messages", filter: `room_slug=eq.${slug}` },
      scheduleChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_message_reactions" },
      scheduleChange
    )
    .subscribe();

  return () => {
    if (timer) window.clearTimeout(timer);
    return supabase.removeChannel(channel);
  };
}

// Relaunch compatibility layer. LiveRoom.jsx historically used the names below while
// the hardened data service uses the room-oriented names above. Keep one database
// implementation and adapt at this boundary rather than duplicating room logic.
export async function listLiveRoomMessages(roomSlug, limit = 80) {
  const [{ messages }, authResult] = await Promise.all([
    getRoomMessages(roomSlug, limit),
    supabase.auth.getUser().catch(() => ({ data: { user: null } })),
  ]);
  const currentUserId = authResult?.data?.user?.id || null;
  return (messages || []).map((message) => ({
    ...message,
    sender_id: message.user_id,
    reactions: aggregateReactions(message.room_message_reactions, currentUserId),
  }));
}

export async function sendLiveRoomMessage(roomSlug, content) {
  return sendRoomMessage(roomSlug, null, content);
}

export async function reportLiveRoomMessage(messageId, details = "") {
  return reportRoomMessage(messageId, null, "other", String(details || "").slice(0, 500));
}

export async function toggleLiveRoomReaction(messageId, emoji, shouldAdd = true) {
  const user = await requireCurrentUser();
  if (!REACTIONS.includes(emoji)) throw codedError("O2OL_ROOM_REACTION_INVALID");
  const id = requireMessageId(messageId);

  const { data: existing, error: lookupError } = await supabase
    .from("room_message_reactions")
    .select("id")
    .eq("message_id", id)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();
  if (lookupError) throw codedError("O2OL_ROOM_REACTION_UPDATE_FAILED");

  if (shouldAdd && !existing) {
    let { error } = await supabase.from("room_message_reactions").insert({ message_id: id, emoji });
    if (error?.code === "23502") {
      ({ error } = await supabase.from("room_message_reactions").insert({ message_id: id, user_id: user.id, emoji }));
    }
    if (error) throw codedError("O2OL_ROOM_REACTION_UPDATE_FAILED");
    return "added";
  }

  if (!shouldAdd && existing) {
    const { error } = await supabase.from("room_message_reactions").delete().eq("id", existing.id).eq("user_id", user.id);
    if (error) throw codedError("O2OL_ROOM_REACTION_UPDATE_FAILED");
    return "removed";
  }

  return existing ? "unchanged" : "absent";
}

export const subscribeToLiveRoomMessages = subscribeToRoomMessages;

export { REACTIONS };
