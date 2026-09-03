/**
 * QP Tour Dev Testing Tool
 * 
 * Admin-only tool for testing all onboarding tour sequences.
 * This script only renders UI if user is admin tier.
 */

const QPTourDevTool = (function() {
  'use strict';

  let isRendered = false;
  let menuOpen = false;

  // All 10 test sequences
  const TEST_SEQUENCES = {
    // New signup paths (4)
    'new-research': {
      label: 'New → Research',
      desc: 'New user joins at Research tier',
      sections: ['research']
    },
    'new-recoil': {
      label: 'New → Recoil',
      desc: 'New user joins at Recoil tier',
      sections: ['research', 'recoil']
    },
    'new-terminal': {
      label: 'New → Terminal',
      desc: 'New user joins at Terminal tier',
      sections: ['research', 'recoil', 'terminal']
    },
    'new-suite': {
      label: 'New → Suite',
      desc: 'New user joins at Suite tier',
      sections: ['research', 'recoil', 'terminal', 'suite']
    },
    
    // Upgrade paths (6)
    'upgrade-research-recoil': {
      label: 'Research → Recoil',
      desc: 'Research user upgrades to Recoil',
      sections: ['recoil']
    },
    'upgrade-research-terminal': {
      label: 'Research → Terminal',
      desc: 'Research user upgrades to Terminal',
      sections: ['recoil', 'terminal']
    },
    'upgrade-research-suite': {
      label: 'Research → Suite',
      desc: 'Research user upgrades to Suite',
      sections: ['recoil', 'terminal', 'suite']
    },
    'upgrade-recoil-terminal': {
      label: 'Recoil → Terminal',
      desc: 'Recoil user upgrades to Terminal',
      sections: ['terminal']
    },
    'upgrade-recoil-suite': {
      label: 'Recoil → Suite',
      desc: 'Recoil user upgrades to Suite',
      sections: ['terminal', 'suite']
    },
    'upgrade-terminal-suite': {
      label: 'Terminal → Suite',
      desc: 'Terminal user upgrades to Suite',
      sections: ['suite']
    }
  };

  /**
   * Initialize the dev tool (only renders if admin)
   */
  function init() {
    // Check tier - only render for admin
    // This check happens client-side but the element is never added to DOM for non-admins
    if (typeof userTier === 'undefined' || userTier !== 'admin') {
      console.log('QPTourDevTool: Not admin, skipping render');
      return;
    }
    
    render();
  }

  /**
   * Render the dev tool button and menu
   */
  function render() {
    if (isRendered) return;
    
    // Create container
    const container = document.createElement('div');
    container.id = 'tour-dev-tool';
    container.innerHTML = `
      <style>
        #tour-dev-tool {
          position: fixed;
          top: 12px;
          right: 180px;
          z-index: 9000;
        }
        #tour-dev-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(99,102,241,0.3);
        }
        #tour-dev-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(99,102,241,0.4);
        }
        #tour-dev-btn svg {
          width: 20px;
          height: 20px;
        }
        #tour-dev-menu {
          position: absolute;
          top: 48px;
          right: 0;
          width: 320px;
          background: var(--surface, #1a1a1f);
          border: 1px solid var(--border, #333);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          display: none;
          overflow: hidden;
        }
        #tour-dev-menu.open {
          display: block;
        }
        #tour-dev-menu .menu-header {
          padding: 16px;
          border-bottom: 1px solid var(--border, #333);
          background: var(--surface-raised, #222);
        }
        #tour-dev-menu .menu-header h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-1, #fff);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #tour-dev-menu .menu-header h4 span {
          font-size: 10px;
          padding: 2px 6px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 4px;
          color: #fff;
          font-weight: 500;
        }
        #tour-dev-menu .menu-header p {
          margin: 0;
          font-size: 11px;
          color: var(--text-3, #666);
        }
        #tour-dev-menu .menu-section {
          padding: 12px;
        }
        #tour-dev-menu .menu-section-title {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-3, #666);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          padding: 0 4px;
        }
        #tour-dev-menu .tour-option {
          display: block;
          width: 100%;
          padding: 10px 12px;
          background: var(--surface-raised, #222);
          border: 1px solid var(--border, #333);
          border-radius: 8px;
          margin-bottom: 6px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }
        #tour-dev-menu .tour-option:hover {
          border-color: var(--gold, #c9a84c);
          background: rgba(201,168,76,0.05);
        }
        #tour-dev-menu .tour-option .option-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-1, #fff);
          margin-bottom: 2px;
        }
        #tour-dev-menu .tour-option .option-desc {
          font-size: 11px;
          color: var(--text-3, #666);
        }
        #tour-dev-menu .tour-option .option-sections {
          font-size: 10px;
          color: var(--gold, #c9a84c);
          font-family: var(--mono, monospace);
          margin-top: 4px;
        }
      </style>
      
      <button id="tour-dev-btn" onclick="QPTourDevTool.toggleMenu()" title="Tour Dev Tool">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
      </button>
      
      <div id="tour-dev-menu">
        <div class="menu-header">
          <h4>Tour Testing <span>DEV</span></h4>
          <p>Test any onboarding sequence without real signup/upgrade events</p>
        </div>
        
        <div class="menu-section">
          <div class="menu-section-title">New Signup Paths</div>
          ${renderOptions(['new-research', 'new-recoil', 'new-terminal', 'new-suite'])}
        </div>
        
        <div class="menu-section" style="border-top: 1px solid var(--border, #333);">
          <div class="menu-section-title">Upgrade Paths</div>
          ${renderOptions([
            'upgrade-research-recoil', 'upgrade-research-terminal', 'upgrade-research-suite',
            'upgrade-recoil-terminal', 'upgrade-recoil-suite', 'upgrade-terminal-suite'
          ])}
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    isRendered = true;
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target) && menuOpen) {
        closeMenu();
      }
    });
  }

  /**
   * Render tour option buttons
   */
  function renderOptions(keys) {
    return keys.map(key => {
      const seq = TEST_SEQUENCES[key];
      return `
        <button class="tour-option" onclick="QPTourDevTool.runSequence('${key}')">
          <div class="option-label">${seq.label}</div>
          <div class="option-desc">${seq.desc}</div>
          <div class="option-sections">${seq.sections.join(' → ')}</div>
        </button>
      `;
    }).join('');
  }

  /**
   * Toggle menu visibility
   */
  function toggleMenu() {
    menuOpen = !menuOpen;
    document.getElementById('tour-dev-menu')?.classList.toggle('open', menuOpen);
  }

  /**
   * Close menu
   */
  function closeMenu() {
    menuOpen = false;
    document.getElementById('tour-dev-menu')?.classList.remove('open');
  }

  /**
   * Run a specific test sequence
   */
  async function runSequence(key) {
    const seq = TEST_SEQUENCES[key];
    if (!seq) {
      console.error('QPTourDevTool: Unknown sequence', key);
      return;
    }
    
    closeMenu();
    
    console.log(`QPTourDevTool: Running sequence "${key}":`, seq.sections);
    
    // Initialize tour with forced sequence
    const hasSteps = await QPTour.init(userTier, seq.sections);
    if (hasSteps) {
      await QPTour.start();
    } else {
      showToast('No steps to play for this sequence', 'warning');
    }
  }

  // Public API
  return {
    init,
    toggleMenu,
    closeMenu,
    runSequence
  };
})();

// Initialize after auth is ready
// The init function checks tier and only renders for admin
document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth to be ready
  setTimeout(() => {
    if (typeof userTier !== 'undefined') {
      QPTourDevTool.init();
    }
  }, 1000);
});
