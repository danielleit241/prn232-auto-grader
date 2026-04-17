"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { Assignment } from "@/types";

interface FormData {
  studentCode: string;
  sourceCode: string;
  submissionFile: File | null;
}

export default function SubmissionUploadPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    studentCode: "",
    sourceCode: "",
    submissionFile: null,
  });

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      const res = await api.getAssignmentById(assignmentId);
      if (res.status && res.data) {
        setAssignment(res.data);
      }
    } catch (err) {
      setError("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.studentCode.trim()) {
        setError("Student code is required");
        setSubmitting(false);
        return;
      }

      if (!formData.sourceCode.trim() && !formData.submissionFile) {
        setError("Either source code or submission file is required");
        setSubmitting(false);
        return;
      }

      const uploadFileFormData = new FormData();
      uploadFileFormData.append("assignmentId", assignmentId);
      uploadFileFormData.append("studentCode", formData.studentCode);

      // Determine which file to upload
      let fileToUpload: File;

      if (formData.submissionFile) {
        fileToUpload = formData.submissionFile;
      } else {
        // Create a file from the sourceCode textarea
        const blob = new Blob([formData.sourceCode], { type: "text/plain" });
        fileToUpload = new File([blob], "source-code.txt", { type: "text/plain" });
      }

      uploadFileFormData.append("file", fileToUpload);

      const res = await api.uploadSubmission(uploadFileFormData);

      if (res.status && res.data) {
        router.push(`/submissions/${res.data.id}`);
      } else {
        setError(res.message || "Failed to upload submission");
      }
    } catch (err) {
      setError("An error occurred while uploading");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;
  if (error && !assignment) return <div className="min-h-screen bg-slate-900 p-8 text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link href={`/assignments/${assignmentId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Assignment
        </Link>

        <h1 className="text-2xl font-bold mb-2">Submit Solution</h1>
        {assignment && <p className="text-slate-400 mb-6">{assignment.title}</p>}

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Student Code</label>
              <input
                type="text"
                value={formData.studentCode}
                onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                placeholder="e.g., ST123456"
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Source Code</label>
              <textarea
                value={formData.sourceCode}
                onChange={(e) => setFormData({ ...formData, sourceCode: e.target.value })}
                placeholder="Paste your C# code here..."
                rows={12}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Paste code directly, or upload a file below instead</p>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <p className="text-sm text-slate-400 mb-4">— OR —</p>
              
              <label className="block text-sm font-medium mb-2">Upload Submission File (Optional)</label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, submissionFile: e.target.files?.[0] || null })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">ZIP, tar.gz, or other file format. If provided, this will be uploaded instead of the source code above.</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-3 rounded font-medium transition"
            >
              {submitting ? "Uploading..." : "Submit Solution"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
