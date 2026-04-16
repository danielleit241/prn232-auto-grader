"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib";
import type { ExportJob, Assignment } from "@/types";

export default function ExportsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignRes] = await Promise.all([api.getAssignments()]);

      if (assignRes.status && assignRes.data) {
        setAssignments(assignRes.data);
        if (assignRes.data.length > 0) {
          setSelectedAssignmentId(assignRes.data[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExport = async () => {
    if (!selectedAssignmentId) return;

    try {
      setExporting(true);
      const res = await api.createExport({ assignmentId: selectedAssignmentId });

      if (res.status && res.data) {
        setExports([res.data, ...exports]);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async (exportId: string) => {
    try {
      const response = await api.downloadExport(exportId);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grades_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">Exports & Reports</h1>
          <p className="text-slate-400">Export grading results for analysis</p>
        </div>

        {/* Export Section */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Export</h2>
          <div className="flex gap-4">
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
            >
              <option value="">Select Assignment</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateExport}
              disabled={exporting || !selectedAssignmentId}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 py-2 rounded transition font-medium"
            >
              {exporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>

        {/* Exports List */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Recent Exports</h2>
          {exports.length === 0 ? (
            <p className="text-slate-400">No exports yet</p>
          ) : (
            <div className="space-y-3">
              {exports.map((exp) => (
                <div key={exp.id} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Assignment Export</p>
                    <p className="text-sm text-slate-400">
                      {exp.createdAt ? new Date(exp.createdAt).toLocaleString() : "N/A"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Status: {exp.status === "Done" ? "✓ Ready" : "Processing..."}
                    </p>
                  </div>
                  {exp.status === "Done" && (
                    <button
                      onClick={() => handleDownload(exp.id)}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition"
                    >
                      Download
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
