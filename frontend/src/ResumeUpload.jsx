import { useState } from "react";

export default function ResumeUpload({ onContinue }){
    const [ selectFile, setSelectFile ] = useState(null);
    const [ error, setError ] = useState('');

    function handleFileChange(e){
        console.log("handleFileChange :: ", e);
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

            <button
                onClick={handleSubmit}
                disabled = {!selectFile}
                className="btn btn-primary setup-submit"
            >
                Continue with Resume
            </button>

            <p className="setup-skip" onClick={() => onContinue(null)}>
                Skip — I'll pick a technology instead
            </p>
        </div>
    )
}