-- =====================================================
-- QUANT PRIME TRACKING SPINE
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. TRACKED USERS TABLE
-- Central identity record for all prospects/leads
CREATE TABLE IF NOT EXISTS tracked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  timezone TEXT,
  discord_username TEXT,
  
  -- Funnel state
  entry_source TEXT,                    -- Which button they clicked first
  first_page TEXT,                      -- First page they landed on
  funnel_stage TEXT DEFAULT 'visitor',  -- visitor, lead, discord, customer
  
  -- Engagement tracking
  last_page_seen TEXT,
  last_event_at TIMESTAMPTZ,
  total_page_views INTEGER DEFAULT 0,
  
  -- Conversion tracking
  opted_in_at TIMESTAMPTZ,
  discord_joined_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  
  -- Suppression flags
  suppress_prospect_emails BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_tracked_users_email ON tracked_users(email);
CREATE INDEX IF NOT EXISTS idx_tracked_users_funnel_stage ON tracked_users(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_tracked_users_last_event ON tracked_users(last_event_at);

-- 2. TRACKING EVENTS TABLE
-- Every meaningful action
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User link (nullable for anonymous page views)
  user_id UUID REFERENCES tracked_users(id),
  anonymous_id TEXT,                    -- For pre-opt-in tracking
  
  -- Event details
  event_type TEXT NOT NULL,             -- page_view, opt_in, discord_popup, purchase, email_open, email_click
  page TEXT,                            -- Which page
  entry_source TEXT,                    -- From link tree button
  
  -- Context
  referrer TEXT,
  user_agent TEXT,
  
  -- Metadata (flexible JSON for event-specific data)
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_tracking_events_user ON tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_anon ON tracking_events(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created ON tracking_events(created_at);

-- 3. FUNNEL PATHS TABLE
-- Defines the canonical order for each entry point
CREATE TABLE IF NOT EXISTS funnel_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_source TEXT UNIQUE NOT NULL,    -- 'blueprint', 'framework', 'results', etc.
  path_order TEXT[] NOT NULL,           -- Array of page slugs in order
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default funnel paths
INSERT INTO funnel_paths (entry_source, path_order) VALUES
  ('blueprint', ARRAY['free-guide', 'framework', 'results', 'compounding', 'pricing']),
  ('learn_more', ARRAY['free-guide', 'framework', 'results', 'compounding', 'pricing']),
  ('framework', ARRAY['framework', 'results', 'compounding', 'pricing']),
  ('results', ARRAY['results', 'compounding', 'pricing']),
  ('compounding', ARRAY['compounding', 'pricing']),
  ('pricing', ARRAY['pricing']),
  ('discord', ARRAY['discord'])
ON CONFLICT (entry_source) DO NOTHING;

-- 4. HELPER FUNCTION: Update user on event
CREATE OR REPLACE FUNCTION update_user_on_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if we have a user_id
  IF NEW.user_id IS NOT NULL THEN
    UPDATE tracked_users SET
      last_page_seen = COALESCE(NEW.page, last_page_seen),
      last_event_at = NEW.created_at,
      total_page_views = CASE WHEN NEW.event_type = 'page_view' THEN total_page_views + 1 ELSE total_page_views END,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_user_on_event ON tracking_events;
CREATE TRIGGER trigger_update_user_on_event
  AFTER INSERT ON tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_user_on_event();

-- 5. RLS POLICIES (Row Level Security)
ALTER TABLE tracked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_paths ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking (public can create events)
CREATE POLICY "Allow anonymous event inserts" ON tracking_events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous user creation" ON tracked_users
  FOR INSERT TO anon WITH CHECK (true);

-- Allow reading funnel paths (public)
CREATE POLICY "Allow reading funnel paths" ON funnel_paths
  FOR SELECT TO anon USING (true);

-- Allow service role full access (for backend operations)
CREATE POLICY "Service role full access to users" ON tracked_users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to events" ON tracking_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to update their own record
CREATE POLICY "Users can update own record" ON tracked_users
  FOR UPDATE TO anon 
  USING (true)
  WITH CHECK (true);

-- 6. VIEW: User engagement summary
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.funnel_stage,
  u.entry_source,
  u.last_page_seen,
  u.total_page_views,
  u.last_event_at,
  EXTRACT(EPOCH FROM (NOW() - u.last_event_at)) / 60 AS minutes_since_last_event,
  u.opted_in_at IS NOT NULL AS has_opted_in,
  u.discord_joined_at IS NOT NULL AS has_joined_discord,
  u.purchased_at IS NOT NULL AS has_purchased,
  u.created_at
FROM tracked_users u
ORDER BY u.last_event_at DESC NULLS LAST;

-- Grant access to the view
GRANT SELECT ON user_engagement_summary TO anon;
