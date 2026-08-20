[text](README.md)# MockMate — AI Mock Interview Simulator

AI-powered mock interview simulator with voice-based practice, real interview data, and instant feedback on clarity, filler words, and answer structure.

## Why This Project

Most mock interview tools ask generic questions and give generic AI feedback. MockMate is different — it's grounded in **real interview experiences** scraped from GeeksforGeeks, so the questions reflect what actually happens in real interviews, not AI guesses.

## Current Status: In Progress

- [x] **Day 1** — Basic question bank + test pipeline
- [x] **Day 2** — Working scraper for a single article
- [x] **Day 3** — Automated article link extraction from listing page
- [x] **Day 4** — Scraper loop across all 15 articles with polite rate-limiting
- [x] **Day 5** — Real question extraction from scraped content (49 questions)
- [x] **Day 6** — Text cleaning and categorization (technical / HR / behavioral)
- [x] **Day 7** — Express backend, GET /api/question endpoint
- [x] **Day 8** — POST endpoint to receive and store user answers
- [x] **Day 9** — AI integration (Google Gemini API) for dynamic follow-up questions
- [x] **Day 10** — Answer scoring: filler word detection and STAR structure analysis
- [x] **Day 11** — React frontend with question flow, answer submission, and AI feedback display
- [x] **Day 12** — Voice integration: AI reads questions aloud, speech-to-text for answers
- [x] **Day 13** — Audio recording playback so users can hear their own answers back
- [x] **Day 14** — MongoDB Atlas integration (users collection)
- [x] **Day 15** — Signup route with bcrypt password hashing
- [x] **Day 16** — Login route with JWT authentication
- [x] **Day 17** — Signup/Login UI (React)
- [x] **Day 18** — Full auth flow connected end-to-end, persistent login via localStorage
- [x] **Day 19** — Light/dark theme toggle
- [ ] Next — AI-driven multi-source question sourcing (Google Search grounding), resume-based question matching, interview  difficulty levels, timed camera-recorded interview rounds

## Tech Stack

- **Frontend:** React(Vite), Web Speech API(speech synthesis + recognition), MediaRecorder API
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas (Mongoose)
- **Auth:** JWT (jsonwebtoken), bcrypt for password hashing
- **Data Collection:** Axios, Cheerio, regex-based text extraction
- **AI:** Google Gemini API for follow-up question generation and STAR-method answer scoring


## Project Structure

```
mockmate/
  data-collection/
    checkListing.js         # extracts article links from the listing page
    dataCollector.js        # scrapes all articles' full page text
    extractQuestions.js     # extracts and cleans real questions from scraped text
    categorize.js           # splits questions into technical / hr / behavioral
    scraped-articles.json   # raw scraped data
    questions-final.json    # final categorized question bank (used by backend)
  Backend/
    server.js               # Express server with question, answer, AI scoring, and auth routes
    aiHelper.js              # Gemini API calls for follow-up questions and STAR scoring
    models/
      User.js                 # Mongoose schema for signup/login
    .env                     # GEMINI_API_KEY, MONGODB_URI, JWT_SECRET (not committed)
  frontend/
    src/
      App.jsx                # main UI: question flow, voice controls, feedback display, theme
      App.css                # design system (colors, typography, layout, light/dark themes)
      Auth.jsx                # signup/login form
      Auth.css                # auth page styling
    index.html
  README.md
```

## How the Scraper Works

GeeksforGeeks blocks bot-like requests without a browser User-Agent header. Article content also isn't in a simple meta field — it's rendered in the page's visible HTML (headings and list items), so the scraper extracts full page text via Cheerio rather than relying on a short JSON summary field. Extracted text is cleaned (spacing fixes) before real questions are pulled out using pattern matching.

## How AI Scoring Works

When a user submits an answer, the backend runs two things in parallel:
- A rule-based filler-word counter (pure JavaScript, no AI) that detects words like "um", "like", "basically"
- A Gemini API call that checks whether the answer follows the STAR method (Situation, Task, Action, Result), gives a clarity score out of 10, and returns one specific, actionable piece of feedback

Combining a deterministic, explainable check (filler words) with an AI-based check (STAR structure) keeps the scoring transparent rather than a single opaque AI judgment.

## How Authentication Works

Signup and login are handled with a standard JWT flow: passwords are hashed with bcrypt before being stored (never in plain text), and a successful login issues a signed JWT token. The frontend stores the token and user info in localStorage, so a logged-in session persists across page refreshes without needing to log in again. The database (MongoDB Atlas) is cloud-hosted rather than local specifically so the backend can be deployed later without losing database access.

## How Voice Practice Works

The frontend uses the browser's Web Speech API to make practice feel closer to a real interview:

- Speech synthesis reads each question aloud when it loads
- Speech recognition transcribes the user's spoken answer live into the answer box (toggled manually via a mic button)
- MediaRecorder separately records the raw audio, so users can play back their own answer afterward — useful for noticing nervousness, pacing, and tone, not just word choice

Voice input is optional; typing works the same way if the browser doesn't support these APIs (a warning is shown in that case).


## API Endpoints

```
GET  /                      Health check
POST /api/signup            Create a new account (password hashed with bcrypt)
POST /api/login             Log in, returns a JWT token (7-day expiry)
GET  /api/question          Random question (optionally ?category=technical|hr|behavioral)
GET  /api/questions         All questions
POST /api/submit-answer     Submit an answer; returns an AI follow-up question,
                             filler-word count, and STAR-method scoring with feedback
GET  /api/answers           View all submitted answers (for testing)
```

## Setup

```bash
git clone <this-repo-url>
cd mockmate

cd data-collection
npm install axios cheerio
node dataCollector.js
node extractQuestions.js
node categorize.js

cd ../Backend
npm install express dotenv mongoose bcrypt jsonwebtoken
# add your free Gemini API key (from aistudio.google.com) to a .env file:
# GEMINI_API_KEY=your_key_here          //(from aistudio.google.com)
# MONGODB_URI=your_atlas_connection_string
# JWT_SECRET=any_random_long_string
node server.js

# in a separate terminal:
cd ../frontend
npm install
npm run dev
```

## Roadmap

Remaining work: persistent storage (MongoDB) for answers and session history, deployment (frontend + backend), and collecting real user feedback (filler-word reduction over multiple sessions) as proof of impact.

## Author

A self-initiated project built during college to learn and demonstrate full-stack development, web scraping, and AI integration — and to prepare for technical interviews.
