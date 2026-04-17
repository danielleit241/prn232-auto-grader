"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { QuestionResult, ReviewNote } from "@/types";

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params?.resultId as string;
  const submissionId = params?.submissionId as string;
  const assignmentId = params?.id as string;

  const [result, setResult] = useState<QuestionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "comments">("details");

  // Comment state
  const [comments, setComments] = useState<ReviewNote[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentFrom, setCommentFrom] = useState("gv@fpt.edu.vn");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [resultId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getQuestionResultById(resultId);

      if (res.status && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || "Không thể tải kết quả");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Vui lòng nhập bình luận");
      return;
    }

    try {
      setSubmitting(true);
      const commentText = `[${commentFrom}] ${newComment}`;
      const res = await api.addSubmissionNotes(submissionId, commentText, commentFrom);

      if (res.status) {
        setNewComment("");
        loadData();
        alert("Thêm bình luận thành công");
      } else {
        alert(res.message || "Lỗi khi thêm bình luận");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <p className="text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 text-red-400">
        <Link href={`/assignments/${assignmentId}/submissions/${submissionId}/results`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại
        </Link>
        <p>{error}</p>
      </div>
    );
  }

  // Parse detail JSON if available
  let testCaseResults: any[] = [];
  if (result.detail) {
    try {
      const parsed = JSON.parse(result.detail);
      testCaseResults = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // detail không phải JSON, bỏ qua
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/assignments/${assignmentId}/submissions/${submissionId}/results`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại
        </Link>

        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{result.questionTitle}</h1>
              <p className="text-slate-400">Sinh viên: {result.studentCode}</p>
            </div>
            <Link
              href={`/assignments/${assignmentId}/submissions/${submissionId}/results/${resultId}/adjust`}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold transition"
            >
              Chỉnh Điểm
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-700 p-3 rounded">
              <p className="text-slate-400 text-xs mb-1">Điểm Auto</p>
              <p className="text-2xl font-bold text-green-400">{result.score}/{result.maxScore}</p>
            </div>
            {result.adjustedScore !== undefined && (
              <div className="bg-slate-700 p-3 rounded">
                <p className="text-slate-400 text-xs mb-1">Điểm Chỉnh</p>
                <p className="text-2xl font-bold text-blue-400">{result.adjustedScore}/{result.maxScore}</p>
              </div>
            )}
            <div className="bg-slate-700 p-3 rounded">
              <p className="text-slate-400 text-xs mb-1">Điểm Cuối Cùng</p>
              <p className="text-2xl font-bold text-yellow-400">{result.adjustedScore ?? result.score}/{result.maxScore}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "details"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            Chi Tiết Chấm
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "comments"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            Bình Luận
          </button>
        </div>

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Adjust Reason */}
            {result.adjustReason && (
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded">
                <p className="text-sm text-slate-400 mb-1">Lý do chỉnh điểm:</p>
                <p className="text-white">{result.adjustReason}</p>
                {result.adjustedBy && (
                  <p className="text-xs text-slate-500 mt-2">Chỉnh bởi: {result.adjustedBy}</p>
                )}
              </div>
            )}

            {/* Test Case Results */}
            {testCaseResults.length > 0 ? (
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h2 className="text-xl font-bold mb-4">Kết Quả Từng Test Case</h2>
                <div className="space-y-3">
                  {testCaseResults.map((tc, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded border ${
                        tc.Pass
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{tc.name || `Test Case ${idx + 1}`}</h3>
                          <p className="text-sm text-slate-400">
                            {tc.HttpMethod} {tc.Url || tc.urlTemplate}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-bold px-2 py-1 rounded ${
                            tc.Pass
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {tc.Pass ? "✓ PASS" : "✗ FAIL"}
                        </span>
                      </div>

                      {tc.AwardedScore !== undefined && (
                        <p className="text-sm mb-2">
                          Điểm: <span className="font-semibold text-yellow-400">{tc.AwardedScore}</span>
                        </p>
                      )}

                      {tc.FailReason && (
                        <div className="bg-red-500/20 p-3 rounded text-xs text-red-300 mt-3 border border-red-500/30">
                          <p className="font-semibold mb-1">❌ Lý Do FAIL:</p>
                          <p className="font-mono whitespace-pre-wrap">{tc.FailReason}</p>
                        </div>
                      )}

                      {tc.ActualStatus !== undefined && (
                        <div className="mt-3 p-3 rounded bg-slate-700/50 text-xs text-slate-300 border border-slate-600">
                          <p className="font-semibold mb-2">📊 Chi Tiết Phản Hồi:</p>
                          <p>HTTP Status: <span className="text-blue-400 font-mono">{tc.ActualStatus}</span></p>
                          {tc.ActualBody && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-400 hover:text-blue-300">Response Body</summary>
                              <p className="font-mono text-slate-400 break-all bg-slate-800 p-2 rounded mt-2 max-h-48 overflow-auto">
                                {typeof tc.ActualBody === 'string' ? tc.ActualBody : JSON.stringify(tc.ActualBody, null, 2)}
                              </p>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-center text-slate-400">
                {result.detail ? "Chi tiết chấm không khả dụng" : "Chưa có chi tiết test case"}
              </div>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === "comments" && (
          <div className="space-y-6">
            {/* Add Comment Form */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Thêm Bình Luận</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Bình luận từ:</label>
                  <input
                    type="email"
                    value={commentFrom}
                    onChange={(e) => setCommentFrom(e.target.value)}
                    placeholder="gv@fpt.edu.vn"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Bình luận:</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Nhập bình luận, feedback cho sinh viên..."
                    rows={4}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handleAddComment}
                  disabled={submitting || !newComment.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-2 rounded font-semibold transition"
                >
                  {submitting ? "Đang gửi..." : "Gửi Bình Luận"}
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Bình Luận & Feedback</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {result.output ? (
                  <div className="bg-slate-700 p-4 rounded">
                    <p className="text-xs text-slate-400 mb-2">Thời gian: {new Date(result.createdAt).toLocaleString("vi-VN")}</p>
                    <p className="text-white whitespace-pre-wrap">{result.output}</p>
                  </div>
                ) : (
                  <p className="text-center text-slate-400">Chưa có bình luận nào</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
