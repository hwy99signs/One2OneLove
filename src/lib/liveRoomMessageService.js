import { supabase } from "./supabase";

const REACTIONS = ["❤️", "👍", "😂", "👏", "🤔"];
export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or targeted humiliation" },
  { value: "personal_information", label: "Sharing private or identifying information" },
  { value: "threats", label: "Threats or unsafe behavior" },
  { value: "spam", label: "Spam or disruptive posting" },
  { value: "other", label: "Something else" },
];

const isMissingRoomBackend = (error) =>
  error?.code === "PGRST205" ||
  error?.code === "42P01" ||
  /room_messages|room_message_reactions|room_message_reports/i.test(error?.message || "");

const requireCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) throw new Error("Sign in to continue.");
  return data.user;
};

const publicSenderName = (user) => {
  const metadataName = String(user?.user_metadata?.display_name || user?.user_metadata?.full_name || "").trim();
  return metadataName.slice(0, 80) || "Member";
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
  const { data, error } = await supabase
    .from("room_messages")
    .select("id, room_slug, user_id, sender_name, content, message_type, created_at, room_message_reactions(id, user_id, emoji)")
    .eq("room_slug", roomSlug)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (isMissingRoomBackend(error)) return { ready: false, messages: [] };
    throw error;
  }

  return { ready: true, messages: data || [] };
}

export async function sendRoomMessage(roomSlug, user, content) {
  const trimmed = content.trim();
  if (!user?.id) throw new Error("Sign in to send a message.");
  if (!trimmed) throw new Error("Write a message first.");
  if (trimmed.length > 2000) throw new Error("Messages can be up to 2,000 characters.");

  const { data, error } = await supabase
    .from("room_messages")
    .insert({
      room_slug: roomSlug,
      user_id: user.id,
      sender_name: user.name || "Member",
      content: trimmed,
      message_type: "member",
    })
    .select("id, room_slug, user_id, sender_name, content, message_type, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOwnRoomMessage(messageId, userId) {
  if (!messageId || !userId) throw new Error("Unable to delete this message.");

  const { error } = await supabase
    .from("room_messages")
    .delete()
    .eq("id", messageId)
    .eq("user_id", userId)
    .eq("message_type", "member");

  if (error) throw error;
}

export async function reportRoomMessage(messageId, reporterId, reason, details = "") {
  if (!messageId || !reporterId) throw new Error("Sign in to report a message.");
  if (!REPORT_REASONS.some((item) => item.value === reason)) throw new Error("Choose a report reason.");
  if (details.length > 500) throw new Error("Report details can be up to 500 characters.");

  const { error } = await supabase.from("room_message_reports").insert({
    message_id: messageId,
    reporter_id: reporterId,
    reason,
    details: details.trim() || null,
  });

  if (error) {
    if (isMissingRoomBackend(error)) {
      const unavailable = new Error("Reporting is prepared but the moderation database layer is not active yet.");
      unavailable.code = "ROOM_REPORTING_NOT_READY";
      throw unavailable;
    }
    if (error.code === "23505") throw new Error("You already reported this message.");
    throw error;
  }
}

export async function toggleRoomReaction(message, userId, emoji) {
  if (!REACTIONS.includes(emoji)) throw new Error("Unsupported reaction.");
  if (!userId) throw new Error("Sign in to react.");

  const existing = (message.room_message_reactions || []).find(
    (reaction) => reaction.user_id === userId && reaction.emoji === emoji
  );

  if (existing) {
    const { error } = await supabase
      .from("room_message_reactions")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", userId);
    if (error) throw error;
    return "removed";
  }

  const { error } = await supabase.from("room_message_reactions").insert({
    message_id: message.id,
    user_id: userId,
    emoji,
  });
  if (error) throw error;
  return "added";
}

export function subscribeToRoomMessages(roomSlug, onChange) {
  const channel = supabase
    .channel(`o2ol-room-messages:${roomSlug}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_messages", filter: `room_slug=eq.${roomSlug}` },
      () => onChange?.()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_message_reactions" },
      () => onChange?.()
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
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
  const user = await requireCurrentUser();
  return sendRoomMessage(roomSlug, { id: user.id, name: publicSenderName(user) }, content);
}

export async function reportLiveRoomMessage(messageId, details = "") {
  const user = await requireCurrentUser();
  return reportRoomMessage(messageId, user.id, "other", String(details || "").slice(0, 500));
}

export async function toggleLiveRoomReaction(messageId, emoji, shouldAdd = true) {
  const user = await requireCurrentUser();
  if (!REACTIONS.includes(emoji)) throw new Error("Unsupported reaction.");

  const { data: existing, error: lookupError } = await supabase
    .from("room_message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (shouldAdd && !existing) {
    const { error } = await supabase.from("room_message_reactions").insert({ message_id: messageId, user_id: user.id, emoji });
    if (error) throw error;
    return "added";
  }

  if (!shouldAdd && existing) {
    const { error } = await supabase.from("room_message_reactions").delete().eq("id", existing.id).eq("user_id", user.id);
    if (error) throw error;
    return "removed";
  }

  return existing ? "unchanged" : "absent";
}

export const subscribeToLiveRoomMessages = subscribeToRoomMessages;

export { REACTIONS };
