-- Funnel Analytics Schema for Quant Prime
-- Full journey tracking from entry to conversion

-- Sessions table - tracks unique visitor sessions
CREATE TABLE IF NOT EXISTS funnel_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL,  -- Fingerprint/localStorage ID
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    visit_count INT DEFAULT 1,
    
    -- Entry attribution
    entry_source TEXT,  -- instagram, tiktok, twitter, direct, etc.
    entry_location TEXT,  -- bio, story, highlight, dm, post, etc.
    entry_account TEXT,  -- cashmoretrades, quantprime, etc.
    entry_url TEXT,
    
    -- UTM params
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    
    -- Device info
    device_type TEXT,  -- mobile, desktop, tablet
    browser TEXT,
    
    -- Conversion tracking
    converted BOOLEAN DEFAULT FALSE,
    conversion_type TEXT,  -- research_trial, recoil, terminal, suite, free_guide, discord
    conversion_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table - tracks every click/action
CREATE TABLE IF NOT EXISTS funnel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES funnel_sessions(id),
    visitor_id TEXT NOT NULL,
    
    -- Event details
    event_type TEXT NOT NULL,  -- page_view, button_click, form_submit, conversion
    
    -- Page context
    page_path TEXT NOT NULL,  -- /links, /pricing, /free-guide, /checkout
    page_name TEXT,  -- Links, Pricing, Free Guide, Checkout
    
    -- Button/action details (for clicks)
    button_id TEXT,  -- free_guide, research_trial, discord, framework, etc.
    button_name TEXT,  -- Human readable name
    button_position TEXT,  -- hero, sidebar, footer, etc.
    
    -- Journey tracking
    previous_page TEXT,
    previous_button TEXT,
    step_number INT,  -- Which step in this session's journey
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_funnel_sessions_visitor ON funnel_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_funnel_sessions_entry ON funnel_sessions(entry_source, entry_location);
CREATE INDEX IF NOT EXISTS idx_funnel_sessions_converted ON funnel_sessions(converted);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_page ON funnel_events(page_path);
CREATE INDEX IF NOT EXISTS idx_funnel_events_button ON funnel_events(button_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created ON funnel_events(created_at);

-- Email collection tracking (links to existing leads/profiles)
CREATE TABLE IF NOT EXISTS funnel_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES funnel_sessions(id),
    email TEXT NOT NULL,
    
    -- Collection context
    collected_on_page TEXT,  -- /free-guide, /checkout, /links
    collection_type TEXT,  -- free_guide_optin, discord_modal, checkout_form
    
    -- Status
    converted_to_trial BOOLEAN DEFAULT FALSE,
    converted_to_paid BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_emails_email ON funnel_emails(email);

-- Funnel paths view - for tree visualization
CREATE OR REPLACE VIEW funnel_paths AS
SELECT 
    e1.page_path as step1,
    e1.button_id as button1,
    e2.page_path as step2,
    e2.button_id as button2,
    e3.page_path as step3,
    e3.button_id as button3,
    COUNT(DISTINCT e1.session_id) as sessions,
    COUNT(*) as total_clicks
FROM funnel_events e1
LEFT JOIN funnel_events e2 ON e1.session_id = e2.session_id AND e2.step_number = e1.step_number + 1
LEFT JOIN funnel_events e3 ON e2.session_id = e3.session_id AND e3.step_number = e2.step_number + 1
WHERE e1.event_type = 'button_click'
GROUP BY e1.page_path, e1.button_id, e2.page_path, e2.button_id, e3.page_path, e3.button_id
ORDER BY sessions DESC;

-- Daily stats aggregation
CREATE TABLE IF NOT EXISTS funnel_daily_stats (
    date DATE PRIMARY KEY,
    total_sessions INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    return_visitors INT DEFAULT 0,
    
    -- By source
    instagram_bio INT DEFAULT 0,
    instagram_story INT DEFAULT 0,
    instagram_highlight INT DEFAULT 0,
    instagram_dm INT DEFAULT 0,
    tiktok_bio INT DEFAULT 0,
    twitter_bio INT DEFAULT 0,
    direct INT DEFAULT 0,
    other INT DEFAULT 0,
    
    -- Conversions
    research_trials INT DEFAULT 0,
    recoil_signups INT DEFAULT 0,
    terminal_signups INT DEFAULT 0,
    suite_signups INT DEFAULT 0,
    free_guide_optins INT DEFAULT 0,
    discord_joins INT DEFAULT 0,
    
    -- Emails
    emails_collected INT DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
