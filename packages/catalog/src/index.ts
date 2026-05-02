/**
 * @a2ui-demo/catalog
 *
 * Exports the official basicCatalog plus a custom "MyCard" component
 * registered via the official createComponentImplementation API.
 *
 * Usage in MessageProcessor:
 *   new MessageProcessor([basicCatalog, myCatalog], actionHandler)
 */

import React from "react";
import { z } from "zod";
import { createComponentImplementation, basicCatalog } from "@a2ui/react/v0_9";
import { Catalog } from "@a2ui/web_core/v0_9";

// ---------------------------------------------------------------------------
// MyCard — custom branded card with title, subtitle, image, and badge
// ---------------------------------------------------------------------------

const MyCardApi = {
  name: "MyCard",
  schema: z.object({
    /** Main heading */
    title: z.string(),
    /** Optional supporting text below the title */
    subtitle: z.string().optional(),
    /** Optional image URL shown at the top of the card */
    imageUrl: z.string().optional(),
    /** Optional small badge label (e.g. "New", "Sale") */
    badge: z.string().optional(),
  }),
} as const;

const MyCardImpl = createComponentImplementation(
  MyCardApi,
  ({ props }) => {
    const { title, subtitle, imageUrl, badge } = props;

    return React.createElement(
      "div",
      {
        className:
          "rounded-2xl border border-indigo-100 bg-white shadow-md overflow-hidden flex flex-col",
      },
      // Image
      imageUrl
        ? React.createElement("img", {
            src: imageUrl,
            alt: title,
            className: "w-full h-44 object-cover bg-gray-100",
            onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/800x176/e0e7ff/6366f1?text=${encodeURIComponent(title)}`;
            },
          })
        : null,

      // Body
      React.createElement(
        "div",
        { className: "p-4 flex flex-col gap-1 flex-1" },
        // Badge
        badge
          ? React.createElement(
              "span",
              {
                className:
                  "self-start text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 mb-1",
              },
              badge
            )
          : null,

        // Title
        React.createElement(
          "h3",
          { className: "text-base font-bold text-gray-900 leading-snug" },
          title
        ),

        // Subtitle
        subtitle
          ? React.createElement(
              "p",
              { className: "text-sm text-gray-500 leading-relaxed" },
              subtitle
            )
          : null
      )
    );
  }
);

// ---------------------------------------------------------------------------
// Custom catalog — add more components here as needed
// ---------------------------------------------------------------------------

/** The catalog ID for our custom components */
export const CUSTOM_CATALOG_ID = "https://demo.example.com/a2ui-demo/catalog";

/** Custom catalog containing MyCard (and any future custom components) */
export const myCatalog = new Catalog(CUSTOM_CATALOG_ID, [MyCardImpl]);

// Re-export basicCatalog for convenience
export { basicCatalog };
export const CATALOG_ID = "https://a2ui.org/specification/v0_9/basic_catalog.json";
