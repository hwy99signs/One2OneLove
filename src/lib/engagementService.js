import { apiRequest, ONE2ONE_API_BASE } from './one2oneApi';

async function parseRawResponse(response) {
  const type = response.headers.get('content-type') || '';
  const payload = type.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = payload?.error?.code || null;
    throw error;
  }
  return payload;
}

export async function getPoints() {
  const data = await apiRequest('/api/engagement/points');
  return data?.points || [];
}

export async function getPointSummary() {
  const data = await apiRequest('/api/engagement/points');
  return {
    points: data?.points || [],
    totalPoints: Number(data?.total_points || 0),
    activityCount: Number(data?.activity_count || 0),
    level: Number(data?.level || 1),
  };
}

export async function getBadges() {
  const data = await apiRequest('/api/engagement/badges');
  return data?.badges || [];
}

export async function getMemories() {
  const data = await apiRequest('/api/engagement/memories');
  return data?.memories || [];
}

export async function createMemory(memoryData) {
  const data = await apiRequest('/api/engagement/memories', { method: 'POST', body: memoryData });
  return data?.memory || null;
}

export async function updateMemory(id, memoryData) {
  const data = await apiRequest(`/api/engagement/memories/${id}`, { method: 'PATCH', body: memoryData });
  return data?.memory || null;
}

export async function deleteMemory(id) {
  await apiRequest(`/api/engagement/memories/${id}`, { method: 'DELETE' });
}

export async function uploadMemoryMedia(file) {
  if (!file) throw new Error('A file is required.');
  const params = new URLSearchParams({ file_name: file.name || 'memory-media' });
  const response = await fetch(`${ONE2ONE_API_BASE}/api/engagement/memory-media?${params.toString()}`, {
    method: 'PUT',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    body: file,
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await parseRawResponse(response);
  const path = data?.media_url || null;
  if (!path) return null;
  return path.startsWith('http') ? path : `${ONE2ONE_API_BASE}${path}`;
}

export async function deleteMemoryMedia(url) {
  await apiRequest('/api/engagement/memory-media', { method: 'DELETE', body: { url } });
}

export async function getCustomDateIdeas({ favorite = false } = {}) {
  const data = await apiRequest(`/api/engagement/date-ideas${favorite ? '?favorite=true' : ''}`);
  return data?.date_ideas || [];
}

export async function createCustomDateIdea(payload) {
  const data = await apiRequest('/api/engagement/date-ideas', { method: 'POST', body: payload });
  return data?.date_idea || null;
}

export async function updateCustomDateIdea(id, payload) {
  const data = await apiRequest(`/api/engagement/date-ideas/${id}`, { method: 'PATCH', body: payload });
  return data?.date_idea || null;
}

export async function deleteCustomDateIdea(id) {
  await apiRequest(`/api/engagement/date-ideas/${id}`, { method: 'DELETE' });
}

export async function joinWaitlist(email, country) {
  const data = await apiRequest('/api/engagement/waitlist', { method: 'POST', body: { email, country } });
  return data?.signup || null;
}

export async function getContestLeaderboard(type, period, limit = 5) {
  const params = new URLSearchParams({ type, period, limit: String(limit) });
  const data = await apiRequest(`/api/engagement/contests/leaderboard?${params.toString()}`);
  return data?.participants || [];
}

export async function getContestWinner(type, period) {
  const params = new URLSearchParams({ type, period });
  const data = await apiRequest(`/api/engagement/contests/winner?${params.toString()}`);
  return data?.winner || null;
}

export async function getMyContestEntry(type, period) {
  const params = new URLSearchParams({ type, period });
  const data = await apiRequest(`/api/engagement/contests/me?${params.toString()}`);
  return data?.participant || null;
}

export async function joinContest(type, period) {
  const data = await apiRequest('/api/engagement/contests/join', { method: 'POST', body: { type, period } });
  return data?.participant || null;
}

export default {
  getPoints,
  getPointSummary,
  getBadges,
  getMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  uploadMemoryMedia,
  deleteMemoryMedia,
  getCustomDateIdeas,
  createCustomDateIdea,
  updateCustomDateIdea,
  deleteCustomDateIdea,
  joinWaitlist,
  getContestLeaderboard,
  getContestWinner,
  getMyContestEntry,
  joinContest,
};
