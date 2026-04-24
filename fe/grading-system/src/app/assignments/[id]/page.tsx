"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Upload, FileCode2, FileArchive, Link2, Users, Download, CheckCircle2, Lock } from "lucide-react";
import { api } from "@/lib";
import type { Assignment, Question, Submission, ExportJob } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";

type Tab = "setup" | "questions" | "submissions" | "export";

export default function AssignmentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const initialTab = (searchParams.get("tab") as Tab) || "setup";
  const [activeTab, setActiveTab] = React.useState<Tab>(initialTab);

  // Setup tab state
  const [sqlFile, setSqlFile] = React.useState<File | null>(null);
  const [givenZipFile, setGivenZipFile] = React.useState<File | null>(null);
  const [givenApiBaseUrl, setGivenApiBaseUrl] = React.useState("");
  const [savingSetup, setSavingSetup] = React.useState(false);
  const [setupMessage, setSetupMessage] = React.useState<string | null>(null);

  // Questions tab state
  const [showCreateQuestion, setShowCreateQuestion] = React.useState(false);
  const [newQuestion, setNewQuestion] = React.useState({
    title: "",
    type: "0" as "0" | "1",
    maxScore: 10,
    artifactFolderName: "",
  });
  const [creatingQuestion, setCreatingQuestion] = React.useState(false);

  // Submissions tab state
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = React.useState(false);
  const [triggering, setTriggering] = React.useState<string | null>(null);

  // Export tab state
  const [exportJob, setExportJob] = React.useState<ExportJob | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [gradingRound, setGradingRound] = React.useState("Lan 1");

  // Participants
  const [participants, setParticipants] = React.useState<
    { id: string; username: string; studentCode: string }[]
  >([]);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [bulkResult, setBulkResult] = React.useState<string | null>(null);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importResult, setImportResult] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // Polling
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const hasParticipants = participants.length > 0;
  const hasResources = !!(assignment?.databaseSqlPath || assignment?.givenApiBaseUrl || assignment?.hasGivenZip);
  const hasQuestions = questions.length > 0;

  React.useEffect(() => {
    loadAssignment();
    loadParticipants();
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const res = await api.getAssignmentById(assignmentId);
      if (res.status && res.data) {
        setAssignment(res.data);
        setGivenApiBaseUrl(res.data.givenApiBaseUrl || "");
      } else {
        setError(res.message || "Failed to load assignment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading");
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    const res = await api.getQuestionsByAssignment(assignmentId);
    if (res.status && res.data) {
      setQuestions(res.data);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const res = await api.getSubmissionsByAssignment(assignmentId);
      if (res.status && res.data) {
        setSubmissions(res.data);
      }
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadParticipants = async () => {
    const res = await api.getParticipants(assignmentId);
    if (res.status && res.data) {
      setParticipants(res.data);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "setup") loadParticipants();
    if (tab === "questions") loadQuestions();
    if (tab === "submissions") loadSubmissions();
  };

  // --- Setup handlers ---
  const handleSaveSetup = React.useCallback(async () => {
    if (!sqlFile && !givenApiBaseUrl && !givenZipFile) {
      setSetupMessage("Vui lòng chọn ít nhất 1 trong 3: file SQL, Given API URL, hoặc given.zip");
      return;
    }
    try {
      setSavingSetup(true);
      setSetupMessage(null);
      const res = await api.uploadAssignmentResources(
        assignmentId,
        sqlFile,
        givenApiBaseUrl || undefined,
        givenZipFile
      );
      if (res.status && res.data) {
        setAssignment(res.data);
        setSetupMessage("Resources uploaded successfully");
        setSqlFile(null);
        setGivenZipFile(null);
      } else {
        setSetupMessage(res.message || "Failed to save");
      }
    } catch {
      setSetupMessage("Error saving setup");
    } finally {
      setSavingSetup(false);
    }
  }, [assignmentId, sqlFile, givenApiBaseUrl, givenZipFile]);

  const handleTriggerGrading = React.useCallback(async () => {
    try {
      setExporting(true);
      setExportError(null);
      const res = await api.triggerGrading(assignmentId, gradingRound);
      if (res.status) {
        setExportError("Grading job triggered successfully");
        setExportJob(null);
      } else {
        setExportError(res.message || "Failed to trigger grading");
      }
    } catch {
      setExportError("Error triggering grading");
    } finally {
      setExporting(false);
    }
  }, [assignmentId, gradingRound]);

  const startPolling = (jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await api.getExportJob(jobId);
      if (res.status && res.data) {
        setExportJob(res.data);
        if (res.data.status === "Done" || res.data.status === "Failed") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }
    }, 2000);
  };

  // --- Question handlers ---
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.title.trim() || !newQuestion.artifactFolderName.trim()) return;
    try {
      setCreatingQuestion(true);
      const res = await api.createQuestion(assignmentId, {
        title: newQuestion.title,
        type: newQuestion.type === "0" ? 0 : 1,
        maxScore: Number(newQuestion.maxScore),
        artifactFolderName: newQuestion.artifactFolderName,
      });
      if (res.status && res.data) {
        setQuestions([...questions, res.data]);
        setShowCreateQuestion(false);
        setNewQuestion({ title: "", type: "0", maxScore: 10, artifactFolderName: "" });
      }
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;
    const res = await api.deleteQuestion(questionId);
    if (res.status) {
      setQuestions(questions.filter((q) => q.id !== questionId));
    }
  };

  // --- Submission handlers ---
  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm("Delete this submission?")) return;
    const res = await api.deleteSubmission(submissionId);
    if (res.status) {
      setSubmissions(submissions.filter((s) => s.id !== submissionId));
    }
  };

  const handleTriggerGradingForSubmission = async (submissionId: string) => {
    try {
      setTriggering(submissionId);
      const res = await api.triggerGradingSubmission(submissionId);
      if (res.status) {
        alert("Grading triggered successfully");
        loadSubmissions();
      }
    } finally {
      setTriggering(null);
    }
  };

  // --- Bulk upload ---
  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    try {
      setUploading(true);
      setBulkResult(null);
      const res = await api.bulkUpload(assignmentId, bulkFile, gradingRound || undefined);
      if (res.status && res.data) {
        setBulkResult(`Created: ${res.data.created}, Parsed: ${res.data.parsed}, Missing: ${res.data.missing}`);
        loadSubmissions();
      } else {
        setBulkResult(res.message || "Bulk upload failed");
      }
    } catch {
      setBulkResult("Error during bulk upload");
    } finally {
      setUploading(false);
    }
  };

  const handleImportParticipants = async () => {
    if (!importFile) return;
    try {
      setUploading(true);
      setImportResult(null);
      const res = await api.importParticipants(assignmentId, importFile);
      if (res.status && res.data) {
        setImportResult(`Created: ${res.data.created}, Skipped: ${res.data.skipped}`);
        await loadParticipants();
      } else {
        setImportResult(res.message || "Import failed");
      }
    } catch {
      setImportResult("Error during import");
    } finally {
      setUploading(false);
    }
  };

  // --- Export ---
  const handleCreateExport = async () => {
    try {
      setExporting(true);
      setExportError(null);
      const res = await api.createExport({ assignmentId, gradingRound });
      if (res.status && res.data) {
        setExportJob(res.data);
        startPolling(res.data.id);
      } else {
        setExportError(res.message || "Failed to create export");
      }
    } catch {
      setExportError("Error creating export");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadExport = async () => {
    if (!exportJob) return;
    try {
      const response = await api.downloadExport(exportJob.id);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = exportJob.assignmentCode || `assignment-${assignmentId}-export.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      setExportError("Download failed");
    }
  };

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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
    { key: "submissions", label: "Submit & Grade" },
    { key: "export", label: "Results & Export" },
  ];

  const steps = [
    { label: "Import Participants", done: hasParticipants },
    { label: "Upload Resources", done: hasResources },
    { label: "Setup Questions", done: hasQuestions },
    { label: "Upload & Grade", done: submissions.length > 0 },
    { label: "Export Results", done: false },
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
        <Link href="/exam-sessions" style={{ color: "#939084", textDecoration: "none" }}>
          Exam Sessions
        </Link>
        {assignment.examSessionId && (
          <>
            <span style={{ margin: "0 8px" }}>/</span>
            <Link href={`/exam-sessions/${assignment.examSessionId}`} style={{ color: "#939084", textDecoration: "none" }}>
              Session
            </Link>
          </>
        )}
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "#201515" }}>{assignment.code}</span>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
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
          Assignment
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
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
            {assignment.code} — {assignment.title}
          </h1>
        </div>
        {assignment.description && (
          <p style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "1rem", color: "#36342e" }}>
            {assignment.description}
          </p>
        )}
      </div>

      {/* ===== Stepper ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0",
          padding: "16px 24px",
          backgroundColor: "#fffdf9",
          border: "1px solid #eceae3",
          borderRadius: "8px",
          marginBottom: "28px",
          overflowX: "auto",
        }}
      >
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: step.done ? "#16a34a" : "#eceae3",
                  color: step.done ? "#fff" : "#939084",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                {step.done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span
                style={{
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.8125rem",
                  fontWeight: step.done ? 600 : 500,
                  color: step.done ? "#166534" : "#939084",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "2px",
                  minWidth: "24px",
                  margin: "0 12px",
                  backgroundColor: step.done ? "#16a34a" : "#eceae3",
                  transition: "background-color 0.2s ease",
                }}
              />
            )}
          </React.Fragment>
        ))}
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

      {/* ===== SETUP TAB ===== */}
      {activeTab === "setup" && (
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {/* Step 1: Import Participants (MUST be first) */}
          <div
            style={{
              backgroundColor: "#fffefb",
              border: hasParticipants ? "1px solid #bbf7d0" : "1px solid #ff4f00",
              borderRadius: "5px",
              padding: "32px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              {hasParticipants ? <CheckCircle2 size={18} color="#16a34a" /> : <Users size={18} color="#ff4f00" />}
              <h2 style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "1.25rem", fontWeight: 600, color: "#201515", margin: 0 }}>
                Step 1: Import Participants
              </h2>
            </div>
            {hasParticipants ? (
              <p style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", color: "#166534", marginBottom: "16px" }}>
                ✓ {participants.length} participant(s) imported. You can re-import to update.
              </p>
            ) : (
              <p style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", color: "#c2410c", marginBottom: "16px" }}>
                ⚠ You must import participants before proceeding. Format: username,studentCode
              </p>
            )}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", border: `1px dashed ${importFile ? "#ff4f00" : "#c5c0b1"}`, borderRadius: "5px", backgroundColor: importFile ? "#fff8f5" : "#fffefb", cursor: "pointer", transition: "border-color 0.15s, background-color 0.15s" }}>
                <Upload size={16} color={importFile ? "#ff4f00" : "#939084"} />
                <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", color: importFile ? "#ff4f00" : "#939084", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {importFile ? importFile.name : "Chọn file .csv…"}
                </span>
                {importFile && (
                  <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.75rem", color: "#939084", flexShrink: 0 }}>
                    {(importFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
                <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
              </label>
            </div>
            {importResult && (
              <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px", color: "#166534", marginBottom: "16px" }}>
                {importResult}
              </div>
            )}
            <button onClick={handleImportParticipants} disabled={!importFile || uploading} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#fffefb", backgroundColor: "#ff4f00", border: "1px solid #ff4f00", borderRadius: "4px", cursor: !importFile || uploading ? "not-allowed" : "pointer", opacity: !importFile || uploading ? 0.6 : 1 }}>
              <Users size={15} />
              {uploading ? "Importing..." : "Import Participants"}
            </button>
          </div>

          {/* Lock banner when no participants */}
          {!hasParticipants && (
            <div style={{ padding: "16px 20px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "5px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Lock size={16} color="#dc2626" />
              <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", color: "#dc2626", fontWeight: 500 }}>
                Import participants first to unlock the sections below.
              </span>
            </div>
          )}

          {/* Step 2: Upload Resources (locked if no participants) */}
          <div style={{ opacity: hasParticipants ? 1 : 0.4, pointerEvents: hasParticipants ? "auto" : "none" }}>
          <div
            style={{
              backgroundColor: "#fffefb",
              border: "1px solid #c5c0b1",
              borderRadius: "5px",
              padding: "32px",
            }}
          >
            <h2
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#201515",
                marginBottom: "24px",
              }}
            >
              Assignment Setup
            </h2>

            {setupMessage && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: setupMessage.includes("success")
                    ? "#f0fdf4"
                    : "#fef2f2",
                  border: `1px solid ${setupMessage.includes("success") ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: "4px",
                  color: setupMessage.includes("success") ? "#166534" : "#dc2626",
                  marginBottom: "16px",
                }}
              >
                {setupMessage}
              </div>
            )}

            {/* Current status */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "0.8125rem", fontWeight: 600, backgroundColor: assignment.databaseSqlPath ? "#f0fdf4" : "#eceae3", color: assignment.databaseSqlPath ? "#166534" : "#939084", border: `1px solid ${assignment.databaseSqlPath ? "#bbf7d0" : "#c5c0b1"}` }}>
                SQL: {assignment.databaseSqlPath ? "✓ Đã upload" : "Chưa có"}
              </span>
              <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "0.8125rem", fontWeight: 600, backgroundColor: assignment.hasGivenZip ? "#f0fdf4" : "#eceae3", color: assignment.hasGivenZip ? "#166534" : "#939084", border: `1px solid ${assignment.hasGivenZip ? "#bbf7d0" : "#c5c0b1"}` }}>
                Given ZIP: {assignment.hasGivenZip ? "✓ Đã upload" : "Chưa có"}
              </span>
              <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "0.8125rem", fontWeight: 600, backgroundColor: assignment.givenApiBaseUrl ? "#f0fdf4" : "#eceae3", color: assignment.givenApiBaseUrl ? "#166534" : "#939084", border: `1px solid ${assignment.givenApiBaseUrl ? "#bbf7d0" : "#c5c0b1"}` }}>
                Given URL: {assignment.givenApiBaseUrl || "Chưa có"}
              </span>
            </div>

            {/* SQL file upload */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#36342e", marginBottom: "8px" }}>
                <FileCode2 size={15} color="#939084" />
                Database SQL (.sql)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  border: `1px dashed ${sqlFile ? "#ff4f00" : "#c5c0b1"}`,
                  borderRadius: "5px",
                  backgroundColor: sqlFile ? "#fff8f5" : "#fffefb",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background-color 0.15s",
                }}
              >
                <Upload size={16} color={sqlFile ? "#ff4f00" : "#939084"} />
                <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", color: sqlFile ? "#ff4f00" : "#939084", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {sqlFile ? sqlFile.name : "Chọn file .sql…"}
                </span>
                {sqlFile && (
                  <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.75rem", color: "#939084", flexShrink: 0 }}>
                    {(sqlFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
                <input type="file" accept=".sql" onChange={(e) => setSqlFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
              </label>
            </div>

            {/* Given API Base URL */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#36342e", marginBottom: "8px" }}>
                <Link2 size={15} color="#939084" />
                Given API Base URL
              </label>
              <input
                type="text"
                value={givenApiBaseUrl}
                onChange={(e) => setGivenApiBaseUrl(e.target.value)}
                placeholder="e.g. https://api.example.com"
                style={{ width: "100%", backgroundColor: "#fffefb", color: "#201515", border: "1px solid #c5c0b1", borderRadius: "5px", padding: "10px 14px", fontFamily: "Inter, Arial, sans-serif", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Given ZIP upload */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#36342e", marginBottom: "6px" }}>
                <FileArchive size={15} color="#939084" />
                Given API ZIP
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 400, color: "#939084", fontSize: "0.8125rem" }}>
                  <span>→</span>
                  <span>extract</span>
                  <span>→</span>
                  <span>source code</span>
                </span>
              </label>
              <p style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", color: "#939084", margin: "0 0 8px" }}>
                Worker tự extract và khởi động khi chấm Q2. Ưu tiên hơn Given API URL.
              </p>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  border: `1px dashed ${givenZipFile ? "#ff4f00" : "#c5c0b1"}`,
                  borderRadius: "5px",
                  backgroundColor: givenZipFile ? "#fff8f5" : "#fffefb",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background-color 0.15s",
                }}
              >
                <Upload size={16} color={givenZipFile ? "#ff4f00" : "#939084"} />
                <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", color: givenZipFile ? "#ff4f00" : "#939084", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {givenZipFile ? givenZipFile.name : "Chọn file .zip…"}
                </span>
                {givenZipFile && (
                  <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.75rem", color: "#939084", flexShrink: 0 }}>
                    {(givenZipFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
                <input type="file" accept=".zip" onChange={(e) => setGivenZipFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
              </label>
            </div>

            <button
              onClick={handleSaveSetup}
              disabled={savingSetup}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fffefb",
                backgroundColor: "#ff4f00",
                border: "1px solid #ff4f00",
                borderRadius: "4px",
                cursor: savingSetup ? "not-allowed" : "pointer",
                opacity: savingSetup ? 0.6 : 1,
              }}
            >
              <Upload size={16} />
              {savingSetup ? "Uploading..." : "Upload Resources"}
            </button>
          </div>
          </div>{/* close lock wrapper */}
        </div>
      )}

      {/* ===== QUESTIONS TAB ===== */}
      {activeTab === "questions" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "1.25rem", fontWeight: 600, color: "#201515", margin: 0 }}>
              Questions ({questions.length})
            </h2>
            <button
              onClick={() => setShowCreateQuestion(true)}
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

          {showCreateQuestion && (
            <form
              onSubmit={handleCreateQuestion}
              style={{
                backgroundColor: "#fffefb",
                border: "1px solid #c5c0b1",
                borderRadius: "5px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "1.125rem", fontWeight: 600, color: "#201515", marginBottom: "16px" }}>
                Create New Question
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", fontWeight: 600, color: "#36342e", marginBottom: "6px" }}>
                    Title <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                    placeholder="e.g. Question 1"
                    style={{ width: "100%", backgroundColor: "#fffefb", color: "#201515", border: "1px solid #c5c0b1", borderRadius: "5px", padding: "8px 12px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", fontWeight: 600, color: "#36342e", marginBottom: "6px" }}>
                    Type
                  </label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as "0" | "1" })}
                    style={{ width: "100%", backgroundColor: "#fffefb", color: "#201515", border: "1px solid #c5c0b1", borderRadius: "5px", padding: "8px 12px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", outline: "none" }}
                  >
                    <option value="0">API</option>
                    <option value="1">Razor</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", fontWeight: 600, color: "#36342e", marginBottom: "6px" }}>
                    Max Score
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newQuestion.maxScore}
                    onChange={(e) => setNewQuestion({ ...newQuestion, maxScore: Number(e.target.value) })}
                    style={{ width: "100%", backgroundColor: "#fffefb", color: "#201515", border: "1px solid #c5c0b1", borderRadius: "5px", padding: "8px 12px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", fontWeight: 600, color: "#36342e", marginBottom: "6px" }}>
                    Artifact Folder <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion.artifactFolderName}
                    onChange={(e) => setNewQuestion({ ...newQuestion, artifactFolderName: e.target.value })}
                    placeholder="e.g. Q1"
                    style={{ width: "100%", backgroundColor: "#fffefb", color: "#201515", border: "1px solid #c5c0b1", borderRadius: "5px", padding: "8px 12px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", outline: "none" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="submit"
                  disabled={creatingQuestion}
                  style={{ padding: "8px 16px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#fffefb", backgroundColor: "#ff4f00", border: "1px solid #ff4f00", borderRadius: "4px", cursor: creatingQuestion ? "not-allowed" : "pointer", opacity: creatingQuestion ? 0.6 : 1 }}
                >
                  {creatingQuestion ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateQuestion(false)}
                  style={{ padding: "8px 16px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#36342e", backgroundColor: "#eceae3", border: "1px solid #c5c0b1", borderRadius: "8px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {questions.length === 0 ? (
            <EmptyState
              title="No questions yet"
              description="Create questions to define test cases for grading."
              action={
                <button
                  onClick={() => setShowCreateQuestion(true)}
                  style={{ padding: "8px 16px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#fffefb", backgroundColor: "#ff4f00", border: "1px solid #ff4f00", borderRadius: "4px", cursor: "pointer" }}
                >
                  + New Question
                </button>
              }
            />
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {questions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: "#fffefb",
                    border: "1px solid #c5c0b1",
                    borderRadius: "5px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ padding: "2px 8px", backgroundColor: "#eceae3", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, color: "#36342e" }}>
                        {q.type === 0 ? "API" : "Razor"}
                      </span>
                      <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "1rem", fontWeight: 600, color: "#201515" }}>
                        {q.title}
                      </span>
                    </div>
                    <div style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", color: "#939084" }}>
                      Folder: {q.artifactFolderName} | Max Score: {q.maxScore}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      href={`/assignments/${assignmentId}/questions/${q.id}`}
                      style={{ padding: "6px 12px", fontSize: "0.8125rem", fontWeight: 600, color: "#fffefb", backgroundColor: "#ff4f00", border: "1px solid #ff4f00", borderRadius: "4px", textDecoration: "none" }}
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      style={{ padding: "6px 12px", fontSize: "0.8125rem", fontWeight: 600, color: "#dc2626", backgroundColor: "transparent", border: "1px solid #c5c0b1", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== SUBMISSIONS TAB ===== */}
      {activeTab === "submissions" && (
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
            <h2 style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "1.25rem", fontWeight: 600, color: "#201515", margin: 0 }}>
              Submissions ({submissions.length})
            </h2>
          </div>

          {/* Bulk Upload & Grade */}
          <div
            style={{
              backgroundColor: "#fffdf9",
              border: "1px solid #eceae3",
              borderRadius: "5px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h3 style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "1.125rem", fontWeight: 600, color: "#201515", marginBottom: "16px" }}>
              Upload & Grade Submissions
            </h3>

            {/* Step 1: Grading Round */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", fontWeight: 600, color: "#36342e", marginBottom: "6px" }}>
                Grading Round <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={gradingRound}
                onChange={(e) => setGradingRound(e.target.value)}
                placeholder="e.g. Lần 1, Lần 2"
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  backgroundColor: "#fffefb",
                  color: "#201515",
                  border: "1px solid #c5c0b1",
                  borderRadius: "5px",
                  padding: "8px 12px",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.9375rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.75rem", color: "#939084", margin: "4px 0 0" }}>
                Specify the grading round label (e.g. &quot;Lần 1&quot;). Used to tag submissions and export results.
              </p>
            </div>

            {/* Step 2: Upload ZIP */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", fontWeight: 600, color: "#36342e", marginBottom: "6px" }}>
                Submissions ZIP
              </label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 14px",
                    border: `1px dashed ${bulkFile ? "#ff4f00" : "#c5c0b1"}`,
                    borderRadius: "5px",
                    backgroundColor: bulkFile ? "#fff8f5" : "#fffefb",
                    cursor: "pointer",
                    flex: 1,
                    minWidth: "200px",
                    transition: "border-color 0.15s, background-color 0.15s",
                  }}
                >
                  <Upload size={15} color={bulkFile ? "#ff4f00" : "#939084"} />
                  <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", color: bulkFile ? "#ff4f00" : "#939084", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bulkFile ? bulkFile.name : "Chọn master.zip…"}
                  </span>
                  {bulkFile && (
                    <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.75rem", color: "#939084", flexShrink: 0 }}>
                      {(bulkFile.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                  <input type="file" accept=".zip" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                </label>
                <button
                  onClick={handleBulkUpload}
                  disabled={!bulkFile || uploading}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#fffefb", backgroundColor: "#ff4f00", border: "1px solid #ff4f00", borderRadius: "4px", cursor: !bulkFile || uploading ? "not-allowed" : "pointer", opacity: !bulkFile || uploading ? 0.6 : 1, flexShrink: 0 }}
                >
                  <Upload size={15} />
                  {uploading ? "Uploading..." : "Upload Submissions"}
                </button>
              </div>
              {bulkResult && (
                <div style={{ padding: "10px 14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "5px", marginTop: "10px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", color: "#166534" }}>
                  ✓ {bulkResult}
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", backgroundColor: "#eceae3", margin: "20px 0" }} />

            {/* Step 3: Grade Submissions */}
            <div>
              <h4 style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "#201515", marginBottom: "8px" }}>
                Grade Submissions
              </h4>
              <p style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", color: "#939084", marginBottom: "12px" }}>
                Start the grading worker for all pending submissions in round <strong style={{ color: "#201515" }}>&quot;{gradingRound}&quot;</strong>.
              </p>

              {exportError && (
                <div style={{ padding: "10px 14px", backgroundColor: exportError.includes("success") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${exportError.includes("success") ? "#bbf7d0" : "#fecaca"}`, borderRadius: "5px", marginBottom: "12px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.8125rem", color: exportError.includes("success") ? "#166534" : "#dc2626" }}>
                  {exportError}
                </div>
              )}

              <button
                onClick={handleTriggerGrading}
                disabled={exporting || !gradingRound.trim()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "#fffefb",
                  backgroundColor: (exporting || !gradingRound.trim()) ? "#939084" : "#16a34a",
                  border: `1px solid ${(exporting || !gradingRound.trim()) ? "#939084" : "#16a34a"}`,
                  borderRadius: "4px",
                  cursor: (exporting || !gradingRound.trim()) ? "not-allowed" : "pointer",
                  opacity: (exporting || !gradingRound.trim()) ? 0.6 : 1,
                }}
              >
                {exporting ? "Grading..." : "▶ Grade Submissions"}
              </button>
            </div>
          </div>

          {loadingSubmissions ? (
            <LoadingSpinner fullPage label="Loading submissions..." />
          ) : submissions.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="Upload submissions via the section above and click Grade Submissions."
            />
          ) : (
            <Table
              columns={[
                {
                  key: "student",
                  header: "Student",
                  render: (s) => (
                    <div>
                      <div style={{ fontWeight: 600, color: "#201515" }}>{s.studentCode}</div>
                      <div style={{ fontSize: "0.8125rem", color: "#939084" }}>{s.username}</div>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (s) => <StatusBadge status={s.status} />,
                },
                {
                  key: "artifact",
                  header: "Artifact",
                  render: (s) => (
                    <span style={{ fontWeight: 600, color: s.hasArtifact ? "#166534" : "#dc2626", fontSize: "0.875rem" }}>
                      {s.hasArtifact ? "Yes" : "No"}
                    </span>
                  ),
                },
                {
                  key: "score",
                  header: "Score",
                  render: (s) =>
                    s.totalScore !== undefined ? (
                      <span style={{ fontWeight: 600, color: (s.totalScore ?? 0) / (s.maxScore ?? 1) >= 0.5 ? "#166534" : "#dc2626" }}>
                        {s.totalScore} / {s.maxScore}
                      </span>
                    ) : (
                      <span style={{ color: "#939084" }}>-</span>
                    ),
                },
                {
                  key: "createdAt",
                  header: "Submitted",
                  render: (s) => (
                    <span style={{ color: "#939084", fontSize: "0.875rem" }}>
                      {new Date(s.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  render: (s) => (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link
                        href={`/submissions/${s.id}`}
                        style={{ padding: "4px 10px", fontSize: "0.8125rem", fontWeight: 600, color: "#fffefb", backgroundColor: "#ff4f00", border: "1px solid #ff4f00", borderRadius: "4px", textDecoration: "none" }}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleTriggerGradingForSubmission(s.id)}
                        disabled={triggering === s.id}
                        style={{ padding: "4px 10px", fontSize: "0.8125rem", fontWeight: 600, color: "#36342e", backgroundColor: "#eceae3", border: "1px solid #c5c0b1", borderRadius: "4px", cursor: triggering === s.id ? "not-allowed" : "pointer", opacity: triggering === s.id ? 0.6 : 1 }}
                      >
                        {triggering === s.id ? "..." : "Grade"}
                      </button>
                      <button
                        onClick={() => handleDeleteSubmission(s.id)}
                        style={{ padding: "4px 10px", fontSize: "0.8125rem", fontWeight: 600, color: "#dc2626", backgroundColor: "transparent", border: "1px solid #c5c0b1", borderRadius: "4px", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  ),
                },
              ]}
              data={submissions}
              keyExtractor={(s) => s.id}
              emptyMessage="No submissions found"
            />
          )}
        </div>
      )}

      {/* ===== EXPORT TAB ===== */}
      {activeTab === "export" && (
        <div>
          <h2 style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "1.25rem", fontWeight: 600, color: "#201515", marginBottom: "8px" }}>
            Export Assignment Results
          </h2>
          <p style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", color: "#939084", marginBottom: "32px" }}>
            Download grading results for all students into an Excel file.
          </p>

          <div style={{ backgroundColor: "#fffefb", border: "1px solid #c5c0b1", borderRadius: "5px", padding: "32px", maxWidth: "500px" }}>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#36342e", marginBottom: "8px" }}>
                Grading Round
              </label>
              <input
                type="text"
                value={gradingRound}
                onChange={(e) => setGradingRound(e.target.value)}
                placeholder="e.g. Lan 1"
                style={{ width: "100%", backgroundColor: "#fffefb", color: "#201515", border: "1px solid #c5c0b1", borderRadius: "5px", padding: "10px 14px", fontFamily: "Inter, Arial, sans-serif", fontSize: "1rem", outline: "none" }}
              />
            </div>

            {exportError && (
              <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", color: "#dc2626", marginBottom: "16px" }}>
                {exportError}
              </div>
            )}

            {exportJob && (
              <div style={{ padding: "16px", backgroundColor: exportJob.status === "Done" ? "#f0fdf4" : exportJob.status === "Failed" ? "#fef2f2" : "#fff8f0", border: `1px solid ${exportJob.status === "Done" ? "#bbf7d0" : exportJob.status === "Failed" ? "#fecaca" : "#ff4f00"}`, borderRadius: "4px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "#201515", margin: 0 }}>
                    Export Status: <StatusBadge status={exportJob.status} />
                  </p>
                  {exportJob.status === "Done" && (
                    <button
                      onClick={handleDownloadExport}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontFamily: "Inter, Arial, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#fffefb", backgroundColor: "#ff4f00", border: "1px solid #ff4f00", borderRadius: "4px", cursor: "pointer" }}
                    >
                      <Download size={15} />
                      Download
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleCreateExport}
              disabled={exporting}
              style={{
                padding: "12px 20px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fffefb",
                backgroundColor: "#ff4f00",
                border: "1px solid #ff4f00",
                borderRadius: "4px",
                cursor: exporting ? "not-allowed" : "pointer",
                opacity: exporting ? 0.6 : 1,
              }}
            >
              {exporting ? "Creating export..." : "Create Export"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}