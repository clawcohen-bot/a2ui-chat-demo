/**
 * A2UI Demo Catalog
 *
 * Exports the official basicCatalog from @a2ui/react/v0_9.
 *
 * The catalog contains all standard A2UI v0.9 components:
 *   Text, Button, TextField, DateTimeInput, ChoicePicker, Card,
 *   Row, Column, List, Image, Icon, Video, AudioPlayer, Tabs,
 *   Divider, Modal, CheckBox, Slider
 *
 * These map to our previous custom components:
 *   TextBlock    → Text         (text, variant)
 *   Button       → Button       (label, variant, action)
 *   TextInput    → TextField    (label, placeholder)
 *   DateTimePicker → DateTimeInput (label, enableDate, enableTime)
 *   SelectList   → ChoicePicker (label, options, multipleSelect)
 *   Card         → Card         (title)
 *   ProductTile  → Column + Image + Text + Button
 */

export { basicCatalog as demoCatalog } from "@a2ui/react/v0_9";

// Re-export the catalog ID for reference
export const CATALOG_ID = "https://a2ui.org/specification/v0_9/basic_catalog.json";
