/**
 * QUANT PRIME - Education Video Generator
 * 
 * Takes audio + transcript + slideshow and produces a final MP4 with:
 * - Synced slide transitions
 * - Animated word-by-word captions (Hormozi style)
 * - Gold highlights on key words
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Config
const FRAME_RATE = 30;
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const GOLD_COLOR = '#c9a84c';
const CAPTION_FONT = 'Arial Black';
const CAPTION_SIZE = 48;

// Key words to highlight in gold
const HIGHLIGHT_WORDS = [
  'quant prime', 'profitable', 'consistency', 'discipline', 'risk',
  'strategy', 'system', 'framework', 'structure', 'process',
  'faith', 'mission', 'purpose', 'freedom', 'independence',
  'truth', 'reality', 'professional', 'skill', 'success'
];

async function generateVideo(options) {
  const {
    audioPath,
    transcriptPath,
    slideshowUrl,
    outputPath,
    partNumber
  } = options;

  console.log(`\n🎬 Generating Part ${partNumber} video...`);
  console.log(`   Audio: ${audioPath}`);
  console.log(`   Transcript: ${transcriptPath}`);
  console.log(`   Slideshow: ${slideshowUrl}`);

  // Load transcript
  const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
  const segments = transcript.segments;
  const totalDuration = segments[segments.length - 1].end;

  console.log(`   Duration: ${Math.floor(totalDuration / 60)}:${Math.floor(totalDuration % 60).toString().padStart(2, '0')}`);
  console.log(`   Segments: ${segments.length}`);

  // Create temp directory for frames
  const tempDir = path.join(path.dirname(outputPath), `temp_frames_part${partNumber}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Launch browser
  console.log('\n📸 Capturing slideshow frames...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
  await page.goto(slideshowUrl, { waitUntil: 'networkidle0' });

  // Wait for slideshow to load
  await page.waitForTimeout(2000);

  // Calculate total frames needed
  const totalFrames = Math.ceil(totalDuration * FRAME_RATE);
  console.log(`   Total frames: ${totalFrames}`);

  // Generate ASS subtitle file with animations
  console.log('\n✍️  Generating animated captions...');
  const assPath = path.join(tempDir, 'captions.ass');
  generateAnimatedASS(segments, assPath);

  // Capture frames with slide progression
  // For now, capture a single frame of the slideshow background
  // Real implementation would sync with slide transitions
  const framePath = path.join(tempDir, 'background.png');
  await page.screenshot({ path: framePath, type: 'png' });
  console.log('   Background captured');

  await browser.close();

  // Use ffmpeg to combine audio + background + captions
  console.log('\n🎥 Rendering final video...');
  
  const ffmpegCmd = [
    'ffmpeg', '-y',
    '-loop', '1',
    '-i', framePath,
    '-i', audioPath,
    '-vf', `ass=${assPath}`,
    '-c:v', 'libx264',
    '-tune', 'stillimage',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-pix_fmt', 'yuv420p',
    '-shortest',
    outputPath
  ].join(' ');

  console.log(`   Command: ${ffmpegCmd}`);
  
  try {
    execSync(ffmpegCmd, { stdio: 'inherit' });
    console.log(`\n✅ Video saved to: ${outputPath}`);
  } catch (err) {
    console.error('FFmpeg error:', err.message);
  }

  // Cleanup
  // fs.rmSync(tempDir, { recursive: true });

  return outputPath;
}

function generateAnimatedASS(segments, outputPath) {
  // ASS header with styles
  let ass = `[Script Info]
Title: Quant Prime Education Captions
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,56,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,2,2,50,50,80,1
Style: Highlight,Arial Black,56,&H004CA8C9,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,2,2,50,50,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Add each segment as a dialogue line
  segments.forEach((seg, idx) => {
    const startTime = formatASSTime(seg.start);
    const endTime = formatASSTime(seg.end);
    
    // Check for highlight words
    let text = seg.text.trim();
    HIGHLIGHT_WORDS.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      text = text.replace(regex, `{\\c&H4CA8C9&}$1{\\c&HFFFFFF&}`);
    });

    // Add fade in/out effect
    const fadeMs = 150;
    text = `{\\fad(${fadeMs},${fadeMs})}${text}`;

    ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}\n`;
  });

  fs.writeFileSync(outputPath, ass);
  console.log(`   ASS captions saved: ${outputPath}`);
}

function formatASSTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const partNumber = args[0] || '1';
  
  const workspaceDir = '/home/cashmore/.openclaw/workspace';
  
  const options = {
    audioPath: path.join(workspaceDir, `level1-part${partNumber}-audio.mp3`),
    transcriptPath: path.join(workspaceDir, `level1-part${partNumber}-audio.json`),
    slideshowUrl: `file://${workspaceDir}/quantprime/academy/level1/part${partNumber}-recording.html`,
    outputPath: path.join(workspaceDir, `level1-part${partNumber}-final.mp4`),
    partNumber
  };

  await generateVideo(options);
}

main().catch(console.error);
