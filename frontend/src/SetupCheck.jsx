import { useState, useRef } from "react";

export default function SetupCheck({ onContinue }){
    const[micStatus, setMicStatus] = useState('untested');
    const[cameraStatus, setCameraStatus] = useState('untested');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    async function testMic(){
        setMicStatus('testing');
        try{
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // agar yahan tak pahunch gaye, matlab permission mil gayi aur mic mila
            setMicStatus('working');
            // turant band kar do, humein sirf confirm karna tha
            stream.getTracks().forEach(track => track.stop());
        }catch(err){
            setMicStatus('failed');
        }
    }

    async function testCamera(){
        setCameraStatus('testing');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraStatus('working');
        } catch (err) {
            setCameraStatus('failed');
        }
    }

    function stopCameraPreview() {
        if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        }
    }
    
    function statusLabel(status) {
        if (status === 'untested') return 'Not tested';
        if (status === 'testing') return 'Checking...';
        if (status === 'working') return 'Working';
        if (status === 'failed') return 'Not available';
    }

    return(
        <div className="setup-card">
            <h2 className="setup-title">Quick Setup Check</h2>
            <p className="setup-subtitle">Test your mic and camera before starting (camera is optional)</p>
            
            <div className="check-row">
                <div>
                    <p className="intro-step-title">Microphone</p>
                    <p className={`check-status check-status-${micStatus}`}>{statusLabel(micStatus)}</p>
                </div>
                <button className="btn btn-secondary" onClick={testMic}>Test Mic</button>
            </div>

            <div className="check-row">
                <div>
                    <p className="intro-step-title">Camera (optional)</p>
                    <p className={`check-status check-status-${cameraStatus}`}>{statusLabel(cameraStatus)}</p>
                </div>
                <button className="btn btn-secondary" onClick={testCamera}>Test Camera</button>
            </div>

            {cameraStatus == 'working' && (
                <div className="camera-preview-box">
                    <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
                </div>
            )}

            <button
                className="btn btn-primary setup-submit"
                onClick={() => { stopCameraPreview(); onContinue(); }}
                disabled={micStatus !== 'working'}
            >
                {micStatus === 'working' ? "I'm ready — start the interview" : 'Test your mic to continue'}
            </button>
        </div>
    );
}