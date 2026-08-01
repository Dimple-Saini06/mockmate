const fs = require('fs');
const path = require('path');
 
const inputPath = path.join(__dirname, 'scraped-articles.json');
const scrapedData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
 
// text ko clean karta hai - jahan words bina space ke chipke hain, wahan space daalta hai
function cleanText(text) {
  text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
  text = text.replace(/([^\s])(What|Why|When|Where|Who|How|Are|Is|Can|Could|Do|Does|Did|Have|Has|Will|Would|Which)/g, '$1 $2');
  return text;
}
 
function extractQuotedQuestions(text) {
  const regex = /"([^"]*\?)"/g;
  const matches = [...text.matchAll(regex)];
  return matches.map(m => m[1].trim());
}
 
function extractPlainQuestions(text) {
  const sentences = text.split(/(?<=[.?!])\s*(?=[A-Z0-9])/);
  return sentences
    .map(s => s.trim())
    .filter(s => {
      const endsWithQuestionMark = s.endsWith('?');
      const reasonableLength = s.length > 15 && s.length < 200;
      const notTooManySentences = (s.match(/\?/g) || []).length === 1;
      return endsWithQuestionMark && reasonableLength && notTooManySentences;
    });
}
 
function extractQuestionsFromArticles(scrapedData) {
  const allQuestions = [];
 
  scrapedData.forEach(article => {
    if (!article.success || !article.content) return;
 
    const cleanedContent = cleanText(article.content);
 
    const quotedQuestions = extractQuotedQuestions(cleanedContent);
    const plainQuestions = extractPlainQuestions(cleanedContent);
 
    const combined = [...quotedQuestions, ...plainQuestions];
 
    combined.forEach(q => {
      allQuestions.push({
        question: q,
        source: article.url
      });
    });
  });
 
  const uniqueQuestions = [];
  const seen = new Set();
  allQuestions.forEach(item => {
    const key = item.question.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueQuestions.push(item);
    }
  });
 
  return uniqueQuestions;
}
 
const extractedQuestions = extractQuestionsFromArticles(scrapedData);
 
console.log('Total unique questions mile:', extractedQuestions.length);
console.log('----------------------------------------');
extractedQuestions.forEach((q, i) => {
  console.log(`${i + 1}. ${q.question}`);
});
 
const outputPath = path.join(__dirname, 'extracted-questions.json');
fs.writeFileSync(outputPath, JSON.stringify(extractedQuestions, null, 2));
console.log('----------------------------------------');
console.log('Saved to', outputPath);