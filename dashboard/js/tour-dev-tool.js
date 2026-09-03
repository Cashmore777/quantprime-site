/**
 * QP Tour Dev Testing Tool v2
 * 
 * Admin-only. Mobile-responsive.
 */

const QPTourDevTool = (function() {
  'use strict';

  let isRendered = false;
  let menuOpen = false;

  const TEST_SEQUENCES = {
    'new-research': { label: 'New → Research', sections: ['research'] },
    'new-recoil': { label: 'New → Recoil', sections: ['research', 'recoil'] },
    'new-terminal': { label: 'New → Terminal', sections: ['research', 'recoil', 'terminal'] },
    'new-suite': { label: 'New → Suite', sections: ['research', 'recoil', 'terminal', 'suite'] },
    'upgrade-research-recoil': { label: 'Research → Recoil', sections: ['recoil'] },
    'upgrade-research-terminal': { label: 'Research → Terminal', sections: ['recoil', 'terminal'] },
    'upgrade-research-suite': { label: 'Research → Suite', sections: ['recoil', 'terminal', 'suite'] },
    'upgrade-recoil-terminal': { label: 'Recoil → Terminal', sections: ['terminal'] },
    'upgrade-recoil-suite': { label: 'Recoil → Suite', sections: ['terminal', 'suite'] },
    'upgrade-terminal-suite': { label: 'Terminal → Suite', sections: ['suite'] }
  };

  function init() {
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
        }
        @media (max-width: 650px) {
          #tour-dev-tool {
            right: 60px;
            top: auto;
            bottom: 12px;
          }
        }
        
        #tour-dev-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(99,102,241,0.3);
        }
        #tour-dev-btn:hover {
          transform: scale(1.05);
        }
        #tour-dev-btn svg {
          width: 18px;
          height: 18px;
        }
        
        #tour-dev-menu {
          position: absolute;
          top: 44px;
          right: 0;
          width: 240px;
          background: #1a1a1f;
          border: 1px solid #333;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          display: none;
          max-height: 70vh;
          overflow-y: auto;
        }
        #tour-dev-menu.open { display: block; }
        
        @media (max-width: 650px) {
          #tour-dev-menu {
            position: fixed;
            bottom: 56px;
            top: auto;
            right: 12px;
            left: 12px;
            width: auto;
            max-height: 60vh;
          }
        }
        
        .dev-menu-header {
          padding: 12px;
          border-bottom: 1px solid #333;
          background: #222;
          border-radius: 10px 10px 0 0;
          position: sticky;
          top: 0;
        }
        .dev-menu-header h4 {
          margin: 0;
          font-size: 12px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dev-menu-header span {
          font-size: 9px;
          padding: 2px 5px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 3px;
        }
        
        .dev-menu-section {
          padding: 8px;
        }
        .dev-menu-label {
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 8px;
        }
        
        .dev-tour-btn {
          display: block;
          width: 100%;
          padding: 10px 12px;
          background: #252529;
          border: 1px solid #333;
          border-radius: 6px;
          margin-bottom: 4px;
          cursor: pointer;
          text-align: left;
          color: #fff;
          font-size: 12px;
        }
        .dev-tour-btn:hover {
          border-color: #c9a84c;
          background: rgba(201,168,76,0.08);
        }
        .dev-tour-btn .seq {
          font-size: 10px;
          color: #c9a84c;
          font-family: monospace;
          margin-top: 2px;
        }
      </style>
      
      <button id="tour-dev-btn" title="Tour Dev Tool">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
      </button>
      
      <div id="tour-dev-menu">
        <div class="dev-menu-header">
          <h4>Tour Testing <span>DEV</span></h4>
        </div>
        <div class="dev-menu-section">
          <div class="dev-menu-label">New Signups</div>
          ${['new-research', 'new-recoil', 'new-terminal', 'new-suite'].map(k => `
            <button class="dev-tour-btn" data-seq="${k}">
              ${TEST_SEQUENCES[k].label}
              <div class="seq">${TEST_SEQUENCES[k].sections.join(' → ')}</div>
            </button>
          `).join('')}
        </div>
        <div class="dev-menu-section" style="border-top: 1px solid #333;">
          <div class="dev-menu-label">Upgrades</div>
          ${['upgrade-research-recoil', 'upgrade-research-terminal', 'upgrade-research-suite', 'upgrade-recoil-terminal', 'upgrade-recoil-suite', 'upgrade-terminal-suite'].map(k => `
            <button class="dev-tour-btn" data-seq="${k}">
              ${TEST_SEQUENCES[k].label}
              <div class="seq">${TEST_SEQUENCES[k].sections.join(' → ')}</div>
            </button>
          `).join('')}
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
    
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target) && menuOpen) closeMenu();
    });
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
    document.getElementById('tour-dev-menu')?.classList.toggle('open', menuOpen);
  }

  function closeMenu() {
    menuOpen = false;
    document.getElementById('tour-dev-menu')?.classList.remove('open');
  }

  async function runSequence(key) {
    const seq = TEST_SEQUENCES[key];
    if (!seq) return;
    
    closeMenu();
    
    const hasSteps = await QPTour.init(userTier, seq.sections);
    if (hasSteps) {
      await QPTour.start();
    }
  }

  return { init, toggleMenu, closeMenu, runSequence };
})();

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => QPTourDevTool.init(), 1000);
});
