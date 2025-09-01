// api/server.js
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

/* ---------- CORS (tight but covers your cases) ---------- */
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://collision-iq.com",
  "https://www.collision-iq.com",
]);

// Allow Vercel preview URLs for your project while you need them
const vercelPreview = /\.vercel\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;                            // curl/postman etc.
  if (allowedOrigins.has(origin)) return true;         // prod sites
  if (vercelPreview.test(origin)) return true;         // previews
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
// IMPORTANT: ensure explicit preflight responses include CORS headers
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "1mb" }));

/* ---------- Health + root ---------- */
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/_ah/health", (_req, res) => res.status(200).send("ok"));
app.get("/", (_req, res) => res.type("text/plain").send("API is running!"));

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
  } catch (err) {
    console.error("chat error:", err);
    res.status(500).json({ error: "server_error" });
  }
}

// Canonical path used by your UI
app.post("/api/messages", chatHandler);
// Back-compat alias (optional)
app.post("/chat", chatHandler);

/* ---------- Start ---------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));