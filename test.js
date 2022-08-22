const puppeteer = require('puppeteer-extra')
const { Cluster } = require('puppeteer-cluster');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
        // args: ['--start-maximized', '--proxy-server=http://142.11.247.191:3128']
    });
    const page = (await browser.pages())[0]

    await page.goto('https://google.com/')

    await activateCluster()
    

    // We don't define a task and instead queue individual functions

    // Make a screenshot
    

    // Extract a title
    await browser.close()
    
})();

const activateCluster = async () =>{
    const cluster = await Cluster.launch( {puppeteerOptions: {
        headless: true,
        defaultViewport: null, 
    },
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
    });

    cluster.queue(async ({ page }) => {
        await page.goto('http://www.wikipedia.org');
        await page.screenshot({path: 'wikipedia.png'});
    });

    cluster.queue(title);


    // And do more stuff...
    cluster.queue(async ({ page }) => {
        await page.goto('https://www.google.com/');
        // ...
    });

    await cluster.idle();
    await cluster.close();
}

const title = async ({ page }) => {
    await page.goto('https://www.google.com/');
    const pageTitle = await page.evaluate(() => document.title);
    console.log(`Page title is ${pageTitle}`);
}