"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { Question, TestCase, CreateTestCaseRequest } from "@/types";

interface FormData {
  name: string;
  httpMethod: string;
  urlTemplate: string;
  inputJson: string;
  expectJson: string;
  score: number;
}

export default function QuestionDetailPage() {
  const params = useParams();
  const assignmentId = params?.id as string;
  const questionId = params?.qid as string;
  const [question, setQuestion] = useState<Question | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    httpMethod: "GET",
    urlTemplate: "",
    inputJson: "",
    expectJson: "",
    score: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (questionId) {
      loadData();
    }
  }, [questionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get all questions for the assignment
      const qRes = await api.getQuestionsByAssignment(assignmentId);
      
      if (qRes.status && qRes.data) {
        // Find the specific question
        const foundQuestion = qRes.data.find((q) => q.id === questionId);
        if (foundQuestion) {
          setQuestion(foundQuestion);
          
          // Get test cases for this question
          const tcRes = await api.getTestCasesByQuestion(questionId);
          if (tcRes.status && tcRes.data) {
            setTestCases(tcRes.data);
          }
        } else {
          setError("Question not found");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load question data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestCase = async () => {
    try {
      setSubmitting(true);

      const payload: CreateTestCaseRequest = {
        name: formData.name,
        httpMethod: formData.httpMethod,
        urlTemplate: formData.urlTemplate,
        inputJson: formData.inputJson || undefined,
        expectJson: formData.expectJson,
        score: formData.score,
      };

      const res = await api.createTestCases(questionId, [payload]);

      if (res.status) {
        setFormData({
          name: "",
          httpMethod: "GET",
          urlTemplate: "",
          inputJson: "",
          expectJson: "",
          score: 0,
        });
        setShowForm(false);
        loadData();
      } else {
        setError(res.message || "Failed to add test case");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding test case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId: string) => {
    if (!confirm("Are you sure you want to delete this test case?")) return;

    try {
      setSubmitting(true);
      const res = await api.deleteTestCase(testCaseId);
      if (res.status) {
        loadData();
      } else {
        setError(res.message || "Failed to delete test case");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting test case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTestCase = (tc: TestCase) => {
    setFormData({
      name: tc.name || "",
      httpMethod: tc.httpMethod,
      urlTemplate: tc.urlTemplate,
      inputJson: tc.inputJson || "",
      expectJson: tc.expectJson || tc.value || "",
      score: tc.score || 0,
    });
    setEditingId(tc.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateTestCase = async () => {
    if (!editingId) return;

    try {
      setSubmitting(true);

      const payload: CreateTestCaseRequest = {
        name: formData.name,
        httpMethod: formData.httpMethod,
        urlTemplate: formData.urlTemplate,
        inputJson: formData.inputJson || undefined,
        expectJson: formData.expectJson,
        score: formData.score,
      };

      const res = await api.updateTestCase(editingId, payload);

      if (res.status) {
        setFormData({
          name: "",
          httpMethod: "GET",
          urlTemplate: "",
          inputJson: "",
          expectJson: "",
          score: 0,
        });
        setEditingId(null);
        setShowForm(false);
        loadData();
      } else {
        setError(res.message || "Failed to update test case");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating test case");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;
  if (error || !question) return <div className="min-h-screen bg-slate-900 p-8 text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/assignments/${assignmentId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Assignment
        </Link>

        <h1 className="text-2xl font-bold mb-2">{question.title}</h1>
        <p className="text-slate-400 mb-6">
          Type: {question.type === "Api" ? "Web API (Q1)" : "Razor Pages (Q2)"} | Max Score: {question.maxScore}
        </p>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Test Cases ({testCases.length})</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
            >
              {showForm ? "Cancel" : "Add Test Case"}
            </button>
          </div>

          {showForm && (
            <div className="bg-slate-700 p-4 rounded-lg mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Test Case Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Get User by ID"
                    className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">HTTP Method</label>
                  <select
                    value={formData.httpMethod}
                    onChange={(e) => setFormData({ ...formData, httpMethod: e.target.value })}
                    className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">URL Template</label>
                  <input
                    type="text"
                    value={formData.urlTemplate}
                    onChange={(e) => setFormData({ ...formData, urlTemplate: e.target.value })}
                    placeholder="/api/users"
                    className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Input JSON (Optional)</label>
                  <textarea
                    value={formData.inputJson}
                    onChange={(e) => setFormData({ ...formData, inputJson: e.target.value })}
                    placeholder='{"id": 1}'
                    className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400 font-mono text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-slate-400 mt-1">Request body or query params as JSON</p>
                </div>

                <div>
                  <label className="block text-sm mb-1">Expected JSON Response</label>
                  <textarea
                    value={formData.expectJson}
                    onChange={(e) => setFormData({ ...formData, expectJson: e.target.value })}
                    placeholder='{"id": 1, "name": "John"}'
                    className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400 font-mono text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-slate-400 mt-1">Expected response JSON</p>
                </div>

                <div>
                  <label className="block text-sm mb-1">Score Points</label>
                  <input
                    type="number"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                    min={0}
                    className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={editingId ? handleUpdateTestCase : handleAddTestCase}
                    disabled={submitting || !formData.urlTemplate.trim() || !formData.name.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-2 rounded font-medium transition"
                  >
                    {submitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Test Case" : "Add Test Case")}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        name: "",
                        httpMethod: "GET",
                        urlTemplate: "",
                        inputJson: "",
                        expectJson: "",
                        score: 0,
                      });
                      setShowForm(false);
                    }}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {testCases.length === 0 ? (
            <p className="text-slate-400">No test cases yet</p>
          ) : (
            <div className="space-y-4">
              {testCases.map((tc) => (
                <div key={tc.id} className="bg-slate-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{tc.name}</p>
                      <p className="text-sm text-slate-400">{tc.httpMethod} {tc.urlTemplate}</p>
                      <p className="text-sm text-slate-400">Score: {tc.score}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/assignments/${assignmentId}/questions/${questionId}/testcases/${tc.id}`}
                        className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleEditTestCase(tc)}
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-3 py-1 rounded text-sm transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTestCase(tc.id)}
                        disabled={submitting}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 px-3 py-1 rounded text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-400 hover:text-blue-300">View Test Details</summary>
                    <div className="mt-2 bg-slate-600 p-2 rounded text-xs space-y-1">
                      {tc.inputJson && <div><strong>Input:</strong> {tc.inputJson}</div>}
                      {(tc.expectJson || tc.value) && <div><strong>Expected Response:</strong> {tc.expectJson || tc.value}</div>}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
