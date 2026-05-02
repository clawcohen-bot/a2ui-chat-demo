/**
 * API client for the A2UI Chat Demo.
 *
 * Streams SSE from POST /api/chat and calls back with text deltas,
 * A2UI messages, and a done signal.
 */

import type { A2UIMessage, ChatMessage, SSEPayload } from "@a2ui-demo/shared";
import { isCreateSurface, isUpdateComponents, isUpdateDataModel, isDeleteSurface } from "@a2ui-demo/shared";

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onA2UI: (msg: A2UIMessage) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

function isA2UIMessage(payload: SSEPayload): payload is A2UIMessage {
  return (
    isCreateSurface(payload as A2UIMessage) ||
    isUpdateComponents(payload as A2UIMessage) ||
    isUpdateDataModel(payload as A2UIMessage) ||
    isDeleteSurface(payload as A2UIMessage)
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

        let payload: SSEPayload;
        try {
          payload = JSON.parse(raw) as SSEPayload;
        } catch {
          continue;
        }

        // Done sentinel: empty object {}
        if (Object.keys(payload).length === 0) {
          callbacks.onDone();
          continue;
        }

        if ("delta" in payload && typeof (payload as { delta: string }).delta === "string") {
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
