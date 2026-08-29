# O2OL Dependency Remediation Status

Updated: 2026-08-19

## Current locked-tree status

The O2OL dependency remediation sequence is now clean at the configured audit threshold.

- **Production dependencies:** 0 vulnerabilities at `npm audit --omit=dev --audit-level=low`.
- **Full dependency tree:** 0 vulnerabilities at `npm audit --audit-level=low` after removal of the unused `@flydotio/dockerfile` development helper.
- The final two low-severity findings were transitive through `@flydotio/dockerfile -> diff`; repository search found no O2OL application use of the Fly helper, so removal was safer than forcing or downgrading unrelated runtime packages.
- The removal guard required an updated lockfile to pass `npm ci`, production audit, full-tree audit, and `npm run build` before it could commit.

## Safe remediation completed

Earlier remediation used `npm audit fix` **without `--force`** and preserved the application’s existing major-version boundaries. It cleared the prior production findings while keeping PostCSS on major 8, React Router DOM on major 7, and Vite on major 6.

The later cleanup removed the unused Fly Dockerfile dev helper rather than accepting npm’s suggested downgrade path. This eliminated the remaining dev-only `diff` advisory from the locked tree.

## Permanent policy

- Never use `npm audit fix --force` automatically.
- Keep production and full-tree audits separate and PR-visible.
- Trace transitive findings to their direct parent package before changing versions.
- Prefer removal of unused dependencies over adding overrides or breaking upgrades.
- Require `npm ci`, production build, and O2OL privacy/security gates after dependency changes.
- Re-open remediation only when a future dependency audit reports a new finding.
