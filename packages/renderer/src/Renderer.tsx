/**
 * Minimal A2UI v0.9 renderer
 *
 * Processes createSurface / updateComponents / updateDataModel / deleteSurface
 * messages and renders the component tree using catalog React components.
 *
 * Data binding: if a prop value is { path: "/foo/bar" }, it resolves to
 * dataModel["/foo"]["bar"] via JSON Pointer semantics.
 */

import React, { useReducer, useCallback } from "react";
import type {
  A2UIMessage,
  A2UIAction,
  Component,
  ComponentAction,
} from "@a2ui-demo/shared";
import {
  isCreateSurface,
  isUpdateComponents,
  isUpdateDataModel,
  isDeleteSurface,
  isDataBinding,
  A2UI_VERSION,
} from "@a2ui-demo/shared";
import {
  TextBlock,
  Button as CatalogButton,
  TextInput,
  DateTimePicker,
  SelectList,
  Card,
  ProductTile,
} from "@a2ui-demo/catalog";

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

export interface SurfaceState {
  surfaceId: string;
  catalogId?: string;
  theme?: { primaryColor?: string; agentDisplayName?: string };
  /** flat component map keyed by id */
  components: Map<string, Component>;
  /** JSON Pointer data model — nested object */
  dataModel: Record<string, unknown>;
}

type RendererState = Map<string, SurfaceState>;

type RendererAction =
  | { type: "CREATE_SURFACE"; msg: ReturnType<typeof isCreateSurface> extends true ? never : never } & { msg: Parameters<typeof isCreateSurface>[0] }
  | { type: "UPDATE_COMPONENTS"; surfaceId: string; components: Component[] }
  | { type: "UPDATE_DATA_MODEL"; surfaceId: string; path: string; value: unknown }
  | { type: "DELETE_SURFACE"; surfaceId: string };

