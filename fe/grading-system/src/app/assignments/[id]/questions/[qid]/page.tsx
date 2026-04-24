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
  const [jsonInput, setJsonInput] = React.useState('');
  const [jsonError, setJsonError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  // Score tracking
  const totalUsedScore = testCases.reduce((sum, tc) => sum + tc.score, 0);
  const maxScore = question?.maxScore ?? 0;
  const remainingScore = maxScore - totalUsedScore;
  const scorePercentage = maxScore > 0 ? Math.min((totalUsedScore / maxScore) * 100, 100) : 0;
  const isOverBudget = totalUsedScore > maxScore;
  const isExactMatch = totalUsedScore === maxScore;

  // JSON template for placeholder – differs by question type
  const isRazor = question?.type === 1;

  const jsonPlaceholderApi = `// Single test case (API):
{
  "httpMethod": "GET",
  "urlTemplate": "/api/students",
  "expectedStatus": 200,
  "isArray": true,
  "fields": ["id", "name"],
  "score": 1
}

// Or array of test cases:
[
  { "httpMethod": "GET", "urlTemplate": "/api/students", "expectedStatus": 200, "isArray": true, "score": 1 },
  { "httpMethod": "POST", "urlTemplate": "/api/students", "expectedStatus": 201, "input": { "name": "John" }, "expectedBody": { "id": 1, "name": "John" }, "score": 1 }
]`;

  const jsonPlaceholderRazor = `// Single test case (Razor):
{
  "httpMethod": "GET",
  "urlTemplate": "/Instructor",
  "expectedStatus": 200,
  "elementId": "ip_instructorName",
  "order": 1,
  "score": 1
}

// Or array of test cases (sequential flow):
[
  { "httpMethod": "POST", "urlTemplate": "/Login", "expectedStatus": 200, "input": { "username": "admin" }, "extract": { "token": "$.token" }, "order": 1, "score": 1 },
  { "httpMethod": "GET", "urlTemplate": "/Instructor", "expectedStatus": 200, "elementId": "ip_instructorName", "order": 2, "score": 1 },
  { "httpMethod": "GET", "urlTemplate": "/Instructor", "expectedStatus": 200, "selector": "table tbody tr", "selectorMinCount": 5, "order": 3, "score": 1 },
  { "httpMethod": "GET", "urlTemplate": "/Instructor/1", "expectedStatus": 200, "elementId": "span_1", "elementText": "1", "order": 4, "score": 1 }
]`;

  const jsonPlaceholder = isRazor ? jsonPlaceholderRazor : jsonPlaceholderApi;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapJsonToRequest = (obj: any): CreateTestCaseRequest => {
    const method = obj.httpMethod || obj.method || "GET";
    const url = obj.urlTemplate || obj.url || "";
    return {
      name: obj.name,
      httpMethod: method,
      urlTemplate: url,
      expectedStatus: obj.expectedStatus ?? obj.status ?? 200,
      input: obj.input ?? obj.requestBody ?? obj.body ?? undefined,
      expectedBody: obj.expectedBody ?? undefined,
      isArray: obj.isArray,
      fields: obj.fields,
      value: obj.value,
      score: obj.score ?? 1,
      elementId: obj.elementId,
      elementText: obj.elementText,
      selector: obj.selector,
      selectorText: obj.selectorText,
      selectorMinCount: obj.selectorMinCount,
      order: obj.order ?? 0,
      extract: obj.extract,
    };
  };

  const handleCreateFromJson = async () => {
    setJsonError(null);
    const trimmed = jsonInput.trim();
    if (!trimmed) {
      setJsonError("Please enter JSON for the test case(s).");
      return;
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      setJsonError("Invalid JSON. Please check syntax.");
      return;
    }

    // Normalize to array
    const items = Array.isArray(parsed) ? parsed : [parsed];
    if (items.length === 0) {
      setJsonError("JSON array is empty.");
      return;
    }

    // Map to CreateTestCaseRequest[]
    const requests: CreateTestCaseRequest[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (typeof item !== "object" || item === null) {
        setJsonError(`Item at index ${i} is not a valid object.`);
        return;
      }
      const req = mapJsonToRequest(item);
      if (!req.urlTemplate) {
        setJsonError(`Item ${i + 1}: "urlTemplate" is required.`);
        return;
      }
      if (req.score <= 0) {
        setJsonError(`Item ${i + 1}: "score" must be > 0.`);
        return;
      }
      requests.push(req);
    }

    // Validate total score
    const addedScore = requests.reduce((s, r) => s + r.score, 0);
    if (addedScore + totalUsedScore > maxScore) {
      setJsonError(
        `Total score of new test cases (${addedScore} pts) would exceed the max score (${maxScore}). Remaining budget: ${remainingScore} pts.`
      );
      return;
    }

    try {
      setCreating(true);
      const res = await api.createTestCases(questionId, requests);
      if (res.status && res.data) {
        setTestCases([...testCases, ...res.data]);
        setShowCreate(false);
        setJsonInput('');
        setJsonError(null);
      } else {
        setJsonError(res.message || "Failed to create test case(s).");
      }
    } catch {
      setJsonError("Network error creating test case(s).");
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
      <div style={{ marginBottom: "32px" }}>
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

      {/* ===== Score Tracker ===== */}
      <div
        style={{
          backgroundColor: isOverBudget ? "#fef2f2" : isExactMatch ? "#f0fdf4" : "#fffdf9",
          border: `1px solid ${isOverBudget ? "#fecaca" : isExactMatch ? "#bbf7d0" : "#eceae3"}`,
          borderRadius: "8px",
          padding: "20px 24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#36342e" }}>
            Score Allocation
          </span>
          <div style={{ display: "flex", gap: "16px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem" }}>
            <span style={{ color: "#939084" }}>
              Used: <strong style={{ color: isOverBudget ? "#dc2626" : "#201515" }}>{totalUsedScore}</strong>
            </span>
            <span style={{ color: "#939084" }}>
              Remaining: <strong style={{ color: remainingScore < 0 ? "#dc2626" : remainingScore === 0 ? "#166534" : "#c2410c" }}>{remainingScore}</strong>
            </span>
            <span style={{ color: "#939084" }}>
              Max: <strong style={{ color: "#201515" }}>{maxScore}</strong>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: "8px",
            backgroundColor: "#eceae3",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${scorePercentage}%`,
              backgroundColor: isOverBudget ? "#dc2626" : isExactMatch ? "#16a34a" : "#ff4f00",
              borderRadius: "4px",
              transition: "width 0.3s ease, background-color 0.3s ease",
            }}
          />
        </div>

        {/* Status messages */}
        {isOverBudget && (
          <div style={{ marginTop: "10px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", color: "#dc2626", fontWeight: 600 }}>
            ⚠ Total score ({totalUsedScore}) exceeds max score ({maxScore}). Remove or reduce test case scores.
          </div>
        )}
        {!isOverBudget && !isExactMatch && totalUsedScore > 0 && (
          <div style={{ marginTop: "10px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", color: "#c2410c", fontWeight: 500 }}>
            ℹ Total must equal max score ({maxScore}) before grading. {remainingScore} pts remaining.
          </div>
        )}
        {isExactMatch && testCases.length > 0 && (
          <div style={{ marginTop: "10px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", color: "#166534", fontWeight: 600 }}>
            ✓ Score allocation complete — all {maxScore} pts assigned.
          </div>
        )}
      </div>

      {/* Test Cases Header */}
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
          disabled={remainingScore <= 0}
          style={{
            padding: "8px 16px",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#fffefb",
            backgroundColor: remainingScore <= 0 ? "#939084" : "#ff4f00",
            border: `1px solid ${remainingScore <= 0 ? "#939084" : "#ff4f00"}`,
            borderRadius: "4px",
            cursor: remainingScore <= 0 ? "not-allowed" : "pointer",
            opacity: remainingScore <= 0 ? 0.6 : 1,
          }}
        >
          + New Test Case
        </button>
      </div>

      {showCreate && (
        <div
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
            Add Test Case via JSON
          </h3>

          {/* Score budget reminder */}
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#fff8f0",
              border: "1px solid #fed7aa",
              borderRadius: "5px",
              marginBottom: "16px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.8125rem",
              color: "#c2410c",
            }}
          >
            Remaining score budget: <strong>{remainingScore}</strong> pts &middot; Paste a single JSON object or an array of test cases
          </div>

          {/* JSON textarea */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#939084",
                marginBottom: "6px",
              }}
            >
              JSON Input
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                if (jsonError) setJsonError(null);
              }}
              placeholder={jsonPlaceholder}
              spellCheck={false}
              style={{
                width: "100%",
                minHeight: "500px",
                maxHeight: "70vh",
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
                border: jsonError ? "2px solid #dc2626" : "1px solid #c5c0b1",
                borderRadius: "6px",
                padding: "16px",
                fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                fontSize: "0.8125rem",
                lineHeight: "1.6",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
                tabSize: 2,
              }}
              onFocus={(e) => { if (!jsonError) e.target.style.borderColor = "#ff4f00"; }}
              onBlur={(e) => { if (!jsonError) e.target.style.borderColor = "#c5c0b1"; }}
            />
          </div>

          {/* JSON error */}
          {jsonError && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "5px",
                marginBottom: "16px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.8125rem",
                color: "#dc2626",
                fontWeight: 500,
              }}
            >
              ⚠ {jsonError}
            </div>
          )}

          {/* Supported fields hint */}
          <details style={{ marginBottom: "16px" }}>
            <summary
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#939084",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Supported fields reference ({isRazor ? "Razor" : "API"})
            </summary>
            <div
              style={{
                marginTop: "8px",
                padding: "12px 16px",
                backgroundColor: "#f5f4f0",
                borderRadius: "5px",
                fontFamily: "'Cascadia Code', 'Consolas', monospace",
                fontSize: "0.75rem",
                lineHeight: "1.8",
                color: "#36342e",
              }}
            >
              <div><strong>httpMethod</strong> — GET, POST, PUT, PATCH, DELETE <em>(required)</em></div>
              <div><strong>urlTemplate</strong> — e.g. {isRazor ? "/Instructor" : "/api/students"} <em>(required)</em></div>
              <div><strong>expectedStatus</strong> — HTTP status code <em>(default: 200)</em></div>
              <div><strong>input</strong> — request body / query params (object)</div>
              <div><strong>score</strong> — points for this test case <em>(required)</em></div>
              <div><strong>order</strong> — execution sequence for sequential flows <em>(default: 0)</em></div>
              {isRazor ? (
                <>
                  <div><strong>elementId</strong> — HTML element ID to check for existence</div>
                  <div><strong>elementText</strong> — expected text content of the element</div>
                  <div><strong>selector</strong> — CSS/XPath selector (e.g. &quot;table tbody tr&quot;)</div>
                  <div><strong>selectorText</strong> — text to find within selector match</div>
                  <div><strong>selectorMinCount</strong> — minimum number of matching elements</div>
                  <div><strong>extract</strong> — JSONPath map to extract from response into variables (e.g. {`{"token":"$.token"}`})</div>
                </>
              ) : (
                <>
                  <div><strong>expectedBody</strong> — exact expected response body (newman comparison)</div>
                  <div><strong>isArray</strong> — assert response is a JSON array</div>
                  <div><strong>fields</strong> — required fields in response object/array items</div>
                  <div><strong>value</strong> — string to find anywhere in response</div>
                </>
              )}
              <div><strong>name</strong> — display name <em>(auto-generated if omitted)</em></div>
            </div>
          </details>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleCreateFromJson}
              disabled={creating || !jsonInput.trim()}
              style={{
                padding: "8px 16px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#fffefb",
                backgroundColor: (creating || !jsonInput.trim()) ? "#939084" : "#ff4f00",
                border: `1px solid ${(creating || !jsonInput.trim()) ? "#939084" : "#ff4f00"}`,
                borderRadius: "4px",
                cursor: (creating || !jsonInput.trim()) ? "not-allowed" : "pointer",
                opacity: (creating || !jsonInput.trim()) ? 0.6 : 1,
              }}
            >
              {creating ? "Creating..." : "Add Test Case(s)"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setJsonError(null); setJsonInput(''); }}
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
        </div>
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
          {testCases.map((tc, idx) => (
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
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: "#eceae3",
                        fontFamily: "Inter, Arial, sans-serif",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: "#36342e",
                      }}
                    >
                      {idx + 1}
                    </span>
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
                    Status: {tc.expectedStatus ?? "—"} &middot;{" "}
                    {tc.order > 0 && (
                      <>Order: <strong>{tc.order}</strong> &middot;{" "}</>
                    )}
                    <strong style={{ color: "#ff4f00" }}>{tc.score} pts</strong>
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
