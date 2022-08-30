const { scrollPageToBottom } = require('puppeteer-autoscroll-down')
const { parse } = require('node-html-parser')
const { Cluster } = require('puppeteer-cluster');

// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const prompt = require('prompt-sync')();
const ObjectsToCsv = require('objects-to-csv');

(async () => {
    const fbPage = prompt('What FaceBook Page?');
    const postCount = prompt('How Many Post?');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        // args: ['--start-maximized']
        // args: ['--start-maximized', '--proxy-server=http://smartproxy.proxycrawl.com:8012']
        args: ['--start-maximized', '--proxy-server=zproxy.lum-superproxy.io:22225']
    });
    puppeteer.use(StealthPlugin())
    
    const page = (await browser.pages())[0]
    await page.authenticate({
        username: 'lum-customer-hl_3cf9c7cc-zone-zone2',
        password: '6gk698n7nwwl'
    });
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
    // await page.goto(`https://www.facebook.com/${fbPage}/`, {waitUntil : 'domcontentloaded' }).catch(e => void 0);
    // await page.goto(`https://www.facebook.com/${fbPage}/`, {waitUntil : 'networkidle2' }).catch(e => void 0);
    // await page.goto(`https://www.facebook.com/`, {waitUntil : 'networkidle2' }).catch(e => void 0);
    
    // await login(page)
    // console.log('[+] Logged In')
    // await checkForBlocking(page)
    await page.goto(`https://www.facebook.com/OfficialMensHumor/`, {waitUntil : 'networkidle2' }).catch(e => void 0);
    await page.waitForTimeout(1000); //Random scrol delay time simulate real user

    await checkForBlocking(page)
    try {
        Number(postCount)
    } catch (error) {
        console.log('Invalid Post Count')
    }
    await scrapeArticles(page, fbPage, Number(postCount))
    
    await browser.close();
})();


const login = async (page) => {
    console.log('[+] Logging In')
    await page.waitForSelector('input[data-testid="royal_email"]')
    await page.type('input[data-testid="royal_email"]', 'johndoser92@gmail.com', {delay:100})
    await page.type('input[placeholder="Password"]', 'cJtest2202', {delay:100})
    await page.click('button[name="login"]')
    await page.waitForNavigation({waitUntil:'networkidle2'})
}

const checkForBlocking = async (page) =>{
    await page.waitForSelector('div[role="dialog"][aria-label="Not Logged In"] div:nth-last-child(2) + div  span[dir="auto"]')

    const blockingCookiePopup = await page.evaluate(()=>{
        const blocked = document.querySelector('div[aria-labelledby="jsc_c_2"][role="dialog"]')
        return blocked ? blocked : false
    })
    const blockingLoginPopup = await page.evaluate(()=>{
        // const blocked = document.querySelector('div[role="dialog"][aria-label="Not Logged In"]')
        const blocked = document.querySelector('div[role="dialog"][aria-label="Not Logged In"] div:nth-last-child(2) + div  span[dir="auto"]')
        return blocked ? blocked : false
    })
    console.log(blockingLoginPopup)
    if(blockingLoginPopup){
        console.log('blocked login')
        await page.click('div[role="dialog"][aria-label="Not Logged In"] div:nth-last-child(2) + div  span[dir="auto"]')
    }
    if (blockingCookiePopup){
        console.log('blocked cookie')
        await page.click('div[aria-labelledby="jsc_c_2"][role="dialog"] div[aria-label="Only Allow Essential Cookies"] span[dir="auto"]')
        // await page.click(blockingCookiePopup)

    }
}

