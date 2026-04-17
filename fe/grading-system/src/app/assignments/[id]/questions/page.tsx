"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { Question, Assignment } from "@/types";

interface QuestionFormData {
  title: string;
  type: 0 | 1;
  maxScore: number;
  artifactFolderName: string;
}

export default function QuestionsListPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    title: "",
    type: 0,
    maxScore: 100,
    artifactFolderName: "Q1",
  });

  useEffect(() => {
    if (assignmentId) {
      loadData();
    }
  }, [assignmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignRes, questRes] = await Promise.all([
        api.getAssignmentById(assignmentId),
        api.getQuestionsByAssignment(assignmentId),
      ]);

      if (assignRes.status && assignRes.data) setAssignment(assignRes.data);
      if (questRes.status && questRes.data) setQuestions(questRes.data);
    } catch (err) {
      setError("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!questionForm.title.trim()) {
        setError("Vui lòng nhập tiêu đề câu hỏi");
        return;
      }

      const res = await api.createQuestions(assignmentId, [questionForm]);

      if (res.status && res.data) {
        setQuestions([...questions, ...res.data]);
        setQuestionForm({
          title: "",
          type: 0,
          maxScore: 100,
          artifactFolderName: `Q${questions.length + 1}`,
        });
        setShowForm(false);
      } else {
        setError(res.message || "Lỗi khi tạo câu hỏi");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link href={`/assignments/${assignmentId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quản Lý Câu Hỏi</h1>
          {assignment && <p className="text-slate-400">{assignment.title}</p>}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Create Question Form */}
        {showForm && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
            <h2 className="text-xl font-bold mb-4">Tạo Câu Hỏi Mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tiêu Đề *</label>
                <input
                  type="text"
                  value={questionForm.title}
                  onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                  placeholder="VD: Simple REST API"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Loại Câu Hỏi *</label>
                  <select
                    value={questionForm.type}
                    onChange={(e) => setQuestionForm({ ...questionForm, type: parseInt(e.target.value) as 0 | 1 })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value={0}>Q2 - Razor Pages</option>
                    <option value={1}>Q3 - REST API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Điểm Tối Đa *</label>
                  <input
                    type="number"
                    value={questionForm.maxScore}
                    onChange={(e) => setQuestionForm({ ...questionForm, maxScore: parseInt(e.target.value) })}
                    min="0"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Folder Artifact *</label>
                <input
                  type="text"
                  value={questionForm.artifactFolderName}
                  onChange={(e) => setQuestionForm({ ...questionForm, artifactFolderName: e.target.value })}
                  placeholder="Q1, Q2, Q3..."
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateQuestion}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-4 py-2 rounded font-semibold transition"
                >
                  {submitting ? "Đang tạo..." : "Tạo Câu Hỏi"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded font-semibold transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Danh Sách Câu Hỏi ({questions.length})</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold transition"
              >
                ➕ Thêm Câu Hỏi
              </button>
            )}
          </div>

          {questions.length === 0 ? (
            <p className="text-slate-400">Chưa có câu hỏi nào. {!showForm && 'Nhấn "Thêm Câu Hỏi" để tạo.'}</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-700 p-4 rounded border border-slate-600 hover:border-blue-400 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{q.title}</h3>
                      <p className="text-sm text-slate-400">
                        Loại: {q.type === "Api" ? "REST API" : "Razor Pages"} | Điểm: {q.maxScore} | Folder: {q.artifactFolderName}
                      </p>
                    </div>
                    <Link
                      href={`/assignments/${assignmentId}/questions/${q.id}`}
                      className="ml-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition whitespace-nowrap"
                    >
                      Quản Lý
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
