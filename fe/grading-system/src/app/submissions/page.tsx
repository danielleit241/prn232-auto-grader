"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { Submission } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filterAssignmentId, setFilterAssignmentId] = React.useState("");
  const [assignments, setAssignments] = React.useState<
    { id: string; code: string }[]
  >([]);

  React.useEffect(() => {
    loadAssignments();
    loadSubmissions();
  }, []);

  const loadAssignments = async () => {
    const res = await api.getAssignments();
    if (res.status && res.data) {
      setAssignments(res.data.map((a) => ({ id: a.id, code: a.code })));
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      if (filterAssignmentId) {
        const res = await api.getSubmissionsByAssignment(filterAssignmentId);
        if (res.status && res.data) {
          setSubmissions(res.data);
        } else {
          setError(res.message || "Failed to load");
        }
      } else {
        // Load from all assignments — fetch each assignment's submissions
        const allSubs: Submission[] = [];
        const assRes = await api.getAssignments();
        if (assRes.status && assRes.data) {
          await Promise.all(
            assRes.data.map(async (a) => {
              const res = await api.getSubmissionsByAssignment(a.id);
              if (res.status && res.data) {
                allSubs.push(...res.data);
              }
            })
          );
          // Sort by createdAt desc
          allSubs.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );
          setSubmissions(allSubs);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm("Delete this submission?")) return;
    try {
      const res = await api.deleteSubmission(submissionId);
      if (res.status) {
        setSubmissions(submissions.filter((s) => s.id !== submissionId));
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <LoadingSpinner fullPage label="Loading submissions..." />
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
            03 / Submissions
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
            Submissions
          </h1>
        </div>
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

      {/* Filter */}
      <div style={{ marginBottom: "24px" }}>
        <select
          value={filterAssignmentId}
          onChange={(e) => {
            setFilterAssignmentId(e.target.value);
            loadSubmissions();
          }}
          style={{
            padding: "8px 12px",
            backgroundColor: "#fffefb",
            color: "#201515",
            border: "1px solid #c5c0b1",
            borderRadius: "5px",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.9375rem",
            outline: "none",
            minWidth: "200px",
          }}
        >
          <option value="">All Assignments</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code}
            </option>
          ))}
        </select>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions"
          description="Upload submissions from an assignment's submissions tab."
        />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "Inter, Arial, sans-serif",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #c5c0b1",
                  backgroundColor: "#eceae3",
                }}
              >
                {[
                  "Student",
                  "Assignment",
                  "Status",
                  "Artifact",
                  "Score",
                  "Submitted",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#36342e",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: "1px solid #eceae3" }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#201515" }}>
                      {s.studentCode}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#939084" }}>
                      {s.username}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
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
                      {s.assignmentId.slice(0, 8)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={s.status} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: s.hasArtifact ? "#166534" : "#dc2626",
                        fontSize: "0.875rem",
                      }}
                    >
                      {s.hasArtifact ? "Yes" : "No"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {s.totalScore !== undefined ? (
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            (s.totalScore ?? 0) / (s.maxScore ?? 1) >= 0.5
                              ? "#166534"
                              : "#dc2626",
                        }}
                      >
                        {s.totalScore} / {s.maxScore}
                      </span>
                    ) : (
                      <span style={{ color: "#939084" }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: "#939084", fontSize: "0.875rem" }}>
                      {new Date(s.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link
                        href={`/submissions/${s.id}`}
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "#fffefb",
                          backgroundColor: "#ff4f00",
                          border: "1px solid #ff4f00",
                          borderRadius: "4px",
                          textDecoration: "none",
                        }}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(s.id)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "#dc2626",
                          backgroundColor: "transparent",
                          border: "1px solid #c5c0b1",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}