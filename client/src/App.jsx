import React, { useState } from "react";

const apiBase = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
if (!apiBase) throw new Error("Missing API base URL. Set VITE_API_URL.");
const ENDPOINT = "/api/messages";

function pickReply(data) {
  return (
    data?.reply ??
    data?.message ??
    data?.text ??
    data?.output ??
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    ""
  );
}

async function postOnce(message, onMeta) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const started = performance.now();
    const res = await fetch(`${apiBase}${ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    const ms = Math.round(performance.now() - started);
    const contentType = res.headers.get("content-type") || "";
    onMeta?.({ status: res.status, ms, contentType });

    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${JSON.stringify(data).slice(0,200)}`);
      const reply = pickReply(data);
      return (reply && String(reply).trim()) || "(empty reply)";
    }
    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${raw.slice(0,200)}`);
    if (/^\s*<!doctype html/i.test(raw)) return "(server returned HTML; check VITE_API_URL + ENDPOINT)";
    return raw.trim() || "(empty reply)";
  } finally {
    clearTimeout(timeout);
  }
}

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPost, setLastPost] = useState(null);

  async function sendMessage() {
    const msg = input.trim();
    if (!msg || loading) return;
    setMessages((m) => m.concat({ sender: "You", text: msg }));
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const reply = await postOnce(msg, (meta) => setLastPost(meta));
      setMessages((m) => m.concat({ sender: "Bot", text: reply }));
    } catch (e) {
      console.error(e);
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui, Arial, sans-serif" }}>
      <h1 style={{ marginTop: 0 }}>
        Collision-IQ Chatbot
        {!import.meta.env.PROD ? <span style={{ color: "#2ecc71" }}> — DEBUG BUILD ✅</span> : null}
      </h1>

      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
        API_BASE: {apiBase}
        {lastPost ? `  |  Last POST: ${lastPost.status} (${lastPost.ms}ms)` : null}
      </div>

      <div style={{ minHeight: 260, border: "1px solid #ccc", padding: 10, whiteSpace: "pre-wrap", overflowY: "auto", borderRadius: 6 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "6px 0" }}>
            <strong>{m.sender}:</strong> {m.text}
          </div>
        ))}
        {loading && <div style={{ color: "#888" }}>Sending…</div>}
        {error && <div style={{ color: "#b00020" }}>Error: {error}</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          id="chat-input"
          name="message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message…"
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}import React, { useState } from "react";

// ---- One source of truth for the API base (strip trailing slash) ----
const apiBase = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
if (!apiBase) throw new Error("Missing API base URL. Set VITE_API_URL in your env.");

const ENDPOINT = "/api/messages"; // canonical path used by the server

function extractReplyFromJSON(data) {
  return (
    data?.reply ??
    data?.message ??
    data?.text ??
    data?.output ??
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    ""
  );
}

async function postOnce(message, onMeta) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const started = performance.now();
    const res = await fetch(`${apiBase}${ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    const ms = Math.round(performance.now() - started);
    const contentType = res.headers.get("content-type") || "";
    onMeta?.({ status: res.status, ms, contentType });

    // Prefer JSON if the server sent it
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${JSON.stringify(data).slice(0, 200)}`);
      const reply = extractReplyFromJSON(data);
      return (reply && String(reply).trim()) || "(empty reply)";
    }

    // Fallback to text for visibility
    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${raw.slice(0, 200)}`);
    if (/^\s*<!doctype html/i.test(raw)) return "(server returned HTML; check VITE_API_URL + ENDPOINT)";
    return raw.trim() || "(empty reply)";
  } finally {
    clearTimeout(timeout);
  }
}

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // [{sender, text}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPost, setLastPost] = useState(null); // {status, ms, contentType}

  async function sendMessage() {
    const msg = input.trim();
    if (!msg || loading) return;

    setMessages((m) => m.concat({ sender: "You", text: msg }));
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await postOnce(msg, (meta) => setLastPost(meta));
      setMessages((m) => m.concat({ sender: "Bot", text: reply }));
    } catch (e) {
      console.error(e);
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui, Arial, sans-serif" }}>
      {/* Dev-only debug line (hidden in prod) */}
      {!import.meta.env.PROD && (
       <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
        API_BASE: {apiBase}{lastPost ? ` |  Last POST: ${lastPost.status} (${lastPost.ms}ms)` : null}
       </div>
      )}

      <div
        style={{
          minHeight: 260,
          border: "1px solid #ccc",
          padding: 10,
          whiteSpace: "pre-wrap",
          overflowY: "auto",
          borderRadius: 6,
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "6px 0" }}>
            <strong>{m.sender}:</strong> {m.text}
          </div>
        ))}
        {loading && <div style={{ color: "#888" }}>Sending…</div>}
        {error && <div style={{ color: "#b00020" }}>Error: {error}</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          id="chat-input"
          name="message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message…"
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}