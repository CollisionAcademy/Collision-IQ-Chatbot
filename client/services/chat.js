// client/services/chat.js
// Handles all chat requests to your backend API

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Sends a message to the backend Gemini chat API
 * @param {string} message - The user’s chat message
 * @returns {Promise<string>} - The model's reply text
 */
export async function sendMessage(message) {
  try {
    console.log("💬 Sending message to backend:", message);

    const response = await fetch(`${API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    // handle network issues
    if (!response.ok) {
      console.error("❌ Backend error:", response.status, response.statusText);
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    console.log("🤖 Server reply received:", data);
    return data.reply || "(no response)";
  } catch (err) {
    console.error("🚨 Chat API request failed:", err);
    return "There was an error connecting to the Collision-IQ Chatbot API.";
  }
}