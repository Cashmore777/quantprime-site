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
// SYSTEMS - UPGRADED ANIMATIONS
// ═══════════════════════════════════════════════════════════════

function setupSections() {
    // Systems header - dramatic entrance
    gsap.fromTo('.systems-header', 
        { opacity: 0, y: 80, scale: 0.9 },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.systems-header',
                start: 'top 85%'
            }
        }
    );

    // System cards - dramatic staggered entrance with glow pulse
    document.querySelectorAll('.system-card').forEach((card, index) => {
        const isEven = index % 2 === 0;
        const visual = card.querySelector('.system-visual');
        const info = card.querySelector('.system-info');
        const number = card.querySelector('.system-number');
        const features = card.querySelectorAll('.system-features li');

        // Card slide in from side
        gsap.fromTo(card, 
            { 
                opacity: 0, 
                x: isEven ? -100 : 100,
                rotateY: isEven ? -15 : 15
            },
            {
                opacity: 1,
                x: 0,
                rotateY: 0,
                duration: 1.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%'
                }
            }
        );

        // Visual canvas glow pulse
        if (visual) {
            gsap.fromTo(visual, 
                { scale: 0.8, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 1,
                    delay: 0.3,
                    ease: 'back.out(1.4)',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%'
                    }
                }
            );
        }

        // Number counter animation
        if (number) {
            gsap.fromTo(number, 
                { opacity: 0, scale: 2, y: -30 },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.8,
                    delay: 0.2,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%'
                    }
                }
            );
        }

        // Features stagger in
        if (features.length) {
            gsap.fromTo(features, 
                { opacity: 0, x: -20 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    delay: 0.5,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%'
                    }
                }
            );
        }
    });

    // Proof cards - fade up with stagger
    document.querySelectorAll('.proof-card').forEach((card, index) => {
        gsap.fromTo(card, 
            { opacity: 0, y: 60, scale: 0.95 },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                delay: index * 0.2,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%'
                }
            }
        );
    });
}

// ═══════════════════════════════════════════════════════════════
// PRICING CARDS - HORIZONTAL SCROLL CAROUSEL
// ═══════════════════════════════════════════════════════════════

