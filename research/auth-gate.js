/**
 * Research Auth Gate
 * Checks if user has Research tier or higher
 * Include this AFTER Supabase CDN script
 */

const SUPABASE_URL = 'https://pjqwnqhnuxwinwxdritp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcXducWhudXh3aW53eGRyaXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjY4NDIsImV4cCI6MjEwMDUwMjg0Mn0.F2Jc11_uEEJ7DAI6SHKu0EyyjlX0UUDmVznU-EO9BsQ';

// Create auth gate overlay
(function() {
  const gate = document.createElement('div');
  gate.id = 'research-auth-gate';
  gate.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0b0d;position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;">
      <div style="text-align:center;color:#7c848f;font-family:system-ui,sans-serif;">
        <div style="font-size:24px;margin-bottom:12px;">🔒</div>
        <div id="research-auth-msg">Verifying access...</div>
      </div>
    </div>
  `;
  document.body.insertBefore(gate, document.body.firstChild);
})();

async function checkResearchAccess(onSuccess) {
  const gate = document.getElementById('research-auth-gate');
  const msg = document.getElementById('research-auth-msg');
  
  try {
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { session } } = await sb.auth.getSession();
    
    if (!session) {
      msg.innerHTML = 'Research is for members only.<br><br><a href="/dashboard/login.html" style="color:#00abff;text-decoration:none;">Login</a> · <a href="/dashboard/register.html" style="color:#00abff;text-decoration:none;">Sign up</a>';
      return;
    }
    
    // Check tier
    const { data: profile } = await sb.from('user_profiles').select('tier').eq('user_id', session.user.id).single();
    const tier = profile?.tier || 'free';
    
    const allowedTiers = ['research', 'recoil', 'full', 'admin'];
    if (!allowedTiers.includes(tier.toLowerCase())) {
      msg.innerHTML = 'Research Archive requires Research tier or higher.<br><br><a href="/#pricing" style="color:#c9a84c;text-decoration:none;">Upgrade your plan</a>';
      return;
    }
    
    // Access granted - remove gate
    gate.remove();
    if (onSuccess) onSuccess();
    
  } catch (e) {
    console.error('Auth error:', e);
    msg.textContent = 'Error checking access. Please refresh.';
  }
}

// Auto-check on load
checkResearchAccess();
