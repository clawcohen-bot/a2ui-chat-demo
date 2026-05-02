import React from "react";

// ---------------------------------------------------------------------------
// TextBlock
// ---------------------------------------------------------------------------

export interface TextBlockProps {
  text: string;
  variant?: "h1" | "h2" | "body";
}

export function TextBlock({ text, variant = "body" }: TextBlockProps) {
  if (variant === "h1") {
    return React.createElement(
      "h1",
      { className: "text-2xl font-bold text-gray-900 mb-2" },
      text
    );
  }
  if (variant === "h2") {
    return React.createElement(
      "h2",
      { className: "text-xl font-semibold text-gray-800 mb-2" },
      text
    );
  }
  return React.createElement(
    "p",
    { className: "text-base text-gray-700 leading-relaxed" },
    text
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  label,
  variant = "secondary",
  onClick,
  disabled,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? `${base} bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`
      : `${base} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500`;

  return React.createElement(
    "button",
    { className: styles, onClick, disabled },
    label
  );
}

// ---------------------------------------------------------------------------
// TextInput
// ---------------------------------------------------------------------------

export interface TextInputProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function TextInput({
  label,
  placeholder,
  value = "",
  onChange,
}: TextInputProps) {
  return React.createElement(
    "div",
    { className: "flex flex-col gap-1" },
    React.createElement(
      "label",
      { className: "text-sm font-medium text-gray-700" },
      label
    ),
    React.createElement("input", {
      type: "text",
      className:
        "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
      placeholder,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange?.(e.target.value),
    })
  );
}

// ---------------------------------------------------------------------------
// DateTimePicker
// ---------------------------------------------------------------------------

export interface DateTimePickerProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  mode?: "date" | "time" | "datetime";
}

export function DateTimePicker({
  label,
  value = "",
  onChange,
  mode = "datetime",
}: DateTimePickerProps) {
  const type =
    mode === "date" ? "date" : mode === "time" ? "time" : "datetime-local";

  return React.createElement(
    "div",
    { className: "flex flex-col gap-1" },
    React.createElement(
      "label",
      { className: "text-sm font-medium text-gray-700" },
      label
    ),
    React.createElement("input", {
      type,
      className:
        "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange?.(e.target.value),
    })
  );
}

// ---------------------------------------------------------------------------
// SelectList
// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectListProps {
  label: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
}

export function SelectList({
  label,
  options,
  value = "",
  onChange,
}: SelectListProps) {
  return React.createElement(
    "div",
    { className: "flex flex-col gap-1" },
    React.createElement(
      "label",
      { className: "text-sm font-medium text-gray-700" },
      label
    ),
    React.createElement(
      "select",
      {
        className:
          "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
        value,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange?.(e.target.value),
      },
      React.createElement(
        "option",
        { value: "", disabled: true },
        "Select an option..."
      ),
      ...options.map((opt) =>
        React.createElement("option", { key: opt.value, value: opt.value }, opt.label)
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export interface CardProps {
  title?: string;
  children?: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return React.createElement(
    "div",
    {
      className:
        "rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-3",
    },
    title
      ? React.createElement(
          "div",
          { className: "text-base font-semibold text-gray-900 border-b border-gray-100 pb-2" },
          title
        )
      : null,
    children
  );
}

// ---------------------------------------------------------------------------
// ProductTile
// ---------------------------------------------------------------------------

export interface ProductTileProps {
  imageUrl: string;
  title: string;
  price: string;
  onChoose?: () => void;
}

export function ProductTile({ imageUrl, title, price, onChoose }: ProductTileProps) {
  return React.createElement(
    "div",
    {
      className:
        "rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col",
    },
    React.createElement("img", {
      src: imageUrl,
      alt: title,
      className: "w-full h-40 object-cover bg-gray-100",
      onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
        (e.target as HTMLImageElement).src =
          `https://placehold.co/400x160/e2e8f0/94a3b8?text=${encodeURIComponent(title)}`;
      },
    }),
    React.createElement(
      "div",
      { className: "p-3 flex flex-col gap-2 flex-1" },
      React.createElement(
        "div",
        { className: "text-sm font-semibold text-gray-900 leading-snug" },
        title
      ),
      React.createElement(
        "div",
        { className: "text-sm text-indigo-600 font-medium" },
        price
      ),
      React.createElement(
        "button",
        {
          className:
            "mt-auto w-full bg-indigo-600 text-white text-sm font-medium py-1.5 rounded-lg hover:bg-indigo-700 transition-colors",
          onClick: onChoose,
        },
        "Choose"
      )
    )
  );
}

// Export catalog manifest
export { default as catalogManifest } from "./catalog.json";
