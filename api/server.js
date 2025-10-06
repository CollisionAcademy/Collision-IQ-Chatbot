// api/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { google } from "googleapis";

// Load environment variables
dotenv.config();

const app = express();

/* ------------------- Middleware ------------------- */
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ------------------- Health Checks ------------------- */
app.get("/", (_req, res) => res.type("text/plain").send("API is running!"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

/* ------------------- Config ------------------- */
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const DRIVE_FILE_ID = process.env.GOOGLE_DRIVE_FILE_ID || "";

/* ------------------- Gemini ------------------- */
async function runGemini(prompt) {
  if (!GEMINI_KEY) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  return result.response.text();
}

/* ------------------- Google Drive ------------------- */
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

/* ------------------- Chat Endpoint ------------------- */
app.post("/api/messages", async (req, res) => {
  try {
    const text = req.body?.message?.trim();
    if (!text) {
      return res
        .status(400)
        .json({ error: "missing_message", details: "Send { message: string }" });
    }

    if (!GEMINI_KEY) {
      return res.json({
        reply:
          "Gemini API key is not set on the server. Add GEMINI_API_KEY to your environment.",
      });
    }

    // Optional Drive context
    let context = "";
    if (DRIVE_FILE_ID) {
      try {
        context = await fetchDriveFileContent(DRIVE_FILE_ID);
      } catch (err) {
        console.warn("⚠️ Drive fetch failed:", err.message);
        context = "";
      }
    }

    // Build prompt
    const systemPrompt = `You are Collision-IQ's helpful assistant. Be concise and accurate.`;
    const prompt = `${systemPrompt}\n\nContext:\n${context}\n\nUser: ${text}`;

    // Run Gemini
    const reply = await runGemini(prompt);

    return res.json({ reply: reply?.trim() || "(empty reply)" });
  } catch (err) {
    console.error("❌ Chat error:", err);
    return res.status(500).json({ error: "server_error", details: err.message });
  }
});

/* ------------------- Start Server ------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ API listening on port ${PORT}`);
});