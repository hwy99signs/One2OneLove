# One2OneLove Relaunch — Approval Batch 001

Status: **APPROVED**

Owner approval received on **2026-08-18**.

Approved instruction:

> Approve One2OneLove Approval Batch 001 with the recommended free-account/membership structure and no separate free trial.

## Approved product direction

- Keep a free-account acquisition path for secure Love Note reveal/reply, core Live Community participation, and selected engagement tools.
- Paid membership will unlock the approved premium AI/couple/retention feature set once the final entitlement map is completed and tested.
- No separate free trial is added on top of the approved introductory membership pricing.
- Approved launch pricing remains **$1.99/month for the first 6 months, then $5.99/month ongoing unless canceled**.

## Execution boundaries that remain in force

- Execute Batch 001 in dependency order and stop on a failed prerequisite.
- Production/default-branch release remains a separate later approval.
- Public launch remains a separate later approval.
- Paid SMS/Twilio/A2P activation remains excluded.
- Live Stripe billing remains OFF until the controlled Stripe test sequence passes and a later live-billing checkpoint is explicitly approved.
- Do not replace an existing production secret until its current use is verified.
- Do not purchase a Vercel/hosting upgrade under this batch.
- Do not irreversibly delete live user data under this batch.

## Current execution note

At the moment approval was received, the Supabase connector returned an upstream availability failure before the first production read/write could complete. No production database migration, Edge Function deployment, secret change, live payment activation, or production branch merge occurred as a result of that failed attempt. GitHub-side preparation and test hardening may continue while Supabase is unavailable.