async function scrapeArticles(
  page,
  fbPage,
  postCount=10,
  scrollDelay = 800,
) {
  let posts = [];
  try {
    // console.log(postCount + 2)
    // while (posts.length < (postCount + 2)) {
    while (true) {
    const content = await page.$$('div[role="main"]')
    posts = await content[1].evaluate(()=>{
        const postDivs = Array.from(document.querySelectorAll('div[role="article"][aria-posinset]:not([aria-label]):not([aria-valuetext="Loading..."])'))
        return postDivs.map(post=>({id:post.getAttribute('aria-posinset'), html:post.innerHTML}))
        // return postDivs.map(post=>{
        //     const id = post.getAttribute('aria-posinset')
        //     const html = parse(post.innerHTML)
        //     if hmtl
        // })
    })
    // posts.push(...collected_posts)
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    await page.waitForTimeout(1000 + Math.floor(Math.random() * 1000)); //Random scrol delay time simulate real user
    // // console.log(posts.length < postCount)
    process.stdout.write(`Posts Collected: ${posts.length}`);
    // console.log(posts.length)
    page.evaluate(async () => await window.scrollBy(0, 3000)) //Scrol to bottom of page    
    await checkForBlocking(page)    
    await page.waitForTimeout(1000 + Math.floor(Math.random() * 1000)); //Random scrol delay time simulate real user

    if(posts.length > (postCount + 5)){

        break
    }
    }  
    console.log('\n')
    posts.length = postCount
    // console.log(posts);
    
    await getPostUrls(page, posts)
    await activateCluster(posts)
    getPage(fbPage, posts)
    await getCaption(page, posts)
    await getComments(page, posts)
    await getShares(page, posts)
    await getReactions(page, posts)
    await getPostImg(page, posts)
    saveToFile(posts, test=false)
  } catch(e) { 
    console.log(e)
  }
}

const activateCluster = async (posts) =>{
    const cluster = await Cluster.launch( {puppeteerOptions: {
        headless: false,
        defaultViewport: null, 
    },
        puppeteer,
        // monitor:true,
        retryLimit:5,
        timeout:180000,
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 4,
    });
    cluster.on('taskerror', (err, data, willRetry) => {
        if (willRetry) {
          console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
        } else {
          console.error(`Failed to crawl ${data}: ${err.message}`);
        }
    });
    // console.log(posts.length)
    posts.forEach(post=>{
        cluster.queue(post, getTime)
    })
    await cluster.idle();
    await cluster.close();
}

const getPage = (page, articleNums) =>{
    for (const obj of articleNums){
        obj.page = page
    }
}

const getCaption = async (page, articleNums) => {
    console.log('[+] Get Caption')

    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'html'){
                const articleRoot = parse(obj[key]);
                // Caption String
                const captionText = articleRoot.querySelector('div[dir="auto"] div[dir="auto"]')?.innerText
                obj['caption'] = captionText ? captionText : null
            }
            

        }
    }
}

const getComments = async (page, articleNums) =>{
    console.log('[+] Get Comments')

    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'html'){
                const articleRoot = parse(obj[key]);
                const commentDiv = articleRoot.querySelector(' div[aria-expanded="true"] span[dir="auto"]')
                if (commentDiv === null){
                    obj['commentsNum'] = null

                }else{
                    const commentText = commentDiv.innerText
                    // Comment Number String
                    const commentNumText = commentText.split(' ')[0]
                    if(commentNumText.includes('K')){
                        if(commentNumText.includes('.')){
                            const commentNumTextSplit = commentNumText.split('.')
                            const hundredsPlace = commentNumTextSplit[1].split('K')[0]
                            const thousandsPlace = commentNumTextSplit[0]
                            const commentNum = `${thousandsPlace}${hundredsPlace}00`
                            obj['commentsNum'] = parseInt(commentNum)
                        }else{
                            const thousandsPlace = commentNumText[0]
                            const commentNum = `${thousandsPlace}000`
                            obj['commentsNum'] = parseInt(commentNum)
                        }
                    }else{
                        obj['commentsNum'] = parseInt(commentNumText)
                    }
                }
            }
            

        }
    }
}

const getShares = async (page, articleNums) => {
    console.log('[+] Get Shares')

    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'html'){
                const articleRoot = parse(obj[key]);
                const spans = articleRoot.querySelectorAll('div[role="button"][tabindex="0"] span[dir="auto"]')
                const span = spans[1]
                let shareText = span.innerText
              
                if(shareText === null){
                    console.log('null')
                    obj['sharesNum'] = null
                }else if(shareText === undefined){
                    console.log('undefined')
                    obj['sharesNum'] = undefined
                }else{
                    
                    // Share Number String
                    const shareNumText = shareText.split(' ')[0]
                    if(shareNumText.includes('K')){
                        if(shareNumText.includes('.')){
                            const shareNumTextSplit = shareNumText.split('.')
                            const hundredsPlace = shareNumTextSplit[1].split('K')[0]
                            const thousandsPlace = shareNumTextSplit[0]
                            const shareNum = `${thousandsPlace}${hundredsPlace}00`
                            obj['sharesNum'] = parseInt(shareNum)
                        }else{
                            const thousandsPlace = shareNumText[0]
                            const shareNum = `${thousandsPlace}000`
                            obj['sharesNum'] = parseInt(shareNum)
                        }
                    }else{
                        obj['sharesNum'] = parseInt(shareNumText)
                    }
                }
                }
        }
    }
}

