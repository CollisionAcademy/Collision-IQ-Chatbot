// api/server.js
// Node ESM file (package.json should have `"type": "module"`)

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

<<<<<<< HEAD
/* ----------------------- C O R S  (allowlist) ----------------------- */
=======
/* ---------- CORS (tight but covers your cases) ---------- */
>>>>>>> e8f9345 (fix(api): update server.js and package.json (CORS/deps) — redeploy)
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://collision-iq.com",
  "https://www.collision-iq.com",
]);

<<<<<<< HEAD
// keep vercel preview builds allowed while you're developing
const vercelPreviewRegex = /^https:\/\/.+\.vercel\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl/postman
  if (allowedOrigins.has(origin)) return true;
  if (vercelPreviewRegex.test(origin)) return true;
=======
// Allow Vercel preview URLs for your project while you need them
const vercelPreview = /\.vercel\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;                            // curl/postman etc.
  if (allowedOrigins.has(origin)) return true;         // prod sites
  if (vercelPreview.test(origin)) return true;         // previews
>>>>>>> e8f9345 (fix(api): update server.js and package.json (CORS/deps) — redeploy)
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
// IMPORTANT: ensure explicit preflight responses include CORS headers
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "1mb" }));

<<<<<<< HEAD
/* ------------------------- H E A L T H  ----------------------------- */
=======
/* ---------- Health + root ---------- */
>>>>>>> e8f9345 (fix(api): update server.js and package.json (CORS/deps) — redeploy)
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/_ah/health", (_req, res) => res.status(200).send("ok"));
app.get("/", (_req, res) => res.type("text/plain").send("API is running!"));

<<<<<<< HEAD
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
=======
/* ---------- Gemini helper ---------- */
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? "";

async function callGemini(prompt) {
  if (!GEMINI_KEY) {
    return { reply: "Gemini key missing on server (set GEMINI_API_KEY)." };
  }
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    // pick the model you want
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // brief system nudging
    const system = "You are Collision-IQ, a helpful assistant for auto collision claims. Keep answers short and practical.";
    const result = await model.generateContent([system, prompt]);
    const text = result.response.text();
    return { reply: (text && text.trim()) || "Sorry — empty model reply." };
  } catch (err) {
    console.error("Gemini error:", err);
    return { reply: "Upstream model error." };
  }
}

/* ---------- Chat handler ---------- */
async function chatHandler(req, res) {
  try {
    const { message, messages } = req.body ?? {};
    const text = String(message ?? messages?.[0]?.content ?? "").trim();
    if (!text) return res.status(400).json({ error: "missing_message" });

    const { reply } = await callGemini(text);
    return res.json({ reply });
>>>>>>> e8f9345 (fix(api): update server.js and package.json (CORS/deps) — redeploy)
  } catch (err) {
    console.error("chat error:", err);
    // Return a short, structured error
    return res.status(500).json({ error: "server_error" });
  }
});

<<<<<<< HEAD
// Optional backwards-compatibility alias (not used by the UI)
app.post("/chat", (req, res, next) => app._router.handle(req, res, next));

/* ------------------------- S T A R T  ------------------------------- */
=======
// Canonical path used by your UI
app.post("/api/messages", chatHandler);
// Back-compat alias (optional)
app.post("/chat", chatHandler);

/* ---------- Start ---------- */
>>>>>>> e8f9345 (fix(api): update server.js and package.json (CORS/deps) — redeploy)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));