/**
 * A2UI Chat Demo — Express server entry point
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// API routes
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
