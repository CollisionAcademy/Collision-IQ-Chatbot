// api/server.js
// Ensure package.json has: "type": "module"

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();

/* ----------------------- CORS Configuration ----------------------- */
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://collision-iq-chatbot-j41t.vercel.app",
  "https://collision-iq.com",
  "https://www.collision-iq.com"
]);

const vercelPreviewRegex = /^https:\/\/.+\.vercel\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true; // for Postman / curl
  if (allowedOrigins.has(origin)) return true;
  if (vercelPreviewRegex.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin: (origin, cb) =>
    isAllowedOrigin(origin)
      ? cb(null, true)
      : cb(new Error("Not allowed by CORS")),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // cache preflight for 24h
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

/* ------------------------- Health Checks -------------------------- */
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/", (_req, res) => res.type("text/plain").send("API is running!"));

/* --------------------------- Gemini ------------------------------- */
async function callGemini(prompt) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ Missing GEMINI_API_KEY");
      return { reply: "Server misconfigured. Missing API key." };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash-latest",
    });

    console.log("🧠 Sending prompt to Gemini...");
    const result = await model.generateContent(prompt);
    const reply = await result.response.text();
    console.log("✅ Gemini reply:", reply);

    return { reply: reply.trim() };
  } catch (err) {
    console.error("❌ Gemini model error:", JSON.stringify(err, null, 2));
    return { reply: "Error calling Gemini model." };
  }
}

/* ------------------------- Message Endpoint ----------------------- */
app.post("/api/messages", async (req, res) => {
  console.log("🤖 /api/messages called:", req.body);

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ reply: "Missing 'message' in request body." });
  }

  const systemPrompt =
    "You are Collision-IQ, a helpful and knowledgeable assistant for auto collision claims. Be concise and accurate.";

  const result = await callGemini(`${systemPrompt}\n\nUser: ${message}`);
  res.json(result);
});

/* --------------------------- Start Server -------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API listening on port ${PORT}`);
});