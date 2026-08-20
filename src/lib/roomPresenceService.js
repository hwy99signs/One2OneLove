import { supabase } from "./supabase";

const ROOM_SLUGS = new Set([
  "global-relationship-room",
  "vent-room",
  "modern-dating-unfiltered",
  "love-talk",
  "marriage-matters",
  "starting-over",
]);

const requireRoomSlug = (roomSlug) => {
  const slug = String(roomSlug || "").trim();
  if (!ROOM_SLUGS.has(slug)) return null;
  return slug;
};

const roomChannelName = (roomSlug) => `o2ol-live-room:${roomSlug}`;
const countPresenceMembers = (state) => Object.keys(state || {}).length;

const opaqueLocalKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Stable within one room so multiple tabs for the same signed-in member count as one
// human, but different across rooms so Presence keys cannot be correlated cross-room.
const privatePresenceKey = async (roomSlug, userId) => {
  try {
    if (globalThis.crypto?.subtle) {
      const bytes = new TextEncoder().encode(`one2onelove-room-presence:${roomSlug}:${userId}`);
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    console.warn("Live Room presence-key hashing unavailable");
  }

  // Older-browser fallback stays opaque and room-scoped rather than broadcasting or
  // persisting an account UUID/name. One member gets a different local key per room.
  const storageKey = `o2ol-presence:${roomSlug}:${userId}`;
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

const cleanupPresenceChannel = (channel) => {
  if (!channel) return;
  void Promise.resolve(channel.untrack?.())
    .catch(() => {})
    .finally(() => {
      void supabase.removeChannel(channel);
    });
};

export function observeRoomPresence(roomSlug, onCountChange) {
  const slug = requireRoomSlug(roomSlug);
  if (!slug) {
    onCountChange?.(0);
    return () => {};
  }

  const channel = supabase.channel(roomChannelName(slug));

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
    void supabase.removeChannel(channel);
  };
}

// Compatibility signature retained, but `user` is deliberately ignored; the signed-in
// account is resolved from Supabase Auth before Presence tracking begins.
export function joinRoomPresence(roomSlug, _user, onCountChange) {
  const slug = requireRoomSlug(roomSlug);
  if (!slug) {
    onCountChange?.(0);
    return () => {};
  }

  let channel = null;
  let cancelled = false;

  void (async () => {
    const { data, error } = await supabase.auth.getUser();
    const userId = error ? null : data?.user?.id;
    if (cancelled || !userId) {
      onCountChange?.(0);
      return;
    }

    const presenceKey = await privatePresenceKey(slug, userId);
    if (cancelled) return;

    channel = supabase.channel(roomChannelName(slug), {
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
          // Presence is aggregate-only: no account ID, name, email or profile data.
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });
  })();

  return () => {
    cancelled = true;
    const current = channel;
    channel = null;
    cleanupPresenceChannel(current);
  };
}

// Legacy LiveRoom compatibility. The supplied public key is never authoritative;
// authenticated membership and a room-scoped opaque key are derived before tracking.
export function buildPublicPresenceKey() {
  return opaqueLocalKey();
}

export function enterPublicRoom(roomSlug, _presenceKey, onCountChange) {
  const slug = requireRoomSlug(roomSlug);
  if (!slug) {
    onCountChange?.(0);
    return () => {};
  }

  let channel = null;
  let cancelled = false;

  void (async () => {
    const { data, error } = await supabase.auth.getUser();
    const userId = error ? null : data?.user?.id;
    if (cancelled || !userId) {
      onCountChange?.(0);
      return;
    }

    const key = await privatePresenceKey(slug, userId);
    if (cancelled) return;

    channel = supabase.channel(roomChannelName(slug), {
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
    const current = channel;
    channel = null;
    cleanupPresenceChannel(current);
  };
}

export function leavePublicRoom() {
  // enterPublicRoom returns the authoritative cleanup function. This no-op is kept
  // only for older callers that invoke both cleanup paths during unmount.
}
