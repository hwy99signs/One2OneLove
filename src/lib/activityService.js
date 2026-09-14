import { apiRequest } from './apiClient';

function latestDate(items = []) {
  const values = items
    .map((item) => item?.updated_at || item?.created_at || item?.entry_date || item?.memory_date || item?.date || null)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  if (!values.length) return null;
  return new Date(Math.max(...values)).toISOString();
}

function consecutiveDayStreak(items = []) {
  const days = [...new Set(items
    .map((item) => item?.updated_at || item?.created_at || item?.entry_date || item?.memory_date || item?.date || null)
    .filter(Boolean)
    .map((value) => new Date(value).toISOString().slice(0, 10)))]
    .sort()
    .reverse();
  if (!days.length) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i += 1) {
    const newer = new Date(`${days[i - 1]}T00:00:00Z`);
    const older = new Date(`${days[i]}T00:00:00Z`);
    if ((newer - older) / 86400000 === 1) streak += 1;
    else break;
  }
  return streak;
}

async function safeRequest(path, fallback) {
  try {
    return await apiRequest(path);
  } catch {
    return fallback;
  }
}

export async function getActivityProgress() {
  const [journalPayload, goalsPayload, memoryPayload, milestonePayload, engagementPayload] = await Promise.all([
    safeRequest('/api/journals?order=-entry_date', { entries: [] }),
    safeRequest('/api/goals?order=-created_at', { goals: [] }),
    safeRequest('/api/memories', { memories: [] }),
    safeRequest('/api/milestones?order=-date', { milestones: [] }),
    safeRequest('/api/engagement/points', { points: [] }),
  ]);

  const journals = journalPayload?.entries || [];
  const goals = goalsPayload?.goals || [];
  const memories = memoryPayload?.memories || [];
  const milestones = milestonePayload?.milestones || [];
  const points = engagementPayload?.points || [];

  const pointRowsFor = (matcher) => points.filter((row) => matcher(String(row?.activity_type || '').toLowerCase()));
  const quizRows = pointRowsFor((type) => type.includes('quiz'));
  const gameRows = pointRowsFor((type) => type.includes('game'));

  const definitions = [
    { activity_type: 'journal', activity_name: 'Shared Journals', items: journals, completion_count: journals.length, category: 'creative' },
    { activity_type: 'quiz', activity_name: 'Relationship Quizzes', items: quizRows, completion_count: quizRows.length, category: 'learning' },
    { activity_type: 'game', activity_name: 'Cooperative Games', items: gameRows, completion_count: gameRows.length, category: 'fun' },
    { activity_type: 'goal', activity_name: 'Relationship Goals', items: goals, completion_count: goals.filter((goal) => goal?.status === 'completed').length, category: 'growth' },
    { activity_type: 'memory', activity_name: 'Memory Lane', items: memories, completion_count: memories.length, category: 'memories' },
    { activity_type: 'milestone', activity_name: 'Milestones', items: milestones, completion_count: milestones.filter((item) => item?.celebration_completed).length || milestones.length, category: 'celebration' },
  ];

  return definitions.map((definition) => ({
    ...definition,
    total_time_minutes: 0,
    streak_days: consecutiveDayStreak(definition.items),
    last_activity_date: latestDate(definition.items),
    preference_rating: definition.items.length ? Math.min(5, 3 + Math.floor(definition.items.length / 5)) : 0,
  }));
}

export async function getActivityPreferences() {
  const progress = await getActivityProgress();
  const favorite_activity_types = progress
    .filter((item) => item.completion_count > 0 || item.preference_rating > 0)
    .sort((a, b) => (b.completion_count + b.preference_rating) - (a.completion_count + a.preference_rating))
    .slice(0, 3)
    .map((item) => item.category);
  return { favorite_activity_types };
}

export async function getCooperativeGameHistory() {
  const payload = await safeRequest('/api/engagement/points', { points: [] });
  return (payload?.points || [])
    .filter((row) => String(row?.activity_type || '').toLowerCase().includes('game'))
    .map((row) => ({
      id: row.id,
      score: Number(row.points_earned || row.points || 0),
      duration_minutes: 0,
      created_at: row.created_at,
      activity_type: row.activity_type,
    }));
}

export default { getActivityProgress, getActivityPreferences, getCooperativeGameHistory };
