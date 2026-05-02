/**
 * API client for the A2UI Chat Demo.
 *
 * Streams SSE from POST /api/chat and calls back with text deltas,
 * A2UI messages, and a done signal.
 */

import type { A2uiMessage } from "@a2ui/web_core/v0_9";
import type { ChatMessage } from "./hooks/useChat";

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onA2UI: (msg: A2uiMessage) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

function isA2UIMessage(payload: unknown): payload is A2uiMessage {
  if (typeof payload !== "object" || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return (
    p["version"] === "v0.9" &&
    (
      "createSurface" in p ||
      "updateComponents" in p ||
      "updateDataModel" in p ||
      "deleteSurface" in p
    )
  );
}

export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  if (!response.ok) {
    callbacks.onError(new Error(`HTTP ${response.status}`));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error("No response body"));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          continue;
        }

        // Done sentinel: empty object {}
        if (typeof payload === "object" && payload !== null && Object.keys(payload).length === 0) {
          callbacks.onDone();
          continue;
        }

        if (
          typeof payload === "object" &&
          payload !== null &&
          "delta" in payload &&
          typeof (payload as { delta: string }).delta === "string"
        ) {
          callbacks.onDelta((payload as { delta: string }).delta);
        } else if (isA2UIMessage(payload)) {
          callbacks.onA2UI(payload);
        }
      }
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  } finally {
    reader.releaseLock();
  }
}
