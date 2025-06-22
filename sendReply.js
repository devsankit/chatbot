// sendReply.js
const axios = require('axios');
require('dotenv').config();

async function sendWarning(contactId, conversationId) {
  const message = `⚠️ This message may violate our community rules. Please stay professional.`;

  await axios.post(
    `https://app.chatwoot.com/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      content: message,
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
