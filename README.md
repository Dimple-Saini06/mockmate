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
- [ ] Next — Database integration, deployment, and proof-of-impact testing with real users

## Tech Stack

- **Backend:** Node.js, Express
- **Data Collection:** Axios, Cheerio, regex-based text extraction
- **Frontend:** React(Vite), Web Speech API(speech synthesis + recognition), MediaRecorder API
- **AI:** Google Gemini API for follow-up question generation and STAR-method answer scoring
- **Database (planned):** MongoDB

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
    server.js               # Express server with question and answer routes
    aiHelper.js              # Gemini API calls for follow-up questions and STAR scoring
    .env                     # GEMINI_API_KEY (not committed)
  frontend/
    src/
      App.jsx                # main UI: question flow, voice controls, feedback display
      App.css                # design system (colors, typography, layout)
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

## How Voice Practice Works

The frontend uses the browser's Web Speech API to make practice feel closer to a real interview:

- Speech synthesis reads each question aloud when it loads
- Speech recognition transcribes the user's spoken answer live into the answer box (toggled manually via a mic button)
- MediaRecorder separately records the raw audio, so users can play back their own answer afterward — useful for noticing nervousness, pacing, and tone, not just word choice

Voice input is optional; typing works the same way if the browser doesn't support these APIs (a warning is shown in that case).


## API Endpoints

```
GET  /                     Health check
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
npm install express dotenv
# add your free Gemini API key (from aistudio.google.com) to a .env file:
# GEMINI_API_KEY=your_key_here
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
