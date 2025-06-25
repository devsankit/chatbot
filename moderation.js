// moderation.js
const axios = require('axios');

const flaggedKeywords = [
  // Contact info
  "phone", "number", "call me", "whatsapp", "instagram", "email", "contact", "mobile",
  // Payment
  "paytm", "gpay", "upi", "bank details", "payment outside", "send money",
  // Links
  "drive.google.com", "dropbox.com", "wetransfer.com", "bit.ly", "linkedin.com", "facebook.com", "instagram.com", "telegram.me", "t.me",
  // Unprofessional/flirty
  "beautiful", "cute", "single", "meet up", "let's be friends",
  // Bypass platform
  "work outside", "ignore platform charges", "deal personally"
];

async function checkMessageForFlag(message) {
  // 1. Try OpenAI Moderation API if key is set
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/moderations',
        { input: message },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const flagged = response.data.results[0].flagged;
      if (flagged) {
        return { violation: 'AI-moderation: flagged as inappropriate', source: 'ai' };
      }
    } catch (err) {
      console.error('OpenAI Moderation API error:', err.message);
    }
  }
  // 2. Fallback to keyword check
  const lowerMsg = message.toLowerCase();
  const keyword = flaggedKeywords.find(keyword => lowerMsg.includes(keyword));
  if (keyword) {
    return { violation: `Keyword: ${keyword}`, source: 'keyword' };
  }
  return null;
}

module.exports = { checkMessageForFlag };
