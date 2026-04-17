"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { QuestionResult } from "@/types";

export default function AdjustScorePage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params?.resultId as string;
  const submissionId = params?.submissionId as string;
  const assignmentId = params?.id as string;

  const [result, setResult] = useState<QuestionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [adjustedScore, setAdjustedScore] = useState<number | null>(null);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustedBy, setAdjustedBy] = useState("gv@fpt.edu.vn");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadResult();
  }, [resultId]);

  const loadResult = async () => {
    try {
      setLoading(true);
      const res = await api.getQuestionResultById(resultId);

      if (res.status && res.data) {
        setResult(res.data);
        setAdjustedScore(res.data.adjustedScore ?? res.data.score ?? 0);
        setAdjustReason(res.data.adjustReason ?? "");
      } else {
        setError(res.message || "Không thể tải kết quả");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (adjustedScore === null) {
      alert("Vui lòng nhập điểm");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.adjustQuestionResult(
        resultId,
        adjustedScore,
        adjustReason,
        adjustedBy
      );

      if (res.status) {
        alert("Cập nhật điểm thành công");
        router.back();
      } else {
        alert(res.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAdjustment = async () => {
    if (!confirm("Hủy chỉnh điểm và quay về điểm tự động?")) return;

    try {
      setSubmitting(true);
      const res = await api.deleteQuestionResultAdjustment(resultId);

      if (res.status) {
        alert("Hủy chỉnh điểm thành công");
        router.back();
      } else {
        alert(res.message || "Lỗi khi hủy");
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

  if (error || !result) {
    return <div className="min-h-screen bg-slate-900 p-8 text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← Quay lại
        </button>

        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
          <h1 className="text-2xl font-bold mb-2">{result.questionTitle}</h1>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Điểm tự động:</span>
              <p className="text-2xl font-bold text-green-400">{result.score ?? 0}</p>
            </div>
            <div>
              <span className="text-slate-400">Điểm tối đa:</span>
              <p className="text-2xl font-bold">{result.maxScore}</p>
            </div>
            <div>
              <span className="text-slate-400">Test passed:</span>
              <p className="text-2xl font-bold">
                {result.passedTestCases ?? 0}/{result.totalTestCases ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Auto Grading Details */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
          <h2 className="text-xl font-bold mb-3">Điểm Tự Động</h2>
          <p className="text-slate-300 mb-3">Điểm auto: <span className="font-bold text-green-400">{result.score}/{result.maxScore}</span></p>
          
          {result.detail && (
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-400 hover:text-blue-300">Chi tiết test cases</summary>
              <pre className="mt-2 bg-slate-900 p-2 rounded text-xs overflow-auto max-h-32 text-slate-400">
                {typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Adjust Score Form */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Chỉnh Điểm</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Điểm chỉnh sửa:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={adjustedScore ?? ""}
                  onChange={(e) => setAdjustedScore(e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  max={result.maxScore}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                />
                <span className="flex items-center text-slate-400">/ {result.maxScore}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Lý do chỉnh sửa:</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Giải thích lý do chỉnh điểm..."
                rows={4}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Chỉnh sửa từ:</label>
              <input
                type="email"
                value={adjustedBy}
                onChange={(e) => setAdjustedBy(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleAdjust}
                disabled={submitting || adjustedScore === null}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-2 rounded font-semibold transition"
              >
                {submitting ? "Đang lưu..." : "Lưu Chỉnh Điểm"}
              </button>
              
              {result.adjustedScore !== undefined && (
                <button
                  onClick={handleRemoveAdjustment}
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 px-4 py-2 rounded font-semibold transition"
                >
                  {submitting ? "Đang xoá..." : "Hủy Chỉnh Sửa"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
