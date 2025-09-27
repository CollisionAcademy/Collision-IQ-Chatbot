import { google } from "googleapis";

const KEYFILE_PATH = "./service-account.json"; // Path to your JSON key

async function checkAuth() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE_PATH,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const client = await auth.getClient();
    const projectId = await auth.getProjectId();

    console.log("✅ Service account authenticated!");
    console.log("📧 Email:", client.email || "Could not fetch email");
    console.log("📂 Project ID:", projectId);
  } catch (err) {
    console.error("❌ Error checking service account:", err.message);
  }
}

checkAuth();