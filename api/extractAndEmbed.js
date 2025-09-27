import { google } from "googleapis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPdfText } from "./getPdfText.js";
import { getDocText } from "./getDocText.js";

/* ----------------- CONFIG ----------------- */
const DRIVE_FILE_ID = "1xoFF0VuqR_mCXgH9QkcI5xifWlTCmY7N";
const KEYFILE_PATH = "./service-account.json";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ----------------- GOOGLE DRIVE ----------------- */
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

/* ----------------- TEXT CHUNKING ----------------- */
function chunkText(text, chunkSize = 500) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  return chunks;
}

/* ----------------- GEMINI EMBEDDINGS ----------------- */
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent({ content: text });
  return result.embedding.values;
}

/* ----------------- MAIN ----------------- */
(async () => {
  try {
    console.log("🔹 Checking file type...");
    const file = await drive.files.get({
      fileId: DRIVE_FILE_ID,
      fields: "id, name, mimeType",
    });
    console.log("File Info:", file.data);

    let text;
    if (file.data.mimeType === "application/vnd.google-apps.document") {
      console.log("📄 Google Doc detected");
      text = await getDocText(DRIVE_FILE_ID);
    } else if (file.data.mimeType === "application/pdf") {
      console.log("📕 PDF detected");
      text = await getPdfText(DRIVE_FILE_ID);
    } else {
      throw new Error(`Unsupported file type: ${file.data.mimeType}`);
    }

    console.log("✅ Extracted text length:", text.length);

    const chunks = chunkText(text);
    console.log("✅ Created", chunks.length, "chunks");

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i]);
      console.log(`Chunk ${i + 1} vector length:`, embedding.length);
    }

    console.log("🎉 Done! You now have embeddings ready for storage.");
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();