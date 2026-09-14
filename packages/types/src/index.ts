export type Locale = "en" | "hi";
export type AssessmentContext = "PERSONAL" | "SCHOOL";
export type OrganizationRole = "SCHOOL_ADMIN" | "TEACHER" | "STUDENT";
export type AssessmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "SCORING"
  | "MATCHING"
  | "AI_INTERPRETATION"
  | "REPORT_GENERATION"
  | "RESULT_READY"
  | "FAILED";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: { requestId: string };
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: Record<string, unknown> };
  requestId: string;
}
