-- ONE2ONELOVE GAME INVITES -- PRELAUNCH ONLY.
-- NOT RUN. Do not apply to production before owner authorization.
-- Mirrors ensureInviteSchema in worker/invites.ts.
CREATE TABLE IF NOT EXISTS public.o2ol_invite_codes (
 user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
 code text NOT NULL UNIQUE CHECK (code ~ '^[A-HJ-NP-Z2-9]{6,8}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 disabled_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.o2ol_invite_events (
 id bigserial PRIMARY KEY,
 inviter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
 code text,
 game text,
 surface text NOT NULL,
 channel text,
 event text NOT NULL CHECK(event IN ('share_opened','share_channel','landing_view','play_click','signup_click')),
 visitor_id text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS o2ol_invite_events_inviter_idx ON public.o2ol_invite_events(inviter_id,created_at DESC);
CREATE INDEX IF NOT EXISTS o2ol_invite_events_game_idx ON public.o2ol_invite_events(game,created_at DESC);
CREATE TABLE IF NOT EXISTS public.o2ol_referrals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 inviter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
 invitee_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
 code text,
 game text,
 source text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','qualified','rejected')),
 reject_reason text,
 landed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 qualified_at timestamptz,
 reward_status text NOT NULL DEFAULT 'none' CHECK(reward_status IN ('none','granted','failed'))
);
CREATE INDEX IF NOT EXISTS o2ol_referrals_inviter_idx ON public.o2ol_referrals(inviter_id,created_at DESC);
