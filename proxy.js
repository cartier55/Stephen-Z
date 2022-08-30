const puppeteer = require('zyte-smartproxy-puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        spm_apikey: '<Smart Proxy Manager API KEY>',
        ignoreHTTPSErrors: true,
        headless: false,
    });
    console.log('Before new page');
    const page = await browser.newPage();
    console.log('Opening page ...');
    try {
        await page.goto('https://toscrape.com/', {timeout: 180000});
    } catch(err) {
        console.log(err);
    }
    console.log('Taking a screenshot ...');
    await page.screenshot({path: 'screenshot.png'});
    await browser.close();
})();