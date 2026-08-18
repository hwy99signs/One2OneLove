import { spawnSync } from 'node:child_process';

const strictRequested = process.argv.includes('--strict');
const vercelEnvironment = String(process.env.VERCEL_ENV || '').toLowerCase();
const strictFromEnvironment = String(process.env.RELAUNCH_STRICT_CHECKS || '').toLowerCase() === 'true';
const strict = strictRequested || strictFromEnvironment || vercelEnvironment === 'production';

const checks = [
  ['relaunch safety', 'scripts/relaunch-safety-check.mjs'],
  ['relaunch security', 'scripts/relaunch-security-check.mjs'],
  ['relaunch private features', 'scripts/relaunch-private-feature-check.mjs'],
  ['relaunch premium AI', 'scripts/relaunch-ai-feature-check.mjs'],
  ['relaunch free core', 'scripts/relaunch-core-feature-check.mjs'],
  ['relaunch premium data', 'scripts/relaunch-premium-data-check.mjs'],
  ['relaunch premium routes', 'scripts/relaunch-premium-route-check.mjs'],
  ['relaunch profile/navigation', 'scripts/relaunch-profile-navigation-check.mjs'],
  ['relaunch acquisition', 'scripts/relaunch-acquisition-check.mjs'],
  ['relaunch route safety', 'scripts/relaunch-route-safety-check.mjs'],
  ['relaunch homepage truthfulness', 'scripts/relaunch-home-truthfulness-check.mjs'],
  ['relaunch relationship support', 'scripts/relaunch-support-safety-check.mjs'],
  ['relaunch legal readiness', 'scripts/relaunch-legal-readiness-check.mjs'],
];

console.log(`\nOne2OneLove relaunch build checks — ${strict ? 'STRICT' : 'PREVIEW/ADVISORY'} mode`);
if (!strict) {
  console.log('Policy/preflight blockers are reported but do not hide actual Vite compile results in development previews.');
  console.log('Production builds and `npm run relaunch:preflight` remain strict.\n');
}

const failures = [];

for (const [label, file] of checks) {
  const result = spawnSync(process.execPath, [file], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error) {
    failures.push({ label, detail: result.error.message || 'Unable to run check' });
    console.error(`❌ ${label} could not run.`);
    continue;
  }

  if (result.status !== 0) {
    failures.push({ label, detail: `exit ${result.status ?? 'unknown'}` });
    console.error(`❌ ${label} reported blockers.`);
  } else {
    console.log(`✅ ${label} passed.`);
  }
}

if (failures.length === 0) {
  console.log('\n✅ Relaunch policy checks passed. Continuing to application build.\n');
  process.exit(0);
}

if (strict) {
  console.error(`\n⛔ ${failures.length} relaunch check group(s) failed in STRICT mode. Application build is blocked.\n`);
  process.exit(1);
}

console.warn(`\n⚠️ ${failures.length} relaunch check group(s) still contain preflight blockers.`);
console.warn('Preview build will continue so compile/runtime UI work can be tested; these blockers remain mandatory before production.\n');
process.exit(0);
