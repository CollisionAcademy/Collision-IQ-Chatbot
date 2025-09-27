// api/server.js
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { google } from "googleapis"; // 🔄 NEW
import dotenv from "dotenv"; // 🔄 NEW

dotenv.config(); // 🔄 Load .env (if using locally)

const app = express();

/* ----------------------- C O R S  (allowlist) ----------------------- */
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://collision-iq.com",
  "https://www.collision-iq.com",
]);
const vercelPreviewRegex = /^https:\/\/.+\.vercel\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  if (vercelPreviewRegex.test(origin)) return true;
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

/* ------------------------- H E A L T H  ----------------------------- */
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/_ah/health", (_req, res) => res.status(200).send("ok"));

/* --------------------------- R O O T -------------------------------- */
app.get("/", (_req, res) => {
  res.type("text/plain").send("API is running!");
});

/* ------------------------ E N V  &  C O N F I G ---------------------- */
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const DRIVE_FILE_ID = process.env.GOOGLE_DRIVE_FILE_ID || ""; // 🔄 NEW

/* ------------------------- G E M I N I ------------------------------ */
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

/* --------------------- G O O G L E   D R I V E ---------------------- */
async function fetchDriveFileContent(fileId) {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );

  return response.data;
}

/* ------------------------- C H A T  A P I --------------------------- */
app.post("/api/messages", async (req, res) => {
  try {
    const text = coerceMessage(req.body);
    if (!text) {
      return res.status(400).json({ error: "missing_message", details: "Send { message: string }" });
    }

    if (!GEMINI_KEY) {
      return res.json({
        reply: "Gemini API key is not set on the server. Add GEMINI_API_KEY to Cloud Run (or Secret Manager) to enable model replies.",
      });
    }

    // 🔄 Fetch content from Google Drive file (optional)
    let context = "";
    if (DRIVE_FILE_ID) {
      try {
        context = await fetchDriveFileContent(DRIVE_FILE_ID);
      } catch (err) {
        console.warn("Drive content error:", err.message);
        context = ""; // fallback to no context
      }
    }

    // 🔄 Add Drive context into prompt
    const systemPreamble = "You are Collision-IQ's helpful assistant. Be concise and accurate.";
    const prompt = `
${systemPreamble}

Context from document:
${context}

User:
${text}
    `.trim();

    const reply = await runGemini(prompt);
    return res.json({ reply: reply?.trim() || "(empty reply)" });
  } catch (err) {
    console.error("chat error:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

app.post("/chat", (req, res, next) => app._router.handle(req, res, next));

/* ------------------------- S T A R T  ------------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});