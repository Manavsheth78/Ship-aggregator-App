import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.js";
import { shipmentRouter } from "./routes/shipments.js";
import { trackRouter } from "./routes/track.js";
import { startBackgroundWorker } from "./workers/shipmentWorker.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/shipments", shipmentRouter);
app.use("/track", trackRouter);

app.get("/health", (_, res) => res.json({ status: "ok" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startBackgroundWorker();
});
