// User types
export type UserRole = "student" | "instructor" | "admin";

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Assignment types
export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Submission types
export type SubmissionStatus = "pending" | "grading" | "completed" | "failed";

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  student?: User;
  assignment?: Assignment;
  fileUrl: string;
  score?: number;
  feedback?: string;
  status: SubmissionStatus;
  submittedAt: string;
  gradedAt?: string;
}

// Grading types
export interface GradingResult {
  id: string;
  submissionId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  testResults: TestResult[];
  feedback: string;
  gradedAt: string;
}

export interface TestResult {
  testCaseName: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  message?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
