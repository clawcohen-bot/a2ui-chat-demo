// A2UI v0.9 TypeScript types
// All server→client and client→server message shapes

export const A2UI_VERSION = "v0.9" as const;

// ---------------------------------------------------------------------------
// Data binding
// ---------------------------------------------------------------------------

/** A JSON Pointer binding reference — resolved against the surface data model */
export interface DataBinding {
  path: string;
}

/** A value that may be literal or a data binding */
export type Bindable<T> = T | DataBinding;

/** Narrow a Bindable value to its literal type (call only after resolution) */
export function isDataBinding(v: unknown): v is DataBinding {
  return (
    typeof v === "object" &&
    v !== null &&
    "path" in v &&
    typeof (v as DataBinding).path === "string"
  );
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface EventAction {
  event: {
    name: string;
    context?: Record<string, unknown>;
  };
}

export interface FunctionCallAction {
  functionCall: {
    call: string;
    args?: Record<string, unknown>;
  };
}

export type ComponentAction = EventAction | FunctionCallAction;

// ---------------------------------------------------------------------------
// Component definitions
// ---------------------------------------------------------------------------

// Layout
export interface ColumnComponent {
  id: string;
  component: "Column";
  children?: string[];
  child?: string;
}

export interface RowComponent {
  id: string;
  component: "Row";
  children?: string[];
  child?: string;
}

export interface ListComponent {
  id: string;
  component: "List";
  children?: string[];
}

export interface CardComponent {
  id: string;
  component: "Card";
  child?: string;
  children?: string[];
}

export interface TabsComponent {
  id: string;
  component: "Tabs";
  children?: string[];
}

export interface ModalComponent {
  id: string;
  component: "Modal";
  child?: string;
  children?: string[];
}

export interface DividerComponent {
  id: string;
  component: "Divider";
}

// Display
export interface TextComponent {
  id: string;
  component: "Text";
  text: Bindable<string>;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "caption" | "body";
}

export interface ImageComponent {
  id: string;
  component: "Image";
  url: Bindable<string>;
  description?: string;
  fit?: "contain" | "cover" | "fill";
  variant?: string;
}

export interface IconComponent {
  id: string;
  component: "Icon";
  name: string;
}

export interface VideoComponent {
  id: string;
  component: "Video";
  url: string;
}

export interface AudioPlayerComponent {
  id: string;
  component: "AudioPlayer";
  url: string;
}

// Input
export interface ButtonComponent {
  id: string;
  component: "Button";
  child?: string;
  children?: string[];
  label?: string;
  variant?: "default" | "primary" | "borderless";
  action?: ComponentAction;
}

export interface TextFieldComponent {
  id: string;
  component: "TextField";
  label?: string;
  value?: Bindable<string | number>;
  variant?: "shortText" | "longText" | "number" | "obscured";
  placeholder?: string;
}

export interface CheckBoxComponent {
  id: string;
  component: "CheckBox";
  label?: string;
  value?: Bindable<boolean>;
}

export interface ChoicePickerOption {
  value: string;
  label: string;
}

export interface ChoicePickerComponent {
  id: string;
  component: "ChoicePicker";
  label?: string;
  variant?: "mutuallyExclusive" | "multiSelect";
  options?: ChoicePickerOption[];
  value?: Bindable<string | string[]>;
  displayStyle?: "dropdown" | "radio" | "chips";
}

export interface SliderComponent {
  id: string;
  component: "Slider";
  label?: string;
  min?: number;
  max?: number;
  value?: Bindable<number>;
}

export interface DateTimeInputComponent {
  id: string;
  component: "DateTimeInput";
  value?: Bindable<string>;
  enableDate?: boolean;
  enableTime?: boolean;
  label?: string;
}

export type Component =
  | ColumnComponent
  | RowComponent
  | ListComponent
  | CardComponent
  | TabsComponent
  | ModalComponent
  | DividerComponent
  | TextComponent
  | ImageComponent
  | IconComponent
  | VideoComponent
  | AudioPlayerComponent
  | ButtonComponent
  | TextFieldComponent
  | CheckBoxComponent
  | ChoicePickerComponent
  | SliderComponent
  | DateTimeInputComponent;

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface SurfaceTheme {
  primaryColor?: string;
  agentDisplayName?: string;
}

// ---------------------------------------------------------------------------
// Server → Client messages
// ---------------------------------------------------------------------------

export interface CreateSurfaceMessage {
  version: typeof A2UI_VERSION;
  createSurface: {
    surfaceId: string;
    catalogId?: string;
    theme?: SurfaceTheme;
    sendDataModel?: boolean;
  };
}

export interface UpdateComponentsMessage {
  version: typeof A2UI_VERSION;
  updateComponents: {
    surfaceId: string;
    components: Component[];
  };
}

export interface UpdateDataModelMessage {
  version: typeof A2UI_VERSION;
  updateDataModel: {
    surfaceId: string;
    path: string;
    value: unknown;
  };
}

export interface DeleteSurfaceMessage {
  version: typeof A2UI_VERSION;
  deleteSurface: {
    surfaceId: string;
  };
}

export type A2UIMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage;

// ---------------------------------------------------------------------------
// Client → Server action
// ---------------------------------------------------------------------------

export interface A2UIAction {
  version: typeof A2UI_VERSION;
  action: {
    name: string;
    surfaceId: string;
    sourceComponentId: string;
    timestamp: string;
    context: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// Chat message shape (shared between frontend and backend)
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** If this turn has an associated A2UI action, store it here */
  action?: A2UIAction;
}

// ---------------------------------------------------------------------------
// SSE event payloads
// ---------------------------------------------------------------------------

export interface SSETextEvent {
  delta: string;
}

export interface SSEDoneEvent {
  [key: string]: never;
}

export type SSEPayload = SSETextEvent | A2UIMessage | SSEDoneEvent;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isCreateSurface(msg: A2UIMessage): msg is CreateSurfaceMessage {
  return "createSurface" in msg;
}

export function isUpdateComponents(
  msg: A2UIMessage
): msg is UpdateComponentsMessage {
  return "updateComponents" in msg;
}

export function isUpdateDataModel(
  msg: A2UIMessage
): msg is UpdateDataModelMessage {
  return "updateDataModel" in msg;
}

export function isDeleteSurface(msg: A2UIMessage): msg is DeleteSurfaceMessage {
  return "deleteSurface" in msg;
}
