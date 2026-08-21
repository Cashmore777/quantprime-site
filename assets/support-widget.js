/**
 * Quant Prime Support Widget
 * Persistent support chat that appears on all pages
 * Context-aware with preset messages based on current page
 */

(function() {
  'use strict';

  // Page context presets
  const PAGE_PRESETS = {
    'dashboard': {
      title: 'Dashboard Help',
      presets: [
        { text: 'How do I read my portfolio stats?', category: 'general' },
        { text: 'What do the tier benefits include?', category: 'tiers' },
        { text: 'How do I upgrade my subscription?', category: 'billing' },
        { text: 'I need help with something else', category: 'other' }
      ]
    },
    'research': {
      title: 'Research Help',
      presets: [
        { text: 'How do I use the Build menu?', category: 'build' },
        { text: 'What does each course do?', category: 'build' },
        { text: 'How do I read the menu codes?', category: 'build' },
        { text: 'I need help with something else', category: 'other' }
      ]
    },
    'recoil': {
      title: 'Recoil Indicator Help',
      presets: [
        { text: 'How do I add Recoil to TradingView?', category: 'setup' },
        { text: 'What are the best trading hours for Recoil?', category: 'usage' },
        { text: 'My Recoil access isn\'t working', category: 'access' },
        { text: 'What lot size should I use?', category: 'usage' },
        { text: 'I need help with something else', category: 'other' }
      ]
    },
    'meridian': {
      title: 'Meridian Indicator Help',
      presets: [
        { text: 'How do I add Meridian to TradingView?', category: 'setup' },
        { text: 'What are the best trading hours for Meridian?', category: 'usage' },
        { text: 'My Meridian access isn\'t working', category: 'access' },
        { text: 'What lot size should I use?', category: 'usage' },
        { text: 'I need help with something else', category: 'other' }
      ]
    },
    'community': {
      title: 'Community Help',
      presets: [
        { text: 'How do I access the Discord?', category: 'access' },
        { text: 'How do I chat with other members?', category: 'community' },
        { text: 'I need help with something else', category: 'other' }
      ]
    },
    'build': {
      title: 'Build Menu Help',
      presets: [
        { text: 'How does the menu system work?', category: 'build' },
        { text: 'What do Starter/Main/Side/Dessert mean?', category: 'build' },
        { text: 'How do I copy my configuration?', category: 'build' },
        { text: 'I need help with something else', category: 'other' }
      ]
    },
    'billing': {
      title: 'Billing Help',
      presets: [
        { text: 'How do I upgrade my tier?', category: 'billing' },
        { text: 'How do I update my payment method?', category: 'billing' },
        { text: 'How do I cancel my subscription?', category: 'billing' },
        { text: 'I was charged incorrectly', category: 'billing' },
        { text: 'I need help with something else', category: 'other' }
      ]
    },
    'affiliates': {
      title: 'Affiliate Help',
      presets: [
        { text: 'How does the affiliate program work?', category: 'affiliate' },
        { text: 'How do I get my affiliate link?', category: 'affiliate' },
        { text: 'When do I get paid?', category: 'affiliate' },
        { text: 'I need help with something else', category: 'other' }
      ]
    },
    'free-guide': {
      title: 'Free Guide Help',
      presets: [
        { text: 'How do I download the guide?', category: 'guide' },
        { text: 'What\'s included in the manifesto?', category: 'guide' },
        { text: 'How do I get started after reading?', category: 'guide' },
        { text: 'I need help with something else', category: 'other' }
      ]
    },
    'default': {
      title: 'Support',
      presets: [
        { text: 'I need help getting started', category: 'general' },
        { text: 'I have a billing question', category: 'billing' },
        { text: 'I have a technical issue', category: 'technical' },
        { text: 'I need help with something else', category: 'other' }
      ]
    }
  };

  // Auto-responses for common questions
  const AUTO_RESPONSES = {
    'setup': {
      'recoil': `To add Recoil to TradingView:
1. Open TradingView and go to Indicators
2. Search for "Quant Prime Recoil"
3. If you don't see it, your username may not be added yet
4. Contact support with your TradingView username

Best hours (UTC): 07:00-09:00, 13:00-14:00, 19:00-20:00
Recommended lot: 0.02 for accounts under £1k`,
      'meridian': `To add Meridian to TradingView:
1. Open TradingView and go to Indicators
2. Search for "Quant Prime Meridian"  
3. If you don't see it, your username may not be added yet
4. Contact support with your TradingView username

Best hours (UTC): 00:00-02:00, 04:00-06:00, 19:00-20:00
Recommended lot: 0.01 for accounts under £1k`
    },
    'billing': `For billing questions:
• Upgrade: Visit your dashboard and click "Upgrade"
• Payment update: Go to Account Settings > Billing
• Cancel: Account Settings > Manage Subscription
• Refunds: Contact support@quantprime.uk`
  };

  // Detect current page context
  function detectPage() {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    
    // Check URL params first (dashboard views)
    if (search.includes('view=')) {
      const viewMatch = search.match(/view=([^&]+)/);
      if (viewMatch) {
        const view = viewMatch[1].replace('view-', '');
        if (PAGE_PRESETS[view]) return view;
      }
    }
    
    // Check hash
    if (hash) {
      const hashView = hash.replace('#', '').replace('view-', '');
      if (PAGE_PRESETS[hashView]) return hashView;
    }
    
    // Check path
    if (path.includes('free-guide')) return 'free-guide';
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('recoil')) return 'recoil';
    if (path.includes('meridian')) return 'meridian';
    if (path.includes('terminal')) return 'dashboard';
    if (path.includes('suite')) return 'dashboard';
    
    return 'default';
  }

  // Create widget HTML
  function createWidget() {
    const pageContext = detectPage();
    const config = PAGE_PRESETS[pageContext] || PAGE_PRESETS['default'];
    
    const widget = document.createElement('div');
    widget.id = 'qp-support-widget';
    widget.innerHTML = `
      <style>
        #qp-support-widget {
          --sw-blue: #3b82f6;
          --sw-gold: #f59e0b;
          --sw-dark: #0a0a0f;
          --sw-surface: #18181b;
          --sw-border: #27272a;
          --sw-text: #fafafa;
          --sw-text-dim: #a1a1aa;
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99999;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        
        .sw-toggle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--sw-blue), var(--sw-gold));
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 24px rgba(59, 130, 246, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .sw-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 32px rgba(59, 130, 246, 0.5);
        }
        
        .sw-toggle svg {
          width: 28px;
          height: 28px;
          fill: white;
        }
        
        .sw-toggle.open svg.icon-chat { display: none; }
        .sw-toggle:not(.open) svg.icon-close { display: none; }
        
        .sw-panel {
          position: absolute;
          bottom: 72px;
          right: 0;
          width: 360px;
          max-height: 500px;
          background: var(--sw-surface);
          border: 1px solid var(--sw-border);
          border-radius: 16px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.5);
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        
        .sw-panel.open { display: flex; }
        
        .sw-header {
          padding: 20px;
          background: linear-gradient(135deg, var(--sw-blue), #2563eb);
          color: white;
        }
        
        .sw-header h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }
        
        .sw-header .sw-context {
          font-size: 13px;
          opacity: 0.85;
        }
        
        .sw-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        
        .sw-presets {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .sw-preset {
          padding: 14px 16px;
          background: var(--sw-dark);
          border: 1px solid var(--sw-border);
          border-radius: 10px;
          color: var(--sw-text);
          font-size: 14px;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.2s, background 0.2s;
        }
        
        .sw-preset:hover {
          border-color: var(--sw-blue);
          background: rgba(59, 130, 246, 0.1);
        }
        
        .sw-response {
          margin-top: 16px;
          padding: 16px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.6;
          color: var(--sw-text);
          white-space: pre-wrap;
        }
        
        .sw-footer {
          padding: 16px;
          border-top: 1px solid var(--sw-border);
          display: flex;
          gap: 8px;
        }
        
        .sw-input {
          flex: 1;
          padding: 12px 14px;
          background: var(--sw-dark);
          border: 1px solid var(--sw-border);
          border-radius: 8px;
          color: var(--sw-text);
          font-size: 14px;
          outline: none;
        }
        
        .sw-input:focus { border-color: var(--sw-blue); }
        
        .sw-input::placeholder { color: var(--sw-text-dim); }
        
        .sw-send {
          padding: 12px 16px;
          background: var(--sw-blue);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .sw-send:hover { background: #2563eb; }
        
        .sw-back {
          padding: 8px 12px;
          background: transparent;
          border: 1px solid var(--sw-border);
          border-radius: 6px;
          color: var(--sw-text-dim);
          font-size: 12px;
          cursor: pointer;
          margin-bottom: 12px;
        }
        
        .sw-back:hover { border-color: var(--sw-text-dim); }
        
        @media (max-width: 480px) {
          .sw-panel {
            width: calc(100vw - 48px);
            max-height: 60vh;
          }
        }
      </style>
      
      <button class="sw-toggle" aria-label="Support">
        <svg class="icon-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
        <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
      </button>
      
      <div class="sw-panel">
        <div class="sw-header">
          <h3>${config.title}</h3>
          <div class="sw-context">Page: ${pageContext}</div>
        </div>
        <div class="sw-body">
          <div class="sw-presets">
            ${config.presets.map(p => `<button class="sw-preset" data-category="${p.category}">${p.text}</button>`).join('')}
          </div>
          <div class="sw-response" style="display: none;"></div>
        </div>
        <div class="sw-footer">
          <input type="text" class="sw-input" placeholder="Or type your question...">
          <button class="sw-send">Send</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    
    // Event handlers
    const toggle = widget.querySelector('.sw-toggle');
    const panel = widget.querySelector('.sw-panel');
    const presets = widget.querySelectorAll('.sw-preset');
    const responseDiv = widget.querySelector('.sw-response');
    const presetsDiv = widget.querySelector('.sw-presets');
    const input = widget.querySelector('.sw-input');
    const sendBtn = widget.querySelector('.sw-send');
    
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      panel.classList.toggle('open');
    });
    
    presets.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.textContent;
        const category = btn.dataset.category;
        
        // Check for auto-response
        let response = null;
        if (category === 'setup' && pageContext === 'recoil') {
          response = AUTO_RESPONSES.setup.recoil;
        } else if (category === 'setup' && pageContext === 'meridian') {
          response = AUTO_RESPONSES.setup.meridian;
        } else if (category === 'billing') {
          response = AUTO_RESPONSES.billing;
        } else if (category === 'other') {
          response = `We'll get back to you soon!\n\nIn the meantime:\n• Email: support@quantprime.uk\n• Discord: #support channel\n\nCurrent page: ${pageContext}`;
        }
        
        if (response) {
          presetsDiv.innerHTML = `<button class="sw-back">← Back to options</button>`;
          responseDiv.style.display = 'block';
          responseDiv.textContent = response;
          
          widget.querySelector('.sw-back').addEventListener('click', () => {
            responseDiv.style.display = 'none';
            presetsDiv.innerHTML = config.presets.map(p => 
              `<button class="sw-preset" data-category="${p.category}">${p.text}</button>`
            ).join('');
            // Re-attach handlers
            widget.querySelectorAll('.sw-preset').forEach(b => {
              b.addEventListener('click', () => btn.click());
            });
          });
        }
      });
    });
    
    // Send custom message
    function sendMessage() {
      const msg = input.value.trim();
      if (!msg) return;
      
      responseDiv.style.display = 'block';
      responseDiv.textContent = `Thanks for your message!\n\nWe've received:\n"${msg}"\n\nPage context: ${pageContext}\n\nWe'll respond via email or Discord shortly.`;
      presetsDiv.innerHTML = `<button class="sw-back">← Back to options</button>`;
      input.value = '';
      
      // TODO: Send to backend/Discord webhook
      console.log('Support message:', { page: pageContext, message: msg });
    }
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Update context when URL changes (SPA navigation)
    let lastPath = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastPath) {
        lastPath = window.location.href;
        const newContext = detectPage();
        const newConfig = PAGE_PRESETS[newContext] || PAGE_PRESETS['default'];
        widget.querySelector('.sw-header h3').textContent = newConfig.title;
        widget.querySelector('.sw-context').textContent = `Page: ${newContext}`;
        presetsDiv.innerHTML = newConfig.presets.map(p => 
          `<button class="sw-preset" data-category="${p.category}">${p.text}</button>`
        ).join('');
        responseDiv.style.display = 'none';
      }
    }, 500);
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
