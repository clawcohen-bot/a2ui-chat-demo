# A2UI Chat Demo

A minimal monorepo demonstrating [A2UI v0.9](https://a2ui.dev) — interactive UI surfaces rendered inline inside a chat conversation with Claude.

## What it does

You chat with Claude. When you ask for a form, product cards, or any structured interaction, Claude calls `render_ui_surface` with a JSON payload describing A2UI components. The frontend renders these inline next to the text response. Actions (button clicks, etc.) are sent back to Claude as a new user message with the action metadata attached.

```
User: "Show me a restaurant booking form"
Claude: [calls render_ui_surface] "Here's a booking form for you!"
→ DateTimePicker, ChoicePicker (party size), Button rendered in-chat
User clicks "Confirm Booking" → Claude gets the action event
```

## Stack

| Layer | Tech |
|---|---|
| Agent | Claude via `@anthropic-ai/sdk`, streaming |
| Transport | Express + SSE |
| UI | React 18 + Vite + Tailwind CSS |
| A2UI rendering | Custom `@a2ui-demo/renderer` (flat adjacency list, data binding) |
| Types | `@a2ui-demo/shared` (full A2UI v0.9 TypeScript types) |
| Monorepo | pnpm workspaces |

## Project structure

```
apps/
  server/          Express API + Claude agent
    src/
      index.ts     Entry point, CORS, routing
      routes/chat.ts  POST /api/chat → SSE stream
      agent/
        claude.ts  Anthropic SDK + render_ui_surface tool
        prompts.ts System prompt with A2UI v0.9 schema & examples
  web/             React frontend
    src/
      App.tsx      Full-height chat layout
      api.ts       SSE stream client
      hooks/useChat.ts  Chat state (messages, streaming)
      components/
        Message.tsx     Bubble + A2UI surface
        SurfaceHost.tsx A2UIRenderer wrapper
        ChatInput.tsx   Textarea with auto-grow

packages/
  shared/          A2UI v0.9 TypeScript types + type guards
  catalog/         React UI components (TextBlock, Button, Card, etc.)
  renderer/        A2UIRenderer — processes A2UI messages, renders component tree
```

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Add your API key
cp .env.example apps/server/.env
# edit apps/server/.env and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Start dev servers (server on :3001, web on :5173)
pnpm dev
```

Open http://localhost:5173 and start chatting.

## A2UI v0.9 quick reference

Claude emits an array of messages to `render_ui_surface`:

```jsonc
[
  // 1. Create the surface
  { "version": "v0.9", "createSurface": { "surfaceId": "booking", "catalogId": "mycompany.com:demo-catalog", "theme": { "primaryColor": "#6366f1" } } },

  // 2. Define components (FLAT array, no nesting)
  { "version": "v0.9", "updateComponents": { "surfaceId": "booking", "components": [
    { "id": "root", "component": "Card", "child": "col" },
    { "id": "col", "component": "Column", "children": ["title", "date", "btn"] },
    { "id": "title", "component": "Text", "text": "Book a table", "variant": "h1" },
    { "id": "date", "component": "DateTimeInput", "label": "When?", "enableDate": true, "enableTime": true },
    { "id": "btn", "component": "Button", "label": "Confirm", "variant": "primary", "action": { "event": { "name": "confirm_booking" } } }
  ]}}
]
```

## Key design decisions

- **Flat adjacency list**: Components reference children by ID — no deep nesting in JSON, easier for an LLM to generate correctly.
- **SSE not WebSocket**: One-directional streaming from server to client; simpler for demo purposes.
- **Actions flow back as chat messages**: When the user clicks a button, the action is serialized and attached to the next user `ChatMessage`. Claude sees it and continues the conversation.
- **No dangerouslySetInnerHTML**: The renderer is a pure TypeScript/React component tree; all user-visible strings are text nodes.
