"use client";

import * as React from "react";
import { FileX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        textAlign: "center",
        border: "1px solid #c5c0b1",
        borderRadius: "5px",
        backgroundColor: "#fffdf9",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#eceae3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <FileX size={24} color="#939084" />
      </div>
      <h3
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "#201515",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.9375rem",
            fontWeight: 400,
            color: "#939084",
            maxWidth: "400px",
            marginBottom: action ? "24px" : 0,
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
