const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const TOKEN_KEY = "aspu_token";

export function getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token: string): void { localStorage.setItem(TOKEN_KEY, token); }
export function clearToken(): void { localStorage.removeItem(TOKEN_KEY); }

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = getToken();
  return fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
}

export async function login(username: string, password: string): Promise<string> {
  const res = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "فشل تسجيل الدخول");
  return (data as { token: string }).token;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  clearToken();
}

async function get<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (res.status === 401) { clearToken(); throw Object.assign(new Error("SESSION_EXPIRED"), { statusCode: 401 }); }
  if (!res.ok) throw new Error(`خطأ ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  me:                  () => get<{ username: string }>("/auth/me"),
  dashboard:           () => get<Record<string, unknown>>("/student/dashboard"),
  announcements:       () => get<unknown[]>("/student/announcements"),
  personal:            () => get<PersonalProfile>("/student/profile/personal"),
  academic:            () => get<AcademicProfile>("/student/profile/academic"),
  financial:           () => get<FinancialProfile>("/student/profile/financial"),
  statement:           () => get<StatementRow[]>("/student/profile/statement"),
  epayments:           () => get<Record<string, unknown>>("/student/profile/epayments"),
  grades:              () => get<GradesData>("/student/grades"),
  currentGrades:       () => get<CurrentGradesData>("/student/grades/current"),
  gradesStatus:        () => get<GradesStatusData[]>("/student/grades/status"),
  lectures:            () => get<ScheduleData>("/student/schedule/lectures"),
  exams:               () => get<ExamData>("/student/schedule/exams"),
  remaining:           () => get<RemainingCourses>("/student/courses/remaining"),
  registrationOpened:  () => get<RegistrationData>("/student/registration/opened"),
  registrationAvail:   () => get<RegistrationData>("/student/registration/available"),
  registrationRules:   () => get<RegistrationRule[]>("/student/registration/rules"),
  settings:            () => get<StudentSettings>("/student/settings"),
};

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PersonalProfile {
  first_name: string; last_name: string; father_name: string; mother_name: string;
  birth_place: string; birth_date: string; gender_name: string; nationality_name: string;
  identity_no: string; national_no: string; email: string; mobile: string; picture: string;
}

export interface AcademicProfile {
  student_num: string; faculty: string; degree: string; level: string; status: string;
  agpa: string; credits: string; applying_semester: string; register_date: string;
  warning_status: string; diploma_type: string; diploma_mark: string;
  diploma_gpa: string; job_location: string;
}

export interface FinancialProfile {
  semester_name: string; sum_debit_formatted: string; sum_credit_formatted: string;
  balance_formatted: string; card_balance: string;
}

export interface StatementRow {
  transaction_date: string; transaction_type: string; transaction_statement: string;
  semester_name: string; debit: string; credit: string; balance: string; currency_name: string;
}

export interface Course {
  course_id: string; course_name: string; course_code: string; course_credits: string;
  final_mark: string | null; grade: string | null; finish_status: string | null;
  tests?: {
    archive_test_1: string | null; archive_test_2: string | null;
    archive_fixed_mark: string | null; archive_final_mark: string | null;
  };
}

export interface Semester {
  semester_id: string; semester_name: string; courses: Course[];
  gpa_percent: string | null; gpa_points: string | null;
  end_agpa_percent: string | null; end_agpa_points: string | null;
  grade_name: string | null; grade_name_sem: string | null;
  end_total_in_credits: string | null;
}

export interface GradesData { semesters: Semester[]; }

export interface CurrentGradesData {
  courses: Course[]; semester_name: string; max_tests_count: number; semester_id: string;
}

export interface GradesStatusSemester {
  semester_name: string; year_name: string; start_level_name: string;
  gpa_percent: string; gpa_points: string; end_agpa_percent: string;
  semester_pass_credits: string; end_total_in_credits: string;
  warning_status: string; temp_status: string;
}

export interface GradesStatusData {
  semesters: GradesStatusSemester[]; student_num: string;
  degree: string; degree_name: string;
}

export interface ScheduleData { courses: unknown[]; instructors: unknown[]; }
export interface ExamData { exams: unknown[]; }

export interface RemainingCourse {
  course_id: string; course_name_full: string; course_code: string;
  course_credits: string; requirement_type_id: string;
}

export interface RequirementType {
  requirement_type_id: string; requirement_type: string; credits_count: string | null;
}

export interface RemainingCourses { requirement_types: RequirementType[]; courses: RemainingCourse[]; }

export interface RegistrationCourse {
  course_id: string; course_name: string; course_code: string; course_credits: string;
  requirement_type: string; is_requestable: string; status_reason: string;
  allow_register: string; allow_exam: string; year_order: string; color?: string;
}

export interface RegistrationData { courses: RegistrationCourse[]; options?: unknown; }

export interface RegistrationRule { rule: string; value: string; description: string; }

export interface StudentSettings {
  is_male: boolean; military_zone: string | null; military_num: string | null;
  email: string | null; mobile: string | null; verify_email: boolean; verify_mobile: boolean;
}
