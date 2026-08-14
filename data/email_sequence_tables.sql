-- Quant Prime Email Sequence Infrastructure
-- Run this in Supabase SQL Editor

-- ============================================
-- PROFILES TABLE UPDATES
-- Add new columns if they don't exist
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier_since TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sub_status TEXT DEFAULT 'none'; -- none, active, past_due, cancelled
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cancel_pending BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chat_allowance INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indicator_access BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_access BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketplace_menus TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sales_suppressed_until TIMESTAMPTZ;

-- Index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- ============================================
-- STRIPE EVENTS LOG
-- For deduplication and debugging
-- ============================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id SERIAL PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB,
  status TEXT DEFAULT 'received', -- received, processed, error
  error TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_status ON stripe_events(status);

-- ============================================
-- TRADINGVIEW ACCESS QUEUE
-- Async processing of indicator grants/revokes
-- ============================================

CREATE TABLE IF NOT EXISTS tradingview_access_queue (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  tier TEXT NOT NULL,
  action TEXT NOT NULL, -- grant, revoke
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_queue_unprocessed ON tradingview_access_queue(processed) WHERE processed = FALSE;

-- ============================================
-- SEQUENCE HISTORY
-- Track which sequences a user has been in
-- ============================================

CREATE TABLE IF NOT EXISTS sequence_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  email TEXT NOT NULL,
  sequence_key TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  stopped_reason TEXT, -- completed, upgraded, cancelled, unsubscribed
  emails_sent INTEGER DEFAULT 0,
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sequence_history_user ON sequence_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sequence_history_email ON sequence_history(email);
CREATE INDEX IF NOT EXISTS idx_sequence_history_active ON sequence_history(user_id, sequence_key) WHERE completed_at IS NULL;

-- ============================================
-- TIER CHANGE LOG
-- Audit trail for all tier changes
-- ============================================

CREATE TABLE IF NOT EXISTS tier_changes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  email TEXT,
  old_tier TEXT,
  new_tier TEXT NOT NULL,
  trigger_source TEXT NOT NULL, -- stripe_webhook, admin, system
  trigger_event_id TEXT, -- Stripe event ID if applicable
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tier_changes_user ON tier_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_changes_date ON tier_changes(created_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Stripe events: only service role
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON stripe_events
  FOR ALL USING (auth.role() = 'service_role');

-- TradingView queue: only service role
ALTER TABLE tradingview_access_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON tradingview_access_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Sequence history: users can read their own
ALTER TABLE sequence_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own history" ON sequence_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON sequence_history
  FOR ALL USING (auth.role() = 'service_role');

-- Tier changes: users can read their own, admins can read all
ALTER TABLE tier_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own changes" ON tier_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON tier_changes
  FOR ALL USING (auth.role() = 'service_role');
