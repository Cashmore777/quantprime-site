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
            envMapIntensity: 1.5
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
// SCROLL ANIMATION
// ═══════════════════════════════════════════════════════════════

function setupScrollAnimation() {
    const logoSection = document.querySelector('.scene-logo');
    const tagline = document.querySelector('.logo-tagline');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    // Fade in tagline on load
    gsap.to(tagline, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.5
    });

    // Main scroll animation - zoom INTO the logo
    ScrollTrigger.create({
        trigger: logoSection,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
            scrollProgress = self.progress;
            
            if (logoGroup) {
                // Zoom: scale up as you scroll (smooth, not too aggressive)
                const scale = 1 + (scrollProgress * 8);
                const baseScale = logoGroup.userData.baseScale || 1;
                
                // Scale while preserving the mirror on X axis
                logoGroup.scale.x = -baseScale * scale;  // Negative for mirror
                logoGroup.scale.y = baseScale * scale;
                logoGroup.scale.z = baseScale * scale;
                
                // Rotate as we zoom (spinning top style on Z-axis) - smooth
                logoGroup.rotation.z += 0.005;
                
                // Move camera forward slightly
                camera.position.z = 5 - (scrollProgress * 2);
                
                // FADE OUT the logo - starts IMMEDIATELY, very gradual
                let logoOpacity = Math.max(0, 1 - (scrollProgress * 1.5));
                logoGroup.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = true;
                        child.material.opacity = logoOpacity;
                    }
                });
            }
            
            // Fade out tagline and scroll indicator
            if (tagline) tagline.style.opacity = Math.max(0, 1 - (scrollProgress * 4));
            if (scrollIndicator) scrollIndicator.style.opacity = Math.max(0, 1 - (scrollProgress * 4));
            
            // Fade out entire canvas container - matches logo
            const container = document.getElementById('logo-3d-container');
            if (container) {
                container.style.opacity = logoOpacity;
                if (logoOpacity === 0) {
                    container.style.display = 'none';
                } else {
                    container.style.display = 'block';
                }
            }
        }
    });

    // Base scale is now stored in loadLogo()

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
// STAR WARS CRAWL
// ═══════════════════════════════════════════════════════════════

function setupCrawl() {
    const crawlContainer = document.querySelector('.crawl-container');
    const crawlContent = document.querySelector('.crawl-content');

    if (!crawlContainer || !crawlContent) return;

    // Control crawl visibility - show during crawl section only
    ScrollTrigger.create({
        trigger: '.scene-crawl',
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => {
            crawlContainer.classList.add('active');
            crawlContainer.style.opacity = '1';
        },
        onLeave: () => {
            crawlContainer.style.opacity = '0';
            crawlContainer.classList.remove('active');
        },
        onEnterBack: () => {
            crawlContainer.classList.add('active');
            crawlContainer.style.opacity = '1';
        },
        onLeaveBack: () => {
            crawlContainer.style.opacity = '0';
            crawlContainer.classList.remove('active');
        }
    });

    // Simple scroll: text moves from bottom to top - slow and complete
    gsap.fromTo(crawlContent, 
        { y: '100vh' },  // Starts off screen at bottom
        { 
            y: '-200%',  // Ends well off screen top
            ease: 'none',
            scrollTrigger: {
                trigger: '.scene-crawl',
                start: 'top top',
                end: 'bottom top',
                scrub: 0.3
            }
        }
    );
}

// ═══════════════════════════════════════════════════════════════
// SYSTEMS & OTHER SECTIONS
// ═══════════════════════════════════════════════════════════════

function setupSections() {
    // Systems header
    gsap.to('.systems-header', {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
            trigger: '.systems-header',
            start: 'top 80%'
        }
    });

    // System cards
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

    // Proof cards
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

    // Price cards
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
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM CANVAS VISUALIZATIONS
// ═══════════════════════════════════════════════════════════════

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
                
                ctx.beginPath();
                ctx.fillStyle = i % 2 === 0 ? '#00abff' : '#c9a84c';
                ctx.arc(startX, progress, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        t += 0.02;
        animationId = requestAnimationFrame(draw);
    }
    
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

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    setupCrawl();
    setupSections();
    
    initSystemCanvas('meridian-canvas', 'meridian');
    initSystemCanvas('recoil-canvas', 'recoil');
    initSystemCanvas('executor-canvas', 'executor');
});

// Console branding
console.log('%c QUANT PRIME ', 'background: linear-gradient(135deg, #00abff, #c9a84c); color: #030308; font-weight: bold; padding: 8px 16px; font-size: 14px;');
console.log('%c Institutional-Grade Market Intelligence ', 'color: #c9a84c; font-size: 12px;');
