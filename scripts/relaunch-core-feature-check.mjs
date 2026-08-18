import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const files = {
  datePage: 'src/pages/DateIdeas.jsx',
  dateForm: 'src/components/dateideas/CustomDateForm.jsx',
  dateService: 'src/lib/dateIdeasService.js',
  dateCatalog: 'src/lib/dateIdeasCatalog.js',
  dateMigration: 'supabase/migrations/20260818_date_ideas_hardening.sql',
  membership: 'src/lib/membershipConfig.js',
  router: 'src/pages/index.jsx',
};

for (const file of Object.values(files)) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const page = exists(files.datePage) ? read(files.datePage) : '';
const form = exists(files.dateForm) ? read(files.dateForm) : '';
const service = exists(files.dateService) ? read(files.dateService) : '';
const catalog = exists(files.dateCatalog) ? read(files.dateCatalog) : '';
const migration = exists(files.dateMigration) ? read(files.dateMigration) : '';
const membership = exists(files.membership) ? read(files.membership) : '';
const router = exists(files.router) ? read(files.router) : '';

check(
  'Date Ideas remains an approved free feature',
  membership.includes("date_ideas: 'free'") && router.includes('["/DateIdeas", DateIdeas]'),
  'Built-in Date Ideas should remain available without paid membership.'
);
check(
  'built-in Date Ideas do not depend on private database reads',
  page.includes('getBuiltInDateIdeas(language)') && !catalog.includes("from './supabase'") && !catalog.includes('supabase.'),
  'Visitors must be able to browse built-in ideas even if account persistence is unavailable.'
);
check(
  'Date Ideas catalog covers relaunch languages',
  ["en:", "es:", "fr:", "it:", "de:", "nl:"].every((token) => catalog.includes(token)),
  'Built-in content should not silently fall back to English for currently prepared relaunch languages.'
);
check(
  'Date Ideas page uses service boundary instead of direct Supabase writes',
  page.includes("from '@/lib/dateIdeasService'")
    && !page.includes("from '@/lib/supabase'")
    && !page.includes('supabase.from('),
  'Private persistence should flow through one reviewed client service.'
);
check(
  'Date Ideas service queries only real schema columns',
  service.includes("'is_favorite'")
    && service.includes("'is_completed'")
    && !service.includes("'created_by'")
    && !service.includes("'partner_email'")
    && !service.includes("'duration_hours'")
    && !service.includes("'is_public'"),
  'Legacy Base44-only fields must not return to persistence code.'
);
check(
  'custom Date Idea form submits only supported schema fields',
  form.includes('relationship_stage: formData.relationship_stage')
    && !form.includes('duration_hours')
    && !form.includes('difficulty')
    && !form.includes('is_public')
    && !form.includes('partner_email'),
  'The create form must not send columns that custom_date_ideas does not have.'
);
check(
  'Date Ideas no longer fakes partner sharing',
  !page.includes('Share2')
    && !page.includes('partnerEmail')
    && !page.includes('Shared with partner')
    && form.includes('Nothing is shared with another member automatically.'),
  'Do not claim a partner received or can access an idea until real sharing is built.'
);
check(
  'Date Ideas save/favorite/completion have real persistence semantics',
  page.includes('saveBuiltInDateIdea')
    && page.includes('{ is_favorite: !idea.is_favorite }')
    && page.includes('{ is_completed: !idea.is_completed }')
    && service.includes(".from('custom_date_ideas')"),
  'Visible persistence controls must map to actual database fields.'
);
check(
  'built-in save suppresses intentional duplicates',
  service.includes(".eq('title', title)")
    && service.includes('.limit(1).maybeSingle()')
    && service.includes('if (existing)'),
  'Repeated Save clicks should reuse/favorite the member existing copy when matched.'
);
check(
  'Date Ideas owner mutation is scoped in the client service',
  service.includes(".eq('user_id', user.id)")
    && service.includes('requireAuthenticatedUser'),
  'RLS remains authoritative, but the client should also scope own-row updates/deletes.'
);
check(
  'Date Ideas migration has restrictive owner boundaries',
  migration.includes('as restrictive')
    && migration.includes('O2OL Date Ideas owner select boundary')
    && migration.includes('O2OL Date Ideas owner update boundary')
    && migration.includes('user_id = auth.uid()'),
  'Unknown permissive legacy policies must not expose another member private Date Ideas.'
);
check(
  'Date Ideas migration derives immutable browser owner identity',
  migration.includes('new.user_id := auth.uid()')
    && migration.includes('new.user_id := old.user_id')
    && migration.includes('aaa_enforce_custom_date_idea_owner'),
  'Browser callers may not choose or transfer row ownership.'
);
check(
  'Date Ideas constraints protect new writes without scanning dirty history',
  migration.includes('o2ol_date_title_length')
    && migration.includes('o2ol_date_description_length')
    && migration.includes('o2ol_date_category_values')
    && migration.includes('not valid'),
  'New/updated rows need bounds while legacy cleanup remains controlled.'
);
check(
  'account persistence failure preserves built-in browsing',
  page.includes('myIdeasQuery.isError')
    && page.includes('sourceIdeas = view === \'explore\' ? builtIns'),
  'A private table outage must not make the free browse catalog disappear.'
);

console.log('\nOne2OneLove free-core relaunch check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
