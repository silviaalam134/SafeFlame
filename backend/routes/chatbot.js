const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
// Gemini currently reports gemini-2.0-flash as unavailable; allow the model to
// be overridden from .env while using the currently available replacement.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const SYSTEM_INSTRUCTION = `You are SafeFlame's burn first-aid assistant.
Only answer questions about fire-related burn injuries, smoke inhalation, clothing fires, and basic first aid.
Never mention specific medicine names or dosages.
Always recommend immediate professional medical or emergency help when an injury sounds severe, covers a large area, affects the face, hands, feet, joints, or genitals, involves electrical or chemical exposure, causes breathing difficulty, confusion, unconsciousness, or severe pain.
Keep answers concise, practical, calm, and easy to follow.
Politely decline questions unrelated to burns, fire injuries, smoke inhalation, or basic first aid.
Do not diagnose and do not suggest delaying professional care.`;

// POST /api/chatbot/ask
router.post('/ask', async (req, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';

  if (!question) {
    return res.status(400).json({ message: 'Please enter a question.' });
  }

  if (question.length > 1000) {
    return res.status(400).json({ message: 'Please keep your question under 1000 characters.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('Gemini API key is missing');
    return res.status(503).json({ message: 'The AI assistant is temporarily unavailable.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION
    });
    const result = await model.generateContent(question);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error('Gemini returned an empty response');
    }

    return res.json({ response: responseText });
  } catch (error) {
    const status = error.status || error.response?.status;
    console.error('Gemini chatbot request failed:', error.message);

    if (status === 429) {
      return res.status(429).json({ message: 'The assistant is busy right now. Please try again shortly.' });
    }

    if (status === 503) {
      return res.status(503).json({ message: 'Gemini is temporarily busy. Please try again in a moment.' });
    }

    return res.status(502).json({ message: 'The assistant could not respond right now. Please try again shortly.' });
  }
});

module.exports = router;