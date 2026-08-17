-- Menu Events Tracking Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS menu_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  tier TEXT NOT NULL,
  build_id TEXT,
  selections JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_menu_events_user_id ON menu_events(user_id);

-- Index for querying by event type (for analytics)
CREATE INDEX IF NOT EXISTS idx_menu_events_type ON menu_events(event_type);

-- Index for querying by build_id (for dish popularity)
CREATE INDEX IF NOT EXISTS idx_menu_events_build_id ON menu_events(build_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_menu_events_created_at ON menu_events(created_at);

-- Enable RLS
ALTER TABLE menu_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON menu_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own events
CREATE POLICY "Users can read own events"
  ON menu_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can read all events (for analytics)
-- Note: Adjust this based on your admin detection method
CREATE POLICY "Admins can read all events"
  ON menu_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.tier = 'admin'
    )
  );

-- View for dish popularity analytics
CREATE OR REPLACE VIEW menu_dish_popularity AS
SELECT 
  tier,
  (selections->>'starter')::int as starter_dish,
  (selections->>'main')::int as main_dish,
  (selections->>'side')::int as side_dish,
  (selections->>'dessert')::int as dessert_dish,
  COUNT(*) as build_count
FROM menu_events
WHERE event_type = 'generate_completed'
GROUP BY tier, starter_dish, main_dish, side_dish, dessert_dish
ORDER BY build_count DESC;

-- View for activation tracking (first generate per user)
CREATE OR REPLACE VIEW menu_activations AS
SELECT 
  user_id,
  tier,
  MIN(created_at) as first_generate_at,
  COUNT(*) as total_generates
FROM menu_events
WHERE event_type = 'generate_completed'
GROUP BY user_id, tier;

COMMENT ON TABLE menu_events IS 'Tracks menu system interactions for trial email sequence and analytics';
