// api/server.js
// Node ESM file (package.json should have `"type": "module"`)

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

/* ----------------------- C O R S  (allowlist) ----------------------- */
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://collision-iq.com",
  "https://www.collision-iq.com",
]);

// keep vercel preview builds allowed while you're developing
const vercelPreviewRegex = /^https:\/\/.+\.vercel\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl/postman
  if (allowedOrigins.has(origin)) return true;
  if (vercelPreviewRegex.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin: (origin, cb) =>
    isAllowedOrigin(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS")),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // cache preflight for 24h
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

/* ------------------------- H E A L T H  ----------------------------- */
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/_ah/health", (_req, res) => res.status(200).send("ok"));

/* --------------------------- R O O T -------------------------------- */
app.get("/", (_req, res) => {
  res.type("text/plain").send("API is running!");
});

/* ------------------------- G E M I N I ------------------------------ */
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// tiny helper to squeeze a message string out of varied shapes
function coerceMessage(body = {}) {
  const { message, messages } = body ?? {};
  if (typeof message === "string" && message.trim()) return message.trim();
  if (Array.isArray(messages) && messages[0]?.content) return String(messages[0].content);
  return "";
}

async function runGemini(prompt) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const result = await model.generateContent([
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ]);

  return result.response.text();
}

/* ------------------------- C H A T  A P I --------------------------- */
// Canonical path (keep the frontend pointed here)
app.post("/api/messages", async (req, res) => {
  try {
    const text = coerceMessage(req.body);
    if (!text) {
      return res.status(400).json({ error: "missing_message", details: "Send { message: string }" });
    }

    // If the key is not wired yet, return a helpful reply instead of 500
    if (!GEMINI_KEY) {
      return res.json({
        reply:
          "Gemini API key is not set on the server. Add GEMINI_API_KEY to Cloud Run (or Secret Manager) to enable model replies.",
      });
    }

    // Optional: prepend a light system instruction
    const systemPreamble =
      "You are Collision-IQ's helpful assistant. Be concise and accurate.";

    const reply = await runGemini(`${systemPreamble}\n\nUser: ${text}`);
    return res.json({ reply: reply?.trim() || "(empty reply)" });
  } catch (err) {
    console.error("chat error:", err);
    // Return a short, structured error
    return res.status(500).json({ error: "server_error" });
  }
});

// Optional backwards-compatibility alias (not used by the UI)
app.post("/chat", (req, res, next) => app._router.handle(req, res, next));

/* ------------------------- S T A R T  ------------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});