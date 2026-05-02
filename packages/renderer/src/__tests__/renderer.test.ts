/**
 * Unit tests for A2UI v0.9 renderer utilities
 *
 * Test 1: resolves adjacency list correctly (root → children)
 * Test 2: applies data model bindings (path resolution)
 */

import { applyJsonPointerSet, resolveJsonPointer } from "../Renderer";
import type {
  Component,
  UpdateComponentsMessage,
} from "@a2ui-demo/shared";

// ---------------------------------------------------------------------------
// Test 1: Adjacency list — root resolves to its children
// ---------------------------------------------------------------------------

describe("Adjacency list resolution", () => {
  const components: Component[] = [
    {
      id: "root",
      component: "Column",
      children: ["title", "submit-btn"],
    },
    {
      id: "title",
      component: "Text",
      text: "Book a table",
      variant: "h1",
    },
    {
      id: "submit-btn",
      component: "Button",
      child: "btn-label",
      variant: "primary",
      action: { event: { name: "confirm_booking" } },
    },
    {
      id: "btn-label",
      component: "Text",
      text: "Confirm",
    },
  ];

  function buildMap(comps: Component[]): Map<string, Component> {
    const map = new Map<string, Component>();
    for (const c of comps) map.set(c.id, c);
    return map;
  }

  it("root component has correct children array", () => {
    const map = buildMap(components);
    const root = map.get("root");
    expect(root).toBeDefined();
    expect(root!.component).toBe("Column");
    if (root!.component === "Column") {
      expect(root!.children).toEqual(["title", "submit-btn"]);
    }
  });

  it("resolves root → children → grandchildren correctly", () => {
    const map = buildMap(components);
    const root = map.get("root");
    expect(root).toBeDefined();

    // Walk root → children
    const rootComp = root as Extract<Component, { component: "Column" }>;
    const childIds = rootComp.children ?? [];
    expect(childIds).toHaveLength(2);

    const title = map.get(childIds[0]);
    expect(title).toBeDefined();
    expect(title!.component).toBe("Text");
    if (title!.component === "Text") {
      expect(title!.text).toBe("Book a table");
    }

    const btn = map.get(childIds[1]);
    expect(btn).toBeDefined();
    expect(btn!.component).toBe("Button");
    if (btn!.component === "Button") {
      // Button has a single child via "child" property
      const grandChildId = btn!.child;
      expect(grandChildId).toBe("btn-label");
      const btnLabel = map.get(grandChildId!);
      expect(btnLabel).toBeDefined();
      if (btnLabel!.component === "Text") {
        expect(btnLabel!.text).toBe("Confirm");
      }
    }
  });

  it("updateComponents message has correct shape", () => {
    const msg: UpdateComponentsMessage = {
      version: "v0.9",
      updateComponents: {
        surfaceId: "booking",
        components,
      },
    };
    expect(msg.version).toBe("v0.9");
    expect(msg.updateComponents.components).toHaveLength(4);
    expect(
      msg.updateComponents.components.find((c) => c.id === "root")
    ).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 2: Data model bindings (path resolution)
// ---------------------------------------------------------------------------

describe("Data model binding resolution", () => {
  const model = {
    booking: {
      date: "2025-12-16T19:00:00Z",
      guests: 2,
    },
    user: {
      name: "Alice",
      preferences: {
        theme: "dark",
      },
    },
  };

  it("resolves a simple one-level path", () => {
    // The model is stored nested, so /booking resolves to the booking object
    const result = resolveJsonPointer(model, "/booking");
    expect(result).toEqual({
      date: "2025-12-16T19:00:00Z",
      guests: 2,
    });
  });

  it("resolves a two-level path", () => {
    const date = resolveJsonPointer(model, "/booking/date");
    expect(date).toBe("2025-12-16T19:00:00Z");

    const guests = resolveJsonPointer(model, "/booking/guests");
    expect(guests).toBe(2);
  });

  it("resolves a three-level nested path", () => {
    const theme = resolveJsonPointer(model, "/user/preferences/theme");
    expect(theme).toBe("dark");
  });

  it("returns undefined for non-existent path", () => {
    const missing = resolveJsonPointer(model, "/booking/nonexistent");
    expect(missing).toBeUndefined();
  });

  it("returns undefined when intermediate node is missing", () => {
    const result = resolveJsonPointer(model, "/missing/path/deep");
    expect(result).toBeUndefined();
  });

  it("applyJsonPointerSet sets a nested value correctly", () => {
    const updated = applyJsonPointerSet(model, "/booking/date", "2026-01-01T12:00:00Z");
    expect((updated as typeof model).booking.date).toBe("2026-01-01T12:00:00Z");
    // Original is not mutated
    expect(model.booking.date).toBe("2025-12-16T19:00:00Z");
  });

  it("applyJsonPointerSet creates intermediate nodes", () => {
    const empty = {};
    const result = applyJsonPointerSet(empty, "/a/b/c", 42) as Record<string, unknown>;
    const a = result["a"] as Record<string, unknown>;
    const b = a["b"] as Record<string, unknown>;
    expect(b["c"]).toBe(42);
  });

  it("updateDataModel then resolveJsonPointer round-trips correctly", () => {
    let dm: Record<string, unknown> = {};
    dm = applyJsonPointerSet(dm, "/booking", {
      date: "2025-12-16T19:00:00Z",
      guests: 2,
    });

    const guests = resolveJsonPointer(dm, "/booking/guests");
    expect(guests).toBe(2);

    // Update just guests
    dm = applyJsonPointerSet(dm, "/booking/guests", 4);
    const updatedGuests = resolveJsonPointer(dm, "/booking/guests");
    expect(updatedGuests).toBe(4);

    // Date should be unchanged
    const date = resolveJsonPointer(dm, "/booking/date");
    expect(date).toBe("2025-12-16T19:00:00Z");
  });
});
