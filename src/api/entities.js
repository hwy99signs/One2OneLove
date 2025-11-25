// Base44 has been removed - all entities now use Supabase
// This file is kept for backwards compatibility but exports empty stubs

const createStub = (name) => ({
  list: () => Promise.reject(new Error(`Base44 removed. ${name} now uses Supabase.`)),
  filter: () => Promise.reject(new Error(`Base44 removed. ${name} now uses Supabase.`)),
  create: () => Promise.reject(new Error(`Base44 removed. ${name} now uses Supabase.`)),
  update: () => Promise.reject(new Error(`Base44 removed. ${name} now uses Supabase.`)),
  delete: () => Promise.reject(new Error(`Base44 removed. ${name} now uses Supabase.`)),
  get: () => Promise.reject(new Error(`Base44 removed. ${name} now uses Supabase.`)),
});

export const WaitlistSignup = createStub('WaitlistSignup');
export const CoupleMembership = createStub('CoupleMembership');
export const InfluencerProfile = createStub('InfluencerProfile');
export const ProfessionalProfile = createStub('ProfessionalProfile');
export const TherapistProfile = createStub('TherapistProfile');
export const CoupleProfile = createStub('CoupleProfile');
export const Memory = createStub('Memory');
export const Milestone = createStub('Milestone');
export const ScheduledLoveNote = createStub('ScheduledLoveNote');
export const RelationshipGoal = createStub('RelationshipGoal');
export const SharedJournal = createStub('SharedJournal');
export const CooperativeGame = createStub('CooperativeGame');
export const ActivityProgress = createStub('ActivityProgress');
export const UserPreferences = createStub('UserPreferences');
export const Badge = createStub('Badge');
export const CoupleLeaderboard = createStub('CoupleLeaderboard');
export const CalendarEvent = createStub('CalendarEvent');
export const GamificationPoints = createStub('GamificationPoints');
export const PremiumReward = createStub('PremiumReward');
export const ContestParticipant = createStub('ContestParticipant');
export const ContestWinner = createStub('ContestWinner');
export const SentLoveNote = createStub('SentLoveNote');
export const CustomDateIdea = createStub('CustomDateIdea');
export const DiscussionForum = createStub('DiscussionForum');
export const ForumPost = createStub('ForumPost');
export const BuddyMatch = createStub('BuddyMatch');
export const CommunityStory = createStub('CommunityStory');

// Auth stub
export const User = {
  me: () => Promise.reject(new Error('Base44 removed. Use Supabase auth instead.')),
  updateMe: () => Promise.reject(new Error('Base44 removed. Use Supabase auth instead.')),
};