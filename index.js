// index.js
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const { sendWarning } = require('./sendReply');

dotenv.config();
const app = express();
app.use(express.json());

// Function to check message using OpenAI Moderation API
async function checkMessageForFlag(content) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/moderations',
      { input: content },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // If flagged, response.data.results[0].flagged will be true
    return response.data.results[0].flagged;
  } catch (error) {
    console.error('Error calling OpenAI Moderation API:', error.message);
    return false;
  }
}

app.post('/webhook', async (req, res) => {
  try {
    const { content, contact, conversation } = req.body;

    const flagged = await checkMessageForFlag(content);
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
