import { siteConfig } from "@/config/site";
import type {
  ApiResponse,
  Assignment,
  AssignmentSummary,
  Question,
  TestCase,
  Submission,
  GradingJob,
  QuestionResult,
  SessionSubmissionResult,
  Participant,
  ExportJob,
  BulkUploadResult,
  ImportParticipantsResult,
  ExamSession,
  CreateAssignmentRequest,
  CreateQuestionRequest,
  CreateTestCaseRequest,
  CreateExamSessionRequest,
  AdjustQuestionResultRequest,
  UpdateReviewNoteRequest,
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

  async uploadFileRaw<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
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

  // ====== ExamSession Endpoints ======
  async createExamSession(
    req: CreateExamSessionRequest
  ): Promise<ApiResponse<ExamSession>> {
    return this.post<ExamSession>("/exam-sessions", req);
  }

  async getExamSessions(): Promise<ApiResponse<ExamSession[]>> {
    return this.get<ExamSession[]>("/exam-sessions");
  }

  async getExamSessionById(
    id: string
  ): Promise<ApiResponse<ExamSession>> {
    return this.get<ExamSession>(`/exam-sessions/${id}`);
  }

  async deleteExamSession(id: string): Promise<ApiResponse<ExamSession>> {
    return this.delete<ExamSession>(`/exam-sessions/${id}`);
  }

  async getExamSessionParticipants(
    sessionId: string
  ): Promise<ApiResponse<Participant[]>> {
    return this.get<Participant[]>(`/exam-sessions/${sessionId}/participants`);
  }

  async getExamSessionResults(
    sessionId: string,
    gradingRound?: string
  ): Promise<ApiResponse<SessionSubmissionResult[]>> {
    const query = gradingRound
      ? `?gradingRound=${encodeURIComponent(gradingRound)}`
      : "";
    return this.get<SessionSubmissionResult[]>(
      `/exam-sessions/${sessionId}/results${query}`
    );
  }

  async createExamSessionExport(
    sessionId: string,
    gradingRound?: string
  ): Promise<ApiResponse<ExportJob>> {
    const body = gradingRound ? { gradingRound } : {};
    return this.post<ExportJob>(`/exam-sessions/${sessionId}/exports`, body);
  }

  // ====== Assignment Endpoints ======
  async getAssignments(): Promise<ApiResponse<AssignmentSummary[]>> {
    return this.get<AssignmentSummary[]>("/assignments");
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

  async updateAssignment(
    id: string,
    req: {
      code?: string;
      title?: string;
      description?: string;
      databaseSqlPath?: string;
      givenApiBaseUrl?: string;
    }
  ): Promise<ApiResponse<Assignment>> {
    return this.put<Assignment>(`/assignments/${id}`, req);
  }

  async uploadAssignmentResources(
    assignmentId: string,
    databaseSql: File | null,
    givenApiBaseUrl?: string,
    givenZip?: File | null
  ): Promise<ApiResponse<Assignment>> {
    const formData = new FormData();
    if (databaseSql) {
      formData.append("databaseSql", databaseSql);
    }
    if (givenApiBaseUrl) {
      formData.append("givenApiBaseUrl", givenApiBaseUrl);
    }
    if (givenZip) {
      formData.append("givenZip", givenZip);
    }
    return this.uploadFileRaw<Assignment>(
      `/assignments/${assignmentId}/resources`,
      formData
    );
  }

  async importParticipants(
    assignmentId: string,
    csvFile: File
  ): Promise<ApiResponse<ImportParticipantsResult>> {
    const formData = new FormData();
    formData.append("file", csvFile);
    return this.uploadFile<ImportParticipantsResult>(
      `/assignments/${assignmentId}/participants/import`,
      formData
    );
  }

  async getParticipants(
    assignmentId: string
  ): Promise<ApiResponse<Participant[]>> {
    return this.get<Participant[]>(
      `/assignments/${assignmentId}/participants`
    );
  }

  async bulkUpload(
    assignmentId: string,
    zipFile: File,
    gradingRound?: string
  ): Promise<ApiResponse<BulkUploadResult>> {
    const formData = new FormData();
    formData.append("file", zipFile);
    if (gradingRound) {
      formData.append("gradingRound", gradingRound);
    }
    return this.uploadFile<BulkUploadResult>(
      `/assignments/${assignmentId}/bulk-upload`,
      formData
    );
  }

  async triggerGrading(
    assignmentId: string,
    gradingRound?: string
  ): Promise<ApiResponse<number>> {
    const query = gradingRound
      ? `?gradingRound=${encodeURIComponent(gradingRound)}`
      : "";
    return this.post<number>(`/assignments/${assignmentId}/grade${query}`);
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

  async createQuestion(
    assignmentId: string,
    req: CreateQuestionRequest
  ): Promise<ApiResponse<Question>> {
    const res = await this.post<Question[]>(
      `/assignments/${assignmentId}/questions`,
      [req]
    );
    return {
      status: res.status,
      message: res.message,
      data: res.data?.[0] as Question | undefined,
      errors: res.errors,
      traceId: res.traceId,
    };
  }

  async deleteQuestion(questionId: string): Promise<ApiResponse<Question>> {
    return this.delete<Question>(`/questions/${questionId}`);
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
  async getSubmissionById(id: string): Promise<ApiResponse<Submission>> {
    return this.get<Submission>(`/submissions/${id}`);
  }

  async getSubmissionResults(
    submissionId: string
  ): Promise<ApiResponse<QuestionResult[]>> {
    return this.get<QuestionResult[]>(
      `/submissions/${submissionId}/question-results`
    );
  }

  async deleteSubmission(submissionId: string): Promise<ApiResponse<Submission>> {
    return this.delete<Submission>(`/submissions/${submissionId}`);
  }

  async addSubmissionNotes(
    submissionId: string,
    content: string,
    reviewedBy?: string
  ): Promise<ApiResponse<Submission>> {
    return this.put<Submission>(`/submissions/${submissionId}/notes`, {
      content,
      reviewedBy,
    });
  }

  // ====== Grading Endpoints ======
  async triggerGradingSubmission(
    submissionId: string
  ): Promise<ApiResponse<GradingJob>> {
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
  async getQuestionResultById(
    resultId: string
  ): Promise<ApiResponse<QuestionResult>> {
    return this.get<QuestionResult>(`/question-results/${resultId}`);
  }

  async adjustQuestionResult(
    resultId: string,
    req: AdjustQuestionResultRequest
  ): Promise<ApiResponse<QuestionResult>> {
    return this.put<QuestionResult>(
      `/question-results/${resultId}/adjust`,
      req
    );
  }

  async deleteQuestionResultAdjustment(
    resultId: string
  ): Promise<ApiResponse<QuestionResult>> {
    return this.delete<QuestionResult>(`/question-results/${resultId}/adjust`);
  }

  // ====== Export Endpoints ======
  async createExport(req: CreateExportRequest): Promise<ApiResponse<ExportJob>> {
    const res = await this.post<ExportJob>("/exports", req);
    // Track export job ID in localStorage
    if (res.status && res.data) {
      try {
        const ids = JSON.parse(localStorage.getItem("export_jobs") || "[]") as string[];
        if (!ids.includes(res.data.id)) {
          ids.unshift(res.data.id);
          localStorage.setItem("export_jobs", JSON.stringify(ids.slice(0, 50)));
        }
      } catch {
        // ignore localStorage errors
      }
    }
    return res;
  }

  async getExportJob(exportId: string): Promise<ApiResponse<ExportJob>> {
    return this.get<ExportJob>(`/exports/${exportId}`);
  }

  async downloadExport(exportId: string): Promise<Response> {
    const url = `${this.baseUrl}/exports/${exportId}/download`;
    return fetch(url);
  }
}

export const api = new ApiClient(siteConfig.apiUrl);
