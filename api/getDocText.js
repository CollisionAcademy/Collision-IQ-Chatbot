import { google } from "googleapis";

const KEYFILE_PATH = "./service-account.json";

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

export async function getDocText(fileId) {
  const res = await drive.files.export({
    fileId,
    mimeType: "text/plain",
  });
  return res.data;
}