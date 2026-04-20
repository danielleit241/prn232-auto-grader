"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { GradingJob } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GradingPage() {
  const [jobs, setJobs] = React.useState<GradingJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadGradingJobs();
  }, []);

  const loadGradingJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Collect grading jobs from all submissions by listing assignments
      const assRes = await api.getAssignments();
      if (!assRes.status || !assRes.data) {
        setError("Failed to load");
        return;
      }

      const allJobs: GradingJob[] = [];
      const pendingJobs: GradingJob[] = [];
      await Promise.all(
        assRes.data.map(async (assignment) => {
          const subRes = await api.getSubmissionsByAssignment(assignment.id);
          if (subRes.status && subRes.data) {
            await Promise.all(
              subRes.data.map(async (sub) => {
                const jobRes = await api.getGradingJobsBySubmission(sub.id);
                if (jobRes.status && jobRes.data) {
                  const withSub = jobRes.data.map((j) => ({
                    ...j,
                    _submissionId: sub.id,
                    _studentCode: sub.studentCode,
                  }));
                  allJobs.push(...withSub.filter(
                    (j) => j.status === "Running" || j.status === "Pending"
                  ));
                }
              })
            );
          }
        })
      );

      // Sort by createdAt desc
      allJobs.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
      setJobs(allJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <LoadingSpinner fullPage label="Loading grading jobs..." />
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
            Grading
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
            Active Grading Jobs
          </h1>
        </div>
        <button
          onClick={loadGradingJobs}
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
          Refresh
        </button>
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

      {jobs.length === 0 ? (
        <EmptyState
          title="No active grading jobs"
          description="Grading jobs will appear here when grading is in progress. Trigger grading from an assignment's setup tab."
        />
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {jobs.map((job) => (
            <div
              key={job.id}
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
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <StatusBadge status={job.status} />
                <div>
                  <div
                    style={{
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "#201515",
                    }}
                  >
                    Submission: {(job as any)._studentCode || job.submissionId.slice(0, 8)}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.8125rem",
                      color: "#939084",
                    }}
                  >
                    {job.startedAt
                      ? `Started: ${new Date(job.startedAt).toLocaleString("vi-VN")}`
                      : job.createdAt
                        ? `Created: ${new Date(job.createdAt).toLocaleString("vi-VN")}`
                        : "Pending"}
                  </div>
                  {job.errorMessage && (
                    <div
                      style={{
                        fontFamily: "Inter, Arial, sans-serif",
                        fontSize: "0.8125rem",
                        color: "#dc2626",
                        marginTop: "4px",
                      }}
                    >
                      {job.errorMessage}
                    </div>
                  )}
                </div>
              </div>
              <Link
                href={`/submissions/${job.submissionId}`}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#ff4f00",
                  textDecoration: "none",
                }}
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}