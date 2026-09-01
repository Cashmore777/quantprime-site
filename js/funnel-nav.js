/**
 * Quant Prime - Funnel Navigation
 * Adds "next step" buttons that follow the funnel path
 */

const QP_FUNNEL = {
  // Page order in the canonical funnel
  FUNNEL_ORDER: [
    { slug: 'manifesto', name: 'The Manifesto', path: '/manifesto.html' },
    { slug: 'framework', name: 'The Framework', path: '/framework.html' },
    { slug: 'results', name: 'Verified Results', path: '/results.html' },
    { slug: 'compounding', name: 'Compounding Calculator', path: '/compounding.html' },
    { slug: 'pricing', name: 'View Pricing', path: '/pricing.html' }
  ],
  
  init() {
    // Find or create the next-step container
    this.injectNextButton();
  },
  
  getCurrentPageIndex() {
    const path = window.location.pathname;
    return this.FUNNEL_ORDER.findIndex(p => path.includes(p.slug));
  },
  
  getNextPage() {
    const currentIndex = this.getCurrentPageIndex();
    if (currentIndex === -1 || currentIndex >= this.FUNNEL_ORDER.length - 1) {
      return null;
    }
    return this.FUNNEL_ORDER[currentIndex + 1];
  },
  
  injectNextButton() {
    const nextPage = this.getNextPage();
    if (!nextPage) return;
    
    // Look for existing CTA section or next-section
    let container = document.querySelector('.next-section, .cta-section, [data-funnel-nav]');
    
    if (container) {
      // Add or update the next button
      const existingLink = container.querySelector('a.btn-primary, a.btn.gold');
      if (existingLink && !existingLink.dataset.funnelNav) {
        // Keep existing CTA but add funnel tracking
        existingLink.addEventListener('click', () => {
          if (window.QP_TRACK) {
            QP_TRACK.trackEvent('funnel_next_click', { 
              metadata: { from: window.location.pathname, to: nextPage.path }
            });
          }
        });
      }
    }
    
    // Also add floating next indicator if not on pricing page
    if (!window.location.pathname.includes('pricing')) {
      this.addFloatingIndicator(nextPage);
    }
  },
  
  addFloatingIndicator(nextPage) {
    // Don't add if already exists
    if (document.getElementById('qpFunnelFloat')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'qpFunnelFloat';
    indicator.innerHTML = `
      <style>
        #qpFunnelFloat {
          position: fixed;
          bottom: 24px;
          right: 90px; /* Offset to avoid support widget */
          z-index: 99; /* Below support widget */
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease;
          pointer-events: none;
        }
        #qpFunnelFloat.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .qp-funnel-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: #fff;
          border: 1px solid #e8e6e0;
          border-radius: 50px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          text-decoration: none;
          color: #1a1a1a;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .qp-funnel-btn:hover {
          border-color: #b8962e;
          box-shadow: 0 6px 24px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }
        .qp-funnel-label {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .qp-funnel-arrow {
          width: 20px;
          height: 20px;
          background: #b8962e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qp-funnel-arrow svg {
          width: 12px;
          height: 12px;
          stroke: #fff;
        }
        @media (max-width: 600px) {
          #qpFunnelFloat {
            bottom: 90px; /* Above support widget on mobile */
            right: 16px;
            left: auto;
          }
        }
      </style>
      <a href="${nextPage.path}?src=${localStorage.getItem('qp_entry_source') || 'funnel'}" class="qp-funnel-btn" onclick="QP_FUNNEL.trackClick('${nextPage.path}')">
        <div>
          <div class="qp-funnel-label">Next</div>
          <div>${nextPage.name}</div>
        </div>
        <div class="qp-funnel-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </a>
    `;
    document.body.appendChild(indicator);
    
    // Show after scroll
    let shown = false;
    window.addEventListener('scroll', () => {
      if (!shown && window.scrollY > 300) {
        indicator.classList.add('visible');
        shown = true;
      }
    });
    
    // Also show after delay if no scroll
    setTimeout(() => {
      if (!shown) {
        indicator.classList.add('visible');
        shown = true;
      }
    }, 5000);
  },
  
  trackClick(toPath) {
    if (window.QP_TRACK) {
      QP_TRACK.trackEvent('funnel_next_click', {
        metadata: { from: window.location.pathname, to: toPath }
      });
    }
  }
};

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => QP_FUNNEL.init());
} else {
  QP_FUNNEL.init();
}

window.QP_FUNNEL = QP_FUNNEL;
