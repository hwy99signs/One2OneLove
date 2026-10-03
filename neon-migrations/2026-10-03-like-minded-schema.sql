-- One2OneLove / Like Minded production schema.
-- Additive and idempotent. Apply deliberately before Production Worker promotion.
-- The runtime ensureSchema fallback remains in place for resilience.

CREATE TABLE IF NOT EXISTS public.like_minded_rooms(
  id uuid PRIMARY KEY,
  code varchar(12) UNIQUE NOT NULL,
  host_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  guest_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  invited_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category varchar(80) NOT NULL DEFAULT 'Relationship Goals',
  depth varchar(12) NOT NULL DEFAULT 'Real',
  host_language varchar(8) NOT NULL DEFAULT 'en',
  guest_language varchar(8),
  status varchar(20) NOT NULL DEFAULT 'waiting',
  set_number int NOT NULL DEFAULT 1,
  current_question_no int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.like_minded_answers(
  room_id uuid NOT NULL REFERENCES public.like_minded_rooms(id) ON DELETE CASCADE,
  set_number int NOT NULL,
  question_no int NOT NULL,
  question_id varchar(180) NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  answer_id int NOT NULL CHECK(answer_id BETWEEN 0 AND 3),
  locked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(room_id,set_number,question_no,user_id)
);

CREATE TABLE IF NOT EXISTS public.like_minded_player_settings(
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  available boolean NOT NULL DEFAULT false,
  in_lobby boolean NOT NULL DEFAULT false,
  city varchar(120),
  state_region varchar(120),
  country varchar(120),
  language varchar(8) NOT NULL DEFAULT 'en',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.like_minded_blocks(
  blocker_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(blocker_user_id,blocked_user_id)
);

CREATE TABLE IF NOT EXISTS public.like_minded_reports(
  id uuid PRIMARY KEY,
  reporting_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.like_minded_rooms(id) ON DELETE SET NULL,
  context text,
  status varchar(20) NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_like_minded_rooms_code
  ON public.like_minded_rooms(code);
CREATE INDEX IF NOT EXISTS idx_like_minded_lobby
  ON public.like_minded_player_settings(available,in_lobby,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_like_minded_answers_room
  ON public.like_minded_answers(room_id,set_number,question_no);
