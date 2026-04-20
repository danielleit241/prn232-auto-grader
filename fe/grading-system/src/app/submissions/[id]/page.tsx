"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib";
import type {
  Submission,
  QuestionResult,
  GradingJob,
} from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdjustResultCard } from "@/components/ui/AdjustResultCard";

type Tab = "results" | "review";

export default function SubmissionDetailPage() {
  const params = useParams();
  const submissionId = params.id as string;

  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [results, setResults] = React.useState<QuestionResult[]>([]);
  const [gradingJobs, setGradingJobs] = React.useState<GradingJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<Tab>("results");

  // Review notes state
  const [notes, setNotes] = React.useState("");
  const [reviewedBy, setReviewedBy] = React.useState("");
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [notesMessage, setNotesMessage] = React.useState<string | null>(null);

  const loadSubmission = React.useCallback(async () => {
    try {
      setLoading(true);
      const [subRes, resultsRes, jobsRes] = await Promise.all([
        api.getSubmissionById(submissionId),
        api.getSubmissionResults(submissionId),
        api.getGradingJobsBySubmission(submissionId),
      ]);

      if (subRes.status && subRes.data) {
        setSubmission(subRes.data);
      } else {
        setError(subRes.message || "Failed to load submission");
      }

      if (resultsRes.status && resultsRes.data) {
        setResults(resultsRes.data);
      }

      if (jobsRes.status && jobsRes.data) {
        setGradingJobs(jobsRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  React.useEffect(() => {
    loadSubmission();
  }, [loadSubmission]);

  const handleSaveNotes = React.useCallback(async () => {
    try {
      setSavingNotes(true);
      setNotesMessage(null);
      const res = await api.addSubmissionNotes(
        submissionId,
        notes,
        reviewedBy || undefined
      );
      if (res.status) {
        setNotesMessage("Notes saved successfully");
      } else {
        setNotesMessage(res.message || "Failed to save notes");
      }
    } catch {
      setNotesMessage("Error saving notes");
    } finally {
      setSavingNotes(false);
    }
  }, [submissionId, notes, reviewedBy]);

  if (loading) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <LoadingSpinner fullPage label="Loading submission..." />
      </div>
    );
  }

  if (error || !submission) {
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
          {error || "Submission not found"}
        </div>
      </div>
    );
  }

  const totalScore = results.reduce((sum, r) => sum + r.finalScore, 0);
  const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
  const passCount = results.filter((r) => r.passed).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "results", label: "Results" },
    { key: "review", label: "Review" },
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
        <Link href="/submissions" style={{ color: "#939084", textDecoration: "none" }}>
          Submissions
        </Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "#201515" }}>{submission.studentCode}</span>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <StatusBadge status={submission.status} />
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
            {submission.studentCode}
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            gap: "24px",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "0.9375rem",
            color: "#36342e",
            flexWrap: "wrap",
          }}
        >
          <span>
            Artifact:{" "}
            <strong style={{ color: submission.hasArtifact ? "#166534" : "#dc2626" }}>
              {submission.hasArtifact ? "Present" : "Missing"}
            </strong>
          </span>
          <span>
            Score:{" "}
            <strong>
              {submission.totalScore !== undefined
                ? `${submission.totalScore} / ${submission.maxScore}`
                : `${totalScore} / ${maxScore}`}
            </strong>
          </span>
          <span>
            Passed: <strong>{passCount} / {results.length}</strong>
          </span>
          <span>
            Submitted:{" "}
            <strong>
              {new Date(submission.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid #c5c0b1",
          marginBottom: "32px",
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
              marginBottom: "-1px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== RESULTS TAB ===== */}
      {activeTab === "results" && (
        <div>
          {/* Grading Jobs */}
          {gradingJobs.length > 0 && (
            <div
              style={{
                backgroundColor: "#fffdf9",
                border: "1px solid #eceae3",
                borderRadius: "5px",
                padding: "16px 20px",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#36342e",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Grading History
              </h3>
              {gradingJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.875rem",
                  }}
                >
                  <StatusBadge status={job.status} />
                  <span style={{ color: "#36342e" }}>
                    {job.startedAt
                      ? new Date(job.startedAt).toLocaleString("vi-VN")
                      : "Pending"}
                  </span>
                  {job.errorMessage && (
                    <span style={{ color: "#dc2626" }}>{job.errorMessage}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Question Results */}
          {results.length === 0 ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                backgroundColor: "#fffefb",
                border: "1px solid #c5c0b1",
                borderRadius: "5px",
              }}
            >
              <p
                style={{
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "1rem",
                  color: "#939084",
                }}
              >
                No grading results yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {results.map((result) => (
                <div
                  key={result.id}
                  style={{
                    backgroundColor: "#fffefb",
                    border: "1px solid #c5c0b1",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  {/* Question Header */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #eceae3",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontFamily: "Inter, Arial, sans-serif",
                          fontSize: "1.125rem",
                          fontWeight: 600,
                          color: "#201515",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {result.questionTitle || `Question ${result.questionId}`}
                      </h3>
                      <span
                        style={{
                          fontFamily: "Inter, Arial, sans-serif",
                          fontSize: "0.8125rem",
                          color: "#939084",
                        }}
                      >
                        Student: {result.studentCode}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: "Inter, Arial, sans-serif",
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          color:
                            result.finalScore / result.maxScore >= 0.5
                              ? "#166534"
                              : "#dc2626",
                        }}
                      >
                        {result.finalScore}
                        <span style={{ fontSize: "1rem", color: "#939084" }}>
                          {" "}
                          / {result.maxScore}
                        </span>
                      </div>
                      {result.adjustedScore !== undefined && (
                        <span
                          style={{
                            fontFamily: "Inter, Arial, sans-serif",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#ff4f00",
                          }}
                        >
                          Adjusted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Test Cases Summary */}
                  <div
                    style={{
                      padding: "12px 20px",
                      backgroundColor: "#fffdf9",
                      display: "flex",
                      gap: "16px",
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.875rem",
                      color: "#36342e",
                    }}
                  >
                    <span>
                      Test Cases:{" "}
                      <strong>
                        {result.passedTestCases ?? 0} / {result.totalTestCases ?? 0}
                      </strong>
                    </span>
                    {result.adjustReason && (
                      <span style={{ color: "#ff4f00" }}>
                        Reason: {result.adjustReason}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== REVIEW TAB ===== */}
      {activeTab === "review" && (
        <div style={{ maxWidth: "700px" }}>
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
                marginBottom: "16px",
              }}
            >
              Review Notes
            </h3>

            {notesMessage && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor:
                    notesMessage.includes("success") || notesMessage.includes("saved")
                      ? "#f0fdf4"
                      : "#fef2f2",
                  border: `1px solid ${
                    notesMessage.includes("success") || notesMessage.includes("saved")
                      ? "#bbf7d0"
                      : "#fecaca"
                  }`,
                  borderRadius: "4px",
                  color:
                    notesMessage.includes("success") || notesMessage.includes("saved")
                      ? "#166534"
                      : "#dc2626",
                  marginBottom: "16px",
                }}
              >
                {notesMessage}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
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
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="Add review notes for this submission..."
                style={{
                  width: "100%",
                  backgroundColor: "#fffefb",
                  color: "#201515",
                  border: "1px solid #c5c0b1",
                  borderRadius: "5px",
                  padding: "10px 14px",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.9375rem",
                  outline: "none",
                  resize: "vertical",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#ff4f00"; }}
                onBlur={(e) => { e.target.style.borderColor = "#c5c0b1"; }}
              />
            </div>

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
                Reviewer
              </label>
              <input
                type="text"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
                placeholder="e.g. gv@fpt.edu.vn"
                style={{
                  width: "100%",
                  backgroundColor: "#fffefb",
                  color: "#201515",
                  border: "1px solid #c5c0b1",
                  borderRadius: "5px",
                  padding: "10px 14px",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.9375rem",
                  outline: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#ff4f00"; }}
                onBlur={(e) => { e.target.style.borderColor = "#c5c0b1"; }}
              />
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
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
                cursor: savingNotes ? "not-allowed" : "pointer",
                opacity: savingNotes ? 0.6 : 1,
              }}
            >
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>

          {/* Per-Question Adjustment */}
          {results.length > 0 && (
            <div style={{ marginTop: "32px" }}>
              <h3
                style={{
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#201515",
                  marginBottom: "16px",
                }}
              >
                Score Adjustments
              </h3>
              {results.map((result) => (
                <AdjustResultCard key={result.id} result={result} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}