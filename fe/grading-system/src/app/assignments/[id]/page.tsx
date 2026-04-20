"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib";
import type { Assignment, Question, ExportJob } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";

type Tab = "setup" | "questions" | "submissions" | "export";

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<Tab>("setup");

  React.useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const res = await api.getAssignmentById(assignmentId);
      if (res.status && res.data) {
        setAssignment(res.data);
      } else {
        setError(res.message || "Failed to load assignment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <LoadingSpinner fullPage label="Loading assignment..." />
      </div>
    );
  }

  if (error || !assignment) {
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
          {error || "Assignment not found"}
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "setup", label: "Setup" },
    { key: "questions", label: "Questions" },
    { key: "submissions", label: "Submissions" },
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
        {assignment.examSessionId && (
          <>
            <span style={{ margin: "0 8px" }}>/</span>
            <Link
              href={`/exam-sessions/${assignment.examSessionId}`}
              style={{ color: "#939084", textDecoration: "none" }}
            >
              Session
            </Link>
          </>
        )}
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "#201515" }}>{assignment.title}</span>
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
          03 / Assignment
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              backgroundColor: "#eceae3",
              borderRadius: "4px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#36342e",
            }}
          >
            {assignment.code}
          </span>
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
            {assignment.title}
          </h1>
        </div>
        {assignment.description && (
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "1rem",
              color: "#36342e",
            }}
          >
            {assignment.description}
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
            onClick={() => setActiveTab(tab.key)}
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
      {activeTab === "setup" && (
        <SetupTab assignment={assignment} />
      )}
      {activeTab === "questions" && (
        <QuestionsTab assignmentId={assignmentId} />
      )}
      {activeTab === "submissions" && (
        <SubmissionsTab assignmentId={assignmentId} />
      )}
      {activeTab === "export" && (
        <AssignmentExportTab assignment={assignment} />
      )}
    </div>
  );
}

// ===== SETUP TAB =====
function SetupTab({ assignment }: { assignment: Assignment }) {
  const [givenApiBaseUrl, setGivenApiBaseUrl] = React.useState(
    assignment.givenApiBaseUrl || ""
  );
  const [uploadingDb, setUploadingDb] = React.useState(false);
  const [dbFile, setDbFile] = React.useState<File | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUploadResources = async () => {
    try {
      setUploadingDb(true);
      setMessage(null);
      const res = await api.uploadAssignmentResources(
        assignment.id,
        dbFile,
        givenApiBaseUrl || undefined
      );
      if (res.status) {
        setMessage({ type: "success", text: "Resources updated successfully" });
      } else {
        setMessage({ type: "error", text: res.message || "Upload failed" });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setUploadingDb(false);
    }
  };

  return (
    <div style={{ maxWidth: "700px" }}>
      <h2
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#201515",
          marginBottom: "24px",
        }}
      >
        Assignment Resources
      </h2>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: "4px",
            color: message.type === "success" ? "#166534" : "#dc2626",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.9375rem",
            marginBottom: "20px",
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          backgroundColor: "#fffefb",
          border: "1px solid #c5c0b1",
          borderRadius: "5px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
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
            Given API Base URL
          </label>
          <input
            type="url"
            value={givenApiBaseUrl}
            onChange={(e) => setGivenApiBaseUrl(e.target.value)}
            placeholder="e.g. http://localhost:5049"
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

        <div style={{ marginBottom: "20px" }}>
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
            Database SQL File
          </label>
          <input
            type="file"
            accept=".sql"
            onChange={(e) => setDbFile(e.target.files?.[0] || null)}
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.9375rem",
              color: "#201515",
            }}
          />
          {assignment.databaseSqlPath && (
            <p
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.8125rem",
                color: "#939084",
                marginTop: "6px",
              }}
            >
              Current: {assignment.databaseSqlPath}
            </p>
          )}
        </div>

        <button
          onClick={handleUploadResources}
          disabled={uploadingDb}
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
            cursor: uploadingDb ? "not-allowed" : "pointer",
            opacity: uploadingDb ? 0.6 : 1,
          }}
        >
          {uploadingDb ? "Uploading..." : "Save Resources"}
        </button>
      </div>

      {/* Import Participants */}
      <div
        style={{
          backgroundColor: "#fffefb",
          border: "1px solid #c5c0b1",
          borderRadius: "5px",
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#201515",
            marginBottom: "8px",
          }}
        >
          Import Participants (CSV)
        </h3>
        <p
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.875rem",
            color: "#939084",
            marginBottom: "16px",
          }}
        >
          Import a CSV file with columns: username, studentCode. This must be done before bulk uploading submissions.
        </p>
        <ImportParticipantsForm assignmentId={assignment.id} />
      </div>
    </div>
  );
}

