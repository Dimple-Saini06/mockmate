import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'
// import ResumeUpload from './ResumeUpload.jsx'
// import Practiceintro from './Practiceintro.jsx'
// import SetupCheck from './SetupCheck.jsx'
// import Timer from './Timer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* <ResumeUpload /> */}
    {/* <Practiceintro onReady={() => console.log('Ready clicked!')} /> */}
    {/* <SetupCheck onContinue={() => console.log('Setup done, starting interview!')} /> */}
    {/* <Timer duration={15} onTimeUp={() => console.log('Time is up!')} /> */}
  </StrictMode>,
)
