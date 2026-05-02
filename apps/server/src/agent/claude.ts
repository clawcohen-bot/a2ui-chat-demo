/**
 * Claude agent integration with A2UI v0.9 tool support.
 *
 * Streams text deltas and A2UI messages back via callbacks so the
 * route handler can forward them as SSE events.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { A2UIMessage, ChatMessage } from "@a2ui-demo/shared";
import { SYSTEM_PROMPT } from "./prompts";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

/** Called for each text chunk streamed from Claude */
export type OnDelta = (delta: string) => void;

/** Called when Claude uses render_ui_surface — receives each parsed A2UI message */
export type OnA2UI = (msg: A2UIMessage) => void;

/** Called when the turn is fully complete */
export type OnDone = () => void;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "render_ui_surface",
    description:
      "Render an interactive A2UI v0.9 surface in the chat. " +
      "Pass an array of A2UI messages (createSurface, then updateComponents, optionally updateDataModel). " +
      "The surface will be displayed inline next to your text response.",
    input_schema: {
      type: "object" as const,
      properties: {
        messages: {
          type: "array",
          description:
            "Array of A2UI v0.9 message objects. Must start with createSurface, followed by updateComponents.",
          items: { type: "object" },
        },
      },
      required: ["messages"],
    },
  },
];

/**
 * Run one agent turn with the given conversation history.
 * Streams tokens and A2UI events via callbacks.
 */
export async function runAgentTurn(
  history: ChatMessage[],
  onDelta: OnDelta,
  onA2UI: OnA2UI,
  onDone: OnDone
): Promise<void> {
  // Convert ChatMessage[] to Anthropic message format
  const messages: Anthropic.MessageParam[] = history.map((m) => {
    if (m.action) {
      // User message that carries an A2UI action — include action JSON as user content
      return {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text:
              m.content +
              "\n\n[A2UI Action]\n```json\n" +
              JSON.stringify(m.action, null, 2) +
              "\n```",
          },
        ],
      };
    }
    return {
      role: m.role as "user" | "assistant",
      content: m.content,
    };
  });

  const stream = await client.messages.stream({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      onDelta(event.delta.text);
    }

    if (event.type === "content_block_stop") {
      // Check if a tool use block just completed
      const block = stream.currentMessage?.content?.[event.index];
      if (block?.type === "tool_use" && block.name === "render_ui_surface") {
        const input = block.input as { messages?: unknown[] };
        const msgs = input?.messages ?? [];
        for (const rawMsg of msgs) {
          try {
            onA2UI(rawMsg as A2UIMessage);
          } catch {
            // skip malformed message
          }
        }
      }
    }
  }

  onDone();
}
