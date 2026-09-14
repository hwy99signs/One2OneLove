import { apiRequest } from './apiClient';

export async function getEngagementPoints() {
  const payload = await apiRequest('/api/engagement/points');
  return payload?.points || [];
}

export async function getEngagementSummary() {
  const payload = await apiRequest('/api/engagement/points');
  return {
    points: payload?.points || [],
    totalPoints: Number(payload?.total_points || 0),
    activityCount: Number(payload?.activity_count || 0),
    level: Number(payload?.level || 1),
  };
}

export async function getEngagementBadges() {
  const payload = await apiRequest('/api/engagement/badges');
  return payload?.badges || [];
}

export async function getContestLeaderboard(type, period, limit = 5) {
  const params = new URLSearchParams({ type, period, limit: String(limit) });
  const payload = await apiRequest(`/api/contests/leaderboard?${params}`);
  return payload?.participants || [];
}

export async function getContestWinner(type, period) {
  const params = new URLSearchParams({ type, period });
  const payload = await apiRequest(`/api/contests/winner?${params}`);
  return payload?.winner || null;
}

export async function getMyContestRank(type, period) {
  const params = new URLSearchParams({ type, period });
  const payload = await apiRequest(`/api/contests/my-rank?${params}`);
  return payload?.participant || null;
}

export async function joinContest(type, period) {
  const payload = await apiRequest('/api/contests/join', {
    method: 'POST',
    body: { type, period },
  });
  return payload?.participant || null;
}
