# MockMate — Project Journal

A running log of what was built, what broke, how it was fixed, and what was learned — day by day. Update this as new phases progress.

---

## Phase: Data Collection (Day 1-6)

### Day 1 — Manual question bank + test script
**Built:** `data/questions.json` (15 hand-written sample questions), `test.js` (reads the JSON, picks a random question).
**Why:** Wanted a working pipeline before dealing with real scraping.
**Learned:** File reading (`require()` vs `fs.readFileSync`), `JSON.parse`, random array selection.

### Day 2 — First scraper attempt
**Built:** First version of a scraper targeting a single GeeksforGeeks article.
**Issue 1:** `$('p')` selector found almost no content — assumed content was in `<p>` tags, it wasn't.
**Issue 2:** Website was blocking bot-like requests (very small HTML returned).
**Fix:** Added a browser-like `User-Agent` header to axios requests.
**Issue 3:** After fixing the block, still very little content — discovered via saving raw HTML and inspecting it that the JSON `"description"` field was just a short, truncated SEO summary (~300-450 characters), not the full article.
**Learned:** Real scraping requires inspecting actual page structure rather than assuming; `axios` + `cheerio` basics; regex vs escape-aware regex for JSON string extraction.

### Day 3 — Article link extraction
**Built:** `checkListing.js` — pulls all article links from the GeeksforGeeks listing page.
**Issue:** Initial link list included category/listing pages mixed in with real articles.
**Fix:** Filtered links to require `/interview-experiences/` and exclude `/category/`; deduped with `Set`.
**Learned:** Array `.filter()`, `Set` for deduplication.

### Day 4 — Full scraping loop
**Built:** Looped the scraper across all 15 article links, with a 1.5s delay between requests ("polite scraping").
**Issue:** Discovered the short JSON description field (from Day 2) wasn't the real article body at all — full content was rendered as visible page text (headings + list items), not in JSON.
**Fix:** Rewrote the scraper to extract `$('body').text()` via Cheerio instead of relying on the JSON field.
**Learned:** `async/await` in loops, rate-limiting with a `wait()` helper, modular code (`module.exports`) to avoid duplicating scraping logic across files.

### Day 5 — Real question extraction
**Built:** `extractQuestions.js` — pulls actual questions out of scraped article text.
**Issue 1:** Sentence splitting on `. ` failed because scraped text often had no space after periods ("roles.Includes").
**Fix:** Used a lookahead/lookbehind regex to split on punctuation followed by a capital letter, space or not.
**Issue 2:** Headings were sticking directly to the next sentence ("Apex ProgrammingWhat is Apex?").
**Fix:** Regex to insert a space between a lowercase letter and an immediately following uppercase letter, plus a targeted fix for common question-starting words (What, Why, How, etc.).
**Issue 3:** `$('body').text()` was pulling in `<script>` tag content (stray JSON/JS code) into the "text".
**Fix:** `$('script, style').remove()` before extracting text.
**Learned:** Regex lookahead/lookbehind, text cleaning patterns for real-world scraped data.

### Day 6 — Categorization
**Built:** `categorize.js` — keyword-based classifier sorting questions into technical / HR / behavioral, output as `questions-final.json`.
**Learned:** Simple rule-based classification is often good enough — doesn't need AI for every task.

**Result:** 49 real, categorized interview questions scraped from 15 GeeksforGeeks articles.

---

## Phase: Backend (Day 7-8)

### Day 7 — Express server
**Built:** `Backend/server.js` with `GET /api/question` (random question, optional category filter).
**Issue:** `path.join(__dirname, "data-collection\questions-final.json")` failed — backslash in a double-quoted JS string was being treated as an (invalid) escape sequence and silently dropped, and the path was also missing `../` (Backend and data-collection are sibling folders, not nested).
**Fix:** Used `path.join(__dirname, '..', 'data-collection', 'questions-final.json')` — separate string arguments avoid the escaping problem entirely.
**Learned:** `path.join()`, `__dirname`, difference between sibling and nested folder paths.

