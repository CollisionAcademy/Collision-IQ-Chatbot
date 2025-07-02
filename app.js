const API_URL = 'https://collision-chatbot-xyz.a.run.app'; // Replace with your Cloud Run endpoint

async function sendMessage() {
  const input = document.getElementById("userInput").value.trim();
  const lang = document.getElementById("langSelect").value;

  if (!input) return;

  appendMessage("user", input);
  document.getElementById("userInput").value = "";
  appendMessage("bot", "Typing...");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, language: lang })
    });

    const data = await response.json();
    updateLastBotMessage(data.reply);
  } catch (err) {
    updateLastBotMessage("⚠️ Failed to reach server.");
  }
}

function appendMessage(sender, text) {
  const log = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = sender;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function updateLastBotMessage(text) {
  const log = document.getElementById("chatLog");
  const last = [...log.getElementsByClassName("bot")].pop();
  if (last) last.textContent = text;
}
