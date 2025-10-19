import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_, res) => res.send('✅ API running'));

app.post('/', async (req, res) => {
  const prompt = req.body.message;
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Missing Gemini API Key." });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // ✅ Use model from .env or fallback
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'models/gemini-1.5-pro-latest',
    });

    const result = await model.generateContent(prompt);

// Safely check if response and text method exist
if (!result?.response?.text) {
  console.error("Invalid response structure from Gemini:", result);
  return res.status(500).json({ error: "Invalid Gemini API response." });
}

 const reply = await result.response.text();

    res.json({ reply: response });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: `Error calling Gemini model: ${err.message}` });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API listening on ${PORT}`);
});