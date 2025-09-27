import fs from "fs";
import pdfParse from "pdf-parse";
import { google } from "googleapis";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ----------------- CONFIG ----------------- */
const DRIVE_FILE_ID = "1xoFF0VuqR_mCXgH9QkcI5xifWlTCmY7N"; // real Drive file ID
const KEYFILE_PATH = "./service-account.json";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ----------------- GOOGLE DRIVE ----------------- */
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

/* Google Docs → plain text */
async function getDocText(fileId) {
  const res = await drive.files.export({
    fileId,
    mimeType: "text/plain",
  });
  return res.data;
}

/* PDFs → download from Drive, parse with pdf-parse */
async function getPdfText(fileId) {
  console.log("🔹 Downloading PDF from Drive:", fileId);
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  const tempFile = "temp.pdf";
  const dest = fs.createWriteStream(tempFile);

  await new Promise((resolve, reject) => {
    res.data.pipe(dest).on("finish", resolve).on("error", reject);
  });

  console.log("✅ PDF downloaded, now parsing...");
  const dataBuffer = fs.readFileSync(tempFile);
  const parsed = await pdfParse(dataBuffer);
  fs.unlinkSync(tempFile);

  return parsed.text;
}

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
      text = await getDocText(DRIVE_FILE_ID);
    } else if (file.data.mimeType === "application/pdf") {
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
    console.error("❌ Error:", err.message);
  }
})();