import { useState } from "react";
import './Auth.css';
 
const AVAILABLE_TECHNOLOGIES = [
  'React', 'JavaScript', 'Node.js', 'Java', 'Python', 'SQL',
  'HTML/CSS', 'Express.js', 'MongoDB', 'DSA', 'C++'
];
 
export default function ResumeUpload({ onContinue }){
    const [ selectFile, setSelectFile ] = useState(null);
    const [ error, setError ] = useState('');
    const [showTechPicker, setShowTechPicker] = useState(false);
    const [selectedTech, setSelectedTech] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('basic');
    const [difficulty, setDifficulty] = useState('basic');
    
    function handleFileChange(e){
        // console.log("handleFileChange :: ", e);
        const file = e.target.files[0];
        setError('');

        if(!file) return;

        // sirf PDF allow karo
        if(file.type !== "application/pdf"){
            setError("Only Pdf Format are allowed.");
            setSelectFile(null);
            return;
        }

        setSelectFile(file);
    }

    function handleSubmit(){
        console.log('Resume selected:', selectFile);
    }

    function handleTechSubmit() {
        onContinue({ technology: selectedTech, difficulty });
    }
    
    // difficulty selector - dono screens (resume aur tech picker) mein use hoga
    function DifficultySelector() {
        const levels = [
        { value: 'basic', label: 'Basic', desc: 'Fresher / entry-level' },
        { value: 'intermediate', label: 'Intermediate', desc: '1-3 years experience' },
        { value: 'senior', label: 'Senior', desc: '3+ years experience' }
        ];
    
        return (
        <div className="difficulty-row">
            {levels.map((level) => (
            <button
                key={level.value}
                type="button"
                className={`difficulty-pill ${difficulty === level.value ? 'active' : ''}`}
                onClick={() => setDifficulty(level.value)}
            >
                <span className="difficulty-label">{level.label}</span>
                <span className="difficulty-desc">{level.desc}</span>
            </button>
            ))}
        </div>
        );
    }

    // agar user ne "skip" dabaya hai, tech picker screen dikhao
    if (showTechPicker) {
        return (
            <div className="setup-card">
                <h2 className="setup-title">Pick a Technology</h2>
                <p className="setup-subtitle">We'll show you questions related to this</p>
        
                <select
                className="tech-dropdown"
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                >
                <option value="">Select a technology...</option>
                {AVAILABLE_TECHNOLOGIES.map((tech) => (
                    <option key={tech} value={tech}>{tech}</option>
                ))}
                </select>
                
                <p className="feedback-label" style={{ marginTop: '18px' }}>Difficulty Level</p>
                
                <DifficultySelector />

                <button
                className="btn btn-primary setup-submit"
                onClick={handleTechSubmit}
                disabled={!selectedTech}
                >
                Start Practicing
                </button>
        
                <p className="setup-skip" onClick={() =>  setShowTechPicker(false)}>
                Back to resume upload
                </p>
            </div>
        );
    }

    return(
        <div className="setup-card">
            <h2 className="setup-title">Personalized Your Practice</h2>
            <p className="setup-subtitle">Upload your resume so questions match your skills</p>

            <label className="file-upload-box">
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="file-input-hidden" />
                {
                    selectFile ? (
                        <span>{selectFile.name}</span>
                    ) : (
                        <span>Click to choose a PDF resume</span>
                    )
                }
            </label>

            {error && <p className="auth-error">{error}</p>}

            <p className="feedback-label" style={{ marginTop: '18px' }}>Difficulty Level</p>
            
            <DifficultySelector />
            
            <button
                onClick={handleSubmit}
                disabled = {!selectFile}
                className="btn btn-primary setup-submit"
            >
                Continue with Resume
            </button>

            <p className="setup-skip" onClick={() => setShowTechPicker(true)}>
                Skip — I'll pick a technology instead
            </p>
        </div>
    );
}