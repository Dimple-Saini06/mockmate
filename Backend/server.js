require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const { generateFollowUp, scoreAnswer, sourceQuestionsWithAI, extractSkillsFromResume } = require('./aiHelper');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');

// multer ko memory mein file rakhne ke liye set kiya - disk pe save nahi karte,
// kyunki humein sirf text nikaalna hai, file permanently rakhni nahi hai
const upload = multer({ storage: multer.memoryStorage() });

const app = express();

// sirf apne frontend (Vite dev server) ko allow kiya hai, koi bhi website nahi -
// yeh production-style, security-conscious practice hai
app.use(cors({
  origin: "http://localhost:5173"
}));
const PORT = 3000;

app.use(express.urlencoded({ extended: true }))
app.use(express.json());

// MongoDB se connect karo
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err.message));

// Signup route - naya user banata hai
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check karo yeh email pehle se registered toh nahi hai
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // password ko hash (encrypt) karo, plain text save nahi karte
    const hashedPassword = await bcrypt.hash(password, 10);

    // naya user database mein save karo
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
});

// Login route - existing user ko verify karta hai
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // check karo yeh email exist karta hai
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // entered password ko hashed password se compare karo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // sab sahi hai - ek token banao jo login ka proof hai
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }   // 7 din ke baad token expire ho jaayega
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: { name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

const questionPath = path.join(__dirname, '..', 'data-collection', 'questions-final.json');
const questionBank = JSON.parse(fs.readFileSync(questionPath, 'utf-8'));

app.get('/', (req, res) => {
  res.send('MockMate backend is running!');
});

app.get('/api/question', (req, res) => {
  const requestedCategory = req.query.category;
  let categoriesToPickFrom;

  if (requestedCategory && questionBank[requestedCategory]) {
    categoriesToPickFrom = [requestedCategory];
  } else {
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
app.get('/api/source-questions', async (req, res) => {
  try {
    const company = req.query.company;
    const role = req.query.role;

    if (!company || !role) {
      return res.status(400).json({ message: 'company aur role dono chahiye query params mein' });
    }

    const questions = await sourceQuestionsWithAI(company, role);

    // in questions ko questionBank mein bhi daal do, taaki /api/question inhe bhi de sake
    // (memory mein hi rehta hai - server restart hone par yeh naye sourced questions gayab ho jaayenge,
    // permanent rakhne ke liye database chahiye hoga)
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

    res.json({
      company,
      role,
      count: questions.length,
      questions
    });
  } catch (error) {
    res.status(500).json({ message: 'Sourcing failed', error: error.message });
  }
});

// filler words ko count karta hai - yeh pure code hai, AI nahi (fast aur free)
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

// ab yeh route "async" hai kyunki AI calls ka wait karna padta hai
app.post('/api/submit-answer', async (req, res) => {
  const userAnswer = req.body.answer;
  const questionId = req.body.questionId;
  const questionText = req.body.question; // frontend se asli question ka text bhi aayega

  submittedAnswers.push({ questionId, answer: userAnswer, timestamp: new Date() });

  // filler words turant count kar lo - iske liye AI ki zaroorat nahi
  const fillerWordResult = countFillerWords(userAnswer);

  try {
    // dono AI calls ek saath chalao (Promise.all se dono ka wait ek saath hota hai, alag-alag nahi)
    const [followUpQuestion, scoreResult] = await Promise.all([
      generateFollowUp(questionText, userAnswer),
      scoreAnswer(questionText, userAnswer)
    ]);

    res.json({
      message: 'Answer receive ho gaya',
      receivedAnswer: userAnswer,
      followUpQuestion: followUpQuestion,
      fillerWords: fillerWordResult,
      starScore: scoreResult
    });
  } catch (error) {
    console.log('AI error:', error.message);
    res.json({
      message: 'Answer receive ho gaya (AI processing fail hua)',
      receivedAnswer: userAnswer,
      fillerWords: fillerWordResult,
      error: error.message
    });
  }
});

// resume PDF upload karta hai aur text nikaalta hai
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Koi file nahi mili' });
    }

    // req.file.buffer mein poori PDF ka raw data hai (memory storage ki wajah se)
    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    await parser.destroy();   // memory free karne ke liye

    const skills = await extractSkillsFromResume(result.text);
    
    res.json({
      message: 'Resume padh liya',
      textLength: result.text.length,
      // extractedText: result.text
      skills : skills
    });
  } catch (error) {
    res.status(500).json({ message: 'Resume padhne mein error aaya', error: error.message });
  }
});


// user ki resume skills ke hisaab se relevant questions dhoondta hai
app.post('/api/match-questions', (req, res) => {
  const { skills, difficulty } = req.body;
 
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ message: 'skills array chahiye body mein' });
  }
 
  // saare categories ke saare questions ko ek single array mein jodo
  const allQuestions = [
    ...questionBank.technical,
    ...questionBank.hr,
    ...questionBank.behavioral
  ];
 
  // har skill ko lowercase karo taaki matching case-insensitive ho
  const lowerSkills = skills.map(s => s.toLowerCase());
 
  // sirf wahi questions rakho jinke text mein koi skill mention ho
  const matchedQuestions = allQuestions.filter(q => {
    const questionLower = q.question.toLowerCase();
    return lowerSkills.some(skill => questionLower.includes(skill));
  });
 
  // agar difficulty diya gaya hai, aur question mein difficulty field hai
  // (sourced questions mein hoti hai, purane scraped questions mein nahi),
  // usse bhi filter karo
  if (difficulty) {
    const difficultyFiltered = matchedQuestions.filter(q => q.difficulty === difficulty);
    // agar difficulty filter se kuch questions bache, wahi do
    // warna sab matched questions hi de do (taaki khali result na aaye)
    if (difficultyFiltered.length > 0) {
      matchedQuestions = difficultyFiltered;
    }
  }

  res.json({
    totalQuestions: allQuestions.length,
    matchedCount: matchedQuestions.length,
    difficulty: difficulty || 'any',
    questions: matchedQuestions
  });
});


app.get('/api/answers', (req, res) => {
  res.json(submittedAnswers);
});

app.listen(PORT, () => {
  console.log(`Server chal raha hai: http://localhost:${PORT}`)
})
