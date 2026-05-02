/**
 * Root application component — full-height chat layout.
 */

import React, { useEffect, useRef } from "react";
import { useChat } from "./hooks/useChat";
import { Message } from "./components/Message.tsx";
import { ChatInput } from "./components/ChatInput.tsx";

export default function App() {
  const { messages, isLoading, sendMessage, handleAction, reset } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">A2UI Chat Demo</h1>
            <p className="text-xs text-gray-500">Powered by Claude + A2UI v0.9</p>
          </div>
        </div>
        <button
          onClick={reset}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          New chat
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              A2UI v0.9 Chat Demo
            </h2>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              Ask me to show you a booking form, product cards, a survey, or
              any interactive UI. I'll render it right here in the chat.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                "Show me a restaurant booking form",
                "Display 3 coffee product cards",
                "Make a simple feedback survey",
                "Create a slider for quantity",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="text-xs px-3 py-2 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} onAction={handleAction} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Input */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
