// api/server.js
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

/* ---------------- CORS ---------------- */
// allow production origins + your Vercel previews and local dev
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://collision-iq.com",
  "https://www.collision-iq.com",
]);

// collision-iq-frontend-* preview deployments
const previewRegex = /^https:\/\/collision-iq-frontend-[a-z0-9-]+\.vercel\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true;                  // curl/postman/non-browser
  if (allowedOrigins.has(origin)) return true;
  if (previewRegex.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin: (origin, cb) =>
    isAllowedOrigin(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS")),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

/* --------------- Health ---------------- */
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/_ah/health", (_req, res) => res.status(200).send("ok"));

/* --------------- Root ------------------ */
app.get("/", (_req, res) => {
  res.type("text/plain").send("API is running!");
});

/* ----------- Gemini setup -------------- */
// Put your Google AI Studio key in env: GEMINI_API_KEY
// (GCP → Cloud Run → Service → Edit & deploy → Variables → GEMINI_API_KEY)
//
// Model defaults to gemini-1.5-flash; override with GEMINI_MODEL if you like.
let genai = null;
if (process.env.GEMINI_API_KEY) {
  genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

async function runGemini(prompt) {
  if (!genai) return "Gemini key missing on server (set GEMINI_API_KEY).";
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const model = genai.getGenerativeModel({ model: modelName });

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.();
  return (text && text.trim()) || "(empty Gemini reply)";
}

/* ------------- Chat handler ------------ */
async function chatHandler(req, res) {
  try {
    const { message, messages } = req.body ?? {};
    const prompt = String(message ?? messages?.[0]?.content ?? "").trim();

    if (!prompt) {
      return res.status(400).json({ error: "missing_message" });
    }

    const reply = await runGemini(prompt);
    res.json({ reply });
  } catch (err) {
    console.error("chat error:", err);
    res.status(500).json({ error: "server_error" });
  }
}

// Canonical path used by your UI (App.jsx)
app.post("/api/messages", chatHandler);

// Optional legacy alias (kept for safety)
app.post("/chat", chatHandler);

/* --------------- Start ----------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});