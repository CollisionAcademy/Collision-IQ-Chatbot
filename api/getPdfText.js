import fs from "fs";
import pdfParse from "pdf-parse";
import { google } from "googleapis";

const KEYFILE_PATH = "./service-account.json";

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

export async function getPdfText(fileId) {
  try {
    console.log("🔹 Downloading PDF from Drive, fileId:", fileId);

    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    console.log("🔹 Drive response status:", res.status);

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
  } catch (err) {
    console.error("❌ Failed to fetch PDF from Drive");
    console.error("Error details:", err.response ? err.response.data : err);
    throw err;
  }
}