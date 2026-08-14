// Shared theme toggle for research papers
// Syncs with main site localStorage

(function() {
  // Get saved theme or default to dark (papers are dark by default)
  const savedTheme = localStorage.getItem('qp-theme') || 'dark';
  
  // Apply theme
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // Create toggle button
  const toggle = document.createElement('button');
  toggle.className = 'theme-toggle';
  toggle.setAttribute('aria-label', 'Toggle theme');
  toggle.innerHTML = `
    <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
    <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  `;
  
  toggle.onclick = function() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme === 'light' ? 'light' : '');
    localStorage.setItem('qp-theme', newTheme);
  };
  
  // Add styles for toggle
  const style = document.createElement('style');
  style.textContent = `
    .theme-toggle {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--panel, #111317);
      border: 1px solid var(--line, #22262d);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.2s;
    }
    .theme-toggle:hover {
      border-color: var(--gold, #c9a84c);
      transform: scale(1.05);
    }
    .theme-toggle svg {
      width: 20px;
      height: 20px;
      color: var(--dim, #7c848f);
    }
    .theme-toggle .sun { display: block; }
    .theme-toggle .moon { display: none; }
    [data-theme="light"] .theme-toggle .sun { display: none; }
    [data-theme="light"] .theme-toggle .moon { display: block; }
    [data-theme="light"] .theme-toggle {
      background: #fff;
      border-color: #ddd;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    /* Light mode overrides */
    [data-theme="light"] {
      --ink: #fafafa;
      --panel: #ffffff;
      --line: #e5e5e5;
      --body: #444;
      --dim: #888;
      --white: #1a1a1a;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(toggle);
})();
