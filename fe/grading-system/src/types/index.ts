// ==================== Enums ====================
export type QuestionType = 0 | 1;
export type SubmissionStatus = "Pending" | "Grading" | "Done" | "Failed";
export type JobStatus = "Pending" | "Running" | "Done" | "Failed";
export type ExportStatus = "Pending" | "Running" | "Done" | "Failed";

// ==================== ExamSession ====================
export interface ExamSession {
  id: string;
  code?: string;
  title: string;
  description?: string;
  createdAt: string;
  assignments?: Assignment[];
}

export interface CreateExamSessionRequest {
  title: string;
  description?: string;
}

// ==================== Main Entities ====================
export interface Assignment {
  id: string;
  code: string;
  title: string;
  description?: string;
  examSessionId?: string;
  databaseSqlPath?: string;
  givenApiBaseUrl?: string;
  hasGivenZip: boolean;
  createdAt: string;
}

export interface AssignmentSummary {
  id: string;
  code: string;
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
  input?: unknown;
  expectedStatus?: number;
  isArray?: boolean;
  fields?: string[];
  value?: string;
  score: number;
  expectedBody?: unknown;
  elementId?: string;
  elementText?: string;
  selector?: string;
  selectorText?: string;
  selectorMinCount?: number;
  order: number;
  extract?: Record<string, string>;
  createdAt: string;
}

export interface Participant {
  id: string;
  assignmentId: string;
  username: string;
  studentCode: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentCode: string;
  username: string;
  sourceCode?: string;
  artifactZipPath: string;
  status: SubmissionStatus;
  hasArtifact: boolean;
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
  progress?: number;
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
  testCaseResults?: TestCaseResult[];
  adjustedScore?: number;
  adjustReason?: string;
  adjustedBy?: string;
  adjustedAt?: string;
  passedTestCases?: number;
  totalTestCases?: number;
  createdAt: string;
}

export interface TestCaseResult {
  testCaseId: string;
  name: string;
  pass: boolean;
  awardedScore: number;
  httpMethod: string;
  url: string;
  actualStatus?: number;
  actualBody?: string;
  failReason?: string;
  screenshotBase64?: string;
}

export interface SubmissionQuestionResult {
  questionId: string;
  questionTitle: string;
  score: number;
  finalScore: number;
  maxScore: number;
  adjustedScore?: number;
  adjustReason?: string;
  testCaseResults: TestCaseResult[];
}

export interface SessionSubmissionResult {
  submissionId: string;
  username: string;
  studentCode: string;
  assignmentCode: string;
  gradingRound: string;
  status: SubmissionStatus;
  hasArtifact: boolean;
  totalScore: number;
  maxScore: number;
  questions: SubmissionQuestionResult[];
  notes?: string;
}

export interface ReviewNote {
  id: string;
  submissionId: string;
  studentCode: string;
  notes: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportJob {
  id: string;
  assignmentId?: string;
  assignmentCode?: string;
  examSessionId?: string;
  examSessionTitle?: string;
  status: ExportStatus;
  gradingRound?: string;
  filePath?: string;
  errorMessage?: string;
  createdAt?: string;
}

export interface BulkUploadResult {
  parsed: number;
  created: number;
  missing: number;
  errors: string[];
}

export interface ImportParticipantsResult {
  created: number;
  skipped: number;
  errors: string[];
}

// ==================== Request DTOs ====================
export interface CreateAssignmentRequest {
  code: string;
  title: string;
  description?: string;
  examSessionId?: string;
}

export interface CreateQuestionRequest {
  title: string;
  type: 0 | 1;
  maxScore: number;
  artifactFolderName: string;
}

export interface CreateTestCaseRequest {
  name?: string;
  httpMethod: string;
  urlTemplate: string;
  input?: unknown;
  expectedStatus?: number;
  isArray?: boolean;
  fields?: string[];
  value?: string;
  score: number;
  expectedBody?: unknown;
  elementId?: string;
  elementText?: string;
  selector?: string;
  selectorText?: string;
  selectorMinCount?: number;
  order?: number;
  extract?: Record<string, string>;
}

export interface AdjustQuestionResultRequest {
  adjustedScore: number;
  adjustReason: string;
  adjustedBy?: string;
}

export interface UpdateReviewNoteRequest {
  content: string;
  reviewedBy?: string;
}

export interface CreateExportRequest {
  assignmentId?: string;
  gradingRound?: string;
  examSessionId?: string;
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
