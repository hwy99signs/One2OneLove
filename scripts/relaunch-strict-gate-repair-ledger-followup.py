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
