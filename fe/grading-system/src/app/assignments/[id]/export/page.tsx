"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";

interface ExportJob {
  id: string;
  assignmentId: string;
  status: "Pending" | "Running" | "Completed" | "Failed";
  filePath?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export default function ExportPage() {
  const params = useParams();
  const assignmentId = params?.id as string;

  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportJob[]>([]);

  useEffect(() => {
    loadExportHistory();
  }, [assignmentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (pollingJobId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get<ExportJob>(`/exports/${pollingJobId}`);
          if (res.status && res.data) {
            setExportJob(res.data);

            if (res.data.status === "Completed" || res.data.status === "Failed") {
              setPollingJobId(null);
              loadExportHistory();
            }
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => clearInterval(interval);
  }, [pollingJobId]);

  const loadExportHistory = async () => {
    try {
      // Load recent exports (if endpoint available)
      const res = await api.get<ExportJob[]>(`/assignments/${assignmentId}/exports`);
      if (res.status && res.data) {
        setExportHistory(res.data);
      }
    } catch (err) {
      console.error("Load history error:", err);
    }
  };

  const handleCreateExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.createExport({ assignmentId });

      if (res.status && res.data) {
        setExportJob(res.data);
        setPollingJobId(res.data.id);
      } else {
        setError(res.message || "Lỗi khi tạo export job");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = async (exportJobId: string) => {
    try {
      const response = await api.downloadExport(exportJobId);
      
      if (!response.ok) {
        alert("Lỗi khi tải file");
        return;
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${exportJobId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi tải file");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/assignments/${assignmentId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại
        </Link>

        <h1 className="text-3xl font-bold mb-8">Export Kết Quả Chấm</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Create Export Section */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
          <h2 className="text-xl font-bold mb-4">Tạo Export Excel Mới</h2>
          <p className="text-slate-400 text-sm mb-4">
            Export sẽ chứa tất cả submissions, điểm từng câu, chi tiết test cases, và review notes.
          </p>

          <button
            onClick={handleCreateExport}
            disabled={loading || pollingJobId !== null}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-6 py-3 rounded font-semibold transition"
          >
            {loading ? "Tạo job..." : pollingJobId ? "Đang xử lý..." : "Tạo Export Job"}
          </button>
        </div>

        {/* Current Export Job Status */}
        {exportJob && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
            <h2 className="text-xl font-bold mb-4">Trạng Thái Export Hiện Tại</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Job ID:</span>
                  <p className="font-mono text-sm">{exportJob.id}</p>
                </div>
                <div>
                  <span className="text-slate-400">Trạng thái:</span>
                  <p className={`font-bold ${
                    exportJob.status === "Completed" ? "text-green-400" :
                    exportJob.status === "Running" ? "text-yellow-400" :
                    exportJob.status === "Failed" ? "text-red-400" :
                    "text-slate-400"
                  }`}>
                    {exportJob.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Tạo lúc:</span>
                  <p>{new Date(exportJob.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                {exportJob.completedAt && (
                  <div>
                    <span className="text-slate-400">Hoàn thành lúc:</span>
                    <p>{new Date(exportJob.completedAt).toLocaleString("vi-VN")}</p>
                  </div>
                )}
              </div>

              {exportJob.status === "Failed" && exportJob.errorMessage && (
                <div className="bg-red-500/10 p-3 rounded border border-red-500/30">
                  <p className="text-xs text-red-400"><strong>Lỗi:</strong> {exportJob.errorMessage}</p>
                </div>
              )}

              {exportJob.status === "Completed" && (
                <button
                  onClick={() => handleDownloadExport(exportJob.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold transition"
                >
                  📥 Tải File Excel
                </button>
              )}

              {exportJob.status === "Running" && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-bold mb-4">Lịch Sử Export</h2>

            <div className="space-y-2">
              {exportHistory.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                  <div className="flex-1">
                    <p className="text-sm">{new Date(job.createdAt).toLocaleString("vi-VN")}</p>
                    <p className={`text-xs ${
                      job.status === "Completed" ? "text-green-400" :
                      job.status === "Failed" ? "text-red-400" :
                      "text-slate-400"
                    }`}>
                      {job.status}
                    </p>
                  </div>
                  
                  {job.status === "Completed" && (
                    <button
                      onClick={() => handleDownloadExport(job.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
                    >
                      Tải
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 p-4 rounded">
          <h3 className="font-bold mb-2">Thông Tin Excel Export:</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Chứa tất cả submissions của assignment</li>
            <li>• Mỗi row = 1 submission (studentCode, Q1 score, Q2 score, total score)</li>
            <li>• Chi tiết test case results cho từng câu hỏi</li>
            <li>• Review notes và adjustment reasons</li>
            <li>• Định dạng: XLSX (Excel 2007+)</li>
            <li>• File có thể mở bằng Excel, Google Sheets, LibreOffice, v.v.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
