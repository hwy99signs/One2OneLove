import { supabase } from "./supabase";

const REACTIONS = ["❤️", "👍", "😂", "👏", "🤔"];

const isMissingRoomBackend = (error) =>
  error?.code === "PGRST205" ||
  error?.code === "42P01" ||
  /room_messages|room_message_reactions/i.test(error?.message || "");

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

export { REACTIONS };
