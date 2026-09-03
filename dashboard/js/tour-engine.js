/**
 * QP Dashboard Onboarding Tour Engine v32
 * 
 * Changelog:
 * v32 - EMOJI REMOVAL + TRANSITION FIX
 *   - Removed all emoji icons from tour steps
 *   - Spotlight now hides before scroll, appears at new position
 *   - No more "catching up" lag between scroll and spotlight
 * 
 * v31 - MOBILE PERFECTION
 *   - Glow reduced to 0.2 opacity, gold-only, no pulse
 *   - Callout guaranteed 16px gap from spotlight
 *   - Arrow direction fixed for all positions
 *   - Mobile width: 85vw max, 16px edge margins
 * 
 * v20 - PREMIUM TIER-AWARE BUILD MENU TOUR
 *   - Tier-aware: Shows only build menus user hasn't toured
 *   - Premium animations: Spring physics, spotlight glow morphing
 *   - Mobile-first: Designed for 650px breakpoint then scaled up
 *   - Progress celebration: Rewarding step completions
 *   - Gradient borders: Gold→cyan signature look
 *   - Micro-interactions: Buttons feel alive
 *   - Smart positioning: Callouts never clip
 *   - Punchy copy: Not boring tutorial text
 * 
 * Tour Sections (Tier-Based):
 *   - research: Research view + Build menu (Research tier+)
 *   - recoil: Recoil instrument + Build menu (Recoil tier+)
 *   - terminal: Meridian instrument + Build menu (Terminal tier+)
 *   - suite: Cockpit + Performance tracker + Build menu (Suite tier+)
 * 
 * Usage:
 *   await QPTour.init(userTier);
 *   QPTour.start();
 */

