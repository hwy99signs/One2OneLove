# One2OneLove Worker API

The Worker is the security boundary between the React client and the new Neon/R2 infrastructure.

## Migration contract

Do not expose database credentials to `VITE_*` environment variables or browser code.

The Worker must:

- validate the Neon Auth session for protected endpoints;
- derive the acting user ID from the validated session, never from a trusted client-supplied `user_id` alone;
- enforce ownership/authorization for profiles, Love Notes, chat, journals, goals, milestones, community moderation, and subscription data;
- query Neon through the `HYPERDRIVE` binding;
- access media through the `MEDIA` R2 binding;
- preserve the app's existing five-language user experience;
- avoid embedding user-facing English copy that bypasses the existing translation framework.

## Initial API surface

Planned compatibility routes:

- `/api/health`
- `/api/me`
- `/api/profile`
- `/api/love-notes/sent`
- `/api/love-notes/scheduled`
- `/api/media/*`
- `/api/chat/*`
- `/api/community/*`
- `/api/calendar/*`
- `/api/goals/*`
- `/api/milestones/*`
- `/api/journals/*`
- `/api/subscriptions/*`
- `/api/stripe/*`

The migration should replace direct `supabase.from(...)` calls service-by-service rather than changing all pages at once.
