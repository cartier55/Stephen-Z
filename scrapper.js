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
        args: ['--start-maximized']
        // args: ['--start-maximized', '--proxy-server=http://142.11.247.191:3128']
    });
    puppeteer.use(StealthPlugin())

    const page = (await browser.pages())[0]
    // const page = await browser.newPage();
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
    await page.goto(`https://www.facebook.com/`, {waitUntil : 'networkidle2' }).catch(e => void 0);
    // await page.goto('https://bot.sannysoft.com')
    // await page.waitForTimeout(5000)
    
    await login(page)
    console.log('[+] Logged In')
    await page.goto(`https://www.facebook.com/OfficialMensHumor/`, {waitUntil : 'networkidle2' }).catch(e => void 0);
    await scrapeArticles(page, fbPage)
    
    await browser.close();
    // await cluster.idle();
    // await cluster.close();
})();


const login = async (page) => {
    console.log('[+] Logging In')
    // await page.type('input[placeholder="Email or phone number"]', 'johndoser92@gmail.com', {delay:100})
    await page.waitForSelector('input[placeholder="Email or phone number"]')
    await page.type('input[placeholder="Email or phone number"]', 'doserj62@gmail.com', {delay:100})
    await page.type('input[placeholder="Password"]', 'cJtest2202', {delay:100})
    await page.click('button[name="login"]')
    await page.waitForNavigation({waitUntil:'networkidle2'})
    await page.screenshot({                      // Screenshot the website using defined options
 
        path: "./screenshot.png",                   // Save the screenshot in current directory
     
        fullPage: true                              // take a fullpage screenshot
     
      });
    // await page.goto()
}

async function scrapeArticles(
  page,
  fbPage,
  postCount=30,
  scrollDelay = 800,
) {
  let post = [];
  try {
    while (post.length < postCount) {
    const content = await page.$$('div[role="main"]')
    post = await content[1].evaluate(()=>{
        const postDivs = Array.from(document.querySelectorAll('div[role="article"]:not([aria-label])'))
        return postDivs.map(post=>({id:post.getAttribute('aria-posinset'), html:post.innerHTML}))
    })

    
    console.log(post.length)   
    
    page.evaluate(async () => await window.scrollBy(0, 3000)) //Scrol to bottom of page        
    // await page.waitForTimeout(500);
    await page.waitForTimeout(1000 + Math.floor(Math.random() * 1000));


    
    
    }  
    console.log(1)
    post.length = postCount
    await getPostUrls(page, post)
    // for(const obj of post){
    //     for(const key in obj){
    //         if(key=='postUrl'){
    activateCluster(post)
    //         }

    //     }
    // }
    // await timeBrowser(post)
    getPage(fbPage, post)
    await getCaption(page, post)
    await getComments(page, post)
    await getShares(page, post)
    await getReactions(page, post)
    await getPostImg(page, post)
    // await getTime(page, post) // Change to datetime obj for easy exel parseing
    saveToFile(post, test=false)
  } catch(e) { 
    console.log(e)
  }
}

const activateCluster = async (posts) =>{
    const cluster = await Cluster.launch( {puppeteerOptions: {
        headless: false,
        defaultViewport: null, 
    },
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
    });
    cluster.queue(posts, getTime)
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
                        obj['commentsNum'] = commentNumText.split('K')[0]
                    }else{
                        obj['commentsNum'] = commentNumText
                    }
                }
            }
            

        }
    }
    // console.log(articleNums)
}

