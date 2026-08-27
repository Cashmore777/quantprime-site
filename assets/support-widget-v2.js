/**
 * Quant Prime Support Widget V2
 * - Nested multiple choice (3 levels)
 * - Ticket system with Discord integration
 * - Admin ticket management
 * - Light/dark theme support
 * - No AI tokens - pure automation
 */

(function() {
  'use strict';

  // Discord channel mapping by tier/category
  const DISCORD_CHANNELS = {
    'free-guide': '1540172648909242408',
    'recoil': '1540172705737871491',
    'terminal': '1540172747705950258',
    'suite': '1540172796435636294',
    'full-suite': '1540172796435636294',
    'ascension': '1540173295423590470',
    'tradingview': '1540172859085684737',
    'general': '1540172648909242408' // fallback
  };

  // Nested menu structure (3 levels deep)
  const MENU_STRUCTURE = {
    root: {
      title: 'How can we help?',
      options: [
        { id: 'indicator', label: '📊 Indicator Access', next: 'indicator' },
        { id: 'billing', label: '💳 Billing & Subscription', next: 'billing' },
        { id: 'technical', label: '🔧 Technical Issue', next: 'technical' },
        { id: 'community', label: '💬 Community & Discord', next: 'community' },
        { id: 'other', label: '❓ Something Else', action: 'chat' }
      ]
    },
    indicator: {
      title: 'Indicator Help',
      options: [
        { id: 'add-access', label: 'Add me to an indicator', next: 'indicator-which' },
        { id: 'not-working', label: 'Indicator not showing', next: 'indicator-troubleshoot' },
        { id: 'settings', label: 'Help with settings', next: 'indicator-settings' },
        { id: 'other', label: 'Other indicator issue', action: 'chat' }
      ]
    },
    'indicator-which': {
      title: 'Which indicator?',
      options: [
        { id: 'recoil', label: 'Recoil', action: 'chat', preset: 'Please add my TradingView username to Recoil' },
        { id: 'meridian', label: 'Meridian', action: 'chat', preset: 'Please add my TradingView username to Meridian' },
        { id: 'cockpit', label: 'Cockpit', action: 'chat', preset: 'Please add my TradingView username to Cockpit' },
        { id: 'all', label: 'All of them', action: 'chat', preset: 'Please add my TradingView username to all indicators' }
      ]
    },
    'indicator-troubleshoot': {
      title: 'What\'s happening?',
      options: [
        { id: 'cant-find', label: 'Can\'t find it in TradingView', action: 'auto', response: 'Search for "Quant Prime" in TradingView indicators. If not showing, your username may not be added yet. Please provide your TradingView username below.' },
        { id: 'error', label: 'Shows an error', action: 'chat', preset: 'My indicator shows an error: ' },
        { id: 'not-loading', label: 'Not loading/blank', action: 'auto', response: 'Try: 1) Refresh the page 2) Clear browser cache 3) Check your TradingView subscription is active. Still not working? Describe the issue:' },
        { id: 'other', label: 'Other issue', action: 'chat' }
      ]
    },
    'indicator-settings': {
      title: 'Settings help',
      options: [
        { id: 'lot-size', label: 'Lot size recommendations', action: 'auto', response: 'Recommended lot sizes for accounts under £1k:\n• Recoil: 0.02 base lot\n• Meridian: 0.01 base lot\n\nAdjust based on your risk tolerance. Need more help?' },
        { id: 'hours', label: 'Best trading hours', action: 'auto', response: 'Optimal hours (UTC):\n\n📊 Meridian: 00:00-02:00, 04:00-06:00, 19:00-20:00\n📊 Recoil: 07:00-09:00, 13:00-14:00, 19:00-20:00\n\nNeed more help?' },
        { id: 'customize', label: 'How to customize', action: 'chat', preset: 'I need help customizing my indicator settings: ' },
        { id: 'other', label: 'Other settings question', action: 'chat' }
      ]
    },
    billing: {
      title: 'Billing Help',
      options: [
        { id: 'upgrade', label: 'Upgrade my tier', next: 'billing-upgrade' },
        { id: 'cancel', label: 'Cancel subscription', action: 'auto', response: 'To cancel: Dashboard → Account → Manage Subscription → Cancel\n\nNote: You\'ll keep access until your billing period ends. Need help with something else?' },
        { id: 'payment', label: 'Update payment method', action: 'auto', response: 'To update payment: Dashboard → Account → Manage Subscription → Update Payment\n\nNeed more help?' },
        { id: 'refund', label: 'Request a refund', action: 'chat', preset: 'I would like to request a refund because: ' },
        { id: 'other', label: 'Other billing issue', action: 'chat' }
      ]
    },
    'billing-upgrade': {
      title: 'Upgrade to which tier?',
      options: [
        { id: 'recoil', label: 'Recoil (£28/mo)', action: 'link', url: '/recoil' },
        { id: 'terminal', label: 'Terminal (£58/mo)', action: 'link', url: '/terminal' },
        { id: 'suite', label: 'Full Suite (£88/mo)', action: 'link', url: '/fullsuite' },
        { id: 'ascension', label: 'Ascension (£3,497)', action: 'link', url: '/ascension' }
      ]
    },
    technical: {
      title: 'Technical Issue',
      options: [
        { id: 'login', label: 'Can\'t log in', next: 'technical-login' },
        { id: 'dashboard', label: 'Dashboard not loading', action: 'auto', response: 'Try: 1) Clear browser cache 2) Try incognito mode 3) Try a different browser\n\nStill not working? Describe what you see:' },
        { id: 'mt5', label: 'MT5/EA issue', action: 'chat', preset: 'I\'m having an MT5 issue: ' },
        { id: 'other', label: 'Other technical issue', action: 'chat' }
      ]
    },
    'technical-login': {
      title: 'Login issue',
      options: [
        { id: 'forgot', label: 'Forgot password', action: 'auto', response: 'Click "Forgot Password" on the login page and enter your email. Check spam folder if you don\'t see the reset email. Still stuck?' },
        { id: 'no-email', label: 'Not receiving emails', action: 'chat', preset: 'I\'m not receiving emails. My email is: ' },
        { id: 'error', label: 'Getting an error', action: 'chat', preset: 'Login error I\'m seeing: ' },
        { id: 'other', label: 'Other login issue', action: 'chat' }
      ]
    },
    community: {
      title: 'Community Help',
      options: [
        { id: 'discord', label: 'Discord access', action: 'auto', response: 'Discord invite: discord.gg/EAHKwd7HvX\n\nMake sure you\'re logged into the dashboard first to get your role assigned. Need more help?' },
        { id: 'chat', label: 'Dashboard chat help', action: 'chat', preset: 'I need help with dashboard chat: ' },
        { id: 'other', label: 'Other community question', action: 'chat' }
      ]
    }
  };

  // State
  let currentMenu = 'root';
  let menuHistory = [];
  let userInfo = { name: '', email: '', tier: 'unknown', isLoggedIn: false, isAdmin: false };
  let tickets = [];
  let unreadCount = 0;

  // Detect theme
  function getTheme() {
    return localStorage.getItem('qp-theme') || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  // Get user info from auth if available
  function detectUserInfo() {
    try {
      const authData = localStorage.getItem('qp-auth') || localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        const user = parsed?.currentSession?.user || parsed?.user || parsed;
        if (user?.email) {
          userInfo.email = user.email;
          userInfo.isLoggedIn = true;
          userInfo.tier = user?.user_metadata?.tier || localStorage.getItem('qp-tier') || 'unknown';
          userInfo.isAdmin = ['admin', 'ceo', 'founder'].includes((userInfo.tier || '').toLowerCase()) ||
                            user.email === 'cash@themoneyprinter.uk' ||
                            user.email === 'seandavies41@gmail.com';
        }
      }
    } catch (e) {}
    return userInfo;
  }

  // Generate ticket number
  function generateTicketNumber() {
    const date = new Date();
    const prefix = 'QP';
    const timestamp = date.getFullYear().toString().slice(-2) + 
                     String(date.getMonth() + 1).padStart(2, '0') +
                     String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}-${random}`;
  }

  // Determine Discord channel based on user tier
  function getDiscordChannel(category) {
    const tier = (userInfo.tier || '').toLowerCase();
    
    if (category === 'tradingview') return DISCORD_CHANNELS.tradingview;
    if (tier.includes('ascension')) return DISCORD_CHANNELS.ascension;
    if (tier.includes('suite') || tier.includes('full')) return DISCORD_CHANNELS.suite;
    if (tier.includes('terminal')) return DISCORD_CHANNELS.terminal;
    if (tier.includes('recoil')) return DISCORD_CHANNELS.recoil;
    if (tier.includes('free') || tier === 'unknown') return DISCORD_CHANNELS['free-guide'];
    
    return DISCORD_CHANNELS.general;
  }

  // Submit ticket
  async function submitTicket(message, category = 'general') {
    const ticketNumber = generateTicketNumber();
    const channelId = getDiscordChannel(category);
    
    const ticket = {
      ticketNumber,
      email: userInfo.email,
      name: userInfo.name,
      tier: userInfo.tier,
      category,
      message,
      menuPath: menuHistory.join(' → '),
      status: 'open',
      createdAt: new Date().toISOString(),
      page: window.location.pathname
    };

    try {
      // Send to backend
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ticket, channelId })
      });
      
      if (!response.ok) throw new Error('Failed to submit ticket');
      
      return { success: true, ticketNumber };
    } catch (e) {
      console.error('Ticket submission error:', e);
      // Fallback: still show success to user, log error
      return { success: true, ticketNumber, error: e.message };
    }
  }

  // Load admin tickets
  async function loadTickets() {
    if (!userInfo.isAdmin) return;
    
    try {
      const response = await fetch('/api/support/tickets');
      if (response.ok) {
        const data = await response.json();
        tickets = data.tickets || [];
        unreadCount = tickets.filter(t => t.status === 'open' && !t.read).length;
        updateBadge();
      }
    } catch (e) {
      console.error('Failed to load tickets:', e);
    }
  }

  // Update unread badge
  function updateBadge() {
    const badge = document.getElementById('sw-badge');
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
  }

  // Create widget HTML
  function createWidget() {
    detectUserInfo();
    const theme = getTheme();
    
    const widget = document.createElement('div');
    widget.id = 'qp-support-widget';
    widget.className = theme;
    
    // Add dashboard-mode class if on dashboard (hides widget on mobile)
    if (window.location.pathname.includes('/dashboard')) {
      widget.classList.add('dashboard-mode');
    }
    
    widget.innerHTML = `
      <style>
        #qp-support-widget {
          --sw-bg: #0a0a0f;
          --sw-surface: #141419;
          --sw-surface-2: #1c1c24;
          --sw-border: #2a2a35;
          --sw-text: #fafafa;
          --sw-text-dim: #a1a1aa;
          --sw-accent: linear-gradient(135deg, #3b82f6, #8b5cf6, #f59e0b);
          --sw-accent-solid: #3b82f6;
          --sw-gold: #f59e0b;
          --sw-success: #22c55e;
          --sw-error: #ef4444;
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99999;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        
        #qp-support-widget.light {
          --sw-bg: #ffffff;
          --sw-surface: #f8f8f8;
          --sw-surface-2: #f0f0f0;
          --sw-border: #e0e0e0;
          --sw-text: #1a1a1a;
          --sw-text-dim: #666666;
        }
        
        .sw-toggle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--sw-accent);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 24px rgba(59, 130, 246, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        
        .sw-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 32px rgba(59, 130, 246, 0.5);
        }
        
        .sw-toggle svg { width: 28px; height: 28px; fill: white; }
        .sw-toggle.open .icon-chat { display: none; }
        .sw-toggle:not(.open) .icon-close { display: none; }
        
        .sw-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 22px;
          height: 22px;
          background: var(--sw-error);
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
          color: white;
          display: none;
          align-items: center;
          justify-content: center;
        }
        
        .sw-panel {
          position: absolute;
          bottom: 76px;
          right: 0;
          width: 380px;
          max-height: 550px;
          background: var(--sw-surface);
          border: 1px solid var(--sw-border);
          border-radius: 20px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.4);
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        
        .sw-panel.open { display: flex; }
        
        .sw-header {
          padding: 20px;
          background: var(--sw-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .sw-header h3 { font-size: 18px; font-weight: 600; margin: 0; }
        
        .sw-tabs {
          display: flex;
          gap: 8px;
        }
        
        .sw-tab {
          padding: 6px 12px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .sw-tab:hover, .sw-tab.active { background: rgba(255,255,255,0.3); }
        .sw-tab.admin-only { display: ${userInfo.isAdmin ? 'block' : 'none'}; }
        
        .sw-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: var(--sw-bg);
        }
        
        .sw-menu-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--sw-text);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .sw-back {
          padding: 4px 8px;
          background: var(--sw-surface-2);
          border: 1px solid var(--sw-border);
          border-radius: 6px;
          color: var(--sw-text-dim);
          font-size: 12px;
          cursor: pointer;
        }
        
        .sw-back:hover { border-color: var(--sw-accent-solid); }
        
        .sw-options { display: flex; flex-direction: column; gap: 8px; }
        
        .sw-option {
          padding: 14px 16px;
          background: var(--sw-surface);
          border: 1px solid var(--sw-border);
          border-radius: 12px;
          color: var(--sw-text);
          font-size: 14px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .sw-option:hover {
          border-color: var(--sw-accent-solid);
          background: var(--sw-surface-2);
        }
        
        .sw-option::after {
          content: '→';
          color: var(--sw-text-dim);
          font-size: 16px;
        }
        
        .sw-response {
          padding: 16px;
          background: var(--sw-surface-2);
          border: 1px solid var(--sw-border);
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--sw-text);
          white-space: pre-wrap;
          margin-bottom: 16px;
        }
        
        .sw-chat-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .sw-input-group { display: flex; flex-direction: column; gap: 4px; }
        .sw-input-group label { font-size: 12px; color: var(--sw-text-dim); }
        
        .sw-input {
          padding: 12px 14px;
          background: var(--sw-surface);
          border: 1px solid var(--sw-border);
          border-radius: 10px;
          color: var(--sw-text);
          font-size: 14px;
          outline: none;
          width: 100%;
        }
        
        .sw-input:focus { border-color: var(--sw-accent-solid); }
        .sw-input::placeholder { color: var(--sw-text-dim); }
        
        .sw-textarea {
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }
        
        .sw-submit {
          padding: 14px;
          background: var(--sw-accent);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .sw-submit:hover { opacity: 0.9; }
        .sw-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .sw-success {
          text-align: center;
          padding: 32px 16px;
        }
        
        .sw-success-icon {
          width: 64px;
          height: 64px;
          background: var(--sw-success);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 32px;
        }
        
        .sw-success h4 {
          font-size: 18px;
          color: var(--sw-text);
          margin: 0 0 8px;
        }
        
        .sw-success p {
          font-size: 14px;
          color: var(--sw-text-dim);
          margin: 0;
        }
        
        .sw-ticket-number {
          font-family: monospace;
          background: var(--sw-surface-2);
          padding: 8px 16px;
          border-radius: 8px;
          margin: 16px 0;
          font-size: 16px;
          color: var(--sw-gold);
        }
        
        /* Tickets list (admin) */
        .sw-tickets { display: flex; flex-direction: column; gap: 8px; }
        
        .sw-ticket {
          padding: 12px;
          background: var(--sw-surface);
          border: 1px solid var(--sw-border);
          border-radius: 10px;
          cursor: pointer;
        }
        
        .sw-ticket:hover { border-color: var(--sw-accent-solid); }
        .sw-ticket.unread { border-left: 3px solid var(--sw-gold); }
        
        .sw-ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .sw-ticket-id { font-family: monospace; font-size: 12px; color: var(--sw-gold); }
        .sw-ticket-time { font-size: 11px; color: var(--sw-text-dim); }
        .sw-ticket-preview { font-size: 13px; color: var(--sw-text); }
        .sw-ticket-meta { font-size: 11px; color: var(--sw-text-dim); margin-top: 4px; }
        
        .sw-ticket-detail { padding: 16px; }
        .sw-ticket-detail h4 { margin: 0 0 8px; color: var(--sw-gold); font-family: monospace; }
        .sw-ticket-detail p { margin: 8px 0; font-size: 14px; }
        .sw-ticket-detail .label { color: var(--sw-text-dim); font-size: 12px; }
        
        .sw-resolve-btn {
          padding: 10px 16px;
          background: var(--sw-success);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          margin-top: 16px;
        }
        
        .sw-empty {
          text-align: center;
          padding: 32px;
          color: var(--sw-text-dim);
        }
        
        @media (max-width: 480px) {
          .sw-panel { width: calc(100vw - 48px); max-height: 70vh; }
        }
        
        /* Hide on mobile dashboard (nav bar takes this space) */
        @media (max-width: 820px) {
          #qp-support-widget.dashboard-mode {
            display: none !important;
          }
        }
      </style>
      
      <button class="sw-toggle" aria-label="Support">
        <svg class="icon-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
        <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
        <span class="sw-badge" id="sw-badge">0</span>
      </button>
      
      <div class="sw-panel">
        <div class="sw-header">
          <h3>Support</h3>
          <div class="sw-tabs">
            <button class="sw-tab active" data-tab="help">Help</button>
            <button class="sw-tab admin-only" data-tab="tickets">Tickets</button>
          </div>
        </div>
        <div class="sw-body" id="sw-body">
          <!-- Dynamic content -->
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    
    // Event handlers
    const toggle = widget.querySelector('.sw-toggle');
    const panel = widget.querySelector('.sw-panel');
    const tabs = widget.querySelectorAll('.sw-tab');
    
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        renderMenu();
        if (userInfo.isAdmin) loadTickets();
      }
    });
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (tab.dataset.tab === 'tickets') {
          renderTickets();
        } else {
          currentMenu = 'root';
          menuHistory = [];
          renderMenu();
        }
      });
    });
    
    // Initial render
    renderMenu();
    if (userInfo.isAdmin) loadTickets();
  }

  // Render menu
  function renderMenu() {
    const body = document.getElementById('sw-body');
    const menu = MENU_STRUCTURE[currentMenu];
    
    if (!menu) {
      currentMenu = 'root';
      menuHistory = [];
      renderMenu();
      return;
    }
    
    let html = '';
    
    if (currentMenu !== 'root') {
      html += `<button class="sw-back" onclick="window.swBack()">← Back</button>`;
    }
    
    html += `<div class="sw-menu-title">${menu.title}</div>`;
    html += `<div class="sw-options">`;
    
    menu.options.forEach(opt => {
      html += `<button class="sw-option" data-id="${opt.id}" data-next="${opt.next || ''}" data-action="${opt.action || ''}" data-preset="${opt.preset || ''}" data-response="${opt.response || ''}" data-url="${opt.url || ''}">${opt.label}</button>`;
    });
    
    html += `</div>`;
    body.innerHTML = html;
    
    // Attach handlers
    body.querySelectorAll('.sw-option').forEach(btn => {
      btn.addEventListener('click', () => handleOptionClick(btn));
    });
  }

  // Handle option click
  function handleOptionClick(btn) {
    const next = btn.dataset.next;
    const action = btn.dataset.action;
    const preset = btn.dataset.preset;
    const response = btn.dataset.response;
    const url = btn.dataset.url;
    
    menuHistory.push(btn.textContent);
    
    if (next) {
      currentMenu = next;
      renderMenu();
    } else if (action === 'chat') {
      renderChatForm(preset);
    } else if (action === 'auto') {
      renderAutoResponse(response);
    } else if (action === 'link') {
      window.location.href = url;
    }
  }

  // Render auto response with follow-up option
  function renderAutoResponse(response) {
    const body = document.getElementById('sw-body');
    
    body.innerHTML = `
      <button class="sw-back" onclick="window.swBack()">← Back</button>
      <div class="sw-response">${response}</div>
      <div class="sw-options">
        <button class="sw-option" id="sw-need-more">I still need help</button>
        <button class="sw-option" id="sw-resolved">This solved my issue ✓</button>
      </div>
    `;
    
    document.getElementById('sw-need-more').addEventListener('click', () => renderChatForm());
    document.getElementById('sw-resolved').addEventListener('click', () => {
      currentMenu = 'root';
      menuHistory = [];
      renderMenu();
    });
  }

  // Render chat form
  function renderChatForm(preset = '') {
    const body = document.getElementById('sw-body');
    const needsInfo = !userInfo.isLoggedIn;
    
    body.innerHTML = `
      <button class="sw-back" onclick="window.swBack()">← Back</button>
      <div class="sw-chat-form">
        ${needsInfo ? `
          <div class="sw-input-group">
            <label>Your Name</label>
            <input type="text" class="sw-input" id="sw-name" placeholder="Enter your name">
          </div>
          <div class="sw-input-group">
            <label>Email Address</label>
            <input type="email" class="sw-input" id="sw-email" placeholder="Enter your email">
          </div>
        ` : `
          <div style="font-size: 13px; color: var(--sw-text-dim); margin-bottom: 8px;">
            Sending as: ${userInfo.email}
          </div>
        `}
        <div class="sw-input-group">
          <label>How can we help?</label>
          <textarea class="sw-input sw-textarea" id="sw-message" placeholder="Describe your issue...">${preset}</textarea>
        </div>
        <button class="sw-submit" id="sw-send">Send Message</button>
      </div>
    `;
    
    document.getElementById('sw-send').addEventListener('click', handleSubmit);
  }

  // Handle form submit
  async function handleSubmit() {
    const body = document.getElementById('sw-body');
    const nameInput = document.getElementById('sw-name');
    const emailInput = document.getElementById('sw-email');
    const messageInput = document.getElementById('sw-message');
    const submitBtn = document.getElementById('sw-send');
    
    const name = nameInput?.value || userInfo.name;
    const email = emailInput?.value || userInfo.email;
    const message = messageInput.value;
    
    if (!email || !message) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Update userInfo
    userInfo.name = name;
    userInfo.email = email;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    const result = await submitTicket(message, currentMenu);
    
    if (result.success) {
      body.innerHTML = `
        <div class="sw-success">
          <div class="sw-success-icon">✓</div>
          <h4>Message Received!</h4>
          <p>We'll get back to you soon.</p>
          <div class="sw-ticket-number">${result.ticketNumber}</div>
          <p>Save this ticket number for reference.</p>
          <button class="sw-submit" onclick="window.swReset()" style="margin-top: 16px;">Close</button>
        </div>
      `;
    }
  }

  // Render tickets (admin only)
  function renderTickets() {
    const body = document.getElementById('sw-body');
    
    if (tickets.length === 0) {
      body.innerHTML = `<div class="sw-empty">No tickets yet</div>`;
      return;
    }
    
    let html = `<div class="sw-tickets">`;
    
    tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(ticket => {
      const isUnread = ticket.status === 'open' && !ticket.read;
      const time = new Date(ticket.createdAt).toLocaleString();
      
      html += `
        <div class="sw-ticket ${isUnread ? 'unread' : ''}" data-id="${ticket.ticketNumber}">
          <div class="sw-ticket-header">
            <span class="sw-ticket-id">${ticket.ticketNumber}</span>
            <span class="sw-ticket-time">${time}</span>
          </div>
          <div class="sw-ticket-preview">${ticket.message.substring(0, 60)}${ticket.message.length > 60 ? '...' : ''}</div>
          <div class="sw-ticket-meta">${ticket.email} • ${ticket.tier}</div>
        </div>
      `;
    });
    
    html += `</div>`;
    body.innerHTML = html;
    
    // Click handlers
    body.querySelectorAll('.sw-ticket').forEach(el => {
      el.addEventListener('click', () => renderTicketDetail(el.dataset.id));
    });
  }

  // Render ticket detail
  function renderTicketDetail(ticketNumber) {
    const ticket = tickets.find(t => t.ticketNumber === ticketNumber);
    if (!ticket) return;
    
    const body = document.getElementById('sw-body');
    
    body.innerHTML = `
      <button class="sw-back" onclick="window.swShowTickets()">← Back to Tickets</button>
      <div class="sw-ticket-detail">
        <h4>${ticket.ticketNumber}</h4>
        <p class="label">From:</p>
        <p>${ticket.name || 'Unknown'} (${ticket.email})</p>
        <p class="label">Tier:</p>
        <p>${ticket.tier}</p>
        <p class="label">Path:</p>
        <p style="font-size: 12px;">${ticket.menuPath || 'Direct'}</p>
        <p class="label">Message:</p>
        <div class="sw-response">${ticket.message}</div>
        <p class="label">Page:</p>
        <p style="font-size: 12px;">${ticket.page}</p>
        <p class="label">Time:</p>
        <p>${new Date(ticket.createdAt).toLocaleString()}</p>
        ${ticket.status === 'open' ? `
          <button class="sw-resolve-btn" onclick="window.swResolveTicket('${ticket.ticketNumber}')">✓ Mark as Resolved</button>
        ` : `
          <p style="color: var(--sw-success); margin-top: 16px;">✓ Resolved</p>
        `}
      </div>
    `;
    
    // Mark as read
    markTicketRead(ticketNumber);
  }

  // Mark ticket as read
  async function markTicketRead(ticketNumber) {
    try {
      await fetch(`/api/support/ticket/${ticketNumber}/read`, { method: 'POST' });
      const ticket = tickets.find(t => t.ticketNumber === ticketNumber);
      if (ticket) ticket.read = true;
      unreadCount = tickets.filter(t => t.status === 'open' && !t.read).length;
      updateBadge();
    } catch (e) {}
  }

  // Resolve ticket
  window.swResolveTicket = async function(ticketNumber) {
    try {
      await fetch(`/api/support/ticket/${ticketNumber}/resolve`, { method: 'POST' });
      const ticket = tickets.find(t => t.ticketNumber === ticketNumber);
      if (ticket) ticket.status = 'resolved';
      renderTickets();
    } catch (e) {
      console.error('Failed to resolve ticket:', e);
    }
  };

  // Global functions for onclick handlers
  window.swBack = function() {
    menuHistory.pop();
    if (menuHistory.length === 0) {
      currentMenu = 'root';
    } else {
      // Find parent menu
      const lastMenu = currentMenu;
      for (const [key, menu] of Object.entries(MENU_STRUCTURE)) {
        if (menu.options.some(o => o.next === lastMenu)) {
          currentMenu = key;
          break;
        }
      }
    }
    renderMenu();
  };

  window.swReset = function() {
    currentMenu = 'root';
    menuHistory = [];
    renderMenu();
  };

  window.swShowTickets = function() {
    renderTickets();
  };

  // Theme listener
  window.addEventListener('storage', (e) => {
    if (e.key === 'qp-theme') {
      const widget = document.getElementById('qp-support-widget');
      if (widget) {
        widget.className = e.newValue || 'dark';
      }
    }
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
