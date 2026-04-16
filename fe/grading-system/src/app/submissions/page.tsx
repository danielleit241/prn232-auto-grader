"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { Submission } from "@/types";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "grading" | "done">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all assignments first
      const assignRes = await api.getAssignments();
      let allSubmissions: Submission[] = [];

      if (assignRes.status && assignRes.data) {
        // Load submissions for each assignment
        const subPromises = assignRes.data.map((a) =>
          api.getSubmissionsByAssignment(a.id)
        );
        const subResponses = await Promise.all(subPromises);

        subResponses.forEach((res) => {
          if (res.status && res.data) {
            allSubmissions = [...allSubmissions, ...res.data];
          }
        });
      }

      let filtered = allSubmissions;

      if (filter !== "all") {
        const filterMap: Record<string, number> = {
          pending: 0,
          grading: 1,
          done: 2,
        };
        filtered = filtered.filter((s) => s.status === filterMap[filter]);
      }

      setSubmissions(filtered);
    } catch (err) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) return;

    try {
      setDeleting(submissionId);
      const res = await api.deleteSubmission(submissionId);
      if (res.status) {
        setSubmissions(submissions.filter((s) => s.id !== submissionId));
      } else {
        setError(res.message || "Failed to delete submission");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting submission");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/assignments" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
              ← Back to Assignments
            </Link>
            <h1 className="text-3xl font-bold">All Submissions</h1>
          </div>
          <Link href="/assignments" className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium text-lg">
            📤 Upload New Submission
          </Link>
        </div>

        <div className="flex gap-4 mb-8">
          {["all", "pending", "grading", "done"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded transition capitalize ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="text-center text-slate-400 py-8">No submissions found</div>
        ) : (
          <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Student Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Assignment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Submitted</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4">{s.studentCode}</td>
                    <td className="px-6 py-4 text-slate-400">{s.assignmentId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        s.status === "Done" ? "bg-green-500/20 text-green-400" :
                        s.status === "Grading" ? "bg-yellow-500/20 text-yellow-400" :
                        s.status === "Error" ? "bg-red-500/20 text-red-400" :
                        "bg-slate-600 text-slate-300"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.totalScore !== undefined && s.maxScore ? `${s.totalScore}/${s.maxScore}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/submissions/${s.id}`} className="text-blue-400 hover:text-blue-300">
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteSubmission(s.id)}
                          disabled={deleting === s.id}
                          className="text-red-400 hover:text-red-300 disabled:text-slate-500 transition"
                        >
                          {deleting === s.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
