require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Question = require("./models/Question");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const { generateFollowUp, scoreAnswer, sourceQuestionsWithAI } = require('./aiHelper');

const app = express();

// sirf apne frontend (Vite dev server) ko allow kiya hai, koi bhi website nahi -
// yeh production-style, security-conscious practice hai
app.use(cors({
  origin: "http://localhost:5173"
}));

const PORT = 3000;

app.use(express.urlencoded({ extended: true }))
app.use(express.json());


//DB WORK
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err.message));


// Signup route
app.post('/api/signup', async(req,res)=>{
  try{
    const{name, email, password} = req.body;
    let existingMail = await User.findOne({ email });

    if(existingMail){
      return res.status(400).json({ message: 'Email already registered' });
    }

    // password ko hash (encrypt) karo, plain text save nahi karte
    const hashedPswd = await bcrypt.hash(password, 10);
    const newUser = new User({
      name, 
      email, 
      password : hashedPswd
    });

    await newUser.save();
    
    res.status(201).json({ message: 'Signup successful' });

  }catch(error){
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
});


// Login route
app.post("/api/login", async(req,res)=>{
  try {
    const{ email, password } = req.body;
    const user = await User.findOne({email});
    console.log(user);
    if(!user){
      return res.status(400).json({ message : 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.status(400).json({ message : 'Invalid email or password' });
    }

    // sab sahi hai - ek token banao jo login ka proof hai
    const token = jwt.sign(
      { userId : user._id },
      process.env.JWT_SECRET,
      {expiresIn : '7d'} //expires after 7days
    );

    res.json({
      message : "Login successful",
      token : token,
      user : {name : user.name, email : user.email}
    });
  }catch(e){
    res.status(500).json({ message : 'Login Failed', e : e.message});
  }
});



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

// AI-driven question sourcing - Tavily se search, Groq se extract, source link ke saath
app.get("/api/source-questions", async(req, res)=>{
  try{
    const company = req.query.company;
    const role = req.query.role;

    if(!company || !role){
      return res.status(400).json({ message : 'company aur role dono chahiye query params mein' });
    }

    const questions = await sourceQuestionsWithAI(company, role);
    // in questions ko questionBank mein bhi daal do, taaki /api/question inhe bhi de sake
    questions.forEach((q, i) => {
      const newQuestion = {
        id: `sourced-${company}-${Date.now()}-${i}`,
        question: q.question,
        company: company,
        difficulty: q.difficulty,
        sourceUrl: q.sourceUrl
      };
      questionBank.technical.push(newQuestion);
    });
    res.json( {
      company, 
      role,
      count : questions.length,
      questions
    });
  }catch(error){
    res.status(500).json({ message : 'Sourcing failed', error: error.message })
  }
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
      scoreAnswer(questionText, userAnswer)
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