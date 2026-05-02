/**
 * Chat state management hook.
 *
 * Tracks the conversation history (text messages + A2UI surfaces)
 * and handles streaming from the server.
 */

import { useState, useCallback, useRef } from "react";
import type { A2uiMessage, A2uiClientAction } from "@a2ui/web_core/v0_9";
import { streamChat } from "../api";

// Wire-format chat message (matches server's ChatMessage shape)
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  action?: A2uiClientAction;
}

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  /** Streamed/final text content */
  content: string;
  /** A2UI messages associated with this turn */
  a2uiMessages: A2uiMessage[];
  /** Whether this message is currently streaming */
  streaming?: boolean;
}

let _id = 0;
const uid = () => String(++_id);

/** Convert display messages to wire format for the server */
function toHistory(displayMessages: DisplayMessage[]): ChatMessage[] {
  return displayMessages
    .filter((m) => m.content.trim() || m.role === "user")
    .map((m) => ({ role: m.role, content: m.content }));
}

export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Keep a ref in sync with state so callbacks can read the latest history
  const messagesRef = useRef<DisplayMessage[]>([]);

  const syncRef = (next: DisplayMessage[]) => {
    messagesRef.current = next;
    return next;
  };

  const sendMessage = useCallback(
    async (text: string, action?: A2uiClientAction) => {
      if (isLoading) return;

      const userMsg: DisplayMessage = {
        id: uid(),
        role: "user",
        content: text,
        a2uiMessages: [],
      };

      const assistantId = uid();
      const assistantMsg: DisplayMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        a2uiMessages: [],
        streaming: true,
      };

      // Build history from current messages + new user message
      const history = toHistory([...messagesRef.current, userMsg]);
      const historyWithAction: ChatMessage[] = action
        ? [...history.slice(0, -1), { ...history[history.length - 1], action }]
        : history;

      // Update state
      setMessages((prev) => syncRef([...prev, userMsg, assistantMsg]));
      setIsLoading(true);

      // Start streaming
      const controller = new AbortController();
      abortRef.current = controller;

      streamChat(
        historyWithAction,
        {
          onDelta: (delta) => {
            setMessages((msgs) =>
              syncRef(
                msgs.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + delta }
                    : m
                )
              )
            );
          },
          onA2UI: (a2uiMsg) => {
            setMessages((msgs) =>
              syncRef(
                msgs.map((m) =>
                  m.id === assistantId
                    ? { ...m, a2uiMessages: [...m.a2uiMessages, a2uiMsg] }
                    : m
                )
              )
            );
          },
          onDone: () => {
            setMessages((msgs) =>
              syncRef(
                msgs.map((m) =>
                  m.id === assistantId ? { ...m, streaming: false } : m
                )
              )
            );
            setIsLoading(false);
          },
          onError: (err) => {
            console.error("[useChat] stream error:", err);
            setMessages((msgs) =>
              syncRef(
                msgs.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: m.content + `\n\n[Error: ${err.message}]`,
                        streaming: false,
                      }
                    : m
                )
              )
            );
            setIsLoading(false);
          },
        },
        controller.signal
      );
    },
    [isLoading]
  );

  const handleAction = useCallback(
    (action: A2uiClientAction) => {
      const actionText = `Action triggered: **${action.name}**`;
      sendMessage(actionText, action);
    },
    [sendMessage]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    messagesRef.current = [];
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, handleAction, reset };
}
