const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
    const browser = await puppeteer.launch({
        executablePath: '/home/cashmore/.cache/puppeteer/chrome/linux-151.0.7922.47/chrome-linux64/chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    await page.goto('file://' + path.resolve('assets/quant-prime-manifesto.html'), {
        waitUntil: 'networkidle0'
    });
    
    await page.pdf({
        path: 'assets/quant-prime-manifesto.pdf',
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    console.log('PDF generated: assets/quant-prime-manifesto.pdf');
}

generatePDF().catch(console.error);
