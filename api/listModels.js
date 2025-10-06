import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    console.log("✅ Available models:");
    data.models.forEach(m => console.log(m.name));
  } catch (err) {
    console.error("❌ Error fetching models:", err.message);
  }
}

listModels();