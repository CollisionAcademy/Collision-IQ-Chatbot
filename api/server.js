// api/server.js
// Node ESM file (package.json must have `"type": "module"`)

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

/* ----------------------- CORS Configuration ----------------------- */
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://collision-iq-chatbot-j41t.vercel.app",
  "https://collision-iq.com",
  "https://www.collision-iq.com"
]);

// Allow vercel previews during development
const vercelPreviewRegex = /^https:\/\/.+\.vercel\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true; // for Postman/curl
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

/* -------------------- Global Request Logging ---------------------- */
app.use((req, res, next) => {
  console.log("📩 Incoming request:");
  console.log("➡️  Method:", req.method);
  console.log("➡️  URL:", req.originalUrl);
  console.log("➡️  Origin:", req.headers.origin || "none");
  console.log("➡️  Body:", req.body);
  next();
});

/* ------------------------- Health Checks -------------------------- */
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/_ah/health", (_req, res) => res.status(200).send("ok"));
app.get("/", (_req, res) => res.type("text/plain").send("API is running!"));


/* --------------------------- Gemini ------------------------------- */
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY");
    return { reply: "Server misconfigured. Missing API key." };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });

    console.log("🧠 Sending prompt:", prompt);

    const result = await model.generateContent(prompt); // ✅ simplified correct call
    const reply = await result.response.text();

    console.log("✅ Gemini response:", reply);
    return { reply: reply.trim() };
  } catch (err) {
    console.error("❌ Gemini model error:", JSON.stringify(err, null, 2));
    return { reply: "Error calling Gemini model." };
  }
}


/* ----------------------- Chat Endpoint ----------------------------- */
app.post("/api/messages", async (req, res) => {
  console.log("🤖 /api/messages endpoint hit!");

  try {
    const { message, messages } = req.body ?? {};
    const text = String(message ?? messages?.[0]?.content ?? "").trim();

    if (!text)
      return res.status(400).json({
        error: "missing_message",
        details: "Send { message: string }",
      });

    const systemPrompt =
      "You are Collision-IQ, a helpful and knowledgeable assistant for auto collision claims. Be concise and accurate.";
    const { reply } = await callGemini(`${systemPrompt}\n\nUser: ${text}`);

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error in /api/messages:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// Optional backward-compatible alias
app.post("/chat", (req, res, next) => app._router.handle(req, res, next));

/* --------------------------- Start Server -------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 API listening on port ${PORT} — ready for requests.`)
);