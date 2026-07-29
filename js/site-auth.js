/**
 * Quant Prime - Site-wide Auth & Affiliate Tracking
 * Include on any page that needs login state awareness or affiliate tracking
 */

const SUPABASE_URL = 'https://pjqwnqhnuxwinwxdritp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcXducWhudXh3aW53eGRyaXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjY4NDIsImV4cCI6MjEwMDUwMjg0Mn0.F2Jc11_uEEJ7DAI6SHKu0EyyjlX0UUDmVznU-EO9BsQ';

// Initialize Supabase client
let siteSupabase = null;
let siteUser = null;

// ====== AFFILIATE TRACKING ======
// Check for ?ref= parameter and track the click
async function trackAffiliateClick() {
  const urlParams = new URLSearchParams(window.location.search);
  const refId = urlParams.get('ref');
  
  if (!refId) return;
  
  // Store in localStorage for conversion attribution later
  localStorage.setItem('qp_affiliate_ref', refId);
  localStorage.setItem('qp_affiliate_landing', window.location.pathname);
  localStorage.setItem('qp_affiliate_time', Date.now().toString());
  
  // Wait for Supabase to be ready
  if (!siteSupabase) {
    console.log('[Affiliate] Supabase not ready, skipping click track');
    return;
  }
  
  // Check if we already tracked this session (avoid duplicate clicks)
  const sessionKey = `qp_aff_click_${refId}_${new Date().toDateString()}`;
  if (sessionStorage.getItem(sessionKey)) {
    console.log('[Affiliate] Already tracked click this session');
    return;
  }
  
  try {
    const { error } = await siteSupabase
      .from('affiliate_tracking')
      .insert({
        affiliate_id: refId.toUpperCase(),
        event_type: 'click',
        landing_page: window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.log('[Affiliate] Track click error:', error.message);
      // Table might not exist yet - that's fine
    } else {
      console.log('[Affiliate] Click tracked for:', refId);
      sessionStorage.setItem(sessionKey, '1');
    }
  } catch (e) {
    console.log('[Affiliate] Track error:', e.message);
  }
}

// Get stored affiliate ref for conversion attribution
function getStoredAffiliateRef() {
  const ref = localStorage.getItem('qp_affiliate_ref');
  const time = localStorage.getItem('qp_affiliate_time');
  
  // Attribution window: 30 days
  if (ref && time) {
    const daysSince = (Date.now() - parseInt(time)) / (1000 * 60 * 60 * 24);
    if (daysSince <= 30) {
      return ref;
    }
    // Clear expired attribution
    localStorage.removeItem('qp_affiliate_ref');
    localStorage.removeItem('qp_affiliate_landing');
    localStorage.removeItem('qp_affiliate_time');
  }
  return null;
}

// Track signup (call this when user creates account)
async function trackAffiliateSignup(userEmail) {
  const refId = getStoredAffiliateRef();
  if (!refId || !siteSupabase) return;
  
  try {
    await siteSupabase
      .from('affiliate_tracking')
      .insert({
        affiliate_id: refId.toUpperCase(),
        event_type: 'signup',
        user_email: userEmail,
        landing_page: localStorage.getItem('qp_affiliate_landing'),
        created_at: new Date().toISOString()
      });
    console.log('[Affiliate] Signup tracked for:', refId);
  } catch (e) {
    console.log('[Affiliate] Signup track error:', e.message);
  }
}

// Track conversion (call this after successful payment)
async function trackAffiliateConversion(userEmail, product, amount, commission) {
  const refId = getStoredAffiliateRef();
  if (!refId || !siteSupabase) return;
  
  try {
    await siteSupabase
      .from('affiliate_tracking')
      .insert({
        affiliate_id: refId.toUpperCase(),
        event_type: 'conversion',
        user_email: userEmail,
        product: product,
        amount: amount,
        commission: commission,
        landing_page: localStorage.getItem('qp_affiliate_landing'),
        created_at: new Date().toISOString()
      });
    console.log('[Affiliate] Conversion tracked for:', refId, '- Commission: £' + commission);
    
    // Clear attribution after conversion (one-time)
    localStorage.removeItem('qp_affiliate_ref');
    localStorage.removeItem('qp_affiliate_landing');
    localStorage.removeItem('qp_affiliate_time');
  } catch (e) {
    console.log('[Affiliate] Conversion track error:', e.message);
  }
}

// ====== AUTH ======
async function initSiteAuth() {
  // Wait for Supabase library to load
  if (typeof window.supabase === 'undefined') {
    console.log('[SiteAuth] Supabase not loaded');
    return;
  }
  
  siteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Track affiliate click AFTER Supabase is ready
  trackAffiliateClick();
  
  try {
    const { data: { session } } = await siteSupabase.auth.getSession();
    
    if (session) {
      siteUser = session.user;
      updateNavForLoggedIn(siteUser);
    }
  } catch (e) {
    console.log('[SiteAuth] Auth check failed:', e.message);
  }
}

function updateNavForLoggedIn(user) {
  // Find nav elements
  const navCta = document.querySelector('.nav-cta');
  const loginLink = document.querySelector('.nav-dropdown a[href*="login"]');
  
  // Get display name from email
  const displayName = user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();
  
  // Replace "Get Access" CTA with user menu
  if (navCta) {
    navCta.href = '/dashboard';
    navCta.innerHTML = `
      <span class="user-avatar">${initial}</span>
      <span class="user-name">${displayName}</span>
    `;
    navCta.classList.add('nav-user');
  }
  
  // Replace "Login" in dropdown with "Dashboard"
  if (loginLink) {
    loginLink.href = '/dashboard';
    loginLink.textContent = 'Dashboard';
  }
}

// Add styles for user avatar
const authStyles = document.createElement('style');
authStyles.textContent = `
  .nav-user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px !important;
  }
  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #c9a84c, #d4b85a);
    color: #0a0a0f;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 13px;
  }
  .user-name {
    font-size: 14px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (max-width: 600px) {
    .user-name { display: none; }
    .nav-user { padding: 8px 12px !important; }
  }
`;
document.head.appendChild(authStyles);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSiteAuth);
} else {
  initSiteAuth();
}
