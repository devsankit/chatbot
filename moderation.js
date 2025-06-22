// moderation.js
const flaggedKeywords = [
  "phone", "number", "call me", "WhatsApp", "Instagram", "personal",
  "I want to work with you", "follow me", "outside link", "Google Drive"
];

function checkMessageForFlag(message) {
  const lowerMsg = message.toLowerCase();
  return flaggedKeywords.find(keyword => lowerMsg.includes(keyword));
}

module.exports = { checkMessageForFlag };
