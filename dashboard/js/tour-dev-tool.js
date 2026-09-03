/**
 * QP Tour Dev Testing Tool v4
 * 
 * Admin-only tool for testing all tour paths:
 * - New signups at each tier
 * - Upgrades between tiers
 * - Reset progress for fresh testing
 * 
 * Works with tour-engine v20+
 */

const QPTourDevTool = (function() {
  'use strict';

  let isRendered = false;
  let menuOpen = false;

  // All test sequences - new signups and upgrades
  const TEST_SEQUENCES = {
    // New Signups
    'new-research': { 
      label: 'New → Research', 
      sections: ['research'],
      description: 'First-time Research tier signup'
    },
    'new-recoil': { 
      label: 'New → Recoil', 
      sections: ['research', 'recoil'],
      description: 'First-time Recoil tier signup'
    },
    'new-terminal': { 
      label: 'New → Terminal', 
      sections: ['research', 'recoil', 'terminal'],
      description: 'First-time Terminal tier signup'
    },
    'new-suite': { 
      label: 'New → Suite', 
      sections: ['research', 'recoil', 'terminal', 'suite'],
      description: 'First-time Suite tier signup (full tour)'
    },
    
    // Upgrades from Research
    'upgrade-research-recoil': { 
      label: 'Research → Recoil', 
      sections: ['recoil'],
      description: 'Shows only Recoil build menu'
    },
    'upgrade-research-terminal': { 
      label: 'Research → Terminal', 
      sections: ['recoil', 'terminal'],
      description: 'Shows Recoil + Terminal build menus'
    },
    'upgrade-research-suite': { 
      label: 'Research → Suite', 
      sections: ['recoil', 'terminal', 'suite'],
      description: 'Shows Recoil + Terminal + Suite'
    },
    
    // Upgrades from Recoil
    'upgrade-recoil-terminal': { 
      label: 'Recoil → Terminal', 
      sections: ['terminal'],
      description: 'Shows only Terminal build menu'
    },
    'upgrade-recoil-suite': { 
      label: 'Recoil → Suite', 
      sections: ['terminal', 'suite'],
      description: 'Shows Terminal + Suite build menus'
    },
    
    // Upgrades from Terminal
    'upgrade-terminal-suite': { 
      label: 'Terminal → Suite', 
      sections: ['suite'],
      description: 'Shows only Suite build menu'
    }
  };

  function init() {
    // Only show for admin users
    if (typeof userTier === 'undefined' || userTier !== 'admin') return;
    render();
  }

  function render() {
    if (isRendered) return;
    
    const container = document.createElement('div');
    container.id = 'tour-dev-tool';
    container.innerHTML = `
      <style>
        #tour-dev-tool {
          position: fixed;
          top: 12px;
          right: 130px;
          z-index: 9000;
          font-family: 'Inter', -apple-system, system-ui, sans-serif;
        }
        
        @media (max-width: 650px) {
          #tour-dev-tool {
            right: 60px;
            top: auto;
            bottom: 80px;
          }
        }
        
        #tour-dev-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        #tour-dev-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(99,102,241,0.5);
        }
        
        #tour-dev-btn:active {
          transform: scale(0.95);
          transition-duration: 0.1s;
        }
        
        #tour-dev-btn svg {
          width: 20px;
          height: 20px;
        }
        
        #tour-dev-menu {
          position: absolute;
          top: 48px;
          right: 0;
          width: 280px;
          background: #14141a;
          border: 1px solid #2a2a35;
          border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
          display: none;
          max-height: 75vh;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        
        #tour-dev-menu.open { display: block; animation: menuSlideIn 0.25s ease; }
        
        @keyframes menuSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 650px) {
          #tour-dev-menu {
            position: fixed;
            bottom: 130px;
            top: auto;
            right: 12px;
            left: 12px;
            width: auto;
            max-height: 55vh;
          }
        }
        
        .dev-menu-header {
          padding: 16px;
          border-bottom: 1px solid #2a2a35;
          background: #1a1a22;
          border-radius: 14px 14px 0 0;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        
        .dev-menu-header h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .dev-menu-header .version-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          padding: 3px 6px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        
        .dev-menu-actions {
          padding: 12px 16px;
          border-bottom: 1px solid #2a2a35;
          display: flex;
          gap: 8px;
        }
        
        .dev-menu-actions button {
          flex: 1;
          padding: 8px 12px;
          background: #252530;
          border: 1px solid #333;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .dev-menu-actions button:hover {
          border-color: #c9a84c;
          background: rgba(201,168,76,0.1);
        }
        
        .dev-menu-actions button.danger {
          color: #f87171;
        }
        
        .dev-menu-actions button.danger:hover {
          border-color: #f87171;
          background: rgba(248,113,113,0.1);
        }
        
        .dev-menu-section {
          padding: 8px;
        }
        
        .dev-menu-label {
          font-size: 9px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 8px 12px 6px;
        }
        
        .dev-tour-btn {
          display: block;
          width: 100%;
          padding: 12px 14px;
          background: #1f1f28;
          border: 1px solid #2a2a35;
          border-radius: 10px;
          margin-bottom: 6px;
          cursor: pointer;
          text-align: left;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .dev-tour-btn:hover {
          border-color: #c9a84c;
          background: rgba(201,168,76,0.08);
          transform: translateX(2px);
        }
        
        .dev-tour-btn:active {
          transform: translateX(0) scale(0.99);
        }
        
        .dev-tour-btn .seq {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #c9a84c;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .dev-tour-btn .seq::before {
          content: '→';
          color: #666;
        }
        
        .dev-tour-btn .desc {
          font-size: 10px;
          color: #666;
          margin-top: 4px;
        }
        
        .dev-status {
          padding: 12px 16px;
          border-top: 1px solid #2a2a35;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #666;
        }
        
        .dev-status strong {
          color: #c9a84c;
        }
      </style>
      
      <button id="tour-dev-btn" title="Tour Dev Tool (Admin Only)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
      </button>
      
      <div id="tour-dev-menu">
        <div class="dev-menu-header">
          <h4>
            Tour Testing 
            <span class="version-badge">v20</span>
          </h4>
        </div>
        
        <div class="dev-menu-actions">
          <button onclick="QPTourDevTool.resetProgress()">Reset Progress</button>
          <button onclick="QPTourDevTool.showCurrentProgress()">Check Progress</button>
        </div>
        
        <div class="dev-menu-section">
          <div class="dev-menu-label">🆕 New Signups</div>
          ${['new-research', 'new-recoil', 'new-terminal', 'new-suite'].map(k => `
            <button class="dev-tour-btn" data-seq="${k}">
              ${TEST_SEQUENCES[k].label}
              <div class="seq">${TEST_SEQUENCES[k].sections.join(' → ')}</div>
              <div class="desc">${TEST_SEQUENCES[k].description}</div>
            </button>
          `).join('')}
        </div>
        
        <div class="dev-menu-section" style="border-top: 1px solid #2a2a35;">
          <div class="dev-menu-label">⬆️ Upgrades</div>
          ${['upgrade-research-recoil', 'upgrade-research-terminal', 'upgrade-research-suite', 
             'upgrade-recoil-terminal', 'upgrade-recoil-suite', 'upgrade-terminal-suite'].map(k => `
            <button class="dev-tour-btn" data-seq="${k}">
              ${TEST_SEQUENCES[k].label}
              <div class="seq">${TEST_SEQUENCES[k].sections.join(' → ')}</div>
              <div class="desc">${TEST_SEQUENCES[k].description}</div>
            </button>
          `).join('')}
        </div>
        
        <div class="dev-status" id="dev-tour-status">
          Status: Ready
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    isRendered = true;
    
    // Events
    container.querySelector('#tour-dev-btn').onclick = toggleMenu;
    container.querySelectorAll('.dev-tour-btn').forEach(btn => {
      btn.onclick = () => runSequence(btn.dataset.seq);
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target) && menuOpen) closeMenu();
    });
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
    document.getElementById('tour-dev-menu')?.classList.toggle('open', menuOpen);
    if (menuOpen) updateStatus();
  }

  function closeMenu() {
    menuOpen = false;
    document.getElementById('tour-dev-menu')?.classList.remove('open');
  }

  function updateStatus(msg) {
    const status = document.getElementById('dev-tour-status');
    if (status) {
      status.innerHTML = msg || `Status: <strong>Ready</strong> | Tier: <strong>${userTier || 'unknown'}</strong>`;
    }
  }

  async function runSequence(key) {
    const seq = TEST_SEQUENCES[key];
    if (!seq) return;
    
    closeMenu();
    updateStatus(`Running: <strong>${seq.label}</strong>...`);
    
    try {
      const hasSteps = await QPTour.init(userTier, seq.sections);
      if (hasSteps) {
        await QPTour.start();
        updateStatus(`Running: <strong>${seq.label}</strong>`);
      } else {
        updateStatus(`No steps to show for ${seq.label}`);
      }
    } catch (e) {
      console.error('QPTourDevTool: Error running sequence', e);
      updateStatus(`Error: ${e.message}`);
    }
  }

  async function resetProgress() {
    closeMenu();
    
    try {
      await QPTour.resetProgress();
      updateStatus('Progress <strong>reset</strong> — ready for fresh test');
      
      if (typeof showToast === 'function') {
        showToast('Tour progress reset', 'success');
      }
    } catch (e) {
      console.error('QPTourDevTool: Error resetting progress', e);
      updateStatus(`Error: ${e.message}`);
    }
  }

  async function showCurrentProgress() {
    try {
      const local = JSON.parse(localStorage.getItem('qp_tour_progress') || '[]');
      const completed = local.length > 0 ? local.join(', ') : 'none';
      
      updateStatus(`Completed: <strong>${completed}</strong>`);
      
      if (typeof showToast === 'function') {
        showToast(`Completed sections: ${completed}`, 'info');
      }
    } catch (e) {
      updateStatus('Error checking progress');
    }
  }

  return { 
    init, 
    toggleMenu, 
    closeMenu, 
    runSequence,
    resetProgress,
    showCurrentProgress
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => QPTourDevTool.init(), 1200);
});
