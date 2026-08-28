import './Auth.css';

const STEPS = [
  {
    title: "You'll get a real question",
    description: "Pulled from real interview experiences, matched to your skills or chosen technology."
  },
  {
    title: "Answer by voice or text",
    description: "Speak naturally, or type if you prefer — both work the same way."
  },
  {
    title: "Camera is optional",
    description: "Turn it on for a more realistic feel, or keep it off — your choice, no judgment."
  },
  {
    title: "Get instant, honest feedback",
    description: "Clarity score, filler words, and a follow-up question — just like a real interviewer."
  }
];


export default function Practiceintro({ onReady }){
    return(
        <div className="setup-card">
            <h2 className='setup-title'>Before You Start</h2>
            <p className='setup-subtitle'>A quick walkthrough — this takes 30 seconds</p>

            <div className="intro-steps">
                {
                    STEPS.map((step,i)=>(
                        <div className="intro-step" key={i}>
                            <div className="intro-step-number">{i+1}</div>
                            <div>
                                <p className='intro-step-title'>{step.title}</p>
                                <p className='intro-step-desc'>{step.description}</p>
                            </div>
                        </div>
                    ))}
            </div>
            
            <button className="btn btn-primary setup-submit" onClick={onReady}>
                Got it, let's start
            </button>
        </div>

        
    );
}