// ── SCROLL REVEAL ──
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.15 });
reveals.forEach(el => observer.observe(el));

// ── NAV DROPDOWN ──
const dropdownBtn = document.getElementById('navDropdown');
const dropdownMenu = document.getElementById('navMenu');

if (dropdownBtn && dropdownMenu) {
  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownBtn.classList.toggle('active');
    dropdownMenu.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    dropdownBtn.classList.remove('active');
    dropdownMenu.classList.remove('open');
  });

  dropdownMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// ── RECOIL ANIMATION ──
// Premium volatility compression visualization
(function() {
  const c = document.getElementById('recoilCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, frame = 0;

  function resize() {
    const r = c.getBoundingClientRect();
    c.width = r.width * 2; c.height = r.height * 2;
    W = c.width; H = c.height;
    ctx.scale(2, 2);
  }
  resize();
  window.addEventListener('resize', resize);

  // Smooth easing
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function draw() {
    frame++;
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    
    // Subtle gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f5f4f0');
    bgGrad.addColorStop(1, '#f2f1ed');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const progress = (frame % 200) / 200;

    // Phase timing
    const expandPhase = Math.min(progress / 0.35, 1);
    const compressionPhase = Math.max(0, Math.min((progress - 0.35) / 0.15, 1));
    const recoilPhase = Math.max(0, Math.min((progress - 0.55) / 0.35, 1));
    const holdPhase = Math.max(0, (progress - 0.9) / 0.1);

    // Band levels (Bollinger-style)
    const bandMid = h * 0.5;
    const bandExpansion = easeOutQuart(expandPhase) * 80;
    const bandCompression = easeInOutCubic(compressionPhase) * 50;
    const bandWidth = bandExpansion - bandCompression;
    
    const upperBand = bandMid - bandWidth;
    const lowerBand = bandMid + bandWidth;

    // Draw bands with gradient fill
    ctx.fillStyle = 'rgba(184, 150, 46, 0.06)';
    ctx.beginPath();
    ctx.moveTo(60, upperBand);
    ctx.lineTo(w - 60, upperBand);
    ctx.lineTo(w - 60, lowerBand);
    ctx.lineTo(60, lowerBand);
    ctx.closePath();
    ctx.fill();

    // Band lines
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(184, 150, 46, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, upperBand);
    ctx.lineTo(w - 60, upperBand);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(60, lowerBand);
    ctx.lineTo(w - 60, lowerBand);
    ctx.stroke();
    ctx.setLineDash([]);

    // Middle line
    ctx.strokeStyle = 'rgba(184, 150, 46, 0.15)';
    ctx.beginPath();
    ctx.moveTo(60, bandMid);
    ctx.lineTo(w - 60, bandMid);
    ctx.stroke();

    // Price candles
    const numCandles = 12;
    const candleWidth = (w - 140) / numCandles * 0.6;
    const candleGap = (w - 140) / numCandles;

    for (let i = 0; i < numCandles; i++) {
      const cx = 70 + i * candleGap + candleGap / 2;
      const candleProgress = Math.max(0, Math.min((expandPhase - i * 0.05), 1));
      
      if (candleProgress <= 0) continue;

      // Volatility decreases as we approach compression
      const volatility = Math.max(5, bandWidth * 0.7 * (1 - i / numCandles * 0.6));
      const isBullish = i % 3 !== 0;
      
      const open = bandMid + (Math.sin(i * 1.2) * volatility * 0.4);
      const close = open + (isBullish ? -1 : 1) * volatility * (0.3 + Math.random() * 0.3);
      const high = Math.min(open, close) - volatility * 0.2;
      const low = Math.max(open, close) + volatility * 0.2;

      const alpha = candleProgress * 0.9;

      // Wick
      ctx.strokeStyle = `rgba(100, 90, 70, ${alpha * 0.6})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, high);
      ctx.lineTo(cx, low);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(open, close);
      const bodyHeight = Math.abs(close - open);
      const bodyGrad = ctx.createLinearGradient(0, bodyTop, 0, bodyTop + bodyHeight);
      
      if (isBullish) {
        bodyGrad.addColorStop(0, `rgba(34, 139, 34, ${alpha})`);
        bodyGrad.addColorStop(1, `rgba(28, 120, 28, ${alpha})`);
      } else {
        bodyGrad.addColorStop(0, `rgba(180, 80, 80, ${alpha})`);
        bodyGrad.addColorStop(1, `rgba(160, 60, 60, ${alpha})`);
      }
      
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(cx - candleWidth/2, bodyTop, candleWidth, Math.max(bodyHeight, 2));
    }

    // Compression zone indicator
    if (compressionPhase > 0) {
      const zoneAlpha = easeOutQuart(compressionPhase) * 0.8;
      ctx.fillStyle = `rgba(184, 150, 46, ${0.08 * zoneAlpha})`;
      ctx.fillRect(w - 140, upperBand, 80, lowerBand - upperBand);
      
      ctx.font = '600 9px "JetBrains Mono"';
      ctx.fillStyle = `rgba(184, 150, 46, ${0.7 * zoneAlpha})`;
      ctx.fillText('COMPRESSION', w - 135, lowerBand + 18);
    }

    // Recoil signal
    if (recoilPhase > 0) {
      const signalAlpha = easeOutQuart(recoilPhase);
      const signalX = w - 90;
      const signalY = bandMid + bandWidth - (recoilPhase * bandWidth * 1.5);

      // Entry zone highlight
      ctx.fillStyle = `rgba(0, 136, 204, ${0.1 * signalAlpha})`;
      ctx.beginPath();
      ctx.arc(signalX, lowerBand, 25, 0, Math.PI * 2);
      ctx.fill();

      // Arrow
      ctx.fillStyle = `rgba(0, 136, 204, ${signalAlpha})`;
      ctx.beginPath();
      ctx.moveTo(signalX, signalY);
      ctx.lineTo(signalX - 8, signalY + 16);
      ctx.lineTo(signalX + 8, signalY + 16);
      ctx.closePath();
      ctx.fill();

      // Label
      if (recoilPhase > 0.3) {
        const labelAlpha = (recoilPhase - 0.3) / 0.7;
        ctx.font = '700 10px "JetBrains Mono"';
        ctx.fillStyle = `rgba(0, 136, 204, ${labelAlpha})`;
        ctx.fillText('RECOIL', signalX + 15, lowerBand + 4);
        ctx.font = '500 8px "JetBrains Mono"';
        ctx.fillStyle = `rgba(0, 136, 204, ${labelAlpha * 0.7})`;
        ctx.fillText('LONG', signalX + 15, lowerBand + 16);
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ── MERIDIAN ANIMATION ──
// Slower, more deliberate flow
(function() {
  const c = document.getElementById('meridianCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, frame = 0;

  function resize() {
    const r = c.getBoundingClientRect();
    c.width = r.width * 2; c.height = r.height * 2;
    W = c.width; H = c.height;
    ctx.scale(2, 2);
  }
  resize();
  window.addEventListener('resize', resize);

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function draw() {
    frame++;
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    
    // Gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f5f4f0');
    bgGrad.addColorStop(1, '#f2f1ed');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // SLOWER: 280 frames per cycle (was 140)
    const progress = (frame % 280) / 280;

    // Quant Node levels
    const nodes = [
      { y: h * 0.18, label: '1.14500', active: false },
      { y: h * 0.38, label: '1.14200', active: false },
      { y: h * 0.58, label: '1.13900', active: false },
      { y: h * 0.78, label: '1.13600', active: true },
    ];

    // Draw Quant Node levels with fade-in
    nodes.forEach((node, i) => {
      const nodeAlpha = Math.min(progress * 4 - i * 0.1, 1);
      if (nodeAlpha > 0) {
        // Dashed level line
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = `rgba(184, 150, 46, ${(node.active ? 0.5 : 0.2) * nodeAlpha})`;
        ctx.lineWidth = node.active ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(45, node.y);
        ctx.lineTo(w - 45, node.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Node marker
        ctx.fillStyle = `rgba(184, 150, 46, ${(node.active ? 0.7 : 0.35) * nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(38, node.y, node.active ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Price label
        ctx.font = `${node.active ? '500' : '400'} 8px "JetBrains Mono"`;
        ctx.fillStyle = `rgba(140, 130, 100, ${(node.active ? 0.8 : 0.5) * nodeAlpha})`;
        ctx.textAlign = 'right';
        ctx.fillText(node.label, w - 48, node.y + 3);
        ctx.textAlign = 'left';
      }
    });

    // Price path - slower draw
    let lowestY = 0;
    let lowestX = 0;

    if (progress > 0.12) {
      const pathProgress = easeOutQuart(Math.min((progress - 0.12) / 0.55, 1));
      const points = [];
      const numPts = Math.floor(pathProgress * 80);

      for (let i = 0; i < numPts; i++) {
        const t = i / 80;
        const x = 55 + t * (w - 110);
        let y;
        
        if (t < 0.55) {
          // Smooth descent
          y = h * 0.22 + easeOutQuart(t / 0.55) * h * 0.52 + Math.sin(i * 0.3) * 6;
        } else {
          // Reversal
          const rt = (t - 0.55) / 0.45;
          y = h * 0.76 - easeOutQuart(rt) * h * 0.32 + Math.sin(i * 0.4) * 4;
        }
        points.push({ x, y });
        
        if (y > lowestY) {
          lowestY = y;
          lowestX = x;
        }
      }

      if (points.length > 1) {
        // Draw smooth path
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        if (points.length > 1) {
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        }
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Vortex rings at actual low
      if (progress > 0.55) {
        const vortexProgress = easeOutQuart(Math.min((progress - 0.55) / 0.15, 1));
        const signalX = lowestX;
        const signalY = lowestY + 8;

        // Outer glow
        const glowGrad = ctx.createRadialGradient(signalX, signalY, 0, signalX, signalY, 35);
        glowGrad.addColorStop(0, `rgba(184, 150, 46, ${0.12 * vortexProgress})`);
        glowGrad.addColorStop(1, 'rgba(184, 150, 46, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(signalX, signalY, 35, 0, Math.PI * 2);
        ctx.fill();

        // Concentric rings
        for (let r = 0; r < 3; r++) {
          const ringAlpha = (0.4 - r * 0.1) * vortexProgress;
          ctx.strokeStyle = `rgba(184, 150, 46, ${ringAlpha})`;
          ctx.lineWidth = 1.5 - r * 0.3;
          ctx.beginPath();
          ctx.arc(signalX, signalY, 8 + r * 9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Prime Signal diamond
      if (progress > 0.68) {
        const primeProgress = easeOutQuart(Math.min((progress - 0.68) / 0.12, 1));
        const px = lowestX;
        const py = lowestY + 8;
        const size = 12 * primeProgress;

        // Diamond
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.PI / 4);
        
        const diamondGrad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        diamondGrad.addColorStop(0, `rgba(220, 190, 80, ${primeProgress})`);
        diamondGrad.addColorStop(0.5, `rgba(200, 165, 50, ${primeProgress})`);
        diamondGrad.addColorStop(1, `rgba(184, 150, 46, ${primeProgress})`);
        ctx.fillStyle = diamondGrad;
        ctx.fillRect(-size/2, -size/2, size, size);
        
        // Diamond border
        ctx.strokeStyle = `rgba(160, 130, 40, ${primeProgress * 0.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(-size/2, -size/2, size, size);
        ctx.restore();

        // Label with fade
        if (primeProgress > 0.5) {
          const labelAlpha = (primeProgress - 0.5) / 0.5;
          ctx.font = '700 11px "JetBrains Mono"';
          ctx.fillStyle = `rgba(184, 150, 46, ${labelAlpha})`;
          ctx.fillText('◆ PRIME SIGNAL', px + 22, py + 4);
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();
