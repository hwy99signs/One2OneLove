import { milestoneApi } from './milestoneApi';

export async function uploadMilestonePhoto(file, milestoneId = null) {
  try {
    if (!file?.type?.startsWith('image/')) throw new Error('File must be an image');
    if (file.size > 10 * 1024 * 1024) throw new Error('Milestone photo must be 10MB or smaller');
    return await milestoneApi.uploadPhoto(file, milestoneId);
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

export async function uploadMilestonePhotos(files, milestoneId = null) {
  try { return await Promise.all((files || []).map((file) => uploadMilestonePhoto(file, milestoneId))); }
  catch (error) { console.error('Error uploading photos:', error); throw error; }
}

export async function deleteMilestonePhoto(photoUrl) {
  try { await milestoneApi.deletePhoto(photoUrl); }
  catch (error) { console.error('Error deleting photo:', error); throw error; }
}

export async function deleteMilestonePhotos(photoUrls) {
  try { await Promise.all((photoUrls || []).map((url) => deleteMilestonePhoto(url))); }
  catch (error) { console.error('Error deleting photos:', error); throw error; }
}

export async function getMilestones(orderBy = '-date') {
  try { return await milestoneApi.list({ order: orderBy }); }
  catch (error) { console.error('Error fetching milestones:', error); throw error; }
}

export async function getMilestoneById(milestoneId) {
  try { return await milestoneApi.get(milestoneId); }
  catch (error) { console.error('Error fetching milestone:', error); throw error; }
}

export async function createMilestone(milestoneData) {
  try {
    return await milestoneApi.create({
      ...milestoneData,
      milestone_type: milestoneData?.milestone_type || 'custom',
      media_urls: Array.isArray(milestoneData?.media_urls) ? milestoneData.media_urls : [],
      is_recurring: Boolean(milestoneData?.is_recurring),
      reminder_enabled: milestoneData?.reminder_enabled !== false,
      reminder_days_before: milestoneData?.reminder_days_before ?? 7,
      celebration_ideas: Array.isArray(milestoneData?.celebration_ideas) ? milestoneData.celebration_ideas : [],
      celebration_completed: Boolean(milestoneData?.celebration_completed),
    });
  } catch (error) {
    console.error('Error creating milestone:', error);
    throw error;
  }
}

export async function updateMilestone(milestoneId, updates) {
  try {
    const { user_id: _userId, id: _id, created_at: _createdAt, updated_at: _updatedAt, ...allowed } = updates || {};
    return await milestoneApi.update(milestoneId, allowed);
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }
}

export async function deleteMilestone(milestoneId) {
  try { await milestoneApi.remove(milestoneId); }
  catch (error) { console.error('Error deleting milestone:', error); throw error; }
}

export async function getUpcomingMilestones(daysAhead = 60) {
  try {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysAhead);
    const startDate = today.toISOString().split('T')[0];
    const endDate = futureDate.toISOString().split('T')[0];

    const [dated, recurring] = await Promise.all([
      milestoneApi.list({ startDate, endDate, order: 'date' }),
      milestoneApi.list({ recurring: true, order: 'date' }),
    ]);

    const byId = new Map();
    for (const milestone of dated) byId.set(milestone.id, milestone);
    for (const milestone of recurring) {
      const nextDate = getNextAnniversary(milestone.date);
      const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= daysAhead) {
        byId.set(milestone.id, { ...milestone, displayDate: nextDate.toISOString().split('T')[0], daysUntil });
      }
    }

    return Array.from(byId.values()).sort((a, b) => new Date(a.displayDate || a.date) - new Date(b.displayDate || b.date));
  } catch (error) {
    console.error('Error fetching upcoming milestones:', error);
    throw error;
  }
}

export async function getPastMilestones() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const milestones = await milestoneApi.list({ recurring: false, order: '-date' });
    return milestones.filter((milestone) => milestone.date < today);
  } catch (error) {
    console.error('Error fetching past milestones:', error);
    throw error;
  }
}

export async function getMilestonesByType(milestoneType) {
  try { return await milestoneApi.list({ type: milestoneType, order: '-date' }); }
  catch (error) { console.error('Error fetching milestones by type:', error); throw error; }
}

export async function markCelebrationCompleted(milestoneId) {
  try { return await updateMilestone(milestoneId, { celebration_completed: true }); }
  catch (error) { console.error('Error marking celebration as completed:', error); throw error; }
}

export async function updateMilestoneMedia(milestoneId, mediaUrls) {
  try { return await updateMilestone(milestoneId, { media_urls: Array.isArray(mediaUrls) ? mediaUrls : [] }); }
  catch (error) { console.error('Error updating milestone media:', error); throw error; }
}

function getNextAnniversary(originalDate) {
  const today = new Date();
  const original = new Date(originalDate);
  const thisYear = new Date(today.getFullYear(), original.getMonth(), original.getDate());
  if (thisYear < today) return new Date(today.getFullYear() + 1, original.getMonth(), original.getDate());
  return thisYear;
}

export function getDaysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const milestoneDate = new Date(date);
  milestoneDate.setHours(0, 0, 0, 0);
  return Math.ceil((milestoneDate - today) / (1000 * 60 * 60 * 24));
}

export function needsReminder(milestone) {
  if (!milestone?.reminder_enabled) return false;
  const daysUntil = getDaysUntil(milestone.date);
  const daysSinceLastReminder = milestone.last_reminder_sent
    ? Math.ceil((new Date() - new Date(milestone.last_reminder_sent)) / (1000 * 60 * 60 * 24))
    : Infinity;
  return daysUntil <= milestone.reminder_days_before && daysSinceLastReminder >= 1;
}

export async function getMilestoneStats() {
  try {
    const milestones = await milestoneApi.list({ order: '-date' });
    const upcoming = milestones.filter((m) => getDaysUntil(m.date) >= 0 && getDaysUntil(m.date) <= 30);
    const past = milestones.filter((m) => !m.is_recurring && getDaysUntil(m.date) < 0);
    const recurring = milestones.filter((m) => m.is_recurring);
    return {
      total: milestones.length,
      upcoming: upcoming.length,
      past: past.length,
      recurring: recurring.length,
      withPhotos: milestones.filter((m) => m.media_urls?.length > 0).length,
      celebrated: milestones.filter((m) => m.celebration_completed).length,
    };
  } catch (error) {
    console.error('Error fetching milestone stats:', error);
    throw error;
  }
}
