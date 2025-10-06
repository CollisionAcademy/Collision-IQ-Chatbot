// api/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { google } from "googleapis";

// ------------------- Environment check -------------------
console.log("🔧 Environment check:");
console.log("PORT:", process.env.PORT || "default 8080");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL || "❌ Missing");

const app = express();

// ------------------- Middleware -------------------
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "1mb" }));

// ------------------- Health checks -------------------
app.get("/", (_req, res) => res.type("text/plain").send("✅ API is running!"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// ------------------- Config -------------------
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "models/gemini-2.0-flash";
const DRIVE_FILE_ID = process.env.GOOGLE_DRIVE_FILE_ID || "";

// ------------------- Gemini -------------------
async function runGemini(prompt) {
  if (!GEMINI_KEY) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ------------------- Google Drive (optional) -------------------
async function fetchDriveFileContent(fileId) {
  if (!fileId) return "";

  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  const drive = google.drive({ version: "v3", auth });

  try {
    const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "text" });
    return response.data;
  } catch (err) {
    console.warn("⚠️ Failed to fetch Google Drive file:", err.message);
    return "";
  }
}

// ------------------- Chat Endpoint -------------------
app.post("/api/messages", async (req, res) => {
  try {
    const text = req.body?.message?.trim();
    if (!text) {
      return res.status(400).json({ error: "missing_message", details: "Send { message: string }" });
    }

    let context = "";
    if (DRIVE_FILE_ID) {
      context = await fetchDriveFileContent(DRIVE_FILE_ID);
    }

    const systemPrompt = `You are Collision-IQ's helpful assistant. Be concise and accurate.`;
    const prompt = `${systemPrompt}\n\nContext:\n${context}\n\nUser: ${text}`;

    const reply = await runGemini(prompt);
    return res.json({ reply: reply?.trim() || "(empty reply)" });
  } catch (err) {
    console.error("❌ Chat error:", err);
    return res.status(500).json({ error: "server_error", details: err.message });
  }
});

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ API listening on port ${PORT}`);
});