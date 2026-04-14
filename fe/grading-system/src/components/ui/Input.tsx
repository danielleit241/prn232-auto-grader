"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div style={{ width: "100%" }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              display: "block",
              marginBottom: "6px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              lineHeight: 1.16,
              color: "#201515",
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "input",
            error && "input-error",
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p
            style={{
              marginTop: "6px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#939084",
            }}
          >
            {helperText}
          </p>
        )}
        {error && (
          <p
            style={{
              marginTop: "6px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#dc2626",
            }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
