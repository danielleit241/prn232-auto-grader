"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { ExamSession, AssignmentSummary } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface DashboardStats {
  totalSessions: number;
  totalAssignments: number;
  recentSessions: ExamSession[];
  recentAssignments: AssignmentSummary[];
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [sessionsRes, assignmentsRes] = await Promise.all([
        api.getExamSessions(),
        api.getAssignments(),
      ]);

      if (sessionsRes.status && assignmentsRes.status) {
        setStats({
          totalSessions: sessionsRes.data?.length ?? 0,
          totalAssignments: assignmentsRes.data?.length ?? 0,
          recentSessions: (sessionsRes.data ?? []).slice(0, 5),
          recentAssignments: (assignmentsRes.data ?? []).slice(0, 5),
        });
      } else {
        setError(sessionsRes.message || "Failed to load dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <LoadingSpinner fullPage label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "5px",
            color: "#dc2626",
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "48px" }}>
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
          01 / Dashboard
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
          Dashboard
        </h1>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "24px",
          marginBottom: "48px",
        }}
        className="stats-grid"
      >
        <div
          style={{
            backgroundColor: "#fffefb",
            border: "1px solid #c5c0b1",
            borderRadius: "5px",
            padding: "32px",
          }}
        >
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#939084",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Exam Sessions
          </p>
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "3rem",
              fontWeight: 500,
              lineHeight: 1,
              color: "#201515",
            }}
          >
            {stats?.totalSessions ?? 0}
          </p>
          <Link
            href="/exam-sessions"
            style={{
              display: "inline-block",
              marginTop: "16px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#ff4f00",
              textDecoration: "none",
            }}
          >
            View all &rarr;
          </Link>
        </div>

        <div
          style={{
            backgroundColor: "#fffefb",
            border: "1px solid #c5c0b1",
            borderRadius: "5px",
            padding: "32px",
          }}
        >
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#939084",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Assignments
          </p>
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "3rem",
              fontWeight: 500,
              lineHeight: 1,
              color: "#201515",
            }}
          >
            {stats?.totalAssignments ?? 0}
          </p>
          <Link
            href="/exam-sessions"
            style={{
              display: "inline-block",
              marginTop: "16px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#ff4f00",
              textDecoration: "none",
            }}
          >
            View all &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "48px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/exam-sessions/create"
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
            textDecoration: "none",
            transition: "background-color 0.15s ease",
          }}
        >
          + New Exam Session
        </Link>
        <Link
          href="/submissions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 24px",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#36342e",
            backgroundColor: "#eceae3",
            border: "1px solid #c5c0b1",
            borderRadius: "8px",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          View Submissions
        </Link>
        <Link
          href="/exports"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 24px",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#36342e",
            backgroundColor: "#eceae3",
            border: "1px solid #c5c0b1",
            borderRadius: "8px",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          Export Results
        </Link>
      </div>

      {/* Recent Exam Sessions */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "1.5rem",
              fontWeight: 600,
              letterSpacing: "-0.48px",
              color: "#201515",
              margin: 0,
            }}
          >
            Recent Exam Sessions
          </h2>
          <Link
            href="/exam-sessions"
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#ff4f00",
              textDecoration: "none",
            }}
          >
            View all
          </Link>
        </div>

        {stats?.recentSessions && stats.recentSessions.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {stats.recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/exam-sessions/${session.id}`}
                style={{
                  display: "block",
                  backgroundColor: "#fffefb",
                  border: "1px solid #c5c0b1",
                  borderRadius: "5px",
                  padding: "20px",
                  textDecoration: "none",
                  transition: "border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#b5b2aa";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#c5c0b1";
                }}
              >
                <div
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#201515",
                    marginBottom: "4px",
                  }}
                >
                  {session.title}
                </div>
                {session.description && (
                  <p
                    style={{
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.875rem",
                      color: "#939084",
                      marginBottom: "12px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {session.description}
                  </p>
                )}
                <div
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.8125rem",
                    color: "#939084",
                  }}
                >
                  {new Date(session.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No exam sessions yet"
            description="Create your first exam session to start organizing assignments and grading."
            action={
              <Link
                href="/exam-sessions/create"
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
                  textDecoration: "none",
                }}
              >
                + New Exam Session
              </Link>
            }
          />
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}