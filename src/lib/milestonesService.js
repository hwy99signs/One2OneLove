import { calendarDayDifference, formatLocalDateInput, parseLocalDate } from '@/utils/localDate';
import { apiRequest } from './apiClient';
import { loadCollection, insertRecord, updateRecord, deleteRecord, getRecord, isUnauthorized, fileToDataUrl } from './guestStore';

// Guest mode (2026-11-25): with no account, milestones live in the
// browser-local guest store and photos are kept as data URLs. Members keep
// the server API. Calls try the API first and fall back locally only on a
// 401 (no session).
const LOCAL = 'milestones';

function fileIdFromUrl(photoUrl) {
  const match = String(photoUrl || '').match(/\/api\/media\/milestones\/[0-9a-f-]{36}\/([0-9a-f-]{36})/i);
  return match?.[1] || null;
}

function sortMilestones(rows, orderBy) {
  const raw = String(orderBy || '-date');
  const field = raw.replace(/^-/, '') || 'date';
  const desc = raw.startsWith('-');
  return [...(rows || [])].sort((a, b) => {
    const av = String(a?.[field] || a?.date || a?.created_at || '');
    const bv = String(b?.[field] || b?.date || b?.created_at || '');
    return desc ? bv.localeCompare(av) : av.localeCompare(bv);
  });
}

export async function uploadMilestonePhoto(file, milestoneId = null) {
  if (!file?.type?.startsWith('image/')) throw new Error('Milestone photo must be an image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Milestone photo must be 10MB or smaller.');
  const query = milestoneId ? `?milestoneId=${encodeURIComponent(milestoneId)}` : '';
  try {
    const payload = await apiRequest(`/api/milestones/media${query}`, {
      method: 'POST',
      headers: { 'content-type': file.type },
      rawBody: file,
    });
    return payload?.url || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return fileToDataUrl(file);
  }
}

export async function uploadMilestonePhotos(files, milestoneId = null) {
  return Promise.all((files || []).map((file) => uploadMilestonePhoto(file, milestoneId)));
}

export async function deleteMilestonePhoto(photoUrl) {
  const id = fileIdFromUrl(photoUrl);
  if (!id) return; // local data URLs need no server delete
  try {
    await apiRequest(`/api/milestones/media/${id}`, { method: 'DELETE' });
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
  }
}

export async function deleteMilestonePhotos(photoUrls) {
  await Promise.all((photoUrls || []).map(deleteMilestonePhoto));
}

export async function getMilestones(orderBy = '-date') {
  try {
    const payload = await apiRequest(`/api/milestones?order=${encodeURIComponent(orderBy)}`);
    return payload?.milestones || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return sortMilestones(loadCollection(LOCAL), orderBy);
  }
}

export async function getMilestoneById(milestoneId) {
  try {
    const payload = await apiRequest(`/api/milestones/${milestoneId}`);
    return payload?.milestone || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return getRecord(LOCAL, milestoneId);
  }
}

export async function createMilestone(milestoneData) {
  try {
    const payload = await apiRequest('/api/milestones', { method: 'POST', body: milestoneData });
    return payload?.milestone || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return insertRecord(LOCAL, milestoneData || {});
  }
}

export async function updateMilestone(milestoneId, updates) {
  const { user_id, id, created_at, updated_at, ...allowed } = updates || {};
  void user_id; void id; void created_at; void updated_at;
  try {
    const payload = await apiRequest(`/api/milestones/${milestoneId}`, { method: 'PATCH', body: allowed });
    return payload?.milestone || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return updateRecord(LOCAL, milestoneId, allowed);
  }
}

export async function deleteMilestone(milestoneId) {
  try {
    await apiRequest(`/api/milestones/${milestoneId}`, { method: 'DELETE' });
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    deleteRecord(LOCAL, milestoneId);
  }
}

export async function getUpcomingMilestones(daysAhead = 60) {
  const today = new Date();
  const future = new Date(today);
  future.setDate(today.getDate() + daysAhead);
  const params = new URLSearchParams({
    startDate: formatLocalDateInput(today),
    endDate: formatLocalDateInput(future),
    order: 'date',
  });
  let direct = [];
  try {
    const payload = await apiRequest(`/api/milestones?${params}`);
    direct = payload?.milestones || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    const start = formatLocalDateInput(today);
    const end = formatLocalDateInput(future);
    direct = loadCollection(LOCAL).filter(m => String(m?.date || '') >= start && String(m?.date || '') <= end);
  }
  const all = await getMilestones('date');
  const recurring = all.filter((m) => m.is_recurring).map((m) => {
    const next = getNextAnniversary(m.date);
    const daysUntil = calendarDayDifference(next, today);
    return daysUntil >= 0 && daysUntil <= daysAhead
      ? { ...m, displayDate: formatLocalDateInput(next), daysUntil }
      : null;
  }).filter(Boolean);
  const seen = new Set();
  return [...direct, ...recurring].filter((m) => {
    const key = `${m.id}:${m.displayDate || m.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (parseLocalDate(a.displayDate || a.date)?.getTime() || 0) - (parseLocalDate(b.displayDate || b.date)?.getTime() || 0));
}

export async function getPastMilestones() {
  const all = await getMilestones('-date');
  const today = formatLocalDateInput();
  return all.filter((m) => !m.is_recurring && String(m.date) < today);
}

export async function getMilestonesByType(milestoneType) {
  try {
    const params = new URLSearchParams({ type: milestoneType, order: '-date' });
    const payload = await apiRequest(`/api/milestones?${params}`);
    return payload?.milestones || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return sortMilestones(loadCollection(LOCAL).filter(m => (m?.milestone_type || m?.type) === milestoneType), '-date');
  }
}

export async function markCelebrationCompleted(milestoneId) {
  return updateMilestone(milestoneId, { celebration_completed: true });
}

export async function updateMilestoneMedia(milestoneId, mediaUrls) {
  return updateMilestone(milestoneId, { media_urls: mediaUrls || [] });
}

function getNextAnniversary(originalDate) {
  const today = new Date();
  const original = parseLocalDate(originalDate) || new Date();
  let next = new Date(today.getFullYear(), original.getMonth(), original.getDate());
  if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    next = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate());
  }
  return next;
}

export function getDaysUntil(date) {
  return calendarDayDifference(date) ?? Infinity;
}

export function needsReminder(milestone) {
  if (!milestone?.reminder_enabled) return false;
  const daysUntil = getDaysUntil(milestone.date);
  const daysSinceLastReminder = milestone.last_reminder_sent
    ? Math.ceil((Date.now() - new Date(milestone.last_reminder_sent).getTime()) / 86400000)
    : Infinity;
  return daysUntil <= Number(milestone.reminder_days_before || 0) && daysSinceLastReminder >= 1;
}

export async function getMilestoneStats() {
  const milestones = await getMilestones('-date');
  return {
    total: milestones.length,
    upcoming: milestones.filter((m) => getDaysUntil(m.date) >= 0 && getDaysUntil(m.date) <= 30).length,
    past: milestones.filter((m) => !m.is_recurring && getDaysUntil(m.date) < 0).length,
    recurring: milestones.filter((m) => m.is_recurring).length,
    withPhotos: milestones.filter((m) => Array.isArray(m.media_urls) && m.media_urls.length > 0).length,
    celebrated: milestones.filter((m) => m.celebration_completed).length,
  };
}
