// index.js
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const { sendWarning } = require('./sendReply');

dotenv.config();
const app = express();
app.use(express.json());

// Function to check for phone numbers (simple regex)
function containsPhoneNumber(content) {
  // Matches sequences of 10+ digits, or common phone formats
  const phoneRegex = /\b(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4,}\b/;
  return phoneRegex.test(content);
}

// Additional regex for contact-related phrases
function containsContactRequest(content) {
  const contactRegex = /(share|send|provide|give|tell|reveal|disclose).{0,20}(phone|contact|number|mobile|whatsapp|email|details|info)/i;
  return contactRegex.test(content);
}

// List of phrases/keywords to flag for intent detection
const flaggedPhrases = [
  // Sharing Personal Contact Information
  "what’s your phone number", "dm me on instagram", "here’s my whatsapp", "call me", "ping me on telegram", "my insta id", "let’s talk outside the app", "message me privately", "find me on social media", "add me on facebook", "add me on linkedin",
  // Asking for or Offering Direct Payments
  "i’ll pay you on gpay", "i’ll pay you on upi", "don’t go through this platform", "i’ll pay extra outside", "what’s your paytm number", "send your bank details", "can you share your upi id", "i’ll send you advance directly", "forget this platform", "i’ll deal with you personally",
  // Sharing External Links or Files
  "here’s a google drive link", "download the file from dropbox", "i’ve sent a wetransfer link", "click here for more info", "check this website for our chat", "here’s my portfolio link",
  // Personal / Unprofessional / Flirty Behavior
  "you’re very beautiful", "you’re very cute", "are you single", "want to meet up", "i’d love to see you someday", "you seem really nice", "let’s be friends",
  // Bypassing Hiring or Platform Process
  "i want to hire you full-time directly", "i’ll give you more work off-platform", "let’s work outside this", "what’s your freelancing rate", "you’ll get more money with me directly", "just ignore platform charges",
  // Sharing Documents Outside Approved Channels
  "please check this document link", "i can’t upload here, sending via email", "here’s a file you need to open", "open this doc from gdrive",
  // Manipulative or Unethical Statements
  "let’s avoid the commission", "we don’t need to tell them", "i’ve done this before, don’t worry", "they won’t know", "just say this if someone asks",
  // Sharing links
  "bit.ly", "drive.google.com", "dropbox.com", "wetransfer.com", "linkedin.com", "facebook.com", "instagram.com", "telegram.me", "t.me"
];

// Function to check for intent/keywords
function containsFlaggedIntent(content) {
  const lowerContent = content.toLowerCase();
  return flaggedPhrases.some(phrase => lowerContent.includes(phrase));
}

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

// Function to check intent using OpenAI GPT API
async function checkIntentWithAI(content) {
  try {
    const prompt = `You are an AI moderation assistant. Analyze the following message and answer ONLY with "true" if it attempts to share personal contact info, payment details, external links, bypass platform rules, or is unprofessional/flirty, manipulative, or offensive. Otherwise, answer ONLY with "false".\n\nMessage: "${content}"`;
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a strict AI moderation assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 5,
        temperature: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const aiReply = response.data.choices[0].message.content.trim().toLowerCase();
    return aiReply === 'true';
  } catch (error) {
    console.error('Error calling OpenAI GPT API for intent:', error.message);
    return false;
  }
}

// Detailed warning message
const warningMessage = `⚠️ Your message was flagged for violating platform rules. Please maintain professionalism and do not attempt to bypass platform protocols. Repeated violations may lead to temporary or permanent suspension.\n\n❌ **Examples of flagged content include**:\n\n🛑 **Sharing Personal Contact Information**\n- What’s your phone number?\n- DM me on Instagram\n- Here’s my WhatsApp: +91…\n- Call me / Ping me on Telegram\n- My Insta ID is…\n- Let’s talk outside the app\n- Message me privately\n- Find me on social media\n- Add me on Facebook / LinkedIn\n\n💸 **Asking for or Offering Direct Payments**\n- I’ll pay you on GPay / UPI\n- Don’t go through this platform\n- I’ll pay extra outside\n- What’s your Paytm number?\n- Send your bank details\n- Can you share your UPI ID?\n- I’ll send you advance directly\n- Forget this platform, I’ll deal with you personally\n\n🔗 **Sharing External Links or Files**\n- Here’s a Google Drive link\n- Download the file from Dropbox\n- I’ve sent a WeTransfer link\n- Click here for more info: bit.ly/…\n- Check this website for our chat\n- Here’s my portfolio link\n\n🧑‍🤝‍🧑 **Personal / Unprofessional / Flirty Behavior**\n- You’re very beautiful / cute\n- Are you single?\n- Want to meet up?\n- I’d love to see you someday\n- You seem really nice 😉\n- Let’s be friends\n\n💼 **Bypassing Hiring or Platform Process**\n- I want to hire you full-time directly\n- I’ll give you more work off-platform\n- Let’s work outside this\n- What’s your freelancing rate?\n- You’ll get more money with me directly\n- Just ignore platform charges\n\n📄 **Sharing Documents Outside Approved Channels**\n- Please check this document link\n- I can’t upload here, sending via email\n- Here’s a file you need to open\n- Open this doc from GDrive\n\n🧠 **Manipulative or Unethical Statements**\n- Let’s avoid the commission\n- We don’t need to tell them\n- I’ve done this before, don’t worry\n- They won’t know\n- Just say this if someone asks\n\n🗣️ **Offensive or Inappropriate Language**\n- Abusive words (filtered dynamically)\n- Any kind of discrimination\n- Hate speech or personal attacks\n\n🔐 **Platform Rule Reminder:**\nWe use automated AI moderation for your safety. Please keep the conversation **professional, ethical, and relevant to the work at hand**. Misuse of this platform will not be tolerated.\n\nIf flagged by mistake, rephrase your message clearly and appropriately.`;

app.post('/webhook', async (req, res) => {
  try {
    // Log the full payload for debugging
    console.log('Webhook payload:', JSON.stringify(req.body, null, 2));
    const { content, contact, conversation, sender } = req.body;

    // Log incoming message for debugging
    console.log('Incoming message:', content);

    // Only call OpenAI APIs if regex/keyword checks do not flag
    let flagged = containsPhoneNumber(content)
      || containsContactRequest(content)
      || containsFlaggedIntent(content);
    if (!flagged) {
      flagged = await checkMessageForFlag(content) || await checkIntentWithAI(content);
    }

    // Use contact.id or sender.id for contactId
    const contactId = (contact && contact.id) || (sender && sender.id);
    const conversationId = conversation && conversation.id;

    if (flagged && contactId && conversationId) {
      // Send the detailed warning message
      await sendWarning(contactId, conversationId, warningMessage);
      console.log("⚠️ Flagged message:", content);
    } else if (flagged) {
      console.error("❌ Missing contact or conversation info in payload:", req.body);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error("❌ Error in webhook:", error.message);
    res.status(500).send('Server error');
  }
});

app.get('/', (req, res) => res.send('AI Moderation Bot Running'));

app.get('/webhook', (req, res) => {
  res.send('Webhook endpoint is live. Use POST to send data.');
});

app.listen(process.env.PORT, () =>
  console.log(`✅ Bot live on port ${process.env.PORT}`)
);
