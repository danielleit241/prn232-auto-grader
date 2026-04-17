"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { Assignment, Submission } from "@/types";

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalSubmissions: 0,
    completedSubmissions: 0,
    pendingGrading: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const assignRes = await api.getAssignments();

      let allAssignments: Assignment[] = [];
      let allSubmissions: Submission[] = [];

      if (assignRes.status && assignRes.data) {
        allAssignments = assignRes.data;
        setAssignments(allAssignments.slice(0, 5));

        // Load submissions for all assignments
        const subPromises = allAssignments.map((a) =>
          api.getSubmissionsByAssignment(a.id)
        );
        const subResponses = await Promise.all(subPromises);

        subResponses.forEach((res) => {
          if (res.status && res.data) {
            allSubmissions = [...allSubmissions, ...res.data];
          }
        });

        setSubmissions(allSubmissions.slice(0, 5));
      }

      setStats({
        totalAssignments: allAssignments.length,
        totalSubmissions: allSubmissions.length,
        completedSubmissions: allSubmissions.filter((s) => s.status === "Done" || s.status === 2).length,
        pendingGrading: allSubmissions.filter((s) => s.status === "Pending" || s.status === "Grading" || s.status === 0 || s.status === 1).length,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Total Assignments</p>
            <p className="text-3xl font-bold text-blue-400">{stats.totalAssignments}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-400">{stats.totalSubmissions}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-400">{stats.completedSubmissions}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Pending Grading</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.pendingGrading}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Link href="/assignments" className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg text-center font-medium transition">
            📚 Browse Assignments
          </Link>
          <Link href="/assignments/create" className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg text-center font-medium transition">
            ➕ Create Assignment
          </Link>
          <Link href="/grading" className="bg-red-600 hover:bg-red-700 p-4 rounded-lg text-center font-medium transition">
            ✅ Grade Submissions
          </Link>
          <Link href="/exports" className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg text-center font-medium transition">
            📊 Export Results
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Recent Assignments */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Assignments</h2>
              <Link href="/assignments" className="text-blue-400 hover:text-blue-300 text-sm">
                View All
              </Link>
            </div>
            {assignments.length === 0 ? (
              <p className="text-slate-400">No assignments yet</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/assignments/${a.id}`}
                    className="block p-3 bg-slate-700 rounded hover:bg-slate-700/80 transition"
                  >
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-slate-400 line-clamp-1">{a.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Submissions</h2>
              <Link href="/submissions" className="text-blue-400 hover:text-blue-300 text-sm">
                View All
              </Link>
            </div>
            {submissions.length === 0 ? (
              <p className="text-slate-400">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/submissions/${s.id}`}
                    className="block p-3 bg-slate-700 rounded hover:bg-slate-700/80 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{s.studentCode}</p>
                        <p className="text-sm text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        s.status === "Done" ? "bg-green-500/20 text-green-400" :
                        s.status === "Grading" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-slate-600 text-slate-300"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
