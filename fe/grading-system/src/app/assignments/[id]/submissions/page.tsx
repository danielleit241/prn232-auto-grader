"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { Submission } from "@/types";

export default function SubmissionsListPage() {
  const params = useParams();
  const assignmentId = params?.id as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "grading" | "done" | "error">("all");
  const [searchCode, setSearchCode] = useState("");

  useEffect(() => {
    loadSubmissions();
  }, [assignmentId, filter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.getSubmissionsByAssignment(assignmentId, searchCode || undefined);

      if (res.status && res.data) {
        let filtered = res.data;

        if (filter !== "all") {
          const statusMap: Record<string, string> = {
            pending: "Pending",
            grading: "Grading",
            done: "Done",
            error: "Error"
          };
          const mappedStatus = statusMap[filter];
          filtered = filtered.filter((s) => s.status === mappedStatus);
        }

        setSubmissions(filtered);
      } else {
        setError(res.message || "Cannot load submissions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading submissions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link href={`/assignments/${assignmentId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại Assignment
        </Link>

        <h1 className="text-3xl font-bold mb-8">Submissions</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Tìm kiếm mã sinh viên:</label>
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="e.g., SE123456"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Lọc theo trạng thái:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="Pending">Chưa chấm</option>
                <option value="Grading">Đang chấm</option>
                <option value="Done">Hoàn thành</option>
                <option value="Error">Lỗi</option>
              </select>
            </div>
          </div>

          <button
            onClick={loadSubmissions}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold transition"
          >
            Refresh
          </button>
        </div>

        {/* Submissions Table */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 overflow-x-auto">
          {submissions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Không có submissions</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">Mã Sinh Viên</th>
                  <th className="px-4 py-3 text-left">Trạng Thái</th>
                  <th className="px-4 py-3 text-left">Điểm</th>
                  <th className="px-4 py-3 text-left">Ngày Nộp</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-semibold">{s.studentCode}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        s.status === "Done" ? "bg-green-500/20 text-green-400" :
                        s.status === "Grading" ? "bg-yellow-500/20 text-yellow-400" :
                        s.status === "Error" ? "bg-red-500/20 text-red-400" :
                        "bg-slate-600 text-slate-300"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.totalScore !== undefined && s.maxScore 
                        ? `${s.totalScore}/${s.maxScore}` 
                        : "-"
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(s.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/assignments/${assignmentId}/submissions/${s.id}`}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          Chi Tiết
                        </Link>
                        {s.status === "Done" && (
                          <Link
                            href={`/assignments/${assignmentId}/submissions/${s.id}/results`}
                            className="text-green-400 hover:text-green-300 font-semibold"
                          >
                            Kết Quả
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <p className="text-slate-400 text-sm">Total Submissions</p>
            <p className="text-2xl font-bold">{submissions.length}</p>
          </div>
          <div className="bg-yellow-500/10 p-4 rounded border border-yellow-500/30">
            <p className="text-slate-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">
              {submissions.filter(s => s.status === "Pending").length}
            </p>
          </div>
          <div className="bg-green-500/10 p-4 rounded border border-green-500/30">
            <p className="text-slate-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">
              {submissions.filter(s => s.status === "Done").length}
            </p>
          </div>
          <div className="bg-red-500/10 p-4 rounded border border-red-500/30">
            <p className="text-slate-400 text-sm">Errors</p>
            <p className="text-2xl font-bold text-red-400">
              {submissions.filter(s => s.status === "Error").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
