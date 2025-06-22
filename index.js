const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Define flagged words
const flaggedWords = [
  "phone", "number", "instagram", "document", "link",
  "share", "personal", "call", "email", "work with you"
];

// In-memory warning tracker
const userWarnings = {};

app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function moderateWithOpenAI(message) {
  if (!OPENAI_API_KEY) return { flagged: false };
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a chat moderator. Analyze the following message for: 1) negative or extreme emotion, 2) flirting or inappropriate advances, 3) attempts to take the conversation outside the platform (sharing contact info, social media, etc). Reply with a JSON object: {"flagged":true/false, "reasons":["emotion","flirting","off-platform"]}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const text = response.data.choices[0].message.content;
    return JSON.parse(text);
  } catch (e) {
    console.error('OpenAI moderation error:', e.message);
    return { flagged: false };
  }
}

app.post('/webhook', async (req, res) => {
  const data = req.body;
  
  try {
    const content = data.content?.toLowerCase() || "";
    const conversationId = data.conversation?.id;
    const inboxId = data.inbox?.id;
    const senderId = data.sender?.id;

    // Check if message contains any flagged word
    const flagged = flaggedWords.find(word => content.includes(word));

    // Check with OpenAI moderation
    let aiFlagged = false;
    let aiReasons = [];
    if (!flagged && content) {
      const aiResult = await moderateWithOpenAI(content);
      aiFlagged = aiResult.flagged;
      aiReasons = aiResult.reasons || [];
    }

    if ((flagged || aiFlagged) && conversationId && senderId) {
      // Track warning
      userWarnings[senderId] = (userWarnings[senderId] || 0) + 1;
      let reply = `⚠️ Your message was not delivered due to policy violation.`;
      if (aiFlagged && aiReasons.length) {
        reply += ` Reason(s): ${aiReasons.join(', ')}`;
      }
      await axios.post(
        `https://app.chatwoot.com/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
        {
          content: reply,
          message_type: "outgoing"
        },
        {
          headers: {
            api_access_token: process.env.CHATWOOT_BOT_TOKEN
          }
        }
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling webhook:', error.message);
    res.sendStatus(500);
  }
});

// Simple dashboard endpoint for warnings
app.get('/report', (req, res) => {
  res.json(userWarnings);
});

app.get('/', (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log(`Bot running on port ${PORT}`);
});
