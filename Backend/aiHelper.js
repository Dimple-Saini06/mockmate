// // yeh file Google Gemini API se baat karne ka kaam karti hai (free API)

// const { raw } = require("express");

// async function generateFollowUp(question, answer) {
//   const prompt = `You are conducting a mock interview. The candidate was asked: "${question}"
// They answered: "${answer}"
 
// Ask ONE natural follow-up question based on their answer, like a real interviewer would. Reply with ONLY the follow-up question, nothing else.`;

//   const apiKey = process.env.GEMINI_API_KEY;
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

//   const response = await fetch(url, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       contents: [
//         {
//           parts: [{ text: prompt }]
//         }
//       ]
//     })
//   });

//   const data = await response.json();

//   if (data.error) {
//     throw new Error(data.error.message);
//   }

//   const followUpQuestion = data.candidates[0].content.parts[0].text;
//   return followUpQuestion.trim();
// }


// async function scoreAnswer(question, answer) {
//   const prompt = `You are evaluating a mock interview answer using the STAR method (Situation, Task, Action, Result).
 
// Question: "${question}"
// Answer: "${answer}"
 
// Analyze the answer and respond with ONLY valid JSON in this exact format, nothing else, no markdown formatting:
// {
//   "hasSituation": true or false,
//   "hasTask": true or false,
//   "hasAction": true or false,
//   "hasResult": true or false,
//   "clarityScore": a number from 1 to 10,
//   "feedback": "one short sentence of specific, constructive feedback"
// }`;

//   const apiKey = process.env.GEMINI_API_KEY;
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

//   const response = await fetch(url, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       contents: [{ parts: [{ text: prompt }] }]
//     })
//   });

//   const data = await response.json();

//   if (data.error) {
//     throw new Error(data.error.message);
//   }

//   let rawText = data.candidates[0].content.parts[0].text;
//   console.log("rw", rawText);
//   // kabhi-kabhi AI ```json ... ``` wale markdown fences bhi bhej deta hai - unhe hata do
//   rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

//   const scoreData = JSON.parse(rawText);
//   return scoreData;
// }


// module.exports = { generateFollowUp, scoreAnswer };
















// yeh file Groq API se baat karti hai (free, OpenAI-compatible format)

async function callGroq(prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.choices[0].message.content;
}

async function generateFollowUp(question, answer) {
  const prompt = `You are conducting a mock interview. The candidate was asked: "${question}"
They answered: "${answer}"

Ask ONE natural follow-up question based on their answer, like a real interviewer would. Reply with ONLY the follow-up question, nothing else.`;

  const followUpQuestion = await callGroq(prompt);
  return followUpQuestion.trim();
}

async function scoreAnswer(question, answer) {
  const prompt = `You are evaluating a mock interview answer using the STAR method (Situation, Task, Action, Result).

Question: "${question}"
Answer: "${answer}"

Analyze the answer and respond with ONLY valid JSON in this exact format, nothing else, no markdown formatting:
{
  "hasSituation": true or false,
  "hasTask": true or false,
  "hasAction": true or false,
  "hasResult": true or false,
  "clarityScore": a number from 1 to 10,
  "feedback": "one short sentence of specific, constructive feedback"
}`;

  let rawText = await callGroq(prompt);

  // kabhi-kabhi AI markdown fences (```json) bhi bhej deta hai - unhe hata do
  rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  const scoreData = JSON.parse(rawText);
  return scoreData;
}

module.exports = { generateFollowUp, scoreAnswer };