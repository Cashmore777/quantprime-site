// ── SCROLL REVEAL (supports both .reveal and .fade-in) ──
const reveals = document.querySelectorAll('.reveal, .fade-in');
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

    if (showSignal) {
      const signalX = candle2X + candleWidth/2 + 20;
      const signalY = candle2Low + 10;
      
      ctx.fillStyle = `rgba(0, 136, 204, ${0.95 * signalAlpha})`;
      ctx.beginPath();
      ctx.roundRect(signalX, signalY, 90, 32, 6);
      ctx.fill();
      
      ctx.fillStyle = `rgba(255, 255, 255, ${signalAlpha})`;
      ctx.beginPath();
      ctx.moveTo(signalX + 18, signalY + 8);
      ctx.lineTo(signalX + 12, signalY + 18);
      ctx.lineTo(signalX + 24, signalY + 18);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillRect(signalX + 15, signalY + 17, 6, 8);
      
      ctx.font = '700 11px "JetBrains Mono"';
      ctx.fillStyle = `rgba(255, 255, 255, ${signalAlpha})`;
      ctx.fillText('RECOIL', signalX + 35, signalY + 21);
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ── MERIDIAN ANIMATION ──
// Market structure with swing highs and lows
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

  // Define swing points for market structure (x as %, y as % of height)
  // Descending structure: lower highs, lower lows, then reversal
  const swingPoints = [
    { x: 0.05, y: 0.20 },  // Start high
    { x: 0.12, y: 0.32 },  // Swing low 1
    { x: 0.20, y: 0.25 },  // Lower high 1
    { x: 0.28, y: 0.42 },  // Swing low 2 (lower)
    { x: 0.36, y: 0.35 },  // Lower high 2
    { x: 0.44, y: 0.55 },  // Swing low 3 (lower)
    { x: 0.52, y: 0.48 },  // Lower high 3
    { x: 0.60, y: 0.78 },  // THE LOW (major swing low at quant node)
    { x: 0.68, y: 0.58 },  // Higher low / reversal
    { x: 0.76, y: 0.65 },  // Pullback
    { x: 0.84, y: 0.45 },  // Higher high (confirmation)
    { x: 0.92, y: 0.52 },  // Small pullback
    { x: 0.98, y: 0.38 },  // Continuation up
  ];

  function draw() {
    frame++;
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    
    ctx.fillStyle = '#f2f1ed';
    ctx.fillRect(0, 0, w, h);

    // 540 frame cycle - slow
    const progress = (frame % 540) / 540;

    // Quant Node levels
    const nodes = [
      { y: h * 0.20, label: '1.14500' },
      { y: h * 0.40, label: '1.14200' },
      { y: h * 0.60, label: '1.13900' },
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

    // Line drawing
    const lineStart = 0.08;
    const lineEnd = 0.88;
    
    // The major low is at index 7 in swingPoints
    const majorLowIndex = 7;

    if (progress > lineStart) {
      const rawLineProgress = (progress - lineStart) / (lineEnd - lineStart);
      const lineProgress = Math.min(rawLineProgress, 1);
      
      // Calculate how many swing points to show
      const totalSegments = swingPoints.length - 1;
      const currentSegment = lineProgress * totalSegments;
      const fullSegments = Math.floor(currentSegment);
      const segmentProgress = currentSegment - fullSegments;

      // Build points array
      const points = [];
      const padding = 50;
      const drawWidth = w - padding * 2;
      const drawHeight = h - 40;

      for (let i = 0; i <= fullSegments && i < swingPoints.length; i++) {
        const sp = swingPoints[i];
        points.push({
          x: padding + sp.x * drawWidth,
          y: 20 + sp.y * drawHeight
        });
      }

      // Add partial segment
      if (fullSegments < totalSegments && segmentProgress > 0) {
        const from = swingPoints[fullSegments];
        const to = swingPoints[fullSegments + 1];
        points.push({
          x: padding + (from.x + (to.x - from.x) * segmentProgress) * drawWidth,
          y: 20 + (from.y + (to.y - from.y) * segmentProgress) * drawHeight
        });
      }

      // Track the current lowest point
      let currentLowestY = 0;
      let currentLowestX = 0;
      for (const p of points) {
        if (p.y > currentLowestY) {
          currentLowestY = p.y;
          currentLowestX = p.x;
        }
      }

      // Draw the line with smooth curves
      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          
          // Use quadratic curves for smoother lines
          const cpX = (prev.x + curr.x) / 2;
          const cpY = (prev.y + curr.y) / 2;
          
          if (i === 1) {
            ctx.lineTo(curr.x, curr.y);
          } else {
            ctx.quadraticCurveTo(prev.x, prev.y, cpX, cpY);
          }
        }
        
        // Draw to the last point
        if (points.length > 2) {
          const last = points[points.length - 1];
          ctx.lineTo(last.x, last.y);
        }
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Has the line reached the major low? (segment 7)
      const hasReachedLow = fullSegments >= majorLowIndex;
      
      if (hasReachedLow) {
        // Smooth easing function
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        
        // Calculate progress since reaching the low (0 to 1 over ~2 segments)
        const segmentsSinceLow = fullSegments - majorLowIndex + segmentProgress;
        const fadeProgress = Math.min(segmentsSinceLow / 2, 1); // Fade in over 2 segments
        const signalAlpha = easeOutCubic(fadeProgress);
        
        // Position at the actual major low
        const majorLow = swingPoints[majorLowIndex];
        const diamondX = padding + majorLow.x * drawWidth;
        const diamondY = 20 + majorLow.y * drawHeight + 12;
        const size = 10;

        // Diamond - smooth fade in
        ctx.save();
        ctx.globalAlpha = signalAlpha;
        ctx.translate(diamondX, diamondY);
        ctx.rotate(Math.PI / 4);
        
        const diamondGrad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        diamondGrad.addColorStop(0, 'rgba(220, 190, 80, 1)');
        diamondGrad.addColorStop(0.5, 'rgba(200, 165, 50, 1)');
        diamondGrad.addColorStop(1, 'rgba(184, 150, 46, 1)');
        ctx.fillStyle = diamondGrad;
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.restore();

        // Label - fade in slightly after diamond
        const labelProgress = Math.max(0, (fadeProgress - 0.3) / 0.7);
        const labelAlpha = easeOutCubic(labelProgress);
        if (labelAlpha > 0) {
          ctx.globalAlpha = labelAlpha;
          ctx.font = '700 10px "JetBrains Mono"';
          ctx.fillStyle = 'rgba(184, 150, 46, 1)';
          ctx.textAlign = 'center';
          ctx.fillText('PRIME SIGNAL', diamondX, diamondY + 22);
          ctx.textAlign = 'left';
          ctx.globalAlpha = 1;
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ── COCKPIT ANIMATION ──
// Multi-timeframe dashboard visualization
(function() {
  const c = document.getElementById('cockpitCanvas');
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

  // Helper to convert hex to rgb
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  }

  function draw() {
    frame++;
    const w = W / 2, h = H / 2;
    ctx.clearRect(0, 0, w, h);
    
    ctx.fillStyle = '#f2f1ed';
    ctx.fillRect(0, 0, w, h);

    const progress = (frame % 480) / 480;

    // Draw 4 timeframe panels
    const panels = [
      { label: '1H', regime: 'BULL', emaAlign: true },
      { label: '4H', regime: 'BULL', emaAlign: true },
      { label: '1D', regime: 'NEUT', emaAlign: false },
      { label: '1W', regime: 'BEAR', emaAlign: false },
    ];

    const panelWidth = (w - 80) / 4;
    const panelHeight = h * 0.55;
    const panelY = 35;

    panels.forEach((panel, i) => {
      const fadeIn = Math.min((progress * 5) - i * 0.1, 1);
      if (fadeIn <= 0) return;

      const px = 30 + i * (panelWidth + 10);

      // Panel background
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * fadeIn})`;
      ctx.beginPath();
      ctx.roundRect(px, panelY, panelWidth, panelHeight, 6);
      ctx.fill();

      ctx.strokeStyle = `rgba(0, 0, 0, ${0.08 * fadeIn})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // TF label
      ctx.font = '700 9px "JetBrains Mono"';
      ctx.fillStyle = `rgba(26, 26, 26, ${0.9 * fadeIn})`;
      ctx.textAlign = 'center';
      ctx.fillText(panel.label, px + panelWidth/2, panelY + 16);

      // Mini EMA lines
      const emaY = panelY + 28;
      const emaH = panelHeight * 0.4;
      const emas = [
        { offset: 0, color: '#7fdbff' },
        { offset: panel.emaAlign ? 4 : -2, color: '#00abff' },
        { offset: panel.emaAlign ? 8 : 2, color: '#0085c7' },
        { offset: panel.emaAlign ? 12 : -4, color: '#005e8c' },
      ];

      emas.forEach((ema, j) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${hexToRgb(ema.color)}, ${0.7 * fadeIn})`;
        ctx.lineWidth = 1;
        
        const points = [];
        for (let x = 0; x <= 20; x++) {
          const xPos = px + 8 + (panelWidth - 16) * (x / 20);
          const wave = Math.sin((frame / 60 + x / 4 + j) * 0.8) * (8 - j);
          const yPos = emaY + emaH/2 + ema.offset + wave;
          points.push({ x: xPos, y: yPos });
        }

        ctx.moveTo(points[0].x, points[0].y);
        for (let k = 1; k < points.length; k++) {
          ctx.lineTo(points[k].x, points[k].y);
        }
        ctx.stroke();
      });

      // Regime indicator
      const regimeY = panelY + panelHeight - 24;
      const regimeColors = {
        'BULL': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
        'BEAR': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
        'NEUT': { bg: 'rgba(150, 150, 150, 0.15)', text: '#888888' },
      };
      const rc = regimeColors[panel.regime];

      ctx.fillStyle = rc.bg;
      ctx.globalAlpha = fadeIn;
      ctx.beginPath();
      ctx.roundRect(px + 8, regimeY, panelWidth - 16, 16, 3);
      ctx.fill();

      ctx.font = '600 8px "JetBrains Mono"';
      ctx.fillStyle = rc.text;
      ctx.textAlign = 'center';
      ctx.fillText(panel.regime, px + panelWidth/2, regimeY + 11);
      ctx.globalAlpha = 1;
    });

    // Aggregated score at bottom
    const scoreY = panelY + panelHeight + 20;
    const scoreAlpha = Math.min((progress - 0.3) * 3, 1);
    
    if (scoreAlpha > 0) {
      // Background bar
      ctx.globalAlpha = scoreAlpha;
      ctx.fillStyle = 'rgba(240, 240, 235, 1)';
      ctx.beginPath();
      ctx.roundRect(30, scoreY, w - 60, 40, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Score text
      ctx.font = '600 9px "JetBrains Mono"';
      ctx.fillStyle = 'rgba(100, 100, 90, 0.8)';
      ctx.textAlign = 'left';
      ctx.fillText('AGGREGATE REGIME', 45, scoreY + 16);

      // Animated score value
      const score = Math.round(55 + Math.sin(frame / 40) * 15);
      ctx.font = '700 18px "JetBrains Mono"';
      ctx.fillStyle = '#c9a84c';
      ctx.textAlign = 'right';
      ctx.fillText(score, w - 55, scoreY + 28);

      // Score label - position after the score
      ctx.font = '400 10px "JetBrains Mono"';
      ctx.fillStyle = 'rgba(150, 140, 120, 0.7)';
      ctx.textAlign = 'left';
      ctx.fillText('/ 90', w - 50, scoreY + 28);
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
