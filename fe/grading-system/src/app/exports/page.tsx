"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { ExportJob } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";

export default function ExportsPage() {
  const [jobs, setJobs] = React.useState<ExportJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState<string | null>(null);

  // Use ref for interval ID to avoid stale closure
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    loadJobs();
  }, []);

  React.useEffect(() => {
    const hasRunning = jobs.some(
      (j) => j.status === "Pending" || j.status === "Running"
    );

    if (hasRunning && !pollRef.current) {
      pollRef.current = setInterval(loadJobs, 3000);
    } else if (!hasRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [jobs]);

  const loadJobs = async () => {
    // We can't list all exports, so we track them in localStorage
    try {
      const storedIds = JSON.parse(localStorage.getItem("export_jobs") || "[]") as string[];
      const loadedJobs: ExportJob[] = [];
      for (const id of storedIds) {
        const res = await api.getExportJob(id);
        if (res.status && res.data) {
          loadedJobs.push(res.data);
        }
      }
      // Sort by createdAt desc
      loadedJobs.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
      setJobs(loadedJobs);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (job: ExportJob) => {
    try {
      setDownloading(job.id);
      const response = await api.downloadExport(job.id);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = job.assignmentCode
          ? `${job.assignmentCode}-results.xlsx`
          : job.examSessionTitle
            ? `${job.examSessionTitle}-results.xlsx`
            : `export-${job.id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <LoadingSpinner fullPage label="Loading exports..." />
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
            05 / Exports
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
            Export Jobs
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

      {jobs.length === 0 ? (
        <EmptyState
          title="No export jobs"
          description="Create exports from assignment or exam session pages."
        />
      ) : (
        <Table
          columns={[
            {
              key: "assignmentCode",
              header: "Source",
              render: (j) => (
                <div>
                  {j.assignmentCode && (
                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor: "#eceae3",
                        borderRadius: "4px",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                      }}
                    >
                      {j.assignmentCode}
                    </span>
                  )}
                  {j.examSessionTitle && (
                    <span style={{ color: "#201515" }}>{j.examSessionTitle}</span>
                  )}
                  {!j.assignmentCode && !j.examSessionTitle && (
                    <span style={{ color: "#939084" }}>-</span>
                  )}
                </div>
              ),
            },
            {
              key: "gradingRound",
              header: "Round",
              render: (j) => (
                <span style={{ color: "#36342e", fontSize: "0.875rem" }}>
                  {j.gradingRound || "-"}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (j) => <StatusBadge status={j.status} />,
            },
            {
              key: "createdAt",
              header: "Created",
              render: (j) => (
                <span style={{ color: "#939084", fontSize: "0.875rem" }}>
                  {j.createdAt
                    ? new Date(j.createdAt).toLocaleString("vi-VN", {
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
              key: "actions",
              header: "",
              render: (j) =>
                j.status === "Done" ? (
                  <button
                    onClick={() => handleDownload(j)}
                    disabled={downloading === j.id}
                    style={{
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#fffefb",
                      backgroundColor: "#ff4f00",
                      border: "1px solid #ff4f00",
                      borderRadius: "4px",
                      padding: "4px 12px",
                      cursor: downloading === j.id ? "not-allowed" : "pointer",
                      opacity: downloading === j.id ? 0.6 : 1,
                    }}
                  >
                    {downloading === j.id ? "..." : "Download"}
                  </button>
                ) : (
                  <span style={{ color: "#939084", fontSize: "0.8125rem" }}>-</span>
                ),
            },
          ]}
          data={jobs}
          keyExtractor={(j) => j.id}
          emptyMessage="No export jobs"
        />
      )}
    </div>
  );
}
