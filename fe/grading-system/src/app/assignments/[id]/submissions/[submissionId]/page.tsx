"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { Submission, GradingJob } from "@/types";

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId as string;
  const assignmentId = params?.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [gradingJob, setGradingJob] = useState<GradingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (pollingJobId) {
      interval = setInterval(async () => {
        try {
          const res = await api.getGradingJob(pollingJobId);
          if (res.status && res.data) {
            setGradingJob(res.data);

            if (res.data.status === "Done" || res.data.status === "Failed") {
              setPollingJobId(null);
              loadSubmission();
            }
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => clearInterval(interval);
  }, [pollingJobId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);

      const subRes = await api.getSubmissionById(submissionId);

      if (subRes.status && subRes.data) {
        setSubmission(subRes.data);

        // Load grading job if exists
        const jobsRes = await api.getGradingJobsBySubmission(submissionId);
        if (jobsRes.status && jobsRes.data && jobsRes.data.length > 0) {
          setGradingJob(jobsRes.data[0]);
        }
      } else {
        setError(subRes.message || "Cannot load submission");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGrading = async () => {
    if (!confirm("Start grading for this submission?")) return;

    try {
      setGrading(true);
      const res = await api.triggerGrading(submissionId);

      if (res.status && res.data) {
        setGradingJob(res.data);
        setPollingJobId(res.data.id);
      } else {
        alert(res.message || "Error starting grading");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;
  }

  if (error || !submission) {
    return <div className="min-h-screen bg-slate-900 p-8 text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/assignments/${assignmentId}/submissions`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại danh sách
        </Link>

        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
          <h1 className="text-2xl font-bold mb-2">{submission.studentCode}</h1>

          <div className="grid grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <span className="text-slate-400">Trạng thái:</span>
              <p className={`font-bold text-lg ${
                submission.status === "Done" ? "text-green-400" :
                submission.status === "Grading" ? "text-yellow-400" :
                submission.status === "Error" ? "text-red-400" :
                "text-slate-400"
              }`}>
                {submission.status}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Ngày nộp:</span>
              <p className="font-semibold">{new Date(submission.createdAt).toLocaleString("vi-VN")}</p>
            </div>
            <div>
              <span className="text-slate-400">Điểm:</span>
              <p className="text-lg font-bold">
                {submission.totalScore ?? "-"}/{submission.maxScore ?? "-"}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Artifact:</span>
              <p className="font-mono text-xs text-blue-400 truncate">{submission.artifactZipPath}</p>
            </div>
          </div>
        </div>

        {/* Grading Status / Actions */}
        <div className="space-y-6">
          {submission.status === "Pending" && (
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded">
              <p className="text-blue-300 mb-3">Chưa chấm. Nhấp nút bên dưới để bắt đầu.</p>
              <button
                onClick={handleTriggerGrading}
                disabled={grading || pollingJobId !== null}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 px-6 py-2 rounded font-semibold transition"
              >
                {grading ? "Đang tạo job..." : pollingJobId ? "Đang chấm..." : "🚀 Bắt Đầu Chấm"}
              </button>
            </div>
          )}

          {gradingJob && (
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Grading Job</h2>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400">Job ID:</span>
                    <p className="font-mono text-xs">{gradingJob.id}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Trạng thái:</span>
                    <p className={`font-bold ${
                      gradingJob.status === "Done" ? "text-green-400" :
                      gradingJob.status === "Running" ? "text-yellow-400" :
                      gradingJob.status === "Failed" ? "text-red-400" :
                      "text-slate-400"
                    }`}>
                      {gradingJob.status}
                    </p>
                  </div>
                </div>

                {gradingJob.status === "Running" && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang chấm...</span>
                  </div>
                )}

                {gradingJob.status === "Done" && (
                  <Link
                    href={`/assignments/${assignmentId}/submissions/${submissionId}/results`}
                    className="block w-full text-center bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold transition"
                  >
                    ✓ Xem Kết Quả Chấm
                  </Link>
                )}

                {gradingJob.status === "Failed" && gradingJob.errorMessage && (
                  <div className="bg-red-500/10 p-3 rounded border border-red-500/30">
                    <p className="text-xs text-red-400"><strong>Lỗi:</strong> {gradingJob.errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {submission.status === "Done" && (
            <Link
              href={`/assignments/${assignmentId}/submissions/${submissionId}/results`}
              className="block w-full text-center bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-semibold transition"
            >
              📊 Xem Kết Quả Chấm & Review
            </Link>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 p-4 rounded">
          <h3 className="font-bold mb-2">Grading Process:</h3>
          <ol className="text-sm text-slate-300 space-y-1">
            <li>1. Worker extract artifact.zip (Q1 + Q2)</li>
            <li>2. Restore database.sql</li>
            <li>3. Chạy Q1 (REST API) và Q2 (Razor Pages)</li>
            <li>4. Chạy test cases cho từng câu</li>
            <li>5. Tính điểm tự động</li>
            <li>6. Giáo viên review & chỉnh điểm (nếu cần)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
