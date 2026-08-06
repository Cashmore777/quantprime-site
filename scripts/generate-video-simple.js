const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');

const PART = parseInt(process.argv[2]) || 2;
const WORKSPACE = '/home/cashmore/.openclaw/workspace';
const CHROME = '/home/cashmore/.cache/puppeteer/chrome/linux-151.0.7922.47/chrome-linux64/chrome';

const delay = ms => new Promise(r => setTimeout(r, ms));

const config = {
  2: {
    audio: `${WORKSPACE}/level1-part2-audio.mp3`,
    html: `${WORKSPACE}/quantprime/academy/level1/part2-recording.html`,
    output: `${WORKSPACE}/level1-part2-final.mp4`,
    slides: 10
  },
  3: {
    audio: `${WORKSPACE}/level1-part3-audio.mp3`,
    html: `${WORKSPACE}/quantprime/academy/level1/part3-recording.html`,
    output: `${WORKSPACE}/level1-part3-final.mp4`,
    slides: 10
  }
}[PART];

async function run() {
  console.log(`\n=== PART ${PART} VIDEO ===\n`);
  
  const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${config.audio}"`).toString().trim();
  const duration = parseFloat(dur);
  const timePerSlide = duration / config.slides;
  console.log(`Duration: ${Math.floor(duration/60)}m ${Math.floor(duration%60)}s`);
  console.log(`Slides: ${config.slides} @ ${timePerSlide.toFixed(1)}s each`);
  
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('file://' + config.html, { waitUntil: 'networkidle0' });
  await delay(2000);
  
  const frameDir = `${WORKSPACE}/frames-part${PART}`;
  execSync(`rm -rf ${frameDir} && mkdir -p ${frameDir}`);
  
  const slideCount = await page.$$eval('.slide', slides => slides.length);
  console.log(`Found ${slideCount} slides`);
  
  for (let i = 0; i < slideCount; i++) {
    await page.evaluate((idx) => {
      document.querySelectorAll('.slide').forEach((s, j) => {
        s.style.display = j === idx ? 'flex' : 'none';
        s.style.opacity = j === idx ? '1' : '0';
        s.style.visibility = j === idx ? 'visible' : 'hidden';
      });
    }, i);
    await delay(300);
    
    const framePath = `${frameDir}/slide-${String(i+1).padStart(3,'0')}.png`;
    await page.screenshot({ path: framePath });
    console.log(`  Slide ${i+1}/${slideCount}`);
  }
  
  await browser.close();
  
  const concatFile = `${WORKSPACE}/concat-part${PART}.txt`;
  let concat = '';
  for (let i = 0; i < slideCount; i++) {
    concat += `file '${frameDir}/slide-${String(i+1).padStart(3,'0')}.png'\n`;
    concat += `duration ${timePerSlide}\n`;
  }
  concat += `file '${frameDir}/slide-${String(slideCount).padStart(3,'0')}.png'\n`;
  fs.writeFileSync(concatFile, concat);
  
  console.log('\nRendering...');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -i "${config.audio}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -r 25 -c:a aac -b:a 192k -shortest "${config.output}" 2>&1`, {
    stdio: 'inherit',
    maxBuffer: 50 * 1024 * 1024
  });
  
  const size = fs.statSync(config.output).size / (1024*1024);
  console.log(`\n✅ Done: ${config.output} (${size.toFixed(1)}MB)`);
}

run().catch(e => { console.error(e); process.exit(1); });