function ImportParticipantsForm({ assignmentId }: { assignmentId: string }) {
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const handleImport = async () => {
    if (!csvFile) return;
    try {
      setImporting(true);
      const res = await api.importParticipants(assignmentId, csvFile);
      if (res.status && res.data) {
        setResult(res.data);
      }
    } catch {
      // ignore
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "0.9375rem",
          color: "#201515",
          marginBottom: "12px",
          display: "block",
        }}
      />
      <button
        onClick={handleImport}
        disabled={importing || !csvFile}
        style={{
          padding: "8px 16px",
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#36342e",
          backgroundColor: "#eceae3",
          border: "1px solid #c5c0b1",
          borderRadius: "8px",
          cursor: importing || !csvFile ? "not-allowed" : "pointer",
          opacity: importing || !csvFile ? 0.6 : 1,
        }}
      >
        {importing ? "Importing..." : "Import CSV"}
      </button>
      {result && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "4px",
          }}
        >
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              color: "#166534",
            }}
          >
            Created: {result.created}, Skipped: {result.skipped}
          </p>
          {result.errors.length > 0 && (
            <details>
              <summary
                style={{
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.8125rem",
                  color: "#dc2626",
                  cursor: "pointer",
                }}
              >
                {result.errors.length} error(s)
              </summary>
              {result.errors.map((e, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.8125rem",
                    color: "#dc2626",
                  }}
                >
                  {e}
                </p>
              ))}
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ===== QUESTIONS TAB =====
function QuestionsTab({ assignmentId }: { assignmentId: string }) {
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newQuestions, setNewQuestions] = React.useState([
    { title: "", type: 0 as 0 | 1, maxScore: 5, artifactFolderName: "" },
  ]);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    loadQuestions();
  }, [assignmentId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.getQuestionsByAssignment(assignmentId);
      if (res.status && res.data) {
        setQuestions(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const validQuestions = newQuestions.filter(
        (q) => q.title.trim() && q.artifactFolderName.trim()
      );
      if (validQuestions.length === 0) return;
      const res = await api.createQuestions(assignmentId, validQuestions);
      if (res.status && res.data) {
        setQuestions([...questions, ...res.data]);
        setShowCreate(false);
        setNewQuestions([
          { title: "", type: 0, maxScore: 5, artifactFolderName: "" },
        ]);
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const addQuestionRow = () => {
    setNewQuestions([
      ...newQuestions,
      { title: "", type: 0, maxScore: 5, artifactFolderName: "" },
    ]);
  };

  if (loading) return <LoadingSpinner label="Loading questions..." />;

  return (
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
          Questions ({questions.length})
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
          + New Question
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreateQuestions}
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
            Create Questions
          </h3>
          {newQuestions.map((q, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 80px 100px",
                gap: "12px",
                marginBottom: "12px",
                paddingBottom: "12px",
                borderBottom: idx < newQuestions.length - 1 ? "1px solid #eceae3" : "none",
              }}
            >
              <input
                type="text"
                required
                placeholder="Title (e.g. Cau 1: REST API)"
                value={q.title}
                onChange={(e) => {
                  const updated = [...newQuestions];
                  updated[idx].title = e.target.value;
                  setNewQuestions(updated);
                }}
                style={{
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
              <select
                value={q.type}
                onChange={(e) => {
                  const updated = [...newQuestions];
                  updated[idx].type = Number(e.target.value) as 0 | 1;
                  setNewQuestions(updated);
                }}
                style={{
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
                <option value={0}>Api</option>
                <option value={1}>Razor</option>
              </select>
              <input
                type="number"
                required
                min={1}
                placeholder="Score"
                value={q.maxScore}
                onChange={(e) => {
                  const updated = [...newQuestions];
                  updated[idx].maxScore = Number(e.target.value);
                  setNewQuestions(updated);
                }}
                style={{
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
              <input
                type="text"
                required
                placeholder="Folder (e.g. 1)"
                value={q.artifactFolderName}
                onChange={(e) => {
                  const updated = [...newQuestions];
                  updated[idx].artifactFolderName = e.target.value;
                  setNewQuestions(updated);
                }}
                style={{
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
          ))}
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
              {creating ? "Creating..." : "Create All"}
            </button>
            <button
              type="button"
              onClick={addQuestionRow}
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
              + Add Row
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
                backgroundColor: "transparent",
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

      {questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Create questions for this assignment."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {questions.map((q) => (
            <div
              key={q.id}
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
                  <StatusBadge
                    status={q.type === "Api" ? "Api" : "Razor"}
                    variant={q.type === "Api" ? "api" : "razor"}
                  />
                  <h3
                    style={{
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#201515",
                      margin: "8px 0 0 0",
                    }}
                  >
                    {q.title}
                  </h3>
                </div>
                <span
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#36342e",
                  }}
                >
                  {q.maxScore} pts
                </span>
              </div>
              <p
                style={{
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.8125rem",
                  color: "#939084",
                  marginBottom: "12px",
                }}
              >
                Folder: <code style={{ backgroundColor: "#eceae3", padding: "1px 4px", borderRadius: "3px" }}>{q.artifactFolderName}</code>
              </p>
              <Link
                href={`/assignments/${assignmentId}/questions/${q.id}`}
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
  );
}

// ===== SUBMISSIONS TAB =====
function SubmissionsTab({ assignmentId }: { assignmentId: string }) {
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [studentCodeFilter, setStudentCodeFilter] = React.useState("");
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [gradingRound, setGradingRound] = React.useState("Lan 1");
  const [uploading, setUploading] = React.useState(false);
  const [triggering, setTriggering] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState<any>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadSubmissions();
  }, [assignmentId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.getSubmissionsByAssignment(
        assignmentId,
        studentCodeFilter || undefined
      );
      if (res.status && res.data) {
        setSubmissions(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) return;
    try {
      setUploading(true);
      setUploadResult(null);
      setMessage(null);
      const res = await api.bulkUpload(assignmentId, uploadFile, gradingRound);
      if (res.status && res.data) {
        setUploadResult(res.data);
        loadSubmissions();
      } else {
        setMessage(res.message || "Upload failed");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleTriggerGrading = async () => {
    try {
      setTriggering(true);
      setMessage(null);
      const res = await api.triggerGrading(assignmentId, gradingRound);
      if (res.status) {
        setMessage(`Enqueued ${res.data} grading job(s)`);
      } else {
        setMessage(res.message || "Failed to trigger grading");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to trigger");
    } finally {
      setTriggering(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading submissions..." />;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
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
          Submissions ({submissions.length})
        </h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            value={studentCodeFilter}
            onChange={(e) => setStudentCodeFilter(e.target.value)}
            placeholder="Filter by student code"
            style={{
              padding: "6px 12px",
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
            onClick={loadSubmissions}
            style={{
              padding: "6px 12px",
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
            Filter
          </button>
        </div>
      </div>

      {/* Bulk Upload */}
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
          Bulk Upload Submissions
        </h3>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "12px",
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
              ZIP File
            </label>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem" }}
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
              Grading Round
            </label>
            <input
              type="text"
              value={gradingRound}
              onChange={(e) => setGradingRound(e.target.value)}
              placeholder="Lan 1"
              style={{
                padding: "6px 12px",
                backgroundColor: "#fffefb",
                color: "#201515",
                border: "1px solid #c5c0b1",
                borderRadius: "5px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={handleBulkUpload}
            disabled={uploading || !uploadFile}
            style={{
              padding: "10px 16px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#fffefb",
              backgroundColor: "#ff4f00",
              border: "1px solid #ff4f00",
              borderRadius: "4px",
              cursor: uploading || !uploadFile ? "not-allowed" : "pointer",
              opacity: uploading || !uploadFile ? 0.6 : 1,
            }}
          >
            {uploading ? "Uploading..." : "Upload & Parse"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleTriggerGrading}
            disabled={triggering}
            style={{
              padding: "10px 16px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#36342e",
              backgroundColor: "#eceae3",
              border: "1px solid #c5c0b1",
              borderRadius: "8px",
              cursor: triggering ? "not-allowed" : "pointer",
              opacity: triggering ? 0.6 : 1,
            }}
          >
            {triggering ? "Triggering..." : "Trigger Grading"}
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "4px",
              color: "#166534",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
            }}
          >
            {message}
          </div>
        )}

        {uploadResult && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "4px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
            }}
          >
            <p style={{ color: "#166534", fontWeight: 600 }}>
              Parsed: {uploadResult.parsed}, Created: {uploadResult.created}, Missing: {uploadResult.missing}
            </p>
            {uploadResult.errors?.length > 0 && (
              <details>
                <summary style={{ color: "#dc2626", cursor: "pointer" }}>
                  {uploadResult.errors.length} error(s)
                </summary>
                {uploadResult.errors.map((e: string, i: number) => (
                  <p key={i} style={{ color: "#dc2626" }}>{e}</p>
                ))}
              </details>
            )}
          </div>
        )}
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Upload submissions using the form above."
        />
      ) : (
        <Table
          columns={[
            {
              key: "studentCode",
              header: "Student",
              render: (s) => (
                <div>
                  <div style={{ fontWeight: 600, color: "#201515" }}>{s.studentCode}</div>
                  <div style={{ fontSize: "0.8125rem", color: "#939084" }}>{s.username}</div>
                </div>
              ),
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

// ===== EXPORT TAB =====
function AssignmentExportTab({ assignment }: { assignment: Assignment }) {
  const [exportJob, setExportJob] = React.useState<ExportJob | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [gradingRound, setGradingRound] = React.useState("Lan 1");
  const [error, setError] = React.useState<string | null>(null);

  const handleCreateExport = async () => {
    try {
      setExporting(true);
      setError(null);
      const res = await api.createExport({
        assignmentId: assignment.id,
        gradingRound,
      });
      if (res.status && res.data) {
        setExportJob(res.data);
        pollExportStatus(res.data.id);
      } else {
        setError(res.message || "Failed to create export");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setExporting(false);
    }
  };

  const pollExportStatus = async (exportId: string) => {
    const interval = setInterval(async () => {
      const res = await api.getExportJob(exportId);
      if (res.status && res.data) {
        setExportJob(res.data);
        if (res.data.status === "Done" || res.data.status === "Failed") {
          clearInterval(interval);
        }
      } else {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleDownload = async () => {
    if (!exportJob) return;
    try {
      const response = await api.downloadExport(exportJob.id);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${assignment.code}-results.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      setError("Download failed");
    }
  };

  return (
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
        Export Assignment Results
      </h2>
      <p
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "0.9375rem",
          color: "#939084",
          marginBottom: "32px",
        }}
      >
        Export grading results for assignment {assignment.code} to Excel.
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
            onFocus={(e) => { e.target.style.borderColor = "#ff4f00"; }}
            onBlur={(e) => { e.target.style.borderColor = "#c5c0b1"; }}
          />
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "4px",
              color: "#dc2626",
              marginBottom: "16px",
            }}
          >
            {error}
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
            <p style={{ fontFamily: "Inter, Arial, sans-serif", fontWeight: 600, marginBottom: "8px" }}>
              Status: <StatusBadge status={exportJob.status} />
            </p>
            {exportJob.errorMessage && (
              <p style={{ color: "#dc2626", fontSize: "0.8125rem" }}>{exportJob.errorMessage}</p>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleCreateExport}
            disabled={exporting || exportJob?.status === "Running"}
            style={{
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
            {exporting || exportJob?.status === "Running"
              ? "Exporting..."
              : "Create Export"}
          </button>
          {exportJob?.status === "Done" && (
            <button
              onClick={handleDownload}
              style={{
                padding: "20px 24px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#36342e",
                backgroundColor: "#eceae3",
                border: "1px solid #c5c0b1",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Download Excel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
