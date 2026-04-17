"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { Submission } from "@/types";

export default function GradingPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "grading" | "done">("pending");
  const [sortBy, setSortBy] = useState<"date" | "student" | "status">("date");

  useEffect(() => {
    loadSubmissions();
  }, [filter, sortBy]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      
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
        const filterMap: Record<string, string> = {
          pending: "Pending",
          grading: "Grading",
          done: "Done",
        };
        filtered = filtered.filter((s) => s.status === filterMap[filter]);
      }

      // Sort
      if (sortBy === "date") {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === "student") {
        filtered.sort((a, b) => a.studentCode.localeCompare(b.studentCode));
      } else if (sortBy === "status") {
        const statusOrder: Record<string, number> = { "Pending": 0, "Grading": 1, "Done": 2, "Error": 3 };
        filtered.sort((a, b) => (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999));
      }

      setSubmissions(filtered);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGradingBatch = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await api.triggerGrading(id);
      }
      loadSubmissions();
    } catch (err) {
      console.error("Failed to trigger grading:", err);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;

  const unreadySubmissions = submissions.filter((s) => s.status === "Pending" || s.status === "Grading");

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Grading Dashboard</h1>
            <p className="text-slate-400">Manage and review student submissions</p>
          </div>
          <div className="flex gap-3">
            <Link href="/submissions" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium text-lg">
              📋 View All Submissions
            </Link>
            {unreadySubmissions.length > 0 && (
              <button
                onClick={() => handleTriggerGradingBatch(unreadySubmissions.map((s) => s.id))}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium text-lg"
              >
                ⚡ Grade All ({unreadySubmissions.length})
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <div className="space-x-2">
            {["all", "pending", "grading", "done"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded transition capitalize inline-block ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          >
            <option value="date">Sort: Date</option>
            <option value="student">Sort: Student</option>
            <option value="status">Sort: Status</option>
          </select>

          {unreadySubmissions.length > 0 && (
            <button
              onClick={() => handleTriggerGradingBatch(unreadySubmissions.map((s) => s.id))}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition ml-auto"
            >
              Grade All ({unreadySubmissions.length})
            </button>
          )}
        </div>

        {/* Submissions Table */}
        {submissions.length === 0 ? (
          <div className="text-center text-slate-400 py-12">No submissions to display</div>
        ) : (
          <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Student</th>
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
                    <td className="px-6 py-4 font-medium">{s.studentCode}</td>
                    <td className="px-6 py-4 text-slate-400">{s.assignmentId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        s.status === "Done" ? "bg-green-500/20 text-green-400" :
                        s.status === "Grading" ? "bg-yellow-500/20 text-yellow-400" :
                        s.status === "Error" ? "bg-red-500/20 text-red-400" :
                        "bg-slate-600 text-slate-300"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold">
                        {s.totalScore !== undefined && s.maxScore ? `${s.totalScore}/${s.maxScore}` : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link
                          href={`/submissions/${s.id}`}
                          className="text-blue-400 hover:text-blue-300 transition"
                        >
                          View
                        </Link>
                        {(s.status === "Pending" || s.status === "Grading") && (
                          <button
                            onClick={() => handleTriggerGradingBatch([s.id])}
                            className="text-green-400 hover:text-green-300 transition"
                          >
                            Grade
                          </button>
                        )}
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
