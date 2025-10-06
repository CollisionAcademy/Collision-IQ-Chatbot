// client/src/api.js
export async function sendMessage(message) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error: ${error}`);
  }

  return await res.json();
}