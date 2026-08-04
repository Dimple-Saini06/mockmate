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
- [ ] Day 11 onward — Voice input/output, React frontend (see `MockMate-Checklist.md` for full roadmap)

## Tech Stack

- **Backend:** Node.js, Express
- **Data Collection:** Axios, Cheerio, regex-based text extraction
- **Frontend (planned):** React, Web Speech API
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
  README.md
  MockMate-Checklist.md     # full day-by-day build plan and progress
```

## How the Scraper Works

GeeksforGeeks blocks bot-like requests without a browser User-Agent header. Article content also isn't in a simple meta field — it's rendered in the page's visible HTML (headings and list items), so the scraper extracts full page text via Cheerio rather than relying on a short JSON summary field. Extracted text is cleaned (spacing fixes) before real questions are pulled out using pattern matching.

## How AI Scoring Works

When a user submits an answer, the backend runs two things in parallel:
- A rule-based filler-word counter (pure JavaScript, no AI) that detects words like "um", "like", "basically"
- A Gemini API call that checks whether the answer follows the STAR method (Situation, Task, Action, Result), gives a clarity score out of 10, and returns one specific, actionable piece of feedback

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
node server.js
```

## Roadmap

See `MockMate-Checklist.md` for the full day-by-day build plan, from data collection through backend, AI integration, voice features, and proof-of-impact testing.

## Author

A self-initiated project built during college to learn and demonstrate full-stack development, web scraping, and AI integration — and to prepare for technical interviews.
