// sendReply.js
const axios = require('axios');
require('dotenv').config();

async function sendWarning(contactId, conversationId, message) {
  // Use the provided message, or fallback to a default
  const warning = message || `⚠️ This message may violate our community rules. Please stay professional.`;

  await axios.post(
    `https://app.chatwoot.com/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      content: warning,
      message_type: 'outgoing',
      private: false
    },
    {
      headers: {
        api_access_token: process.env.CHATWOOT_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );
}

module.exports = { sendWarning };
