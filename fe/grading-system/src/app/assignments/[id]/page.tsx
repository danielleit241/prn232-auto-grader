"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { Assignment, Question, Submission } from "@/types";

interface QuestionFormData {
  title: string;
  type: 0 | 1;
  maxScore: number;
  artifactFolderName: string;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "submissions">("overview");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

      const [assignRes, questRes, subRes] = await Promise.all([
        api.getAssignmentById(assignmentId),
        api.getQuestionsByAssignment(assignmentId),
        api.getSubmissionsByAssignment(assignmentId),
      ]);

      if (assignRes.status && assignRes.data) setAssignment(assignRes.data);
      if (questRes.status && questRes.data) setQuestions(questRes.data);
      if (subRes.status && subRes.data) setSubmissions(subRes.data);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      setSubmittingQuestion(true);
      setError(null);

      if (!questionForm.title.trim()) {
        setError("Question title is required");
        return;
      }

      const res = await api.createQuestions(assignmentId, [questionForm]);

      if (res.status && res.data) {
        setQuestions([...questions, ...res.data]);
        setQuestionForm({
          title: "",
          type: 0,
          maxScore: 100,
          artifactFolderName: "Q1",
        });
        setShowQuestionForm(false);
      } else {
        setError(res.message || "Failed to create question");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating question");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!confirm("Are you sure you want to delete this assignment? All questions, test cases, and submissions will also be deleted. This action cannot be undone.")) return;

    try {
      setDeleting(true);
      const res = await api.deleteAssignment(assignmentId);
      if (res.status) {
        router.push("/assignments");
      } else {
        setError(res.message || "Failed to delete assignment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting assignment");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;
  if (!assignment) return <div className="min-h-screen bg-slate-900 p-8 text-red-400">Assignment not found</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/assignments" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Assignments
          </Link>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{assignment.title}</h1>
              <p className="text-slate-400">{assignment.description}</p>
            </div>
            <button
              onClick={handleDeleteAssignment}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 px-4 py-2 rounded font-medium transition"
            >
              {deleting ? "Deleting..." : "Delete Assignment"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 transition ${activeTab === "overview" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-white"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-2 transition ${activeTab === "questions" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-white"}`}
          >
            Questions
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-4 py-2 transition ${activeTab === "submissions" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-white"}`}
          >
            Submissions
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Link 
                href={`/assignments/${assignmentId}/setup`} 
                className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded font-semibold transition text-center"
              >
                📦 Setup Resources
              </Link>
              <Link 
                href={`/assignments/${assignmentId}/questions`} 
                className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded font-semibold transition text-center"
              >
                ❓ Manage Questions
              </Link>
              <Link 
                href={`/assignments/${assignmentId}/submissions`} 
                className="bg-cyan-600 hover:bg-cyan-700 px-4 py-3 rounded font-semibold transition text-center"
              >
                📤 Submissions
              </Link>
              <Link 
                href={`/assignments/${assignmentId}/export`} 
                className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded font-semibold transition text-center"
              >
                📊 Export Results
              </Link>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Questions ({questions.length})</h2>
              {questions.length === 0 ? (
                <p className="text-slate-400">No questions yet</p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{q.title}</h3>
                          <p className="text-sm text-slate-400">
                            Type: {q.type === "Api" ? "Web API (Q1)" : "Razor Pages (Q2)"} | Max Score: {q.maxScore}
                          </p>
                        </div>
                        <Link href={`/assignments/${assignmentId}/questions/${q.id}`} className="text-blue-400 hover:text-blue-300">
                          Manage
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
              <button
                onClick={() => setShowQuestionForm(!showQuestionForm)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
              >
                {showQuestionForm ? "Cancel" : "+ Add Question"}
              </button>
            </div>

            {showQuestionForm && (
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={questionForm.title}
                    onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                    placeholder="e.g., API Test Question 1"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={questionForm.type}
                      onChange={(e) => setQuestionForm({ ...questionForm, type: Number(e.target.value) as 0 | 1 })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value={0}>API</option>
                      <option value={1}>Razor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Max Score</label>
                    <input
                      type="number"
                      value={questionForm.maxScore}
                      onChange={(e) => setQuestionForm({ ...questionForm, maxScore: Number(e.target.value) })}
                      min={1}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Artifact Folder Name</label>
                  <input
                    type="text"
                    value={questionForm.artifactFolderName}
                    onChange={(e) => setQuestionForm({ ...questionForm, artifactFolderName: e.target.value })}
                    placeholder="e.g., Q1"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleCreateQuestion}
                  disabled={submittingQuestion}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-2 rounded font-medium transition"
                >
                  {submittingQuestion ? "Creating..." : "Create Question"}
                </button>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-center text-slate-400">
                No questions yet. Create one to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => (
                  <div key={q.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{q.title}</h3>
                      <p className="text-sm text-slate-400">Max Score: {q.maxScore}</p>
                    </div>
                    <Link href={`/assignments/${assignmentId}/questions/${q.id}`} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition">
                      Manage Test Cases
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Submissions ({submissions.length})</h2>
              <Link 
                href={`/assignments/${assignmentId}/submit`} 
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition"
              >
                + New Submission
              </Link>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              {submissions.length === 0 ? (
                <p className="text-slate-400">No submissions yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-2 text-left">Student Code</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Score</th>
                        <th className="px-4 py-2 text-left">Submitted</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {submissions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-700/50">
                          <td className="px-4 py-2">{s.studentCode}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              s.status === "Done" ? "bg-green-500/20 text-green-400" :
                              s.status === "Grading" ? "bg-yellow-500/20 text-yellow-400" :
                              s.status === "Error" ? "bg-red-500/20 text-red-400" :
                              "bg-slate-600 text-slate-300"
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {s.totalScore !== undefined && s.maxScore ? `${s.totalScore}/${s.maxScore}` : "-"}
                          </td>
                          <td className="px-4 py-2 text-slate-400">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td className="px-4 py-2 text-sm space-x-2">
                            <Link 
                              href={`/assignments/${assignmentId}/submissions/${s.id}/results`}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              Results
                            </Link>
                            {s.status !== "Done" && (
                              <button className="text-yellow-400 hover:text-yellow-300">
                                Start Grading
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
