import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'models/gemini-2.5-flash', // ⚡ you can also use gemini-2.5-pro
});

app.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  try {
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error('❌ Gemini API error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (_, res) => res.send('✅ Collision-IQ API running'));

const PORT = process.env.PORT || 8081;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API listening on ${PORT}`);
  console.log(`💡 GEMINI_MODEL: ${process.env.GEMINI_MODEL}`);
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API listening on ${PORT}`);
});