function setupPricingCarousel() {
    const pricingSection = document.querySelector('.scene-pricing');
    const pricingContainer = document.querySelector('.pricing-container');
    const cards = document.querySelectorAll('.price-card');
    
    if (!pricingSection || cards.length === 0) return;

    // Initial reveal animation
    gsap.fromTo('.pricing-container > .section-tag', 
        { opacity: 0, y: 30 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            scrollTrigger: {
                trigger: '.scene-pricing',
                start: 'top 80%'
            }
        }
    );
    
    gsap.fromTo('.pricing-container > h2', 
        { opacity: 0, y: 30 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: 0.1,
            scrollTrigger: {
                trigger: '.scene-pricing',
                start: 'top 80%'
            }
        }
    );

    // Set initial state - all cards start visible but stacked/faded
    cards.forEach((card, index) => {
        card.style.opacity = '1';
        card.style.transform = 'none';
    });

    // Horizontal scroll effect - cards slide left as you scroll
    const totalCards = cards.length;
    
    ScrollTrigger.create({
        trigger: '.scene-pricing',
        start: 'top 30%',
        end: 'bottom 70%',
        scrub: 1,
        onUpdate: (self) => {
            const progress = self.progress;
            
            cards.forEach((card, index) => {
                // Calculate position in the "deck"
                const cardProgress = (progress * (totalCards - 1)) - index;
                
                // Current card (active)
                if (cardProgress >= -0.5 && cardProgress <= 0.5) {
                    // Center position - fully visible
                    gsap.to(card, {
                        scale: 1,
                        opacity: 1,
                        x: 0,
                        rotateY: 0,
                        zIndex: 10,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
                // Cards that have passed (scrolled away)
                else if (cardProgress > 0.5) {
                    // Slide left and fade
                    const offset = Math.min(cardProgress - 0.5, 1);
                    gsap.to(card, {
                        scale: 0.85,
                        opacity: 0.3,
                        x: -100 * offset,
                        rotateY: 15,
                        zIndex: 10 - index,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
                // Cards coming up (not yet reached)
                else {
                    // Behind/right, waiting
                    const offset = Math.min(Math.abs(cardProgress + 0.5), 1);
                    gsap.to(card, {
                        scale: 0.9,
                        opacity: 0.5,
                        x: 80 * offset,
                        rotateY: -10,
                        zIndex: index,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });
        }
    });
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
    
    function resize() {
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
    }
    resize();
    
    function draw() {
        if (!isActive) return;
        
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        
        // Clear with slight trail effect for glow
        ctx.fillStyle = 'rgba(18, 18, 28, 0.15)';
        ctx.fillRect(0, 0, w, h);
        
        if (type === 'meridian') {
            // UPGRADED: Multiple glowing wave layers with pulse
            const pulse = Math.sin(t * 0.5) * 0.3 + 1;
            const colors = [
                { color: '#00abff', alpha: 0.9 },
                { color: '#0085c7', alpha: 0.7 },
                { color: '#005e8c', alpha: 0.5 },
                { color: '#194866', alpha: 0.3 }
            ];
            
            colors.forEach((c, i) => {
                ctx.beginPath();
                ctx.strokeStyle = c.color;
                ctx.lineWidth = (3 - i * 0.5) * pulse;
                ctx.shadowColor = c.color;
                ctx.shadowBlur = 15 * pulse;
                
                const baseY = h * 0.25 + (i * h * 0.15);
                for (let x = 0; x <= w; x += 2) {
                    const y = baseY + 
                        Math.sin((x * 0.02) + t * 0.8 + i) * 25 * pulse +
                        Math.sin((x * 0.005) + t * 0.3) * 40;
                    
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            });
            
            // Glowing grid lines
            ctx.strokeStyle = 'rgba(0, 171, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            [0.2, 0.4, 0.6, 0.8].forEach(pct => {
                ctx.beginPath();
                ctx.moveTo(0, h * pct);
                ctx.lineTo(w, h * pct);
                ctx.stroke();
            });
            ctx.setLineDash([]);
            
            // Scanning line
            const scanX = (t * 50) % w;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 171, 255, 0.6)';
            ctx.shadowColor = '#00abff';
            ctx.shadowBlur = 20;
            ctx.lineWidth = 2;
            ctx.moveTo(scanX, 0);
            ctx.lineTo(scanX, h);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
        } else if (type === 'recoil') {
            // UPGRADED: Breathing bands with glow
            const centerY = h * 0.5;
            const breathe = Math.sin(t * 0.4) * 0.2 + 1;
            
            for (let band = 8; band >= 1; band--) {
                const spread = band * 10 * breathe;
                let color, glow;
                
                if (band <= 5) {
                    const alpha = 0.08 + (band * 0.02);
                    color = `rgba(0, 171, 255, ${alpha})`;
                    glow = '#00abff';
                } else if (band === 6) {
                    color = 'rgba(255, 235, 59, 0.25)';
                    glow = '#ffeb3b';
                } else if (band === 7) {
                    color = 'rgba(255, 152, 0, 0.35)';
                    glow = '#ff9800';
                } else {
                    color = 'rgba(242, 54, 69, 0.45)';
                    glow = '#f23645';
                }
                
                ctx.fillStyle = color;
                ctx.shadowColor = glow;
                ctx.shadowBlur = band > 5 ? 15 : 5;
                
                ctx.beginPath();
                for (let x = 0; x <= w; x += 2) {
                    const wave = Math.sin((x * 0.008) + t * 0.5) * spread * 0.5;
                    const y = centerY - wave - spread;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                for (let x = w; x >= 0; x -= 2) {
                    const wave = Math.sin((x * 0.008) + t * 0.5) * spread * 0.5;
                    const y = centerY + wave + spread;
                    ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            }
            
            // Center pulse line
            ctx.beginPath();
            ctx.strokeStyle = '#00abff';
            ctx.shadowColor = '#00abff';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
            for (let x = 0; x <= w; x += 3) {
                const y = centerY + Math.sin((x * 0.03) + t) * 5;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            
        } else if (type === 'executor') {
            // UPGRADED: Matrix-style data streams
            const numFlows = 12;
            for (let i = 0; i < numFlows; i++) {
                const startX = (w / numFlows) * i + (w / numFlows / 2);
                const speed = 40 + (i % 3) * 20;
                const progress = ((t * speed + i * 80) % (h + 150)) - 75;
                const isCyan = i % 2 === 0;
                const color = isCyan ? '#00abff' : '#c9a84c';
                
                // Trail effect
                const gradient = ctx.createLinearGradient(startX, progress, startX, progress + 60);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.strokeStyle = gradient;
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
                ctx.lineWidth = 2;
                ctx.moveTo(startX, progress);
                ctx.lineTo(startX, progress + 50);
                ctx.stroke();
                
                // Head dot
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.shadowBlur = 20;
                ctx.arc(startX, progress, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            // Horizontal connection lines
            const yPos = (t * 30) % h;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 171, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.moveTo(0, yPos);
            ctx.lineTo(w, yPos);
            ctx.stroke();
        }
        
        t += 0.025;
        animationId = requestAnimationFrame(draw);
    }
    
    ScrollTrigger.create({
        trigger: canvas,
        start: 'top 95%',
        end: 'bottom 5%',
        onEnter: () => { isActive = true; draw(); },
        onLeave: () => { isActive = false; cancelAnimationFrame(animationId); },
        onEnterBack: () => { isActive = true; draw(); },
        onLeaveBack: () => { isActive = false; cancelAnimationFrame(animationId); }
    });
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
    initSystemCanvas('executor-canvas', 'executor');
});

// Console branding
console.log('%c QUANT PRIME ', 'background: linear-gradient(135deg, #00abff, #c9a84c); color: #030308; font-weight: bold; padding: 8px 16px; font-size: 14px;');
console.log('%c Institutional-Grade Market Intelligence ', 'color: #c9a84c; font-size: 12px;');
