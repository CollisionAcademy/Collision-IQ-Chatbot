// ✅ Load .env first
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables FIRST

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  apiVersion: "v1",
});

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'models/gemini-pro-latest',
});

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Sanity check — log model from .env
console.log("✅ GEMINI_MODEL:", process.env.GEMINI_MODEL);

// Root route
app.get('/', (_, res) => res.send('✅ API running'));

// Chatbot route
app.post('/', async (req, res) => {
  const prompt = req.body.message;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "❌ Missing Gemini API Key." });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
      apiVersion: "v1",
    });

    const model = genAI.getGenerativeModel({
      // ✅ Use working model name (not -latest!)
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    });

    const result = await model.generateContent(prompt);

    const reply = await result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error("❌ Gemini error:", err);
    res.status(500).json({ error: `Error calling Gemini model: ${err.message}` });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API listening on ${PORT}`);
});