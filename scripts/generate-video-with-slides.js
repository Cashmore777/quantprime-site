#!/usr/bin/env node
/**
 * Generate Education Video with Slideshow Capture
 * Captures slides from HTML, syncs with audio, adds captions
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const WORKSPACE = '/home/cashmore/.openclaw/workspace';
const SLIDES_DIR = `${WORKSPACE}/slide-frames`;

async function captureSlides(partNum) {
  const slideHtml = `${WORKSPACE}/quantprime/academy/level1/part${partNum}-slideshow.html`;
  
  if (!fs.existsSync(slideHtml)) {
    console.error(`Slideshow not found: ${slideHtml}`);
    process.exit(1);
  }

  // Create frames directory
  if (!fs.existsSync(SLIDES_DIR)) {
    fs.mkdirSync(SLIDES_DIR, { recursive: true });
  }

  console.log('🎬 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  // Load the slideshow
  console.log('📄 Loading slideshow...');
  await page.goto(`file://${slideHtml}`, { waitUntil: 'networkidle0' });
  
  // Wait for fonts to load
  await page.waitForFunction(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));

  // Get number of slides
  const slideCount = await page.evaluate(() => {
    return document.querySelectorAll('.slide').length;
  });
  console.log(`📊 Found ${slideCount} slides`);

  // Capture each slide
  const frames = [];
  for (let i = 1; i <= slideCount; i++) {
    // Activate this slide, deactivate others
    await page.evaluate((slideNum) => {
      document.querySelectorAll('.slide').forEach((s, idx) => {
        if (idx + 1 === slideNum) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    }, i);

    // Wait for transition
    await new Promise(r => setTimeout(r, 300));

    // Capture screenshot
    const framePath = `${SLIDES_DIR}/slide-${String(i).padStart(3, '0')}.png`;
    await page.screenshot({ path: framePath, type: 'png' });
    frames.push(framePath);
    
    process.stdout.write(`\r   Captured slide ${i}/${slideCount}`);
  }
  console.log('\n✅ All slides captured');

  await browser.close();
  return { frames, slideCount };
}

function generateCaptions(partNum, duration) {
  const transcriptPath = `${WORKSPACE}/level1-part${partNum}-audio.json`;
  
  if (!fs.existsSync(transcriptPath)) {
    console.log('⚠️  No transcript found, skipping captions');
    return null;
  }

  const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
  const segments = transcript.segments || [];
  
  // Gold accent keywords
  const keywords = ['edge', 'probability', 'risk', 'money', 'trading', 'market', 
                   'strategy', 'win', 'lose', 'profit', 'loss', 'system', 'truth',
                   'reality', 'mindset', 'discipline', 'consistent', 'successful',
                   'quant', 'prime', 'foundation', 'algorithm', 'data', 'emotion'];
  
  // Generate ASS subtitle file
  let ass = `[Script Info]
Title: Level 1 Part ${partNum}
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,2,2,50,50,80,1
Style: Gold,Arial,64,&H004CA8C9,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,2,2,50,50,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  segments.forEach(seg => {
    const start = formatAssTime(seg.start);
    const end = formatAssTime(seg.end);
    let text = seg.text.trim();
    
    // Highlight keywords in gold
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
      text = text.replace(regex, '{\\rGold}$1{\\rDefault}');
    });
    
    // Escape special characters
    text = text.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
    // Re-enable our style tags
    text = text.replace(/\\\{\\\\r/g, '{\\r').replace(/\\\}/g, '}');
    
    ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
  });

  const captionsPath = `${WORKSPACE}/level1-part${partNum}-captions.ass`;
  fs.writeFileSync(captionsPath, ass);
  console.log(`✍️  Captions saved: ${captionsPath}`);
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
  const outputPath = `${WORKSPACE}/level1-part${partNum}-final.mp4`;
  
  // Calculate frame duration (how long each slide stays on screen)
  const frameDuration = duration / slideCount;
  const fps = 25;
  const frameRate = 1 / frameDuration; // How many slides per second
  
  console.log(`🎥 Rendering video...`);
  console.log(`   ${slideCount} slides over ${Math.round(duration)}s = ${frameDuration.toFixed(2)}s per slide`);

  // Build ffmpeg command
  // Use image sequence with calculated framerate
  let ffmpegCmd = [
    'ffmpeg', '-y',
    '-framerate', String(frameRate),
    '-i', `${SLIDES_DIR}/slide-%03d.png`,
    '-i', audioPath,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', String(fps),
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest'
  ];

  // Add captions if available
  if (captionsPath && fs.existsSync(captionsPath)) {
    ffmpegCmd.push('-vf', `ass=${captionsPath}`);
  }

  ffmpegCmd.push(outputPath);

  console.log(`   Command: ${ffmpegCmd.join(' ')}`);
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegCmd[0], ffmpegCmd.slice(1), {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString();
      if (line.includes('frame=') || line.includes('time=')) {
        process.stdout.write(`\r   ${line.trim().substring(0, 80)}`);
      }
    });

    ffmpeg.on('close', (code) => {
      console.log('');
      if (code === 0) {
        const stats = fs.statSync(outputPath);
        console.log(`✅ Video saved: ${outputPath}`);
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

async function main() {
  const partNum = parseInt(process.argv[2]) || 1;
  
  console.log(`\n🎬 Generating Part ${partNum} video with slides...\n`);
  
  // Check audio exists
  const audioPath = `${WORKSPACE}/level1-part${partNum}-audio.mp3`;
  if (!fs.existsSync(audioPath)) {
    console.error(`Audio not found: ${audioPath}`);
    process.exit(1);
  }

  // Get audio duration
  const durationOutput = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`).toString().trim();
  const duration = parseFloat(durationOutput);
  console.log(`   Audio duration: ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`);

  // Capture slides
  const { frames, slideCount } = await captureSlides(partNum);

  // Generate captions
  const captionsPath = generateCaptions(partNum, duration);

  // Render final video
  await renderVideo(partNum, slideCount, duration, captionsPath);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
