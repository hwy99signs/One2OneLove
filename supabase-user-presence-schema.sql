-- =====================================================
-- USER PRESENCE SYSTEM - ONLINE/OFFLINE STATUS
-- =====================================================
-- Tracks user online/offline status and last seen
-- =====================================================

-- =====================================================
-- USER PRESENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_active ON public.user_presence(last_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Users can view everyone's presence status
CREATE POLICY "Anyone can view user presence"
ON public.user_presence
FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
ON public.user_presence
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own presence
CREATE POLICY "Users can update own presence"
ON public.user_presence
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own presence
CREATE POLICY "Users can delete own presence"
ON public.user_presence
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update user presence (online/offline)
CREATE OR REPLACE FUNCTION update_user_presence(
    p_user_id UUID,
    p_status TEXT DEFAULT 'online'
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_presence (user_id, status, last_seen, last_active, updated_at)
    VALUES (p_user_id, p_status, NOW(), NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        status = p_status,
        last_seen = NOW(),
        last_active = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark user as active (heartbeat)
CREATE OR REPLACE FUNCTION heartbeat_user_presence(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_presence (user_id, status, last_active, updated_at)
    VALUES (p_user_id, 'online', NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        status = 'online',
        last_active = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user presence status
CREATE OR REPLACE FUNCTION get_user_presence(p_user_id UUID)
RETURNS TABLE(
    user_id UUID,
    status TEXT,
    last_seen TIMESTAMPTZ,
    is_online BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.user_id,
        up.status,
        up.last_seen,
        -- Consider online if last active within 5 minutes
        (up.last_active > NOW() - INTERVAL '5 minutes' AND up.status = 'online') as is_online
    FROM public.user_presence up
    WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get online users count
CREATE OR REPLACE FUNCTION get_online_users_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.user_presence
        WHERE status = 'online'
        AND last_active > NOW() - INTERVAL '5 minutes'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all online users
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE(
    user_id UUID,
    status TEXT,
    last_seen TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.user_id,
        up.status,
        up.last_seen
    FROM public.user_presence up
    WHERE up.status = 'online'
    AND up.last_active > NOW() - INTERVAL '5 minutes'
    ORDER BY up.last_active DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically set users as offline if inactive
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
    UPDATE public.user_presence
    SET status = 'offline'
    WHERE status = 'online'
    AND last_active < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TO UPDATE TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_presence_timestamp
    BEFORE UPDATE ON public.user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence_timestamp();

-- =====================================================
-- ENABLE REALTIME
-- =====================================================
-- Enable realtime for user_presence table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- =====================================================
-- SCHEDULE CLEANUP (Optional - requires pg_cron extension)
-- =====================================================
-- Run cleanup every 2 minutes to mark inactive users as offline
-- Uncomment if you have pg_cron extension enabled:

-- SELECT cron.schedule(
--     'cleanup-stale-presence',
--     '*/2 * * * *', -- Every 2 minutes
--     $$SELECT cleanup_stale_presence()$$
-- );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.user_presence TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION heartbeat_user_presence(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_presence(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_online_users_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_online_users() TO authenticated;

-- =====================================================
-- HELPER VIEW FOR EASY QUERYING
-- =====================================================
CREATE OR REPLACE VIEW user_presence_view AS
SELECT
    up.user_id,
    up.status,
    up.last_seen,
    up.last_active,
    up.updated_at,
    u.name,
    u.email,
    u.avatar_url,
    -- Consider online if last active within 5 minutes
    (up.last_active > NOW() - INTERVAL '5 minutes' AND up.status = 'online') as is_online,
    -- Calculate time since last seen
    CASE
        WHEN up.last_active > NOW() - INTERVAL '5 minutes' AND up.status = 'online' THEN 'Online'
        WHEN up.last_seen > NOW() - INTERVAL '1 minute' THEN 'Just now'
        WHEN up.last_seen > NOW() - INTERVAL '1 hour' THEN EXTRACT(MINUTE FROM (NOW() - up.last_seen))::text || ' mins ago'
        WHEN up.last_seen > NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM (NOW() - up.last_seen))::text || ' hours ago'
        WHEN up.last_seen > NOW() - INTERVAL '7 days' THEN EXTRACT(DAY FROM (NOW() - up.last_seen))::text || ' days ago'
        ELSE 'Long time ago'
    END as last_seen_text
FROM public.user_presence up
LEFT JOIN public.users u ON u.id = up.user_id;

GRANT SELECT ON user_presence_view TO authenticated;

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================
-- Create presence records for existing users (set as offline)
INSERT INTO public.user_presence (user_id, status, last_seen, last_active)
SELECT id, 'offline', NOW(), NOW()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- This schema provides:
-- 1. Real-time online/offline status tracking
-- 2. Last seen timestamp
-- 3. Automatic cleanup of stale presence
-- 4. Heartbeat system to keep users online
-- 5. Helper functions and views
-- =====================================================

