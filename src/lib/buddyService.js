import { buddyApi } from './buddyApi';

/**
 * Buddy/Friend System Service
 * Existing signatures are kept for compatibility; authorization is now based
 * on the signed-in Neon Auth session at the Worker, not caller-supplied IDs.
 */

export const getAllUsers = async (_currentUserId, options = {}) => {
  try { return await buddyApi.users(options); }
  catch (error) { console.error('Error fetching users:', error); throw new Error(error.message || 'Unable to fetch users'); }
};

export const searchUsers = async (_currentUserId, searchQuery) => {
  try { return await buddyApi.users({ search: searchQuery, userType: 'regular', sortBy: 'name', sortOrder: 'asc', limit: 100 }); }
  catch (error) { console.error('Error searching users:', error); throw new Error(error.message || 'Unable to search users'); }
};

export const getUserProfile = async (userId) => {
  try { return await buddyApi.user(userId); }
  catch (error) { console.error('Error fetching user profile:', error); throw new Error(error.message || 'Unable to fetch user profile'); }
};

export const sendBuddyRequest = async (_fromUserId, toUserId) => {
  try { return await buddyApi.send(toUserId); }
  catch (error) { console.error('Error sending buddy request:', error); throw new Error(error.message || 'Unable to send buddy request'); }
};

export const cancelBuddyRequest = async (requestId, _userId) => {
  try { await buddyApi.cancel(requestId); }
  catch (error) { console.error('Error cancelling buddy request:', error); throw new Error(error.message || 'Unable to cancel buddy request'); }
};

export const getSentBuddyRequests = async (_userId) => {
  try { return await buddyApi.requests('sent'); }
  catch (error) { console.error('Error fetching sent requests:', error); throw new Error(error.message || 'Unable to fetch sent requests'); }
};

export const getReceivedBuddyRequests = async (_userId) => {
  try { return await buddyApi.requests('received'); }
  catch (error) { console.error('Error fetching received requests:', error); throw new Error(error.message || 'Unable to fetch received requests'); }
};

export const acceptBuddyRequest = async (requestId, _userId) => {
  try { return await buddyApi.respond(requestId, 'accept'); }
  catch (error) { console.error('Error accepting buddy request:', error); throw new Error(error.message || 'Unable to accept buddy request'); }
};

export const rejectBuddyRequest = async (requestId, _userId) => {
  try { await buddyApi.respond(requestId, 'reject'); }
  catch (error) { console.error('Error rejecting buddy request:', error); throw new Error(error.message || 'Unable to reject buddy request'); }
};

export const getMyBuddies = async (_userId) => {
  try { return await buddyApi.mine(); }
  catch (error) { console.error('Error fetching buddies:', error); throw new Error(error.message || 'Unable to fetch buddies'); }
};
