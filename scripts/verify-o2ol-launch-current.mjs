import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const languages = ['en', 'es', 'fr', 'it', 'de'];

const read = (file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing required file: ${file}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
};
const requireText = (content, text, label) => { if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`); };
const reject = (content, pattern, label) => { if (pattern.test(content)) failures.push(`Unsafe ${label}: ${pattern}`); };
const requireLanguages = (file) => {
  const content = read(file);
  for (const language of languages) requireText(content, `${language}:`, `${language} translation in ${file}`);
  return content;
};

const router = read('src/pages/index.jsx');
for (const route of [
  '/SignIn', '/SignUp', '/ForgotPassword', '/ResetPassword', '/Profile', '/CouplesProfile',
  '/LoveNotes', '/SharedJournals', '/MemoryLane', '/RelationshipGoals', '/RelationshipMilestones',
  '/AnniversaryTracker', '/CouplesCalendar', '/DateNight', '/DateIdeas', '/DailyQuestion',
  '/MarriageMatters', '/ConversationCards', '/WeeklyCheckIn', '/RelationshipRituals',
  '/RelationshipReset', '/CommunicationPractice', '/RelationshipLibrary', '/CouplesChallenges',
  '/CoupleActivities', '/CouplesDashboard', '/Community', '/FindFriends', '/FriendRequests', '/Chat',
  '/GlobalRelationshipRoom', '/RoomCreatorAccess', '/RoomModeration', '/RoomReportQueue',
  '/RoomCancellationQueue', '/RoomOpsDashboard', '/ContactUs', '/HelpCenter', '/AboutUs'
]) requireText(router, `path="${route}"`, `route ${route}`);
requireText(router, 'path="*"', 'NotFound catch-all route');

for (const file of [
  'src/pages/Profile.jsx', 'src/pages/CouplesProfile.jsx', 'src/pages/LoveNotes.jsx',
  'src/pages/SharedJournals.jsx', 'src/pages/MemoryLane.jsx', 'src/pages/RelationshipGoals.jsx',
  'src/pages/RelationshipMilestones.jsx', 'src/pages/AnniversaryTracker.jsx', 'src/pages/CouplesCalendar.jsx',
  'src/pages/DateNight.jsx', 'src/pages/DateIdeas.jsx', 'src/pages/DailyQuestion.jsx',
  'src/pages/MarriageMatters.jsx', 'src/pages/ConversationCards.jsx', 'src/pages/WeeklyCheckIn.jsx',
  'src/pages/RelationshipRituals.jsx', 'src/pages/RelationshipReset.jsx', 'src/pages/CommunicationPractice.jsx',
  'src/pages/RelationshipLibrary.jsx', 'src/pages/CouplesChallenges.jsx', 'src/pages/CoupleActivities.jsx',
  'src/pages/CouplesDashboard.jsx', 'src/pages/Community.jsx', 'src/pages/FindFriends.jsx',
  'src/pages/FriendRequests.jsx', 'src/pages/GlobalRelationshipRoom.jsx', 'src/pages/ContactUs.jsx',
  'src/pages/HelpCenter.jsx', 'src/pages/AboutUs.jsx'
]) requireLanguages(file);

const signIn = read('src/pages/SignIn.jsx');
requireText(signIn, 'autoComplete="email"', 'sign-in email autocomplete');
requireText(signIn, 'autoComplete="current-password"', 'sign-in password autocomplete');
const signup = read('src/components/signup/RegularUserForm.jsx');
requireText(signup, 'register({', 'real regular-member signup');
requireText(signup, 'minLength={8}', 'member password minimum');
requireText(signup, 'createPageUrl("TermsOfService")', 'Terms consent link');
requireText(signup, 'createPageUrl("PrivacyPolicy")', 'Privacy consent link');
const forgot = read('src/pages/ForgotPassword.jsx');
requireText(forgot, 'resetPasswordForEmail', 'password reset email');
const reset = read('src/pages/ResetPassword.jsx');
requireText(reset, "event === 'PASSWORD_RECOVERY'", 'password recovery callback');
requireText(reset, 'updateUser({ password })', 'password update');

const influencer = requireLanguages('src/pages/InfluencerSignup.jsx');
requireText(influencer, '/RoomCreatorAccess', 'real Global Room creator pathway');
reject(influencer, /registerInfluencer|<form|<Input|<Textarea|supabase|useAuth|123456|tempPassword/, 'legacy influencer intake');
const professional = requireLanguages('src/pages/ProfessionalSignup.jsx');
reject(professional, /registerProfessional|<form|<Input|<Textarea|supabase|useAuth|123456|tempPassword/, 'launch professional intake');
const therapist = requireLanguages('src/pages/TherapistSignup.jsx');
reject(therapist, /registerTherapist|<form|<Input|<Textarea|supabase|useAuth|123456|tempPassword/, 'launch therapist intake');

const subscription = requireLanguages('src/pages/Subscription.jsx');
requireText(subscription, 'not opening paid membership checkout yet', 'paid membership deferral');
reject(subscription, /redirectToCheckout|createBillingPortalSession|19\.99|34\.99/, 'active paid checkout');
const paymentSuccess = requireLanguages('src/pages/PaymentSuccess.jsx');
requireText(paymentSuccess, 'does not confirm that a payment was completed', 'non-confirming legacy payment route');

const aiCoach = requireLanguages('src/pages/RelationshipCoach.jsx');
const aiContent = requireLanguages('src/pages/AIContentCreator.jsx');
for (const [label, content] of [['AI coach', aiCoach], ['AI content creator', aiContent]]) {
  requireText(content, 'Preview', `${label} preview state`);
  reject(content, /<Input|<Textarea|supabase|fetch\(|useMutation|useQuery|console\./, `${label} data collection`);
}

const community = requireLanguages('src/pages/Community.jsx');
requireText(community, 'Discussion Forums — Post Launch', 'forum deferral');
requireText(community, 'PostStoryForm', 'moderated story submission');
reject(community, /ForumCard|ForumPostCard|Base44|selectedForum|forumPosts/, 'dead forum shell');
const storyService = read('src/lib/successStoriesService.js');
requireText(storyService, "rpc('submit_community_story'", 'server-side story submission');
const storySql = read('supabase-community-story-submission.sql');
requireText(storySql, "'pending'", 'pending story moderation');
requireText(storySql, 'revoke insert, update on table public.success_stories from authenticated', 'story self-approval denial');

const findFriends = requireLanguages('src/pages/FindFriends.jsx');
requireText(findFriends, 'getMyBuddies', 'accepted buddy filtering');
reject(findFriends, /createPageUrl\('Chat'\)|MessageCircle|api\.dicebear\.com/, 'unsolicited discovery chat or external avatar');
const chatGate = read('supabase-chat-connection-gate.sql');
requireText(chatGate, "br.status = 'accepted'", 'accepted buddy chat gate');
requireText(chatGate, 'lower(trim(u1.partner_email)) = lower(trim(u2.email))', 'reciprocal partner chat gate');

const contact = requireLanguages('src/pages/ContactUs.jsx');
requireText(contact, "from('contact_messages').insert", 'real contact persistence');
const contactSql = read('supabase-private-contact-messages.sql');
requireText(contactSql, 'grant insert on table public.contact_messages to anon', 'anonymous contact insert');
requireText(contactSql, 'grant insert on table public.contact_messages to authenticated', 'authenticated contact insert');

const room = requireLanguages('src/pages/GlobalRelationshipRoom.jsx');
requireText(room, 'RoomScheduleViewer', 'Global Room schedule viewer');
const roomScheduleViewer = read('src/components/global-room/RoomScheduleViewer.jsx');
requireText(roomScheduleViewer, 'ProgramReportButton', 'Global Room viewer reporting');
const creator = read('src/pages/RoomCreatorAccess.jsx');
requireText(creator, 'submitGlobalRoomCancellationRequest', 'creator cancellation flow');
for (const file of ['src/pages/RoomModeration.jsx','src/pages/RoomReplayManager.jsx','src/pages/RoomProgramManager.jsx','src/pages/RoomOfficialScheduler.jsx','src/pages/RoomReportQueue.jsx','src/pages/RoomCancellationQueue.jsx','src/pages/RoomModerationAudit.jsx','src/pages/RoomOpsDashboard.jsx']) {
  requireText(read(file), 'isGlobalRoomModerator', `moderator authorization in ${file}`);
}
const roomSql = read('supabase-global-relationship-room.sql');
requireText(roomSql, 'relationship_room_no_active_overlap', 'Room overlap protection');
requireText(roomSql, 'pg_advisory_xact_lock', 'creator quota concurrency protection');

const about = requireLanguages('src/pages/AboutUs.jsx');
reject(about, /50,000\+|1M\+|10,000 Couples|Sarah Johnson|Michael Chen|Emily Rodriguez|David Kim/, 'fabricated About content');
const help = requireLanguages('src/pages/HelpCenter.jsx');
requireText(help, 'The AI Relationship Coach and AI Content Creator are previews at launch', 'accurate AI Help guidance');
reject(help, /Scheduling love notes|Get personalized relationship advice from our AI coach|Payment or subscription issues/, 'obsolete Help guidance');
const developer = read('src/pages/Developer.jsx');
requireText(developer, '<Navigate to="/" replace />', 'developer route redirect');

if (failures.length) {
  console.error('\nO2OL current launch verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('O2OL current launch verification passed.');
