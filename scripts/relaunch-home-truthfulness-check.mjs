import fs from 'node:fs';

const file = 'src/pages/Home.jsx';
const home = fs.readFileSync(file, 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

check(
  'homepage static room is labeled as an example',
  home.includes('EXAMPLE CONVERSATION')
    && home.includes('Illustrative preview — not live activity'),
  'A static marketing mockup must never look like a current room-presence feed.'
);
check(
  'homepage does not show fake member-count avatars',
  !home.includes('["A", "M", "J", "+8"]')
    && !home.includes('People are talking now'),
  'Do not manufacture human presence or counts in the homepage mockup.'
);
check(
  'homepage example conversation uses generic participant labels',
  home.includes('previewMemberA: "Member A"')
    && home.includes('previewMemberB: "Member B"')
    && !home.includes('>Maya<')
    && !home.includes('>Daniel<'),
  'Illustrative dialogue must not resemble attributed live member activity.'
);
check(
  'homepage AI timing display is explicitly an example',
  home.includes('EXAMPLE HOST RHYTHM')
    && !home.includes('9:42 PM ·')
    && !home.includes('9:47 PM ·')
    && !home.includes('9:48 PM ·'),
  'Static AI behavior examples must not look like live room logs.'
);
check(
  'Love Note scheduling is not presented as already active',
  home.includes('Member scheduling — staged')
    && !home.includes('Make it personal, schedule it for later'),
  'Scheduling is a staged membership feature until the approved backend rollout is active.'
);
check(
  'Relationship Goals is labeled as a membership tool',
  home.includes('Membership tool: turn good intentions')
    && home.includes('key === "goals"')
    && home.includes('{t.membership}'),
  'The homepage should not imply the paid Goals tool is part of the free feature set.'
);

console.log('\nOne2OneLove homepage truthfulness check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name} — ${item.detail}`);
}
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
