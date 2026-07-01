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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
  if (res.status === 401) { clearToken(); throw Object.assign(new Error('SESSION_EXPIRED'), { statusCode: 401 }); }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {message?:string}).message ?? `خطأ ${res.status}`); }
  return res.json() as Promise<T>;
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
  epayments:           () => get<EPaymentsData>("/student/profile/epayments"),
  banks:               () => get<unknown[]>("/student/profile/banks"),
  grades:              () => get<GradesData>("/student/grades"),
  currentGrades:       () => get<CurrentGradesData>("/student/grades/current"),
  gradesStatus:        () => get<GradesStatusData[]>("/student/grades/status"),
  lectures:            () => get<ScheduleData>("/student/schedule/lectures"),
  exams:               () => get<ExamData>("/student/schedule/exams"),
  calendarEvents:      () => get<CalendarEventsData>("/student/schedule/events"),
  remaining:           () => get<RemainingCourses>("/student/registration/remaining"),
  registrationOpened:  () => get<RegistrationData>("/student/registration/opened"),
  registrationAvail:   () => get<RegistrationData>("/student/registration/available"),
  registrationRules:   () => get<RegistrationRule[]>("/student/registration/rules"),
  submitRegistration:  (body: { courseIds: string[]; onlyExamIds: string[] }) => post<Record<string,unknown>>("/student/registration/submit", body),
  windowOne:           () => get<WindowOneData>("/student/window-one"),
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
  diploma_gpa: string; job_location: string; current_status?: string;
  level_short?: string; grade_version?: string; transferred_credits?: string;
  aca_warning_status_id?: string | null; transcript_statement?: string | null;
  admission_date?: string; diploma_num?: string; diploma_location?: string;
  diploma_period?: string; diploma_date?: string | null; advisor_name?: string | null;
}

export interface FinancialProfile {
  semester_name: string; sum_debit_formatted: string; sum_credit_formatted: string;
  balance_formatted: string; card_balance: string;
}

export interface StatementRow {
  transaction_date: string; transaction_type: string; transaction_statement: string;
  transaction_category?: string; semester_name: string; debit: string; credit: string;
  balance: string; local_balance?: string; currency_name: string; currency_rate?: string;
  transaction_notes?: string | null;
}

export interface EPaymentsData {
  currency: { CURRENCY_ID: string; CURRENCY_NAME: string; CURRENCY_CODE: string | null };
  e_payments: Array<{
    id: string; amount: string; status: string; created_at: string;
    payment_method?: string; reference_num?: string;
  }>;
}

export interface Course {
  course_id: string; course_name: string; course_code: string; course_credits: string;
  final_mark: string | null; grade: string | null; finish_status: string | null;
  points?: string | null; is_visible?: string; register_status?: string;
  hide_reason?: string | null; final_added_marks?: string | null;
  tests?: {
    archive_test_1: string | null; archive_test_2: string | null;
    archive_test_3?: string | null; archive_test_4?: string | null;
    archive_fixed_mark: string | null; archive_final_mark: string | null;
    final_mark?: string | null; grade?: string | null;
    tests_count?: number;
  };
}

export interface Semester {
  semester_id: string; semester_name: string; courses: Course[];
  gpa_percent: string | null; gpa_points: string | null;
  end_agpa_percent: string | null; end_agpa_points: string | null;
  grade_name: string | null; grade_name_sem: string | null;
  end_total_in_credits: string | null; transferred?: Course[];
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

export interface LectureSlot {
  course_name?: string;
  course_code?: string;
  course_credits?: string;
  day_id?: string | number;
  day_name?: string;
  short_day_name?: string;
  period_id?: string | number;
  period_name?: string;
  period_from?: string;
  period_to?: string;
  t_instructor_name?: string | null;
  p_instructor_name?: string | null;
  room_ids?: string | null;
  room_name?: string | null;
  group_num?: string | number | null;
  section_num?: string | number | null;
  color?: string | null;
}
export interface ScheduleData { courses: LectureSlot[]; instructors: unknown[]; }
export interface ExamData { exams: unknown[]; }
export interface CalendarEventsData {
  events: Array<{
    date: string; type: string; course_name?: string; note?: string;
  }>;
  labels: Array<{ text: string | null; value: string; color: string }>;
}

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

export interface WindowOneRequest {
  id: string; request_category: string; request_category_id: string;
  request_type: string; request_type_id?: string;
  status: string; status_id?: string; status_color?: string;
  created_at: string; semester_name: string;
  notes?: string | null; response?: string | null;
}

export interface WindowOneData {
  semester_name: string;
  request_delete_allowed_hours: string;
  request_categories: Record<string, string>;
  requests: WindowOneRequest[];
  request_types?: Array<{ id: string; name: string; category_id: string }>;
}

export interface StudentSettings {
  is_male: boolean; military_zone: string | null; military_num: string | null;
  email: string | null; mobile: string | null; verify_email: boolean; verify_mobile: boolean;
  picture?: string; allow_change_profile_photo?: boolean;
  announcement_methods?: Array<{ announcement_method_id: string; method_code: string; method_name: string }>;
}
