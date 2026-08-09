/**
 * Quant Prime - Tracking Spine
 * Include on EVERY page for funnel tracking
 */

const QP_TRACK = {
  // Config
  SUPABASE_URL: 'https://pjqwnqhnuxwinwxdritp.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcXducWhudXh3aW53eGRyaXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjY4NDIsImV4cCI6MjEwMDUwMjg0Mn0.F2Jc11_uEEJ7DAI6SHKu0EyyjlX0UUDmVznU-EO9BsQ',
  
  supabase: null,
  userId: null,
  anonymousId: null,
  entrySource: null,
  timezone: null,
  
  // ====== INITIALIZATION ======
  async init() {
    // Wait for Supabase JS to load
    if (typeof supabase === 'undefined') {
      console.warn('[QP_TRACK] Supabase not loaded yet');
      return;
    }
    
    this.supabase = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
    
    // Get or create anonymous ID
    this.anonymousId = this.getOrCreateAnonymousId();
    
    // Capture entry source from URL
    this.captureEntrySource();
    
    // Detect timezone silently
    this.timezone = this.detectTimezone();
    
    // Check if user is already identified
    this.userId = localStorage.getItem('qp_user_id');
    
    // Track page view
    await this.trackPageView();
    
    console.log('[QP_TRACK] Initialized', {
      anonymousId: this.anonymousId,
      userId: this.userId,
      entrySource: this.entrySource,
      timezone: this.timezone
    });
  },
  
  // ====== ANONYMOUS ID ======
  getOrCreateAnonymousId() {
    let anonId = localStorage.getItem('qp_anonymous_id');
    if (!anonId) {
      anonId = 'anon_' + this.generateId();
      localStorage.setItem('qp_anonymous_id', anonId);
    }
    return anonId;
  },
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },
  
  // ====== ENTRY SOURCE CAPTURE ======
  captureEntrySource() {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('src') || urlParams.get('entry_source');
    
    if (source) {
      // New entry source - save it
      localStorage.setItem('qp_entry_source', source);
      localStorage.setItem('qp_first_page', window.location.pathname);
      this.entrySource = source;
    } else {
      // Use existing entry source if set
      this.entrySource = localStorage.getItem('qp_entry_source');
    }
  },
  
  // ====== TIMEZONE DETECTION ======
  detectTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return null;
    }
  },
  
  // ====== PAGE VIEW TRACKING ======
  async trackPageView() {
    const page = window.location.pathname;
    
    // Debounce - don't track same page twice in 5 seconds
    const lastView = sessionStorage.getItem('qp_last_page_view');
    const lastViewTime = sessionStorage.getItem('qp_last_page_view_time');
    if (lastView === page && lastViewTime && (Date.now() - parseInt(lastViewTime)) < 5000) {
      return;
    }
    sessionStorage.setItem('qp_last_page_view', page);
    sessionStorage.setItem('qp_last_page_view_time', Date.now().toString());
    
    await this.trackEvent('page_view', { page });
  },
  
  // ====== GENERIC EVENT TRACKING ======
  async trackEvent(eventType, data = {}) {
    if (!this.supabase) {
      console.warn('[QP_TRACK] Cannot track - Supabase not initialized');
      return;
    }
    
    const event = {
      user_id: this.userId || null,
      anonymous_id: this.anonymousId,
      event_type: eventType,
      page: data.page || window.location.pathname,
      entry_source: this.entrySource,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      metadata: data.metadata || {}
    };
    
    try {
      const { error } = await this.supabase
        .from('tracking_events')
        .insert(event);
      
      if (error) {
        console.error('[QP_TRACK] Event error:', error);
      } else {
        console.log('[QP_TRACK] Event tracked:', eventType);
      }
    } catch (e) {
      console.error('[QP_TRACK] Event exception:', e);
    }
  },
  
  // ====== OPT-IN HANDLING ======
  async trackOptIn(email, firstName) {
    if (!this.supabase || !email) return null;
    
    try {
      // Create or update user record
      const userData = {
        email: email.toLowerCase().trim(),
        first_name: firstName || null,
        timezone: this.timezone,
        entry_source: this.entrySource,
        first_page: localStorage.getItem('qp_first_page') || window.location.pathname,
        funnel_stage: 'lead',
        opted_in_at: new Date().toISOString(),
        last_page_seen: window.location.pathname,
        last_event_at: new Date().toISOString()
      };
      
      // Upsert user (create or update if exists)
      const { data: user, error } = await this.supabase
        .from('tracked_users')
        .upsert(userData, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      if (error) {
        console.error('[QP_TRACK] Opt-in user error:', error);
        return null;
      }
      
      // Store user ID locally
      this.userId = user.id;
      localStorage.setItem('qp_user_id', user.id);
      localStorage.setItem('qp_user_email', email);
      
      // Track opt-in event
      await this.trackEvent('opt_in', {
        metadata: { email, first_name: firstName }
      });
      
      // Link previous anonymous events to this user
      await this.linkAnonymousEvents(user.id);
      
      console.log('[QP_TRACK] Opt-in tracked:', user.id);
      return user;
      
    } catch (e) {
      console.error('[QP_TRACK] Opt-in exception:', e);
      return null;
    }
  },
  
  // ====== DISCORD POPUP HANDLING ======
  async trackDiscordJoin(discordUsername, email, firstName) {
    if (!this.supabase) return null;
    
    try {
      // If we have an email, create/update user
      if (email) {
        const userData = {
          email: email.toLowerCase().trim(),
          first_name: firstName || null,
          discord_username: discordUsername,
          timezone: this.timezone,
          entry_source: this.entrySource || 'discord',
          funnel_stage: 'discord',
          discord_joined_at: new Date().toISOString(),
          last_page_seen: window.location.pathname,
          last_event_at: new Date().toISOString()
        };
        
        const { data: user, error } = await this.supabase
          .from('tracked_users')
          .upsert(userData, { 
            onConflict: 'email',
            ignoreDuplicates: false 
          })
          .select()
          .single();
        
        if (!error && user) {
          this.userId = user.id;
          localStorage.setItem('qp_user_id', user.id);
        }
      }
      
      // Track discord join event
      await this.trackEvent('discord_popup', {
        metadata: { discord_username: discordUsername, email }
      });
      
      console.log('[QP_TRACK] Discord join tracked');
      return true;
      
    } catch (e) {
      console.error('[QP_TRACK] Discord exception:', e);
      return false;
    }
  },
  
  // ====== PURCHASE HANDLING ======
  async trackPurchase(productId, amount) {
    if (!this.supabase || !this.userId) {
      console.warn('[QP_TRACK] Cannot track purchase - no user ID');
      return;
    }
    
    try {
      // Update user to customer status
      await this.supabase
        .from('tracked_users')
        .update({
          funnel_stage: 'customer',
          purchased_at: new Date().toISOString(),
          suppress_prospect_emails: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.userId);
      
      // Track purchase event
      await this.trackEvent('purchase', {
        metadata: { product_id: productId, amount }
      });
      
      console.log('[QP_TRACK] Purchase tracked');
      
    } catch (e) {
      console.error('[QP_TRACK] Purchase exception:', e);
    }
  },
  
  // ====== LINK ANONYMOUS EVENTS ======
  async linkAnonymousEvents(userId) {
    if (!this.supabase || !this.anonymousId) return;
    
    try {
      // Update all anonymous events with this anonymous ID to have the user ID
      await this.supabase
        .from('tracking_events')
        .update({ user_id: userId })
        .eq('anonymous_id', this.anonymousId)
        .is('user_id', null);
      
      console.log('[QP_TRACK] Linked anonymous events to user');
    } catch (e) {
      console.error('[QP_TRACK] Link events exception:', e);
    }
  },
  
  // ====== FUNNEL PATH HELPERS ======
  async getNextPage() {
    if (!this.supabase || !this.entrySource) return null;
    
    try {
      // Get the funnel path for this entry source
      const { data: path } = await this.supabase
        .from('funnel_paths')
        .select('path_order')
        .eq('entry_source', this.entrySource)
        .single();
      
      if (!path) return null;
      
      // Get pages already seen
      const seenPages = JSON.parse(localStorage.getItem('qp_seen_pages') || '[]');
      const currentPage = window.location.pathname.replace(/^\/|\.html$/g, '');
      
      // Mark current page as seen
      if (!seenPages.includes(currentPage)) {
        seenPages.push(currentPage);
        localStorage.setItem('qp_seen_pages', JSON.stringify(seenPages));
      }
      
      // Find next unseen page in path
      for (const page of path.path_order) {
        if (!seenPages.includes(page)) {
          return '/' + page + '.html';
        }
      }
      
      return null; // All pages seen
      
    } catch (e) {
      console.error('[QP_TRACK] Get next page exception:', e);
      return null;
    }
  },
  
  // ====== ENTRY SOURCE BUTTON CLICK ======
  trackButtonClick(source) {
    // Set entry source and redirect
    localStorage.setItem('qp_entry_source', source);
    localStorage.setItem('qp_first_page', window.location.pathname);
    localStorage.removeItem('qp_seen_pages'); // Reset seen pages for new journey
    this.entrySource = source;
    
    this.trackEvent('button_click', {
      metadata: { entry_source: source }
    });
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => QP_TRACK.init());
} else {
  QP_TRACK.init();
}

// Export for use in other scripts
window.QP_TRACK = QP_TRACK;
