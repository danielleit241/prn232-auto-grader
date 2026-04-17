"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { Submission, QuestionResult } from "@/types";

export default function SubmissionResultsPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId as string;
  const assignmentId = params?.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"results" | "review">("results");
  
  // Review form state
  const [reviewContent, setReviewContent] = useState("");
  const [reviewBy, setReviewBy] = useState("gv@fpt.edu.vn");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [submissionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [subRes, resRes] = await Promise.all([
        api.getSubmissionById(submissionId),
        api.getSubmissionResults(submissionId),
      ]);

      if (subRes.status && subRes.data) {
        setSubmission(subRes.data);
      }

      if (resRes.status && resRes.data) {
        setResults(resRes.data);
      }

      if (!subRes.status) {
        setError(subRes.message || "Không thể tải submission");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!reviewContent.trim()) {
      alert("Vui lòng nhập review");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.addSubmissionNotes(submissionId, reviewContent, reviewBy);

      if (res.status) {
        alert("Thêm review thành công");
        setReviewContent("");
        loadData();
      } else {
        alert(res.message || "Lỗi khi thêm review");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;
  }

  if (error || !submission) {
    return <div className="min-h-screen bg-slate-900 p-8 text-red-400">{error}</div>;
  }

  const totalScore = results.reduce((sum, r) => sum + (r.adjustedScore ?? r.score ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/assignments/${assignmentId}/submissions`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại danh sách
        </Link>

        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
          <h1 className="text-2xl font-bold mb-4">{submission.studentCode}</h1>
          
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <span className="text-slate-400">Trạng thái:</span>
              <p className={`font-semibold ${
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
              <p className="font-semibold text-lg">{totalScore}/{submission.maxScore}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "results"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            Kết Quả Chấm ({results.length})
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "review"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            Review & Chỉnh Điểm
          </button>
        </div>

        {/* Results Tab */}
        {activeTab === "results" && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Chưa có kết quả chấm. Chạy grading trước.
              </div>
            ) : (
              results.map((result) => (
                <Link
                  key={result.id}
                  href={`/assignments/${assignmentId}/submissions/${submissionId}/results/${result.id}`}
                >
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-blue-500 transition cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{result.questionTitle}</h3>
                        <p className="text-sm text-slate-400">Q: {result.questionId}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          (result.adjustedScore ?? result.score ?? 0) >= (result.maxScore ?? 0) * 0.8
                            ? 'text-green-400'
                            : (result.adjustedScore ?? result.score ?? 0) > 0
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}>
                          {result.adjustedScore ?? result.score ?? 0}/{result.maxScore}
                        </p>
                        {result.adjustedScore !== undefined && (
                          <p className="text-xs text-blue-400">Đã chỉnh</p>
                        )}
                      </div>
                    </div>
                    
                    {result.passedTestCases !== undefined && (
                      <div className="mt-2 text-sm">
                        <p className="text-slate-300">
                          Passed: <span className="text-green-400">{result.passedTestCases}/{result.totalTestCases}</span>
                        </p>
                      </div>
                    )}

                    {result.adjustReason && (
                      <div className="mt-2 bg-blue-500/10 p-2 rounded text-xs border border-blue-500/30">
                        <p><strong>Lý do chỉnh:</strong> {result.adjustReason}</p>
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Review Tab */}
        {activeTab === "review" && (
          <div className="space-y-6">
            {/* Quick Adjust Scores */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Chỉnh Điểm Nhanh</h2>
              <div className="space-y-3">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/assignments/${assignmentId}/submissions/${submissionId}/results/${result.id}/adjust`}
                  >
                    <div className="flex justify-between items-center p-3 bg-slate-700 rounded hover:bg-slate-600 transition cursor-pointer">
                      <div>
                        <p className="font-semibold">{result.questionTitle}</p>
                        <p className="text-xs text-slate-400">Điểm hiện tại: {result.adjustedScore ?? result.score}/{result.maxScore}</p>
                      </div>
                      <span className="text-blue-400">Chỉnh →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Add Review Notes */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Thêm Review & Nhận Xét</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Nhận xét từ:</label>
                  <input
                    type="email"
                    value={reviewBy}
                    onChange={(e) => setReviewBy(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Nhận xét:</label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Nhập nhận xét, feedback cho sinh viên..."
                    rows={5}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handleAddReview}
                  disabled={submitting || !reviewContent.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-2 rounded font-semibold transition"
                >
                  {submitting ? "Đang lưu..." : "Lưu Nhận Xét"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
