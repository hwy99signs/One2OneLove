import { calendarDayDifference, formatLocalDateInput, parseLocalDate } from '@/utils/localDate';
import { loadCollection, insertRecord, updateRecord, deleteRecord, getRecord, fileToDataUrl } from './guestStore';

// Guest mode is the ONLY mode (owner ruling, 2026-11-25): there are no
// members in the 100% free platform, so milestones live in the
// browser-local guest store and photos are kept as data URLs. This
// service never calls the member API — the server milestones API still
// exists in the worker but is switched off (410) with the rest of the
// member system, ready for future re-activation.
const LOCAL = 'milestones';

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

export async function uploadMilestonePhoto(file, _milestoneId = null) {
  if (!file?.type?.startsWith('image/')) throw new Error('Milestone photo must be an image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Milestone photo must be 10MB or smaller.');
  // Photos stay in the browser as data URLs — no server upload exists
  // in guest mode.
  return fileToDataUrl(file);
}

export async function uploadMilestonePhotos(files, milestoneId = null) {
  return Promise.all((files || []).map((file) => uploadMilestonePhoto(file, milestoneId)));
}

export async function deleteMilestonePhoto(_photoUrl) {
  // Local data URLs need no server delete.
}

export async function deleteMilestonePhotos(photoUrls) {
  await Promise.all((photoUrls || []).map(deleteMilestonePhoto));
}

export async function getMilestones(orderBy = '-date') {
  return sortMilestones(loadCollection(LOCAL), orderBy);
}

export async function getMilestoneById(milestoneId) {
  return getRecord(LOCAL, milestoneId);
}

export async function createMilestone(milestoneData) {
  return insertRecord(LOCAL, milestoneData || {});
}

export async function updateMilestone(milestoneId, updates) {
  const { user_id, id, created_at, updated_at, ...allowed } = updates || {};
  void user_id; void id; void created_at; void updated_at;
  return updateRecord(LOCAL, milestoneId, allowed);
}

export async function deleteMilestone(milestoneId) {
  deleteRecord(LOCAL, milestoneId);
}

export async function getUpcomingMilestones(daysAhead = 60) {
  const today = new Date();
  const future = new Date(today);
  future.setDate(today.getDate() + daysAhead);
  const start = formatLocalDateInput(today);
  const end = formatLocalDateInput(future);
  const direct = loadCollection(LOCAL).filter(m => String(m?.date || '') >= start && String(m?.date || '') <= end);
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
  return sortMilestones(loadCollection(LOCAL).filter(m => (m?.milestone_type || m?.type) === milestoneType), '-date');
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
