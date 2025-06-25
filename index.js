// index.js
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
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

    // Check for violations (AI + keyword)
    const result = await checkMessageForFlag(content);
    if (result && result.violation) {
      // Prevent duplicate warnings by checking for a tag (optional: implement tag check if needed)
      // Send warning to user
      await sendWarning(contactId, conversationId);
      // Add private note for admin/team
      await addPrivateNote(conversationId, `Violation detected (${result.source}): "${result.violation}" in message: "${content}"`);
      // Tag the conversation
      await tagConversation(conversationId, 'violation');
      // Log/report
      const logEntry = `${new Date().toISOString()} | Conversation: ${conversationId} | Contact: ${contactId} | Source: ${result.source} | Violation: ${result.violation} | Message: ${content}\n`;
      fs.appendFile('moderation_report.log', logEntry, err => { if (err) console.error('Log error:', err); });
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
