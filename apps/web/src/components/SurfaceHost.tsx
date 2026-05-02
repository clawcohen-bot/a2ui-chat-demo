/**
 * Renders A2UI surfaces for a single assistant message turn.
 */

import React from "react";
import type { A2UIMessage, A2UIAction } from "@a2ui-demo/shared";
import { A2UIRenderer } from "@a2ui-demo/renderer";

interface SurfaceHostProps {
  messages: A2UIMessage[];
  onAction: (action: A2UIAction) => void;
}

export function SurfaceHost({ messages, onAction }: SurfaceHostProps) {
  if (messages.length === 0) return null;

  return (
    <div className="mt-3">
      <A2UIRenderer messages={messages} onAction={onAction} />
    </div>
  );
}
