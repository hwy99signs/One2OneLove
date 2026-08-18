import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const files = {
  dateAlias: 'src/pages/DateIdeas.jsx',
  dateBrowse: 'src/pages/DateIdeasRelaunchBrowse.jsx',
  dateForm: 'src/components/dateideas/CustomDateForm.jsx',
  dateService: 'src/lib/dateIdeasService.js',
  dateCatalog: 'src/lib/dateIdeasCatalog.js',
  dateMigration: 'supabase/migrations/20260818_date_ideas_hardening.sql',
  quizPage: 'src/pages/LoveLanguageQuizRelaunch.jsx',
  profileService: 'src/lib/profileService.js',
  usersMutation: 'supabase/migrations/20260817_users_mutation_hardening.sql',
  membership: 'src/lib/membershipConfig.js',
  router: 'src/pages/index.jsx',
};
for (const file of Object.values(files)) check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');

const alias = exists(files.dateAlias) ? read(files.dateAlias) : '';
const browse = exists(files.dateBrowse) ? read(files.dateBrowse) : '';
const form = exists(files.dateForm) ? read(files.dateForm) : '';
const service = exists(files.dateService) ? read(files.dateService) : '';
const catalog = exists(files.dateCatalog) ? read(files.dateCatalog) : '';
const migration = exists(files.dateMigration) ? read(files.dateMigration) : '';
const quiz = exists(files.quizPage) ? read(files.quizPage) : '';
const profile = exists(files.profileService) ? read(files.profileService) : '';
const usersMutation = exists(files.usersMutation) ? read(files.usersMutation) : '';
const membership = exists(files.membership) ? read(files.membership) : '';
const router = exists(files.router) ? read(files.router) : '';

check('Date Ideas remains an approved free feature', membership.includes("date_ideas: 'free'") && router.includes('["/DateIdeas", DateIdeas]'), 'Built-in Date Ideas should remain available without paid membership.');
check('public Date Ideas route is browse-only during controlled rollout', alias.includes("export { default } from './DateIdeasRelaunchBrowse'") && browse.includes('getBuiltInDateIdeas(language)'), 'The relaunch route must not perform private account reads before persistence activation.');
check('built-in Date Ideas do not depend on Supabase', !browse.includes("@/lib/dateIdeasService") && !browse.includes("@/lib/supabase") && !catalog.includes("from './supabase'") && !catalog.includes('supabase.'), 'Visitors must be able to browse ideas even when account persistence is disabled.');
check('Date Ideas catalog covers prepared relaunch languages', ["en:", "es:", "fr:", "it:", "de:", "nl:"].every((token) => catalog.includes(token)) && ["en:", "es:", "fr:", "it:", "de:", "nl:"].every((token) => browse.includes(token)), 'Prepared built-in content and interface should stay multilingual.');
check('Date Ideas page truthfully labels private tools staged', browse.includes('Private Date Idea tools are staged') && browse.includes('saving, creating, favoriting and completion tracking'), 'Preview must not imply private persistence is already active.');
check('Date Ideas persistence defaults off behind explicit flag', service.includes("VITE_DATE_IDEA_PERSISTENCE_ENABLED === 'true'") && service.includes('requirePersistenceEnabled()') && service.includes('if (!DATE_IDEA_PERSISTENCE_ENABLED) return []'), 'No authenticated preview visit should read/write live Date Idea rows before activation.');
check('Date Ideas service queries only real schema columns', service.includes("'is_favorite'") && service.includes("'is_completed'") && !service.includes("'created_by'") && !service.includes("'partner_email'") && !service.includes("'duration_hours'") && !service.includes("'is_public'"), 'Legacy Base44-only fields must not return to persistence code.');
check('custom Date Idea form remains schema-safe for later activation', form.includes('relationship_stage: formData.relationship_stage') && !form.includes('duration_hours') && !form.includes('difficulty') && !form.includes('is_public') && !form.includes('partner_email'), 'The staged form must not send unsupported columns when persistence is later enabled.');
check('Date Ideas no longer fakes partner sharing', !browse.includes('partnerEmail') && form.includes('Nothing is shared with another member automatically.'), 'Do not claim a partner received or can access an idea until real sharing exists.');
check('staged persistence remains own-user scoped', service.includes(".eq('user_id', user.id)") && service.includes('requireAuthenticatedUser') && service.includes(".from('custom_date_ideas')"), 'RLS is authoritative, and the later client path should also scope own rows.');
check('built-in later-save path suppresses intentional duplicates', service.includes(".eq('title', title)") && service.includes('.limit(1).maybeSingle()') && service.includes('if (existing)'), 'Repeated Save should reuse/favorite the member existing copy when persistence is active.');
check('Date Ideas migration has restrictive owner boundaries', migration.includes('as restrictive') && migration.includes('O2OL Date Ideas owner select boundary') && migration.includes('O2OL Date Ideas owner update boundary') && migration.includes('user_id = auth.uid()'), 'Unknown permissive legacy policies must not expose another member private Date Ideas.');
check('Date Ideas migration derives immutable browser owner identity', migration.includes('new.user_id := auth.uid()') && migration.includes('new.user_id := old.user_id') && migration.includes('aaa_enforce_custom_date_idea_owner'), 'Browser callers may not choose or transfer row ownership.');
check('Date Ideas constraints protect new writes without scanning dirty history', migration.includes('o2ol_date_title_length') && migration.includes('o2ol_date_description_length') && migration.includes('o2ol_date_category_values') && migration.includes('not valid'), 'New/updated rows need bounds while legacy cleanup remains controlled.');

