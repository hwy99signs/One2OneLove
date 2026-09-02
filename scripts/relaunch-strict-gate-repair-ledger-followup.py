from pathlib import Path


def replace_exact(path, old, new, expected=1):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(f'{path}: expected {expected} match(es), found {count}: {old!r}')
    p.write_text(text.replace(old, new))


path = 'scripts/relaunch-approval-ledger-check.mjs'
replace_exact(
    path,
    "'Stripe membership billing reconciliation and production cutover',",
    "'Relaunch membership billing / Stripe cutover',",
)
replace_exact(
    path,
    "if (!batch2.includes('Bulk approval is retired')) failures.push('Batch 002 must keep the obsolete bulk-approval path retired.');",
    "if (!batch2.includes('SUPERSEDED — DO NOT EXECUTE AS A BULK BATCH')) failures.push('Batch 002 must keep the obsolete bulk-approval path retired.');",
)
replace_exact(
    path,
    "if (!batch2.includes('one production checkpoint at a time')) failures.push('Batch 002 must preserve one-at-a-time production approval governance.');",
    "if (!batch2.includes('approvals **one at a time**')) failures.push('Batch 002 must preserve one-at-a-time production approval governance.');",
)

# The AI Host cache assertion must not reference hostFunction before that source is loaded.
# Dedicated host-function assertions immediately below already verify the cost-guard behavior.
path = 'scripts/relaunch-safety-check.mjs'
replace_exact(
    path,
    "check('AI Host cache is generation-bucket cost guarded', hostMigration.includes('live_room_host_prompt_cache_bucket_uidx') && hostMigration.includes('(room_slug, language, reason, bucket_start)') && hostFunction.includes('lookup intentionally ignores context_hash'), 'One generation slot per room/language/reason/time bucket prevents context-churn spend amplification.');",
    "check('AI Host cache is generation-bucket cost guarded', hostMigration.includes('live_room_host_prompt_cache_bucket_uidx') && hostMigration.includes('(room_slug, language, reason, bucket_start)'), 'One generation slot per room/language/reason/time bucket prevents context-churn spend amplification.');",
)

# The canonical final migration intentionally mentions historical email columns while
# dropping them. Validate only the actual presence view projection, not the entire file.
replace_exact(
    path,
    "check('presence projection excludes email', !/\\bemail\\b\\s*,/i.test(presenceMigration.replace(/--.*$/gm, '')), 'Presence projection should not expose member email.');",
    "const presenceViewProjection = presenceMigration.match(/create view public\\.user_presence_view[\\s\\S]*?from public\\.user_presence up[\\s\\S]*?;/i)?.[0] || '';\ncheck('presence projection excludes email', Boolean(presenceViewProjection) && !/\\bemail\\b/i.test(presenceViewProjection), 'Presence projection should exist and must not expose member email.');",
)