const getReactions = async (page, articleNums) =>{
    console.log('[+] Get Reactions')

    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'html'){
                const articleRoot = parse(obj[key]);
                // const reactionsSpan = articleRoot.querySelector('span[aria-label="See who reacted to this"] + div span[aria-hidden="true"]')
                const reactionsSpan = articleRoot.querySelector('span[aria-label="See who reacted to this"] + span[aria-hidden="true"]')
                if(reactionsSpan === null){
                    obj['reactionsNum'] = null
                    
                }else{
                    const reactionsNumText = reactionsSpan.innerText
                    // Reactions String 
                    if(reactionsNumText.includes('K')){
                        if(reactionsNumText.includes('.')){
                            const reactionsNumTextSplit = reactionsNumText.split('.')
                            const hundredsPlace = reactionsNumTextSplit[1].split('K')[0]
                            const thousandsPlace = reactionsNumTextSplit[0]
                            const reactionsNum = `${thousandsPlace}${hundredsPlace}00`
                            obj['reactionsNum'] = parseInt(reactionsNum)
                        }else{
                            const thousandsPlace = reactionsNumText[0]
                            const reactionsNum = `${thousandsPlace}000`
                            obj['reactionsNum'] = parseInt(reactionsNum)
                        }
                    }else{
                        obj['reactionsNum'] = parseInt(reactionsNumText)
                    }             
                }
                }
        }
    }
    
}

const getPostImg = async (page, articleNums)=>{
    console.log('[+] Get Post Img')

    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'html'){
                const articleRoot = parse(obj[key]);
                // Img Url
                const img = articleRoot.querySelector('a[role="link"] img[referrerpolicy]')
                if(img === null){
                    obj['imgUrl'] = null
                    
                }else{
                    const imgURL = img.getAttribute('src')   
                    obj['imgUrl'] = imgURL
                }
            }
        }
    }
    
}

// And timestamp
const getTime = async ({page, data: post})=>{
    console.log('[+] Get Time')
    // for (const obj of articleNums){
        for (const key in post){
            if(key == 'postUrl'){
                if(post[key] === null){
                    post['timestamp'] = null
                }else{

                    await page.goto(post[key])
                    const unEditedTimeStamp = await page.evaluate(()=>{ //evaluate is safer due to returning undefined if selector not found
                        const abbr = document.querySelector('abbr[data-shorten]')
                        if(abbr === null){
                            return
                        }
                        return abbr.dataset.tooltipContent
                    })
                    if(unEditedTimeStamp === undefined){
                        post['timestamp'] = null
                        
                    }else{
                        const timeStamp = createDate(unEditedTimeStamp)
                        post['timestamp'] = timeStamp
                    }
                }
            }

        }
    // }
   
}

const createDate = (unEditedDateString) =>{
    const dateString = unEditedDateString.replace(' at', ',' )
    const testDate = new Date(dateString)
    // console.log(`${testDate.toLocaleString()}`)
    return testDate.toLocaleString()
}

const getPostUrls = async (page, articleNums)=>{
    console.log('[+] Get Post Urls')
    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'html'){
                const articleRoot = parse(obj[key]);
                
                try{

                    const postURL = articleRoot.querySelector('a[role="link"][aria-label]').getAttribute('href')
                }catch(error){
                    console.log(articleRoot)
                    console.log(obj['id'])
                }
                const postURL = articleRoot.querySelector('a[role="link"][aria-label]')
                
                obj['postUrl'] = postURL == null ? null : postURL.getAttribute('href')
            }
        }
    }
}

const saveToFile = async (list, test=false) =>{
    console.log('[+] Save To File')

    if(test){
        list.forEach(item => delete item['html'])
        console.log(list)
        return
    }
    list.forEach(item => delete item['html'])
    const csv = new ObjectsToCsv(list);
 
    // Save to file:
    await csv.toDisk('./10_post_2_test_24.csv');
   
    // Return the CSV file as string:
    // console.log(await csv.toString());

}
