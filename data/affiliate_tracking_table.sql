-- Quant Prime Affiliate Tracking Table
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)

-- Create the affiliate_tracking table
CREATE TABLE IF NOT EXISTS affiliate_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id VARCHAR(20) NOT NULL,
  affiliate_email VARCHAR(255),
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('click', 'signup', 'conversion')),
  user_email VARCHAR(255),
  landing_page VARCHAR(255),
  referrer TEXT,
  user_agent TEXT,
  product VARCHAR(100),
  amount DECIMAL(10,2),
  commission DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_id ON affiliate_tracking(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_event_type ON affiliate_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON affiliate_tracking(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE affiliate_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for tracking clicks/signups/conversions)
CREATE POLICY "Allow anonymous insert" ON affiliate_tracking
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own affiliate data
CREATE POLICY "Allow affiliate read own data" ON affiliate_tracking
  FOR SELECT
  USING (
    affiliate_id = UPPER(SUBSTRING(auth.uid()::text, 1, 8))
  );

-- Policy: Allow admin (Cash) to read all data
-- You'll need to set is_admin claim in Supabase Auth
CREATE POLICY "Allow admin read all" ON affiliate_tracking
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'cashmoretrades@pm.me'
    OR auth.jwt() ->> 'email' = 'seandavies41@gmail.com'
    OR auth.jwt() ->> 'email' = 'cash@themoneyprinter.uk'
  );

-- Grant permissions
GRANT INSERT ON affiliate_tracking TO anon;
GRANT SELECT ON affiliate_tracking TO authenticated;

-- ============================================
-- VERIFY TABLE WAS CREATED
-- ============================================
SELECT 'affiliate_tracking table created successfully!' as status;
