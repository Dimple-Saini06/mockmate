# MockMate — AI Handoff Briefing

Paste this entire document into a new AI chat (along with relevant code files) to continue this project. The person you're helping is a college fresher building this for placements, with limited coding background — explain things simply, in plain language, and confirm before making large changes.

## Project Summary

MockMate is an AI-powered mock interview simulator (React frontend, Node.js/Express backend, MongoDB database). It scrapes/sources real interview questions, lets users practice via text or voice, and gives AI-driven feedback (follow-up questions, STAR-method scoring, filler-word detection).

## Tech Stack

- **Frontend:** React (Vite), Web Speech API (speech synthesis + recognition), MediaRecorder API
- **Backend:** Node.js, Express
- **Auth:** JWT (jsonwebtoken), bcrypt for password hashing
- **Database:** MongoDB Atlas (Mongoose) — cloud-hosted, not local, specifically so a future deployed backend can still reach it
- **AI:** Groq (OpenAI-compatible chat completions API) — NOT Gemini. Gemini was originally used but abandoned after Google's API key format change (`AIzaSy` → `AQ.` prefix) broke authentication; this is a known issue affecting many developers, not a bug in this project's code.
- **Search:** Tavily (a search API built for AI agents) — used alongside Groq for AI-driven question sourcing, since Groq has no built-in web search (unlike Gemini's grounding feature, which was the original plan)
- **Data Collection (legacy, Phase 1):** Axios, Cheerio — a hand-built scraper for GeeksforGeeks specifically, producing the original 49-question bank

## Current Project Structure

```
mockmate/
  data-collection/
    checkListing.js, dataCollector.js, extractQuestions.js, categorize.js
    scraped-articles.json, questions-final.json   (original 49-question bank, currently what the live app serves)
  Backend/
    server.js          — all routes: questions, answers, auth, AI sourcing
    aiHelper.js         — ALL AI/external API calls live here (generateFollowUp, scoreAnswer, searchTavily, sourceQuestionsWithAI) — intentionally centralized so swapping AI providers only requires editing this one file
    models/User.js      — Mongoose schema for auth
    .env                — GEMINI_API_KEY (unused now), GROQ_API_KEY, TAVILY_API_KEY, MONGODB_URI, JWT_SECRET (never share actual values)
  frontend/
    src/
      App.jsx            — main app: question flow, voice, theme toggle, logout
      App.css            — design system (CSS variables for dark/light theme)
      Auth.jsx, Auth.css  — signup/login UI
      main.jsx
  README.md, MockMate-Journal.md, MockMate-v2-Tracker.md
```

## Status: What's Fully Working

- Data collection pipeline (scraping, extraction, categorization) — Phase 1 of original build
- Backend REST API — questions, answer submission, auth (signup/login/JWT)
- AI feedback — follow-up questions + STAR scoring via Groq
- Frontend — React UI with custom design (dark/light theme), voice input/output, audio recording playback
- Authentication — full signup/login flow, persistent sessions via localStorage
- **Phase 2 (AI-driven question sourcing) — COMPLETE.** `/api/source-questions?company=X&role=Y` searches the live web via Tavily, extracts structured questions with real source URLs and difficulty tags via Groq, and merges results into the live `questionBank` so `/api/question` can serve them. Limitation: this merge is memory-only and resets on server restart — not yet persisted to MongoDB.

## What's Next (in order)

1. Persist AI-sourced questions to MongoDB (currently memory-only, lost on restart) — likely a `Question` collection instead of/alongside `questions-final.json`
2. Let the frontend actually trigger sourcing (e.g. a "search for [company] questions" input) rather than only via Hoppscotch/API calls
3. Resume upload — parse a PDF resume, extract skills via AI, match to relevant questions
4. Interview difficulty levels (basic/intermediate/senior) as a user-facing filter (the data already has a `difficulty` field on sourced questions — needs a UI filter and applying it to the original 49 scraped questions too)
5. Practice/familiarization mode before a "real" timed session
6. Timed interview rounds with camera on/off + video recording (full session + per-question)
7. Aggregated end-of-session feedback, session history, PDF export, "readiness score" trend

See `MockMate-v2-Tracker.md` for the full day-by-day checklist and `MockMate-Journal.md` for detailed history of what was built, what broke, and why — read both before making changes, they contain important context (e.g. why Gemini was dropped, why `.env` values must never include quotes, common bugs already hit and fixed).

## Working Style Notes for Whichever AI Picks This Up

- The person is a fresher — explain concepts simply, avoid assuming prior knowledge, and explain *why* not just *what*.
- She prefers testing/confirming each change before moving to the next step, not large unverified code dumps.
- Always give exact file-level instructions (which file, what to replace) since changes are applied manually.
- If continuing to build, keep appending new entries to `MockMate-Journal.md` in the same format as existing entries — she uses this to revise for interviews.
