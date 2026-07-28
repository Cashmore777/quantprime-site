/**
 * Quant Prime - Site-wide Auth
 * Include on any page that needs login state awareness
 */

const SUPABASE_URL = 'https://pjqwnqhnuxwinwxdritp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcXducWhudXh3aW53eGRyaXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjY4NDIsImV4cCI6MjEwMDUwMjg0Mn0.F2Jc11_uEEJ7DAI6SHKu0EyyjlX0UUDmVznU-EO9BsQ';

// Initialize Supabase client
let siteSupabase = null;
let siteUser = null;

async function initSiteAuth() {
  // Wait for Supabase library to load
  if (typeof window.supabase === 'undefined') {
    console.log('[SiteAuth] Supabase not loaded');
    return;
  }
  
  siteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
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
