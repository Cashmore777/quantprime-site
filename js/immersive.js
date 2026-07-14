/**
 * QUANT PRIME — Immersive 3D Experience
 * Three.js + GSAP ScrollTrigger + GLB Model
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ═══════════════════════════════════════════════════════════════
// GLOBALS
// ═══════════════════════════════════════════════════════════════

let scene, camera, renderer, logoGroup;
let scrollProgress = 0;

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
// THREE.JS SCENE SETUP
// ═══════════════════════════════════════════════════════════════

async function initThreeJS() {
    const container = document.getElementById('logo-3d-container');
    if (!container) return;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);

    // Environment map for realistic metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;
    scene.environment = environment;
    pmremGenerator.dispose();

    // Lighting - bright and warm
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 2);
    fillLight.position.set(-5, 3, 5);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 2);
    backLight.position.set(0, 0, -5);
    scene.add(backLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 2);
    topLight.position.set(0, 10, 2);
    scene.add(topLight);

    // Load the 3D logo
    await loadLogo();

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Start render loop
    animate();

    // Setup scroll animation
    setupScrollAnimation();
}

// ═══════════════════════════════════════════════════════════════
// LOAD GLB MODEL
// ═══════════════════════════════════════════════════════════════

async function loadLogo() {
    const loader = new GLTFLoader();
    
    try {
        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                'assets/quant-prime-logo.glb',
                resolve,
                (progress) => {
                    console.log('Loading:', (progress.loaded / progress.total * 100) + '%');
                },
                reject
            );
        });

        logoGroup = gltf.scene;
        
        // Center the entire scene by wrapping in a group and offsetting
        const wrapper = new THREE.Group();
        wrapper.add(logoGroup);
        
        // Calculate bounds and center
        const box = new THREE.Box3().setFromObject(wrapper);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Offset the inner group to center everything
        logoGroup.position.set(-center.x, -center.y, -center.z);
        
        // Scale to fit
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        wrapper.scale.setScalar(scale);
        
        // Use wrapper as our logo group
        logoGroup = wrapper;
        
        // Premium gold material with environment reflections
        const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xc9a84c,
            metalness: 1.0,
            roughness: 0.15,
            envMapIntensity: 1.5,
            transparent: true,
            opacity: 1
        });

        // Apply to ALL meshes - smooth normals + gold material
        let meshCount = 0;
        logoGroup.traverse((child) => {
            if (child.isMesh) {
                // Smooth the geometry by computing vertex normals
                if (child.geometry) {
                    child.geometry.computeVertexNormals();
                }
                child.material = goldMaterial;
                child.visible = true;
                meshCount++;
                console.log('Applied material to:', child.name, 'position:', child.position);
            }
        });
        console.log('Total meshes:', meshCount);

        // Rotate to face camera correctly
        logoGroup.rotation.x = -Math.PI / 2;  // Face camera
        logoGroup.rotation.y = Math.PI;        // Flip right-side up
        
        // Store base scale BEFORE mirroring
        logoGroup.userData.baseScale = logoGroup.scale.x;
        logoGroup.userData.needsMirror = true;
        
        logoGroup.scale.x *= -1;               // Mirror to fix text direction
        
        scene.add(logoGroup);
        
        console.log('Logo loaded successfully');
        
    } catch (error) {
        console.error('Failed to load logo:', error);
        createFallbackLogo();
    }
}

// Fallback if GLB fails to load
function createFallbackLogo() {
    logoGroup = new THREE.Group();
    
    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xc9a84c,
        metalness: 0.9,
        roughness: 0.2
    });
    
    // Simple ring as fallback
    const ringGeo = new THREE.TorusGeometry(1.5, 0.1, 16, 100);
    const ring = new THREE.Mesh(ringGeo, goldMaterial);
    logoGroup.add(ring);
    
    scene.add(logoGroup);
}

// ═══════════════════════════════════════════════════════════════
// SCROLL ANIMATION - LOGO + CRAWL SEAMLESS TRANSITION
// ═══════════════════════════════════════════════════════════════

function setupScrollAnimation() {
    const logoSection = document.querySelector('.scene-logo');
    const tagline = document.querySelector('.logo-tagline');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const crawlContainer = document.querySelector('.crawl-container');

    // Fade in tagline on load
    gsap.to(tagline, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.5
    });

    // Main scroll animation - zoom INTO the logo, fade out EARLY
    ScrollTrigger.create({
        trigger: logoSection,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
            scrollProgress = self.progress;
            
            if (logoGroup) {
                // Zoom: scale up as you scroll
                const scale = 1 + (scrollProgress * 8);
                const baseScale = logoGroup.userData.baseScale || 1;
                
                // Scale while preserving the mirror on X axis
                logoGroup.scale.x = -baseScale * scale;  // Negative for mirror
                logoGroup.scale.y = baseScale * scale;
                logoGroup.scale.z = baseScale * scale;
                
                // Rotate as we zoom (spinning top style on Z-axis)
                logoGroup.rotation.z += 0.005;
                
                // Move camera forward slightly
                camera.position.z = 5 - (scrollProgress * 2);
                
                // EARLY FADE - logo gone by 25% scroll
                let logoOpacity = Math.max(0, 1 - (scrollProgress * 4));
                logoGroup.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = true;
                        child.material.opacity = logoOpacity;
                    }
                });
                
                // Hide container when fully transparent
                const container = document.getElementById('logo-3d-container');
                if (container) {
                    container.style.opacity = logoOpacity;
                    container.style.display = logoOpacity === 0 ? 'none' : 'block';
                }
                
                // CRAWL FADE IN - starts at 10% scroll, fully visible by 30%
                if (crawlContainer) {
                    const crawlStart = 0.1;
                    const crawlFull = 0.3;
                    let crawlOpacity = 0;
                    
                    if (scrollProgress > crawlStart) {
                        crawlOpacity = Math.min(1, (scrollProgress - crawlStart) / (crawlFull - crawlStart));
                    }
                    
                    crawlContainer.style.opacity = crawlOpacity;
                    crawlContainer.classList.toggle('active', crawlOpacity > 0);
                }
            }
            
            // Fade out tagline and scroll indicator FAST
            if (tagline) tagline.style.opacity = Math.max(0, 1 - (scrollProgress * 6));
            if (scrollIndicator) scrollIndicator.style.opacity = Math.max(0, 1 - (scrollProgress * 6));
        }
    });

    // Show nav after logo zoom
    ScrollTrigger.create({
        trigger: '.scene-crawl',
        start: 'top 80%',
        onEnter: () => document.querySelector('.nav')?.classList.add('visible'),
        onLeaveBack: () => document.querySelector('.nav')?.classList.remove('visible')
    });
}

// ═══════════════════════════════════════════════════════════════
// ANIMATION LOOP
// ═══════════════════════════════════════════════════════════════

function animate() {
    requestAnimationFrame(animate);

    if (logoGroup && scrollProgress === 0) {
        // Gentle idle rotation - spinning top style (Z-axis)
        logoGroup.rotation.z += 0.003;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    if (!camera || !renderer) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ═══════════════════════════════════════════════════════════════
// STAR WARS CRAWL - NOW TRIGGERS DURING LOGO FADE
// ═══════════════════════════════════════════════════════════════

function setupCrawl() {
    const crawlContainer = document.querySelector('.crawl-container');
    const crawlContent = document.querySelector('.crawl-content');

    if (!crawlContainer || !crawlContent) return;

    // Crawl visibility now handled in setupScrollAnimation() for seamless handoff

    // Fade out crawl at the END of crawl section
    ScrollTrigger.create({
        trigger: '.scene-crawl',
        start: '75% top',
        end: 'bottom top',
        onUpdate: (self) => {
            crawlContainer.style.opacity = 1 - self.progress;
        },
        onLeave: () => {
            crawlContainer.style.opacity = '0';
            crawlContainer.classList.remove('active');
        },
        onEnterBack: () => {
            crawlContainer.classList.add('active');
            crawlContainer.style.opacity = '1';
        }
    });

    // Scroll text: starts from bottom, moves up through BOTH sections
    gsap.fromTo(crawlContent, 
        { y: '100%' },
        { 
            y: '-150%',
            ease: 'none',
            scrollTrigger: {
                trigger: '.scene-logo',
                start: '10% top',  // Start moving early, synced with crawl fade-in
                endTrigger: '.scene-crawl',
                end: 'bottom top',
                scrub: 0.5
            }
        }
    );
}

// ═══════════════════════════════════════════════════════════════
// SYSTEMS - CLEAN ANIMATIONS (PERFORMANCE OPTIMIZED)
// ═══════════════════════════════════════════════════════════════

function setupSections() {
    // Systems header
    gsap.fromTo('.systems-header', 
        { opacity: 0, y: 50 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.systems-header',
                start: 'top 85%'
            }
        }
    );

    // System cards - slide in from alternating sides
    document.querySelectorAll('.system-card').forEach((card, index) => {
        const isEven = index % 2 === 0;
        
        gsap.fromTo(card, 
            { opacity: 0, x: isEven ? -60 : 60 },
            {
                opacity: 1,
                x: 0,
                duration: 0.7,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 88%'
                }
            }
        );
    });

    // Proof cards - simple fade up
    document.querySelectorAll('.proof-card').forEach((card, index) => {
        gsap.fromTo(card, 
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                delay: index * 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 88%'
                }
            }
        );
    });
}

// ═══════════════════════════════════════════════════════════════
// PRICING CARDS - SIMPLE STAGGERED REVEAL (NO CAROUSEL ON MOBILE)
// ═══════════════════════════════════════════════════════════════

function setupPricingCarousel() {
    const cards = document.querySelectorAll('.price-card');
    if (cards.length === 0) return;

    // Header fade in
    gsap.fromTo('.pricing-container > .section-tag', 
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration: 0.5,
            scrollTrigger: {
                trigger: '.scene-pricing',
                start: 'top 85%'
            }
        }
    );
    
    gsap.fromTo('.pricing-container > h2', 
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration: 0.5,
            scrollTrigger: {
                trigger: '.scene-pricing',
                start: 'top 85%'
            }
        }
    );

    // Check if mobile
    const isMobile = window.innerWidth < 900;
    
    if (isMobile) {
        // Mobile: each card fades in when you scroll to IT specifically
        cards.forEach((card, index) => {
            gsap.fromTo(card, 
                { opacity: 0, y: 40, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%'
                    }
                }
            );
        });
    } else {
        // Desktop: slower carousel with more scroll distance
        const totalCards = cards.length;
        
        ScrollTrigger.create({
            trigger: '.scene-pricing',
            start: 'top 70%',
            end: 'bottom 60%',  // Much longer scroll = slower flip
            scrub: 0.5,
            onUpdate: (self) => {
                const progress = self.progress;
                const cycleProgress = progress * (totalCards - 1);
                
                cards.forEach((card, index) => {
                    const diff = cycleProgress - index;
                    
                    if (Math.abs(diff) < 0.5) {
                        // Current card
                        card.style.transform = 'scale(1)';
                        card.style.opacity = '1';
                        card.style.zIndex = '10';
                    } else if (diff >= 0.5) {
                        // Past
                        card.style.transform = 'scale(0.9)';
                        card.style.opacity = '0.4';
                        card.style.zIndex = '1';
                    } else {
                        // Future
                        card.style.transform = 'scale(0.95)';
                        card.style.opacity = '0.6';
                        card.style.zIndex = '5';
                    }
                });
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM CANVAS VISUALIZATIONS - UPGRADED
// ═══════════════════════════════════════════════════════════════

function initSystemCanvas(canvasId, type) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let t = 0;
    let isActive = false;
    
    // Throttle to 30fps max for performance
    let lastFrame = 0;
    const frameInterval = 1000 / 30;
    
    function resize() {
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
    }
    resize();
    
    function draw(timestamp) {
        if (!isActive) return;
        
        // Throttle framerate
        if (timestamp - lastFrame < frameInterval) {
            animationId = requestAnimationFrame(draw);
            return;
        }
        lastFrame = timestamp;
        
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        ctx.clearRect(0, 0, w, h);
        
        if (type === 'meridian') {
            const colors = ['#00abff', '#0085c7', '#005e8c', '#194866'];
            colors.forEach((color, i) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5 - i * 0.4;
                const baseY = h * 0.25 + (i * h * 0.16);
                for (let x = 0; x <= w; x += 5) {
                    const y = baseY + 
                        Math.sin((x * 0.018) + t * 0.5 + i) * 22 +
                        Math.sin((x * 0.005) + t * 0.2) * 35;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            });
            
            // Grid
            ctx.strokeStyle = 'rgba(0, 171, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            [0.25, 0.5, 0.75].forEach(pct => {
                ctx.beginPath();
                ctx.moveTo(0, h * pct);
                ctx.lineTo(w, h * pct);
                ctx.stroke();
            });
            ctx.setLineDash([]);
            
            // Scan line
            const scanX = (t * 30) % w;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 171, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.moveTo(scanX, 0);
            ctx.lineTo(scanX, h);
            ctx.stroke();
            
        } else if (type === 'recoil') {
            const centerY = h * 0.5;
            for (let band = 8; band >= 1; band--) {
                const spread = band * 9;
                let color;
                if (band <= 5) color = `rgba(0, 171, 255, ${0.05 + band * 0.018})`;
                else if (band === 6) color = 'rgba(255, 235, 59, 0.2)';
                else if (band === 7) color = 'rgba(255, 152, 0, 0.28)';
                else color = 'rgba(242, 54, 69, 0.38)';
                
                ctx.fillStyle = color;
                ctx.beginPath();
                for (let x = 0; x <= w; x += 6) {
                    const wave = Math.sin((x * 0.007) + t * 0.3) * spread * 0.35;
                    const y = centerY - wave - spread;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                for (let x = w; x >= 0; x -= 6) {
                    const wave = Math.sin((x * 0.007) + t * 0.3) * spread * 0.35;
                    const y = centerY + wave + spread;
                    ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            }
            
            // Center pulse
            ctx.beginPath();
            ctx.strokeStyle = '#00abff';
            ctx.lineWidth = 2;
            for (let x = 0; x <= w; x += 6) {
                const y = centerY + Math.sin((x * 0.02) + t * 0.8) * 4;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        t += 0.03;
        animationId = requestAnimationFrame(draw);
    }
    
    ScrollTrigger.create({
        trigger: canvas,
        start: 'top 95%',
        end: 'bottom 5%',
        onEnter: () => { isActive = true; animationId = requestAnimationFrame(draw); },
        onLeave: () => { isActive = false; cancelAnimationFrame(animationId); },
        onEnterBack: () => { isActive = true; animationId = requestAnimationFrame(draw); },
        onLeaveBack: () => { isActive = false; cancelAnimationFrame(animationId); }
    });
    
    window.addEventListener('resize', resize);
}

// ═══════════════════════════════════════════════════════════════
// CTA SECTION
// ═══════════════════════════════════════════════════════════════

function setupCTA() {
    gsap.fromTo('.cta-container h2', 
        { opacity: 0, y: 50 },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
                trigger: '.scene-cta',
                start: 'top 75%'
            }
        }
    );
    
    gsap.fromTo('.cta-container p', 
        { opacity: 0, y: 30 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: 0.2,
            scrollTrigger: {
                trigger: '.scene-cta',
                start: 'top 75%'
            }
        }
    );
    
    gsap.fromTo('.cta-container .btn', 
        { opacity: 0, scale: 0.9 },
        {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            delay: 0.4,
            ease: 'back.out(1.5)',
            scrollTrigger: {
                trigger: '.scene-cta',
                start: 'top 75%'
            }
        }
    );
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    setupCrawl();
    setupSections();
    setupPricingCarousel();
    setupCTA();
    
    initSystemCanvas('meridian-canvas', 'meridian');
    initSystemCanvas('recoil-canvas', 'recoil');
    // Executor canvas removed - too heavy
});

// Console branding
console.log('%c QUANT PRIME ', 'background: linear-gradient(135deg, #00abff, #c9a84c); color: #030308; font-weight: bold; padding: 8px 16px; font-size: 14px;');
console.log('%c Institutional-Grade Market Intelligence ', 'color: #c9a84c; font-size: 12px;');
