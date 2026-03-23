import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.js";
import { shipmentRouter } from "./routes/shipments.js";
import { trackRouter } from "./routes/track.js";
import { startBackgroundWorker } from "./workers/shipmentWorker.js";
import compression from "compression";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

console.log("FedEx env vars:", {
  FEDEX_CLIENT_ID: !!process.env.FEDEX_CLIENT_ID,
  FEDEX_CLIENT_SECRET: !!process.env.FEDEX_CLIENT_SECRET,
});

const app = express();
const PORT = process.env.PORT || 3002;
app.use(compression());

// app.use(cors({ origin: "http://localhost:5173", credentials: true }));
// app.use(cors());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/shipments", shipmentRouter);
app.use("/api/track", trackRouter);

app.get("/health", (_, res) => res.json({ status: "ok" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Block sensitive files - add these BEFORE app.use(express.static(...))
app.get("/.env", (req, res) => res.status(404).json({ error: "Not found" }));
app.get("/.git*", (req, res) => res.status(404).json({ error: "Not found" }));
app.get("/package.json", (req, res) =>
  res.status(404).json({ error: "Not found" }),
);

// Serve React build
app.use(
  express.static(path.join(__dirname, "../../frontend/dist"), {
    maxAge: "7d",
    etag: true,
  }),
);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startBackgroundWorker();
});
