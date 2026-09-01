/**
 * Quant Prime Theme Toggle
 * Syncs theme across site and dashboard
 * Skip on dashboard (has its own theme system)
 */

(function() {
  'use strict';

  // Skip on main dashboard - it has its own theme toggle
  // But allow on login/register/reset-password pages
  if (window.location.pathname === '/dashboard/' || 
      window.location.pathname === '/dashboard/index.html' ||
      window.location.pathname.includes('/dashboard/billing')) {
    return;
  }

  const STORAGE_KEY = 'qp-theme';

  // Get current theme
  function getTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply theme to document
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }

  // Save and apply theme
  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  // Toggle theme
  function toggleTheme() {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }

  // Create toggle button
  function createToggleButton() {
    if (document.getElementById('qp-theme-toggle')) return;
    
    const btn = document.createElement('button');
    btn.id = 'qp-theme-toggle';
    btn.setAttribute('aria-label', 'Toggle theme');
    
    // Styles
    const style = document.createElement('style');
    style.textContent = `
      #qp-theme-toggle {
        position: fixed;
        bottom: 100px;
        right: 24px;
        z-index: 99998;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid var(--gold, #b8962e);
        background: var(--surface, #141419);
        backdrop-filter: blur(10px);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        color: var(--gold, #b8962e);
        padding: 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      
      #qp-theme-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      }
      
      [data-theme="light"] #qp-theme-toggle {
        border-color: var(--gold, #b8962e);
        background: var(--surface, #ffffff);
        color: var(--gold, #b8962e);
      }
      
      [data-theme="light"] #qp-theme-toggle:hover {
        transform: scale(1.1);
      }
      
      #qp-theme-toggle svg {
        width: 22px;
        height: 22px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      
      /* Theme CSS variables for main site */
      :root, [data-theme="dark"] {
        --qp-bg: #0a0a0f;
        --qp-surface: #141419;
        --qp-surface-2: #1c1c24;
        --qp-border: #2a2a35;
        --qp-text: #fafafa;
        --qp-text-dim: #a1a1aa;
      }
      
      [data-theme="light"] {
        --qp-bg: #fafaf8;
        --qp-surface: #ffffff;
        --qp-surface-2: #f2f1ed;
        --qp-border: #e8e6e0;
        --qp-text: #1a1a1a;
        --qp-text-dim: #6b6b6b;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(btn);
    
    // Update icon based on current theme
    function updateIcon() {
      const theme = getTheme();
      if (theme === 'dark') {
        // Show sun icon (click to go light)
        btn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      } else {
        // Show moon icon (click to go dark)
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      }
    }
    
    updateIcon();
    
    btn.addEventListener('click', () => {
      toggleTheme();
      updateIcon();
    });
  }

  // Listen for storage changes (sync across tabs)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      applyTheme(e.newValue);
    }
  });

  // Initialize
  function init() {
    applyTheme(getTheme());
    createToggleButton();
  }

  // Expose global functions
  window.qpTheme = { getTheme, setTheme, toggleTheme };

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
