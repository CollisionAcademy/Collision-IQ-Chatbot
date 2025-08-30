// api/server.js
import express from "express";
import cors from "cors";

const app = express();
app.set("trust proxy", 1);

// ⬇️ CORS config (put your snippet here)
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://collision-iq.com",
  "https://www.collision-iq.com",
  "https://collision-iq-frontend.vercel.app", // keep your stable alias
]);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);               // curl/postman
    if (allowedOrigins.has(origin)) return cb(null, true);
    if (origin.endsWith(".vercel.app")) return cb(null, true); // any vercel preview
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Health + root
app.get("/_ah/health", (req, res) => res.status(200).send("ok"));
app.get("/healthz", (req, res) => res.status(200).send("ok"));
app.get("/", (req, res) => res.status(200).send("API is running!"));

// Chat handler (accepts {message} or {messages:[{content}]})
const chatHandler = async (req, res) => {
  const msg = req.body?.message ?? req.body?.messages?.[0]?.content ?? "";
  res.json({ reply: msg ? `Echo: ${msg}` : "Hello from Collision-IQ API" });
};

app.post("/api/messages", chatHandler); // canonical
app.post("/api/message", chatHandler);  // alias
app.post("/chat", chatHandler);         // legacy alias

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on ${port}`));