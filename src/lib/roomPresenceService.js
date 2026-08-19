import { supabase } from "./supabase";

const roomChannelName = (roomSlug) => `o2ol-live-room:${roomSlug}`;
const countPresenceMembers = (state) => Object.keys(state || {}).length;

const opaqueLocalKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const privatePresenceKey = async (userId) => {
  try {
    if (globalThis.crypto?.subtle) {
      const bytes = new TextEncoder().encode(`one2onelove-room-presence:${userId}`);
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
  } catch (error) {
    console.warn("Unable to hash Live Room presence key:", error);
  }

  // Older-browser fallback: keep an opaque local identifier rather than broadcasting
  // the account UUID or member name through Realtime Presence.
  const storageKey = `o2ol-presence:${userId}`;
  try {
    let value = localStorage.getItem(storageKey);
    if (!value) {
      value = opaqueLocalKey();
      localStorage.setItem(storageKey, value);
    }
    return value;
  } catch {
    return opaqueLocalKey();
  }
};

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

  let channel = null;
  let cancelled = false;

  void (async () => {
    const presenceKey = await privatePresenceKey(user.id);
    if (cancelled) return;

    channel = supabase.channel(roomChannelName(roomSlug), {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    });

    const emitCount = () => {
      const count = countPresenceMembers(channel?.presenceState?.() || {});
      onCountChange?.(count);
    };

    channel
      .on("presence", { event: "sync" }, emitCount)
      .on("presence", { event: "join" }, emitCount)
      .on("presence", { event: "leave" }, emitCount)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && !cancelled) {
          // Presence is used only for an aggregate human count. Do not broadcast
          // account IDs, names, email addresses, or profile data to room clients.
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });
  })();

  return () => {
    cancelled = true;
    if (!channel) return;
    try {
      channel.untrack();
    } finally {
      supabase.removeChannel(channel);
    }
  };
}

// Legacy LiveRoom compatibility. The public key remains opaque; authenticated
// membership is verified before tracking so community counts do not inflate with
// anonymous page views.
export function buildPublicPresenceKey() {
  return opaqueLocalKey();
}

export function enterPublicRoom(roomSlug, presenceKey, onCountChange) {
  let channel = null;
  let cancelled = false;

  void (async () => {
    const { data } = await supabase.auth.getUser();
    if (cancelled || !data?.user?.id) {
      onCountChange?.(0);
      return;
    }

    const key = await privatePresenceKey(data.user.id).catch(() => presenceKey || opaqueLocalKey());
    if (cancelled) return;

    channel = supabase.channel(roomChannelName(roomSlug), {
      config: { presence: { key } },
    });

    const emitCount = () => onCountChange?.(countPresenceMembers(channel?.presenceState?.() || {}));
    channel
      .on("presence", { event: "sync" }, emitCount)
      .on("presence", { event: "join" }, emitCount)
      .on("presence", { event: "leave" }, emitCount)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && !cancelled) {
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });
  })();

  return () => {
    cancelled = true;
    if (!channel) return;
    try {
      channel.untrack();
    } finally {
      supabase.removeChannel(channel);
    }
  };
}

export function leavePublicRoom() {
  // enterPublicRoom returns the authoritative cleanup function. This no-op is kept
  // only for older callers that invoke both cleanup paths during unmount.
}