const QPTour = (function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════
  
  const SECTION_ORDER = ['research', 'recoil', 'terminal', 'suite'];
  
  const TIER_SECTIONS = {
    'free': [],
    'research': ['research'],
    'recoil': ['research', 'recoil'],
    'terminal': ['research', 'recoil', 'terminal'],
    'suite': ['research', 'recoil', 'terminal', 'suite'],
    'ascension': ['research', 'recoil', 'terminal', 'suite'],
    'admin': ['research', 'recoil', 'terminal', 'suite']
  };

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

  // ═══════════════════════════════════════════════════════════════════════
  // TOUR STEPS - Punchy, helpful copy
  // ═══════════════════════════════════════════════════════════════════════
  
  const TOUR_STEPS = {
    research: [
      {
        id: 'research-intel',
        page: 'research',
        selector: '#view-research .panel[onclick*="intel"]',
        title: 'Your Daily Edge',
        content: 'Market intel drops at 10pm UK. 30 instruments. Regime shifts. Key levels. All archived.',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'research-papers-intro',
        page: 'research',
        selector: '#papers-carousel',
        title: 'The Research Vault',
        content: '10 papers that\'ll change how you think about trading. Real backtests. Real results.',
        position: 'top',
        emphasis: 'feature'
      },
      {
        id: 'research-paper-example',
        page: 'research',
        selector: '.paper-slide[data-paper="1"]',
        title: 'Start Here',
        content: '"The 81.5% Win Rate Paradox" — why winners still lose money. 3 min read that\'ll save you months.',
        position: 'right',
        emphasis: 'action'
      },
      {
        id: 'research-paper-nav',
        page: 'research',
        selector: '#paper-dots',
        title: 'Browse Them All',
        content: 'Position sizing, stop placement, session timing — it\'s all here. Swipe through.',
        position: 'top'
      },
      {
        id: 'research-tier-card',
        page: 'marketplace',
        selector: '.tier-card[data-tier="research"]',
        title: 'The Build Menu',
        content: 'This is where the magic happens. 255 combinations. Your indicator, your rules.',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'research-starter',
        page: 'marketplace',
        selector: '.menu-course[data-course="starter"]',
        title: 'Pick Your Foundation',
        content: 'Trend filters. Session logic. Volatility modes. This sets the base.',
        position: 'right'
      },
      {
        id: 'research-main',
        page: 'marketplace',
        selector: '.menu-course[data-course="main"]',
        title: 'Add Your Signal',
        content: 'The engine that finds your entries. Reversals, breakouts, or momentum.',
        position: 'right'
      },
      {
        id: 'research-side',
        page: 'marketplace',
        selector: '.menu-course[data-course="side"]',
        title: 'Layer Confluence',
        content: 'HTF bias, volume profile, session overlap. Extra edge, fewer fakeouts.',
        position: 'right'
      },
      {
        id: 'research-dessert',
        page: 'marketplace',
        selector: '.menu-course[data-course="dessert"]',
        title: 'Finish & Generate',
        content: 'Final filter. Hit Generate. Get your custom indicator. That simple.',
        position: 'right',
        emphasis: 'action'
      }
    ],
    
    recoil: [
      {
        id: 'recoil-animation',
        page: 'recoil',
        selector: '#recoil-animation',
        title: 'Meet Recoil',
        content: 'Measures how far price stretches from equilibrium. Green = stretched low (long zone). Red = stretched high (short zone).',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'recoil-tv',
        page: 'recoil',
        selector: '#tv-username-recoil',
        title: 'Unlock It Now',
        content: 'Enter your TradingView username exactly as shown. Indicator unlocks in 60 seconds.',
        position: 'bottom',
        interactive: true,
        emphasis: 'action'
      },
      {
        id: 'recoil-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="recoil"]',
        title: 'Recoil Menu Unlocked',
        content: '255 volatility-tuned combinations. Mean reversion setups that actually work.',
        position: 'bottom',
        emphasis: 'feature'
      }
    ],
    
    terminal: [
      {
        id: 'terminal-animation',
        page: 'meridian',
        selector: '#meridian-animation',
        title: 'Meet Meridian',
        content: 'The AMD cycle in real-time. Accumulation → Manipulation → Distribution. Know your phase.',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'terminal-tv',
        page: 'meridian',
        selector: '#tv-username-meridian',
        title: 'Unlock It Now',
        content: 'Same drill. Your exact TradingView username. 60 seconds.',
        position: 'bottom',
        interactive: true,
        emphasis: 'action'
      },
      {
        id: 'terminal-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="terminal"]',
        title: 'Terminal Menu Unlocked',
        content: 'AMD-focused combinations. 255 ways to trade the smart money cycle.',
        position: 'bottom',
        emphasis: 'feature'
      }
    ],
    
    suite: [
      {
        id: 'suite-animation',
        page: 'cockpit',
        selector: '#cockpit-animation',
        title: 'Meet Cockpit',
        content: 'The full picture. 4 EMAs, liquidity sweeps, FVGs, real-time regime score. Everything.',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'suite-tv',
        page: 'cockpit',
        selector: '#tv-username-cockpit',
        title: 'Final Unlock',
        content: 'Your username one more time. Cockpit joins your arsenal.',
        position: 'bottom',
        interactive: true,
        emphasis: 'action'
      },
      {
        id: 'suite-performance',
        page: 'cockpit',
        selector: '.suite-tab[data-suite-panel="performance"]',
        title: 'AI Performance Coach',
        content: 'Upload MT5 trades. AI finds your edge, your leaks, your fixes. Real feedback, no BS.',
        position: 'bottom',
        emphasis: 'feature'
      },
      {
        id: 'suite-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="suite"]',
        title: 'Full Menu Unlocked',
        content: 'Every ingredient. Every combination. Build whatever you need. You\'ve earned it.',
        position: 'bottom',
        emphasis: 'feature'
      }
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════
  // TIMING - Premium easing curves
  // ═══════════════════════════════════════════════════════════════════════
  
  const TIMING = {
    menuOpen: 280,
    navHighlight: 400,
    navClick: 180,
    pageTransition: 400,
    spotlightMove: 350,
    calloutEntrance: 450,
    calloutFade: 250,
    scrollSettle: 450,
    initialDelay: 250,
    celebrationDuration: 600
  };

  // Spring physics easing (approximated with CSS cubic-bezier)
  const EASING = {
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',      // Bouncy overshoot
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',           // Material smooth
    decel: 'cubic-bezier(0, 0, 0.2, 1)',              // Slow at end
    accel: 'cubic-bezier(0.4, 0, 1, 1)',              // Slow at start
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'  // More bounce
  };

  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════
  
  let isActive = false;
  let currentSection = null;
  let currentStepIndex = 0;
  let sectionsToPlay = [];
  let allSteps = [];
  let completedSections = [];
  let elements = {};
  let savedTheme = null;
  let themeObserver = null;
  let scrollContainer = null;
  let resizeObserver = null;

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  async function init(userTier, forceSequence = null) {
    completedSections = await loadProgress();
    
    if (forceSequence) {
      // Dev tool: force specific sequence
      sectionsToPlay = forceSequence;
    } else {
      // Normal: Get sections for this tier, filter out completed
      const tierSections = TIER_SECTIONS[userTier] || [];
      sectionsToPlay = tierSections.filter(s => !completedSections.includes(s));
    }
    
    if (sectionsToPlay.length === 0) {
      console.log('QPTour: No sections to play (all completed)');
      return false;
    }
    
    // Build step list from sections to play
    allSteps = [];
    sectionsToPlay.forEach(section => {
      (TOUR_STEPS[section] || []).forEach(step => {
        allSteps.push({ ...step, section });
      });
    });
    
    console.log(`QPTour v20: ${sectionsToPlay.length} sections, ${allSteps.length} steps`);
    console.log('QPTour: Sections to tour:', sectionsToPlay.join(' → '));
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // THEME MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  function getScrollContainer() {
    if (!scrollContainer) {
      scrollContainer = document.getElementById('main');
    }
    return scrollContainer;
  }

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 
           document.body.getAttribute('data-theme') || 
           'dark';
  }

  function saveThemeState() {
    savedTheme = getCurrentTheme();
    sessionStorage.setItem('qp_tour_theme', savedTheme);
  }

  function forceTheme() {
    if (!savedTheme) {
      savedTheme = sessionStorage.getItem('qp_tour_theme') || 'dark';
    }
    const current = getCurrentTheme();
    if (current !== savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      localStorage.setItem('qp-theme', savedTheme);
    }
  }

  function startThemeObserver() {
    if (themeObserver) themeObserver.disconnect();
    themeObserver = new MutationObserver(() => {
      if (isActive) forceTheme();
    });
    themeObserver.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    });
  }

  function stopThemeObserver() {
    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TOUR START
  // ═══════════════════════════════════════════════════════════════════════

  async function start() {
    if (allSteps.length === 0) return;
    
    isActive = true;
    currentStepIndex = 0;
    
    saveThemeState();
    forceTheme();
    startThemeObserver();
    createUI();
    
    // Start resize observer for responsive positioning
    startResizeObserver();
    
    await sleep(TIMING.initialDelay);
    await playStep(0);
  }

  function startResizeObserver() {
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(() => {
      if (isActive && elements.spotlight) {
        // Recalculate position on resize
        const step = allSteps[currentStepIndex];
        if (step) {
          const target = document.querySelector(step.selector);
          if (target) {
            repositionElements(target, step);
          }
        }
      }
    });
    resizeObserver.observe(document.body);
  }

  function stopResizeObserver() {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // KEYBOARD HANDLER
  // ═══════════════════════════════════════════════════════════════════════
  
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

  // ═══════════════════════════════════════════════════════════════════════
  // UI CREATION - Premium Design
  // ═══════════════════════════════════════════════════════════════════════

  function createUI() {
    destroyUI();
    
    const container = document.createElement('div');
    container.id = 'qp-tour';
    container.innerHTML = `
      <div class="tour-backdrop"></div>
      <div class="tour-spotlight">
        <div class="tour-spotlight-glow"></div>
      </div>
      <div class="tour-callout">
        <div class="tour-callout-border">
          <div class="tour-callout-inner">
            <div class="tour-header">
              <span class="tour-icon"></span>
              <span class="tour-badge"></span>
            </div>
            <h3 class="tour-title"></h3>
            <p class="tour-content"></p>
            <div class="tour-progress-track">
              <div class="tour-progress-fill"></div>
              <div class="tour-progress-glow"></div>
            </div>
            <div class="tour-footer">
              <span class="tour-step-count"></span>
              <div class="tour-actions">
                <button class="tour-skip">Skip</button>
                <button class="tour-next">
                  <span class="tour-next-text">Next</span>
                  <span class="tour-next-icon">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="tour-arrow">
          <div class="tour-arrow-inner"></div>
        </div>
      </div>
      <div class="tour-celebration">
        <div class="tour-celebration-ring"></div>
        <div class="tour-celebration-ring"></div>
        <div class="tour-celebration-ring"></div>
      </div>
    `;
    
    const style = document.createElement('style');
    style.id = 'qp-tour-styles';
    style.textContent = getTourStyles();
    
    document.head.appendChild(style);
    document.body.appendChild(container);
    
    elements = {
      container,
      backdrop: container.querySelector('.tour-backdrop'),
      spotlight: container.querySelector('.tour-spotlight'),
      spotlightGlow: container.querySelector('.tour-spotlight-glow'),
      callout: container.querySelector('.tour-callout'),
      calloutBorder: container.querySelector('.tour-callout-border'),
      icon: container.querySelector('.tour-icon'),
      badge: container.querySelector('.tour-badge'),
      title: container.querySelector('.tour-title'),
      content: container.querySelector('.tour-content'),
      progressFill: container.querySelector('.tour-progress-fill'),
      progressGlow: container.querySelector('.tour-progress-glow'),
      stepCount: container.querySelector('.tour-step-count'),
      arrow: container.querySelector('.tour-arrow'),
      skipBtn: container.querySelector('.tour-skip'),
      nextBtn: container.querySelector('.tour-next'),
      nextText: container.querySelector('.tour-next-text'),
      celebration: container.querySelector('.tour-celebration')
    };
    
    elements.skipBtn.onclick = exit;
    elements.nextBtn.onclick = next;
    document.addEventListener('keydown', handleKeyboard);
    
    // Animate backdrop in
    requestAnimationFrame(() => {
      elements.backdrop.classList.add('active');
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PREMIUM STYLES
  // ═══════════════════════════════════════════════════════════════════════

  function getTourStyles() {
    return `
      /* ═══════════════════════════════════════════════════════════════════
         TOUR CONTAINER
         ═══════════════════════════════════════════════════════════════════ */
      #qp-tour {
        position: fixed;
        inset: 0;
        z-index: 100000;
        pointer-events: none;
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         BACKDROP - Subtle darkness
         ═══════════════════════════════════════════════════════════════════ */
      .tour-backdrop {
        position: absolute;
        inset: 0;
        background: transparent;
        opacity: 0;
        transition: opacity 0.5s ${EASING.smooth};
        pointer-events: none;
      }
      .tour-backdrop.active { opacity: 1; }
      
      /* ═══════════════════════════════════════════════════════════════════
         SPOTLIGHT - With soft glow instead of blur
         ═══════════════════════════════════════════════════════════════════ */
      .tour-spotlight {
        position: fixed;
        border-radius: 16px;
        background: transparent;
        box-shadow: 0 0 0 9999px rgba(10, 10, 15, 0.82);
        opacity: 0;
        transition: 
          top ${TIMING.spotlightMove}ms ${EASING.smooth},
          left ${TIMING.spotlightMove}ms ${EASING.smooth},
          width ${TIMING.spotlightMove}ms ${EASING.smooth},
          height ${TIMING.spotlightMove}ms ${EASING.smooth},
          opacity 250ms ease,
          border-radius ${TIMING.spotlightMove}ms ${EASING.smooth};
        pointer-events: none;
        z-index: 1;
      }
      
      .tour-spotlight.visible {
        opacity: 1;
      }
      
      /* Glow ring around spotlight - SUBTLE, gold-only */
      .tour-spotlight-glow {
        position: absolute;
        inset: -2px;
        border-radius: inherit;
        background: rgba(201, 168, 76, 0.25);
        opacity: 0.2;
        filter: blur(4px);
        animation: subtleGlow 3s ease-in-out infinite;
      }
      
      /* Very subtle breathe - barely perceptible */
      @keyframes subtleGlow {
        0%, 100% { opacity: 0.15; }
        50% { opacity: 0.22; }
      }
      
      /* Feature emphasis - slightly stronger but still subtle */
      .tour-spotlight.emphasis-feature .tour-spotlight-glow {
        background: rgba(201, 168, 76, 0.3);
        animation: featureGlow 2.5s ease-in-out infinite;
      }
      @keyframes featureGlow {
        0%, 100% { opacity: 0.18; }
        50% { opacity: 0.28; }
      }
      
      /* Action emphasis - gold with hint of cyan in border only */
      .tour-spotlight.emphasis-action .tour-spotlight-glow {
        background: rgba(201, 168, 76, 0.3);
        animation: actionGlow 2s ease-in-out infinite;
      }
      @keyframes actionGlow {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 0.3; }
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         CALLOUT - Premium gradient border
         ═══════════════════════════════════════════════════════════════════ */
      .tour-callout {
        position: fixed;
        width: 320px;
        max-width: min(85vw, 320px);
        opacity: 0;
        transform: translateY(12px) scale(0.96);
        transition: 
          opacity ${TIMING.calloutEntrance}ms ${EASING.spring},
          transform ${TIMING.calloutEntrance}ms ${EASING.spring},
          top ${TIMING.spotlightMove}ms ${EASING.smooth},
          left ${TIMING.spotlightMove}ms ${EASING.smooth};
        pointer-events: auto;
        z-index: 2;
      }
      
      .tour-callout.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      
      /* Gradient border wrapper */
      .tour-callout-border {
        background: linear-gradient(135deg, #c9a84c, #00d4ff);
        border-radius: 16px;
        padding: 2px;
        box-shadow: 
          0 20px 50px rgba(0,0,0,0.5),
          0 0 30px rgba(201,168,76,0.15);
      }
      
      /* Inner content area */
      .tour-callout-inner {
        background: #14141a;
        border-radius: 14px;
        padding: 24px;
        position: relative;
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         HEADER - Icon + Badge
         ═══════════════════════════════════════════════════════════════════ */
      .tour-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      
      .tour-icon {
        font-size: 20px;
        line-height: 1;
      }
      
      .tour-badge {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #c9a84c;
        background: rgba(201,168,76,0.15);
        padding: 5px 10px;
        border-radius: 100px;
        border: 1px solid rgba(201,168,76,0.2);
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         TYPOGRAPHY - Premium readability
         ═══════════════════════════════════════════════════════════════════ */
      .tour-title {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 10px 0;
        line-height: 1.3;
        letter-spacing: -0.01em;
      }
      
      .tour-content {
        font-size: 14px;
        line-height: 1.6;
        color: rgba(255,255,255,0.72);
        margin: 0 0 20px 0;
        letter-spacing: 0.01em;
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         PROGRESS BAR - Animated gradient
         ═══════════════════════════════════════════════════════════════════ */
      .tour-progress-track {
        height: 4px;
        background: rgba(255,255,255,0.08);
        border-radius: 4px;
        margin-bottom: 20px;
        overflow: visible;
        position: relative;
      }
      
      .tour-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #c9a84c, #00d4ff);
        border-radius: 4px;
        transition: width 0.5s ${EASING.spring};
        position: relative;
      }
      
      .tour-progress-glow {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 12px;
        height: 12px;
        background: #00d4ff;
        border-radius: 50%;
        filter: blur(6px);
        opacity: 0.8;
        transition: opacity 0.3s;
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         FOOTER - Step count + Actions
         ═══════════════════════════════════════════════════════════════════ */
      .tour-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      
      .tour-step-count {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: rgba(255,255,255,0.4);
        letter-spacing: 0.05em;
      }
      
      .tour-actions {
        display: flex;
        gap: 10px;
      }
      
      /* Skip button - subtle */
      .tour-skip {
        padding: 10px 16px;
        background: transparent;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        color: rgba(255,255,255,0.5);
        cursor: pointer;
        transition: all 0.25s ${EASING.smooth};
      }
      
      .tour-skip:hover {
        border-color: rgba(255,255,255,0.25);
        color: rgba(255,255,255,0.8);
        background: rgba(255,255,255,0.05);
      }
      
      .tour-skip:active {
        transform: scale(0.96);
        transition-duration: 0.1s;
      }
      
      /* Next button - premium gradient */
      .tour-next {
        padding: 10px 20px;
        background: linear-gradient(135deg, #c9a84c, #d4b85a);
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        color: #000;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ${EASING.spring};
        position: relative;
        overflow: hidden;
      }
      
      .tour-next::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%);
        transform: translateX(-100%);
        transition: transform 0.5s ease;
      }
      
      .tour-next:hover {
        background: linear-gradient(135deg, #d4b85a, #e6c876);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(201,168,76,0.35);
      }
      
      .tour-next:hover::before {
        transform: translateX(100%);
      }
      
      .tour-next:active {
        transform: translateY(0) scale(0.97);
        transition-duration: 0.1s;
      }
      
      .tour-next-icon {
        transition: transform 0.2s ease;
      }
      
      .tour-next:hover .tour-next-icon {
        transform: translateX(3px);
      }
      
      /* Finish state */
      .tour-next.finish {
        background: linear-gradient(135deg, #22c55e, #16a34a);
      }
      
      .tour-next.finish:hover {
        background: linear-gradient(135deg, #16a34a, #15803d);
        box-shadow: 0 6px 20px rgba(34,197,94,0.35);
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         ARROW - Points to spotlight
         Position-specific classes set rotation to point correctly
         ═══════════════════════════════════════════════════════════════════ */
      .tour-arrow {
        position: absolute;
        width: 16px;
        height: 16px;
        z-index: -1;
      }
      
      .tour-arrow-inner {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #c9a84c, #00d4ff);
        transform: rotate(45deg);
        border-radius: 2px;
      }
      
      .tour-arrow-inner::after {
        content: '';
        position: absolute;
        inset: 2px;
        background: #14141a;
        border-radius: 1px;
      }
      
      /* Arrow direction classes - applied via JS */
      .tour-arrow.arrow-up .tour-arrow-inner {
        transform: rotate(45deg);
      }
      .tour-arrow.arrow-down .tour-arrow-inner {
        transform: rotate(225deg);
      }
      .tour-arrow.arrow-left .tour-arrow-inner {
        transform: rotate(-45deg);
      }
      .tour-arrow.arrow-right .tour-arrow-inner {
        transform: rotate(135deg);
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         CELEBRATION - Step completion animation
         ═══════════════════════════════════════════════════════════════════ */
      .tour-celebration {
        position: fixed;
        pointer-events: none;
        opacity: 0;
        z-index: 3;
      }
      
      .tour-celebration.active {
        opacity: 1;
      }
      
      .tour-celebration-ring {
        position: absolute;
        width: 60px;
        height: 60px;
        border: 2px solid #c9a84c;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0.5);
        opacity: 0;
      }
      
      .tour-celebration.active .tour-celebration-ring {
        animation: celebrationRing ${TIMING.celebrationDuration}ms ${EASING.decel} forwards;
      }
      
      .tour-celebration.active .tour-celebration-ring:nth-child(1) {
        animation-delay: 0ms;
        border-color: #c9a84c;
      }
      .tour-celebration.active .tour-celebration-ring:nth-child(2) {
        animation-delay: 100ms;
        border-color: #00d4ff;
      }
      .tour-celebration.active .tour-celebration-ring:nth-child(3) {
        animation-delay: 200ms;
        border-color: #c9a84c;
      }
      
      @keyframes celebrationRing {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0.8;
        }
        100% {
          transform: translate(-50%, -50%) scale(2);
          opacity: 0;
        }
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         NAV HIGHLIGHT - Pulsing indicator
         ═══════════════════════════════════════════════════════════════════ */
      .tour-nav-highlight {
        position: relative;
        z-index: 100001;
      }
      
      .tour-nav-highlight::after {
        content: '';
        position: absolute;
        inset: -8px;
        border: 2px solid #c9a84c;
        border-radius: 12px;
        animation: navHighlight 1.2s ease-in-out infinite;
        box-shadow: 0 0 15px rgba(201,168,76,0.4);
      }
      
      @keyframes navHighlight {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.02); }
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         MOBILE STYLES - 650px breakpoint
         ═══════════════════════════════════════════════════════════════════ */
      @media (max-width: 650px) {
        .tour-callout {
          width: 85vw;
          max-width: 320px;
        }
        
        .tour-callout-inner {
          padding: 20px;
        }
        
        .tour-header {
          margin-bottom: 12px;
        }
        
        .tour-icon {
          font-size: 18px;
        }
        
        .tour-badge {
          font-size: 9px;
          padding: 4px 8px;
        }
        
        .tour-title {
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        .tour-content {
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.55;
        }
        
        .tour-progress-track {
          margin-bottom: 16px;
        }
        
        .tour-footer {
          padding-top: 14px;
        }
        
        .tour-step-count {
          font-size: 10px;
        }
        
        .tour-actions {
          gap: 8px;
        }
        
        .tour-skip {
          padding: 10px 14px;
          font-size: 12px;
          min-height: 44px;
        }
        
        .tour-next {
          padding: 10px 18px;
          font-size: 12px;
          min-height: 44px;
        }
        
        /* Spotlight adjustments */
        .tour-spotlight {
          border-radius: 12px;
        }
        
        /* Keep glow subtle on mobile too */
        .tour-spotlight-glow {
          inset: -2px;
          filter: blur(4px);
        }
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         REDUCED MOTION - Respect preferences
         ═══════════════════════════════════════════════════════════════════ */
      @media (prefers-reduced-motion: reduce) {
        .tour-spotlight,
        .tour-callout,
        .tour-progress-fill,
        .tour-next,
        .tour-skip {
          transition-duration: 0.1s !important;
        }
        
        .tour-spotlight-glow,
        .tour-celebration-ring {
          animation: none !important;
        }
        
        .tour-next::before {
          display: none;
        }
      }
      
      /* ═══════════════════════════════════════════════════════════════════
         DARK MODE ADJUSTMENTS
         ═══════════════════════════════════════════════════════════════════ */
      [data-theme="light"] .tour-callout-inner {
        background: #ffffff;
      }
      
      [data-theme="light"] .tour-title {
        color: #1a1a1a;
      }
      
      [data-theme="light"] .tour-content {
        color: rgba(0,0,0,0.65);
      }
      
      [data-theme="light"] .tour-progress-track {
        background: rgba(0,0,0,0.06);
      }
      
      [data-theme="light"] .tour-footer {
        border-top-color: rgba(0,0,0,0.06);
      }
      
      [data-theme="light"] .tour-step-count {
        color: rgba(0,0,0,0.4);
      }
      
      [data-theme="light"] .tour-skip {
        border-color: rgba(0,0,0,0.12);
        color: rgba(0,0,0,0.5);
      }
      
      [data-theme="light"] .tour-skip:hover {
        border-color: rgba(0,0,0,0.25);
        color: rgba(0,0,0,0.8);
        background: rgba(0,0,0,0.03);
      }
      
      [data-theme="light"] .tour-arrow-inner::after {
        background: #ffffff;
      }
      
      [data-theme="light"] .tour-spotlight {
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);
      }
    `;
  }

  function destroyUI() {
    document.removeEventListener('keydown', handleKeyboard);
    document.getElementById('qp-tour')?.remove();
    document.getElementById('qp-tour-styles')?.remove();
    elements = {};
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════

  async function navigateToPage(targetPage) {
    const currentView = document.querySelector('.view.active')?.id?.replace('view-', '');
    if (targetPage === currentView) return;
    
    const isMobile = window.innerWidth <= 650;
    const navSelector = VIEW_NAV_SELECTOR[targetPage];
    
    forceTheme();
    
    // Open mobile menu if needed
    if (isMobile) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.classList.contains('open')) {
        const burgerBtn = document.querySelector('#mobile-header button, .burger-btn, .menu-toggle');
        if (burgerBtn) {
          burgerBtn.click();
          await sleep(TIMING.menuOpen);
        }
      }
    }
    
    // Find and click nav item
    const navItem = document.querySelector(`#sidebar ${navSelector}, nav ${navSelector}`);
    if (navItem) {
      navItem.classList.add('tour-nav-highlight');
      await sleep(TIMING.navHighlight);
      
      navItem.click();
      navItem.classList.remove('tour-nav-highlight');
      await sleep(TIMING.navClick);
    } else if (typeof switchView === 'function') {
      switchView(targetPage);
    }
    
    // Close mobile menu
    if (isMobile) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar?.classList.contains('open')) {
        sidebar.classList.remove('open');
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.classList.remove('visible');
      }
    }
    
    await sleep(TIMING.pageTransition);
    forceTheme();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SCROLLING
  // ═══════════════════════════════════════════════════════════════════════

  async function scrollToElement(element) {
    if (!element) return;
    
    const main = getScrollContainer();
    const isMobile = window.innerWidth <= 650;
    const headerHeight = isMobile ? 60 : 0;
    const navHeight = isMobile ? 90 : 0;
    
    // Native scroll into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
    
    await sleep(350);
    
    // Check if element is in safe viewing area
    let rect = element.getBoundingClientRect();
    const safeTop = headerHeight + 120;
    const safeBottom = window.innerHeight - navHeight - 120;
    
    // Secondary scroll if needed
    if (rect.top < safeTop || rect.bottom > safeBottom) {
      if (main) {
        const safeCenterY = (safeTop + safeBottom) / 2;
        const elemCenterY = rect.top + rect.height / 2;
        const scrollAdjust = elemCenterY - safeCenterY;
        
        const newScroll = Math.max(0, main.scrollTop + scrollAdjust);
        
        main.scrollTo({
          top: newScroll,
          behavior: 'smooth'
        });
        
        await sleep(350);
      }
    }
    
    await sleep(100);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP PLAYBACK
  // ═══════════════════════════════════════════════════════════════════════

  async function playStep(index) {
    if (index >= allSteps.length) {
      await finish();
      return;
    }
    
    const step = allSteps[index];
    currentStepIndex = index;
    currentSection = step.section;
    
    // 1. Hide spotlight and callout IMMEDIATELY (no transition)
    elements.spotlight.style.transition = 'none';
    elements.spotlight.classList.remove('visible');
    elements.callout.classList.remove('visible');
    
    const currentView = document.querySelector('.view.active')?.id?.replace('view-', '');
    const needsNavigation = step.page !== currentView;
    
    // 2. Navigate if needed
    if (needsNavigation) {
      // Save state for resume
      sessionStorage.setItem('qp_tour_state', JSON.stringify({
        sectionsToPlay,
        currentStepIndex: index,
        completedSections,
        savedTheme
      }));
      
      await navigateToPage(step.page);
    }
    
    forceTheme();
    
    // Find target element
    const target = document.querySelector(step.selector);
    if (!target) {
      console.warn(`QPTour: Element not found: ${step.selector}`);
      await sleep(200);
      await playStep(index + 1);
      return;
    }
    
    // 3. Scroll to element (spotlight still hidden)
    await scrollToElement(target);
    
    // 4. Position spotlight at NEW location (while still hidden)
    repositionElements(target, step);
    
    // 5. Force reflow, then restore transitions
    elements.spotlight.offsetHeight; // force reflow
    elements.spotlight.style.transition = ''; // restore CSS transitions
    
    // 6. Show spotlight at new position (will fade in)
    elements.spotlight.classList.add('visible');
    
    // 7. Show callout after spotlight settles
    await sleep(150);
    
    // Update callout content
    updateCalloutContent(step, index);
    
    // Show callout with entrance animation
    elements.callout.classList.add('visible');
  }

  function repositionElements(target, step) {
    const rect = target.getBoundingClientRect();
    const pad = 10;
    
    // Position spotlight
    const spotlightLeft = rect.left - pad;
    const spotlightTop = rect.top - pad;
    const spotlightWidth = rect.width + pad * 2;
    const spotlightHeight = rect.height + pad * 2;
    
    elements.spotlight.style.left = spotlightLeft + 'px';
    elements.spotlight.style.top = spotlightTop + 'px';
    elements.spotlight.style.width = spotlightWidth + 'px';
    elements.spotlight.style.height = spotlightHeight + 'px';
    
    // Set emphasis class
    elements.spotlight.className = 'tour-spotlight visible';
    if (step.emphasis) {
      elements.spotlight.classList.add(`emphasis-${step.emphasis}`);
    }
    
    // Position callout
    positionCallout(step.position, {
      left: spotlightLeft,
      top: spotlightTop,
      right: spotlightLeft + spotlightWidth,
      bottom: spotlightTop + spotlightHeight,
      width: spotlightWidth,
      height: spotlightHeight
    });
  }

  function updateCalloutContent(step, index) {
    const sectionLabels = {
      research: 'Research',
      recoil: 'Recoil',
      terminal: 'Terminal',
      suite: 'Suite'
    };
    
    // Hide icon element if no icon provided
    if (step.icon) {
      elements.icon.textContent = step.icon;
      elements.icon.style.display = '';
    } else {
      elements.icon.textContent = '';
      elements.icon.style.display = 'none';
    }
    
    elements.badge.textContent = sectionLabels[step.section] || step.section;
    elements.title.textContent = step.title;
    elements.content.textContent = step.content;
    elements.stepCount.textContent = `${index + 1} / ${allSteps.length}`;
    
    // Update progress bar
    const progressPercent = ((index + 1) / allSteps.length) * 100;
    elements.progressFill.style.width = `${progressPercent}%`;
    
    // Update next button
    const isLast = index === allSteps.length - 1;
    elements.nextText.textContent = isLast ? 'Finish' : 'Next';
    elements.nextBtn.querySelector('.tour-next-icon').textContent = isLast ? '✓' : '→';
    elements.nextBtn.classList.toggle('finish', isLast);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CALLOUT POSITIONING - Smart, never clips
  // ═══════════════════════════════════════════════════════════════════════

  function positionCallout(preferredPosition, spotlight) {
    const callout = elements.callout;
    const arrow = elements.arrow;
    const gap = 16; // MINIMUM gap - never less
    
    const isMobile = window.innerWidth <= 650;
    // Mobile: 85vw max, capped at 320px. 16px margins on each side.
    const calloutWidth = isMobile 
      ? Math.min(window.innerWidth * 0.85, 320) 
      : 320;
    
    // Get callout height
    callout.style.visibility = 'hidden';
    callout.style.display = 'block';
    const calloutHeight = callout.offsetHeight || 220;
    callout.style.visibility = '';
    
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const headerOffset = isMobile ? 60 : 0;
    const navOffset = isMobile ? 90 : 0;
    
    // Available space (accounting for the 16px gap requirement)
    const spaceAbove = spotlight.top - headerOffset - 20;
    const spaceBelow = vh - spotlight.bottom - navOffset - 20;
    const spaceLeft = spotlight.left - 20;
    const spaceRight = vw - spotlight.right - 20;
    
    // Check what fits with the required gap
    const fits = {
      top: spaceAbove >= calloutHeight + gap,
      bottom: spaceBelow >= calloutHeight + gap,
      left: spaceLeft >= calloutWidth + gap && !isMobile,
      right: spaceRight >= calloutWidth + gap && !isMobile
    };
    
    let position = preferredPosition;
    
    // Mobile: always prefer bottom (natural scroll direction), then top
    if (!fits[position]) {
      if (isMobile) {
        position = fits.bottom ? 'bottom' : fits.top ? 'top' : 'bottom';
      } else {
        if (fits.bottom) position = 'bottom';
        else if (fits.top) position = 'top';
        else if (fits.right) position = 'right';
        else if (fits.left) position = 'left';
        else position = 'bottom';
      }
    }
    
    let left, top;
    
    // Reset arrow styles and classes
    arrow.style.cssText = '';
    arrow.className = 'tour-arrow';
    
    switch (position) {
      case 'top':
        // Callout ABOVE spotlight, arrow points DOWN (bottom of callout)
        left = spotlight.left + (spotlight.width - calloutWidth) / 2;
        top = spotlight.top - calloutHeight - gap;
        arrow.classList.add('arrow-down');
        arrow.style.bottom = '-8px';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        break;
        
      case 'bottom':
        // Callout BELOW spotlight, arrow points UP (top of callout)
        left = spotlight.left + (spotlight.width - calloutWidth) / 2;
        top = spotlight.bottom + gap;
        arrow.classList.add('arrow-up');
        arrow.style.top = '-8px';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        break;
        
      case 'left':
        // Callout LEFT of spotlight, arrow points RIGHT (right of callout)
        left = spotlight.left - calloutWidth - gap;
        top = spotlight.top + (spotlight.height - calloutHeight) / 2;
        arrow.classList.add('arrow-right');
        arrow.style.right = '-8px';
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%)';
        break;
        
      case 'right':
        // Callout RIGHT of spotlight, arrow points LEFT (left of callout)
        left = spotlight.right + gap;
        top = spotlight.top + (spotlight.height - calloutHeight) / 2;
        arrow.classList.add('arrow-left');
        arrow.style.left = '-8px';
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%)';
        break;
    }
    
    // Clamp to viewport with 16px edge margins
    const minLeft = 16;
    const maxLeft = vw - calloutWidth - 16;
    const originalLeft = left;
    left = Math.max(minLeft, Math.min(left, maxLeft));
    
    const minTop = headerOffset + 16;
    const maxTop = vh - calloutHeight - navOffset - 16;
    const originalTop = top;
    top = Math.max(minTop, Math.min(top, maxTop));
    
    // Adjust arrow position if callout was clamped horizontally
    if (position === 'top' || position === 'bottom') {
      const offset = originalLeft - left;
      if (Math.abs(offset) > 10) {
        // Move arrow to still point at spotlight center
        const spotlightCenterX = spotlight.left + spotlight.width / 2;
        const arrowLeft = Math.max(24, Math.min(calloutWidth - 24, spotlightCenterX - left));
        arrow.style.left = arrowLeft + 'px';
        arrow.style.transform = 'translateX(-50%)';
      }
    }
    
    // Adjust arrow position if callout was clamped vertically
    if (position === 'left' || position === 'right') {
      const offset = originalTop - top;
      if (Math.abs(offset) > 10) {
        // Move arrow to still point at spotlight center
        const spotlightCenterY = spotlight.top + spotlight.height / 2;
        const arrowTop = Math.max(30, Math.min(calloutHeight - 30, spotlightCenterY - top));
        arrow.style.top = arrowTop + 'px';
        arrow.style.transform = 'translateY(-50%)';
      }
    }
    
    callout.style.left = left + 'px';
    callout.style.top = top + 'px';
    callout.style.width = calloutWidth + 'px';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CELEBRATION ANIMATION
  // ═══════════════════════════════════════════════════════════════════════

  function playCelebration(x, y) {
    const celebration = elements.celebration;
    celebration.style.left = x + 'px';
    celebration.style.top = y + 'px';
    
    // Reset animation
    celebration.classList.remove('active');
    void celebration.offsetWidth; // Force reflow
    celebration.classList.add('active');
    
    setTimeout(() => {
      celebration.classList.remove('active');
    }, TIMING.celebrationDuration + 300);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════════════════════════════════

  async function next() {
    try {
      const currentStep = allSteps[currentStepIndex];
      const nextStep = allSteps[currentStepIndex + 1];
      
      // Celebration at spotlight center
      const spotlight = elements.spotlight.getBoundingClientRect();
      playCelebration(
        spotlight.left + spotlight.width / 2,
        spotlight.top + spotlight.height / 2
      );
      
      // Mark section complete if moving to next section or finishing
      if (!nextStep || nextStep.section !== currentStep.section) {
        await markSectionComplete(currentStep.section);
      }
      
      await playStep(currentStepIndex + 1);
    } catch (e) {
      console.error('QPTour: Error in next()', e);
      finish();
    }
  }

  function exit() {
    cleanup();
    if (typeof showToast === 'function') {
      showToast('Tour skipped — restart anytime from settings', 'info');
    }
  }

  async function finish() {
    if (currentSection && !completedSections.includes(currentSection)) {
      await markSectionComplete(currentSection);
    }
    
    // Final celebration burst
    const callout = elements.callout.getBoundingClientRect();
    playCelebration(
      callout.left + callout.width / 2,
      callout.top + callout.height / 2
    );
    
    await sleep(500);
    
    cleanup();
    
    if (typeof showToast === 'function') {
      showToast('🎉 Tour complete! You\'re ready to build.', 'success');
    }
  }

  function cleanup() {
    isActive = false;
    stopThemeObserver();
    stopResizeObserver();
    savedTheme = null;
    scrollContainer = null;
    destroyUI();
    sessionStorage.removeItem('qp_tour_state');
    sessionStorage.removeItem('qp_tour_theme');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PERSISTENCE - Supabase integration
  // ═══════════════════════════════════════════════════════════════════════

  async function loadProgress() {
    try {
      if (typeof supabaseClient === 'undefined' || !authUser?.id) {
        console.log('QPTour: No Supabase/auth, using local storage');
        return JSON.parse(localStorage.getItem('qp_tour_progress') || '[]');
      }
      
      const { data, error } = await supabaseClient
        .from('tour_progress')
        .select('sections_completed')
        .eq('user_id', authUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('QPTour: Error loading progress', error);
        return JSON.parse(localStorage.getItem('qp_tour_progress') || '[]');
      }
      
      return data?.sections_completed || [];
    } catch (e) {
      console.log('QPTour: Offline mode, using local storage');
      return JSON.parse(localStorage.getItem('qp_tour_progress') || '[]');
    }
  }

  async function markSectionComplete(section) {
    console.log('QPTour: Completing section:', section);
    
    // Always update local storage as backup
    const localProgress = JSON.parse(localStorage.getItem('qp_tour_progress') || '[]');
    if (!localProgress.includes(section)) {
      localProgress.push(section);
      localStorage.setItem('qp_tour_progress', JSON.stringify(localProgress));
    }
    
    try {
      if (typeof supabaseClient !== 'undefined' && authUser?.id) {
        await supabaseClient.rpc('complete_tour_section', { section_name: section });
      }
      completedSections.push(section);
    } catch (e) {
      console.error('QPTour: Error saving progress (offline?)', e);
      completedSections.push(section);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RESUME - Continue after page navigation
  // ═══════════════════════════════════════════════════════════════════════

  async function resumeIfActive() {
    const stored = sessionStorage.getItem('qp_tour_state');
    if (!stored) return false;
    
    try {
      const state = JSON.parse(stored);
      sectionsToPlay = state.sectionsToPlay;
      completedSections = state.completedSections;
      savedTheme = state.savedTheme || sessionStorage.getItem('qp_tour_theme') || 'dark';
      
      allSteps = [];
      sectionsToPlay.forEach(section => {
        (TOUR_STEPS[section] || []).forEach(step => {
          allSteps.push({ ...step, section });
        });
      });
      
      isActive = true;
      forceTheme();
      startThemeObserver();
      createUI();
      startResizeObserver();
      
      await sleep(350);
      await playStep(state.currentStepIndex);
      return true;
    } catch (e) {
      sessionStorage.removeItem('qp_tour_state');
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO-START CHECK
  // ═══════════════════════════════════════════════════════════════════════

  async function shouldAutoStart(userTier) {
    const tierSections = TIER_SECTIONS[userTier] || [];
    if (tierSections.length === 0) return false;
    
    const completed = await loadProgress();
    return tierSections.some(s => !completed.includes(s));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RESET - For testing
  // ═══════════════════════════════════════════════════════════════════════

  async function resetProgress() {
    localStorage.removeItem('qp_tour_progress');
    
    try {
      if (typeof supabaseClient !== 'undefined' && authUser?.id) {
        await supabaseClient
          .from('tour_progress')
          .delete()
          .eq('user_id', authUser.id);
      }
    } catch (e) {
      console.error('QPTour: Error resetting progress', e);
    }
    
    completedSections = [];
    console.log('QPTour: Progress reset');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════

  return {
    init,
    start,
    next,
    exit,
    resumeIfActive,
    shouldAutoStart,
    resetProgress,
    isActive: () => isActive,
    
    // Expose for dev tool
    TIER_SECTIONS,
    TOUR_STEPS
  };
})();

// Auto-resume on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => QPTour.resumeIfActive(), 600);
});
