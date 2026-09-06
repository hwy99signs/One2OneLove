-- One2OneLove Neon migration: chat and messaging core
-- Adapted from legacy Supabase chat schemas for Cloudflare Worker + Neon.
-- Authorization and realtime delivery are enforced by the Cloudflare API/runtime.

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message text,
  last_message_time timestamptz,
  user1_unread_count integer NOT NULL DEFAULT 0 CHECK (user1_unread_count >= 0),
  user2_unread_count integer NOT NULL DEFAULT 0 CHECK (user2_unread_count >= 0),
  user1_muted boolean NOT NULL DEFAULT false,
  user2_muted boolean NOT NULL DEFAULT false,
  user1_archived boolean NOT NULL DEFAULT false,
  user2_archived boolean NOT NULL DEFAULT false,
  user1_pinned boolean NOT NULL DEFAULT false,
  user2_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_distinct_users CHECK (user1_id <> user2_id),
  CONSTRAINT conversations_ordered_users CHECK (user1_id < user2_id),
  CONSTRAINT conversations_unique_pair UNIQUE (user1_id, user2_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON public.conversations(last_message_time DESC NULLS LAST);
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text,
  message_type varchar(50) NOT NULL DEFAULT 'text',
  file_url text,
  file_name text,
  file_size bigint CHECK (file_size IS NULL OR file_size >= 0),
  file_type varchar(100),
  duration integer CHECK (duration IS NULL OR duration >= 0),
  location_lat numeric(10,8),
  location_lng numeric(11,8),
  location_address text,
  is_read boolean NOT NULL DEFAULT false,
  is_edited boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_distinct_users CHECK (sender_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, receiver_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at ON public.messages(delivered_at) WHERE delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at) WHERE read_at IS NOT NULL;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user1_id uuid, p_user2_id uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_conversation_id uuid;
  v_min_user_id uuid;
  v_max_user_id uuid;
BEGIN
  IF p_user1_id = p_user2_id THEN
    RAISE EXCEPTION 'cannot create a conversation with the same user';
  END IF;
  IF p_user1_id < p_user2_id THEN
    v_min_user_id := p_user1_id;
    v_max_user_id := p_user2_id;
  ELSE
    v_min_user_id := p_user2_id;
    v_max_user_id := p_user1_id;
  END IF;
  INSERT INTO public.conversations(user1_id, user2_id)
  VALUES (v_min_user_id, v_max_user_id)
  ON CONFLICT (user1_id, user2_id) DO UPDATE SET updated_at = public.conversations.updated_at
  RETURNING id INTO v_conversation_id;
  RETURN v_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_unread_count(p_conversation_id uuid, p_user_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v_unread_count integer;
  v_is_user1 boolean;
  v_is_user2 boolean;
BEGIN
  SELECT user1_id = p_user_id, user2_id = p_user_id
  INTO v_is_user1, v_is_user2
  FROM public.conversations
  WHERE id = p_conversation_id;
  IF NOT FOUND OR (NOT v_is_user1 AND NOT v_is_user2) THEN
    RAISE EXCEPTION 'user is not a participant in conversation';
  END IF;

  SELECT count(*)::integer INTO v_unread_count
  FROM public.messages
  WHERE conversation_id = p_conversation_id
    AND receiver_id = p_user_id
    AND is_deleted = false
    AND is_read = false
    AND read_at IS NULL;

  UPDATE public.conversations
  SET user1_unread_count = CASE WHEN v_is_user1 THEN v_unread_count ELSE user1_unread_count END,
      user2_unread_count = CASE WHEN v_is_user2 THEN v_unread_count ELSE user2_unread_count END
  WHERE id = p_conversation_id;
  RETURN v_unread_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_unread_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = NEW.conversation_id
      AND ((c.user1_id = NEW.sender_id AND c.user2_id = NEW.receiver_id)
        OR (c.user2_id = NEW.sender_id AND c.user1_id = NEW.receiver_id))
  ) THEN
    RAISE EXCEPTION 'message users do not match conversation participants';
  END IF;

  SELECT count(*)::integer INTO v_unread_count
  FROM public.messages
  WHERE conversation_id = NEW.conversation_id
    AND receiver_id = NEW.receiver_id
    AND is_deleted = false
    AND is_read = false
    AND read_at IS NULL;

  UPDATE public.conversations
  SET last_message = CASE WHEN NEW.message_type = 'text' THEN NEW.content ELSE COALESCE(NEW.content, '[' || NEW.message_type || ']') END,
      last_message_time = NEW.created_at,
      user1_unread_count = CASE WHEN user1_id = NEW.receiver_id THEN v_unread_count ELSE user1_unread_count END,
      user2_unread_count = CASE WHEN user2_id = NEW.receiver_id THEN v_unread_count ELSE user2_unread_count END,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS update_conversation_after_message ON public.messages;
CREATE TRIGGER update_conversation_after_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

CREATE OR REPLACE FUNCTION public.mark_message_delivered(p_message_id uuid, p_receiver_id uuid)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.messages
  SET delivered_at = COALESCE(delivered_at, now())
  WHERE id = p_message_id AND receiver_id = p_receiver_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_message_read(p_message_id uuid, p_receiver_id uuid)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  UPDATE public.messages
  SET read_at = COALESCE(read_at, now()), is_read = true
  WHERE id = p_message_id AND receiver_id = p_receiver_id
  RETURNING conversation_id INTO v_conversation_id;
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM public.recalculate_unread_count(v_conversation_id, p_receiver_id);
  RETURN true;
END;
$$;

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (length(emoji) BETWEEN 1 AND 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);

CREATE TABLE IF NOT EXISTS public.starred_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_starred_messages_user_created ON public.starred_messages(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, conversation_id)
);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_conversation ON public.pinned_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_expires ON public.pinned_messages(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.forwarded_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  new_message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  forwarded_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  forwarded_to_conversation uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_forwarded_messages_original ON public.forwarded_messages(original_message_id);
CREATE INDEX IF NOT EXISTS idx_forwarded_messages_new ON public.forwarded_messages(new_message_id);

CREATE OR REPLACE FUNCTION public.cleanup_expired_pins()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE affected integer;
BEGIN
  DELETE FROM public.pinned_messages WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_message_reactions(p_message_id uuid, p_user_id uuid)
RETURNS TABLE(emoji text, reaction_count bigint, user_reacted boolean)
LANGUAGE sql STABLE AS $$
  SELECT mr.emoji, count(*) AS reaction_count, bool_or(mr.user_id = p_user_id) AS user_reacted
  FROM public.message_reactions mr
  WHERE mr.message_id = p_message_id
  GROUP BY mr.emoji
  ORDER BY reaction_count DESC, mr.emoji;
$$;

CREATE OR REPLACE FUNCTION public.is_message_starred(p_message_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS(SELECT 1 FROM public.starred_messages WHERE message_id=p_message_id AND user_id=p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_message_pinned(p_message_id uuid, p_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS(SELECT 1 FROM public.pinned_messages
    WHERE message_id=p_message_id AND conversation_id=p_conversation_id
      AND (expires_at IS NULL OR expires_at > now()));
$$;

INSERT INTO public.app_migrations(migration_key, notes)
VALUES ('20260905_chat_core', 'Chat conversations, messages, status tracking, reactions, stars, pins, forwarding adapted for Neon/Cloudflare')
ON CONFLICT (migration_key) DO NOTHING;
