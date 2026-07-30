const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Premium QP favicon SVG with gold gradient
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e6c970"/>
      <stop offset="50%" style="stop-color:#c9a84c"/>
      <stop offset="100%" style="stop-color:#9a7b3a"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="100" fill="#08080c"/>
  <rect x="8" y="8" width="496" height="496" rx="92" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.3"/>
  
  <!-- Stylized QP Logo -->
  <g transform="translate(60, 80)">
    <!-- Q circle -->
    <circle cx="140" cy="160" r="110" fill="none" stroke="url(#goldGrad)" stroke-width="36"/>
    <!-- Q tail -->
    <line x1="210" y1="230" x2="300" y2="320" stroke="url(#goldGrad)" stroke-width="36" stroke-linecap="round"/>
    
    <!-- P shape -->
    <g opacity="0.85">
      <line x1="280" y1="80" x2="280" y2="300" stroke="url(#goldGrad)" stroke-width="28" stroke-linecap="round"/>
      <path d="M280 80 Q380 80 380 150 Q380 220 280 220" fill="none" stroke="url(#goldGrad)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
</svg>`;

async function generateFavicons() {
  console.log('Generating favicon files...');
  
  const svgBuffer = Buffer.from(faviconSvg);
  
  // Generate different sizes
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];
  
  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(ASSETS_DIR, name));
    console.log(`✓ Generated ${name}`);
  }
  
  // Generate favicon.ico (multi-size ICO)
  const ico16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  
  // For ICO, we'll just use the 32x32 as the main one and copy it
  fs.copyFileSync(
    path.join(ASSETS_DIR, 'favicon-32x32.png'),
    path.join(__dirname, '..', 'favicon.ico')
  );
  console.log('✓ Generated favicon.ico');
  
  // Also update the SVG favicon
  fs.writeFileSync(path.join(ASSETS_DIR, 'favicon.svg'), faviconSvg);
  console.log('✓ Updated favicon.svg');
  
  console.log('\nAll favicons generated successfully!');
}

generateFavicons().catch(console.error);