### Day 8 — POST endpoint + in-memory storage
**Built:** `POST /api/submit-answer` (receives an answer, stores it in a `submittedAnswers` array), `GET /api/answers` (view stored answers, for testing).
**Issue:** `ERR_HTTP_HEADERS_SENT` error — caused by `res.json()` being called more than once in the same route handler.
**Fix:** Made sure only one response is sent per request.
**Learned:** `req.body` requires `express.json()` middleware; GET vs POST; why responses can only be sent once per request.

---

## Phase: AI Integration (Day 9-10)

### Day 9 — AI follow-up questions
**Decision:** Initially considered Claude/OpenAI APIs, switched to **Google Gemini API** — genuinely free tier (~1000+ requests/day, no credit card).
**Built:** `Backend/aiHelper.js` — `generateFollowUp(question, answer)` calls Gemini, returns a follow-up question based on the user's answer.
**Issue 1:** Pasted API key wasn't in the correct Gemini format (should start with `AIzaSy...`).
**Issue 2:** `.env` and `.gitignore` files were accidentally saved without their leading dot (`env`, `gitignore` instead of `.env`, `.gitignore`) — dotenv couldn't find them.
**Fix:** Renamed with `mv env .env` / `mv gitignore .gitignore`.
**Issue 3:** `require(".dotenv")` (extra dot) — should be `require("dotenv")`.
**Issue 4:** Model `gemini-2.5-flash` was deprecated for new users — switched to `gemini-3.6-flash`.
**Learned:** `.env` / `dotenv` for secrets, `.gitignore`, Gemini's REST API request/response shape (`contents[0].parts[0].text`), that AI models get deprecated and require ongoing maintenance.

