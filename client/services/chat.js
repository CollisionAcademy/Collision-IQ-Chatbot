const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function sendMessage(message) {
  try {
    console.log("📡 Using API URL:", API_URL);

    const response = await fetch(`${API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Response not OK:", response.status, response.statusText, errText);
      throw new Error(`HTTP ${response.status} — ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Reply received:", data.reply);
    return data.reply || "(empty reply)";
  } catch (err) {
    console.error("💥 Chat API request failed:", err);
    return `Error: ${err.message || "Failed to fetch"}`;
  }
}