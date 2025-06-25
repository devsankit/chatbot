// sendReply.js
const axios = require('axios');
require('dotenv').config();

const CHATWOOT_API = 'https://app.chatwoot.com/api/v1';
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const TOKEN = process.env.CHATWOOT_TOKEN;

async function sendWarning(contactId, conversationId, message) {
  const warning = message || `⚠️ This message may violate our community rules. Please stay professional.`;
  await axios.post(
    `${CHATWOOT_API}/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      content: warning,
      message_type: 'outgoing',
      private: false
    },
    {
      headers: {
        api_access_token: TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );
}

async function addPrivateNote(conversationId, note) {
  await axios.post(
    `${CHATWOOT_API}/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      content: note,
      message_type: 'note',
      private: true
    },
    {
      headers: {
        api_access_token: TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );
}

async function tagConversation(conversationId, tag) {
  await axios.post(
    `${CHATWOOT_API}/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`,
    { labels: [tag] },
    {
      headers: {
        api_access_token: TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );
}

module.exports = { sendWarning, addPrivateNote, tagConversation };
