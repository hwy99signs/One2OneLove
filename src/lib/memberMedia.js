const configuredSupabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');

const profilePicturePrefix = '/storage/v1/object/public/profile-pictures/';

/**
 * Member-directory avatars are optional. Only render a permanent avatar URL when it
 * points to this One2OneLove deployment's own Supabase public profile-pictures bucket.
 * Old external/generated URLs are treated as absent so UI components fall back to local
 * initials instead of contacting a third-party host.
 */
export const safeMemberAvatarUrl = (value) => {
  if (!value || typeof value !== 'string' || !configuredSupabaseUrl) return null;

  try {
    const expectedOrigin = new URL(configuredSupabaseUrl).origin;
    const candidate = new URL(value);
    if (candidate.origin !== expectedOrigin) return null;
    if (!candidate.pathname.startsWith(profilePicturePrefix)) return null;

    const objectPath = decodeURIComponent(candidate.pathname.slice(profilePicturePrefix.length));
    if (!objectPath || objectPath.includes('..') || objectPath.startsWith('/')) return null;
    return candidate.toString();
  } catch {
    return null;
  }
};

export const sanitizeMemberSummary = (member) => {
  if (!member || typeof member !== 'object') return member;
  return {
    ...member,
    avatar_url: safeMemberAvatarUrl(member.avatar_url),
    avatar: safeMemberAvatarUrl(member.avatar),
  };
};
