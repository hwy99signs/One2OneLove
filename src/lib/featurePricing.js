// One2OneLove feature list (owner decision, 2026-11-25): the platform is
// 100% FREE. Every feature that remains is free for everyone — no signup, no
// card, no Credit. Features that cost money per use (AI replies, AI content
// generation, AI reports, SMS sending) were retired and are not listed here.
// The historical export names are kept so existing imports keep working;
// every price is now FREE / 0.
export const FEATURE_PRICING = [
  { code:'free_core', category:'Free social core', feature:'Account / Membership Access', free:'Create and maintain an O2OL account if you want one. No account is required to use the site, and there is no subscription.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'profile_photos', category:'Free social core', feature:'Profile Photos', free:'Upload and use profile photos.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'chat_presence', category:'Free social core', feature:'Chat Presence', free:'Online/presence indicators and normal chat presence.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'community_chat', category:'Free social core', feature:'Chat Rooms & Community Chat', free:'Participate as a guest with a display name, or as a member. Subject to safety rules.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'communities', category:'Free social core', feature:'Communities', free:'Browse, join and participate in communities.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'buddies', category:'Free social core', feature:'Buddies', free:'Maintain buddy connections.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'love_language_report', category:'Assessments & reports', feature:'Love Language Quiz / Assessment', free:'Take the full quiz and receive your primary result plus the detailed personalized interpretation, strengths, blind spots, relationship tips and communication guidance.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'relationship_pattern_report', category:'Assessments & reports', feature:'Personality / Relationship Pattern Assessment', free:'Complete the assessment and receive the full personalized relationship-pattern report.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'premium_report', category:'Assessments & reports', feature:'Other Reports', free:'Full result or report tied to the underlying feature.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'report_export', category:'Assessments & reports', feature:'Report Download / Export', free:'Download or export your reports.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'love_note_template_unlock', category:'Love Notes', feature:'Love Note - Library Template Reveal', free:'Browse all Love Note titles and read the full text of every note, including translations.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'love_note_custom', category:'Love Notes', feature:'Love Note - User-Written / Custom Text', free:'Write, edit and save your own Love Note.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'love_note_schedule', category:'Love Notes', feature:'Love Note - Scheduled Send', free:'Schedule a Love Note for a future date/time inside One2OneLove.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'sms_notification', category:'Love Notes', feature:'Notifications / Reminders', free:'In-app and email notifications/reminders.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'memories_unlock', category:'Features', feature:'Memories & Memory Photos', free:'Full access. New memories are not individually charged.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'journals_unlock', category:'Features', feature:'Journals', free:'Full access. Entries are not individually charged.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'milestones_unlock', category:'Features', feature:'Milestones', free:'Full access. Milestones are not individually charged.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'goals_unlock', category:'Features', feature:'Goals Tracker', free:'Full access. Goals are not individually charged.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'calendar_unlock', category:'Features', feature:'Calendar Events', free:'Full access. Events are not individually charged.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'date_idea_unlock', category:'Content', feature:'Date Ideas', free:'Every Date Idea in the library is fully available, plus your own custom ideas.', paid:'None.', priceLabel:'FREE', cents:0 },
  { code:'studio_episode_unlock', category:'Free media', feature:'O2OL Studio Episodes', free:'Both published Studio videos: watch anytime, without an account.', paid:'None. Both videos are permanently free.', priceLabel:'FREE FOREVER', cents:0 },
  { code:'podcast_episode_unlock', category:'Free media', feature:'Podcast Episodes', free:'All curated episodes are free to listen to, without signup. Audio remains with its original publisher.', paid:'None. All curated podcast episodes are permanently free.', priceLabel:'FREE FOREVER', cents:0 },
  { code:'like_minded_session', category:'Games', feature:'Like Minded Game', free:'Entire game — permanently FREE for everyone.', paid:'None. All current and future games stay free forever.', priceLabel:'FREE FOREVER', cents:0 },
  { code:'scratch_game_session', category:'Games', feature:'LOVE SCRATCH GAME', free:'Entire game — permanently FREE for everyone.', paid:'None. All current and future games stay free forever.', priceLabel:'FREE FOREVER', cents:0 },
  { code:'premium_game_session', category:'Games', feature:'Other O2OL Games', free:'Entire game — permanently FREE for everyone.', paid:'None. All current and future games stay free forever.', priceLabel:'FREE FOREVER', cents:0 },
];
export const FEATURE_PRICE_BY_CODE = Object.fromEntries(FEATURE_PRICING.map(row => [row.code,row]));
export function formatCreditCents(cents){ if(cents==null) return null; return '$'+(Number(cents)/100).toFixed(2); }
