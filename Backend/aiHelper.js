// yeh file Groq API se baat karti hai (free, OpenAI-compatible format)

async function callGroq(prompt) {
  // console.log("callGroq : ", process.env.GROQ_API_KEY);
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


// Tavily se real web search karta hai
async function searchTavily(query) {
  // console.log("searchTavily : ", process.env.TAVILY_API_KEY);
  const response = await fetch('https://api.tavily.com/search', {
    method : 'POST',
    headers : {'Content-Type' : 'application/json'},
    body : JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query : query,
      search_depth : 'basic',
      max_results : 5,
      include_raw_content : false,
    })
  });

  const data = await response.json();
  // console.log("searchTavily fxn otpt : ", data);

  if(data.error){
    throw new Error(data.error);
  }

  return data.results;
} 

// Groq se search results mein se real questions nikalwata hai, source ke saath
async function sourceQuestionsWithAI(company, role) {
  // console.log("sourceQuestionsWithAI : ", process.env.GROQ_API_KEY)
  const query = `real interview questions asked at ${company} for ${role} role`;
  const searchResults = await searchTavily(query);
  // console.log("sourceQuestionsWithAI result  : ", searchResults);

  const combinedText = searchResults
    .map(r => `Source: ${r.url}\nContent: ${r.content}`)
    .join('\n\n---\n\n');

  // console.log("sourceQuestionsWithAI map : ", combinedText);
  const prompt = `Below are search results about interview experiences at ${company} for a ${role} role.
  Extract real interview questions from this text.
  For each question, tell me which source URL it came from, and rate its difficulty (basic/intermediate/senior).
  
  Respond with ONLY valid JSON array, no markdown formatting, in this format:
  [
    { "question": "...", "sourceUrl": "...", "difficulty": "basic" }
  ]
  
  Search results:
  ${combinedText}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method : 'POST',
    headers : {
      'Content-Type' : 'application/json',
      'Authorization' : `Bearer ${process.env.GROQ_API_KEY}`
    },
    body : JSON.stringify({
      model :  'openai/gpt-oss-120b',
      messages : [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();

  if(data.error){
    throw new Error(data.error.message);
  }

  let rawText = data.choices[0].message.content;
  rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  return JSON.parse(rawText);
}


module.exports = { generateFollowUp, scoreAnswer, sourceQuestionsWithAI };