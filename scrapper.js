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
    // await page.goto(`https://www.facebook.com/${fbPage}/photos/`, {waitUntil : 'domcontentloaded' }).catch(e => void 0);
    await page.goto(`https://www.facebook.com/OfficialMensHumor/`, {waitUntil : 'domcontentloaded' }).catch(e => void 0);
    // let img = await page.$('img[data-visualcompletion]') //Image
    // console.log(img)
    // await autoScroll(page)
    await scrapeArticles(page)
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

    await browser.close();
})();

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                
                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function getText(spans){
    for (const ele of spans){
        // const text = ele.getProperty('innerText')
        const text = await (await ele.getProperty('innerText')).jsonValue()
        console.log(text)
    }
}

async function scrapeArticles(
  page,
//   extractItems,
  postCount=100,
  scrollDelay = 800,
) {
  let post = [];
  try {
    let previousHeight;
    while (post.length < postCount) {
    //   items = await page.evaluate(extractItems);
    const content = await page.$('div[role="main"] > div.k4urcfbm')
    post = await content.evaluate(()=>{
        const postDivs = Array.from(document.querySelectorAll('div.du4w35lb.l9j0dhe7 div[class=lzcic4wl][role="article"]'))
        return postDivs.map(post=>({id:post.getAttribute('aria-posinset')}))

    })

    // const article = await page.waitForSelector(`div[aria-posinset="${postID}"]`)
    // const postURLHandle = await article.$('a[role="link"][aria-label]')
    // const postURL = await (await postURLHandle.getProperty('href')).jsonValue()
    
    // const post = await content.$('div.du4w35lb.l9j0dhe7 > div[role="article"]')
    console.log(post)
    // items = await page.  
    // cments = await page.$x("//span[contains(text(), 'Comments')]");
    // getText(cments)
    previousHeight = await page.evaluate('document.body.scrollHeight');
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
    await page.waitForTimeout(scrollDelay);
    }
    console.log(1)
    await getPostUrls(page, post)
    await getComments(page, post)
    await getShares(page, post)
    await getReactions(page, post)
    await getPostImg(page, post)
    await getTime(page, post)
    console.log(post)
    saveToFile(post)
    // console.log(items.length)
  } catch(e) { 
    console.log(e)
  }
//   return items;
}


const getComments = async (page, articleNums) =>{
    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'id'){
                const article = await page.$(`div[aria-posinset="${obj[key]}"]`)
                const handle = await article.waitForFunction('document.querySelector("span.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.lr9zc1uh.a8c37x1j.fe6kdd0r.mau55g9w.c8b282yb.keod5gw0.nxhoafnm.aigsh9s9.d3f4x2em.iv3no6db.jq4qci2q.a3bd9o3v.b1v8xokw.m9osqain").innerText')
                // const handle = await article.waitForXPath("//span[contains(text(), 'Comments')]", {visible: true})
                // Comment String
                const commentNum = await (await handle[0].getProperty('innerText')).jsonValue()
                obj['commentsNum'] = commentNum
            }
            

        }
    }
    // console.log(articleNums)
}

const getShares = async (page, articleNums) => {
    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'id'){
                const article = await page.$(`div[aria-posinset="${obj[key]}"]`)
                const handle = await article.waitForXPath("//span[contains(text(), 'Shares')]", {visible: true})
                // Share String
                const shareNum = await (await handle[0].getProperty('innerText')).jsonValue()
                obj['sharesNum'] = shareNum
            }
        }
    }
    // console.log(articleNums)
}

const getReactions = async (page, articleNums) =>{
    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'id'){
                const article = await page.$(`div[aria-posinset="${obj[key]}"]`)
                const handle = await article.$('span[aria-label="See who reacted to this"] + span[aria-hidden="true"]')
                // Share String
                const reactionsNum = await (await handle.getProperty('innerText')).jsonValue()
                obj['reactionsNum'] = reactionsNum
            }
        }
    }
    // console.log(articleNums)
    
}

const getPostImg = async (page, articleNums)=>{
    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'id'){
                const article = await page.$(`div[aria-posinset="${obj[key]}"]`)
                const imgDiv = await article.$('div[class="pmk7jnqg kr520xx4"]')
                const handle = await imgDiv.$('img[alt]')
                // Share String
                const imgUrl = await (await handle.getProperty('src')).jsonValue()
                obj['imgUrl'] = imgUrl
            }
        }
    }
    // console.log(articleNums)


    // for (const articleid of articleNums){
    //     const article = await page.$(`div[aria-posinset="${articleid}"]`)
    //     const imgDiv = await article.$('div[class="pmk7jnqg kr520xx4"]')
    //     const handle = await imgDiv.$('img[alt]')
    //     // Share String
    //     console.log(await (await handle.getProperty('src')).jsonValue())
    // }
}

// And timestamp
const getTime = async (page, articleNums)=>{
    for (const obj of articleNums){
        for (const key in obj){
            if(key == 'postUrl'){
                await page.goto(obj[key])
                const timeStamp = await page.$eval('abbr[data-shorten]', abbr=>abbr.dataset.tooltipContent)
                obj['timestamp'] = timeStamp
            }

        }
    }
    // for (const articleid of articleNums){
    //     // const article = await page.waitForSelector(`div[aria-posinset="${articleid}"]`)
    //     // const postURLHandle = await article.$('a[role="link"][aria-label]')
    //     // const postURL = await (await postURLHandle.getProperty('href')).jsonValue()
    //     console.log(postURL)
    //     await page.goto(postURL)
    //     const timeStamp = await page.$eval('abbr[data-shorten]', abbr=>abbr.dataset.tooltipContent)
    //     await page.goBack()
    //     console.log(timeStamp)
    //     console.log('----------------------')

        
    // }
}

const getPostUrls = async (page, articleNums)=>{

    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'id'){
                const article = await page.$(`div[aria-posinset="${obj[key]}"]`)
                const postURLHandle = await article.$('a[role="link"][aria-label]')
                // Share String
                const postURL = await (await postURLHandle.getProperty('href')).jsonValue()
                obj['postUrl'] = postURL
            }
        }
    }
    console.log(articleNums)

    // let postUrls = []
    // for (const postId in articleNums){
    //     const article = await page.waitForSelector(`div[aria-posinset="${postId}"]`)
    //     const postURLHandle = await article.$('a[role="link"][aria-label]')
    //     const postURL = await (await postURLHandle.getProperty('href')).jsonValue()
    //     postUrls.push(postURL)
    // }
    // return postUrls
}

const saveToFile = async (list) =>{
    
    const csv = new ObjectsToCsv(list);
 
    // Save to file:
    await csv.toDisk('./post_sample.csv');
   
    // Return the CSV file as string:
    // console.log(await csv.toString());

}