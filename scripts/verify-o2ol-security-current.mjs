import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) { failures.push(`Missing required file: ${file}`); return ''; }
  return fs.readFileSync(full, 'utf8');
};
const requireText = (content, text, label) => { if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`); };
const reject = (content, pattern, label) => { if (pattern.test(content)) failures.push(`Unsafe ${label}: ${pattern}`); };

const auth = read('src/contexts/AuthContext.jsx');
requireText(auth, 'supabase.auth.signInWithPassword', 'Supabase password sign-in');
requireText(auth, 'supabase.auth.signUp', 'Supabase account signup');
requireText(auth, 'supabase.auth.onAuthStateChange', 'auth-state subscription');
reject(auth, /console\.(log|debug|info|trace)/, 'auth browser diagnostics');

const accountLock = read('supabase-user-account-read-lock.sql');
requireText(accountLock, 'users can read own account row', 'self-only account read policy');
requireText(accountLock, '(select auth.uid()) = id', 'self-only account identity check');
const directory = read('supabase-user-directory-security.sql');
requireText(directory, 'user_directory_profiles', 'safe member directory');
requireText(directory, 'grant select on table public.user_directory_profiles to authenticated', 'authenticated safe directory read');

for (const file of ['src/pages/TherapistSignup.jsx', 'src/pages/ProfessionalSignup.jsx']) {
  const content = read(file);
  reject(content, /<form|<Input|<Textarea|supabase|useAuth|123456|tempPassword|register(?:Therapist|Professional)/, `inactive specialist intake in ${file}`);
}
const influencer = read('src/pages/InfluencerSignup.jsx');
requireText(influencer, '/RoomCreatorAccess', 'creator pathway');
reject(influencer, /<form|<Input|<Textarea|supabase|useAuth|registerInfluencer|123456|tempPassword/, 'legacy influencer intake');

const subscription = read('src/pages/Subscription.jsx');
reject(subscription, /redirectToCheckout|createBillingPortalSession|getPaymentHistory|19\.99|34\.99/, 'active paid membership behavior');
const payment = read('src/pages/PaymentSuccess.jsx');
requireText(payment, 'does not confirm that a payment was completed', 'non-confirming payment route');

const contactSql = read('supabase-private-contact-messages.sql');
requireText(contactSql, 'alter table public.contact_messages enable row level security', 'contact RLS');
requireText(contactSql, 'grant insert on table public.contact_messages to anon', 'anonymous contact insert only');
requireText(contactSql, 'grant insert on table public.contact_messages to authenticated', 'authenticated contact insert only');
reject(contactSql, /grant\s+(select|update|delete)/i, 'browser contact queue read/update/delete grants');
const contactPage = read('src/pages/ContactUs.jsx');
requireText(contactPage, "from('contact_messages').insert", 'real contact insert');
reject(contactPage, /\+1 \(555\)|123 Love Street|support@one2onelove\.com/, 'fabricated contact details');

const storySql = read('supabase-community-story-submission.sql');
requireText(storySql, "moderation_status", 'story moderation field');
requireText(storySql, "'pending'", 'pending story submission');
requireText(storySql, 'revoke insert, update on table public.success_stories from authenticated', 'story direct-write denial');
const storyService = read('src/lib/successStoriesService.js');
requireText(storyService, "rpc('submit_community_story'", 'story RPC submission');
reject(storyService, /\.from\('success_stories'\)[\s\S]{0,160}\.(insert|update)\(/, 'direct story mutation');

const buddy = read('src/lib/buddyService.js');
requireText(buddy, "from('user_directory_profiles')", 'safe buddy identities');
reject(buddy, /\.from\('users'\)/, 'private user reads in buddy service');
const findFriends = read('src/pages/FindFriends.jsx');
reject(findFriends, /api\.dicebear\.com|createPageUrl\('Chat'\)|MessageCircle/, 'discovery identity leak or unsolicited chat');
const chatGate = read('supabase-chat-connection-gate.sql');
requireText(chatGate, "br.status = 'accepted'", 'accepted connection chat gate');
requireText(chatGate, 'lower(trim(u1.partner_email)) = lower(trim(u2.email))', 'reciprocal partner chat gate');
requireText(chatGate, "raise exception 'A new conversation requires", 'new conversation rejection');

const chatStorage = read('supabase-chat-file-security.sql');
requireText(chatStorage, "values ('chat-files', 'chat-files', false)", 'private chat bucket');
requireText(chatStorage, 'chat participants can read referenced attachments', 'participant attachment reads');
const chatService = read('src/lib/chatService.js');
requireText(chatService, "from('user_directory_profiles')", 'safe chat identities');
reject(chatService, /\.getPublicUrl\(/, 'public chat attachment URLs');

const loveNotesSql = read('supabase-mutual-love-note-delivery.sql');
requireText(loveNotesSql, 'send_love_note_to_mutual_partner', 'mutual Love Note send RPC');
requireText(loveNotesSql, 'mark_love_note_read', 'recipient read RPC');
const journalSql = read('supabase-mutual-shared-journals.sql');
requireText(journalSql, 'shared_with_partner', 'explicit journal partner sharing');

const profileService = read('src/lib/coupleProfileService.js');
requireText(profileService, 'get_mutual_partner_directory_profile', 'mutual partner profile RPC');
reject(profileService, /\.from\('users'\)/, 'direct partner account read');

const roomModerator = read('supabase-global-room-moderation.sql');
requireText(roomModerator, 'global_room_moderators', 'trusted Room moderator registry');
const roomPrivilege = read('supabase-global-room-privilege-lockdown.sql');
requireText(roomPrivilege, 'revoke', 'Global Room privilege lockdown');

if (failures.length) {
  console.error('\nO2OL current security verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('O2OL current security verification passed.');
