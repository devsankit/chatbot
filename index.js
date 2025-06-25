// index.js
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const { checkMessageForFlag } = require('./moderation');
const { sendWarning, addPrivateNote, tagConversation } = require('./sendReply');

dotenv.config();
const app = express();
app.use(express.json());

// Webhook endpoint for Chatwoot
app.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    const content = payload.content;
    const conversationId = payload.conversation && payload.conversation.id;
    const contactId = payload.conversation && payload.conversation.contact_inbox && payload.conversation.contact_inbox.contact_id;

    if (!content || !conversationId) {
      return res.status(400).json({ error: 'Missing content or conversationId' });
    }

    // Check for violations
    const violation = checkMessageForFlag(content);
    if (violation) {
      // Send warning to user
      await sendWarning(contactId, conversationId);
      // Add private note for admin/team
      await addPrivateNote(conversationId, `Violation detected: "${violation}" in message: "${content}"`);
      // Tag the conversation
      await tagConversation(conversationId, 'violation');
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error in webhook:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Chatwoot Moderation Bot is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Moderation bot listening on port ${PORT}`);
});
