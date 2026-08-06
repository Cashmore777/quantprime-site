/**
 * QUANT PRIME - Education Video Generator (Simple Version)
 * 
 * Generates video with:
 * - Dark premium background
 * - QP branding
 * - Animated word-by-word captions
 * - Gold highlights on key words
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Config
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const GOLD_HEX = 'c9a84c';  // For ASS format (BGR)
const GOLD_ASS = '4CA8C9';  // ASS uses BGR format

// Key words to highlight in gold
const HIGHLIGHT_WORDS = [
  'quant prime', 'quantprime', 'profitable', 'profitability', 'consistency', 'consistent',
  'discipline', 'disciplined', 'risk', 'strategy', 'system', 'framework', 
  'structure', 'process', 'faith', 'mission', 'purpose', 'freedom', 
  'independence', 'independent', 'truth', 'reality', 'professional', 
  'skill', 'success', 'forex', 'trading', 'traders', 'ceo', 'academy',
  'powerful', 'important', 'three years', 'two years'
];

function generateVideo(partNumber) {
  const workspaceDir = '/home/cashmore/.openclaw/workspace';
  
  const audioPath = path.join(workspaceDir, `level1-part${partNumber}-audio.mp3`);
  const transcriptPath = path.join(workspaceDir, `level1-part${partNumber}-audio.json`);
  const outputPath = path.join(workspaceDir, `level1-part${partNumber}-final.mp4`);
  const assPath = path.join(workspaceDir, `level1-part${partNumber}-captions.ass`);

  console.log(`\n🎬 Generating Part ${partNumber} video...`);
  
  // Check files exist
  if (!fs.existsSync(audioPath)) {
    console.error(`❌ Audio not found: ${audioPath}`);
    return;
  }
  if (!fs.existsSync(transcriptPath)) {
    console.error(`❌ Transcript not found: ${transcriptPath}`);
    return;
  }

  // Load transcript
  const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
  const segments = transcript.segments;
  const totalDuration = segments[segments.length - 1].end;

  console.log(`   Duration: ${Math.floor(totalDuration / 60)}:${Math.floor(totalDuration % 60).toString().padStart(2, '0')}`);
  console.log(`   Segments: ${segments.length}`);

  // Generate ASS subtitle file
  console.log('\n✍️  Generating animated captions...');
  generateAnimatedASS(segments, assPath, partNumber);

  // Use ffmpeg to create video with dark background + captions
  console.log('\n🎥 Rendering final video...');
  
  // Create video with dark gradient background and QP logo text
  const ffmpegCmd = `ffmpeg -y \\
    -f lavfi -i "color=c=0x0a0a0f:s=${VIDEO_WIDTH}x${VIDEO_HEIGHT}:d=${Math.ceil(totalDuration)}" \\
    -i "${audioPath}" \\
    -filter_complex "[0:v]drawtext=text='QUANT PRIME':fontcolor=0x${GOLD_HEX}:fontsize=32:x=60:y=50:alpha=0.6,\\
    drawtext=text='LEVEL 1 • PART ${partNumber}':fontcolor=0xffffff:fontsize=24:x=60:y=95:alpha=0.4,\\
    ass=${assPath}[v]" \\
    -map "[v]" -map 1:a \\
    -c:v libx264 -preset fast -crf 23 \\
    -c:a aac -b:a 192k \\
    -pix_fmt yuv420p \\
    -shortest \\
    "${outputPath}"`;

  console.log('   Running FFmpeg...');
  
  try {
    execSync(ffmpegCmd, { stdio: 'inherit', shell: '/bin/bash' });
    console.log(`\n✅ Video saved to: ${outputPath}`);
    
    // Get file size
    const stats = fs.statSync(outputPath);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  } catch (err) {
    console.error('❌ FFmpeg error:', err.message);
  }

  return outputPath;
}

function generateAnimatedASS(segments, outputPath, partNumber) {
  // ASS header with styles
  let ass = `[Script Info]
Title: Quant Prime Level 1 Part ${partNumber}
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: ${VIDEO_WIDTH}
PlayResY: ${VIDEO_HEIGHT}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,52,&H00FFFFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,3,3,2,100,100,120,1
Style: Highlight,Arial,52,&H00${GOLD_ASS},&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,3,3,2,100,100,120,1
Style: Title,Arial,36,&H00${GOLD_ASS},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,2,8,50,50,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Add each segment as a dialogue line
  segments.forEach((seg, idx) => {
    const startTime = formatASSTime(seg.start);
    const endTime = formatASSTime(seg.end);
    
    // Clean and process text
    let text = seg.text.trim();
    
    // Escape special characters
    text = text.replace(/\\/g, '\\\\');
    text = text.replace(/\{/g, '\\{');
    text = text.replace(/\}/g, '\\}');
    
    // Highlight key words (case insensitive)
    HIGHLIGHT_WORDS.forEach(word => {
      const regex = new RegExp(`\\b(${word.replace(/\s+/g, '\\s+')})\\b`, 'gi');
      text = text.replace(regex, `{\\c&H${GOLD_ASS}&}$1{\\c&HFFFFFF&}`);
    });

    // Add subtle fade
    const fadeMs = 100;
    text = `{\\fad(${fadeMs},${fadeMs})}${text}`;

    ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}\n`;
  });

  fs.writeFileSync(outputPath, ass);
  console.log(`   Captions saved: ${outputPath}`);
}

function formatASSTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

// Main
const partNumber = process.argv[2] || '1';
generateVideo(partNumber);
