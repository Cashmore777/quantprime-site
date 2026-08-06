#!/usr/bin/env node
/**
 * Generate Education Video v2 - Fixed version
 * - Properly isolates slides before capture
 * - Correct slide timing
 * - Proper caption sync
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const WORKSPACE = '/home/cashmore/.openclaw/workspace';
const SLIDES_DIR = `${WORKSPACE}/slide-frames-v2`;

async function captureSlides(partNum) {
  const slideHtml = `${WORKSPACE}/quantprime/academy/level1/part${partNum}-slideshow.html`;
  
  if (!fs.existsSync(slideHtml)) {
    console.error(`Slideshow not found: ${slideHtml}`);
    process.exit(1);
  }

  // Clean and create frames directory
  if (fs.existsSync(SLIDES_DIR)) {
    fs.rmSync(SLIDES_DIR, { recursive: true });
  }
  fs.mkdirSync(SLIDES_DIR, { recursive: true });

  console.log('🎬 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  console.log('📄 Loading slideshow...');
  await page.goto(`file://${slideHtml}`, { waitUntil: 'networkidle0', timeout: 60000 });
  
  // Wait for fonts and initial render
  await page.waitForFunction(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  // Get all slide IDs
  const slideIds = await page.evaluate(() => {
    const slides = document.querySelectorAll('.slide');
    return Array.from(slides).map((s, i) => s.id || `slide-${i+1}`);
  });
  
  console.log(`📊 Found ${slideIds.length} slides: ${slideIds.join(', ')}`);

  const frames = [];
  
  for (let i = 0; i < slideIds.length; i++) {
    const slideId = slideIds[i];
    
    // IMPORTANT: Hide ALL slides first, then show only this one
    await page.evaluate((currentId) => {
      // Hide everything and remove active class
      document.querySelectorAll('.slide').forEach(s => {
        s.style.display = 'none';
        s.style.opacity = '0';
        s.style.visibility = 'hidden';
        s.classList.remove('active');
      });
      
      // Now show only the current slide
      const current = document.getElementById(currentId) || document.querySelectorAll('.slide')[parseInt(currentId.split('-')[1]) - 1];
      if (current) {
        current.style.display = 'flex';
        current.style.opacity = '1';
        current.style.visibility = 'visible';
        current.classList.add('active');
      }
    }, slideId);

    // Wait for CSS transitions
    await new Promise(r => setTimeout(r, 500));

    // Screenshot
    const framePath = `${SLIDES_DIR}/slide-${String(i + 1).padStart(3, '0')}.png`;
    await page.screenshot({ path: framePath, type: 'png' });
    frames.push(framePath);
    
    console.log(`   ✓ Captured slide ${i + 1}/${slideIds.length}`);
  }

  await browser.close();
  console.log('✅ All slides captured cleanly');
  
  return frames.length;
}

function generateCaptions(partNum) {
  const transcriptPath = `${WORKSPACE}/level1-part${partNum}-audio.json`;
  
  if (!fs.existsSync(transcriptPath)) {
    console.log('⚠️  No transcript found');
    return null;
  }

  const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
  const segments = transcript.segments || [];
  
  console.log(`📝 Processing ${segments.length} caption segments...`);
  
  // Keywords to highlight in gold
  const keywords = ['edge', 'probability', 'risk', 'money', 'trading', 'market', 
                   'strategy', 'win', 'lose', 'profit', 'loss', 'system', 'truth',
                   'reality', 'mindset', 'discipline', 'consistent', 'successful',
                   'quant', 'prime', 'foundation', 'algorithm', 'data', 'emotion',
                   'retail', 'trader', 'traders', 'percent', 'industry'];
  
  // ASS header with proper styling
  let ass = `[Script Info]
Title: Level 1 Part ${partNum}
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,56,&H00FFFFFF,&H000000FF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,1,3,1,2,80,80,60,1
Style: Gold,Arial,56,&H004CA8C9,&H000000FF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,1,3,1,2,80,80,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  segments.forEach((seg, idx) => {
    const start = formatAssTime(seg.start);
    const end = formatAssTime(seg.end);
    let text = seg.text.trim();
    
    // Skip empty segments
    if (!text) return;
    
    // Highlight keywords
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw}s?)\\b`, 'gi');
      text = text.replace(regex, '{\\rGold}$1{\\rDefault}');
    });
    
    ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
  });

  const captionsPath = `${WORKSPACE}/level1-part${partNum}-captions-v2.ass`;
  fs.writeFileSync(captionsPath, ass);
  console.log(`✅ Captions saved: ${captionsPath}`);
  return captionsPath;
}

function formatAssTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds * 100) % 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

async function renderVideo(partNum, slideCount, duration, captionsPath) {
  const audioPath = `${WORKSPACE}/level1-part${partNum}-audio.mp3`;
  const outputPath = `${WORKSPACE}/level1-part${partNum}-final-v2.mp4`;
  
  // Each slide should show for (duration / slideCount) seconds
  const secondsPerSlide = duration / slideCount;
  
  console.log(`\n🎥 Rendering video...`);
  console.log(`   Duration: ${Math.floor(duration/60)}:${String(Math.floor(duration%60)).padStart(2,'0')}`);
  console.log(`   Slides: ${slideCount}`);
  console.log(`   Time per slide: ${secondsPerSlide.toFixed(1)}s`);

  // Create a concat file for ffmpeg - each image shown for correct duration
  const concatFile = `${WORKSPACE}/slides-concat.txt`;
  let concatContent = '';
  for (let i = 1; i <= slideCount; i++) {
    const framePath = `${SLIDES_DIR}/slide-${String(i).padStart(3, '0')}.png`;
    concatContent += `file '${framePath}'\n`;
    concatContent += `duration ${secondsPerSlide}\n`;
  }
  // Last frame needs to be listed again (ffmpeg concat demuxer quirk)
  concatContent += `file '${SLIDES_DIR}/slide-${String(slideCount).padStart(3, '0')}.png'\n`;
  fs.writeFileSync(concatFile, concatContent);

  // Build ffmpeg command using concat demuxer
  const ffmpegArgs = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFile,
    '-i', audioPath,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-r', '25',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest'
  ];

  // Add captions filter
  if (captionsPath && fs.existsSync(captionsPath)) {
    ffmpegArgs.push('-vf', `ass=${captionsPath}`);
  }

  ffmpegArgs.push(outputPath);

  console.log(`   Running FFmpeg...`);
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let lastProgress = '';
    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString();
      const match = line.match(/time=(\d+:\d+:\d+)/);
      if (match && match[1] !== lastProgress) {
        lastProgress = match[1];
        process.stdout.write(`\r   Encoding: ${match[1]}`);
      }
    });

    ffmpeg.on('close', (code) => {
      console.log('');
      if (code === 0) {
        const stats = fs.statSync(outputPath);
        console.log(`\n✅ Video complete: ${outputPath}`);
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });

    ffmpeg.on('error', reject);
  });
}

async function main() {
  const partNum = parseInt(process.argv[2]) || 1;
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🎬 GENERATING PART ${partNum} VIDEO (v2 - Fixed)`);
  console.log(`${'='.repeat(50)}\n`);
  
  // Check audio
  const audioPath = `${WORKSPACE}/level1-part${partNum}-audio.mp3`;
  if (!fs.existsSync(audioPath)) {
    console.error(`❌ Audio not found: ${audioPath}`);
    process.exit(1);
  }

  // Get duration
  const durationStr = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`).toString().trim();
  const duration = parseFloat(durationStr);
  
  // Capture slides
  const slideCount = await captureSlides(partNum);
  
  // Generate captions
  const captionsPath = generateCaptions(partNum);
  
  // Render
  await renderVideo(partNum, slideCount, duration, captionsPath);
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('🎉 COMPLETE!');
  console.log(`${'='.repeat(50)}\n`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
