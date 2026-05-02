/**
 * Renders A2UI surfaces for a single assistant message turn.
 *
 * Uses the official @a2ui/react and @a2ui/web_core packages.
 */

import React, { useEffect, useRef, useState } from "react";
import { A2uiSurface } from "@a2ui/react/v0_9";
import type { ReactComponentImplementation } from "@a2ui/react/v0_9";
import { MessageProcessor } from "@a2ui/web_core/v0_9";
import { basicCatalog, myCatalog } from "@a2ui-demo/catalog";
import type { A2uiMessage, A2uiClientAction } from "@a2ui/web_core/v0_9";
import type { SurfaceModel } from "@a2ui/web_core/v0_9";

interface SurfaceHostProps {
  messages: A2uiMessage[];
  onAction: (action: A2uiClientAction) => void;
}

export function SurfaceHost({ messages, onAction }: SurfaceHostProps) {
  const [surfaces, setSurfaces] = useState<SurfaceModel<ReactComponentImplementation>[]>([]);
  const processorRef = useRef<MessageProcessor<ReactComponentImplementation> | null>(null);
  const processedCountRef = useRef(0);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  // Create the processor once
  useEffect(() => {
    const processor = new MessageProcessor<ReactComponentImplementation>(
      [basicCatalog, myCatalog],
      (action: A2uiClientAction) => onActionRef.current(action)
    );

    const createdSub = processor.onSurfaceCreated((surface) => {
      setSurfaces((prev) => [...prev, surface]);
    });

    const deletedSub = processor.onSurfaceDeleted((id) => {
      setSurfaces((prev) => prev.filter((s) => s.id !== id));
    });

    processorRef.current = processor;
    processedCountRef.current = 0;

    return () => {
      createdSub.unsubscribe();
      deletedSub.unsubscribe();
      processor.model.dispose();
      processorRef.current = null;
    };
  }, []);

  // Feed new messages incrementally
  useEffect(() => {
    const processor = processorRef.current;
    if (!processor) return;
    const start = processedCountRef.current;
    if (start >= messages.length) return;
    const newMsgs = messages.slice(start);
    processor.processMessages(newMsgs);
    processedCountRef.current = messages.length;
  }, [messages]);

  if (surfaces.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-4">
      {surfaces.map((surface) => (
        <A2uiSurface key={surface.id} surface={surface} />
      ))}
    </div>
  );
}
