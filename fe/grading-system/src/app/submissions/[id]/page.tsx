"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { Submission, GradingJob, QuestionResult } from "@/types";

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [gradingJob, setGradingJob] = useState<GradingJob | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (submissionId) {
      loadSubmission();
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const res = await api.getSubmissionById(submissionId);

      if (res.status && res.data) {
        setSubmission(res.data);

        // Load grading jobs
        const jobRes = await api.getGradingJobsBySubmission(submissionId);
        if (jobRes.status && jobRes.data && jobRes.data.length > 0) {
          const latestJob = jobRes.data[0];
          setGradingJob(latestJob);

          // If job is done, load results
          if (latestJob.status === "Done") {
              const resultsRes = await api.getSubmissionResults(submissionId);
            if (resultsRes.status && resultsRes.data) {
              setResults(resultsRes.data);
            }
          }
        }
      }
    } catch (err) {
      setError("Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGrading = async () => {
    try {
      setTriggering(true);
      const res = await api.triggerGrading(submissionId);

      if (res.status && res.data) {
        setGradingJob(res.data);
        // Start polling for status updates
        startPolling();
      } else {
        setError(res.message || "Failed to trigger grading");
      }
    } catch (err) {
      setError("An error occurred while triggering grading");
    } finally {
      setTriggering(false);
    }
  };

  const startPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    if (!gradingJob?.id) return;

    pollInterval.current = setInterval(async () => {
      try {
        const res = await api.getGradingJob(gradingJob.id);
        if (res.status && res.data) {
          setGradingJob(res.data);

          if (res.data.status === "Done" || res.data.status === "Failed") {
            if (pollInterval.current) clearInterval(pollInterval.current);

            // Load results if done
            if (res.data.status === "Done") {
              const resultsRes = await api.getSubmissionResults(submissionId);
              if (resultsRes.status && resultsRes.data) {
                setResults(resultsRes.data);
              }
            }
          }
        }
      } catch (err) {
        // Continue polling even if error
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleDeleteSubmission = async () => {
    if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) return;

    try {
      setSubmitting(true);
      const res = await api.deleteSubmission(submissionId);
      if (res.status) {
        router.push("/submissions");
      } else {
        setError(res.message || "Failed to delete submission");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting submission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;
  if (error || !submission) return <div className="min-h-screen bg-slate-900 p-8 text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/assignments" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Assignments
        </Link>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
          <h1 className="text-2xl font-bold mb-4">Submission Details</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Student Code</p>
              <p className="font-semibold">{submission.studentCode}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Status</p>
              <p className={`font-semibold ${
                submission.status === "Done" ? "text-green-400" :
                submission.status === "Grading" ? "text-yellow-400" :
                submission.status === "Error" ? "text-red-400" :
                "text-slate-300"
              }`}>
                {submission.status}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Submitted</p>
              <p>{new Date(submission.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Score</p>
              <p className="font-semibold">
                {submission.totalScore !== undefined && submission.maxScore
                  ? `${submission.totalScore}/${submission.maxScore}`
                  : "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-600">
            <h3 className="text-lg font-bold mb-4">Source Code</h3>
            <pre className="bg-slate-700 p-4 rounded overflow-x-auto text-sm font-mono max-h-96">
              {submission.sourceCode}
            </pre>
          </div>
        </div>

        {/* Grading Section */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Grading</h2>
            <div className="flex gap-2">
              {!gradingJob || gradingJob.status === "Failed" || gradingJob.status === "Done" ? (
                <button
                  onClick={handleTriggerGrading}
                  disabled={triggering}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-4 py-2 rounded transition"
                >
                  {triggering ? "Triggering..." : "Trigger Grading"}
                </button>
              ) : null}
              <button
                onClick={handleDeleteSubmission}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 px-4 py-2 rounded transition"
              >
                {submitting ? "Deleting..." : "Delete Submission"}
              </button>
            </div>
          </div>

          {gradingJob ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Job Status</p>
                  <p className={`font-semibold ${
                    gradingJob.status === "Done" ? "text-green-400" :
                    gradingJob.status === "Running" ? "text-yellow-400" :
                    gradingJob.status === "Failed" ? "text-red-400" :
                    "text-slate-300"
                  }`}>
                    {gradingJob.status}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Created</p>
                  <p>{gradingJob.createdAt ? new Date(gradingJob.createdAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>

              {gradingJob.errorMessage && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{gradingJob.errorMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400">No grading job yet. Click "Trigger Grading" to start.</p>
          )}
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-bold mb-4">Results ({results.length})</h2>
            <div className="space-y-4">
              {results.map((r) => (
                <div key={r.id} className="bg-slate-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{r.questionTitle}</p>
                      <p className="text-sm text-slate-400">
                        Score: {r.scoreObtained}/{r.maxScore}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      r.passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {r.passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                  {r.output && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-400 hover:text-blue-300">View Output</summary>
                      <pre className="mt-2 bg-slate-600 p-2 rounded overflow-x-auto text-xs">
                        {r.output}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
