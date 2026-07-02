// AI-powered backend for the chatbot widget — FREE VERSION
// ============================================================
// Uses Google Gemini's free API tier (no credit card needed).
//
// SETUP:
// 1. npm init -y
// 2. npm install express cors @google/generative-ai dotenv
// 3. Get a FREE Gemini API key (no card required):
//      - Go to https://aistudio.google.com/apikey
//      - Sign in with any Google account
//      - Click "Create API key"
// 4. Create a file named .env in this same folder with one line:
//      GEMINI_API_KEY=your_key_here
// 5. node backend-server.js
// 6. Deploy this file for free on Render.com or Railway.app
// 7. Copy the deployed URL + "/chat" into AI_ENDPOINT in chatbot-widget.html

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ---- EDIT THIS: describe your business so the bot answers correctly ----
const BUSINESS_INFO = `
You are a customer support assistant for "Your Business".
Business hours: Monday to Saturday, 9 AM to 7 PM.
Return policy: items can be returned within 7 days of delivery if unused
and in original packaging.
If you don't know an answer, say you'll connect the customer with a human
agent instead of guessing.
Always reply in the same language the customer is writing in (English,
Malayalam, Hindi, Tamil, Arabic, Spanish, French, or any other language).
Keep replies short and friendly, 1-3 sentences.
`;
// --------------------------------------------------------------------

app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    const priorTurns = (history || [])
      .filter(h => h.role === 'user' || h.role === 'assistant')
      .map(h => (h.role === 'user' ? 'Customer: ' : 'Support agent: ') + h.content)
      .join('\n');

    const prompt = BUSINESS_INFO +
      (priorTurns ? '\n\nConversation so far:\n' + priorTurns : '') +
      '\n\nCustomer: ' + message + '\nSupport agent:';

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    res.json({ reply: reply || "Sorry, could you rephrase that?" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Something went wrong. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Chatbot backend running on port ' + PORT));
