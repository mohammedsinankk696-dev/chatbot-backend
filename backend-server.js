// ================== CHATBOT BACKEND (Groq — free, no card needed) ==================
// This server receives chat messages from your website widget and asks
// Groq's free AI (Llama 3.3 model) for a reply.
//
// EDIT THIS: describe your business so the bot answers correctly
const BUSINESS_INFO = `
You are a customer support assistant for a business that offers:
Digital Marketing, Graphic Design, and Website Development.
Business hours: Monday to Saturday, 9 AM to 5 PM.
Return policy: work/services can be discussed for revisions within 7 days if applicable.
Contact details (use ONLY when relevant, see rule below): Phone/WhatsApp +91 7306560392,
Email mohammedsinankk696@gmail.com.
Answer customer questions naturally and helpfully in whatever language they write or speak in
(English, Malayalam, Hindi, Tamil, Arabic, Spanish, or French).

IMPORTANT RULES:
- Keep every reply short: 1-3 sentences maximum, unless the customer clearly asks for more detail.
- Never invent stories, customer names, case studies, or examples that weren't given to you.
- Answer only what was asked. Do not add unrelated information.
- Always finish your sentence completely — never trail off. If a full answer needs more room,
  keep it under 4 short sentences rather than cutting off mid-thought.
- ONLY mention the phone number, WhatsApp number, or email if the customer specifically asks for
  contact info, a phone number, an email address, or to talk to a human/agent. Do NOT include the
  phone number or email in replies about services, pricing, hours, or anything else — even if
  it feels helpful. Leave it out unless directly asked.
`;

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.1-8b-instant';

app.post('/chat', async (req, res) => {
  try {
    const userMessage = (req.body && req.body.message) ? req.body.message : '';
    const history = (req.body && req.body.history) ? req.body.history : [];

    if (!GROQ_API_KEY) {
      // No key configured — tell the widget to use its offline FAQ answers.
      return res.json({ ai_unavailable: true });
    }

    // Build the conversation for Groq (OpenAI-compatible format)
    var messages = [{ role: 'system', content: BUSINESS_INFO }];
    history.forEach(function (turn) {
      messages.push({
        role: turn.role === 'assistant' ? 'assistant' : 'user',
        content: turn.content
      });
    });
    messages.push({ role: 'user', content: userMessage });

    var maxAttempts = 3;
    var lastError = null;
    var reply = null;

    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        var response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + GROQ_API_KEY
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: messages,
            temperature: 0.4,
            max_tokens: 300
          })
        });

        if (!response.ok) {
          var errText = await response.text();
          var err = new Error(errText);
          err.status = response.status;
          throw err;
        }

        var data = await response.json();
        reply = data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : null;
        break; // success
      } catch (err) {
        lastError = err;
        var status = err.status || null;
        var isRetryable = status === 503 || status === 429;
        if (isRetryable && attempt < maxAttempts) {
          await new Promise(function (r) { setTimeout(r, attempt * 1000); });
          continue;
        }
        throw err;
      }
    }

    res.json({ reply: reply || "Sorry, could you rephrase that?" });
  } catch (err) {
    console.error(err);
    // Any failure (busy, rate limit, network, bad key) — let the widget
    // fall back to its free offline FAQ answers instead of showing an error.
    res.json({ ai_unavailable: true });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('Chatbot backend (Groq) running on port ' + PORT);
});
