require("dotenv").config();
console.log('Key loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');

const express = require("express");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const { generateFollowUp, scoreAnswer  } = require('./aiHelper');


const app = express();

// sirf apne frontend (Vite dev server) ko allow kiya hai, koi bhi website nahi -
// yeh production-style, security-conscious practice hai
app.use(cors({
  origin: "http://localhost:5173"
}));

const PORT = 3000;

app.use(express.urlencoded({ extended: true }))
app.use(express.json());

const questionPath = path.join(__dirname, '..', 'data-collection', 'questions-final.json');
const questionBank = JSON.parse(fs.readFileSync(questionPath, 'utf-8'));

app.get('/', (req, res) => {
  res.send('MockMate backend is running!');
});

app.get('/api/question', (req, res) => {
  const requestedCategory = req.query.category;

  console.log("requestedCategory : ",requestedCategory);

  let categoriesToPickFrom;

  if (requestedCategory && questionBank[requestedCategory]) {
    console.log("if [requestedCategory] : ", [requestedCategory]);
    categoriesToPickFrom = [requestedCategory];
  } else {
    console.log("else [requestedCategory] : ", Object.keys(questionBank));
    categoriesToPickFrom = Object.keys(questionBank);
  }

  const randomCategory = categoriesToPickFrom[Math.floor(Math.random() * categoriesToPickFrom.length)];
  const questionsInCategory = questionBank[randomCategory];
  const randomQuestion = questionsInCategory[Math.floor(Math.random() * questionsInCategory.length)];

  res.json(randomQuestion);
});

app.get('/api/questions', (req, res) => {
  res.json(questionBank);
});


function countFillerWords(text) {
  const fillerWords = ['um', 'uh', 'like', 'basically', 'actually', 'matlab', 'you know', 'kind of', 'sort of'];
  const lowerText = text.toLowerCase();
 
  let totalCount = 0;
  const breakdown = {};
 
  fillerWords.forEach(word => {
    // word boundary regex banate hain - \b matlab "poora word match karo, beech mein se nahi"
    const escapedWord = word.replace(/ /g, '\\s+');
    const regex = new RegExp('\\b' + escapedWord + '\\b', 'g');
    const matches = lowerText.match(regex);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      breakdown[word] = count;
      totalCount += count;
    }
  });
 
  return { totalCount, breakdown };
}


const submittedAnswers = [];

app.post('/api/submit-answer', async (req, res) => {
  console.log("/api/submit-answer : ", req.body);
  const userAnswer = req.body.answer;      // user ka answer text
  const questionId = req.body.questionId;  // kaunse question ka jawab hai
  const questionText = req.body.question; // frontend se asli question ka text bhi aayega

  // answer ko array mein save karo
  submittedAnswers.push({ questionId, answer: userAnswer, timestamp: new Date() });

  const fillerWordResult = countFillerWords(userAnswer);

  try {
    // google ai studio api ko call karo, follow-up question generate karne ke liye
    const [ followUpQuestion, scoreResult ] = await Promise.all([
      generateFollowUp(questionText, userAnswer),
      scoreAnswer(questionBank, userAnswer)
    ]);

    res.json({
      message: 'Answer receive ho gaya',
      receivedAnswer: userAnswer,
      followUpQuestion: followUpQuestion,
      fillerWords : fillerWordResult,
      starScore : scoreResult
    });
  } catch (error) {
    console.log('AI error:', error.message);
    res.json({
      message: 'Answer receive ho gaya (AI follow-up fail hua)',
      receivedAnswer: userAnswer,
      fillerWords : fillerWordResult,
      error: error.message
    });
  }
});

// naya route - saare submitted answers dekhne ke liye (testing ke liye)
app.get('/api/answers', (req, res) => {
  // console.log("'/api/answers api call!");
  res.json(submittedAnswers);
});


app.listen(PORT, () => {
  console.log(`Server chal raha hai: http://localhost:${PORT}`)
})