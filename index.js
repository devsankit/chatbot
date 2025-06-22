// index.js
const express = require('express');
const dotenv = require('dotenv');
const { checkMessageForFlag } = require('./moderation');
const { sendWarning } = require('./sendReply');

dotenv.config();
const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  try {
    const { content, contact, conversation } = req.body;

    const flagged = checkMessageForFlag(content);
    if (flagged) {
      await sendWarning(contact.id, conversation.id);
      console.log("⚠️ Flagged message:", content);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error("❌ Error in webhook:", error.message);
    res.status(500).send('Server error');
  }
});

app.get('/', (req, res) => res.send('AI Moderation Bot Running'));

app.listen(process.env.PORT, () =>
  console.log(`✅ Bot live on port ${process.env.PORT}`)
);
