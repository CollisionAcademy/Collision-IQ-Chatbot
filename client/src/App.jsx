// api/server.js
import express from "express";
import cors from "cors";

const app = express();

// --- CORS allowlist ---
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://collision-iq.com",
  "https://www.collision-iq.com",
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;                  // curl/postman
  if (allowedOrigins.has(origin)) return true;
  // allow any vercel.app preview for now
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}

const corsOptions = {
  origin: (origin, cb) => (isAllowedOrigin(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"))),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// --- Health endpoints (Cloud Run/Load balancers use these) ---
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/_ah/health", (_req, res) => res.status(200).send("ok"));

// --- Root landing ---
app.get("/", (_req, res) => {
  res.type("text/plain").send("API is running!");
});

// --- Chat handler (replace with your model call when ready) ---
async function chatHandler(req, res) {
  try {
    const { message, messages } = req.body ?? {};
    const text = message ?? messages?.[0]?.content ?? "";
    const reply = text ? `Echo: ${text}` : "Hello from API";
    res.json({ reply });
  } catch (err) {
    console.error("chat error:", err);
    res.status(500).json({ error: "server_error" });
  }
}

// Canonical path:
app.post("/api/messages", chatHandler);
// Optional compatibility alias:
app.post("/chat", chatHandler);

// --- Start server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});