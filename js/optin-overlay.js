/**
 * Quant Prime - Opt-in Overlay
 * Shows email capture overlay on tailored entry pages
 * Fires after delay or on exit intent
 */

const QP_OPTIN = {
  shown: false,
  DELAY_MS: 8000, // Show after 8 seconds
  
  init() {
    // Don't show if already opted in
    if (localStorage.getItem('qp_user_id') || localStorage.getItem('qp_opted_in')) {
      console.log('[QP_OPTIN] User already opted in, skipping overlay');
      return;
    }
    
    // Don't show on manifesto page (has its own form)
    if (window.location.pathname.includes('manifesto') || window.location.pathname.includes('free-guide')) {
      return;
    }
    
    // Don't show on dashboard, checkout, success pages
    const skipPages = ['/dashboard', '/checkout', '/success', '/login', '/register'];
    if (skipPages.some(p => window.location.pathname.includes(p))) {
      return;
    }
    
    // Create overlay HTML
    this.createOverlay();
    
    // Show after delay
    setTimeout(() => this.showOverlay('delay'), this.DELAY_MS);
    
    // Exit intent (desktop only)
    if (window.innerWidth > 768) {
      document.addEventListener('mouseout', (e) => {
        if (e.clientY < 10 && !this.shown) {
          this.showOverlay('exit_intent');
        }
      });
    }
  },
  
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'qpOptinOverlay';
    overlay.innerHTML = `
      <style>
        #qpOptinOverlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 10000;
          align-items: center;
          justify-content: center;
          padding: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        #qpOptinOverlay.active {
          display: flex;
          opacity: 1;
        }
        .qp-optin-modal {
          background: #fff;
          border-radius: 20px;
          padding: 40px 32px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          transform: translateY(20px);
          transition: transform 0.3s ease;
        }
        #qpOptinOverlay.active .qp-optin-modal {
          transform: translateY(0);
        }
        .qp-optin-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border: none;
          background: #f5f4f0;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          color: #888;
          transition: all 0.2s;
        }
        .qp-optin-close:hover {
          background: #e8e6e0;
          color: #333;
        }
        .qp-optin-badge {
          display: inline-block;
          background: linear-gradient(135deg, #b8962e, #d4b94e);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          margin-bottom: 20px;
          letter-spacing: 0.05em;
        }
        .qp-optin-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 12px;
          line-height: 1.3;
        }
        .qp-optin-subtitle {
          font-size: 15px;
          color: #555;
          margin-bottom: 28px;
          line-height: 1.5;
        }
        .qp-optin-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .qp-optin-input {
          padding: 14px 16px;
          border: 1px solid #e8e6e0;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.2s;
        }
        .qp-optin-input:focus {
          outline: none;
          border-color: #b8962e;
          box-shadow: 0 0 0 3px rgba(184,150,46,0.1);
        }
        .qp-optin-submit {
          padding: 16px 24px;
          background: linear-gradient(135deg, #b8962e, #c9a84c);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 4px;
        }
        .qp-optin-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(184,150,46,0.3);
        }
        .qp-optin-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .qp-optin-privacy {
          font-size: 12px;
          color: #888;
          margin-top: 16px;
        }
        .qp-optin-skip {
          background: none;
          border: none;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          margin-top: 12px;
          padding: 8px;
        }
        .qp-optin-skip:hover {
          color: #555;
        }
        @media (max-width: 480px) {
          .qp-optin-modal {
            padding: 32px 24px;
          }
          .qp-optin-title {
            font-size: 20px;
          }
        }
      </style>
      <div class="qp-optin-modal">
        <button class="qp-optin-close" onclick="QP_OPTIN.hideOverlay()">×</button>
        <div class="qp-optin-badge">THE MANIFESTO</div>
        <h2 class="qp-optin-title">Want the full breakdown?</h2>
        <p class="qp-optin-subtitle">Get The Quant Prime Blueprint — 5 principles that power institutional-grade trading systems.</p>
        <form class="qp-optin-form" onsubmit="QP_OPTIN.handleSubmit(event)">
          <input type="text" class="qp-optin-input" id="qpOptinName" placeholder="First name" required>
          <input type="email" class="qp-optin-input" id="qpOptinEmail" placeholder="Email address" required>
          <button type="submit" class="qp-optin-submit" id="qpOptinSubmit">Get Instant Access</button>
        </form>
        <p class="qp-optin-privacy">No spam. Unsubscribe anytime.</p>
        <button class="qp-optin-skip" onclick="QP_OPTIN.hideOverlay()">Maybe later</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },
  
  showOverlay(trigger) {
    if (this.shown) return;
    
    const overlay = document.getElementById('qpOptinOverlay');
    if (!overlay) return;
    
    this.shown = true;
    overlay.classList.add('active');
    
    // Track overlay shown
    if (window.QP_TRACK) {
      QP_TRACK.trackEvent('optin_overlay_shown', { metadata: { trigger } });
    }
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideOverlay();
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideOverlay();
    });
  },
  
  hideOverlay() {
    const overlay = document.getElementById('qpOptinOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    // Mark as dismissed for this session
    sessionStorage.setItem('qp_optin_dismissed', 'true');
  },
  
  async handleSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('qpOptinName').value.trim();
    const email = document.getElementById('qpOptinEmail').value.trim();
    const btn = document.getElementById('qpOptinSubmit');
    
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    try {
      // Track opt-in
      if (window.QP_TRACK) {
        await QP_TRACK.trackOptIn(email, name);
      }
      
      // Send to backend for email delivery
      await fetch('/api/free-guide-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          source: 'overlay',
          entry_source: localStorage.getItem('qp_entry_source') || 'direct',
          page: window.location.pathname
        })
      });
      
      // Mark as opted in
      localStorage.setItem('qp_opted_in', 'true');
      
      // Show success state
      const modal = document.querySelector('.qp-optin-modal');
      modal.innerHTML = `
        <div style="text-align: center; padding: 20px 0;">
          <div style="width: 60px; height: 60px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h2 style="font-size: 22px; color: #1a1a1a; margin-bottom: 12px;">You're in!</h2>
          <p style="color: #555; margin-bottom: 24px;">Check your inbox for The Quant Prime Blueprint.</p>
          <button onclick="QP_OPTIN.hideOverlay()" style="padding: 14px 28px; background: #b8962e; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer;">Continue Reading</button>
        </div>
      `;
      
    } catch (error) {
      console.error('[QP_OPTIN] Error:', error);
      btn.disabled = false;
      btn.textContent = 'Get Instant Access';
    }
  }
};

// Auto-init when DOM ready (but not if dismissed this session)
if (!sessionStorage.getItem('qp_optin_dismissed')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => QP_OPTIN.init());
  } else {
    QP_OPTIN.init();
  }
}

window.QP_OPTIN = QP_OPTIN;
