/**
 * Quant Prime Funnel Tracking v2
 * Full journey tracking from entry to conversion
 */

(function() {
  'use strict';
  
  const SUPABASE_URL = 'https://pjqwnqhnuxwinwxdritp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcXducWhudXh3aW53eGRyaXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjY4NDIsImV4cCI6MjEwMDUwMjg0Mn0.F2Jc11_uEEJ7DAI6SHKu0EyyjlX0UUDmVznU-EO9BsQ';
  
  // Generate or retrieve visitor ID
  function getVisitorId() {
    let id = localStorage.getItem('qp_visitor_id');
    if (!id) {
      id = 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('qp_visitor_id', id);
    }
    return id;
  }
  
  // Get or create session
  function getSession() {
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let session = JSON.parse(localStorage.getItem('qp_funnel_session') || 'null');
    
    if (!session || (Date.now() - session.lastActivity) > SESSION_TIMEOUT) {
      // New session
      session = {
        id: 's_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
        startedAt: Date.now(),
        lastActivity: Date.now(),
        stepNumber: 0,
        previousPage: null,
        previousButton: null,
        entrySource: null,
        entryLocation: null,
        entryAccount: null,
        dbSessionId: null
      };
      
      // Parse entry attribution from URL
      parseEntryAttribution(session);
    }
    
    session.lastActivity = Date.now();
    localStorage.setItem('qp_funnel_session', JSON.stringify(session));
    return session;
  }
  
  function updateSession(updates) {
    const session = getSession();
    Object.assign(session, updates);
    session.lastActivity = Date.now();
    localStorage.setItem('qp_funnel_session', JSON.stringify(session));
    return session;
  }
  
  // Parse entry source from URL params
  function parseEntryAttribution(session) {
    const params = new URLSearchParams(window.location.search);
    
    // Check for our tracking params
    const src = params.get('src');
    const source = params.get('source') || params.get('utm_source');
    const medium = params.get('medium') || params.get('utm_medium');
    const campaign = params.get('utm_campaign');
    
    // Parse src param (format: platform_location or just location)
    if (src) {
      const parts = src.split('_');
      if (parts.length >= 2) {
        session.entrySource = parts[0]; // instagram, tiktok, etc.
        session.entryLocation = parts.slice(1).join('_'); // bio, story, highlight, dm
      } else {
        session.entryLocation = src;
        session.entrySource = source || 'direct';
      }
    } else if (source) {
      session.entrySource = source;
      session.entryLocation = medium || 'unknown';
    } else {
      // Check referrer
      const ref = document.referrer;
      if (ref.includes('instagram.com')) {
        session.entrySource = 'instagram';
        session.entryLocation = 'unknown';
      } else if (ref.includes('tiktok.com')) {
        session.entrySource = 'tiktok';
        session.entryLocation = 'unknown';
      } else if (ref.includes('twitter.com') || ref.includes('x.com')) {
        session.entrySource = 'twitter';
        session.entryLocation = 'unknown';
      } else if (!ref || ref.includes('quantprime.uk')) {
        session.entrySource = 'direct';
        session.entryLocation = 'direct';
      } else {
        session.entrySource = 'referral';
        session.entryLocation = new URL(ref).hostname;
      }
    }
    
    // Account attribution
    session.entryAccount = params.get('account') || params.get('acc') || 'cashmoretrades';
    
    // Store UTM params
    session.utmSource = source;
    session.utmMedium = medium;
    session.utmCampaign = campaign;
    session.utmContent = params.get('utm_content');
  }
  
  // Get device info
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPad/.test(ua)) {
      deviceType = /iPad|Tablet/.test(ua) ? 'tablet' : 'mobile';
    }
    
    let browser = 'other';
    if (ua.includes('Chrome')) browser = 'chrome';
    else if (ua.includes('Safari')) browser = 'safari';
    else if (ua.includes('Firefox')) browser = 'firefox';
    else if (ua.includes('Edge')) browser = 'edge';
    
    return { deviceType, browser };
  }
  
  // Get page name from path
  function getPageName(path) {
    const names = {
      '/': 'Homepage',
      '/links': 'Links',
      '/links.html': 'Links',
      '/pricing': 'Pricing',
      '/pricing.html': 'Pricing',
      '/manifesto': 'The Manifesto',
      '/manifesto.html': 'The Manifesto',
      '/free-guide': 'The Manifesto',
      '/free-guide.html': 'The Manifesto',
      '/checkout': 'Checkout',
      '/checkout.html': 'Checkout',
      '/framework': 'Framework',
      '/framework.html': 'Framework',
      '/results': 'Results',
      '/results.html': 'Results',
      '/compounding': 'Compounding',
      '/compounding.html': 'Compounding',
      '/success': 'Success',
      '/success.html': 'Success',
      '/dashboard': 'Dashboard',
      '/ascension': 'Ascension',
      '/ascension-apply': 'Ascension Apply'
    };
    return names[path] || path;
  }
  
  // Send event to Supabase
  async function trackEvent(eventType, data = {}) {
    const session = getSession();
    const visitorId = getVisitorId();
    const device = getDeviceInfo();
    const pagePath = window.location.pathname;
    
    try {
      // Create or update session in DB
      if (!session.dbSessionId) {
        const sessionRes = await fetch(`${SUPABASE_URL}/rest/v1/funnel_sessions`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            visitor_id: visitorId,
            entry_source: session.entrySource,
            entry_location: session.entryLocation,
            entry_account: session.entryAccount,
            entry_url: window.location.href,
            utm_source: session.utmSource,
            utm_medium: session.utmMedium,
            utm_campaign: session.utmCampaign,
            utm_content: session.utmContent,
            device_type: device.deviceType,
            browser: device.browser
          })
        });
        
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData && sessionData[0]) {
            updateSession({ dbSessionId: sessionData[0].id });
            session.dbSessionId = sessionData[0].id;
          }
        }
      } else {
        // Update last_seen
        fetch(`${SUPABASE_URL}/rest/v1/funnel_sessions?id=eq.${session.dbSessionId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ last_seen: new Date().toISOString() })
        }).catch(() => {});
      }
      
      // Increment step number for clicks
      if (eventType === 'button_click') {
        session.stepNumber++;
        updateSession({ stepNumber: session.stepNumber });
      }
      
      // Track event
      const eventPayload = {
        session_id: session.dbSessionId,
        visitor_id: visitorId,
        event_type: eventType,
        page_path: pagePath,
        page_name: getPageName(pagePath),
        button_id: data.buttonId || null,
        button_name: data.buttonName || null,
        button_position: data.buttonPosition || null,
        previous_page: session.previousPage,
        previous_button: session.previousButton,
        step_number: session.stepNumber
      };
      
      await fetch(`${SUPABASE_URL}/rest/v1/funnel_events`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });
      
      // Update previous page/button for next event
      if (eventType === 'button_click') {
        updateSession({
          previousPage: pagePath,
          previousButton: data.buttonId
        });
      }
      
    } catch (err) {
      console.log('[Funnel] Track error:', err.message);
    }
  }
  
  // Track conversion
  async function trackConversion(conversionType) {
    const session = getSession();
    
    if (session.dbSessionId) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/funnel_sessions?id=eq.${session.dbSessionId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            converted: true,
            conversion_type: conversionType,
            conversion_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.log('[Funnel] Conversion track error:', err.message);
      }
    }
    
    trackEvent('conversion', { buttonId: conversionType, buttonName: conversionType });
  }
  
  // Track email collection
  async function trackEmail(email, collectionType) {
    const session = getSession();
    
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/funnel_emails`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: session.dbSessionId,
          email: email,
          collected_on_page: window.location.pathname,
          collection_type: collectionType
        })
      });
    } catch (err) {
      console.log('[Funnel] Email track error:', err.message);
    }
  }
  
  // Auto-track page views
  function trackPageView() {
    trackEvent('page_view');
  }
  
  // Auto-track button clicks
  function setupClickTracking() {
    document.addEventListener('click', function(e) {
      const target = e.target.closest('[data-track], a[href], button');
      if (!target) return;
      
      // Get tracking data
      let buttonId = target.dataset.track || target.dataset.source;
      let buttonName = target.dataset.trackName || target.textContent?.trim().substring(0, 50);
      let buttonPosition = target.dataset.trackPosition || 'unknown';
      
      // Auto-detect button ID from href or class
      if (!buttonId) {
        const href = target.getAttribute('href') || '';
        if (href.includes('checkout?tier=research')) buttonId = 'research_trial';
        else if (href.includes('checkout?tier=recoil')) buttonId = 'recoil_checkout';
        else if (href.includes('checkout?tier=terminal')) buttonId = 'terminal_checkout';
        else if (href.includes('checkout?tier=suite')) buttonId = 'suite_checkout';
        else if (href.includes('free-guide')) buttonId = 'free_guide';
        else if (href.includes('discord')) buttonId = 'discord';
        else if (href.includes('pricing')) buttonId = 'pricing';
        else if (href.includes('framework')) buttonId = 'framework';
        else if (href.includes('results')) buttonId = 'results';
        else if (href.includes('compounding')) buttonId = 'compounding';
        else if (href.includes('dashboard')) buttonId = 'dashboard';
        else if (href.includes('ascension')) buttonId = 'ascension';
        else if (href.startsWith('/') || href.startsWith('http')) {
          buttonId = href.replace(/^https?:\/\/[^\/]+/, '').replace(/\/$/, '') || 'home';
        }
      }
      
      // Detect position
      if (!buttonPosition || buttonPosition === 'unknown') {
        const rect = target.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.top < vh * 0.3) buttonPosition = 'top';
        else if (rect.top < vh * 0.7) buttonPosition = 'middle';
        else buttonPosition = 'bottom';
        
        // Check for specific sections
        const section = target.closest('section, .hero, .cta-section, nav, footer');
        if (section) {
          if (section.tagName === 'NAV') buttonPosition = 'nav';
          else if (section.tagName === 'FOOTER') buttonPosition = 'footer';
          else if (section.classList.contains('hero')) buttonPosition = 'hero';
          else if (section.classList.contains('cta-section')) buttonPosition = 'cta_section';
        }
      }
      
      if (buttonId) {
        trackEvent('button_click', { buttonId, buttonName, buttonPosition });
      }
    });
  }
  
  // Initialize
  function init() {
    // Track page view on load
    trackPageView();
    
    // Setup click tracking
    setupClickTracking();
    
    // Check for conversion on success page
    if (window.location.pathname.includes('success')) {
      const params = new URLSearchParams(window.location.search);
      const tier = params.get('tier') || params.get('type');
      if (tier) {
        trackConversion(tier);
      }
    }
  }
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose API
  window.QP_FUNNEL = {
    trackEvent,
    trackConversion,
    trackEmail,
    getSession,
    getVisitorId
  };
  
})();
