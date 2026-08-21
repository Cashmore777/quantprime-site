/**
 * Quant Prime Theme Toggle
 * Syncs theme across site and dashboard
 */

(function() {
  'use strict';

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
    
    // Also update any iframes (dashboard embeds)
    document.querySelectorAll('iframe').forEach(iframe => {
      try {
        iframe.contentDocument?.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    });
  }

  // Save and apply theme
  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    
    // Dispatch event for other components
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
    // Check if already exists
    if (document.getElementById('qp-theme-toggle')) return;
    
    const btn = document.createElement('button');
    btn.id = 'qp-theme-toggle';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.innerHTML = `
      <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    `;
    
    // Styles
    const style = document.createElement('style');
    style.textContent = `
      #qp-theme-toggle {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.05);
        backdrop-filter: blur(10px);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        color: currentColor;
      }
      
      #qp-theme-toggle:hover {
        background: rgba(255,255,255,0.1);
        transform: scale(1.05);
      }
      
      [data-theme="light"] #qp-theme-toggle {
        border-color: rgba(0,0,0,0.1);
        background: rgba(0,0,0,0.05);
      }
      
      [data-theme="light"] #qp-theme-toggle:hover {
        background: rgba(0,0,0,0.1);
      }
      
      #qp-theme-toggle .sun-icon { display: none; }
      #qp-theme-toggle .moon-icon { display: block; }
      
      [data-theme="light"] #qp-theme-toggle .sun-icon { display: block; }
      [data-theme="light"] #qp-theme-toggle .moon-icon { display: none; }
      
      /* Theme CSS variables */
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
    
    btn.addEventListener('click', toggleTheme);
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
