const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
 
const { getArticleLinks } = require('./checkListingLinks');
 
// ek article ka POORA visible text nikaalta hai (JSON field ki jagah, seedha page text se)
async function scrapeOneArticle(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
 
    const $ = cheerio.load(response.data);
 
    // script aur style tags hata do - inka content humein nahi chahiye (JS code, CSS)
    $('script, style').remove();
 
    // poore page ka visible text nikaalo (headings, list items, paragraphs - sab kuch)
    let fullText = $('body').text().replace(/\s+/g, ' ').trim();
 
    // jab do words bina space ke chipak jaate hain (jaise "ApexWhat"),
    // wahan ek space daal do - lowercase ke turant baad uppercase letter dhoondke
    fullText = fullText.replace(/([a-z])([A-Z])/g, '$1 $2');
 
    // agar koi common question-word (What, Why, When, etc.) bina space ke chipka ho,
    // uske pehle bhi space daal do
    fullText = fullText.replace(/([^\s])(What|Why|When|Where|Who|How|Are|Is|Can|Could|Do|Does|Did|Have|Has|Will|Would|Which)/g, '$1 $2');
 
    return { url: url, content: fullText, success: true };
  } catch (error) {
    return { url: url, content: null, success: false, error: error.message };
  }
}
 
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
 
async function collectInterviewQuestions() {
  console.log('Listing page se links nikal rahe hain...');
  const articleLinks = await getArticleLinks();
  console.log(`${articleLinks.length} article links mile. Ab scraping shuru...`);
  console.log('----------------------------------------');
 
  const results = [];
 
  for (let i = 0; i < articleLinks.length; i++) {
    const url = articleLinks[i];
    console.log(`Scraping ${i + 1}/${articleLinks.length}: ${url}`);
 
    const result = await scrapeOneArticle(url);
    results.push(result);
 
    console.log(result.success ? `  Success (length: ${result.content.length})` : '  Failed');
 
    await wait(1500);
  }
 
  const outputPath = path.join(__dirname, 'scraped-articles.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
 
  const successCount = results.filter(r => r.success).length;
  console.log('----------------------------------------');
  console.log(`Total: ${results.length}, Success: ${successCount}, Failed: ${results.length - successCount}`);
  console.log('Data saved to', outputPath);
}
 
collectInterviewQuestions();