const axios = require('axios');
const cheerio = require('cheerio');
 
const listingUrl = 'https://www.geeksforgeeks.org/category/experiences/interview-experiences/';
 
// listing page se saare real article links nikaalta hai
async function getArticleLinks() {
  const response = await axios.get(listingUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
 
  const $ = cheerio.load(response.data);
  const allLinks = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href) {
      allLinks.push(href);
    }
  });
 
  // sirf real article links rakho, category pages hata do
  const articleLinks = allLinks.filter(link => {
    return link.includes('/interview-experiences/') && !link.includes('/category/');
  });
 
  // duplicates hata do
  return [...new Set(articleLinks)];
}
 
// is function ko doosri file (dataCollector.js) mein use karne ke liye export kar rahe hain
module.exports = { getArticleLinks };
 