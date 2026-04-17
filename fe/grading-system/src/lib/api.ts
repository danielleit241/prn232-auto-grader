import { siteConfig } from "@/config/site";
import type {
  ApiResponse,
  Assignment,
  Question,
  TestCase,
  Submission,
  GradingJob,
  QuestionResult,
  CreateAssignmentRequest,
  CreateQuestionRequest,
  CreateTestCaseRequest,
  CreateExportRequest,
} from "@/types";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          status: false,
          message: data.message || "An error occurred",
          errors: data.errors,
          traceId: data.traceId,
        };
      }

      return {
        status: true,
        message: data.message || "Success",
        data: data.data,
      };
    } catch (error) {
      return {
        status: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFile<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          status: false,
          message: data.message || "Upload failed",
          errors: data.errors,
        };
      }

      return {
        status: true,
        message: data.message || "Success",
        data: data.data,
      };
    } catch (error) {
      return {
        status: false,
        message: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  // ====== Assignment Endpoints ======
  async getAssignments(): Promise<ApiResponse<Assignment[]>> {
    return this.get<Assignment[]>("/assignments");
  }

  async getAssignmentById(id: string): Promise<ApiResponse<Assignment>> {
    return this.get<Assignment>(`/assignments/${id}`);
  }

  async createAssignment(
    req: CreateAssignmentRequest
  ): Promise<ApiResponse<Assignment>> {
    return this.post<Assignment>("/assignments", req);
  }

  async deleteAssignment(assignmentId: string): Promise<ApiResponse<Assignment>> {
    return this.delete<Assignment>(`/assignments/${assignmentId}`);
  }

  // ====== Question Endpoints ======
  async getQuestionsByAssignment(
    assignmentId: string
  ): Promise<ApiResponse<Question[]>> {
    return this.get<Question[]>(`/assignments/${assignmentId}/questions`);
  }

  async createQuestions(
    assignmentId: string,
    reqs: CreateQuestionRequest[]
  ): Promise<ApiResponse<Question[]>> {
    return this.post<Question[]>(
      `/assignments/${assignmentId}/questions`,
      reqs
    );
  }

  // ====== Test Case Endpoints ======
  async createTestCases(
    questionId: string,
    reqs: CreateTestCaseRequest[]
  ): Promise<ApiResponse<TestCase[]>> {
    return this.post<TestCase[]>(`/questions/${questionId}/test-cases`, reqs);
  }

  async getTestCasesByQuestion(
    questionId: string
  ): Promise<ApiResponse<TestCase[]>> {
    return this.get<TestCase[]>(`/questions/${questionId}/test-cases`);
  }

  async deleteTestCase(testCaseId: string): Promise<ApiResponse<TestCase>> {
    return this.delete<TestCase>(`/test-cases/${testCaseId}`);
  }

  async updateTestCase(
    testCaseId: string,
    req: CreateTestCaseRequest
  ): Promise<ApiResponse<TestCase>> {
    return this.put<TestCase>(`/test-cases/${testCaseId}`, req);
  }

  // ====== Submission Endpoints ======
  async uploadSubmission(
    formData: FormData
  ): Promise<ApiResponse<Submission>> {
    return this.uploadFile<Submission>("/submissions/upload", formData);
  }

  async getSubmissionsByAssignment(
    assignmentId: string,
    studentCode?: string
  ): Promise<ApiResponse<Submission[]>> {
    const query = studentCode
      ? `?studentCode=${encodeURIComponent(studentCode)}`
      : "";
    return this.get<Submission[]>(
      `/assignments/${assignmentId}/submissions${query}`
    );
  }

  async getSubmissionById(id: string): Promise<ApiResponse<Submission>> {
    return this.get<Submission>(`/submissions/${id}`);
  }

  async deleteSubmission(submissionId: string): Promise<ApiResponse<Submission>> {
    return this.delete<Submission>(`/submissions/${submissionId}`);
  }

  // ====== Grading Endpoints ======
  async triggerGrading(submissionId: string): Promise<ApiResponse<GradingJob>> {
    return this.post<GradingJob>(`/submissions/${submissionId}/grade`);
  }

  async getGradingJob(jobId: string): Promise<ApiResponse<GradingJob>> {
    return this.get<GradingJob>(`/grading-jobs/${jobId}`);
  }

  async getGradingJobsBySubmission(
    submissionId: string
  ): Promise<ApiResponse<GradingJob[]>> {
    return this.get<GradingJob[]>(
      `/submissions/${submissionId}/grading-jobs`
    );
  }

  // ====== Results Endpoints ======
  async getSubmissionResults(
    submissionId: string
  ): Promise<ApiResponse<QuestionResult[]>> {
    return this.get<QuestionResult[]>(`/submissions/${submissionId}/results`);
  }

  // ====== Export Endpoints ======
  async createExport(req: CreateExportRequest): Promise<ApiResponse<any>> {
    return this.post<any>("/exports", req);
  }

  async downloadExport(exportId: string): Promise<Response> {
    const url = `${this.baseUrl}/exports/${exportId}/download`;
    return fetch(url);
  }
}

export const api = new ApiClient(siteConfig.apiUrl);