"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  size = 24,
  label,
  fullPage = false,
}: LoadingSpinnerProps) {
  if (fullPage) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: "16px",
        }}
      >
        <Loader2
          size={size}
          color="#ff4f00"
          style={{ animation: "spin 1s linear infinite" }}
        />
        {label && (
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.9375rem",
              color: "#939084",
              fontWeight: 500,
            }}
          >
            {label}
          </p>
        )}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <Loader2
        size={size}
        color="#ff4f00"
        style={{ animation: "spin 1s linear infinite" }}
      />
      {label && (
        <p
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.9375rem",
            color: "#939084",
            fontWeight: 500,
          }}
        >
          {label}
        </p>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
