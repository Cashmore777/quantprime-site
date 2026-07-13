/**
 * QUANT PRIME — Immersive Experience
 * GSAP + Lenis + Canvas animations
 */

// ═══════════════════════════════════════════════════════════════
// LENIS SMOOTH SCROLL
// ═══════════════════════════════════════════════════════════════

const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Connect Lenis to GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// ═══════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════

gsap.to('.progress-bar', {
    width: '100%',
    ease: 'none',
    scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3
    }
});

// ═══════════════════════════════════════════════════════════════
// INDICATOR CANVAS BACKGROUND
// ═══════════════════════════════════════════════════════════════

const indicatorCanvas = document.getElementById('indicator-canvas');
const ctx = indicatorCanvas.getContext('2d');

function resizeCanvas() {
    indicatorCanvas.width = window.innerWidth;
    indicatorCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Generate flowing indicator lines
const lines = [];
const numLines = 5;

for (let i = 0; i < numLines; i++) {
    lines.push({
        points: [],
        speed: 0.5 + Math.random() * 1,
        amplitude: 30 + Math.random() * 50,
        frequency: 0.01 + Math.random() * 0.02,
        offset: Math.random() * 1000,
        y: (indicatorCanvas.height / (numLines + 1)) * (i + 1),
        color: i % 2 === 0 ? 'rgba(0, 171, 255, 0.3)' : 'rgba(201, 168, 76, 0.2)'
    });
}

let time = 0;

function drawIndicatorLines() {
    ctx.clearRect(0, 0, indicatorCanvas.width, indicatorCanvas.height);
    
    lines.forEach(line => {
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= indicatorCanvas.width; x += 5) {
            const y = line.y + Math.sin((x * line.frequency) + time * line.speed + line.offset) * line.amplitude;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    });
    
    time += 0.02;
    requestAnimationFrame(drawIndicatorLines);
}

drawIndicatorLines();

// ═══════════════════════════════════════════════════════════════
// SCENE 1: LOGO ZOOM
// ═══════════════════════════════════════════════════════════════

const logoContainer = document.querySelector('.logo-container');
const logoBadge = document.querySelector('.logo-badge');
const logoTagline = document.querySelector('.logo-tagline');
const scrollIndicator = document.querySelector('.scroll-indicator');

// Initial tagline fade in
gsap.to(logoTagline, {
    opacity: 1,
    y: 0,
    duration: 1,
    delay: 0.5,
    ease: 'power2.out'
});

// Logo zoom on scroll - you zoom INTO the logo
gsap.timeline({
    scrollTrigger: {
        trigger: '.scene-logo',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        pin: logoContainer,
        pinSpacing: false
    }
})
.to(logoBadge, {
    scale: 30,
    rotation: 180,
    ease: 'power2.in'
}, 0)
.to('.logo-glow', {
    scale: 40,
    opacity: 0,
    ease: 'power2.in'
}, 0)
.to(logoTagline, {
    opacity: 0,
    y: -50,
    ease: 'power2.in'
}, 0)
.to(logoContainer, {
    opacity: 0,
    ease: 'power2.in'
}, 0.7)
.to(scrollIndicator, {
    opacity: 0,
    y: 20
}, 0);

// Show nav after logo zoom
ScrollTrigger.create({
    trigger: '.scene-crawl',
    start: 'top 80%',
    onEnter: () => document.querySelector('.nav').classList.add('visible'),
    onLeaveBack: () => document.querySelector('.nav').classList.remove('visible')
});

// ═══════════════════════════════════════════════════════════════
// SCENE 2: STAR WARS CRAWL
// ═══════════════════════════════════════════════════════════════

const crawlContainer = document.querySelector('.crawl-container');
const crawlContent = document.querySelector('.crawl-content');

gsap.timeline({
    scrollTrigger: {
        trigger: '.scene-crawl',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        pin: crawlContainer,
        pinSpacing: false,
        onEnter: () => gsap.to(crawlContainer, { opacity: 1, duration: 0.5 }),
        onLeaveBack: () => gsap.to(crawlContainer, { opacity: 0, duration: 0.5 })
    }
})
.fromTo(crawlContent, 
    { y: '100%' },
    { y: '-100%', ease: 'none' }
);

// ═══════════════════════════════════════════════════════════════
// SCENE 3: SYSTEMS REVEAL
// ═══════════════════════════════════════════════════════════════

// Header animation
gsap.to('.systems-header', {
    opacity: 1,
    y: 0,
    duration: 1,
    scrollTrigger: {
        trigger: '.systems-header',
        start: 'top 80%'
    }
});

// System cards stagger animation
document.querySelectorAll('.system-card').forEach((card, index) => {
    gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: index * 0.2,
        scrollTrigger: {
            trigger: card,
            start: 'top 85%'
        }
    });
});

