"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib";
import type { CreateExamSessionRequest } from "@/types";

export default function CreateExamSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<CreateExamSessionRequest>({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.createExamSession(formData);
      if (res.status && res.data) {
        router.push(`/exam-sessions/${res.data.id}`);
      } else {
        setError(res.message || "Failed to create exam session");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating exam session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <p
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#939084",
            marginBottom: "8px",
          }}
        >
          01 / Exam Sessions
        </p>
        <h1
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "2.5rem",
            fontWeight: 500,
            lineHeight: 1.1,
            color: "#201515",
            margin: 0,
          }}
        >
          New Exam Session
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            backgroundColor: "#fffefb",
            border: "1px solid #c5c0b1",
            borderRadius: "5px",
            padding: "32px",
          }}
        >
          {error && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "4px",
                color: "#dc2626",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.9375rem",
                marginBottom: "24px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#201515",
                marginBottom: "8px",
              }}
            >
              Title <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. PE PRN232 – Ky Xuan 2026"
              style={{
                width: "100%",
                backgroundColor: "#fffefb",
                color: "#201515",
                border: "1px solid #c5c0b1",
                borderRadius: "5px",
                padding: "10px 14px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#ff4f00";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#c5c0b1";
              }}
            />
          </div>

          <div style={{ marginBottom: "32px" }}>
            <label
              style={{
                display: "block",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#201515",
                marginBottom: "8px",
              }}
            >
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of the exam session"
              rows={4}
              style={{
                width: "100%",
                backgroundColor: "#fffefb",
                color: "#201515",
                border: "1px solid #c5c0b1",
                borderRadius: "5px",
                padding: "10px 14px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                outline: "none",
                resize: "vertical",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#ff4f00";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#c5c0b1";
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 20px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fffefb",
                backgroundColor: "#ff4f00",
                border: "1px solid #ff4f00",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "background-color 0.15s ease",
              }}
            >
              {loading ? "Creating..." : "Create Exam Session"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 24px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#36342e",
                backgroundColor: "#eceae3",
                border: "1px solid #c5c0b1",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