function applyJsonPointerSet(
  obj: Record<string, unknown>,
  pointer: string,
  value: unknown
): Record<string, unknown> {
  // Split pointer (e.g. "/booking/date" → ["booking", "date"])
  const parts = pointer.replace(/^\//, "").split("/").filter(Boolean);
  if (parts.length === 0) {
    // Replace root
    return value as Record<string, unknown>;
  }
  const result = { ...obj };
  let current: Record<string, unknown> = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    current[key] =
      typeof current[key] === "object" && current[key] !== null
        ? { ...(current[key] as Record<string, unknown>) }
        : {};
    current = current[key] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
  return result;
}

function rendererReducer(
  state: RendererState,
  action: RendererAction
): RendererState {
  switch (action.type) {
    case "CREATE_SURFACE": {
      const { createSurface } = action.msg;
      const next = new Map(state);
      next.set(createSurface.surfaceId, {
        surfaceId: createSurface.surfaceId,
        catalogId: createSurface.catalogId,
        theme: createSurface.theme,
        components: new Map(),
        dataModel: {},
      });
      return next;
    }
    case "UPDATE_COMPONENTS": {
      const surface = state.get(action.surfaceId);
      if (!surface) return state;
      const compMap = new Map<string, Component>();
      for (const c of action.components) {
        compMap.set(c.id, c);
      }
      const next = new Map(state);
      next.set(action.surfaceId, { ...surface, components: compMap });
      return next;
    }
    case "UPDATE_DATA_MODEL": {
      const surface = state.get(action.surfaceId);
      if (!surface) return state;
      const newModel = applyJsonPointerSet(
        surface.dataModel,
        action.path,
        action.value
      );
      const next = new Map(state);
      next.set(action.surfaceId, { ...surface, dataModel: newModel });
      return next;
    }
    case "DELETE_SURFACE": {
      const next = new Map(state);
      next.delete(action.surfaceId);
      return next;
    }
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Data binding resolution
// ---------------------------------------------------------------------------

function resolveJsonPointer(
  model: Record<string, unknown>,
  pointer: string
): unknown {
  const parts = pointer.replace(/^\//, "").split("/").filter(Boolean);
  let current: unknown = model;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function resolveBinding<T>(
  value: T | { path: string } | undefined,
  model: Record<string, unknown>
): T | undefined {
  if (value === undefined || value === null) return undefined;
  if (isDataBinding(value)) {
    return resolveJsonPointer(model, value.path) as T;
  }
  return value as T;
}

// ---------------------------------------------------------------------------
// Component renderer
// ---------------------------------------------------------------------------

interface RenderContext {
  surface: SurfaceState;
  onAction: (action: A2UIAction) => void;
}

function fireAction(
  compAction: ComponentAction | undefined,
  surface: SurfaceState,
  compId: string,
  onAction: (a: A2UIAction) => void
) {
  if (!compAction) return;
  if ("event" in compAction) {
    onAction({
      version: A2UI_VERSION,
      action: {
        name: compAction.event.name,
        surfaceId: surface.surfaceId,
        sourceComponentId: compId,
        timestamp: new Date().toISOString(),
        context: compAction.event.context ?? {},
      },
    });
  } else if ("functionCall" in compAction) {
    const { call, args } = compAction.functionCall;
    if (call === "openUrl" && args?.url && typeof args.url === "string") {
      window.open(args.url, "_blank", "noopener,noreferrer");
    }
  }
}

function renderComponent(
  id: string,
  ctx: RenderContext
): React.ReactElement | null {
  const comp = ctx.surface.components.get(id);
  if (!comp) return null;

  const { dataModel } = ctx.surface;

  switch (comp.component) {
    // ---- Layout ----
    case "Column": {
      const kids = (comp.children ?? (comp.child ? [comp.child] : [])).map(
        (childId) => renderComponent(childId, ctx)
      );
      return React.createElement(
        "div",
        { key: id, className: "flex flex-col gap-3" },
        ...kids
      );
    }
    case "Row": {
      const kids = (comp.children ?? (comp.child ? [comp.child] : [])).map(
        (childId) => renderComponent(childId, ctx)
      );
      return React.createElement(
        "div",
        { key: id, className: "flex flex-row gap-3 flex-wrap" },
        ...kids
      );
    }
    case "List": {
      const kids = (comp.children ?? []).map((childId) =>
        renderComponent(childId, ctx)
      );
      return React.createElement(
        "div",
        { key: id, className: "flex flex-col gap-2" },
        ...kids
      );
    }
    case "Card": {
      const childIds = comp.children ?? (comp.child ? [comp.child] : []);
      const kids = childIds.map((childId) => renderComponent(childId, ctx));
      return React.createElement(
        Card,
        { key: id },
        ...kids
      );
    }
    case "Tabs": {
      // Simple tabs — render all children stacked (full tabs UI is out of scope)
      const kids = (comp.children ?? []).map((childId) =>
        renderComponent(childId, ctx)
      );
      return React.createElement(
        "div",
        { key: id, className: "flex flex-col gap-2" },
        ...kids
      );
    }
    case "Modal": {
      const childIds = comp.children ?? (comp.child ? [comp.child] : []);
      const kids = childIds.map((childId) => renderComponent(childId, ctx));
      return React.createElement(
        "div",
        {
          key: id,
          className:
            "fixed inset-0 bg-black/40 flex items-center justify-center z-50",
        },
        React.createElement(
          "div",
          { className: "bg-white rounded-xl shadow-xl p-6 max-w-md w-full" },
          ...kids
        )
      );
    }
    case "Divider":
      return React.createElement("hr", {
        key: id,
        className: "border-gray-200 my-1",
      });

    // ---- Display ----
    case "Text": {
      const text = resolveBinding<string>(comp.text, dataModel) ?? "";
      const variant = comp.variant ?? "body";
      // Map A2UI variants to TextBlock variants
      const blockVariant: "h1" | "h2" | "body" =
        variant === "h1"
          ? "h1"
          : variant === "h2" || variant === "h3"
          ? "h2"
          : "body";
      return React.createElement(TextBlock, {
        key: id,
        text,
        variant: blockVariant,
      });
    }
    case "Image": {
      const url = resolveBinding<string>(comp.url, dataModel) ?? "";
      return React.createElement("img", {
        key: id,
        src: url,
        alt: comp.description ?? "",
        className: "rounded-lg max-w-full object-cover",
        style: comp.fit ? { objectFit: comp.fit } : undefined,
      });
    }
    case "Icon":
      return React.createElement(
        "span",
        { key: id, className: "text-lg select-none", "aria-label": comp.name },
        comp.name
      );
    case "Video":
      return React.createElement("video", {
        key: id,
        src: comp.url,
        controls: true,
        className: "rounded-lg max-w-full",
      });
    case "AudioPlayer":
      return React.createElement("audio", {
        key: id,
        src: comp.url,
        controls: true,
        className: "w-full",
      });

    // ---- Input ----
    case "Button": {
      // Render child/children inline or fall back to label
      const childIds = comp.children ?? (comp.child ? [comp.child] : []);
      const hasChildren = childIds.length > 0;
      const label =
        !hasChildren && comp.label
          ? comp.label
          : hasChildren
          ? undefined
          : "OK";
      const variant =
        comp.variant === "primary" || comp.variant === "borderless"
          ? "primary"
          : "secondary";

      if (hasChildren) {
        const kids = childIds.map((cid) => renderComponent(cid, ctx));
        return React.createElement(
          "button",
          {
            key: id,
            className:
              variant === "primary"
                ? "inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                : "inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors",
            onClick: () => fireAction(comp.action, ctx.surface, id, ctx.onAction),
          },
          ...kids
        );
      }

      return React.createElement(CatalogButton, {
        key: id,
        label: label ?? "OK",
        variant,
        onClick: () => fireAction(comp.action, ctx.surface, id, ctx.onAction),
      });
    }
    case "TextField": {
      const value = resolveBinding<string | number>(comp.value, dataModel);
      const type =
        comp.variant === "number"
          ? "number"
          : comp.variant === "obscured"
          ? "password"
          : "text";
      if (comp.variant === "longText") {
        return React.createElement(
          "div",
          { key: id, className: "flex flex-col gap-1" },
          comp.label
            ? React.createElement(
                "label",
                { className: "text-sm font-medium text-gray-700" },
                comp.label
              )
            : null,
          React.createElement("textarea", {
            className:
              "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none",
            rows: 3,
            defaultValue: value !== undefined ? String(value) : "",
            placeholder: comp.placeholder,
          })
        );
      }
      return React.createElement(TextInput, {
        key: id,
        label: comp.label ?? "",
        placeholder: comp.placeholder,
        value: value !== undefined ? String(value) : "",
      });
      void type; // suppress unused warning — handled by TextInput
    }
    case "CheckBox": {
      const checked = resolveBinding<boolean>(comp.value, dataModel) ?? false;
      return React.createElement(
        "label",
        { key: id, className: "flex items-center gap-2 cursor-pointer" },
        React.createElement("input", {
          type: "checkbox",
          className: "w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500",
          defaultChecked: checked,
        }),
        comp.label
          ? React.createElement(
              "span",
              { className: "text-sm text-gray-700" },
              comp.label
            )
          : null
      );
    }
    case "ChoicePicker": {
      const value = resolveBinding<string>(comp.value as Bindable<string>, dataModel) ?? "";
      const options = comp.options ?? [];
      return React.createElement(SelectList, {
        key: id,
        label: comp.label ?? "",
        options,
        value,
      });
    }
    case "Slider": {
      const value = resolveBinding<number>(comp.value, dataModel) ?? comp.min ?? 0;
      return React.createElement(
        "div",
        { key: id, className: "flex flex-col gap-1" },
        comp.label
          ? React.createElement(
              "label",
              { className: "text-sm font-medium text-gray-700" },
              `${comp.label}: ${value}`
            )
          : null,
        React.createElement("input", {
          type: "range",
          min: comp.min ?? 0,
          max: comp.max ?? 100,
          defaultValue: value,
          className: "w-full accent-indigo-600",
        })
      );
    }
    case "DateTimeInput": {
      const value = resolveBinding<string>(comp.value, dataModel) ?? "";
      const mode =
        comp.enableDate && comp.enableTime
          ? "datetime"
          : comp.enableDate
          ? "date"
          : "time";
      return React.createElement(DateTimePicker, {
        key: id,
        label: comp.label ?? "Date/Time",
        value,
        mode,
      });
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface A2UIRendererProps {
  /** All A2UI messages received so far (passed from parent) */
  messages: A2UIMessage[];
  /** Called when the user triggers a component action */
  onAction: (action: A2UIAction) => void;
}

export function A2UIRenderer({ messages, onAction }: A2UIRendererProps) {
  const [state, dispatch] = useReducer(
    rendererReducer,
    new Map() as RendererState
  );

  // Process incoming messages. We re-process from scratch each time the
  // messages array changes — simple and correct for our demo scale.
  const processedRef = React.useRef<number>(0);

  React.useEffect(() => {
    const start = processedRef.current;
    for (let i = start; i < messages.length; i++) {
      const msg = messages[i];
      if (isCreateSurface(msg)) {
        dispatch({ type: "CREATE_SURFACE", msg });
      } else if (isUpdateComponents(msg)) {
        dispatch({
          type: "UPDATE_COMPONENTS",
          surfaceId: msg.updateComponents.surfaceId,
          components: msg.updateComponents.components,
        });
      } else if (isUpdateDataModel(msg)) {
        dispatch({
          type: "UPDATE_DATA_MODEL",
          surfaceId: msg.updateDataModel.surfaceId,
          path: msg.updateDataModel.path,
          value: msg.updateDataModel.value,
        });
      } else if (isDeleteSurface(msg)) {
        dispatch({
          type: "DELETE_SURFACE",
          surfaceId: msg.deleteSurface.surfaceId,
        });
      }
    }
    processedRef.current = messages.length;
  }, [messages]);

  const handleAction = useCallback(
    (action: A2UIAction) => onAction(action),
    [onAction]
  );

  if (state.size === 0) return null;

  return React.createElement(
    "div",
    { className: "flex flex-col gap-4" },
    ...[...state.values()].map((surface) => {
      const rootComp = [...surface.components.values()].find(
        (c) => c.id === "root"
      );
      if (!rootComp) return null;
      const ctx: RenderContext = { surface, onAction: handleAction };
      return React.createElement(
        "div",
        {
          key: surface.surfaceId,
          className:
            "rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm",
          style: surface.theme?.primaryColor
            ? ({ "--color-primary": surface.theme.primaryColor } as React.CSSProperties)
            : undefined,
        },
        renderComponent("root", ctx)
      );
    })
  );
}

// Re-export state utilities for tests
export { applyJsonPointerSet, resolveJsonPointer };

// Bindable type alias for internal use
type Bindable<T> = T | { path: string };