// System canvas visualizations
function initSystemCanvas(canvasId, type) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let t = 0;
    
    function resize() {
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
    }
    resize();
    
    function draw() {
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        
        ctx.clearRect(0, 0, w, h);
        
        if (type === 'meridian') {
            // Draw EMA-like lines
            const colors = ['#00abff', '#0085c7', '#005e8c', '#194866'];
            colors.forEach((color, i) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                
                const baseY = h * 0.3 + (i * h * 0.15);
                for (let x = 0; x <= w; x += 3) {
                    const y = baseY + 
                        Math.sin((x * 0.02) + t * 0.5 + i) * 20 +
                        Math.sin((x * 0.005) + t * 0.2) * 30;
                    
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            });
            
            // Draw LP levels
            ctx.strokeStyle = 'rgba(0, 171, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            [0.25, 0.45, 0.65, 0.85].forEach(pct => {
                ctx.beginPath();
                ctx.moveTo(0, h * pct);
                ctx.lineTo(w, h * pct);
                ctx.stroke();
            });
            ctx.setLineDash([]);
            
        } else if (type === 'recoil') {
            // Draw volatility bands
            const centerY = h * 0.5;
            
            for (let band = 1; band <= 8; band++) {
                const alpha = band <= 5 ? 0.1 : band === 6 ? 0.3 : band === 7 ? 0.5 : 0.8;
                const spread = band * 8;
                
                ctx.fillStyle = band <= 5 ? `rgba(0, 171, 255, ${alpha})` :
                               band === 6 ? `rgba(255, 235, 59, ${alpha})` :
                               band === 7 ? `rgba(255, 152, 0, ${alpha})` :
                               `rgba(242, 54, 69, ${alpha})`;
                
                ctx.beginPath();
                for (let x = 0; x <= w; x += 3) {
                    const wave = Math.sin((x * 0.01) + t * 0.3) * spread;
                    const y = centerY - wave - spread;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                for (let x = w; x >= 0; x -= 3) {
                    const wave = Math.sin((x * 0.01) + t * 0.3) * spread;
                    const y = centerY + wave + spread;
                    ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            }
            
        } else if (type === 'executor') {
            // Draw data flow lines
            const numFlows = 8;
            for (let i = 0; i < numFlows; i++) {
                const startX = (w / numFlows) * i + (w / numFlows / 2);
                const progress = ((t * 50 + i * 100) % (h + 100)) - 50;
                
                ctx.beginPath();
                ctx.strokeStyle = i % 2 === 0 ? '#00abff' : '#c9a84c';
                ctx.lineWidth = 2;
                ctx.moveTo(startX, progress);
                ctx.lineTo(startX, progress + 30);
                ctx.stroke();
                
                // Signal dot
                ctx.beginPath();
                ctx.fillStyle = i % 2 === 0 ? '#00abff' : '#c9a84c';
                ctx.arc(startX, progress, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        t += 0.02;
        animationId = requestAnimationFrame(draw);
    }
    
    // Start animation when in view
    ScrollTrigger.create({
        trigger: canvas,
        start: 'top 90%',
        end: 'bottom 10%',
        onEnter: () => draw(),
        onLeave: () => cancelAnimationFrame(animationId),
        onEnterBack: () => draw(),
        onLeaveBack: () => cancelAnimationFrame(animationId)
    });
}

initSystemCanvas('meridian-canvas', 'meridian');
initSystemCanvas('recoil-canvas', 'recoil');
initSystemCanvas('executor-canvas', 'executor');

// ═══════════════════════════════════════════════════════════════
// SCENE 4: PROOF CARDS
// ═══════════════════════════════════════════════════════════════

document.querySelectorAll('.proof-card').forEach((card, index) => {
    gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: index * 0.15,
        scrollTrigger: {
            trigger: card,
            start: 'top 85%'
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// SCENE 5: PRICING CARDS
// ═══════════════════════════════════════════════════════════════

document.querySelectorAll('.price-card').forEach((card, index) => {
    gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: index * 0.1,
        scrollTrigger: {
            trigger: '.pricing-grid',
            start: 'top 80%'
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// PARALLAX DEPTH EFFECT
// ═══════════════════════════════════════════════════════════════

document.querySelectorAll('.scene').forEach(scene => {
    gsap.to(scene, {
        backgroundPositionY: '30%',
        ease: 'none',
        scrollTrigger: {
            trigger: scene,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// CONSOLE BRANDING
// ═══════════════════════════════════════════════════════════════

console.log('%c QUANT PRIME ', 'background: linear-gradient(135deg, #00abff, #c9a84c); color: #030308; font-weight: bold; padding: 8px 16px; font-size: 14px;');
console.log('%c Institutional-Grade Market Intelligence ', 'color: #c9a84c; font-size: 12px;');
console.log('%c https://quantprime.uk ', 'color: #00abff;');
