import { useState, useEffect, useRef } from 'react';
import './Auth.css';
 
export default function Timer({ duration = 60, onTimeUp, isActive = true }) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const intervalRef = useRef(null);
 
  useEffect(() => {
    // agar timer active nahi hai, kuch mat karo
    if (!isActive) return;
 
    // har 1 second mein secondsLeft ko 1 se kam karo
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          // setTimeout se thoda delay dete hain, taaki React ka apna render cycle
          // pehle complete ho jaaye, phir onTimeUp chale - isse "update during render" warning nahi aati
          if (onTimeUp) setTimeout(onTimeUp, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
 
    // cleanup - jab component hat jaaye ya isActive badle, purana interval band karo
    return () => clearInterval(intervalRef.current);
  }, [isActive]);
 
  // jab duration prop badle (naya question aaye), timer reset karo
  useEffect(() => {
    setSecondsLeft(duration);
  }, [duration]);
 
  // seconds ko MM:SS format mein dikhao
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
 
  // last 10 seconds mein warning color
  const isWarning = secondsLeft <= 10;
 
  return (
    <div className={`timer-display ${isWarning ? 'timer-warning' : ''}`}>
      {formattedTime}
    </div>
  );
}
 