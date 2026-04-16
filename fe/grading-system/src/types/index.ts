// ==================== Enums ====================
export type QuestionType = "Api" | "Razor"; // 0 = Api, 1 = Razor
export type SubmissionStatus = "Pending" | "Grading" | "Done" | "Error";
export type JobStatus = "Pending" | "Running" | "Done" | "Failed";
export type ExportStatus = "Pending" | "Done" | "Failed";

// ==================== Main Entities ====================
export interface Assignment {
  id: string;
  title: string;
  description?: string;
  databaseSqlPath?: string;
  givenApiBaseUrl?: string;
  createdAt: string;
}

export interface AssignmentSummary {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface Question {
  id: string;
  assignmentId: string;
  title: string;
  type: QuestionType;
  maxScore: number;
  artifactFolderName: string;
  createdAt: string;
}

export interface TestCase {
  id: string;
  questionId: string;
  name: string;
  httpMethod: string;
  urlTemplate: string;
  inputJson?: string;
  expectJson?: string;
  expectedStatus?: number;
  isArray?: boolean;
  fields?: string[];
  score: number;
  value?: string;
  selector?: string;
  selectorText?: string;
  selectorMinCount?: number;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentCode: string;
  sourceCode?: string;
  artifactZipPath: string;
  status: SubmissionStatus;
  createdAt: string;
  totalScore?: number;
  maxScore?: number;
}

export interface GradingJob {
  id: string;
  submissionId: string;
  status: JobStatus;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
}

export interface QuestionResult {
  id: string;
  submissionId: string;
  questionId: string;
  questionTitle?: string;
  studentCode: string;
  studentId: string;
  score: number;
  scoreObtained?: number;
  maxScore: number;
  finalScore: number;
  passed?: boolean;
  output?: string;
  detail?: string;
  adjustedScore?: number;
  adjustReason?: string;
  adjustedBy?: string;
  adjustedAt?: string;
  createdAt: string;
}

export interface ReviewNote {
  id: string;
  submissionId: string;
  studentCode: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportJob {
  id: string;
  assignmentId: string;
  status: ExportStatus;
  filePath?: string;
  errorMessage?: string;
  createdAt?: string;
}

// ==================== Request DTOs ====================
export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  deadline?: string;
}

export interface CreateQuestionRequest {
  title: string;
  type: 0 | 1; // 0 = Api, 1 = Razor
  maxScore: number;
  artifactFolderName: string;
}

export interface CreateTestCaseRequest {
  name: string;
  httpMethod: string;
  urlTemplate: string;
  inputJson?: string;
  expectJson: string;
  score: number;
}

export interface CreateExportRequest {
  assignmentId: string;
}

export interface UpdateReviewNoteRequest {
  submissionId: string;
  notes: string;
}

// ==================== API Response ====================
export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data?: T;
  errors?: string[];
  traceId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
