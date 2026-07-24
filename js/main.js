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

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function draw() {
    frame++;
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    
    ctx.fillStyle = '#f2f1ed';
    ctx.fillRect(0, 0, w, h);

    const progress = (frame % 240) / 240;

    const centerX = w * 0.4;
    const candleWidth = 50;
    
    // Compression zone
    const zoneTop = h * 0.68;
    const zoneBottom = h * 0.88;
    
    ctx.fillStyle = 'rgba(184, 150, 46, 0.08)';
    ctx.fillRect(40, zoneTop, w - 80, zoneBottom - zoneTop);
    
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(184, 150, 46, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, zoneTop);
    ctx.lineTo(w - 40, zoneTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(40, zoneBottom);
    ctx.lineTo(w - 40, zoneBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '600 9px "JetBrains Mono"';
    ctx.fillStyle = 'rgba(184, 150, 46, 0.5)';
    ctx.fillText('COMPRESSION ZONE', 50, zoneBottom + 15);

    const candle1Open = h * 0.15;
    const candle1MaxClose = zoneTop + 30;
    
    if (progress < 0.35) {
      const expandProgress = easeOutCubic(progress / 0.35);
      const candle1Close = candle1Open + expandProgress * (candle1MaxClose - candle1Open);
      
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, candle1Open - 10);
      ctx.lineTo(centerX, candle1Close + 15);
      ctx.stroke();
      
      const bodyGrad = ctx.createLinearGradient(0, candle1Open, 0, candle1Close);
      bodyGrad.addColorStop(0, '#c0392b');
      bodyGrad.addColorStop(1, '#a93226');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(centerX - candleWidth/2, candle1Open, candleWidth, candle1Close - candle1Open);
      
      ctx.strokeStyle = '#922B21';
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - candleWidth/2, candle1Open, candleWidth, candle1Close - candle1Open);
      
    } else {
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, candle1Open - 10);
      ctx.lineTo(centerX, candle1MaxClose + 15);
      ctx.stroke();
      
      const bodyGrad = ctx.createLinearGradient(0, candle1Open, 0, candle1MaxClose);
      bodyGrad.addColorStop(0, '#c0392b');
      bodyGrad.addColorStop(1, '#a93226');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(centerX - candleWidth/2, candle1Open, candleWidth, candle1MaxClose - candle1Open);
      
      ctx.strokeStyle = '#922B21';
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - candleWidth/2, candle1Open, candleWidth, candle1MaxClose - candle1Open);
    }

    const candle2X = centerX + candleWidth + 15;
    const candle2Open = candle1MaxClose;
    const candle2Low = candle2Open + 25;
    
    if (progress >= 0.35 && progress < 0.50) {
      const phase2Progress = (progress - 0.35) / 0.15;
      const wickLength = easeOutCubic(phase2Progress) * (candle2Low - candle2Open);
      
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(candle2X, candle2Open);
      ctx.lineTo(candle2X, candle2Open + wickLength);
      ctx.stroke();
      
      if (phase2Progress > 0.5) {
        const bodyProgress = (phase2Progress - 0.5) / 0.5;
        const bodyHeight = bodyProgress * 8;
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(candle2X - candleWidth/2, candle2Open - bodyHeight, candleWidth, bodyHeight);
      }
    }

    let showSignal = false;
    let signalAlpha = 0;
    
    if (progress >= 0.50) {
      showSignal = true;
      if (progress < 0.55) {
        signalAlpha = (progress - 0.50) / 0.05;
      } else {
        signalAlpha = 1;
      }
    }

    if (progress >= 0.50 && progress < 0.75) {
      const phase34Progress = (progress - 0.50) / 0.25;
      const candle2Close = candle2Open - 10 - easeOutCubic(phase34Progress) * 50;
      
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(candle2X, candle2Low);
      ctx.lineTo(candle2X, candle2Close - 5);
      ctx.stroke();
      
      const bodyGrad = ctx.createLinearGradient(0, candle2Close, 0, candle2Open);
      bodyGrad.addColorStop(0, '#27ae60');
      bodyGrad.addColorStop(1, '#2ecc71');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(candle2X - candleWidth/2, candle2Close, candleWidth, candle2Open - candle2Close);
      
      ctx.strokeStyle = '#1E8449';
      ctx.lineWidth = 1;
      ctx.strokeRect(candle2X - candleWidth/2, candle2Close, candleWidth, candle2Open - candle2Close);
    }

    const candle3X = candle2X + candleWidth + 15;
    const candle2FinalClose = candle2Open - 60;
    
    if (progress >= 0.75 && progress < 0.95) {
      const phase5Progress = (progress - 0.75) / 0.20;
      
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(candle2X, candle2Low);
      ctx.lineTo(candle2X, candle2FinalClose - 5);
      ctx.stroke();
      
      const bodyGrad2 = ctx.createLinearGradient(0, candle2FinalClose, 0, candle2Open);
      bodyGrad2.addColorStop(0, '#27ae60');
      bodyGrad2.addColorStop(1, '#2ecc71');
      ctx.fillStyle = bodyGrad2;
      ctx.fillRect(candle2X - candleWidth/2, candle2FinalClose, candleWidth, candle2Open - candle2FinalClose);
      ctx.strokeStyle = '#1E8449';
      ctx.lineWidth = 1;
      ctx.strokeRect(candle2X - candleWidth/2, candle2FinalClose, candleWidth, candle2Open - candle2FinalClose);
      
      const candle3Open = candle2FinalClose;
      const candle3Close = candle3Open - easeOutCubic(phase5Progress) * 45;
      
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(candle3X, candle3Open + 5);
      ctx.lineTo(candle3X, candle3Close - 5);
      ctx.stroke();
      
      const bodyGrad3 = ctx.createLinearGradient(0, candle3Close, 0, candle3Open);
      bodyGrad3.addColorStop(0, '#27ae60');
      bodyGrad3.addColorStop(1, '#2ecc71');
      ctx.fillStyle = bodyGrad3;
      ctx.fillRect(candle3X - candleWidth/2, candle3Close, candleWidth, candle3Open - candle3Close);
      ctx.strokeStyle = '#1E8449';
      ctx.lineWidth = 1;
      ctx.strokeRect(candle3X - candleWidth/2, candle3Close, candleWidth, candle3Open - candle3Close);
    }

    if (progress >= 0.95) {
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(candle2X, candle2Low);
      ctx.lineTo(candle2X, candle2FinalClose - 5);
      ctx.stroke();
      
      const bodyGrad2 = ctx.createLinearGradient(0, candle2FinalClose, 0, candle2Open);
      bodyGrad2.addColorStop(0, '#27ae60');
      bodyGrad2.addColorStop(1, '#2ecc71');
      ctx.fillStyle = bodyGrad2;
      ctx.fillRect(candle2X - candleWidth/2, candle2FinalClose, candleWidth, candle2Open - candle2FinalClose);
      ctx.strokeStyle = '#1E8449';
      ctx.lineWidth = 1;
      ctx.strokeRect(candle2X - candleWidth/2, candle2FinalClose, candleWidth, candle2Open - candle2FinalClose);
      
      const candle3Open = candle2FinalClose;
      const candle3Close = candle3Open - 45;
      
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(candle3X, candle3Open + 5);
      ctx.lineTo(candle3X, candle3Close - 5);
      ctx.stroke();
      
      const bodyGrad3 = ctx.createLinearGradient(0, candle3Close, 0, candle3Open);
      bodyGrad3.addColorStop(0, '#27ae60');
      bodyGrad3.addColorStop(1, '#2ecc71');
      ctx.fillStyle = bodyGrad3;
      ctx.fillRect(candle3X - candleWidth/2, candle3Close, candleWidth, candle3Open - candle3Close);
      ctx.strokeStyle = '#1E8449';
      ctx.lineWidth = 1;
      ctx.strokeRect(candle3X - candleWidth/2, candle3Close, candleWidth, candle3Open - candle3Close);
    }

    // Recoil Signal Box with PROPER arrow
    if (showSignal) {
      const signalX = candle2X + candleWidth/2 + 20;
      const signalY = candle2Low + 10;
      
      // Signal box
      ctx.fillStyle = `rgba(0, 136, 204, ${0.95 * signalAlpha})`;
      ctx.beginPath();
      ctx.roundRect(signalX, signalY, 90, 32, 6);
      ctx.fill();
      
      // Proper upward arrow (triangle pointing up)
      ctx.fillStyle = `rgba(255, 255, 255, ${signalAlpha})`;
      ctx.beginPath();
      ctx.moveTo(signalX + 18, signalY + 8);  // Top point
      ctx.lineTo(signalX + 12, signalY + 18); // Bottom left
      ctx.lineTo(signalX + 24, signalY + 18); // Bottom right
      ctx.closePath();
      ctx.fill();
      
      // Arrow stem
      ctx.fillRect(signalX + 15, signalY + 17, 6, 8);
      
      // Text
      ctx.font = '700 11px "JetBrains Mono"';
      ctx.fillStyle = `rgba(255, 255, 255, ${signalAlpha})`;
      ctx.fillText('RECOIL', signalX + 35, signalY + 21);
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ── MERIDIAN ANIMATION ──
// Slow line draw, diamond at tip as low is created
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

  function draw() {
    frame++;
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    
    ctx.fillStyle = '#f2f1ed';
    ctx.fillRect(0, 0, w, h);

    // 480 frame cycle - MUCH slower
    const progress = (frame % 480) / 480;

    // Quant Node levels
    const nodes = [
      { y: h * 0.18, label: '1.14500' },
      { y: h * 0.38, label: '1.14200' },
      { y: h * 0.58, label: '1.13900' },
      { y: h * 0.78, label: '1.13600' },
    ];

    nodes.forEach((node, i) => {
      const nodeAlpha = Math.min(progress * 6 - i * 0.05, 1);
      if (nodeAlpha > 0) {
        const isBottom = i === 3;
        
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = `rgba(184, 150, 46, ${(isBottom ? 0.5 : 0.2) * nodeAlpha})`;
        ctx.lineWidth = isBottom ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(45, node.y);
        ctx.lineTo(w - 45, node.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = `rgba(184, 150, 46, ${(isBottom ? 0.7 : 0.35) * nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(38, node.y, isBottom ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `${isBottom ? '500' : '400'} 8px "JetBrains Mono"`;
        ctx.fillStyle = `rgba(140, 130, 100, ${(isBottom ? 0.8 : 0.5) * nodeAlpha})`;
        ctx.textAlign = 'right';
        ctx.fillText(node.label, w - 48, node.y + 3);
        ctx.textAlign = 'left';
      }
    });

    // Line drawing from 0.08 to 0.85 (very slow)
    const lineStart = 0.08;
    const lineEnd = 0.85;
    
    // The lowest point position
    const lowestY = h * 0.78;
    const lowestX = w * 0.55;
    
    // At what progress does the line reach the lowest point?
    const lowPointProgress = 0.55; // 55% through the line drawing

    if (progress > lineStart) {
      const rawLineProgress = (progress - lineStart) / (lineEnd - lineStart);
      const lineProgress = Math.min(rawLineProgress, 1);
      
      const points = [];
      const totalPoints = 120;
      const numPts = Math.floor(lineProgress * totalPoints);

      let currentLowestY = 0;
      let currentLowestX = 0;

      for (let i = 0; i < numPts; i++) {
        const t = i / totalPoints;
        const x = 55 + t * (w - 110);
        let y;
        
        if (t < 0.55) {
          // Descent to low
          const descT = t / 0.55;
          y = h * 0.22 + descT * (lowestY - h * 0.22) + Math.sin(i * 0.2) * 4;
        } else {
          // Reversal up
          const revT = (t - 0.55) / 0.45;
          y = lowestY - revT * (lowestY - h * 0.38) + Math.sin(i * 0.25) * 3;
        }
        points.push({ x, y });
        
        // Track the current lowest point as line draws
        if (y > currentLowestY) {
          currentLowestY = y;
          currentLowestX = x;
        }
      }

      // Draw the line
      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Has the line reached near the lowest point? (t >= 0.53)
      const currentT = numPts / totalPoints;
      const hasReachedLow = currentT >= 0.53;
      
      if (hasReachedLow) {
        // Signal appears AS the low is being created
        const timeSinceLow = Math.max(0, currentT - 0.53) / 0.1;
        const signalAlpha = Math.min(timeSinceLow, 1);
        
        // NO RINGS - just the diamond directly below the lowest point
        const diamondX = currentLowestX;
        const diamondY = currentLowestY + 12; // Directly below the tip
        const size = 10;

        // Diamond
        ctx.save();
        ctx.translate(diamondX, diamondY);
        ctx.rotate(Math.PI / 4);
        
        const diamondGrad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        diamondGrad.addColorStop(0, `rgba(220, 190, 80, ${signalAlpha})`);
        diamondGrad.addColorStop(0.5, `rgba(200, 165, 50, ${signalAlpha})`);
        diamondGrad.addColorStop(1, `rgba(184, 150, 46, ${signalAlpha})`);
        ctx.fillStyle = diamondGrad;
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.restore();

        // Label - centered below diamond
        if (signalAlpha > 0.3) {
          const labelAlpha = (signalAlpha - 0.3) / 0.7;
          ctx.font = '700 10px "JetBrains Mono"';
          ctx.fillStyle = `rgba(184, 150, 46, ${labelAlpha})`;
          ctx.textAlign = 'center';
          ctx.fillText('PRIME SIGNAL', diamondX, diamondY + 22);
          ctx.textAlign = 'left';
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();
