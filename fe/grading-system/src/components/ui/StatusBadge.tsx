"use client";

import * as React from "react";

type BadgeVariant =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "default"
  | "orange"
  | "api"
  | "razor";

const variantStyles: Record<
  BadgeVariant,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: "#fffdf9",
    text: "#939084",
    border: "#c5c0b1",
  },
  running: {
    bg: "#fff8f0",
    text: "#ff4f00",
    border: "#ff4f00",
  },
  done: {
    bg: "#f0fdf4",
    text: "#166534",
    border: "#bbf7d0",
  },
  failed: {
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
  },
  default: {
    bg: "#eceae3",
    text: "#36342e",
    border: "#c5c0b1",
  },
  orange: {
    bg: "#fff4ed",
    text: "#ff4f00",
    border: "#ff4f00",
  },
  api: {
    bg: "#f0f9ff",
    text: "#0369a1",
    border: "#bae6fd",
  },
  razor: {
    bg: "#faf5ff",
    text: "#7c3aed",
    border: "#e9d5ff",
  },
};

interface StatusBadgeProps {
  status:
    | "Pending"
    | "Running"
    | "Done"
    | "Failed"
    | "Grading"
    | "Api"
    | "Razor"
    | string;
  variant?: BadgeVariant;
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant: BadgeVariant =
    variant ||
    (status === "Pending"
      ? "pending"
      : status === "Running" || status === "Grading"
        ? "running"
        : status === "Done"
          ? "done"
          : status === "Failed"
            ? "failed"
            : "default");

  const style = variantStyles[resolvedVariant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: "4px",
        border: `1px solid ${style.border}`,
        backgroundColor: style.bg,
        color: style.text,
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "0.8125rem",
        fontWeight: 600,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
