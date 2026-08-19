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

const requireText = (content, text, label) => {
  if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`);
};

const rejectText = (content, text, label) => {
  if (content.includes(text)) failures.push(`Unsafe ${label}: ${text}`);
};

const page = read('src/pages/LoveNotes.jsx');
const card = read('src/components/love-notes/LoveNoteCard.jsx');
const service = read('src/lib/loveNotesService.js');
const sql = read('supabase-mutual-love-note-delivery.sql');
const coupleService = read('src/lib/coupleProfileService.js');

for (const language of languages) {
  requireText(page, `${language}:`, `${language} Love Notes translation`);
  requireText(card, `${language}:`, `${language} Love Note card translation`);
}

requireText(page, 'getMutualPartnerDirectoryProfile', 'mutual partner directory resolution');
requireText(page, 'sendLoveNoteToMutualPartner', 'server-side Love Note delivery');
requireText(page, "['all', t.all]", 'sent/received filtering');
rejectText(page, 'recipient_email', 'browser recipient email control');
rejectText(page, ".from('users')", 'private account lookup');
rejectText(page, '.insert(', 'direct browser Love Note insert');
rejectText(page, 'console.log', 'Love Notes debug logging');

requireText(service, "supabase.rpc('send_love_note_to_mutual_partner'", 'mutual delivery RPC');
requireText(service, "supabase.rpc('mark_received_love_note_read'", 'recipient read RPC');
requireText(service, 'LOVE_NOTE_FIELDS', 'explicit Love Note columns');
rejectText(service, 'recipient_email', 'client-managed recipient email');
rejectText(service, ".from('users')", 'private account lookup in service');

requireText(coupleService, "supabase.rpc('get_mutual_partner_directory_profile')", 'shared mutual partner identity model');

requireText(sql, 'recipient_user_id uuid', 'recipient user identity column');
requireText(sql, 'recipients can read delivered love notes', 'recipient read RLS');
requireText(sql, 'lower(partner.partner_email) = lower(u.email)', 'reciprocal partner validation');
requireText(sql, 'revoke insert, update on table public.love_notes from authenticated', 'RPC-only browser delivery writes');
requireText(sql, 'send_love_note_to_mutual_partner', 'send RPC definition');
requireText(sql, 'mark_received_love_note_read', 'read RPC definition');
requireText(sql, 'revoke execute on function public.send_love_note_to_mutual_partner', 'anonymous send denial');
requireText(sql, 'grant execute on function public.send_love_note_to_mutual_partner', 'authenticated send grant');
requireText(sql, 'revoke execute on function public.mark_received_love_note_read', 'anonymous read-state denial');
requireText(sql, 'grant execute on function public.mark_received_love_note_read', 'authenticated read-state grant');

if (failures.length) {
  console.error('\nO2OL Love Notes verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('O2OL Love Notes verification passed.');