check('Love Language Quiz remains an approved free feature', membership.includes("love_language_quiz: 'free'") && router.includes('import LoveLanguageQuiz from "./LoveLanguageQuizRelaunch"') && router.includes('["/LoveLanguageQuiz", LoveLanguageQuiz]'), 'The relaunch route should use the reviewed free quiz implementation.');
check('Love Language comparisons are balanced', quiz.includes("['words', 'quality']") && quiz.includes("['words', 'gifts']") && quiz.includes("['service', 'touch']") && quiz.includes('const PAIRS = ['), 'Each of the five preference categories should be compared against every other category once.');
check('Love Language result is scored explicitly from final answers', quiz.includes('const scoreAnswers = (answers) =>') && quiz.includes('const scored = scoreAnswers(finalAnswers)') && quiz.includes('setResult(scored)'), 'Result display must not depend on React state timing from the final answer click.');
check('Love Language Quiz covers relaunch languages', ["en:", "es:", "fr:", "it:", "de:", "nl:"].every((token) => quiz.includes(token)), 'Prepared quiz UI/results should have the same language coverage as the relaunch core.');
check('Love Language sharing is a real browser action', quiz.includes('navigator.share') && quiz.includes('navigator.clipboard.writeText(text)') && quiz.includes('shareResult'), 'A visible Share Result control must actually share or copy a result.');
check('Love Language sharing does not expose private profile data', quiz.includes('t.names[result.primary]') && quiz.includes("`${window.location.origin}/LoveLanguageQuiz`") && !quiz.includes('user.email') && !quiz.includes('partner_email'), 'Share text should contain only the chosen result and public quiz link.');
check('signed-out Love Language result survives auth acquisition path', quiz.includes("sessionStorage.setItem(RESULT_STORAGE_KEY") && quiz.includes("/SignUp?returnTo=") && quiz.includes("/SignIn?returnTo=") && quiz.includes('loadPendingResult()'), 'The free-account growth CTA must not erase the quiz result that motivated signup.');
check('Love Language profile save is owner-scoped and value-limited', profile.includes('await ensureRegularUserAccess(userId)') && profile.includes('const validValues =') && profile.includes(".eq('id', userId)"), 'Profile save must allow only known values for the authenticated own account.');
check('Love Language is allowed by default-deny users mutation boundary', usersMutation.includes("'love_language'") && usersMutation.includes('enforce_users_self_service_update'), 'The staged users hardening must not accidentally block this legitimate self-service profile field.');
check('Love Language result is framed as reflection, not diagnosis', quiz.includes('informal reflection tool') && quiz.includes('not a clinical or validated assessment'), 'Do not overstate an informal preference quiz as a clinical assessment.');

console.log('\nOne2OneLove free-core relaunch check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
