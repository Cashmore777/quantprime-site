/**
 * QP Dashboard Onboarding Tour Engine v3
 * 
 * Premium onboarding experience with:
 * - Blur overlay (not black) for engaged feel
 * - Feature-focused callouts with emojis
 * - Section badges & progress bar
 * - Emphasis states (feature glow, action pulse)
 * - Visible navigation (opens menus, clicks items)
 * - Keyboard shortcuts (→/Enter/Space = next, Esc = exit)
 * - Scroll-locked during tour
 * - Mobile-responsive with reduced motion support
 */

const QPTour = (function() {
  'use strict';

  // Section order (must be in tier progression order)
  const SECTION_ORDER = ['research', 'recoil', 'terminal', 'suite'];
  
  // Tier to sections mapping
  const TIER_SECTIONS = {
    'free': [],
    'research': ['research'],
    'recoil': ['research', 'recoil'],
    'terminal': ['research', 'recoil', 'terminal'],
    'suite': ['research', 'recoil', 'terminal', 'suite'],
    'ascension': ['research', 'recoil', 'terminal', 'suite'],
    'admin': ['research', 'recoil', 'terminal', 'suite']
  };

  // View to nav item mapping
  const VIEW_NAV_SELECTOR = {
    'research': '[data-view="research"]',
    'recoil': '[data-view="recoil"]',
    'meridian': '[data-view="meridian"]',
    'cockpit': '[data-view="cockpit"]',
    'marketplace': '[data-view="marketplace"]',
    'community': '[data-view="community"]',
    'intelligence': '[data-view="intelligence"]',
    'settings': '[data-view="settings"]'
  };

  // Tour step definitions - engaging, feature-focused callouts
  const TOUR_STEPS = {
    research: [
      // Market Intelligence - the star feature
      {
        id: 'research-intel',
        page: 'research',
        selector: '#view-research .panel[onclick*="intel"]',
        title: '📡 Your Intel Feed',
        content: 'Daily market briefings drop here at 10pm UK. 30 instruments analyzed. Regime shifts, key levels, trade setups — all archived.',
        position: 'bottom',
        emphasis: 'feature'
      },
      // Research Papers - the education
      {
        id: 'research-papers-intro',
        page: 'research',
        selector: '#papers-carousel',
        title: '📚 The Research Library',
        content: '10 papers that changed how traders think. Real backtests, honest about what doesn\'t work.',
        position: 'top',
        emphasis: 'feature'
      },
      {
        id: 'research-paper-example',
        page: 'research',
        selector: '.paper-slide[data-paper="1"]',
        title: '⚡ Start With This One',
        content: '"The 81.5% Win Rate Paradox" — why most traders lose money despite winning trades. 3 min read.',
        position: 'right',
        emphasis: 'action'
      },
      {
        id: 'research-paper-nav',
        page: 'research',
        selector: '#paper-dots',
        title: '👆 Browse All Papers',
        content: 'Swipe or tap. Topics: position sizing, stop placement, session timing, the lot.',
        position: 'top'
      },
      // Build Menu - the configurator
      {
        id: 'research-tier-card',
        page: 'marketplace',
        selector: '.tier-card[data-tier="research"]',
        title: '🛠️ The Build Menu',
        content: 'This is where you build YOUR indicator. 255 combinations. Pick your ingredients below.',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'research-starter',
        page: 'marketplace',
        selector: '.menu-course[data-course="starter"]',
        title: '1️⃣ Choose Your Foundation',
        content: 'Starters set the base: trend filters, session logic, or volatility modes.',
        position: 'bottom'
      },
      {
        id: 'research-main',
        page: 'marketplace',
        selector: '.menu-course[data-course="main"]',
        title: '2️⃣ Add Core Logic',
        content: 'Mains are your signal engine: reversals, breakouts, or momentum plays.',
        position: 'bottom'
      },
      {
        id: 'research-side',
        page: 'marketplace',
        selector: '.menu-course[data-course="side"]',
        title: '3️⃣ Layer In Context',
        content: 'Sides add confluence: higher timeframe bias, volume profile, or session overlap.',
        position: 'bottom'
      },
      {
        id: 'research-dessert',
        page: 'marketplace',
        selector: '.menu-course[data-course="dessert"]',
        title: '4️⃣ Finish & Generate',
        content: 'Dessert is the final filter. Pick one, hit Generate, get your custom indicator.',
        position: 'top',
        emphasis: 'action'
      }
    ],
    
    recoil: [
      {
        id: 'recoil-animation',
        page: 'recoil',
        selector: '#recoil-animation',
        title: '🎯 Meet Recoil',
        content: 'Measures how far price stretches from equilibrium. Green bands = stretched low (long zone). Red bands = stretched high (short zone).',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'recoil-tv',
        page: 'recoil',
        selector: '#tv-username-recoil',
        title: '🔐 Link Your TradingView',
        content: 'Enter your username EXACTLY as it appears on TradingView. The indicator unlocks in your invite-only scripts within 60 seconds.',
        position: 'bottom',
        interactive: true,
        emphasis: 'action'
      },
      {
        id: 'recoil-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="recoil"]',
        title: '⚡ Recoil Menu Unlocked',
        content: 'New ingredient tier available. 255 volatility-tuned combinations for mean reversion setups.',
        position: 'bottom',
        emphasis: 'feature'
      }
    ],
    
    terminal: [
      {
        id: 'terminal-animation',
        page: 'meridian',
        selector: '#meridian-animation',
        title: '🌐 Meet Meridian',
        content: 'Tracks the AMD cycle in real-time. Accumulation → Manipulation → Distribution. Know which phase you\'re in.',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'terminal-tv',
        page: 'meridian',
        selector: '#tv-username-meridian',
        title: '🔐 Link Your TradingView',
        content: 'Same drill — enter your exact TradingView username. Meridian appears in your invite-only scripts.',
        position: 'bottom',
        interactive: true,
        emphasis: 'action'
      },
      {
        id: 'terminal-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="terminal"]',
        title: '⚡ Terminal Menu Unlocked',
        content: 'AMD-focused combinations now available. 255 ways to trade the cycle.',
        position: 'bottom',
        emphasis: 'feature'
      }
    ],
    
    suite: [
      {
        id: 'suite-animation',
        page: 'cockpit',
        selector: '#cockpit-animation',
        title: '🚀 Meet Cockpit',
        content: 'The full picture. 4 EMAs, liquidity sweeps, FVGs, and a real-time regime score. Everything on one chart.',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'suite-tv',
        page: 'cockpit',
        selector: '#tv-username-cockpit',
        title: '🔐 Link Your TradingView',
        content: 'Final unlock. Enter your username and Cockpit joins your toolkit.',
        position: 'bottom',
        interactive: true,
        emphasis: 'action'
      },
      {
        id: 'suite-performance',
        page: 'cockpit',
        selector: '.suite-tab[data-suite-panel="performance"]',
        title: '📊 Performance Tracker',
        content: 'Upload your MT5 trade history. AI analyzes your edge, finds leaks, suggests fixes. Real feedback, not fluff.',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'suite-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="suite"]',
        title: '👑 Full Menu Unlocked',
        content: 'Every ingredient. Every combination. 255 configs across all instruments. Build whatever you need.',
        position: 'bottom',
        emphasis: 'feature'
      }
    ]
  };

  // Timing constants (ms) - tuned for premium feel
  const TIMING = {
    menuOpen: 350,
    navHighlight: 500,
    navClick: 250,
    pageTransition: 450,
    spotlightMove: 450,
    calloutFade: 350,
    initialDelay: 200  // Delay before first step for smooth entry
  };

  // State
  let isActive = false;
  let currentSection = null;
  let currentStepIndex = 0;
  let sectionsToPlay = [];
  let allSteps = [];
  let completedSections = [];
  let elements = {};
  let savedTheme = null;
  let themeObserver = null;

  /**
   * Initialize tour
   */
  async function init(userTier, forceSequence = null) {
    completedSections = await loadProgress();
    
    if (forceSequence) {
      sectionsToPlay = forceSequence;
    } else {
      const tierSections = TIER_SECTIONS[userTier] || [];
      sectionsToPlay = tierSections.filter(s => !completedSections.includes(s));
    }
    
    if (sectionsToPlay.length === 0) {
      console.log('QPTour: No sections to play');
      return false;
    }
    
    // Build flat step list
    allSteps = [];
    sectionsToPlay.forEach(section => {
      (TOUR_STEPS[section] || []).forEach(step => {
        allSteps.push({ ...step, section });
      });
    });
    
    console.log(`QPTour: ${sectionsToPlay.length} sections, ${allSteps.length} steps`);
    return true;
  }

  /**
   * Save current theme state
   */
  function saveThemeState() {
    // Check multiple possible theme indicators
    savedTheme = {
      bodyClass: document.body.className,
      htmlClass: document.documentElement.className,
      dataTheme: document.body.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme'),
      isDark: document.body.classList.contains('dark') || 
              document.documentElement.classList.contains('dark') ||
              document.body.getAttribute('data-theme') === 'dark'
    };
    console.log('QPTour: Saved theme state', savedTheme);
  }

  /**
   * Restore theme state if changed
   */
  function restoreThemeState() {
    if (!savedTheme) return;
    
    const currentIsDark = document.body.classList.contains('dark') || 
                          document.documentElement.classList.contains('dark') ||
                          document.body.getAttribute('data-theme') === 'dark';
    
    if (currentIsDark !== savedTheme.isDark) {
      console.log('QPTour: Theme changed during tour, restoring...');
      
      // Restore data-theme attribute
      if (savedTheme.dataTheme) {
        document.body.setAttribute('data-theme', savedTheme.dataTheme);
        document.documentElement.setAttribute('data-theme', savedTheme.dataTheme);
      }
      
      // Restore dark/light class
      if (savedTheme.isDark) {
        document.body.classList.add('dark');
        document.documentElement.classList.add('dark');
        document.body.classList.remove('light');
        document.documentElement.classList.remove('light');
      } else {
        document.body.classList.remove('dark');
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light');
        document.documentElement.classList.add('light');
      }
    }
  }

  /**
   * Start observing theme changes
   */
  function startThemeObserver() {
    if (themeObserver) themeObserver.disconnect();
    
    themeObserver = new MutationObserver((mutations) => {
      if (!isActive) return;
      
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
          // Theme might have changed, restore it
          restoreThemeState();
        }
      }
    });
    
    // Observe body and html for class/attribute changes
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  }

  /**
   * Stop observing theme changes
   */
  function stopThemeObserver() {
    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }
  }

  /**
   * Start the tour
   */
  async function start() {
    if (allSteps.length === 0) return;
    
    isActive = true;
    currentStepIndex = 0;
    
    // Preserve theme state before anything else
    saveThemeState();
    startThemeObserver();
    
    lockScroll();
    createUI();
    
    // Smooth entry - let overlay fade in first
    await sleep(TIMING.initialDelay);
    await playStep(0);
  }
  
  /**
   * Keyboard handler for tour navigation
   */
  function handleKeyboard(e) {
    if (!isActive) return;
    
    switch(e.key) {
      case 'ArrowRight':
      case 'Enter':
      case ' ':
        e.preventDefault();
        next();
        break;
      case 'Escape':
        e.preventDefault();
        exit();
        break;
    }
  }

  /**
   * Lock page scrolling
   */
  function lockScroll() {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  /**
   * Unlock page scrolling
   */
  function unlockScroll() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  /**
   * Create tour UI elements
   */
  function createUI() {
    destroyUI();
    
    const container = document.createElement('div');
    container.id = 'qp-tour';
    container.innerHTML = `
      <div class="tour-overlay"></div>
      <div class="tour-spotlight"></div>
      <div class="tour-callout">
        <div class="tour-arrow"></div>
        <div class="tour-body">
          <div class="tour-section-badge"></div>
          <h4 class="tour-title"></h4>
          <p class="tour-content"></p>
          <div class="tour-progress-bar"><div class="tour-progress-fill"></div></div>
          <div class="tour-footer">
            <span class="tour-progress"></span>
            <div class="tour-buttons">
              <button class="tour-skip">Skip tour</button>
              <button class="tour-next">Next →</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.id = 'qp-tour-styles';
    style.textContent = `
      #qp-tour {
        position: fixed;
        inset: 0;
        z-index: 100000;
        pointer-events: none;
      }
      
      /* Premium blur overlay instead of black */
      .tour-overlay {
        position: absolute;
        inset: 0;
        backdrop-filter: blur(8px) saturate(1.2);
        -webkit-backdrop-filter: blur(8px) saturate(1.2);
        background: rgba(10, 10, 15, 0.3);
        opacity: 0;
        transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }
      .tour-overlay.active { opacity: 1; }
      
      /* Elegant spotlight with gradient glow */
      .tour-spotlight {
        position: absolute;
        border-radius: 12px;
        border: 2px solid #c9a84c;
        background: transparent;
        box-shadow: 
          0 0 0 4000px rgba(10, 10, 15, 0.55),
          0 0 80px rgba(201,168,76,0.35),
          0 0 40px rgba(0,171,255,0.15),
          0 0 20px rgba(201,168,76,0.25),
          inset 0 0 25px rgba(201,168,76,0.08);
        transition: all ${TIMING.spotlightMove}ms cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
        z-index: 1;
      }
      
      /* Feature emphasis - extra vibrant glow */
      .tour-spotlight.emphasis-feature {
        border-width: 2px;
        border-color: #e6c876;
        box-shadow: 
          0 0 0 4000px rgba(10, 10, 15, 0.55),
          0 0 100px rgba(201,168,76,0.45),
          0 0 60px rgba(0,212,255,0.25),
          0 0 30px rgba(201,168,76,0.35),
          inset 0 0 35px rgba(201,168,76,0.1);
        animation: featureGlow 2s ease-in-out infinite;
      }
      @keyframes featureGlow {
        0%, 100% {
          box-shadow: 
            0 0 0 4000px rgba(10, 10, 15, 0.55),
            0 0 100px rgba(201,168,76,0.45),
            0 0 60px rgba(0,212,255,0.25),
            0 0 30px rgba(201,168,76,0.35),
            inset 0 0 35px rgba(201,168,76,0.1);
        }
        50% {
          box-shadow: 
            0 0 0 4000px rgba(10, 10, 15, 0.55),
            0 0 120px rgba(230,200,118,0.5),
            0 0 70px rgba(0,212,255,0.35),
            0 0 40px rgba(230,200,118,0.4),
            inset 0 0 40px rgba(230,200,118,0.12);
        }
      }
      
      /* Action emphasis - pulsing gold→cyan border */
      .tour-spotlight.emphasis-action {
        animation: spotlightPulseAction 1.2s ease-in-out infinite;
      }
      @keyframes spotlightPulseAction {
        0%, 100% { 
          border-color: #c9a84c;
          box-shadow: 
            0 0 0 4000px rgba(10, 10, 15, 0.55),
            0 0 70px rgba(201,168,76,0.4),
            0 0 35px rgba(0,171,255,0.2),
            0 0 20px rgba(201,168,76,0.3);
        }
        50% { 
          border-color: #00d4ff;
          box-shadow: 
            0 0 0 4000px rgba(10, 10, 15, 0.55),
            0 0 90px rgba(0,212,255,0.45),
            0 0 50px rgba(201,168,76,0.25),
            0 0 25px rgba(0,212,255,0.35);
        }
      }
      
      /* Premium callout card with gradient border glow */
      .tour-callout {
        position: absolute;
        background: linear-gradient(135deg, rgba(26,26,31,0.98), rgba(20,20,25,0.98));
        border: 2px solid transparent;
        border-radius: 16px;
        width: 300px;
        max-width: calc(100vw - 32px);
        opacity: 0;
        transform: translateY(12px) scale(0.96);
        transition: 
          opacity ${TIMING.calloutFade}ms cubic-bezier(0.4, 0, 0.2, 1),
          transform ${TIMING.calloutFade}ms cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: auto;
        box-shadow: 
          0 20px 60px rgba(0,0,0,0.5),
          0 0 50px rgba(201,168,76,0.2),
          0 0 30px rgba(0,171,255,0.15),
          inset 0 1px 0 rgba(255,255,255,0.08);
        z-index: 2;
        overflow: visible;
      }
      /* Gradient border effect using pseudo-element */
      .tour-callout::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 18px;
        background: linear-gradient(135deg, #c9a84c, #e6c876, #00d4ff, #00abff);
        z-index: -1;
        opacity: 0.8;
      }
      .tour-callout::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(26,26,31,0.98), rgba(20,20,25,0.98));
        z-index: -1;
      }
      /* Top accent bar */
      .tour-callout .tour-body::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #c9a84c 0%, #e6c876 40%, #00d4ff 60%, #00abff 100%);
        border-radius: 14px 14px 0 0;
      }
      .tour-callout.active {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      
      .tour-body {
        padding: 20px;
        position: relative;
        border-radius: 14px;
        overflow: hidden;
      }
      
      .tour-section-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--gold, #c9a84c);
        background: rgba(201,168,76,0.12);
        padding: 4px 10px;
        border-radius: 100px;
        margin-bottom: 12px;
      }
      
      .tour-title {
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 8px 0;
        letter-spacing: -0.01em;
        line-height: 1.3;
      }
      
      .tour-content {
        font-size: 13px;
        line-height: 1.6;
        color: rgba(255,255,255,0.7);
        margin: 0 0 16px 0;
      }
      
      .tour-progress-bar {
        height: 4px;
        background: rgba(255,255,255,0.08);
        border-radius: 4px;
        margin-bottom: 16px;
        overflow: hidden;
        position: relative;
      }
      .tour-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #c9a84c 0%, #e6c876 30%, #00d4ff 70%, #00abff 100%);
        border-radius: 4px;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 0 12px rgba(201,168,76,0.6), 0 0 24px rgba(0,171,255,0.4);
        position: relative;
      }
      .tour-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        animation: progressShimmer 2s ease-in-out infinite;
      }
      @keyframes progressShimmer {
        0%, 100% { transform: translateX(-100%); }
        50% { transform: translateX(100%); }
      }
      
      .tour-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      
      .tour-progress {
        font-size: 11px;
        color: rgba(255,255,255,0.4);
        font-family: 'JetBrains Mono', monospace;
        letter-spacing: 0.05em;
      }
      
      .tour-buttons {
        display: flex;
        gap: 8px;
      }
      
      .tour-buttons button {
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .tour-skip {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.5);
      }
      .tour-skip:hover {
        border-color: rgba(255,255,255,0.3);
        color: rgba(255,255,255,0.8);
        background: rgba(255,255,255,0.05);
      }
      
      .tour-next {
        background: linear-gradient(135deg, #c9a84c, #d4b85a);
        border: none;
        color: #000;
        box-shadow: 0 4px 12px rgba(201,168,76,0.3);
      }
      .tour-next:hover {
        background: linear-gradient(135deg, #d4b85a, #e6c876);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(201,168,76,0.4);
      }
      
      /* Refined arrow */
      .tour-arrow {
        position: absolute;
        width: 12px;
        height: 12px;
        background: linear-gradient(135deg, rgba(26,26,31,0.98), rgba(20,20,25,0.98));
        border: 1px solid rgba(201,168,76,0.5);
        transform: rotate(45deg);
      }
      .tour-arrow.top {
        top: -7px;
        border-right: none;
        border-bottom: none;
      }
      .tour-arrow.bottom {
        bottom: -7px;
        border-left: none;
        border-top: none;
      }
      .tour-arrow.left {
        left: -7px;
        border-right: none;
        border-top: none;
      }
      .tour-arrow.right {
        right: -7px;
        border-left: none;
        border-bottom: none;
      }
      
      /* Nav highlight animation */
      .tour-nav-highlight {
        position: relative;
        z-index: 100001;
      }
      .tour-nav-highlight::after {
        content: '';
        position: absolute;
        inset: -6px;
        border: 2px solid #c9a84c;
        border-radius: 10px;
        animation: tourPulse 1s ease-in-out infinite;
        box-shadow: 0 0 20px rgba(201,168,76,0.3);
      }
      @keyframes tourPulse {
        0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 20px rgba(201,168,76,0.3); }
        50% { opacity: 0.7; transform: scale(1.03); box-shadow: 0 0 30px rgba(201,168,76,0.5); }
      }
      
      /* Mobile adjustments */
      @media (max-width: 650px) {
        .tour-overlay {
          backdrop-filter: blur(6px) saturate(1.1);
          -webkit-backdrop-filter: blur(6px) saturate(1.1);
        }
        .tour-callout {
          width: 280px;
          border-radius: 14px;
        }
        .tour-callout::before {
          height: 2px;
        }
        .tour-body {
          padding: 16px;
        }
        .tour-section-badge {
          font-size: 9px;
          padding: 3px 8px;
          margin-bottom: 10px;
        }
        .tour-title {
          font-size: 15px;
        }
        .tour-content {
          font-size: 12px;
          margin-bottom: 12px;
        }
        .tour-progress-bar {
          height: 3px;
          margin-bottom: 12px;
        }
        .tour-progress-fill {
          box-shadow: 0 0 8px rgba(201,168,76,0.5), 0 0 16px rgba(0,171,255,0.3);
        }
        .tour-footer {
          padding-top: 10px;
        }
        .tour-buttons button {
          padding: 9px 14px;
          font-size: 11px;
        }
        .tour-spotlight {
          border-radius: 10px;
        }
      }
      
      /* Reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .tour-spotlight,
        .tour-callout,
        .tour-overlay,
        .tour-nav-highlight::after {
          transition-duration: 0.1s !important;
          animation: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(container);
    
    // Cache elements
    elements = {
      container,
      overlay: container.querySelector('.tour-overlay'),
      spotlight: container.querySelector('.tour-spotlight'),
      callout: container.querySelector('.tour-callout'),
      sectionBadge: container.querySelector('.tour-section-badge'),
      title: container.querySelector('.tour-title'),
      content: container.querySelector('.tour-content'),
      progressBar: container.querySelector('.tour-progress-bar'),
      progressFill: container.querySelector('.tour-progress-fill'),
      progress: container.querySelector('.tour-progress'),
      arrow: container.querySelector('.tour-arrow'),
      skipBtn: container.querySelector('.tour-skip'),
      nextBtn: container.querySelector('.tour-next')
    };
    
    // Bind events
    elements.skipBtn.onclick = exit;
    elements.nextBtn.onclick = next;
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);
    
    // Activate overlay with slight delay
    requestAnimationFrame(() => {
      elements.overlay.classList.add('active');
    });
  }

  /**
   * Destroy tour UI
   */
  function destroyUI() {
    document.removeEventListener('keydown', handleKeyboard);
    document.getElementById('qp-tour')?.remove();
    document.getElementById('qp-tour-styles')?.remove();
    elements = {};
  }

  /**
   * Navigate to a page with visible UI interaction
   */
  async function navigateToPage(targetPage) {
    const currentView = document.querySelector('.view.active')?.id?.replace('view-', '');
    if (targetPage === currentView) return;
    
    const isMobile = window.innerWidth <= 650;
    const navSelector = VIEW_NAV_SELECTOR[targetPage];
    
    if (isMobile) {
      // Open sidebar/burger menu
      const sidebar = document.getElementById('sidebar');
      const menuBtn = document.querySelector('.mobile-menu-btn, #mobile-menu-btn, .intel-toggle-sidebar');
      
      if (sidebar && !sidebar.classList.contains('open')) {
        // Find and click burger menu
        const burgerBtn = document.querySelector('#mobile-header button, .burger-btn');
        if (burgerBtn) {
          burgerBtn.click();
          await sleep(TIMING.menuOpen);
        }
      }
    }
    
    // Find nav item
    const navItem = document.querySelector(`#sidebar ${navSelector}, nav ${navSelector}`);
    if (navItem) {
      // Highlight nav item
      navItem.classList.add('tour-nav-highlight');
      navItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(TIMING.navHighlight);
      
      // Click it
      navItem.click();
      navItem.classList.remove('tour-nav-highlight');
      await sleep(TIMING.navClick);
    } else {
      // Fallback: direct switch
      if (typeof switchView === 'function') {
        switchView(targetPage);
      }
    }
    
    // Close sidebar on mobile
    if (isMobile) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar?.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
    
    await sleep(TIMING.pageTransition);
  }

  /**
   * Play a step
   */
  async function playStep(index) {
    if (index >= allSteps.length) {
      await finish();
      return;
    }
    
    const step = allSteps[index];
    currentStepIndex = index;
    currentSection = step.section;
    
    // Hide callout during navigation
    elements.callout.classList.remove('active');
    
    // Navigate if needed
    const currentView = document.querySelector('.view.active')?.id?.replace('view-', '');
    if (step.page !== currentView) {
      // Save state for resume (including theme)
      sessionStorage.setItem('qp_tour_state', JSON.stringify({
        sectionsToPlay,
        currentStepIndex: index,
        completedSections,
        savedTheme
      }));
      
      await navigateToPage(step.page);
      
      // Ensure theme is still correct after navigation
      restoreThemeState();
    }
    
    // Find target
    const target = document.querySelector(step.selector);
    if (!target) {
      console.warn(`QPTour: Element not found: ${step.selector}`);
      await sleep(200);
      await playStep(index + 1);
      return;
    }
    
    // Scroll target into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(300);
    
    // Position spotlight
    const rect = target.getBoundingClientRect();
    const pad = 8;
    Object.assign(elements.spotlight.style, {
      left: (rect.left - pad) + 'px',
      top: (rect.top - pad) + 'px',
      width: (rect.width + pad * 2) + 'px',
      height: (rect.height + pad * 2) + 'px'
    });
    
    // Apply emphasis class if present
    elements.spotlight.className = 'tour-spotlight';
    if (step.emphasis) {
      elements.spotlight.classList.add(`emphasis-${step.emphasis}`);
    }
    
    await sleep(TIMING.spotlightMove);
    
    // Update section badge
    const sectionLabels = {
      research: 'Research Tier',
      recoil: 'Recoil Tier',
      terminal: 'Terminal Tier',
      suite: 'Suite Tier'
    };
    elements.sectionBadge.textContent = sectionLabels[step.section] || step.section;
    
    // Update callout content
    elements.title.textContent = step.title;
    elements.content.textContent = step.content;
    elements.progress.textContent = `${index + 1} of ${allSteps.length}`;
    elements.nextBtn.textContent = index === allSteps.length - 1 ? 'Finish ✓' : 'Next →';
    
    // Update progress bar
    const progressPercent = ((index + 1) / allSteps.length) * 100;
    elements.progressFill.style.width = `${progressPercent}%`;
    
    // Position callout
    positionCallout(step.position, rect);
    
    // Show callout
    elements.callout.classList.add('active');
  }

  /**
   * Position callout with smart placement - NEVER overlaps spotlight
   */
  function positionCallout(preferredPosition, targetRect) {
    const callout = elements.callout;
    const arrow = elements.arrow;
    const gap = 20; // Increased gap for clarity
    const isMobile = window.innerWidth <= 650;
    const calloutWidth = isMobile ? 280 : 300;
    const calloutHeight = callout.offsetHeight || 200; // Estimate if not yet rendered
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Spotlight rect with padding (what we must NOT overlap)
    const spotlightPad = 12;
    const spotlightRect = {
      left: targetRect.left - spotlightPad,
      top: targetRect.top - spotlightPad,
      right: targetRect.right + spotlightPad,
      bottom: targetRect.bottom + spotlightPad,
      width: targetRect.width + spotlightPad * 2,
      height: targetRect.height + spotlightPad * 2
    };
    
    // Calculate available space in each direction
    const spaceTop = spotlightRect.top - 16; // 16px margin from edge
    const spaceBottom = viewportHeight - spotlightRect.bottom - 16;
    const spaceLeft = spotlightRect.left - 16;
    const spaceRight = viewportWidth - spotlightRect.right - 16;
    
    // Determine best position - prioritize where there's most space
    // and never overlap the spotlight
    const positions = [
      { dir: 'bottom', space: spaceBottom, fits: spaceBottom >= calloutHeight + gap },
      { dir: 'top', space: spaceTop, fits: spaceTop >= calloutHeight + gap },
      { dir: 'right', space: spaceRight, fits: spaceRight >= calloutWidth + gap },
      { dir: 'left', space: spaceLeft, fits: spaceLeft >= calloutWidth + gap }
    ];
    
    // Sort by: fits first, then by available space
    positions.sort((a, b) => {
      if (a.fits && !b.fits) return -1;
      if (!a.fits && b.fits) return 1;
      return b.space - a.space;
    });
    
    // Use preferred position if it fits, otherwise pick best
    let finalPosition = positions[0].dir;
    const preferredFits = positions.find(p => p.dir === preferredPosition)?.fits;
    if (preferredFits) {
      finalPosition = preferredPosition;
    }
    
    // Reset arrow classes
    arrow.className = 'tour-arrow';
    
    let left, top;
    
    // Calculate position based on final direction
    switch (finalPosition) {
      case 'top':
        left = targetRect.left + (targetRect.width - calloutWidth) / 2;
        top = spotlightRect.top - calloutHeight - gap;
        arrow.classList.add('bottom');
        arrow.style.left = '50%';
        arrow.style.marginLeft = '-5px';
        arrow.style.top = '';
        arrow.style.right = '';
        break;
        
      case 'bottom':
        left = targetRect.left + (targetRect.width - calloutWidth) / 2;
        top = spotlightRect.bottom + gap;
        arrow.classList.add('top');
        arrow.style.left = '50%';
        arrow.style.marginLeft = '-5px';
        arrow.style.top = '';
        arrow.style.right = '';
        break;
        
      case 'left':
        left = spotlightRect.left - calloutWidth - gap;
        top = targetRect.top + (targetRect.height - calloutHeight) / 2;
        arrow.classList.add('right');
        arrow.style.top = '50%';
        arrow.style.marginTop = '-5px';
        arrow.style.left = '';
        arrow.style.right = '';
        break;
        
      case 'right':
        left = spotlightRect.right + gap;
        top = targetRect.top + (targetRect.height - calloutHeight) / 2;
        arrow.classList.add('left');
        arrow.style.top = '50%';
        arrow.style.marginTop = '-5px';
        arrow.style.left = '';
        arrow.style.right = '';
        break;
    }
    
    // Keep callout on screen (with 16px margin)
    const maxLeft = viewportWidth - calloutWidth - 16;
    const maxTop = viewportHeight - calloutHeight - 16;
    left = Math.max(16, Math.min(left, maxLeft));
    top = Math.max(16, Math.min(top, maxTop));
    
    // CRITICAL: Final overlap check - if callout would still overlap spotlight,
    // force it to the opposite side of the viewport
    const calloutRect = {
      left: left,
      top: top,
      right: left + calloutWidth,
      bottom: top + calloutHeight
    };
    
    const overlaps = !(calloutRect.right < spotlightRect.left || 
                       calloutRect.left > spotlightRect.right || 
                       calloutRect.bottom < spotlightRect.top || 
                       calloutRect.top > spotlightRect.bottom);
    
    if (overlaps) {
      // Emergency repositioning - put callout in opposite half of screen
      const spotlightCenterY = (spotlightRect.top + spotlightRect.bottom) / 2;
      const spotlightCenterX = (spotlightRect.left + spotlightRect.right) / 2;
      
      if (spotlightCenterY < viewportHeight / 2) {
        // Spotlight in top half - put callout at bottom
        top = Math.max(spotlightRect.bottom + gap, viewportHeight - calloutHeight - 32);
        arrow.className = 'tour-arrow top';
      } else {
        // Spotlight in bottom half - put callout at top
        top = Math.min(spotlightRect.top - calloutHeight - gap, 32);
        arrow.className = 'tour-arrow bottom';
      }
      
      // Also adjust horizontal if needed
      if (spotlightCenterX < viewportWidth / 2) {
        // Spotlight on left - push callout right
        left = Math.max(spotlightRect.right + 16, viewportWidth / 2);
      } else {
        // Spotlight on right - push callout left
        left = Math.min(spotlightRect.left - calloutWidth - 16, viewportWidth / 2 - calloutWidth);
      }
      
      // Final bounds check
      left = Math.max(16, Math.min(left, maxLeft));
      top = Math.max(16, Math.min(top, maxTop));
    }
    
    callout.style.left = left + 'px';
    callout.style.top = top + 'px';
  }

  /**
   * Next step
   */
  async function next() {
    const currentStep = allSteps[currentStepIndex];
    const nextStep = allSteps[currentStepIndex + 1];
    
    // Mark section complete if changing
    if (!nextStep || nextStep.section !== currentStep.section) {
      await markSectionComplete(currentStep.section);
    }
    
    await playStep(currentStepIndex + 1);
  }

  /**
   * Exit tour
   */
  function exit() {
    isActive = false;
    stopThemeObserver();
    savedTheme = null;
    unlockScroll();
    destroyUI();
    sessionStorage.removeItem('qp_tour_state');
  }

  /**
   * Finish tour
   */
  async function finish() {
    if (currentSection && !completedSections.includes(currentSection)) {
      await markSectionComplete(currentSection);
    }
    
    isActive = false;
    stopThemeObserver();
    savedTheme = null;
    unlockScroll();
    destroyUI();
    sessionStorage.removeItem('qp_tour_state');
    
    if (typeof showToast === 'function') {
      showToast('🎉 Tour complete!', 'success');
    }
  }

  /**
   * Load progress from Supabase
   */
  async function loadProgress() {
    try {
      const { data, error } = await supabaseClient
        .from('tour_progress')
        .select('sections_completed')
        .eq('user_id', authUser?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('QPTour: Error loading progress', error);
        return [];
      }
      return data?.sections_completed || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save section completion
   */
  async function markSectionComplete(section) {
    try {
      await supabaseClient.rpc('complete_tour_section', { section_name: section });
      completedSections.push(section);
    } catch (e) {
      console.error('QPTour: Error saving progress', e);
    }
  }

  /**
   * Resume if navigated mid-tour
   */
  async function resumeIfActive() {
    const stored = sessionStorage.getItem('qp_tour_state');
    if (!stored) return false;
    
    try {
      const state = JSON.parse(stored);
      sectionsToPlay = state.sectionsToPlay;
      completedSections = state.completedSections;
      
      allSteps = [];
      sectionsToPlay.forEach(section => {
        (TOUR_STEPS[section] || []).forEach(step => {
          allSteps.push({ ...step, section });
        });
      });
      
      isActive = true;
      
      // Restore theme state if saved, otherwise save current
      if (state.savedTheme) {
        savedTheme = state.savedTheme;
        restoreThemeState();
      } else {
        saveThemeState();
      }
      startThemeObserver();
      
      lockScroll();
      createUI();
      
      await sleep(300);
      await playStep(state.currentStepIndex);
      return true;
    } catch (e) {
      sessionStorage.removeItem('qp_tour_state');
      return false;
    }
  }

  /**
   * Check if should auto-start
   */
  async function shouldAutoStart(userTier) {
    const tierSections = TIER_SECTIONS[userTier] || [];
    if (tierSections.length === 0) return false;
    
    const completed = await loadProgress();
    return tierSections.some(s => !completed.includes(s));
  }

  /**
   * Helper: sleep
   */
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  return {
    init,
    start,
    next,
    exit,
    resumeIfActive,
    shouldAutoStart,
    isActive: () => isActive
  };
})();

// Auto-resume
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => QPTour.resumeIfActive(), 500);
});
