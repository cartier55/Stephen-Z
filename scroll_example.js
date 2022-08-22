
async scrollingPosts(post_count) {
    let sevenDaysPostFetched = false; // Controls variable for page scroll loop
    let i = 0;
    let total_filtered_list = [];
    while (!sevenDaysPostFetched) { // Page scroll loop
      this.page.evaluate(async () => {
        await window.scrollBy(0, document.body.scrollHeight); //Scrol to bottom of page
      });

      await this.page.waitForTimeout(3000 + Math.floor(Math.random() * 500)); // Random wait time to seem like regular user
      const divs = await this.page.$$eval('div[role="article"]', (divs) => // Collect all article divs 
        divs.map((div) => div.innerHTML)                            // Save innerHTML of div to divs array
      );
      await this.page.$$eval('div[role="button"]', (elements) => { // Find all divs with role=button
        elements.find((e) => {                      // Find specfic div with text === See more
          if (e.textContent === "See more") {
            e.click();                          // Click on div
          }
        });
      });
      await this.page.waitForTimeout(3000 + Math.floor(Math.random() * 500)); // Random wait time
      if (divs.length < 1) {
        continue;
      }
      let is_search_finsihed = await this.checkFinishedSearch(); // Call check function to check if done grabing articles
      if (divs.length > post_count || is_search_finsihed) { // If divs is more then the number of post_count and above variable true break scroll while loop
        break;
      }
      total_filtered_list[i] = divs.length;
      if (
        total_filtered_list.length > 1 &&
        total_filtered_list[i - 1] == total_filtered_list[i]
      ) {
        sevenDaysPostFetched = true;
      }
      i++;
    }
  }

  async checkFinishedSearch() {
    let is_search_results_finish = false;
    const page_spans = await this.page.$$eval("span", (spans) =>
      spans.map((span) => {
        return { text: span.textContent };
      })
    );
    for (let i = 0; i < page_spans.length; i++) { // Loop thru page_spans
      let page_text = page_spans[i].text;     // Grab text from each span element
      if (page_text.toLowerCase() === config.page_end_msg) { // If condition to see change serach result finish variable
        is_search_results_finish = true;
        break;
      }
    }
    return is_search_results_finish;
  }
// view rawg.js hosted with ❤ by GitHub