const getShares = async (page, articleNums) => {
    console.log('[+] Get Shares')

    for (const obj of articleNums){
        for(const key in obj){
            if(key == 'html'){
                const articleRoot = parse(obj[key]);
                // Search dom for span including text
                const spans = articleRoot.querySelectorAll('div[role="button"][tabindex="0"] span[dir="auto"]')
                const span = spans[1]
                let shareText = span.innerText
                // spans.forEach((span)=>{
                //     const spanText = span.innerText
                //     // console.log(spanText)
                //     if(spanText.includes('Shares')){
                //         console.log('found')
                //         shareText = spanText
                //     }
                // })
                // console.log('---------')
                if(shareText === null){
                    console.log('null')
                    obj['sharesNum'] = null
                }else if(shareText === undefined){
                    console.log('undefined')
                    obj['sharesNum'] = undefined
                }else{
                    // console.log('else')
                    
                    // Share Number String
                    const shareNumText = shareText.split(' ')[0]
                    if(shareNumText.includes('K')){
                        obj['sharesNum'] = shareNumText.split('K')[0]
                    }else{
                        obj['sharesNum'] = shareNumText
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
                // const reactionsSpan = articleRoot.querySelector('span[aria-label="See who reacted to this"] + span[aria-hidden="true"]')
                const reactionsSpan = articleRoot.querySelector('span[aria-label="See who reacted to this"] + div span[aria-hidden="true"]')
                if(reactionsSpan === null){
                    obj['reactionsNum'] = null
                    
                }else{
                    const reactionsText = reactionsSpan.innerText
                    // Reactions String 
                    if(reactionsText.includes('K')){
                        obj['reactionsNum'] = reactionsText.split('K')[0]
                    }else{
                        obj['reactionsNum'] = reactionsText
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
const getTime = async ({page, data: articleNums})=>{
    console.log('[+] Get Time')
    for (const obj of articleNums){
        for (const key in obj){
            if(key == 'postUrl'){
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
                if(obj[key] === null){
                    obj['timestamp'] = null
                }else{

                    await page.goto(obj[key])
                    // const unEditedTimeStamp = await page.$eval('abbr[data-shorten]', abbr=>abbr.dataset.tooltipContent)
                    const unEditedTimeStamp = await page.evaluate(()=>{
                        const abbr = document.querySelector('abbr[data-shorten]')
                        if(abbr === null){
                            return
                        }
                        return abbr.dataset.tooltipContent
                    })
                    if(unEditedTimeStamp === undefined){
                        obj['timestamp'] = null
                        
                    }else{
                        const timeStamp = createDate(unEditedTimeStamp)
                        obj['timestamp'] = timeStamp
                    }
                }
            }

        }
    }
   
}

const createDate = (unEditedDateString) =>{
    const dateString = unEditedDateString.replace(' at', ',' )
    const testDate = new Date(dateString)
    console.log(`${testDate.toLocaleString()}`)
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
                }
                const postURL = articleRoot.querySelector('a[role="link"][aria-label]')
                // console.log(postURL);
                
                obj['postUrl'] = postURL == null ? null : postURL.getAttribute('href')
            }
        }
    }
    // console.log(articleNums)

    // let postUrls = []
    // for (const postId in articleNums){
    //     const article = await page.waitForSelector(`div[aria-posinset="${postId}"]`)
    //     const postURLHandle = await article.$('a[role="link"][aria-label]')
    //     const postURL = await (await postURLHandle.getProperty('href')).jsonValue()
    //     postUrls.push(postURL)
    // }
    // return postUrls
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
    await csv.toDisk('./30_stealth_test_post.csv');
   
    // Return the CSV file as string:
    // console.log(await csv.toString());

}

const timeBrowser =  async (posts) =>{
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();

    for (const obj of posts){
        for (const key in obj){
            if(key=='postUrl'){
                page.goto(obj[key], {waitUntil : 'networkidle2' }).catch(e => void 0)
                const unEditedTimeStamp = await page.evaluate(()=>{
                    const abbr = document.querySelector('abbr[data-shorten]')
                    if(abbr === null){
                        return
                    }
                    return abbr.dataset.tooltipContent
                })
                if(unEditedTimeStamp === undefined){
                    obj['timestamp'] = null
                    
                }else{
                    const timeStamp = createDate(unEditedTimeStamp)
                    obj['timestamp'] = timeStamp
                }
                // const unEditedTimeStamp = await page.$eval('abbr[data-shorten]', abbr=>abbr.dataset.tooltipContent)
                // const timeStamp = createDate(unEditedTimeStamp)
                // obj['timestamp'] = timeStamp
            }
        }
    }
    // console.log('TimeStamps')
    // console.log(posts)
}