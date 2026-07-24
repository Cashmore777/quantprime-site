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
// Single candle expansion → compression zone → recoil entry
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
    
    // Background
    ctx.fillStyle = '#f2f1ed';
    ctx.fillRect(0, 0, w, h);

    // 240 frame cycle
    const progress = (frame % 240) / 240;

    const centerX = w * 0.4;
    const candleWidth = 50;
    
    // Compression zone (always visible, at bottom)
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

    // Phase 1: Big red candle expanding down (0 - 0.35)
    // Phase 2: Candle closes, new candle opens, pushes down, makes wick (0.35 - 0.50)
    // Phase 3: Recoil signal appears (0.50 - 0.55)
    // Phase 4: Second candle pushes up and closes (0.55 - 0.75)
    // Phase 5: Third candle opens and pushes up (0.75 - 0.95)
    // Phase 6: Hold (0.95 - 1.0)

    const candle1Open = h * 0.15;
    const candle1MaxClose = zoneTop + 30; // Enters compression zone
    
    if (progress < 0.35) {
      // Phase 1: Big red candle expanding
      const expandProgress = easeOutCubic(progress / 0.35);
      const candle1Close = candle1Open + expandProgress * (candle1MaxClose - candle1Open);
      
      // Wick
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, candle1Open - 10);
      ctx.lineTo(centerX, candle1Close + 15);
      ctx.stroke();
      
      // Body
      const bodyGrad = ctx.createLinearGradient(0, candle1Open, 0, candle1Close);
      bodyGrad.addColorStop(0, '#c0392b');
      bodyGrad.addColorStop(1, '#a93226');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(centerX - candleWidth/2, candle1Open, candleWidth, candle1Close - candle1Open);
      
      ctx.strokeStyle = '#922B21';
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - candleWidth/2, candle1Open, candleWidth, candle1Close - candle1Open);
      
    } else {
      // Candle 1 is fully drawn (static)
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

    // Candle 2 position
    const candle2X = centerX + candleWidth + 15;
    const candle2Open = candle1MaxClose;
    const candle2Low = candle2Open + 25; // Bottom wick into zone
    
    if (progress >= 0.35 && progress < 0.50) {
      // Phase 2: New candle opens, pushes down, makes wick
      const phase2Progress = (progress - 0.35) / 0.15;
      const wickLength = easeOutCubic(phase2Progress) * (candle2Low - candle2Open);
      
      // Just the wick pushing down
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(candle2X, candle2Open);
      ctx.lineTo(candle2X, candle2Open + wickLength);
      ctx.stroke();
      
      // Small body forming
      if (phase2Progress > 0.5) {
        const bodyProgress = (phase2Progress - 0.5) / 0.5;
        const bodyHeight = bodyProgress * 8;
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(candle2X - candleWidth/2, candle2Open - bodyHeight, candleWidth, bodyHeight);
      }
    }

    // Recoil signal
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
      // Phase 3-4: Signal appears, candle pushes up
      const phase34Progress = (progress - 0.50) / 0.25;
      
      // Candle 2 body growing upward (bullish)
      const candle2Close = candle2Open - 10 - easeOutCubic(phase34Progress) * 50;
      
      // Wick
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(candle2X, candle2Low);
      ctx.lineTo(candle2X, candle2Close - 5);
      ctx.stroke();
      
      // Body
      const bodyGrad = ctx.createLinearGradient(0, candle2Close, 0, candle2Open);
      bodyGrad.addColorStop(0, '#27ae60');
      bodyGrad.addColorStop(1, '#2ecc71');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(candle2X - candleWidth/2, candle2Close, candleWidth, candle2Open - candle2Close);
      
      ctx.strokeStyle = '#1E8449';
      ctx.lineWidth = 1;
      ctx.strokeRect(candle2X - candleWidth/2, candle2Close, candleWidth, candle2Open - candle2Close);
    }

    // Candle 3
    const candle3X = candle2X + candleWidth + 15;
    const candle2FinalClose = candle2Open - 60;
    
    if (progress >= 0.75 && progress < 0.95) {
      // Phase 5: Third candle pushing up
      const phase5Progress = (progress - 0.75) / 0.20;
      
      // Candle 2 stays static
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
      
      // Candle 3
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
      // Hold - all candles static
      // Candle 2
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
      
      // Candle 3
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

    // Recoil Signal Box
    if (showSignal) {
      const signalX = candle2X + candleWidth/2 + 20;
      const signalY = candle2Low + 10;
      
      // Signal box
      ctx.fillStyle = `rgba(0, 136, 204, ${0.95 * signalAlpha})`;
      ctx.beginPath();
      ctx.roundRect(signalX, signalY, 85, 32, 6);
      ctx.fill();
      
      // Arrow
      ctx.fillStyle = `rgba(255, 255, 255, ${signalAlpha})`;
      ctx.beginPath();
      ctx.moveTo(signalX + 15, signalY + 20);
      ctx.lineTo(signalX + 10, signalY + 25);
      ctx.lineTo(signalX + 20, signalY + 25);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(signalX + 13, signalY + 10, 4, 12);
      
      // Text
      ctx.font = '700 11px "JetBrains Mono"';
      ctx.fillStyle = `rgba(255, 255, 255, ${signalAlpha})`;
      ctx.fillText('RECOIL', signalX + 30, signalY + 21);
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ── MERIDIAN ANIMATION ──
// Slower line drawing, Prime Signal at the tip
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

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function draw() {
    frame++;
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    
    // Background
    ctx.fillStyle = '#f2f1ed';
    ctx.fillRect(0, 0, w, h);

    // 360 frame cycle (30% slower than before)
    const progress = (frame % 360) / 360;

    // Quant Node levels
    const nodes = [
      { y: h * 0.18, label: '1.14500' },
      { y: h * 0.38, label: '1.14200' },
      { y: h * 0.58, label: '1.13900' },
      { y: h * 0.78, label: '1.13600' },
    ];

    // Draw Quant Node levels
    nodes.forEach((node, i) => {
      const nodeAlpha = Math.min(progress * 5 - i * 0.08, 1);
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

    // Price path - SLOWER drawing (0.1 to 0.7 = 60% of cycle)
    const lineStartProgress = 0.1;
    const lineEndProgress = 0.7;
    
    // The actual lowest point
    const lowestY = h * 0.78;
    const lowestX = w * 0.58;

    if (progress > lineStartProgress) {
      const lineProgress = Math.min((progress - lineStartProgress) / (lineEndProgress - lineStartProgress), 1);
      const easedProgress = easeOutCubic(lineProgress);
      
      const points = [];
      const totalPoints = 100;
      const numPts = Math.floor(easedProgress * totalPoints);

      for (let i = 0; i < numPts; i++) {
        const t = i / totalPoints;
        const x = 55 + t * (w - 110);
        let y;
        
        if (t < 0.55) {
          // Descent
          const descT = t / 0.55;
          y = h * 0.22 + easeOutCubic(descT) * (lowestY - h * 0.22) + Math.sin(i * 0.25) * 5;
        } else {
          // Reversal
          const revT = (t - 0.55) / 0.45;
          y = lowestY - easeOutCubic(revT) * (lowestY - h * 0.35) + Math.sin(i * 0.3) * 4;
        }
        points.push({ x, y });
      }

      if (points.length > 1) {
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

      // Check if we've reached the bottom (around t=0.55 of line progress)
      const bottomReached = lineProgress > 0.55;
      
      if (bottomReached) {
        // Calculate how long since bottom was reached
        const timeSinceBottom = (lineProgress - 0.55) / 0.45;
        
        // Prime Signal appears immediately when reaction starts
        const signalAlpha = Math.min(timeSinceBottom * 3, 1);
        
        // Vortex rings
        const glowGrad = ctx.createRadialGradient(lowestX, lowestY, 0, lowestX, lowestY, 35);
        glowGrad.addColorStop(0, `rgba(184, 150, 46, ${0.15 * signalAlpha})`);
        glowGrad.addColorStop(1, 'rgba(184, 150, 46, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(lowestX, lowestY, 35, 0, Math.PI * 2);
        ctx.fill();

        for (let r = 0; r < 3; r++) {
          const ringAlpha = (0.4 - r * 0.1) * signalAlpha;
          ctx.strokeStyle = `rgba(184, 150, 46, ${ringAlpha})`;
          ctx.lineWidth = 1.5 - r * 0.3;
          ctx.beginPath();
          ctx.arc(lowestX, lowestY, 8 + r * 9, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Diamond - RIGHT AT THE TIP
        const size = 11 * signalAlpha;
        ctx.save();
        ctx.translate(lowestX, lowestY);
        ctx.rotate(Math.PI / 4);
        
        const diamondGrad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        diamondGrad.addColorStop(0, `rgba(220, 190, 80, ${signalAlpha})`);
        diamondGrad.addColorStop(0.5, `rgba(200, 165, 50, ${signalAlpha})`);
        diamondGrad.addColorStop(1, `rgba(184, 150, 46, ${signalAlpha})`);
        ctx.fillStyle = diamondGrad;
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.restore();

        // Label
        if (signalAlpha > 0.3) {
          const labelAlpha = (signalAlpha - 0.3) / 0.7;
          ctx.font = '700 11px "JetBrains Mono"';
          ctx.fillStyle = `rgba(184, 150, 46, ${labelAlpha})`;
          ctx.fillText('◆ PRIME SIGNAL', lowestX + 20, lowestY + 4);
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();
