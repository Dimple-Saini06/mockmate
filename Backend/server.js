const express = require("express");
const path = require('path');
const fs = require('fs');

const app = express();
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

  console.log(requestedCategory);
  
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

const submittedAnswers = [];
app.post('/api/submit-answer', (req, res) => {
  console.log(req.body);
  const userAnswer = req.body.answer;      // user ka answer text
  const questionId = req.body.questionId;  // kaunse question ka jawab hai

    // answer ko array mein save karo
  submittedAnswers.push({ questionId, answer: userAnswer, timestamp: new Date() });

  res.json({
    message: 'Answer receive ho gaya',
    receivedAnswer: userAnswer,
  });
});

// naya route - saare submitted answers dekhne ke liye (testing ke liye)
app.get('/api/answers', (req, res) => {
  // console.log("'/api/answers api call!");
  res.json(submittedAnswers);
});


app.listen(PORT, () => {
  console.log(`Server chal raha hai: http://localhost:${PORT}`)
})