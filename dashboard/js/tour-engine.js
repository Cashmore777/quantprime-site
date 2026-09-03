/**
 * QP Dashboard Onboarding Tour Engine v5
 * 
 * Fixed in v5:
 * - Theme detection: checks documentElement first (where dashboard sets it)
 * - Theme restoration: forces dark mode via documentElement
 * - Simplified gradient: clean progress bar, no glitchy pseudo-elements
 * - Blur overlay working correctly
 */

const QPTour = (function() {
  'use strict';

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

  const TOUR_STEPS = {
    research: [
      {
        id: 'research-intel',
        page: 'research',
        selector: '#view-research .panel[onclick*="intel"]',
        title: '📡 Your Intel Feed',
        content: 'Daily market briefings drop here at 10pm UK. 30 instruments analyzed. Regime shifts, key levels, trade setups — all archived.',
        position: 'bottom',
        emphasis: 'feature'
      },
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

  const TIMING = {
    menuOpen: 350,
    navHighlight: 500,
    navClick: 250,
    pageTransition: 450,
    spotlightMove: 400,
    calloutFade: 300,
    initialDelay: 200
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
   * Get current theme from documentElement (where dashboard sets it)
   */
  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 
           document.body.getAttribute('data-theme') || 
           'dark';
  }

  /**
   * Save theme state - captures from documentElement first
   */
  function saveThemeState() {
    savedTheme = getCurrentTheme();
    sessionStorage.setItem('qp_tour_theme', savedTheme);
    console.log('QPTour: Saved theme:', savedTheme);
  }

  /**
   * Force theme to saved state - sets on documentElement (where dashboard reads it)
   */
  function forceTheme() {
    if (!savedTheme) {
      savedTheme = sessionStorage.getItem('qp_tour_theme') || 'dark';
    }
    
    const current = getCurrentTheme();
    if (current !== savedTheme) {
      console.log('QPTour: Theme changed from', current, 'to', savedTheme, '- forcing back');
      document.documentElement.setAttribute('data-theme', savedTheme);
      // Also update localStorage so it persists
      localStorage.setItem('qp-theme', savedTheme);
    }
  }

  /**
   * Watch for theme changes and force back to saved
   */
  function startThemeObserver() {
    if (themeObserver) themeObserver.disconnect();
    
    themeObserver = new MutationObserver((mutations) => {
      if (!isActive) return;
      
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-theme') {
          // Theme changed - force it back
          forceTheme();
        }
      }
    });
    
    // Watch documentElement (html) where dashboard sets theme
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

  async function start() {
    if (allSteps.length === 0) return;
    
    isActive = true;
    currentStepIndex = 0;
    
    // Lock theme FIRST before anything else
    saveThemeState();
    forceTheme();
    startThemeObserver();
    
    lockScroll();
    createUI();
    
    await sleep(TIMING.initialDelay);
    await playStep(0);
  }
  
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

  function lockScroll() {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

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
    
    const style = document.createElement('style');
    style.id = 'qp-tour-styles';
    style.textContent = `
      #qp-tour {
        position: fixed;
        inset: 0;
        z-index: 100000;
        pointer-events: none;
      }
      
      /* Overlay - no blur (spotlight box-shadow handles dimming) */
      .tour-overlay {
        position: absolute;
        inset: 0;
        background: transparent;
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
      }
      .tour-overlay.active { opacity: 1; }
      
      /* Spotlight with gold border */
      .tour-spotlight {
        position: absolute;
        border-radius: 12px;
        border: 2px solid #c9a84c;
        background: transparent;
        box-shadow: 
          0 0 0 4000px rgba(10, 10, 15, 0.6),
          0 0 30px rgba(201,168,76,0.3);
        transition: all ${TIMING.spotlightMove}ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
        pointer-events: none;
        z-index: 1;
      }
      
      /* Feature emphasis - gentle pulse */
      .tour-spotlight.emphasis-feature {
        animation: featurePulse 2s ease-in-out infinite;
      }
      @keyframes featurePulse {
        0%, 100% { box-shadow: 0 0 0 4000px rgba(10,10,15,0.6), 0 0 30px rgba(201,168,76,0.3); }
        50% { box-shadow: 0 0 0 4000px rgba(10,10,15,0.6), 0 0 50px rgba(201,168,76,0.5); }
      }
      
      /* Action emphasis - border color pulse */
      .tour-spotlight.emphasis-action {
        animation: actionPulse 1.5s ease-in-out infinite;
      }
      @keyframes actionPulse {
        0%, 100% { border-color: #c9a84c; }
        50% { border-color: #00d4ff; }
      }
      
      /* Clean callout card */
      .tour-callout {
        position: absolute;
        background: rgba(20, 20, 25, 0.98);
        border: 1px solid rgba(201,168,76,0.3);
        border-radius: 14px;
        width: 300px;
        max-width: calc(100vw - 32px);
        opacity: 0;
        transform: translateY(10px);
        transition: 
          opacity ${TIMING.calloutFade}ms ease,
          transform ${TIMING.calloutFade}ms ease;
        pointer-events: auto;
        box-shadow: 0 16px 48px rgba(0,0,0,0.5);
        z-index: 2;
      }
      .tour-callout.active {
        opacity: 1;
        transform: translateY(0);
      }
      
      .tour-body {
        padding: 20px;
        position: relative;
      }
      
      /* Gold accent bar at top */
      .tour-body::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #c9a84c 0%, #00d4ff 100%);
        border-radius: 14px 14px 0 0;
      }
      
      .tour-section-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #c9a84c;
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
        line-height: 1.3;
      }
      
      .tour-content {
        font-size: 13px;
        line-height: 1.6;
        color: rgba(255,255,255,0.7);
        margin: 0 0 16px 0;
      }
      
      /* Simple gradient progress bar */
      .tour-progress-bar {
        height: 3px;
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
        margin-bottom: 16px;
        overflow: hidden;
      }
      .tour-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #c9a84c 0%, #00d4ff 100%);
        border-radius: 3px;
        transition: width 0.3s ease;
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
        transition: all 0.2s ease;
      }
      
      .tour-skip {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.5);
      }
      .tour-skip:hover {
        border-color: rgba(255,255,255,0.3);
        color: rgba(255,255,255,0.8);
      }
      
      .tour-next {
        background: linear-gradient(135deg, #c9a84c, #d4b85a);
        border: none;
        color: #000;
      }
      .tour-next:hover {
        background: linear-gradient(135deg, #d4b85a, #e6c876);
      }
      
      /* Arrow */
      .tour-arrow {
        position: absolute;
        width: 12px;
        height: 12px;
        background: rgba(20, 20, 25, 0.98);
        border: 1px solid rgba(201,168,76,0.3);
        transform: rotate(45deg);
      }
      .tour-arrow.top { top: -7px; border-right: none; border-bottom: none; }
      .tour-arrow.bottom { bottom: -7px; border-left: none; border-top: none; }
      .tour-arrow.left { left: -7px; border-right: none; border-top: none; }
      .tour-arrow.right { right: -7px; border-left: none; border-bottom: none; }
      
      /* Nav highlight */
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
        animation: navPulse 1s ease-in-out infinite;
      }
      @keyframes navPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      
      /* Mobile */
      @media (max-width: 650px) {
        .tour-callout {
          width: 280px;
        }
        .tour-body {
          padding: 16px;
        }
        .tour-title { font-size: 15px; }
        .tour-content { font-size: 12px; }
        .tour-buttons button { padding: 9px 14px; font-size: 11px; }
      }
      
      @media (prefers-reduced-motion: reduce) {
        .tour-spotlight, .tour-callout, .tour-overlay {
          transition-duration: 0.1s !important;
          animation: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(container);
    
    elements = {
      container,
      overlay: container.querySelector('.tour-overlay'),
      spotlight: container.querySelector('.tour-spotlight'),
      callout: container.querySelector('.tour-callout'),
      sectionBadge: container.querySelector('.tour-section-badge'),
      title: container.querySelector('.tour-title'),
      content: container.querySelector('.tour-content'),
      progressFill: container.querySelector('.tour-progress-fill'),
      progress: container.querySelector('.tour-progress'),
      arrow: container.querySelector('.tour-arrow'),
      skipBtn: container.querySelector('.tour-skip'),
      nextBtn: container.querySelector('.tour-next')
    };
    
    elements.skipBtn.onclick = exit;
    elements.nextBtn.onclick = next;
    document.addEventListener('keydown', handleKeyboard);
    
    requestAnimationFrame(() => {
      elements.overlay.classList.add('active');
    });
  }

  function destroyUI() {
    document.removeEventListener('keydown', handleKeyboard);
    document.getElementById('qp-tour')?.remove();
    document.getElementById('qp-tour-styles')?.remove();
    elements = {};
  }

  async function navigateToPage(targetPage) {
    const currentView = document.querySelector('.view.active')?.id?.replace('view-', '');
    if (targetPage === currentView) return;
    
    const isMobile = window.innerWidth <= 650;
    const navSelector = VIEW_NAV_SELECTOR[targetPage];
    
    // Force theme before navigation
    forceTheme();
    
    if (isMobile) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.classList.contains('open')) {
        const burgerBtn = document.querySelector('#mobile-header button, .burger-btn');
        if (burgerBtn) {
          burgerBtn.click();
          await sleep(TIMING.menuOpen);
        }
      }
    }
    
    const navItem = document.querySelector(`#sidebar ${navSelector}, nav ${navSelector}`);
    if (navItem) {
      navItem.classList.add('tour-nav-highlight');
      navItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(TIMING.navHighlight);
      
      navItem.click();
      navItem.classList.remove('tour-nav-highlight');
      await sleep(TIMING.navClick);
    } else {
      if (typeof switchView === 'function') {
        switchView(targetPage);
      }
    }
    
    if (isMobile) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar?.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
    
    await sleep(TIMING.pageTransition);
    
    // Force theme AFTER navigation (critical!)
    forceTheme();
  }

  async function playStep(index) {
    if (index >= allSteps.length) {
      await finish();
      return;
    }
    
    const step = allSteps[index];
    currentStepIndex = index;
    currentSection = step.section;
    
    elements.callout.classList.remove('active');
    
    const currentView = document.querySelector('.view.active')?.id?.replace('view-', '');
    if (step.page !== currentView) {
      sessionStorage.setItem('qp_tour_state', JSON.stringify({
        sectionsToPlay,
        currentStepIndex: index,
        completedSections,
        savedTheme
      }));
      
      await navigateToPage(step.page);
    }
    
    // Always force theme after any navigation
    forceTheme();
    
    const target = document.querySelector(step.selector);
    if (!target) {
      console.warn(`QPTour: Element not found: ${step.selector}`);
      await sleep(200);
      await playStep(index + 1);
      return;
    }
    
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(300);
    
    const rect = target.getBoundingClientRect();
    const pad = 8;
    Object.assign(elements.spotlight.style, {
      left: (rect.left - pad) + 'px',
      top: (rect.top - pad) + 'px',
      width: (rect.width + pad * 2) + 'px',
      height: (rect.height + pad * 2) + 'px'
    });
    
    elements.spotlight.className = 'tour-spotlight';
    if (step.emphasis) {
      elements.spotlight.classList.add(`emphasis-${step.emphasis}`);
    }
    
    await sleep(TIMING.spotlightMove);
    
    const sectionLabels = {
      research: 'Research Tier',
      recoil: 'Recoil Tier',
      terminal: 'Terminal Tier',
      suite: 'Suite Tier'
    };
    elements.sectionBadge.textContent = sectionLabels[step.section] || step.section;
    elements.title.textContent = step.title;
    elements.content.textContent = step.content;
    elements.progress.textContent = `${index + 1} of ${allSteps.length}`;
    elements.nextBtn.textContent = index === allSteps.length - 1 ? 'Finish ✓' : 'Next →';
    
    const progressPercent = ((index + 1) / allSteps.length) * 100;
    elements.progressFill.style.width = `${progressPercent}%`;
    
    positionCallout(step.position, rect);
    elements.callout.classList.add('active');
  }

  function positionCallout(preferredPosition, targetRect) {
    const callout = elements.callout;
    const arrow = elements.arrow;
    const gap = 20;
    const isMobile = window.innerWidth <= 650;
    const calloutWidth = isMobile ? 280 : 300;
    const calloutHeight = callout.offsetHeight || 200;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const spotlightPad = 12;
    const spotlightRect = {
      left: targetRect.left - spotlightPad,
      top: targetRect.top - spotlightPad,
      right: targetRect.right + spotlightPad,
      bottom: targetRect.bottom + spotlightPad
    };
    
    const spaceTop = spotlightRect.top - 16;
    const spaceBottom = viewportHeight - spotlightRect.bottom - 16;
    const spaceLeft = spotlightRect.left - 16;
    const spaceRight = viewportWidth - spotlightRect.right - 16;
    
    const positions = [
      { dir: 'bottom', space: spaceBottom, fits: spaceBottom >= calloutHeight + gap },
      { dir: 'top', space: spaceTop, fits: spaceTop >= calloutHeight + gap },
      { dir: 'right', space: spaceRight, fits: spaceRight >= calloutWidth + gap },
      { dir: 'left', space: spaceLeft, fits: spaceLeft >= calloutWidth + gap }
    ];
    
    positions.sort((a, b) => {
      if (a.fits && !b.fits) return -1;
      if (!a.fits && b.fits) return 1;
      return b.space - a.space;
    });
    
    let finalPosition = positions[0].dir;
    const preferredFits = positions.find(p => p.dir === preferredPosition)?.fits;
    if (preferredFits) {
      finalPosition = preferredPosition;
    }
    
    arrow.className = 'tour-arrow';
    let left, top;
    
    switch (finalPosition) {
      case 'top':
        left = targetRect.left + (targetRect.width - calloutWidth) / 2;
        top = spotlightRect.top - calloutHeight - gap;
        arrow.classList.add('bottom');
        arrow.style.left = '50%';
        arrow.style.marginLeft = '-6px';
        break;
        
      case 'bottom':
        left = targetRect.left + (targetRect.width - calloutWidth) / 2;
        top = spotlightRect.bottom + gap;
        arrow.classList.add('top');
        arrow.style.left = '50%';
        arrow.style.marginLeft = '-6px';
        break;
        
      case 'left':
        left = spotlightRect.left - calloutWidth - gap;
        top = targetRect.top + (targetRect.height - calloutHeight) / 2;
        arrow.classList.add('right');
        arrow.style.top = '50%';
        arrow.style.marginTop = '-6px';
        break;
        
      case 'right':
        left = spotlightRect.right + gap;
        top = targetRect.top + (targetRect.height - calloutHeight) / 2;
        arrow.classList.add('left');
        arrow.style.top = '50%';
        arrow.style.marginTop = '-6px';
        break;
    }
    
    const maxLeft = viewportWidth - calloutWidth - 16;
    const maxTop = viewportHeight - calloutHeight - 16;
    left = Math.max(16, Math.min(left, maxLeft));
    top = Math.max(16, Math.min(top, maxTop));
    
    // Final overlap check
    const calloutRect = {
      left, top,
      right: left + calloutWidth,
      bottom: top + calloutHeight
    };
    
    const overlaps = !(calloutRect.right < spotlightRect.left || 
                       calloutRect.left > spotlightRect.right || 
                       calloutRect.bottom < spotlightRect.top || 
                       calloutRect.top > spotlightRect.bottom);
    
    if (overlaps) {
      const spotlightCenterY = (spotlightRect.top + spotlightRect.bottom) / 2;
      
      if (spotlightCenterY < viewportHeight / 2) {
        top = Math.max(spotlightRect.bottom + gap, viewportHeight - calloutHeight - 32);
        arrow.className = 'tour-arrow top';
        arrow.style.left = '50%';
        arrow.style.marginLeft = '-6px';
      } else {
        top = Math.min(spotlightRect.top - calloutHeight - gap, 32);
        arrow.className = 'tour-arrow bottom';
        arrow.style.left = '50%';
        arrow.style.marginLeft = '-6px';
      }
      
      left = Math.max(16, Math.min(left, maxLeft));
      top = Math.max(16, Math.min(top, maxTop));
    }
    
    callout.style.left = left + 'px';
    callout.style.top = top + 'px';
  }

  async function next() {
    const currentStep = allSteps[currentStepIndex];
    const nextStep = allSteps[currentStepIndex + 1];
    
    if (!nextStep || nextStep.section !== currentStep.section) {
      await markSectionComplete(currentStep.section);
    }
    
    await playStep(currentStepIndex + 1);
  }

  function exit() {
    isActive = false;
    stopThemeObserver();
    savedTheme = null;
    unlockScroll();
    destroyUI();
    sessionStorage.removeItem('qp_tour_state');
    sessionStorage.removeItem('qp_tour_theme');
  }

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
    sessionStorage.removeItem('qp_tour_theme');
    
    if (typeof showToast === 'function') {
      showToast('🎉 Tour complete!', 'success');
    }
  }

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

  async function markSectionComplete(section) {
    try {
      await supabaseClient.rpc('complete_tour_section', { section_name: section });
      completedSections.push(section);
    } catch (e) {
      console.error('QPTour: Error saving progress', e);
    }
  }

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

  async function shouldAutoStart(userTier) {
    const tierSections = TIER_SECTIONS[userTier] || [];
    if (tierSections.length === 0) return false;
    
    const completed = await loadProgress();
    return tierSections.some(s => !completed.includes(s));
  }

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

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => QPTour.resumeIfActive(), 500);
});
