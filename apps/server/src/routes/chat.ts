/**
 * POST /api/chat
 *
 * Accepts a JSON body { messages: ChatMessage[] } and responds with
 * a Server-Sent Events stream of SSEPayload objects.
 *
 * Event types emitted:
 *   data: {"delta":"..."}            — text chunk
 *   data: {"version":"v0.9",...}     — A2UI message (createSurface / updateComponents / etc.)
 *   data: {}                         — done sentinel
 */

import { Router, Request, Response } from "express";
import type { ChatMessage } from "../agent/claude.js";
import { runAgentTurn } from "../agent/claude.js";

export const chatRouter = Router();

chatRouter.post("/", async (req: Request, res: Response) => {
  const { messages } = req.body as { messages: ChatMessage[] };

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages must be an array" });
    return;
  }

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    await runAgentTurn(
      messages,
      (delta) => send({ delta }),
      (a2uiMsg) => send(a2uiMsg),
      () => send({})
    );
  } catch (err) {
    console.error("[chat route] error:", err);
    send({ delta: "\n\n[Error: " + String(err) + "]" });
    send({});
  }

  res.end();
});
