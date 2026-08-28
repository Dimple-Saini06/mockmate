import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
// import App from './App.jsx'
// import ResumeUpload from './ResumeUpload.jsx'
import Practiceintro from './Practiceintro.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    {/* <ResumeUpload /> */}
    <Practiceintro onReady={() => console.log('Ready clicked!')} />
  </StrictMode>,
)
