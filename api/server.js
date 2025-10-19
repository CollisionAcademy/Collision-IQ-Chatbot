// api/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("API running ✅"));

app.post("/api/messages", async (req, res) => {
  const prompt = req.body.message;
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ reply: "Missing Gemini API Key." });
  }

try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  const result = await model.generateContent(prompt);
  const reply = result.response.text();

  res.json({ reply }); // ✅ this should be inside the try block
} catch (err) {
  console.error("Gemini error:", err); // ✅ prints detailed error
  res.status(500).json({ reply: `Error calling Gemini model: ${err.message}` });
}
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ API listening on ${PORT}`));