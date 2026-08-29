import { useState, useRef, useEffect } from 'react';
import Auth from './Auth.jsx';
import Timer from './Timer.jsx';
import './App.css';
 
function ClarityGauge({ score }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;
 
  let color = 'var(--danger)';
  if (score >= 7) color = 'var(--success)';
  else if (score >= 4) color = 'var(--accent)';
 
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="40" y="46" textAnchor="middle" fontFamily="Space Grotesk" fontSize="18" fontWeight="600" fill="var(--text-primary)">
        {score}
      </text>
    </svg>
  );
}
 
export default function App() {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
 
  const recognitionRef = useRef(null);
 
  // login check karta hai - agar token save hai, matlab user pehle se logged in hai
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
 
  // theme - default dark, ya jo pehle se save hai localStorage mein
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
 
  // pressure round mode - jab on ho, timer dikhta hai aur time khatam hone par auto-submit hota hai
  const [pressureMode, setPressureMode] = useState(false);
 
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
 
  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }
 
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }
 
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
  }, []);
 
  function speakQuestion(text) {
    if (!window.speechSynthesis) return;
 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
 
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
 
    window.speechSynthesis.speak(utterance);
  }
 
  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
 
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
 
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer(transcript);
    };
 
    recognition.onend = () => setIsListening(false);
 
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }
 
  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }
 
  async function fetchQuestion() {
    const response = await fetch('http://localhost:3000/api/question');
    const data = await response.json();
    setQuestion(data);
    setResult(null);
    setAnswer('');
 
    speakQuestion(data.question);
  }
 
  async function submitAnswer() {
    stopListening();
    setLoading(true);
 
    const response = await fetch('http://localhost:3000/api/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question.question,
        answer: answer,
        questionId: question.id
      })
    });
 
    const data = await response.json();
    setResult(data);
    setLoading(false);
  }
 
  // agar login nahi hai, seedha Auth screen dikhao
  if (!user) {
    return <Auth onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }
 
  return (
    <div className="app-shell">
      <div className="stage">
        <div className="eyebrow-row">
          <span className="live-dot"></span>
          Practice Session
        </div>
        <div className="header-row">
          <div>
            <h1 className="title">MockMate</h1>
            <p className="subtitle">Real interview questions. Honest feedback. No fluff.</p>
          </div>
          <div className="header-buttons">
            <button className="btn btn-secondary theme-btn" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="btn btn-secondary logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
 
        {!voiceSupported && (
          <p className="voice-warning">
            Voice features work best in Chrome or Edge. Typing still works fine here.
          </p>
        )}
 
        <button className="btn btn-secondary" onClick={fetchQuestion}>
          {question ? 'Next Question' : 'Get a Question'}
        </button>
 
        {question && (
          <div className="question-card">
            <div className="question-card-header">
              <span className={`category-badge ${question.category}`}>
                {question.category}
              </span>
 
              <label className="pressure-toggle">
                <input
                  type="checkbox"
                  checked={pressureMode}
                  onChange={(e) => setPressureMode(e.target.checked)}
                />
                Pressure round (60s)
              </label>
            </div>
 
            {pressureMode && !result && (
              <Timer
                key={question.id}
                duration={60}
                isActive={!loading}
                onTimeUp={submitAnswer}
              />
            )}
 
            {isSpeaking && (
              <div className="status-pill speaking">
                <span className="waveform">
                  <span></span><span></span><span></span><span></span>
                </span>
                AI is asking...
              </div>
            )}
 
            {isListening && (
              <div className="status-pill listening">
                <span className="rec-dot"></span>
                Listening...
              </div>
            )}
 
            <p className="question-text">"{question.question}"</p>
 
            <textarea
              className="answer-textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer like you would in the room, or speak it out loud..."
              rows={5}
            />
 
            <div className="actions-row">
              <button
                className="btn btn-mic"
                onClick={isListening ? stopListening : startListening}
                disabled={!voiceSupported}
                title={voiceSupported ? 'Toggle microphone' : 'Voice not supported in this browser'}
              >
                {isListening ? 'Stop Mic' : 'Start Mic'}
              </button>
 
              <button className="btn btn-primary" onClick={submitAnswer} disabled={loading || !answer}>
                {loading && (
                  <span className="waveform">
                    <span></span><span></span><span></span><span></span>
                  </span>
                )}
                {loading ? 'Analyzing' : 'Submit Answer'}
              </button>
            </div>
          </div>
        )}
 
        {result && (
          <div className="feedback-panel">
            <div className="feedback-header">
              <ClarityGauge score={result.starScore?.clarityScore ?? 0} />
              <div className="gauge-label">
                <p className="gauge-title">Clarity Score</p>
                <p className="gauge-sub">Based on structure and directness</p>
              </div>
            </div>
 
            <div className="feedback-row">
              <p className="feedback-label">Feedback</p>
              <p className="feedback-text">{result.starScore?.feedback}</p>
            </div>
 
            <div className="feedback-row">
              <p className="feedback-label">Filler Words ({result.fillerWords?.totalCount ?? 0})</p>
              <div className="filler-chips">
                {result.fillerWords && Object.entries(result.fillerWords.breakdown).length > 0 ? (
                  Object.entries(result.fillerWords.breakdown).map(([word, count]) => (
                    <span className="chip" key={word}>
                      "{word}" <strong>×{count}</strong>
                    </span>
                  ))
                ) : (
                  <span className="chip">None detected — clean delivery</span>
                )}
              </div>
            </div>
 
            <div className="feedback-row">
              <p className="feedback-label">Interviewer Follow-up</p>
              <div className="followup-block">
                <p>"{result.followUpQuestion}"</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
