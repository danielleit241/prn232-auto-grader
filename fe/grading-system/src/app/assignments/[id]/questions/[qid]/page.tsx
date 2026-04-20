"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib";
import type { Question, TestCase, CreateTestCaseRequest } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function QuestionDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const questionId = params.qid as string;

  const [question, setQuestion] = React.useState<Question | null>(null);
  const [testCases, setTestCases] = React.useState<TestCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [showCreate, setShowCreate] = React.useState(false);
  const [newTestCase, setNewTestCase] = React.useState<CreateTestCaseRequest>({
    name: "",
    httpMethod: "GET",
    urlTemplate: "",
    expectedStatus: 200,
    score: 1,
  });
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadData();
  }, [questionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load question details by fetching all questions from assignment
      const res = await api.getQuestionsByAssignment(assignmentId);
      if (res.status && res.data) {
        const q = res.data.find((q: Question) => q.id === questionId);
        if (q) {
          setQuestion(q);
          await loadTestCases();
        } else {
          setError("Question not found");
        }
      } else {
        setError(res.message || "Failed to load question");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading");
    } finally {
      setLoading(false);
    }
  };

  const loadTestCases = async () => {
    const res = await api.getTestCasesByQuestion(questionId);
    if (res.status && res.data) {
      setTestCases(res.data);
    }
  };

  const handleCreateTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestCase.name.trim() || !newTestCase.urlTemplate.trim()) return;
    try {
      setCreating(true);
      const res = await api.createTestCases(questionId, [newTestCase]);
      if (res.status && res.data) {
        setTestCases([...testCases, ...res.data]);
        setShowCreate(false);
        setNewTestCase({
          name: "",
          httpMethod: "GET",
          urlTemplate: "",
          expectedStatus: 200,
          score: 1,
        });
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId: string) => {
    if (!confirm("Delete this test case?")) return;
    try {
      setDeleting(testCaseId);
      const res = await api.deleteTestCase(testCaseId);
      if (res.status) {
        setTestCases(testCases.filter((tc) => tc.id !== testCaseId));
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <LoadingSpinner fullPage label="Loading question..." />
      </div>
    );
  }

  if (error || !question) {
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
          {error || "Question not found"}
        </div>
      </div>
    );
  }

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
        <Link href="/exam-sessions" style={{ color: "#939084", textDecoration: "none" }}>
          Exam Sessions
        </Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <Link
          href={`/assignments/${assignmentId}`}
          style={{ color: "#939084", textDecoration: "none" }}
        >
          Assignment
        </Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "#201515" }}>Question</span>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <StatusBadge
            status={question.type === 0 ? "Api" : "Razor"}
            variant={question.type === 0 ? "api" : "razor"}
          />
          <h1
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "2rem",
              fontWeight: 500,
              lineHeight: 1.1,
              color: "#201515",
              margin: 0,
            }}
          >
            {question.title}
          </h1>
        </div>
        <div
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.9375rem",
            color: "#36342e",
          }}
        >
          Max Score: <strong>{question.maxScore} pts</strong> &middot; Folder:{" "}
          <code
            style={{
              backgroundColor: "#eceae3",
              padding: "1px 6px",
              borderRadius: "3px",
            }}
          >
            {question.artifactFolderName}
          </code>
        </div>
      </div>

      {/* Test Cases */}
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
          Test Cases ({testCases.length})
        </h2>
        <button
          onClick={() => setShowCreate(true)}
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
          + New Test Case
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreateTestCase}
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
            Add Test Case
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 100px 80px",
              gap: "12px",
              marginBottom: "16px",
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
                Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GET /api/students"
                value={newTestCase.name}
                onChange={(e) =>
                  setNewTestCase({ ...newTestCase, name: e.target.value })
                }
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
                Method
              </label>
              <select
                value={newTestCase.httpMethod}
                onChange={(e) =>
                  setNewTestCase({ ...newTestCase, httpMethod: e.target.value })
                }
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
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
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
                Status
              </label>
              <input
                type="number"
                value={newTestCase.expectedStatus}
                onChange={(e) =>
                  setNewTestCase({
                    ...newTestCase,
                    expectedStatus: Number(e.target.value),
                  })
                }
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
                Score
              </label>
              <input
                type="number"
                required
                min={1}
                value={newTestCase.score}
                onChange={(e) =>
                  setNewTestCase({
                    ...newTestCase,
                    score: Number(e.target.value),
                  })
                }
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
                onFocus={(e) => { e.target.style.borderColor = "#ff4f00"; }}
                onBlur={(e) => { e.target.style.borderColor = "#c5c0b1"; }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
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
              URL Template
            </label>
            <input
              type="text"
              required
              placeholder="e.g. /api/students"
              value={newTestCase.urlTemplate}
              onChange={(e) =>
                setNewTestCase({ ...newTestCase, urlTemplate: e.target.value })
              }
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
              onFocus={(e) => { e.target.style.borderColor = "#ff4f00"; }}
              onBlur={(e) => { e.target.style.borderColor = "#c5c0b1"; }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: "8px 16px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#fffefb",
                backgroundColor: "#ff4f00",
                border: "1px solid #ff4f00",
                borderRadius: "4px",
                cursor: creating ? "not-allowed" : "pointer",
                opacity: creating ? 0.6 : 1,
              }}
            >
              {creating ? "Creating..." : "Add Test Case"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
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
              Cancel
            </button>
          </div>
        </form>
      )}

      {testCases.length === 0 ? (
        <EmptyState
          title="No test cases yet"
          description="Add test cases to define grading criteria."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {testCases.map((tc) => (
            <div
              key={tc.id}
              style={{
                backgroundColor: "#fffefb",
                border: "1px solid #c5c0b1",
                borderRadius: "5px",
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontFamily: "Inter, Arial, sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor:
                          tc.httpMethod === "GET"
                            ? "#f0f9ff"
                            : tc.httpMethod === "POST"
                              ? "#f0fdf4"
                              : tc.httpMethod === "PUT"
                                ? "#fff8f0"
                                : "#fef2f2",
                        color:
                          tc.httpMethod === "GET"
                            ? "#0369a1"
                            : tc.httpMethod === "POST"
                              ? "#166534"
                              : tc.httpMethod === "PUT"
                                ? "#c2410c"
                                : "#dc2626",
                      }}
                    >
                      {tc.httpMethod}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, Arial, sans-serif",
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "#201515",
                      }}
                    >
                      {tc.name}
                    </span>
                  </div>
                  <code
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.8125rem",
                      color: "#36342e",
                      backgroundColor: "#eceae3",
                      padding: "1px 6px",
                      borderRadius: "3px",
                    }}
                  >
                    {tc.urlTemplate}
                  </code>
                  <span
                    style={{
                      marginLeft: "12px",
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.8125rem",
                      color: "#939084",
                    }}
                  >
                    Status: {tc.expectedStatus} &middot; {tc.score} pts
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTestCase(tc.id)}
                  disabled={deleting === tc.id}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#dc2626",
                    cursor: deleting === tc.id ? "not-allowed" : "pointer",
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    opacity: deleting === tc.id ? 0.5 : 1,
                  }}
                >
                  {deleting === tc.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
