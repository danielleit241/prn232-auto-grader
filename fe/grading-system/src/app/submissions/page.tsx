"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { AssignmentSummary, Submission } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";

export default function SubmissionsPage() {
  const [assignments, setAssignments] = React.useState<AssignmentSummary[]>([]);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadAssignments();
  }, []);

  React.useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions(selectedAssignment);
    } else {
      loadAllSubmissions();
    }
  }, [selectedAssignment]);

  const loadAssignments = async () => {
    try {
      const res = await api.getAssignments();
      if (res.status && res.data) {
        setAssignments(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      setLoadingSubmissions(true);
      const res = await api.getSubmissionsByAssignment(assignmentId);
      if (res.status && res.data) {
        setSubmissions(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadAllSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      setSubmissions([]);
      // For now, load from all assignments
      const allSubs: Submission[] = [];
      for (const a of assignments) {
        const res = await api.getSubmissionsByAssignment(a.id);
        if (res.status && res.data) {
          allSubs.push(...res.data);
        }
      }
      setSubmissions(allSubs);
    } catch {
      // ignore
    } finally {
      setLoadingSubmissions(false);
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
            04 / Submissions
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

      {/* Filter */}
      <div style={{ marginBottom: "24px" }}>
        <select
          value={selectedAssignment}
          onChange={(e) => setSelectedAssignment(e.target.value)}
          style={{
            padding: "8px 16px",
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
              [{a.code}] {a.title}
            </option>
          ))}
        </select>
      </div>

      {loadingSubmissions ? (
        <LoadingSpinner label="Loading submissions..." />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
          description={
            selectedAssignment
              ? "No submissions for the selected assignment."
              : "Submissions will appear here after students submit."
          }
        />
      ) : (
        <Table
          columns={[
            {
              key: "studentCode",
              header: "Student",
              render: (s) => (
                <div>
                  <div style={{ fontWeight: 600, color: "#201515" }}>
                    {s.studentCode}
                  </div>
                  {s.username && (
                    <div style={{ fontSize: "0.8125rem", color: "#939084" }}>
                      {s.username}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "assignmentId",
              header: "Assignment",
              render: (s) => {
                const a = assignments.find((a) => a.id === s.assignmentId);
                return (
                  <span
                    style={{
                      padding: "2px 8px",
                      backgroundColor: "#eceae3",
                      borderRadius: "4px",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                    }}
                  >
                    {a?.code || s.assignmentId.slice(0, 8)}
                  </span>
                );
              },
            },
            {
              key: "hasArtifact",
              header: "Artifact",
              render: (s) => (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    backgroundColor: s.hasArtifact ? "#f0fdf4" : "#fef2f2",
                    color: s.hasArtifact ? "#166534" : "#dc2626",
                  }}
                >
                  {s.hasArtifact ? "Yes" : "No"}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (s) => <StatusBadge status={s.status} />,
            },
            {
              key: "totalScore",
              header: "Score",
              render: (s) =>
                s.totalScore !== undefined ? (
                  <span style={{ fontWeight: 600 }}>
                    {s.totalScore} / {s.maxScore}
                  </span>
                ) : (
                  <span style={{ color: "#939084" }}>-</span>
                ),
            },
            {
              key: "createdAt",
              header: "Submitted",
              render: (s) =>
                new Date(s.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
            },
            {
              key: "actions",
              header: "",
              render: (s) => (
                <Link
                  href={`/submissions/${s.id}`}
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#ff4f00",
                    textDecoration: "none",
                  }}
                >
                  View
                </Link>
              ),
            },
          ]}
          data={submissions}
          keyExtractor={(s) => s.id}
          emptyMessage="No submissions found"
        />
      )}
    </div>
  );
}
