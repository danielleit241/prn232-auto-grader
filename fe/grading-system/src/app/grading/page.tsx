"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { GradingJob, Submission } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";

export default function GradingPage() {
  const [jobs, setJobs] = React.useState<{ job: GradingJob; submission: Submission }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Poll for running jobs
  const [pollInterval, setPollInterval] = React.useState<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    loadGradingJobs();
  }, []);

  React.useEffect(() => {
    const hasRunning = jobs.some(
      (j) => j.job.status === "Pending" || j.job.status === "Running"
    );
    if (hasRunning && !pollInterval) {
      const interval = setInterval(loadGradingJobs, 3000);
      setPollInterval(interval);
    } else if (!hasRunning && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [jobs]);

  const loadGradingJobs = async () => {
    try {
      // Load recent submissions and their grading jobs
      const subRes = await api.getSubmissionsByAssignment("");
      // For now we track jobs in localStorage
      const jobIds = JSON.parse(localStorage.getItem("grading_jobs") || "[]") as string[];
      const loadedJobs: { job: GradingJob; submission: Submission }[] = [];

      // Actually we track submission IDs and poll those
      const subIds = JSON.parse(localStorage.getItem("grading_submissions") || "[]") as string[];

      for (const subId of subIds.slice(0, 50)) {
        const [subResult, jobsResult] = await Promise.all([
          api.getSubmissionById(subId),
          api.getGradingJobsBySubmission(subId),
        ]);
        if (subResult.status && subResult.data && jobsResult.status && jobsResult.data) {
          for (const job of jobsResult.data) {
            loadedJobs.push({ job, submission: subResult.data });
          }
        }
      }

      loadedJobs.sort(
        (a, b) =>
          new Date(b.job.createdAt || 0).getTime() -
          new Date(a.job.createdAt || 0).getTime()
      );
      setJobs(loadedJobs);
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
      <div style={{ marginBottom: "32px" }}>
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
          06 / Grading
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
          Grading Jobs
        </h1>
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

      {/* Live count */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "24px",
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "0.9375rem",
        }}
      >
        {[
          { label: "Pending", count: jobs.filter((j) => j.job.status === "Pending").length, color: "#939084" },
          { label: "Running", count: jobs.filter((j) => j.job.status === "Running").length, color: "#ff4f00" },
          { label: "Done", count: jobs.filter((j) => j.job.status === "Done").length, color: "#166534" },
          { label: "Failed", count: jobs.filter((j) => j.job.status === "Failed").length, color: "#dc2626" },
        ].map((stat) => (
          <div key={stat.label}>
            <span style={{ fontWeight: 600, color: stat.color }}>{stat.count}</span>
            <span style={{ color: "#939084", marginLeft: "4px" }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          title="No grading jobs"
          description="Trigger grading from an assignment's submissions tab."
        />
      ) : (
        <Table
          columns={[
            {
              key: "submission",
              header: "Submission",
              render: (item) => (
                <div>
                  <div style={{ fontWeight: 600, color: "#201515" }}>
                    {item.submission.studentCode}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#939084" }}>
                    {item.submission.id.slice(0, 8)}...
                  </div>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (item) => <StatusBadge status={item.job.status} />,
            },
            {
              key: "startedAt",
              header: "Started",
              render: (item) => (
                <span style={{ color: "#36342e", fontSize: "0.875rem" }}>
                  {item.job.startedAt
                    ? new Date(item.job.startedAt).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </span>
              ),
            },
            {
              key: "finishedAt",
              header: "Finished",
              render: (item) => (
                <span style={{ color: "#36342e", fontSize: "0.875rem" }}>
                  {item.job.finishedAt
                    ? new Date(item.job.finishedAt).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </span>
              ),
            },
            {
              key: "errorMessage",
              header: "Error",
              render: (item) => (
                <span
                  style={{
                    color: "#dc2626",
                    fontSize: "0.8125rem",
                    maxWidth: "200px",
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.job.errorMessage || "-"}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (item) => (
                <Link
                  href={`/submissions/${item.submission.id}`}
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
          data={jobs}
          keyExtractor={(item) => item.job.id}
          emptyMessage="No grading jobs"
        />
      )}
    </div>
  );
}