# O2OL Dependency Remediation Status

Updated: 2026-08-19

## Completed safe remediation

Commit `a8cd4e6b59a648b33993e70c92ef786eee7e3230` was generated only after the one-time dependency remediation guard completed successfully.

The remediation used `npm audit fix` **without `--force`** and enforced these constraints before committing:

- PostCSS remained on major version 8.
- React Router DOM remained on major version 7.
- Vite remained on major version 6.
- No production critical vulnerability could remain.
- Direct production findings for `postcss` and `react-router-dom` had to be cleared.
- The production vulnerability total had to improve from the previous count of 8.
- The full dependency-tree vulnerability total had to improve from the previous count of 19.
- O2OL security verification had to pass.
- O2OL launch verification had to pass.
- Love Notes, Shared Journals, and Quiz privacy verifiers had to pass.
- The production application build had to pass.

The one-time remediation workflow deleted itself after the guarded commit. Permanent dependency auditing remains read-only and PR-visible.

## Validation sequence

The automation-authored remediation commit caused GitHub to mark its PR-triggered workflow records as `action_required` without creating jobs. This document commit intentionally advances the branch normally so the full permanent O2OL CI suite runs again against the exact remediated lockfile.

Do not treat the dependency remediation as the new fully validated launch checkpoint until those permanent suites complete successfully.

## Continuing policy

- Never use `npm audit fix --force` automatically.
- Prefer same-major and semver-compatible security fixes first.
- Keep production and full-tree audits separate.
- Trace transitive findings to their parent packages before considering overrides or breaking upgrades.
- Require production build and O2OL privacy/security gates after dependency changes.
