const axios = require('axios');

const targetUrl = 'https://www.geeksforgeeks.org/interview-experiences/amazon-interview-experience-for-software-development-engineering-intern/';
 
// async function banate hain kyunki internet se data laane mein time lagta hai
async function collectInterviewQuestions() {
  try {
    // User-Agent header add kiya hai taaki website isse real browser samjhe, bot nahi
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
 
    const match = html.match(/"description":"(.*?)","/);
    
    if(match){
        console.log(match[1]);
    }else{
        console.log('Description nahi mila.');
    }
 
  } catch (error) {
    // agar kuch galat ho (internet na ho, URL galat ho, etc.)
    console.log('Error aaya:', error.message);
  }
}
 
collectInterviewQuestions();