import { supabase } from "./supabase";

const roomChannelName = (roomSlug) => `o2ol-live-room:${roomSlug}`;

const countPresenceMembers = (state) => Object.keys(state || {}).length;

export function observeRoomPresence(roomSlug, onCountChange) {
  const channel = supabase.channel(roomChannelName(roomSlug));

  const emitCount = () => {
    const count = countPresenceMembers(channel.presenceState());
    onCountChange?.(count);
  };

  channel
    .on("presence", { event: "sync" }, emitCount)
    .on("presence", { event: "join" }, emitCount)
    .on("presence", { event: "leave" }, emitCount)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function joinRoomPresence(roomSlug, user, onCountChange) {
  if (!user?.id) return () => {};

  const channel = supabase.channel(roomChannelName(roomSlug), {
    config: {
      presence: {
        key: user.id,
      },
    },
  });

  const emitCount = () => {
    const count = countPresenceMembers(channel.presenceState());
    onCountChange?.(count);
  };

  channel
    .on("presence", { event: "sync" }, emitCount)
    .on("presence", { event: "join" }, emitCount)
    .on("presence", { event: "leave" }, emitCount)
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          name: user.name || "Member",
          joined_at: new Date().toISOString(),
        });
      }
    });

  return () => {
    try {
      channel.untrack();
    } finally {
      supabase.removeChannel(channel);
    }
  };
}
