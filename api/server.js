import express from "express";
import cors from "cors";

const app = express();

// --- CORS allowlist ---
const allowedOrigins = new Set([
  "https://collision-iq.com",
  "https://www.collision-iq.com"
  "https://api.collision-iq.com",
]);
const corsOptions = {
  origin: (origin, cb) =>
    !origin || allowedOrigins.has(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS")),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

// Allow only your project's Vercel preview URLs like:
// https://collision-iq-frontend-<hash>.vercel.app
const previewRegex = /^https:\/\/collision-iq-frontend-[a-z0-9-]+\.vercel\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;            // curl/postman
  if (allowedOrigins.has(origin)) return true;
  if (previewRegex.test(origin)) return true;
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