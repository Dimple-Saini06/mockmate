// yeh file Google Gemini API se baat karne ka kaam karti hai (free API)
 
async function generateFollowUp(question, answer) {
  const prompt = `You are conducting a mock interview. The candidate was asked: "${question}"
They answered: "${answer}"
 
Ask ONE natural follow-up question based on their answer, like a real interviewer would. Reply with ONLY the follow-up question, nothing else.`;
 
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
 
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });
 
  const data = await response.json();
 
  if (data.error) {
    throw new Error(data.error.message);
  }
 
  // Gemini ka response structure Claude se thoda alag hai
  const followUpQuestion = data.candidates[0].content.parts[0].text;
  return followUpQuestion.trim();
}
 
module.exports = { generateFollowUp };