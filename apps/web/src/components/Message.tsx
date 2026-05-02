/**
 * Renders a single chat message (user or assistant) with optional A2UI surface.
 */

import React from "react";
import type { A2UIAction } from "@a2ui-demo/shared";
import type { DisplayMessage } from "../hooks/useChat";
import { SurfaceHost } from "./SurfaceHost";

interface MessageProps {
  message: DisplayMessage;
  onAction: (action: A2UIAction) => void;
}

export function Message({ message, onAction }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Avatar label */}
        <span className="text-xs text-gray-400 mb-1 px-1">
          {isUser ? "You" : "Assistant"}
        </span>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-indigo-600 text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm"
          }`}
        >
          {message.content}
          {message.streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current opacity-70 animate-pulse rounded-sm" />
          )}
        </div>

        {/* A2UI surfaces — only for assistant messages */}
        {!isUser && message.a2uiMessages.length > 0 && (
          <div className="w-full mt-2">
            <SurfaceHost messages={message.a2uiMessages} onAction={onAction} />
          </div>
        )}
      </div>
    </div>
  );
}
