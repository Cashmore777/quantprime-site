/**
 * QP Dashboard Onboarding Tour Engine
 * 
 * Self-navigating tour system that moves users through dashboard sections.
 * Tracks completion per-section, not per-tier.
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

  // Tour step definitions
  const TOUR_STEPS = {
    research: [
      {
        id: 'research-intro',
        page: 'research',
        selector: '#view-research .view-header',
        title: 'Welcome to Research',
        content: 'This is your research hub. Here you\'ll find papers explaining the logic behind every indicator we build.',
        position: 'bottom'
      },
      {
        id: 'research-papers',
        page: 'research',
        selector: '.research-grid',
        title: 'Research Papers',
        content: 'Each paper dives deep into a specific concept—why it works, when it fails, and how we validated it.',
        position: 'top'
      },
      {
        id: 'research-build-intro',
        page: 'marketplace',
        selector: '#view-marketplace .view-header',
        title: 'The Build System',
        content: 'This is where indicators are built. Think of it as a restaurant menu—you pick one dish from each course.',
        position: 'bottom'
      },
      {
        id: 'research-tier-ladder',
        page: 'marketplace',
        selector: '.tier-ladder',
        title: 'Your Tier Menu',
        content: 'Each tier unlocks a different menu. You\'re on Research, so you can build from the Research menu with 255 possible combinations.',
        position: 'bottom'
      },
      {
        id: 'research-courses',
        page: 'marketplace',
        selector: '.menu-courses',
        title: 'Pick Your Dishes',
        content: 'Four courses, three dishes each. Pick one from every course and we generate a custom Pine Script just for you.',
        position: 'right'
      },
      {
        id: 'research-generate',
        page: 'marketplace',
        selector: '.generate-btn',
        title: 'Generate Your Indicator',
        content: 'Once you\'ve selected all four dishes, hit Generate. Your custom indicator downloads instantly.',
        position: 'top'
      }
    ],
    
    recoil: [
      {
        id: 'recoil-intro',
        page: 'recoil',
        selector: '#view-recoil .view-header',
        title: 'Meet Recoil',
        content: 'Recoil is a volatility-based instrument. It measures when price has stretched too far and marks potential mean-reversion entries.',
        position: 'bottom'
      },
      {
        id: 'recoil-animation',
        page: 'recoil',
        selector: '.recoil-hero',
        title: 'How It Works',
        content: 'Watch the animation—Recoil tracks volatility expansion and flags the snap-back. Green signals mark potential longs, red marks shorts.',
        position: 'bottom'
      },
      {
        id: 'recoil-tv-access',
        page: 'recoil',
        selector: '#tv-username-recoil',
        title: 'Connect TradingView',
        content: 'Enter your exact TradingView username here. This grants you access to the live Recoil indicator on TradingView.',
        position: 'bottom',
        interactive: true,
        inputId: 'tv-username-recoil'
      },
      {
        id: 'recoil-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="recoil"]',
        title: 'Recoil Build Menu',
        content: 'Now you can also build from the Recoil menu—255 more combinations tuned for volatility strategies.',
        position: 'bottom'
      },
      {
        id: 'recoil-guide',
        page: 'recoil',
        selector: '.instrument-tab[data-panel="recoil-guide"]',
        title: 'Operator Guide',
        content: 'Read this once. It explains every setting, where Recoil fails, and how to avoid the common mistakes.',
        position: 'bottom'
      }
    ],
    
    terminal: [
      {
        id: 'terminal-intro',
        page: 'meridian',
        selector: '#view-meridian .view-header',
        title: 'Meet Meridian (Terminal)',
        content: 'Meridian tracks the AMD cycle—Accumulation, Manipulation, Distribution. It marks conditions when a level is swept and price rejects.',
        position: 'bottom'
      },
      {
        id: 'terminal-animation',
        page: 'meridian',
        selector: '.meridian-hero',
        title: 'The AMD Cycle',
        content: 'Watch the phases. A-lines form during accumulation, sweeps happen in manipulation, and distribution is where the move plays out.',
        position: 'bottom'
      },
      {
        id: 'terminal-tv-access',
        page: 'meridian',
        selector: '#tv-username-meridian',
        title: 'Connect TradingView',
        content: 'Enter your TradingView username to unlock Meridian on your charts.',
        position: 'bottom',
        interactive: true,
        inputId: 'tv-username-meridian'
      },
      {
        id: 'terminal-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="terminal"]',
        title: 'Terminal Build Menu',
        content: 'The Terminal menu unlocks 255 AMD-focused combinations. Same system, different logic.',
        position: 'bottom'
      },
      {
        id: 'terminal-guide',
        page: 'meridian',
        selector: '.instrument-tab[data-panel="meridian-guide"]',
        title: 'Operator Guide',
        content: 'Critical reading. Meridian has a hard failure mode above 15M charts—the guide explains why.',
        position: 'bottom'
      }
    ],
    
    suite: [
      {
        id: 'suite-intro',
        page: 'cockpit',
        selector: '#view-cockpit .view-header',
        title: 'Welcome to Suite',
        content: 'Suite gives you everything. Cockpit is the multi-timeframe overlay—EMA stacks, liquidity levels, FVGs, and the fractal dashboard.',
        position: 'bottom'
      },
      {
        id: 'suite-animation',
        page: 'cockpit',
        selector: '.cockpit-hero',
        title: 'The Full Picture',
        content: 'Four EMAs, three timeframes of LP levels, fair value gaps, and a regime score. Pure awareness—no signals, just context.',
        position: 'bottom'
      },
      {
        id: 'suite-tv-access',
        page: 'cockpit',
        selector: '#tv-username-cockpit',
        title: 'Connect TradingView',
        content: 'Enter your TradingView username to unlock Cockpit.',
        position: 'bottom',
        interactive: true,
        inputId: 'tv-username-cockpit'
      },
      {
        id: 'suite-build',
        page: 'marketplace',
        selector: '.tier-card[data-tier="suite"]',
        title: 'Suite Build Menu',
        content: 'The final menu. 255 combinations pulling from all three instruments plus Cockpit-specific pieces.',
        position: 'bottom'
      },
      {
        id: 'suite-performance',
        page: 'cockpit',
        selector: '.suite-tab[data-suite-panel="performance"]',
        title: 'Performance Tracker',
        content: 'Suite-exclusive. Upload your MT5 trade history and get AI-powered analysis of your edge.',
        position: 'bottom'
      },
      {
        id: 'suite-guide',
        page: 'cockpit',
        selector: '.suite-tab[data-suite-panel="guide"]',
        title: 'Operator Guide',
        content: 'The Cockpit guide covers how to read the fractal dashboard and what each layer tells you.',
        position: 'bottom'
      }
    ]
  };

  // State
  let isActive = false;
  let currentSection = null;
  let currentStepIndex = 0;
  let sectionsToPlay = [];
  let allSteps = [];
  let completedSections = [];
  let overlay = null;
  let spotlight = null;
  let callout = null;

  /**
   * Initialize tour for a user based on their tier and completed sections
   */
  async function init(userTier, forceSequence = null) {
    // Load completed sections from Supabase
    completedSections = await loadProgress();
    
    if (forceSequence) {
      // Dev testing: force a specific sequence
      sectionsToPlay = forceSequence;
    } else {
      // Normal flow: determine sections to play
      const tierSections = TIER_SECTIONS[userTier] || [];
      sectionsToPlay = tierSections.filter(s => !completedSections.includes(s));
    }
    
    if (sectionsToPlay.length === 0) {
      console.log('QPTour: No sections to play');
      return false;
    }
    
    // Build flat list of all steps
    allSteps = [];
    sectionsToPlay.forEach(section => {
      const sectionSteps = TOUR_STEPS[section] || [];
      sectionSteps.forEach(step => {
        allSteps.push({ ...step, section });
      });
    });
    
    console.log(`QPTour: Will play ${sectionsToPlay.length} sections, ${allSteps.length} total steps`);
    return true;
  }

  /**
   * Start the tour
   */
  async function start() {
    if (allSteps.length === 0) {
      console.warn('QPTour: No steps to play. Call init() first.');
      return;
    }
    
    isActive = true;
    currentStepIndex = 0;
    
    createOverlay();
    await playStep(0);
  }

  /**
   * Load user's tour progress from Supabase
   */
  async function loadProgress() {
    try {
      const { data, error } = await supabaseClient
        .from('tour_progress')
        .select('sections_completed')
        .eq('user_id', authUser?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('QPTour: Error loading progress', error);
        return [];
      }
      
      return data?.sections_completed || [];
    } catch (e) {
      console.error('QPTour: Exception loading progress', e);
      return [];
    }
  }

  /**
   * Save section completion to Supabase
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
   * Create the overlay elements
   */
  function createOverlay() {
    // Remove existing if any
    destroyOverlay();
    
    // Overlay backdrop
    overlay = document.createElement('div');
    overlay.id = 'tour-overlay';
    overlay.innerHTML = `
      <style>
        #tour-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          pointer-events: none;
        }
        #tour-spotlight {
          position: absolute;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.75);
          border-radius: 8px;
          transition: all 0.3s ease;
          pointer-events: none;
        }
        #tour-callout {
          position: absolute;
          background: var(--surface, #1a1a1f);
          border: 1px solid var(--gold, #c9a84c);
          border-radius: 12px;
          padding: 20px;
          max-width: 340px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          pointer-events: auto;
          z-index: 10001;
        }
        #tour-callout h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--gold, #c9a84c);
        }
        #tour-callout p {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-2, #a0a0a0);
          margin: 0 0 16px 0;
        }
        #tour-callout .tour-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        #tour-callout .tour-progress {
          font-size: 12px;
          color: var(--text-3, #666);
          font-family: var(--mono, monospace);
        }
        #tour-callout .tour-buttons {
          display: flex;
          gap: 8px;
        }
        #tour-callout button {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        #tour-callout .tour-skip {
          background: transparent;
          border: 1px solid var(--border, #333);
          color: var(--text-3, #666);
        }
        #tour-callout .tour-skip:hover {
          border-color: var(--text-2, #888);
          color: var(--text-2, #888);
        }
        #tour-callout .tour-next {
          background: var(--gold, #c9a84c);
          border: none;
          color: #000;
        }
        #tour-callout .tour-next:hover {
          background: var(--gold-bright, #e6c876);
        }
        #tour-callout .tour-arrow {
          position: absolute;
          width: 12px;
          height: 12px;
          background: var(--surface, #1a1a1f);
          border: 1px solid var(--gold, #c9a84c);
          transform: rotate(45deg);
        }
        #tour-callout .tour-arrow.top { top: -7px; border-right: none; border-bottom: none; }
        #tour-callout .tour-arrow.bottom { bottom: -7px; border-left: none; border-top: none; }
        #tour-callout .tour-arrow.left { left: -7px; border-right: none; border-top: none; }
        #tour-callout .tour-arrow.right { right: -7px; border-left: none; border-bottom: none; }
      </style>
      <div id="tour-spotlight"></div>
    `;
    document.body.appendChild(overlay);
    
    spotlight = document.getElementById('tour-spotlight');
    
    // Callout (separate for pointer-events)
    callout = document.createElement('div');
    callout.id = 'tour-callout';
    document.body.appendChild(callout);
  }

  /**
   * Destroy overlay elements
   */
  function destroyOverlay() {
    document.getElementById('tour-overlay')?.remove();
    document.getElementById('tour-callout')?.remove();
    overlay = null;
    spotlight = null;
    callout = null;
  }

  /**
   * Play a specific step
   */
  async function playStep(index) {
    if (index >= allSteps.length) {
      await finish();
      return;
    }
    
    const step = allSteps[index];
    currentStepIndex = index;
    currentSection = step.section;
    
    // Navigate to correct page if needed
    const currentView = document.querySelector('.view.active')?.id?.replace('view-', '');
    if (step.page !== currentView) {
      // Store tour state before navigation
      sessionStorage.setItem('qp_tour_active', JSON.stringify({
        sectionsToPlay,
        currentStepIndex: index,
        completedSections
      }));
      
      // Navigate
      switchView(step.page);
      
      // Wait for view to render
      await new Promise(r => setTimeout(r, 300));
    }
    
    // Find target element
    const target = document.querySelector(step.selector);
    if (!target) {
      console.warn(`QPTour: Element not found: ${step.selector}`);
      // Skip to next step
      await playStep(index + 1);
      return;
    }
    
    // Position spotlight
    const rect = target.getBoundingClientRect();
    const padding = 8;
    spotlight.style.left = (rect.left - padding) + 'px';
    spotlight.style.top = (rect.top - padding) + 'px';
    spotlight.style.width = (rect.width + padding * 2) + 'px';
    spotlight.style.height = (rect.height + padding * 2) + 'px';
    
    // Scroll element into view if needed
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Render callout
    renderCallout(step, rect);
  }

  /**
   * Render the callout for a step
   */
  function renderCallout(step, targetRect) {
    const isLastStep = currentStepIndex === allSteps.length - 1;
    const isLastInSection = currentStepIndex === allSteps.length - 1 || 
      allSteps[currentStepIndex + 1]?.section !== step.section;
    
    callout.innerHTML = `
      <div class="tour-arrow ${step.position}"></div>
      <h4>${step.title}</h4>
      <p>${step.content}</p>
      <div class="tour-footer">
        <span class="tour-progress">${currentStepIndex + 1} of ${allSteps.length}</span>
        <div class="tour-buttons">
          <button class="tour-skip" onclick="QPTour.exit()">Skip Tour</button>
          <button class="tour-next" onclick="QPTour.next()">
            ${isLastStep ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    `;
    
    // Position callout
    const calloutRect = callout.getBoundingClientRect();
    let left, top;
    const gap = 16;
    
    switch (step.position) {
      case 'top':
        left = targetRect.left + (targetRect.width - 340) / 2;
        top = targetRect.top - calloutRect.height - gap;
        break;
      case 'bottom':
        left = targetRect.left + (targetRect.width - 340) / 2;
        top = targetRect.bottom + gap;
        break;
      case 'left':
        left = targetRect.left - 340 - gap;
        top = targetRect.top + (targetRect.height - calloutRect.height) / 2;
        break;
      case 'right':
        left = targetRect.right + gap;
        top = targetRect.top + (targetRect.height - calloutRect.height) / 2;
        break;
    }
    
    // Keep on screen
    left = Math.max(16, Math.min(left, window.innerWidth - 356));
    top = Math.max(16, Math.min(top, window.innerHeight - calloutRect.height - 16));
    
    callout.style.left = left + 'px';
    callout.style.top = top + 'px';
    
    // Position arrow
    const arrow = callout.querySelector('.tour-arrow');
    if (step.position === 'top' || step.position === 'bottom') {
      arrow.style.left = Math.min(160, Math.max(20, targetRect.left + targetRect.width / 2 - left)) + 'px';
    } else {
      arrow.style.top = Math.min(60, Math.max(20, targetRect.top + targetRect.height / 2 - top)) + 'px';
    }
  }

  /**
   * Move to next step
   */
  async function next() {
    const currentStep = allSteps[currentStepIndex];
    const nextStep = allSteps[currentStepIndex + 1];
    
    // If section is changing, mark current section complete
    if (!nextStep || nextStep.section !== currentStep.section) {
      await markSectionComplete(currentStep.section);
    }
    
    await playStep(currentStepIndex + 1);
  }

  /**
   * Exit/skip tour
   */
  function exit() {
    isActive = false;
    destroyOverlay();
    sessionStorage.removeItem('qp_tour_active');
    console.log('QPTour: Exited');
  }

  /**
   * Finish tour
   */
  async function finish() {
    // Mark final section complete
    if (currentSection && !completedSections.includes(currentSection)) {
      await markSectionComplete(currentSection);
    }
    
    isActive = false;
    destroyOverlay();
    sessionStorage.removeItem('qp_tour_active');
    
    // Show completion toast
    if (typeof showToast === 'function') {
      showToast('🎉 Tour complete! You\'re ready to go.', 'success');
    }
    
    console.log('QPTour: Finished');
  }

  /**
   * Resume tour from session storage (after page navigation)
   */
  async function resumeIfActive() {
    const stored = sessionStorage.getItem('qp_tour_active');
    if (!stored) return false;
    
    try {
      const state = JSON.parse(stored);
      sectionsToPlay = state.sectionsToPlay;
      completedSections = state.completedSections;
      
      // Rebuild steps
      allSteps = [];
      sectionsToPlay.forEach(section => {
        const sectionSteps = TOUR_STEPS[section] || [];
        sectionSteps.forEach(step => {
          allSteps.push({ ...step, section });
        });
      });
      
      isActive = true;
      createOverlay();
      
      // Small delay for page to render
      await new Promise(r => setTimeout(r, 200));
      await playStep(state.currentStepIndex);
      
      return true;
    } catch (e) {
      console.error('QPTour: Error resuming', e);
      sessionStorage.removeItem('qp_tour_active');
      return false;
    }
  }

  /**
   * Check if user needs onboarding (for auto-triggering)
   */
  async function shouldAutoStart(userTier) {
    const tierSections = TIER_SECTIONS[userTier] || [];
    if (tierSections.length === 0) return false;
    
    const completed = await loadProgress();
    const unseenSections = tierSections.filter(s => !completed.includes(s));
    
    return unseenSections.length > 0;
  }

  // Public API
  return {
    init,
    start,
    next,
    exit,
    resumeIfActive,
    shouldAutoStart,
    isActive: () => isActive,
    
    // Dev testing helpers
    getSteps: () => TOUR_STEPS,
    getSectionOrder: () => SECTION_ORDER,
    getTierSections: () => TIER_SECTIONS
  };
})();

// Auto-resume if navigated mid-tour
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => QPTour.resumeIfActive(), 500);
});
