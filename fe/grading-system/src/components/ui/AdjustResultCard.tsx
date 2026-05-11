"use client";

import * as React from "react";
import { api } from "@/lib";
import type { QuestionResult } from "@/types";

export function AdjustResultCard({ result }: { result: QuestionResult }) {
  const [adjustedScore, setAdjustedScore] = React.useState(
    result.adjustedScore ?? result.score
  );
  const [adjustReason, setAdjustReason] = React.useState(
    result.adjustReason || ""
  );
  const [adjustedBy, setAdjustedBy] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleAdjust = React.useCallback(async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await api.adjustQuestionResult(result.id, {
        adjustedScore: Number(adjustedScore),
        adjustReason,
        adjustedBy: adjustedBy || undefined,
      });
      if (res.status) {
        setMessage("Adjusted successfully");
      } else {
        setMessage(res.message || "Failed");
      }
    } catch {
      setMessage("Error");
    } finally {
      setSaving(false);
    }
  }, [result.id, adjustedScore, adjustReason, adjustedBy]);

  const handleRemoveAdjustment = React.useCallback(async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await api.deleteQuestionResultAdjustment(result.id);
      if (res.status) {
        setAdjustedScore(result.score);
        setAdjustReason("");
        setMessage("Adjustment removed");
      }
    } catch {
      setMessage("Error");
    } finally {
      setSaving(false);
    }
  }, [result.id, result.score]);

  return (
    <div
      style={{
        backgroundColor: "#fffefb",
        border: "1px solid #c5c0b1",
        borderRadius: "5px",
        padding: "20px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h4
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#201515",
            margin: 0,
          }}
        >
          {result.questionTitle || `Question ${result.questionId}`}
        </h4>
        <span
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "#201515",
          }}
        >
          Current: {result.finalScore} / {result.maxScore}
        </span>
      </div>

      {message && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "4px",
            color: "#166534",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.8125rem",
            marginBottom: "12px",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "100px 1fr 150px",
          gap: "12px",
          alignItems: "end",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#939084",
              marginBottom: "4px",
            }}
          >
            Score
          </label>
          <input
            type="number"
            min={0}
            max={result.maxScore}
            step={0.5}
            value={adjustedScore}
            onChange={(e) => setAdjustedScore(Number(e.target.value))}
            style={{
              width: "100%",
              backgroundColor: "#fffefb",
              color: "#201515",
              border: "1px solid #c5c0b1",
              borderRadius: "5px",
              padding: "6px 10px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.9375rem",
              outline: "none",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#ff4f00"; }}
            onBlur={(e) => { e.target.style.borderColor = "#c5c0b1"; }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#939084",
              marginBottom: "4px",
            }}
          >
            Reason
          </label>
          <input
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="Reason for adjustment"
            style={{
              width: "100%",
              backgroundColor: "#fffefb",
              color: "#201515",
              border: "1px solid #c5c0b1",
              borderRadius: "5px",
              padding: "6px 10px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.9375rem",
              outline: "none",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#ff4f00"; }}
            onBlur={(e) => { e.target.style.borderColor = "#c5c0b1"; }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleAdjust}
            disabled={saving}
            style={{
              padding: "6px 12px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#fffefb",
              backgroundColor: "#ff4f00",
              border: "1px solid #ff4f00",
              borderRadius: "4px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "..." : "Adjust"}
          </button>
          {result.adjustedScore !== undefined && (
            <button
              onClick={handleRemoveAdjustment}
              disabled={saving}
              style={{
                padding: "6px 12px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#dc2626",
                backgroundColor: "transparent",
                border: "1px solid #c5c0b1",
                borderRadius: "4px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}