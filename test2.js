const { scrollPageToBottom } = require('puppeteer-autoscroll-down')
const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')();
const ObjectsToCsv = require('objects-to-csv');

(async () => {
    const fbPage = prompt('What FaceBook Page?');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    // const baseUrl = "https://coinmarketcap.com/"
    // await page.setRequestInterception(true)
    // page.on('request', req=>{
    //     // if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet'){
    //     if (req.resourceType() === 'image' ){
    //         req.abort()
    //     }
    //     return Promise.resolve().then(() => req.continue()).catch(e => {})
    //     // else{
    //     //     req.continue()
    //     // }
    // })
    let isLoadingAvailable=true
    let scroll = 0
    // await page.goto(`https://www.facebook.com/${fbPage}/photos/`, {waitUntil : 'domcontentloaded' }).catch(e => void 0);
    await page.goto(`https://www.facebook.com/OfficialMensHumor/`, {waitUntil : 'networkidle2' }).catch(e => void 0);
    // while (isLoadingAvailable) {
    //     await scrollPageToBottom(page, { size: 10 , delay: 10})
    //     console.log(scroll)
    //     scroll++
    //     if(scroll == 55){
    //         isLoadingAvailable = false
    //     }
    await scrollDown(page)

    // setTimeout(async ()=>{
    //     console.log('stop')
    //     await scrollDown(page, false)
    // }, 1000)
        // await page.waitForResponse(
        //   response => response.url() === 'http://example.com' && response.status() === 200
        // )
        // isLoadingAvailable = false // Update your condition-to-stop value
      }
    // let img = await page.$('img[data-visualcompletion]') //Image
    // console.log(img)
    // await autoScroll(page)
    // await scrapeArticles(page)
    // const commnets = await page.$x("//span[contains(text(), 'Comments')]") //Comments
    // console.log(commnets)
    // console.log(getText(commnets))
    // await page.$('span.pcp91wgn') //Reactions
    // const comments = await page.evaluate(() => {
    //     const spanTags = Array.from(document.getElementsByXPath('table.cmc-table tbody tr td div.sc-16r8icm-0.escjiH a.cmc-link'))
    //     return aTags.map(a=>a.getAttribute('href'))
    // })
    // await page.$x("//span[contains(text(), 'Shares')]") //Comments
    // console.log(`[+] Scraping Page ${i}`);

    // await browser.close();
)();


const scrollDown = async (page)=>{
    let post_count = 10
    let post = 0
    while(post < post_count){
        page.evaluate(async () => {
            await window.scrollBy(0, 500); //Scrol to bottom of page
          })        
          await page.waitForTimeout(500);
        post++

    }
    console.log('stoped')
}