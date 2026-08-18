import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const files = {
  router: 'src/pages/index.jsx',
  invite: 'src/pages/InviteRelaunch.jsx',
  unavailable: 'src/pages/RelaunchUnavailable.jsx',
};

for (const file of Object.values(files)) check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');

const router = exists(files.router) ? read(files.router) : '';
const invite = exists(files.invite) ? read(files.invite) : '';
const unavailable = exists(files.unavailable) ? read(files.unavailable) : '';

check(
  'Invite route uses truthful relaunch flow',
  router.includes('import Invite from "./InviteRelaunch"') && router.includes('["/Invite", Invite]'),
  'The old fake-send invite page must not be the public route.'
);
check(
  'Invite no longer uses retired lovenotes.app URL',
  !invite.includes('lovenotes.app') && invite.includes("`${window.location.origin}/SignUp`"),
  'Invite links should follow the actual deployed One2OneLove origin and signup route.'
);
check(
  'Invite does not fake server email delivery',
  !invite.includes('Invitation sent')
    && !invite.includes('Invitation sent to')
    && invite.includes('mailto:?subject=')
    && invite.includes('does not claim that an invitation was delivered'),
  'Email invite should open the member composer unless a real delivery backend is later built.'
);
check(
  'Invite does not fake SMS delivery',
  invite.includes('sms:?body=')
    && invite.includes('open your device composer')
    && !invite.includes('toast.success(\'Opening text message'),
  'Device SMS handoff must be described as a composer action, not a delivered message.'
);
check(
  'Invite has a real share/copy fallback',
  invite.includes('navigator?.share')
    && invite.includes('navigator.clipboard.writeText')
    && invite.includes('safeWriteClipboard'),
  'Share should use the platform share sheet or a truthful clipboard fallback.'
);
check(
  'Invite makes no referral reward promise',
  invite.includes('No referral contest or reward is being promised')
    && !invite.includes('Earn rewards for every friend')
    && !invite.includes('Share the love and earn rewards'),
  'Referral rewards require an actual program, attribution rules and terms before public claims.'
);
check(
  'legacy contest and developer URLs are fenced off',
  router.includes('["/WinACruise", RelaunchUnavailable]')
    && router.includes('["/Developer", RelaunchUnavailable]')
    && unavailable.includes('not part of the current relaunch'),
  'Old contest/developer pages must not be reachable merely by guessing their URLs.'
);

console.log('\nOne2OneLove relaunch acquisition check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
