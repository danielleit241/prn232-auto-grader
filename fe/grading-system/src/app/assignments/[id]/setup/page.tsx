"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";

export default function AssignmentSetupPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [databaseSql, setDatabaseSql] = useState<File | null>(null);
  const [givenApiBaseUrl, setGivenApiBaseUrl] = useState("http://localhost:5100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUploadResources = async () => {
    if (!databaseSql) {
      setError("Vui lòng chọn file database.sql");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("databaseSql", databaseSql);
      formData.append("givenApiBaseUrl", givenApiBaseUrl);

      const res = await api.uploadAssignmentResources(assignmentId, formData);

      if (res.status) {
        setSuccess("Upload tài nguyên thành công!");
        setDatabaseSql(null);
        setTimeout(() => {
          router.push(`/assignments/${assignmentId}`);
        }, 1500);
      } else {
        setError(res.message || "Lỗi khi upload");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link href={`/assignments/${assignmentId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại
        </Link>

        <h1 className="text-3xl font-bold mb-8">Thiết Lập Tài Nguyên Assignment</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded mb-6">
            {success}
          </div>
        )}

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-6">
          {/* Database SQL Upload */}
          <div>
            <h2 className="text-xl font-bold mb-3">1. Upload Database SQL</h2>
            <p className="text-slate-400 text-sm mb-3">
              File database.sql cho worker sử dụng để restore database.
            </p>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-blue-400 transition">
              <input
                type="file"
                accept=".sql"
                onChange={(e) => setDatabaseSql(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {databaseSql && (
                <p className="mt-2 text-sm text-green-400">✓ {databaseSql.name}</p>
              )}
            </div>
          </div>

          {/* Given API Base URL */}
          <div>
            <h2 className="text-xl font-bold mb-3">2. Teacher API Base URL</h2>
            <p className="text-slate-400 text-sm mb-3">
              URL nơi worker sẽ gọi API của teacher để auto-grade submissions.
            </p>
            <input
              type="text"
              value={givenApiBaseUrl}
              onChange={(e) => setGivenApiBaseUrl(e.target.value)}
              placeholder="http://localhost:5100"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* Upload Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUploadResources}
              disabled={loading || !databaseSql}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-3 rounded font-semibold transition"
            >
              {loading ? "Đang upload..." : "Upload Tài Nguyên"}
            </button>
            <Link
              href={`/assignments/${assignmentId}`}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded font-semibold transition text-center"
            >
              Hủy
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 p-4 rounded">
          <h3 className="font-bold mb-2">Lưu ý:</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Database SQL được restore trước khi test student code</li>
            <li>• Given Solution API được sử dụng để test student endpoints (Q1)</li>
            <li>• Q2 (Razor Pages) sẽ call Given API thông qua givenApiBaseUrl env var</li>
            <li>• Cần setup Test Cases sau khi upload tài nguyên</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
