"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { ExamSession } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";

export default function ExamSessionsPage() {
  const [sessions, setSessions] = React.useState<ExamSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getExamSessions();
      if (res.status && res.data) {
        setSessions(res.data);
      } else {
        setError(res.message || "Failed to load exam sessions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Delete this exam session? Assignments and submissions will remain.")) return;
    try {
      setDeleting(sessionId);
      const res = await api.deleteExamSession(sessionId);
      if (res.status) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
      } else {
        setError(res.message || "Failed to delete");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <LoadingSpinner fullPage label="Loading exam sessions..." />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
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
            02 / Exam Sessions
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
            Exam Sessions
          </h1>
        </div>
        <Link
          href="/exam-sessions/create"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 20px",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#fffefb",
            backgroundColor: "#ff4f00",
            border: "1px solid #ff4f00",
            borderRadius: "4px",
            textDecoration: "none",
            transition: "background-color 0.15s ease",
          }}
        >
          + New Exam Session
        </Link>
      </div>

      {error && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "5px",
            color: "#dc2626",
            marginBottom: "24px",
          }}
        >
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          title="No exam sessions yet"
          description="Create your first exam session to start organizing assignments and grading."
          action={
            <Link
              href="/exam-sessions/create"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 20px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fffefb",
                backgroundColor: "#ff4f00",
                border: "1px solid #ff4f00",
                borderRadius: "4px",
                textDecoration: "none",
              }}
            >
              + New Exam Session
            </Link>
          }
        />
      ) : (
        <Table
          columns={[
            {
              key: "title",
              header: "Title",
              render: (s) => (
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#201515",
                      fontSize: "1rem",
                    }}
                  >
                    {s.title}
                  </div>
                  {s.description && (
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "#939084",
                        marginTop: "2px",
                        maxWidth: "400px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.description}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "code",
              header: "Session Code",
              render: (s) => (
                <span
                  style={{
                    padding: "2px 8px",
                    backgroundColor: "#eceae3",
                    borderRadius: "4px",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#36342e",
                  }}
                >
                  {s.code || s.id.slice(0, 8)}
                </span>
              ),
            },
            {
              key: "assignments",
              header: "Assignments",
              render: (s) => (
                <span style={{ color: "#36342e", fontWeight: 500 }}>
                  {s.assignments?.length ?? 0}
                </span>
              ),
            },
            {
              key: "createdAt",
              header: "Created",
              render: (s) => (
                <span style={{ color: "#939084", fontSize: "0.875rem" }}>
                  {new Date(s.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (s) => (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Link
                    href={`/exam-sessions/${s.id}`}
                    style={{
                      padding: "6px 12px",
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#fffefb",
                      backgroundColor: "#ff4f00",
                      border: "1px solid #ff4f00",
                      borderRadius: "4px",
                      textDecoration: "none",
                    }}
                  >
                    Manage
                  </Link>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    style={{
                      padding: "6px 12px",
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#dc2626",
                      backgroundColor: "transparent",
                      border: "1px solid #c5c0b1",
                      borderRadius: "4px",
                      cursor: deleting === s.id ? "not-allowed" : "pointer",
                      opacity: deleting === s.id ? 0.6 : 1,
                    }}
                  >
                    {deleting === s.id ? "..." : "Delete"}
                  </button>
                </div>
              ),
            },
          ]}
          data={sessions}
          keyExtractor={(s) => s.id}
          emptyMessage="No exam sessions found"
        />
      )}
    </div>
  );
}
