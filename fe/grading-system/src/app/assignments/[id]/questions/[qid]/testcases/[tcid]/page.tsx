"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib";
import type { TestCase, Question } from "@/types";

export default function TestCaseDetailPage() {
  const params = useParams();
  const assignmentId = params?.id as string;
  const questionId = params?.qid as string;
  const testCaseId = params?.tcid as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [testCaseId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get all test cases for question
      const tcRes = await api.getTestCasesByQuestion(questionId);
      if (tcRes.status && tcRes.data) {
        const found = tcRes.data.find((tc) => tc.id === testCaseId);
        setTestCase(found || null);
      }

      // Get question
      const qRes = await api.getQuestionsByAssignment(assignmentId);
      if (qRes.status && qRes.data) {
        const found = qRes.data.find((q) => q.id === questionId);
        setQuestion(found || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <p className="text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (error || !testCase || !question) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <Link href={`/assignments/${assignmentId}/questions/${questionId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại
        </Link>
        <p className="text-red-400">{error || "Test case không tìm thấy"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/assignments/${assignmentId}/questions/${questionId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Quay lại câu hỏi
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-slate-400 mb-2">{question.title}</p>
          <h1 className="text-3xl font-bold">{testCase.name || `Test Case ${testCaseId.substring(0, 8)}`}</h1>
        </div>

        {/* API Endpoint */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
          <h2 className="text-xl font-bold mb-4">API Endpoint</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-slate-400">HTTP Method:</span>
              <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 rounded">{testCase.httpMethod}</span>
            </div>
            <div>
              <span className="text-slate-400">URL Template:</span>
              <p className="mt-1 bg-slate-700 p-2 rounded text-slate-200 break-all">{testCase.urlTemplate}</p>
            </div>
          </div>
        </div>

        {/* Test Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input */}
          {testCase.inputJson && (
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-lg font-bold mb-3">Input (JSON)</h2>
              <pre className="bg-slate-700 p-3 rounded text-xs text-slate-200 overflow-x-auto">
                {JSON.stringify(JSON.parse(testCase.inputJson), null, 2)}
              </pre>
            </div>
          )}

          {/* Expected Output */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-lg font-bold mb-3">Expected Output</h2>
            <pre className="bg-slate-700 p-3 rounded text-xs text-slate-200 overflow-x-auto">
              {testCase.expectJson || testCase.value || "N/A"}
            </pre>
          </div>
        </div>

        {/* Scoring */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
          <h2 className="text-xl font-bold mb-4">Điểm Số</h2>
          <div className="text-3xl font-bold text-green-400">{testCase.score} điểm</div>
        </div>

        {/* Additional Fields */}
        {(testCase.expectedStatus || testCase.fields || testCase.selector) && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-bold mb-4">Thông Tin Chi Tiết</h2>
            <div className="space-y-3 text-sm">
              {testCase.expectedStatus && (
                <div>
                  <span className="text-slate-400">Expected Status Code:</span>
                  <p className="text-white font-semibold">{testCase.expectedStatus}</p>
                </div>
              )}
              {testCase.fields && testCase.fields.length > 0 && (
                <div>
                  <span className="text-slate-400">Fields:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {testCase.fields.map((field, idx) => (
                      <span key={idx} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {testCase.selector && (
                <div>
                  <span className="text-slate-400">CSS Selector:</span>
                  <p className="font-mono text-white mt-1 bg-slate-700 p-2 rounded break-all">{testCase.selector}</p>
                </div>
              )}
              {testCase.selectorText && (
                <div>
                  <span className="text-slate-400">Selector Text:</span>
                  <p className="text-white mt-1">{testCase.selectorText}</p>
                </div>
              )}
              {testCase.selectorMinCount && (
                <div>
                  <span className="text-slate-400">Min Count:</span>
                  <p className="text-white font-semibold">{testCase.selectorMinCount}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
