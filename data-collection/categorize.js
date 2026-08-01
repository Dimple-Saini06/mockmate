const fs = require('fs');
const path = require('path');
 
const inputPath = path.join(__dirname, 'extracted-questions.json');
const questions = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
 
// har category ke liye keywords - agar question mein yeh words hon, wahi category milegi
const hrKeywords = ['why do you want', 'hobbies', 'relocate', 'preferred location', 'where are you from',
                     'founder', 'ceo of', 'salary', 'notice period', 'join', 'interviews with any other'];
 
const behavioralKeywords = ['tell me about', 'challenge', 'projects have you worked', 'handle tight',
                             'deadlines', 'difficult situation', 'walk me through', 'inspired you',
                             'technologies are you most comfortable', 'interested in'];
 
function categorize(question) {
  const lower = question.toLowerCase();
 
  if (hrKeywords.some(kw => lower.includes(kw))) {
    return 'hr';
  }
  if (behavioralKeywords.some(kw => lower.includes(kw))) {
    return 'behavioral';
  }
  // baaki sab technical maan lo (default)
  return 'technical';
}
 
const categorized = questions.map((q, i) => ({
  id: i + 1,
  question: q.question,
  category: categorize(q.question)
}));
 
// category ke hisaab se group karo (jaisa original questions.json format tha)
const grouped = { technical: [], hr: [], behavioral: [] };
categorized.forEach(q => grouped[q.category].push(q));
 
const outputPath = path.join(__dirname, 'questions-final.json');
fs.writeFileSync(outputPath, JSON.stringify(grouped, null, 2));
 
console.log('Technical:', grouped.technical.length);
console.log('HR:', grouped.hr.length);
console.log('Behavioral:', grouped.behavioral.length);
console.log('----------------------------------------');
console.log('HR questions:');
grouped.hr.forEach(q => console.log(' -', q.question));
console.log('Behavioral questions:');
grouped.behavioral.forEach(q => console.log(' -', q.question));