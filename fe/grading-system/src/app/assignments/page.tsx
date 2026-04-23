"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { AssignmentSummary } from "@/types";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.getAssignments();
      if (res.status && res.data) {
        setAssignments(res.data);
      } else {
        setError(res.message || "Failed to load");
      }
    } catch (err) {
      setError("Error loading assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment? All questions, test cases, and submissions will also be deleted. This action cannot be undone.")) return;

    try {
      setDeleting(assignmentId);
      const res = await api.deleteAssignment(assignmentId);
      if (res.status) {
        setAssignments(assignments.filter((a) => a.id !== assignmentId));
      } else {
        setError(res.message || "Failed to delete assignment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting assignment");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Assignments</h1>
          <div className="flex gap-4">
            <Link href="/submissions" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium">
              📤 My Submissions
            </Link>
            <Link href="/assignments/create" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium">
              ➕ New Assignment
            </Link>
          </div>
        </div>

        {loading && <p className="text-slate-400">Loading...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && assignments.length > 0 && (
          <div className="grid gap-4">
            {assignments.map((a) => (
              <div key={a.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-slate-600 transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{a.title}</h3>
                    <p className="text-slate-400">{a.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAssignment(a.id)}
                    disabled={deleting === a.id}
                    className="ml-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 px-3 py-1 rounded text-sm transition"
                  >
                    {deleting === a.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
                <div className="flex gap-3 mt-4">
                  <Link href={`/assignments/${a.id}`} className="flex-1 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-center transition font-medium">
                    📋 View Details
                  </Link>
                  <Link href={`/assignments/${a.id}/submit`} className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-center transition font-medium">
                    📤 Submit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
