/**
 * QP Dashboard Onboarding Tour Engine v2
 * 
 * Professional, seamless onboarding experience.
 * - Visible navigation (opens menus, clicks items)
 * - Smooth, deliberate pacing
 * - Scroll-locked during tour
 * - Mobile-responsive
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

  // Tour step definitions - focus on INTERESTING, ACTIONABLE things
  const TOUR_STEPS = {
    research: [
      {
        id: 'research-paper',
        page: 'research',
        selector: '.research-card',
        title: 'Start here',
        content: 'This paper explains why 83% win rates can still lose money. Read it first.',
        position: 'bottom'
      },
      {
        id: 'research-tier-card',
        page: 'marketplace',
        selector: '.tier-card[data-tier="research"]',
        title: 'Your build menu',
        content: 'Tap this to open 255 indicator combinations.',
        position: 'bottom'
      },
      {
        id: 'research-starter',
        page: 'marketplace',
        selector: '.menu-course[data-course="starter"]',
        title: '1. Pick a Starter',
        content: 'Choose one dish. This sets your foundation.',
        position: 'bottom'
      },
      {
        id: 'research-main',
        page: 'marketplace',
        selector: '.menu-course[data-course="main"]',
        title: '2. Pick a Main',
        content: 'Select your Main dish. This is your core logic.',
        position: 'bottom'
      },
      {
        id: 'research-side',
        page: 'marketplace',
        selector: '.menu-course[data-course="side"]',
        title: '3. Pick a Side',
        content: 'Add a Side for extra context.',
        position: 'bottom'
      },
      {
        id: 'research-dessert',
        page: 'marketplace',
        selector: '.menu-course[data-course="dessert"]',
        title: '4. Pick Dessert',
        content: 'Choose Dessert, then Generate.',
        position: 'top'
      }
    ],
    
    recoil: [
      {
        id: 'recoil-animation',
        page: 'recoil',
        selector: '#recoil-animation',
        title: 'This is Recoil',
        content: 'Spots when price stretches too far. Green = potential long, red = potential short.',
        position: 'bottom'
      },
      {
        id: 'recoil-tv',
        page: 'recoil',
        selector: '#tv-username-recoil',
        title: 'Unlock it now',
        content: 'Type your TradingView username exactly. The indicator appears in your invite-only scripts.',
        position: 'bottom',
        interactive: true
      },
      {
        id: 'recoil-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="recoil"]',
        title: 'Recoil menu unlocked',
        content: '255 volatility-tuned combinations now available to build.',
        position: 'bottom'
      }
    ],
    
    terminal: [
      {
        id: 'terminal-animation',
        page: 'meridian',
        selector: '#meridian-animation',
        title: 'This is Meridian',
        content: 'Tracks AMD cycles. A = accumulation, M = manipulation, D = distribution.',
        position: 'bottom'
      },
      {
        id: 'terminal-tv',
        page: 'meridian',
        selector: '#tv-username-meridian',
        title: 'Unlock it',
        content: 'Same deal—enter your TradingView username to access Meridian.',
        position: 'bottom',
        interactive: true
      },
      {
        id: 'terminal-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="terminal"]',
        title: 'Terminal menu unlocked',
        content: '255 AMD-focused combinations ready to build.',
        position: 'bottom'
      }
    ],
    
    suite: [
      {
        id: 'suite-animation',
        page: 'cockpit',
        selector: '#cockpit-animation',
        title: 'This is Cockpit',
        content: 'Multi-timeframe overlay. 4 EMAs, liquidity levels, FVGs, and regime scoring.',
        position: 'bottom'
      },
      {
        id: 'suite-tv',
        page: 'cockpit',
        selector: '#tv-username-cockpit',
        title: 'Unlock it',
        content: 'Enter your TradingView username to access Cockpit.',
        position: 'bottom',
        interactive: true
      },
      {
        id: 'suite-performance',
        page: 'cockpit',
        selector: '.suite-tab[data-suite-panel="performance"]',
        title: 'Performance Tracker',
        content: 'Upload your MT5 history. AI grades your edge and tells you what to fix.',
        position: 'bottom'
      },
      {
        id: 'suite-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="suite"]',
        title: 'Full menu unlocked',
        content: 'All 255 combinations from all instruments. Build anything.',
        position: 'bottom'
      }
    ]
  };

  // Timing constants (ms)
  const TIMING = {
    menuOpen: 400,
    navHighlight: 600,
    navClick: 300,
    pageTransition: 500,
    spotlightMove: 400,
    calloutFade: 300
  };

  // State
  let isActive = false;
  let currentSection = null;
  let currentStepIndex = 0;
  let sectionsToPlay = [];
  let allSteps = [];
  let completedSections = [];
  let elements = {};

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
   * Start the tour
   */
  async function start() {
    if (allSteps.length === 0) return;
    
    isActive = true;
    currentStepIndex = 0;
    
    lockScroll();
    createUI();
    await playStep(0);
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
          <h4 class="tour-title"></h4>
          <p class="tour-content"></p>
          <div class="tour-footer">
            <span class="tour-progress"></span>
            <div class="tour-buttons">
              <button class="tour-skip">Skip</button>
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
      
      .tour-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.5);
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
      }
      .tour-overlay.active { opacity: 1; }
      
      .tour-spotlight {
        position: absolute;
        border-radius: 10px;
        border: 2px solid #c9a84c;
        box-shadow: 
          0 0 0 9999px rgba(0,0,0,0.5),
          0 0 30px rgba(201,168,76,0.4),
          inset 0 0 0 1px rgba(201,168,76,0.2);
        transition: all ${TIMING.spotlightMove}ms cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }
      
      .tour-callout {
        position: absolute;
        background: #1a1a1f;
        border: 1px solid #c9a84c;
        border-radius: 12px;
        width: 280px;
        max-width: calc(100vw - 32px);
        opacity: 0;
        transform: translateY(8px);
        transition: opacity ${TIMING.calloutFade}ms ease, transform ${TIMING.calloutFade}ms ease;
        pointer-events: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      }
      .tour-callout.active {
        opacity: 1;
        transform: translateY(0);
      }
      
      .tour-body {
        padding: 16px;
      }
      
      .tour-title {
        font-size: 15px;
        font-weight: 600;
        color: #c9a84c;
        margin: 0 0 6px 0;
      }
      
      .tour-content {
        font-size: 13px;
        line-height: 1.5;
        color: #a0a0a0;
        margin: 0 0 14px 0;
      }
      
      .tour-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .tour-progress {
        font-size: 11px;
        color: #666;
        font-family: monospace;
      }
      
      .tour-buttons {
        display: flex;
        gap: 8px;
      }
      
      .tour-buttons button {
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
      }
      
      .tour-skip {
        background: transparent;
        border: 1px solid #333;
        color: #666;
      }
      .tour-skip:hover {
        border-color: #888;
        color: #888;
      }
      
      .tour-next {
        background: #c9a84c;
        border: none;
        color: #000;
      }
      .tour-next:hover {
        background: #e6c876;
      }
      
      .tour-arrow {
        position: absolute;
        width: 10px;
        height: 10px;
        background: #1a1a1f;
        border: 1px solid #c9a84c;
        transform: rotate(45deg);
      }
      .tour-arrow.top {
        top: -6px;
        border-right: none;
        border-bottom: none;
      }
      .tour-arrow.bottom {
        bottom: -6px;
        border-left: none;
        border-top: none;
      }
      .tour-arrow.left {
        left: -6px;
        border-right: none;
        border-top: none;
      }
      .tour-arrow.right {
        right: -6px;
        border-left: none;
        border-bottom: none;
      }
      
      /* Nav highlight animation */
      .tour-nav-highlight {
        position: relative;
      }
      .tour-nav-highlight::after {
        content: '';
        position: absolute;
        inset: -4px;
        border: 2px solid #c9a84c;
        border-radius: 8px;
        animation: tourPulse 0.8s ease-in-out infinite;
      }
      @keyframes tourPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.02); }
      }
      
      /* Mobile adjustments */
      @media (max-width: 650px) {
        .tour-callout {
          width: 260px;
        }
        .tour-body {
          padding: 14px;
        }
        .tour-title {
          font-size: 14px;
        }
        .tour-content {
          font-size: 12px;
          margin-bottom: 12px;
        }
        .tour-buttons button {
          padding: 7px 12px;
          font-size: 11px;
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
      title: container.querySelector('.tour-title'),
      content: container.querySelector('.tour-content'),
      progress: container.querySelector('.tour-progress'),
      arrow: container.querySelector('.tour-arrow'),
      skipBtn: container.querySelector('.tour-skip'),
      nextBtn: container.querySelector('.tour-next')
    };
    
    // Bind events
    elements.skipBtn.onclick = exit;
    elements.nextBtn.onclick = next;
    
    // Activate overlay with slight delay
    requestAnimationFrame(() => {
      elements.overlay.classList.add('active');
    });
  }

  /**
   * Destroy tour UI
   */
  function destroyUI() {
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
      // Save state for resume
      sessionStorage.setItem('qp_tour_state', JSON.stringify({
        sectionsToPlay,
        currentStepIndex: index,
        completedSections
      }));
      
      await navigateToPage(step.page);
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
    const pad = 6;
    Object.assign(elements.spotlight.style, {
      left: (rect.left - pad) + 'px',
      top: (rect.top - pad) + 'px',
      width: (rect.width + pad * 2) + 'px',
      height: (rect.height + pad * 2) + 'px'
    });
    
    await sleep(TIMING.spotlightMove);
    
    // Update callout content
    elements.title.textContent = step.title;
    elements.content.textContent = step.content;
    elements.progress.textContent = `${index + 1} / ${allSteps.length}`;
    elements.nextBtn.textContent = index === allSteps.length - 1 ? 'Finish' : 'Next →';
    
    // Position callout
    positionCallout(step.position, rect);
    
    // Show callout
    elements.callout.classList.add('active');
  }

  /**
   * Position callout relative to target
   */
  function positionCallout(position, targetRect) {
    const callout = elements.callout;
    const arrow = elements.arrow;
    const gap = 12;
    const calloutWidth = 280;
    const isMobile = window.innerWidth <= 650;
    
    // Reset arrow classes
    arrow.className = 'tour-arrow';
    
    let left, top;
    
    // Calculate position
    switch (position) {
      case 'top':
        left = targetRect.left + (targetRect.width - calloutWidth) / 2;
        top = targetRect.top - callout.offsetHeight - gap;
        arrow.classList.add('bottom');
        arrow.style.left = '50%';
        arrow.style.marginLeft = '-5px';
        arrow.style.top = '';
        break;
        
      case 'bottom':
        left = targetRect.left + (targetRect.width - calloutWidth) / 2;
        top = targetRect.bottom + gap;
        arrow.classList.add('top');
        arrow.style.left = '50%';
        arrow.style.marginLeft = '-5px';
        arrow.style.top = '';
        break;
        
      case 'left':
        left = targetRect.left - calloutWidth - gap;
        top = targetRect.top + (targetRect.height - callout.offsetHeight) / 2;
        arrow.classList.add('right');
        arrow.style.top = '50%';
        arrow.style.marginTop = '-5px';
        arrow.style.left = '';
        break;
        
      case 'right':
        left = targetRect.right + gap;
        top = targetRect.top + (targetRect.height - callout.offsetHeight) / 2;
        arrow.classList.add('left');
        arrow.style.top = '50%';
        arrow.style.marginTop = '-5px';
        arrow.style.left = '';
        break;
    }
    
    // Keep on screen
    const maxLeft = window.innerWidth - calloutWidth - 16;
    const maxTop = window.innerHeight - callout.offsetHeight - 16;
    left = Math.max(16, Math.min(left, maxLeft));
    top = Math.max(16, Math.min(top, maxTop));
    
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
