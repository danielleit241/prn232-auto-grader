"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib";
import type {
  ExamSession,
  Assignment,
  Participant,
  SessionSubmissionResult,
  ExportJob,
} from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";

type Tab = "assignments" | "participants" | "results" | "export";

export default function ExamSessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = React.useState<ExamSession | null>(null);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [results, setResults] = React.useState<SessionSubmissionResult[]>(([]));
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<Tab>("assignments");

  const [participantsError, setParticipantsError] = React.useState<string | null>(null);
  const [resultsError, setResultsError] = React.useState<string | null>(null);

  const [showCreateAssignment, setShowCreateAssignment] = React.useState(false);
  const [newAssignment, setNewAssignment] = React.useState({
    code: "",
    title: "",
    description: "",
  });
  const [creatingAssignment, setCreatingAssignment] = React.useState(false);

  const [exportJob, setExportJob] = React.useState<ExportJob | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [gradingRound, setGradingRound] = React.useState("Lan 1");

  const loadSession = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getExamSessionById(sessionId);
      if (res.status && res.data) {
        setSession(res.data);
        if (res.data.assignments) {
          setAssignments(res.data.assignments);
        }
      } else {
        setError(res.message || "Failed to load exam session");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  const loadParticipants = React.useCallback(async () => {
    setParticipantsError(null);
    const res = await api.getExamSessionParticipants(sessionId);
    if (res.status && res.data) {
      setParticipants(res.data);
    } else {
      setParticipantsError(res.message || "Failed to load participants");
    }
  }, [sessionId]);

  const loadResults = React.useCallback(async () => {
    setResultsError(null);
    const res = await api.getExamSessionResults(sessionId, gradingRound);
    if (res.status && res.data) {
      setResults(res.data);
    } else {
      setResultsError(res.message || "Failed to load results");
    }
  }, [sessionId, gradingRound]);

  const handleTabChange = React.useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (tab === "participants") loadParticipants();
    if (tab === "results") loadResults();
  }, [loadParticipants, loadResults]);

  const handleCreateAssignment = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.code.trim() || !newAssignment.title.trim()) return;

    try {
      setCreatingAssignment(true);
      const res = await api.createAssignment({
        ...newAssignment,
        examSessionId: sessionId,
      });
      if (res.status && res.data) {
        setAssignments((prev) => [...prev, res.data!]);
        setShowCreateAssignment(false);
        setNewAssignment({ code: "", title: "", description: "" });
      } else {
        setError(res.message || "Failed to create assignment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating");
    } finally {
      setCreatingAssignment(false);
    }
  }, [newAssignment, sessionId]);

  const handleDeleteAssignment = React.useCallback(async (assignmentId: string) => {
    if (!confirm("Delete this assignment?")) return;
    const res = await api.deleteAssignment(assignmentId);
    if (res.status) {
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    }
  }, []);

  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCreateExport = React.useCallback(async () => {
    try {
      setExporting(true);
      setExportError(null);
      const res = await api.createExamSessionExport(sessionId, gradingRound);
      if (res.status && res.data) {
        setExportJob(res.data);
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
          const r = await api.getExportJob(res.data!.id);
          if (r.status && r.data) {
            setExportJob(r.data);
            if (r.data.status === "Done" || r.data.status === "Failed") {
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
            }
          }
        }, 2000);
      } else {
        setExportError(res.message || "Failed to create export");
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Error exporting");
    } finally {
      setExporting(false);
    }
  }, [sessionId, gradingRound]);

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const handleDownloadExport = React.useCallback(async () => {
    if (!exportJob) return;
    try {
      const response = await api.downloadExport(exportJob.id);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          exportJob.assignmentCode || `session-${sessionId}-export.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      setExportError("Download failed");
    }
  }, [exportJob, sessionId]);

  if (loading) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <LoadingSpinner fullPage label="Loading exam session..." />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "5px",
            color: "#dc2626",
          }}
        >
          {error || "Exam session not found"}
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "assignments", label: "Assignments" },
    { key: "participants", label: "Participants" },
    { key: "results", label: "Results" },
    { key: "export", label: "Export" },
  ];

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "0.875rem",
          color: "#939084",
          marginBottom: "16px",
        }}
      >
        <Link
          href="/exam-sessions"
          style={{ color: "#939084", textDecoration: "none" }}
        >
          Exam Sessions
        </Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "#201515" }}>{session.title}</span>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: "40px" }}>
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
          02 / Exam Session
        </p>
        <h1
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "2.5rem",
            fontWeight: 500,
            lineHeight: 1.1,
            color: "#201515",
            margin: "0 0 8px 0",
          }}
        >
          {session.title}
        </h1>
        {session.description && (
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "1rem",
              color: "#36342e",
            }}
          >
            {session.description}
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid #c5c0b1",
          marginBottom: "32px",
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "12px 20px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "1rem",
              fontWeight: 500,
              color: activeTab === tab.key ? "#201515" : "#939084",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #ff4f00" : "2px solid transparent",
              cursor: "pointer",
              transition: "color 0.15s ease, border-color 0.15s ease",
              whiteSpace: "nowrap",
              marginBottom: "-1px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {/* ===== ASSIGNMENTS TAB ===== */}
      {activeTab === "assignments" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#201515",
                margin: 0,
              }}
            >
              Assignments ({assignments.length})
            </h2>
            <button
              onClick={() => setShowCreateAssignment(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#fffefb",
                backgroundColor: "#ff4f00",
                border: "1px solid #ff4f00",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              + New Assignment
            </button>
          </div>

          {showCreateAssignment && (
            <form
              onSubmit={handleCreateAssignment}
              style={{
                backgroundColor: "#fffefb",
                border: "1px solid #c5c0b1",
                borderRadius: "5px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#201515",
                  marginBottom: "16px",
                }}
              >
                Create New Assignment
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#36342e",
                      marginBottom: "6px",
                    }}
                  >
                    Code <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newAssignment.code}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, code: e.target.value })
                    }
                    placeholder="e.g. 101"
                    style={{
                      width: "100%",
                      backgroundColor: "#fffefb",
                      color: "#201515",
                      border: "1px solid #c5c0b1",
                      borderRadius: "5px",
                      padding: "8px 12px",
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.9375rem",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#ff4f00";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#c5c0b1";
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#36342e",
                      marginBottom: "6px",
                    }}
                  >
                    Title <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Ma de 101"
                    style={{
                      width: "100%",
                      backgroundColor: "#fffefb",
                      color: "#201515",
                      border: "1px solid #c5c0b1",
                      borderRadius: "5px",
                      padding: "8px 12px",
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.9375rem",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#ff4f00";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#c5c0b1";
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#36342e",
                    marginBottom: "6px",
                  }}
                >
                  Description
                </label>
                <input
                  type="text"
                  value={newAssignment.description}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional description"
                  style={{
                    width: "100%",
                    backgroundColor: "#fffefb",
                    color: "#201515",
                    border: "1px solid #c5c0b1",
                    borderRadius: "5px",
                    padding: "8px 12px",
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.9375rem",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#ff4f00";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#c5c0b1";
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="submit"
                  disabled={creatingAssignment}
                  style={{
                    padding: "8px 16px",
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#fffefb",
                    backgroundColor: "#ff4f00",
                    border: "1px solid #ff4f00",
                    borderRadius: "4px",
                    cursor: creatingAssignment ? "not-allowed" : "pointer",
                    opacity: creatingAssignment ? 0.6 : 1,
                  }}
                >
                  {creatingAssignment ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAssignment(false)}
                  style={{
                    padding: "20px 24px",
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#36342e",
                    backgroundColor: "#eceae3",
                    border: "1px solid #c5c0b1",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {assignments.length === 0 ? (
            <EmptyState
              title="No assignments yet"
              description="Create assignments for this exam session."
              action={
                <button
                  onClick={() => setShowCreateAssignment(true)}
                  style={{
                    padding: "8px 16px",
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#fffefb",
                    backgroundColor: "#ff4f00",
                    border: "1px solid #ff4f00",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  + New Assignment
                </button>
              }
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {assignments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    backgroundColor: "#fffefb",
                    border: "1px solid #c5c0b1",
                    borderRadius: "5px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          backgroundColor: "#eceae3",
                          borderRadius: "4px",
                          fontFamily: "Inter, Arial, sans-serif",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#36342e",
                          marginBottom: "6px",
                        }}
                      >
                        {a.code}
                      </span>
                      <h3
                        style={{
                          fontFamily: "Inter, Arial, sans-serif",
                          fontSize: "1.125rem",
                          fontWeight: 600,
                          color: "#201515",
                          margin: 0,
                        }}
                      >
                        {a.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  {a.description && (
                    <p
                      style={{
                        fontFamily: "Inter, Arial, sans-serif",
                        fontSize: "0.875rem",
                        color: "#939084",
                        marginBottom: "12px",
                      }}
                    >
                      {a.description}
                    </p>
                  )}
                  <Link
                    href={`/assignments/${a.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 14px",
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== PARTICIPANTS TAB ===== */}
      {activeTab === "participants" && (
        <div>
          <h2
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#201515",
              marginBottom: "20px",
            }}
          >
            Participants ({participants.length})
          </h2>

          {participantsError && (
            <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", color: "#dc2626", marginBottom: "16px" }}>
              {participantsError}
            </div>
          )}

          {participants.length === 0 && !participantsError ? (
            <EmptyState
              title="No participants imported"
              description="Import participants via CSV from each assignment's setup page."
            />
          ) : (
            <Table
              columns={[
                { key: "studentCode", header: "Student Code" },
                { key: "username", header: "Username" },
              ]}
              data={participants}
              keyExtractor={(p) => p.id}
              emptyMessage="No participants found"
            />
          )}
        </div>
      )}

      {/* ===== RESULTS TAB ===== */}
      {activeTab === "results" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <h2
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#201515",
                margin: 0,
              }}
            >
              Results ({results.length} submissions)
            </h2>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="text"
                value={gradingRound}
                onChange={(e) => setGradingRound(e.target.value)}
                placeholder="Grading round"
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#fffefb",
                  color: "#201515",
                  border: "1px solid #c5c0b1",
                  borderRadius: "5px",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
              <button
                onClick={loadResults}
                style={{
                  padding: "8px 16px",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#36342e",
                  backgroundColor: "#eceae3",
                  border: "1px solid #c5c0b1",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Load
              </button>
            </div>
          </div>

          {resultsError && (
            <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", color: "#dc2626", marginBottom: "16px" }}>
              {resultsError}
            </div>
          )}

          {results.length === 0 && !resultsError ? (
            <EmptyState
              title="No results yet"
              description="Results will appear after grading is complete."
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Table
                columns={[
                  {
                    key: "studentCode",
                    header: "Student",
                    render: (r) => (
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#201515",
                          }}
                        >
                          {r.studentCode}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            color: "#939084",
                          }}
                        >
                          {r.username}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "assignmentCode",
                    header: "Assignment",
                    render: (r) => (
                      <span
                        style={{
                          padding: "2px 8px",
                          backgroundColor: "#eceae3",
                          borderRadius: "4px",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                        }}
                      >
                        {r.assignmentCode}
                      </span>
                    ),
                  },
                  {
                    key: "totalScore",
                    header: "Score",
                    render: (r) => (
                      <div>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              r.totalScore / r.maxScore >= 0.5
                                ? "#166534"
                                : "#dc2626",
                          }}
                        >
                          {r.totalScore}
                        </span>
                        <span style={{ color: "#939084" }}>
                          {" "}
                          / {r.maxScore}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (r) => <StatusBadge status={r.status} />,
                  },
                  {
                    key: "notes",
                    header: "Notes",
                    render: (r) => (
                      <span
                        style={{
                          color: "#939084",
                          fontSize: "0.8125rem",
                          maxWidth: "200px",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.notes || "-"}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    header: "",
                    render: (r) => (
                      <Link
                        href={`/submissions/${r.submissionId}`}
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
                data={results}
                keyExtractor={(r) => r.submissionId}
                emptyMessage="No results found"
              />
            </div>
          )}
        </div>
      )}

      {/* ===== EXPORT TAB ===== */}
      {activeTab === "export" && (
        <div>
          <h2
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#201515",
              marginBottom: "8px",
            }}
          >
            Export Session Results
          </h2>
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.9375rem",
              color: "#939084",
              marginBottom: "32px",
            }}
          >
            Export all assignment results into a single Excel file with one sheet
            per assignment.
          </p>

          <div
            style={{
              backgroundColor: "#fffefb",
              border: "1px solid #c5c0b1",
              borderRadius: "5px",
              padding: "32px",
              maxWidth: "500px",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#36342e",
                  marginBottom: "8px",
                }}
              >
                Grading Round
              </label>
              <input
                type="text"
                value={gradingRound}
                onChange={(e) => setGradingRound(e.target.value)}
                placeholder="e.g. Lan 1"
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
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#ff4f00";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#c5c0b1";
                }}
              />
            </div>

            {exportError && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "4px",
                  color: "#dc2626",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.875rem",
                  marginBottom: "16px",
                }}
              >
                {exportError}
              </div>
            )}

            {exportJob && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor:
                    exportJob.status === "Done"
                      ? "#f0fdf4"
                      : exportJob.status === "Failed"
                        ? "#fef2f2"
                        : "#fff8f0",
                  border: `1px solid ${
                    exportJob.status === "Done"
                      ? "#bbf7d0"
                      : exportJob.status === "Failed"
                        ? "#fecaca"
                        : "#ff4f00"
                  }`,
                  borderRadius: "4px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "Inter, Arial, sans-serif",
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "#201515",
                        marginBottom: "4px",
                      }}
                    >
                      Export Status: <StatusBadge status={exportJob.status} />
                    </p>
                    {exportJob.errorMessage && (
                      <p
                        style={{
                          fontFamily: "Inter, Arial, sans-serif",
                          fontSize: "0.8125rem",
                          color: "#dc2626",
                        }}
                      >
                        {exportJob.errorMessage}
                      </p>
                    )}
                  </div>
                  {exportJob.status === "Done" && (
                    <button
                      onClick={handleDownloadExport}
                      style={{
                        padding: "8px 16px",
                        fontFamily: "Inter, Arial, sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#fffefb",
                        backgroundColor: "#ff4f00",
                        border: "1px solid #ff4f00",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleCreateExport}
              disabled={exporting || exportJob?.status === "Running"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 20px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fffefb",
                backgroundColor: "#ff4f00",
                border: "1px solid #ff4f00",
                borderRadius: "4px",
                cursor:
                  exporting || exportJob?.status === "Running"
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  exporting || exportJob?.status === "Running" ? 0.6 : 1,
              }}
            >
              {exporting
                ? "Creating export..."
                : exportJob?.status === "Running"
                  ? "Exporting..."
                  : "Create Export"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
