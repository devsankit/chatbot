// moderation.js

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

function checkMessageForFlag(message) {
  const lowerMsg = message.toLowerCase();
  const keyword = flaggedKeywords.find(keyword => lowerMsg.includes(keyword));
  if (keyword) {
    return { violation: `Keyword: ${keyword}`, source: 'keyword' };
  }
  return null;
}

module.exports = { checkMessageForFlag };