### Day 10 — Answer scoring
**Built:** `countFillerWords()` — pure JavaScript, regex-based, no AI (detects "um", "like", "basically", etc.). `scoreAnswer()` in `aiHelper.js` — calls Gemini to check STAR structure (Situation/Task/Action/Result), returns a clarity score (1-10) and specific feedback as JSON.
**Design decision:** Combined a deterministic check (filler words, pure code) with an AI check (STAR structure) so scoring is partly explainable, not a single opaque AI judgment.
**Issue:** AI sometimes wrapped its JSON response in markdown code fences (` ```json `) — broke `JSON.parse()`.
**Fix:** Strip fences with `.replace()` before parsing.
**Learned:** `Promise.all()` to run two AI calls in parallel (faster than sequential), prompting AI for structured JSON output.

---

## Phase: Frontend (Day 11)

**Built:** React app (Vite) — `App.jsx`, `App.css`. Question fetch/display, answer textarea, submit flow, feedback panel (clarity score as an SVG circular gauge, filler-word chips, follow-up question).
**Design:** Custom design system — ink-navy background, amber accent ("interview spotlight" feel), Fraunces (serif) for questions, Space Grotesk for UI text — deliberately not a generic AI-tool look.
**Issue:** Pasting CSS from chat truncated the file (only first ~20 lines came through) — page looked unstyled (Times New Roman, no colors).
**Fix:** Always download files directly rather than copy-pasting from rendered chat text.
**Learned:** React state (`useState`), controlled inputs, conditional rendering (`{x && <div>...}`), SVG `stroke-dasharray`/`stroke-dashoffset` for a progress ring, `Object.entries()` + `.map()` to render objects as lists.

---

## Phase: Voice Integration (Day 12-13)

### Day 12 — Speak + listen
**Built:** `speakQuestion()` (SpeechSynthesis — AI reads the question aloud), `startListening()` / `stopListening()` (SpeechRecognition — voice to text, manually toggled via a mic button, not auto-triggered).
**Issue 1:** CORS — frontend (`localhost:5173`) and backend (`localhost:3000`) are different origins; browser blocked cross-origin requests by default.
**Fix:** Added the `cors` npm package, restricted to `origin: "http://localhost:5173"` (not wildcard `*`, for better practice).
**Issue 2:** Mic button stayed permanently disabled — traced to browser support check running correctly, but needed confirming via `window.webkitSpeechRecognition` in console.
**Issue 3:** Recognition started but got `"no-speech"` error even while actually speaking — Windows mic test (hardware) worked fine, meaning the issue was that Chrome's SpeechRecognition sends audio to Google's servers over the internet — confirmed via Google's official speech demo page, then resolved (network-related).
**Learned:** Web Speech API (`SpeechSynthesisUtterance`, `SpeechRecognition`), CORS fundamentals, that browser speech recognition is not fully local/offline.

### Day 13 — Audio recording playback
**Built:** `MediaRecorder` integration alongside `SpeechRecognition` — records actual audio (not just transcribed text) so users can play back their own answer afterward, to notice nervousness/pacing/tone.
**Design decision:** SpeechRecognition and MediaRecorder run in parallel — one for live transcription, one for raw audio capture — since SpeechRecognition alone cannot produce a playable audio file.
**Learned:** `navigator.mediaDevices.getUserMedia()`, `MediaRecorder`, `Blob`, `URL.createObjectURL()` for in-browser audio playback without uploading anywhere.

---

---

## Phase: Foundation (Day 1+)

### Day 1 — MongoDB Atlas setup + connection
**Built:** Free (M0) MongoDB Atlas cluster, database user, network access opened, connection string added to `.env` as `MONGODB_URI`. Added `mongoose` to `server.js` with a `.connect()` call.
**Decision:** Chose Atlas (cloud) over a local MongoDB install specifically because the backend will eventually be deployed — a local database wouldn't be reachable once the backend runs on a remote server.
**Issue:** Initial connect attempt produced no output (no success or error message) — traced to the mongoose code not actually being present in the running `server.js` (an older version was still active).
**Fix:** Confirmed the `require("mongoose")` and `mongoose.connect(...)` lines were present, then re-ran — got "MongoDB connected successfully".
**Learned:** MongoDB Atlas free tier setup (cluster, database user, network access allowlist, connection string), that local databases don't work post-deployment, `mongoose.connect()` with `.then()`/`.catch()` for connection status.

### Day 3 — Signup route + password hashing
**Built:** `POST /api/signup` — checks for existing email, hashes password with `bcrypt`, saves new user via the `User` model.
**Issue:** `E11000 duplicate key error` on every signup attempt — traced to a leftover unique index on a misspelled field (`emmail_1`) from an earlier mistake, which treated every document's missing `emmail` field as `null`, so all signups looked like duplicates.
**Fix:** `db.users.dropIndex("emmail_1")` in `mongosh` to remove the bad index; the correct `email_1` index was untouched.
**Learned:** `bcrypt.hash()` for one-way password encryption, MongoDB indexes vs schema (indexes are a database-level structure, not part of the code's schema definition), debugging directly via `mongosh`.

### Day 4 — Login route + JWT
**Built:** `POST /api/login` — finds user by email, compares password with `bcrypt.compare()`, issues a JWT token (7-day expiry) on success.
**Issue 1:** `Operation users.findOne() buffering timed out` — MongoDB connection had dropped (Atlas IP allowlist didn't include the current IP after a network change).
**Fix:** Added `0.0.0.0/0` to Atlas Network Access (IP Access List) for development.
**Issue 2:** Typos — `bcrypt.message()` instead of `bcrypt.compare()`, and `expiresIN` instead of `expiresIn`.
**Learned:** JWT tokens as a stateless "proof of login", why database connectivity issues surface as timeouts rather than clear errors, that Atlas requires explicit IP allowlisting.

### Day 5 — Signup/Login UI
**Built:** `Auth.jsx` + `Auth.css` — a toggleable signup/login form (frontend only, no backend wiring yet).
**Issue:** Page rendered completely unstyled (default browser fonts, no colors) — `Auth.css` uses CSS variables (`var(--bg)`, `var(--accent)`, etc.) that are only defined in `App.css`'s `:root`, which wasn't being imported when `Auth` was rendered standalone for testing.
**Fix:** Imported `App.css` alongside `Auth.jsx` so the shared design tokens were available.
**Also fixed:** Typos where `onChange` read `e.target.email` / `e.target.password` instead of `e.target.value` — these are not real properties on an input element, so typing did nothing.
**Learned:** CSS custom properties (variables) only work where they're defined/imported, controlled inputs (`value` + `onChange`) require the correct event property.

### Day 6 — Wire Auth to backend + login persistence
**Built:** `Auth.jsx`'s `handleSubmit` now calls `/api/signup` or `/api/login` for real; successful login stores `token` and `user` in `localStorage`. `App.jsx` checks `localStorage` on load — shows `Auth` if no user, shows the main interview UI if logged in. Added a logout button that clears storage.
**Design decision:** Used `localStorage` (not just React state) specifically so login persists across page refreshes — otherwise refreshing the page would always show the login screen again.
**Learned:** Conditional rendering at the top level (`if (!user) return <Auth />`) to gate an entire app behind auth, `localStorage` for simple client-side persistence, passing a callback prop (`onLoginSuccess`) from parent to child to communicate state changes upward.

---

## Phase: AI-Driven Question Sourcing (Day 8+)

### Day 8 — Researched Google Search grounding
**Researched:** Gemini's "Grounding with Google Search" tool — lets the model search the live web and return citations (source URLs) alongside its answer, instead of relying only on scraped/hardcoded sites.
**Findings:** 5,000 free grounded queries/month across Gemini 3.x models (including `gemini-3.6-flash`, already in use), then $14 per 1,000 queries beyond that — free quota is far more than a student project needs. Requires adding a `google_search` tool to the API request; the model decides how many searches to run per prompt.
**Plan:** Use this to replace the single-site (GeeksforGeeks-only) scraper — ask Gemini for real interview questions on a topic/company, get back questions plus their real source links as proof, removing the need for site-specific Cheerio scrapers.

### Unplanned — Migrated from Gemini to Groq after a Google-side key rollout issue
**What happened:** While testing Google Search grounding (Day 9), Gemini started returning "API key not valid" — not just for the new grounding test script, but for the entire app's existing follow-up/scoring feature that had been working since Day 9-13. Investigated and found Google is mid-rollout on a new API key format (`AQ.` prefix, called "Auth keys") replacing the old `AIzaSy...` format ("Standard keys") — this is a known, actively-discussed issue affecting many developers as of August 2026, not fixable by changing request code (tried both `?key=` query param and `x-goog-api-key` header; both failed the same way, matching community reports).
**Decision:** Rather than wait on Google to resolve the rollout or set up full OAuth2 (too complex for the timeline), migrated the AI layer to **Groq** — a different free-tier provider (14,400 requests/day, OpenAI-compatible request format, no credit card).
**Built:** Rewrote `aiHelper.js` around a shared `callGroq()` helper; `generateFollowUp()` and `scoreAnswer()` now call Groq instead of Gemini, with the same function signatures so `server.js` needed no changes.
**Issue 1:** `.env` value was wrapped in quotes (`GROQ_API_KEY="gsk_..."`) — `.env` files don't strip quotes automatically, so the key literally included the quote character and was rejected.
**Issue 2:** Initial model choice `llama-3.3-70b-versatile` had just been deprecated by Groq (shutdown August 16, 2026) — switched to Groq's recommended replacement, `openai/gpt-oss-120b`.
**Learned:** Depending on a single external AI provider is a real production risk — providers can change key formats, deprecate models, or have outages with little notice. Designing the AI layer behind a small set of functions (`generateFollowUp`, `scoreAnswer`) made swapping providers a one-file change rather than a rewrite. `.env` files treat quotes as literal characters, not as string delimiters.

### Day 9 — Tavily + Groq: AI-driven multi-source sourcing works
**Context:** Original plan was Gemini's Google Search grounding, but that became unusable after the Gemini API key rollout issue (see above) and the switch to Groq, which has no built-in web search.
**Built:** A two-step pipeline — Tavily (a free search API built for AI agents, 1,000 free searches/month, no card) searches the live web for a query like "real interview questions at TCS for software engineer"; Groq then reads the returned content and extracts clean questions, tagging each with a difficulty level, while the exact source URL (already provided by Tavily per result) is attached to each question.
**Result:** First test pulled real questions from two different sites (a Medium blog and AmbitionBox) in a single run — no site-specific scraper code needed for either, and no hardcoded list of "15-16 websites" — Tavily finds relevant pages dynamically based on the query.
**Learned:** Combining a search API (finds sources) with an LLM (extracts/structures the content) is a clean pattern for "AI does the sourcing" without needing one model to do both search and generation — most LLM providers don't bundle live search, but pairing a dedicated search API with any LLM achieves the same result.

### Day 10 — Built /api/source-questions route (Tavily + Groq end-to-end)
**Built:** Moved the Tavily search + Groq extraction logic from the standalone test script into `aiHelper.js` as reusable functions (`searchTavily`, `sourceQuestionsWithAI`), then added a real Express route: `GET /api/source-questions?company=X&role=Y`. Deleted the now-redundant `testTavily.js`.
**Issue:** Got "Invalid API Key" even though the same Groq key worked fine elsewhere in the app — traced to a typo while manually retyping the code: `'Autorization'` instead of `'Authorization'` in the request headers. Since header names must match exactly, Groq silently treated the request as having no auth header at all.
**Confirmed working:** Test call for Infosys/Software Developer returned 4 real questions with exact source URLs (interviewquery.com, simplilearn.com) and AI-assigned difficulty levels — validates the full pipeline end-to-end.
**Not yet done:** This route is not wired into the question bank the live app actually serves (`questions-final.json`). Users still see only the original 49 scraped questions. Connecting sourced questions into the real flow is the next step.

### Day 11-12 — Merged AI-sourced questions into the live question bank
**Built:** `/api/source-questions` now pushes each AI-sourced question (with company, difficulty, and sourceUrl fields) into `questionBank.technical` in memory, so `/api/question` can randomly serve them alongside the original 49 scraped questions.
**Verified:** Called `/api/source-questions?company=Wipro&role=Software Engineer`, then checked `/api/questions` and confirmed new entries appeared with IDs like `sourced-Wipro-...` and the correct company/difficulty fields attached.
**Known limitation:** This is memory-only — sourced questions disappear on server restart. Making them permanent requires saving to MongoDB, which hasn't been done yet (planned for Phase 3 or a dedicated follow-up).

## Phase 2 Complete — Summary

Phase 2's original goal was AI-driven question sourcing across multiple sites with source-link proof, replacing the single-site hand-built scraper from Phase 1. Achieved via:
- Tavily (search API) finds real interview-question pages across the live web for any company/role query
- Groq (LLM) extracts clean, structured questions from that content, tags difficulty, and preserves the exact source URL
- A working backend route (`/api/source-questions`) that merges results into the app's live question bank

Along the way, had to pivot from the original plan (Gemini's Google Search grounding) after Google's API key rollout broke authentication — migrated the whole AI layer to Groq, and split "search" and "extract" into two specialized tools since Groq has no built-in web search. This ended up being a stronger, more flexible architecture than the original single-provider plan.

## Upcoming: Phase 2 Replacement Note

**What's changing:** The current data collection approach (`checkListing.js` + `dataCollector.js`) is hand-built for GeeksforGeeks specifically — custom Cheerio selectors, custom regex, one hardcoded site.

**What replaces it:** AI-driven sourcing using Gemini's Google Search grounding — the AI itself finds real interview questions across the web (no manual per-site scraper code, no hardcoded list of 15-16 URLs) and returns the exact source link for each question as proof, alongside a difficulty-level tag (basic/intermediate/senior).

**Why this matters for the story:** It shows an explicit architecture decision — starting with a hand-built, fully understood scraper (good for learning and for explaining fundamentals in an interview), then consciously replacing it with a more scalable, AI-driven approach once the manual method's limits became clear (one site, fragile to structure changes, no source diversity).

*(This section will be updated once Phase 2 work actually starts, with real issues/fixes as they happen — same as every phase above.)*

---

## Concept Q&A — For Revision

Quick answers to things that were confusing at the time. Re-read this before an interview.

**Q: Why `process.env.MONGO_URL` and not just `env.MONGO_URL`?**
A: `env` isn't a global thing on its own — it only exists as a property *inside* `process`, a global object Node.js provides. `process` gives info about the running program; `process.env` is specifically where environment variables (loaded from `.env` by `dotenv`) live.

**Q: What is bcrypt, JWT, and localStorage?**
A: **bcrypt** one-way encrypts passwords before storing them (can't be reversed — login compares by re-hashing and checking for a match, never by decrypting). **JWT** is a signed token issued on login that proves "this user is authenticated" without re-sending credentials on every request. **localStorage** is browser storage that survives page refreshes and browser restarts (unlike React state, which resets on refresh) — used to keep a login session and theme preference persistent.

**Q: Why does `mongoose.connect()` need a cloud database (Atlas) instead of a local one?**
A: A locally-installed database only exists on the laptop it's installed on. Once the backend is deployed to run on someone else's server, that server can't reach a database sitting on a personal laptop. A cloud database (Atlas) is reachable from anywhere, including a future deployed backend.

**Q: `dropIndex` — does that delete the schema?**
A: No. A *schema* (defined in `models/User.js`) is the blueprint for what a document looks like — that lives in code and is untouched by database operations. An *index* is a separate, internal database structure used for fast lookups or enforcing rules like `unique`. Dropping a bad index doesn't touch the schema at all.

**Q: In `Auth.jsx`, `isSignup` defaults to `false` — does that mean login is called by default?**
A: Yes — `const endpoint = isSignup ? '/api/signup' : '/api/login'` means: since `isSignup` starts `false`, the ternary's "else" branch (`/api/login`) is what runs until the user clicks "Sign Up" to flip `isSignup` to `true`.

**Q: Why does the theme line use a function inside `useState`, i.e. `useState(() => {...})`?**
A: This is "lazy initialization" — it tells React to run that function only once, on first load, rather than on every re-render. Without the function wrapper, `localStorage.getItem('theme')` would be checked on every single re-render, which is wasteful.

**Q: Why switch away from Gemini, and why Tavily + Groq specifically?**
A: Google rolled out a new API key format (`AQ.` prefix) that broke existing key authentication for many developers, including this project — a documented, widely-reported issue, not a coding mistake. Rather than wait for Google to fix it, the AI layer was migrated to **Groq** (a different free LLM provider). But Groq has no built-in web search, unlike Gemini's grounding feature — so achieving the original goal (AI finds real interview questions across many sites, with proof of source) required two specialized tools instead of one: **Tavily** (a search API built for AI apps — finds real pages and returns their content + URLs) handles the "search" half, and **Groq** (an LLM) handles the "understand and structure the content" half. Neither tool alone can do both; search and language understanding are different capabilities.

**Q: Is the app currently using the new Tavily+Groq sourced questions, or the old scraped ones?**
A: As of Day 9 (Phase 2), Tavily+Groq is only proven to work in a standalone test script (`testTavily.js`) — it is **not yet wired into the actual app**. The live app still serves questions from `questions-final.json`, the original 49 questions scraped from GeeksforGeeks in Phase 1 (Day 1-6 of the original build). Connecting the new AI-driven sourcing to an actual backend route (so the app can use it) is the next step.

## Skills Accumulated So Far

- Web scraping: `axios`, `cheerio`, bot-blocking workarounds, regex-based text extraction and cleaning
- Backend: Express routing (GET/POST), middleware, `path`/`__dirname`, CORS, environment variables
- AI integration: prompting for structured JSON output, parallel API calls, handling model deprecation
- Frontend: React state and conditional rendering, custom design systems, SVG for data visualization
- Browser APIs: Web Speech API (synthesis + recognition), MediaRecorder, Blob/Object URLs
- Debugging discipline: inspecting raw output before assuming a fix, isolating variables (e.g. testing Google's own speech demo to rule out app-level bugs)
