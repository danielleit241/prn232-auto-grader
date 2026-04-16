"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib";
import type { CreateAssignmentRequest } from "@/types";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAssignmentRequest>({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.createAssignment(formData);
      if (res.status && res.data) {
        router.push(`/assignments/${(res.data as any).id}`);
      } else {
        setError(res.message || "Failed to create");
      }
    } catch (err) {
      setError("Error creating assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Assignment</h1>

        <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg border border-slate-700">
          {error && <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6">{error}</div>}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
              placeholder="Assignment Title"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white h-24"
              placeholder="Assignment Description"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-4 py-2 rounded-lg font-medium transition"
          >
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </form>
      </div>
    </div>
  );
}
