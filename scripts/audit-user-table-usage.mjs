import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'src');
const findings = [];
const failures = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!/\.(js|jsx|ts|tsx)$/.test(entry.name)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\.from\(\s*['"]users['"]\s*\)/.test(line)) {
        findings.push({
          file: path.relative(process.cwd(), fullPath),
          line: index + 1,
          text: line.trim(),
        });
      }
    });
  }
}

function read(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing required privacy file: ${file}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

walk(root);

console.log(`Direct public.users references found: ${findings.length}`);
for (const finding of findings) {
  console.log(`${finding.file}:${finding.line} ${finding.text}`);
}

// Existing direct users-table references are still inventoried because some are
// legitimate own-account reads/writes. Couple Profile is stricter: it must never
// read another member's private account row and must use the reciprocal-link RPC.
const coupleProfile = read('src/pages/CouplesProfile.jsx');
const coupleService = read('src/lib/coupleProfileService.js');
const coupleSql = read('supabase-mutual-couple-profile.sql');

if (/\.from\(\s*['"]users['"]\s*\)[\s\S]{0,300}\.select\(/.test(coupleProfile)) {
  failures.push('Couple Profile must not SELECT directly from public.users.');
}
if (/\.eq\(\s*['"]email['"]/.test(coupleProfile)) {
  failures.push('Couple Profile must not resolve another member by email through a browser table query.');
}
if (!coupleProfile.includes('getMutualPartnerDirectoryProfile')) {
  failures.push('Couple Profile must use the privacy-safe mutual partner service.');
}
if (!coupleService.includes("supabase.rpc('get_mutual_partner_directory_profile')")) {
  failures.push('Couple profile service must resolve partners through get_mutual_partner_directory_profile RPC.');
}
if (coupleService.includes(".from('users')") || coupleService.includes('.from("users")')) {
  failures.push('Couple profile service must not read public.users directly.');
}
if (!coupleSql.includes('lower(partner.partner_email) = lower(actor.email)')) {
  failures.push('Mutual partner RPC must enforce reciprocal partner linking.');
}
if (!coupleSql.includes('user_directory_profiles')) {
  failures.push('Mutual partner RPC must return safe directory fields rather than private account rows.');
}
if (!coupleSql.includes('revoke execute on function public.get_mutual_partner_directory_profile() from public, anon')) {
  failures.push('Mutual partner RPC must deny anonymous execution.');
}
if (!coupleSql.includes('grant execute on function public.get_mutual_partner_directory_profile() to authenticated')) {
  failures.push('Mutual partner RPC must explicitly grant authenticated execution.');
}

if (failures.length) {
  console.error('\nO2OL account privacy audit failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Couple Profile mutual-link privacy invariants passed.');
