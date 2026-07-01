import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  LayoutDashboard, BookOpen, GraduationCap, Calendar,
  Wallet, ListChecks, LogOut, Menu, X, ChevronDown,
  User, AlertCircle, Loader2, RefreshCw, Bell,
  ClipboardList, CreditCard, Settings, TrendingUp, ChevronRight,
  Inbox, CheckCircle, Clock, XCircle,
} from "lucide-react";
import {
  api, login, logout, getToken, setToken, clearToken,
  type PersonalProfile, type AcademicProfile, type FinancialProfile,
  type GradesData, type Semester, type RemainingCourses,
  type ScheduleData, type ExamData, type WindowOneData,
} from "./lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeClass(g: string | null): string {
  if (!g) return "bg-gray-100 text-gray-500";
  const u = g.toUpperCase();
  if (u.startsWith("A")) return "grade-a";
  if (u.startsWith("B")) return "grade-b";
  if (u.startsWith("C")) return "grade-c";
  if (u.startsWith("D")) return "grade-d";
  return "grade-f";
}

function gradePercent(pct: string | null): string {
  if (!pct) return "-";
  const n = parseFloat(pct);
  if (n >= 90) return "text-emerald-600";
  if (n >= 75) return "text-blue-600";
  if (n >= 60) return "text-yellow-600";
  if (n >= 50) return "text-orange-500";
  return "text-red-600";
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <Loader2
      size={size}
      className="animate-spin text-[var(--aspu-green)]"
    />
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <span className="w-1 h-5 bg-[var(--aspu-green)] rounded-full inline-block" />
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 min-w-[130px]">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-left">{value ?? "—"}</span>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size={32} />
      <p className="text-gray-400 text-sm">جاري التحميل…</p>
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-gray-600 text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
      >
        <RefreshCw size={14} />
        إعادة المحاولة
      </button>
    </div>
  );
}

// ─── useData hook ─────────────────────────────────────────────────────────────

function useData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (e.message === "SESSION_EXPIRED") {
          setLoading(false);
          window.dispatchEvent(new Event("session-expired"));
          return;
        }
        setError(e.message || "حدث خطأ غير متوقع");
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}

// ─── Login Page ───────────────────────────────────────────────────────────────

const REMEMBER_KEY = "aspu_remembered_username";

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const savedUser = localStorage.getItem(REMEMBER_KEY) ?? "";
  const [username, setUsername] = useState(savedUser);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(savedUser !== "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const token = await login(username.trim(), password);
      setToken(token);
      // Save or clear remembered username based on checkbox
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, username.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      onLogin();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--aspu-green-dark)] via-[var(--aspu-green)] to-emerald-500 flex items-center justify-center p-4">
      <div className="w-full max-w-sm fade-in">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap size={40} className="text-[var(--aspu-green)]" />
          </div>
          <h1 className="text-2xl font-bold text-white">بوابة الطالب</h1>
          <p className="text-emerald-100 text-sm mt-1">جامعة الشام الخاصة — ASPU</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-7">
          <h2 className="text-lg font-bold text-gray-800 mb-5">تسجيل الدخول</h2>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--aspu-green)] focus:border-transparent transition"
                placeholder="أدخل اسم المستخدم"
                autoComplete="username"
                dir="ltr"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--aspu-green)] focus:border-transparent transition"
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                dir="ltr"
                disabled={loading}
              />
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only"
                  disabled={loading}
                />
                <div className={`w-5 h-5 rounded-md border-2 transition-colors flex items-center justify-center
                  ${remember
                    ? "bg-[var(--aspu-green)] border-[var(--aspu-green)]"
                    : "bg-white border-gray-300 group-hover:border-[var(--aspu-green)]"
                  }`}>
                  {remember && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-600">تذكّرني</span>
            </label>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full bg-[var(--aspu-green)] hover:bg-[var(--aspu-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size={18} /> : null}
              {loading ? "جاري التحقق…" : "دخول"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-5">
            يتم استخدام نفس بيانات دخول بوابة ASPU
          </p>
        </div>

        {/* Developer credit */}
        <p className="text-center text-emerald-200/70 text-xs mt-6">
          المطور: عماد الدين النسمة
        </p>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type Page = "overview" | "grades" | "currentgrades" | "academicstatus" | "profile" | "financial" | "statement" | "schedule" | "courses" | "registration" | "windowone" | "settings";

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview",       label: "الرئيسية",           icon: LayoutDashboard },
  { id: "grades",         label: "النتائج والعلامات",   icon: BookOpen },
  { id: "currentgrades",  label: "علامات الفصل الحالي", icon: TrendingUp },
  { id: "registration",   label: "تسجيل المقررات",     icon: ClipboardList },
  { id: "schedule",       label: "الجدول الدراسي",     icon: Calendar },
  { id: "profile",        label: "ملفي الشخصي",       icon: User },
  { id: "financial",      label: "الوضع المالي",      icon: Wallet },
  { id: "statement",      label: "كشف الحساب",        icon: CreditCard },
  { id: "courses",        label: "المواد المتبقية",    icon: ListChecks },
  { id: "academicstatus", label: "السجل الأكاديمي",    icon: GraduationCap },
  { id: "windowone",      label: "طلبات الطالب",       icon: Inbox },
  { id: "settings",       label: "الإعدادات",          icon: Settings },
];

function Sidebar({
  page, setPage, onLogout, collapsed, setCollapsed, username,
}: {
  page: Page;
  setPage: (p: Page) => void;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  username: string;
}) {
  return (
    <>
      {/* Overlay on mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full z-30 flex flex-col bg-[var(--aspu-green-dark)] text-white transition-all duration-300 shadow-2xl
          ${collapsed ? "translate-x-full md:translate-x-0 md:w-16 w-[260px]" : "translate-x-0 w-[260px]"}`}
        style={{ direction: "rtl" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <GraduationCap size={22} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold leading-tight truncate">بوابة الطالب</p>
              <p className="text-xs text-emerald-200 truncate">ASPU</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mr-auto p-1.5 rounded-lg hover:bg-white/10 transition hidden md:flex"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* User badge */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 bg-white/10 rounded-xl flex items-center gap-2">
            <User size={16} className="text-emerald-200" />
            <span className="text-sm truncate">{username}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setPage(id); setCollapsed(true); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition text-sm font-medium
                ${page === id ? "bg-white/20 text-white" : "text-emerald-100 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-900/30 transition"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function OverviewPage({ username }: { username: string }) {
  const { data: dash, loading, error, refetch } = useData(() => api.dashboard());
  const { data: academic } = useData(() => api.academic());
  const { data: announcements } = useData(() => api.announcements());

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const acad = academic as AcademicProfile | null;
  const anns = (announcements ?? []) as Array<{ title: string; body: string; date: string }>;
  const dashData = dash as { first_name?: string } | null;

  return (
    <div className="space-y-5 fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-l from-[var(--aspu-green)] to-emerald-400 text-white rounded-2xl p-6">
        <p className="text-emerald-100 text-sm">مرحباً بك،</p>
        <h2 className="text-2xl font-bold mt-0.5">{dashData?.first_name ?? username} 👋</h2>
        {acad && (
          <p className="text-emerald-100 text-sm mt-2">
            {acad.faculty} — {acad.level}
          </p>
        )}
      </div>

      {/* Quick stats */}
      {acad && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "المعدل التراكمي", value: acad.agpa },
            { label: "الفصل الدراسي", value: acad.applying_semester },
            { label: "الساعات المعتمدة", value: `${acad.credits} ساعة` },
            { label: "الإنذار الأكاديمي", value: acad.warning_status },
          ].map((item) => (
            <Card key={item.label} className="text-center !p-4">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="text-sm font-bold text-gray-800 leading-snug">{item.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Announcements */}
      <Card>
        <SectionTitle>الإعلانات والأخبار</SectionTitle>
        {anns.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-gray-300 gap-2">
            <Bell size={32} />
            <p className="text-sm">لا توجد إعلانات حالياً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anns.slice(0, 10).map((a, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <p className="font-semibold text-sm text-gray-800">{a.title}</p>
                <p className="text-sm text-gray-500 mt-1">{a.body}</p>
                {a.date && <p className="text-xs text-gray-300 mt-1">{a.date}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function GradesPage() {
  const { data, loading, error, refetch } = useData(() => api.grades());
  const [openSemester, setOpenSemester] = useState<string | null>(null);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const grades = data as GradesData | null;
  const semesters = (grades?.semesters ?? []).filter(
    (s) => s.semester_id !== "all" && s.courses.length > 0
  );

  return (
    <div className="space-y-4 fade-in">
      <SectionTitle>النتائج والعلامات</SectionTitle>

      {semesters.length === 0 && (
        <Card>
          <p className="text-center text-gray-400 py-10">لا توجد نتائج متاحة</p>
        </Card>
      )}

      {semesters.map((sem: Semester) => (
        <Card key={sem.semester_id} className="!p-0 overflow-hidden">
          {/* Semester header */}
          <button
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-right"
            onClick={() =>
              setOpenSemester(openSemester === sem.semester_id ? null : sem.semester_id)
            }
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-800 text-sm">{sem.semester_name}</span>
              {sem.grade_name_sem && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {sem.grade_name_sem}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {sem.gpa_percent && (
                <span className={`font-bold text-sm ${gradePercent(sem.gpa_percent)}`}>
                  {parseFloat(sem.gpa_percent).toFixed(1)}%
                </span>
              )}
              {sem.end_agpa_percent && (
                <span className="text-xs text-gray-400">
                  تراكمي: {parseFloat(sem.end_agpa_percent).toFixed(1)}%
                </span>
              )}
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${openSemester === sem.semester_id ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {/* Courses table */}
          {openSemester === sem.semester_id && (
            <div className="border-t border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="text-right px-5 py-2.5 font-medium">المادة</th>
                    <th className="px-3 py-2.5 font-medium">ساعات</th>
                    <th className="px-3 py-2.5 font-medium">الأعمال</th>
                    <th className="px-3 py-2.5 font-medium">النهائي</th>
                    <th className="px-3 py-2.5 font-medium">المجموع</th>
                    <th className="px-3 py-2.5 font-medium">التقدير</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.courses.map((c) => (
                    <tr key={c.course_id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{c.course_name}</p>
                        <p className="text-xs text-gray-400">{c.course_code}</p>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">{c.course_credits}</td>
                      <td className="px-3 py-3 text-center text-gray-600 text-xs">
                        {c.tests?.archive_fixed_mark ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 text-xs">
                        {c.tests?.archive_final_mark ?? "—"}
                      </td>
                      <td className={`px-3 py-3 text-center font-bold ${gradePercent(c.final_mark)}`}>
                        {c.final_mark ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${gradeClass(c.grade)}`}>
                          {c.grade ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
                    <td className="px-5 py-2.5 font-medium" colSpan={2}>
                      إجمالي: {sem.end_total_in_credits} ساعة معتمدة
                    </td>
                    <td className="px-3 py-2.5 text-center" colSpan={2}>
                      {sem.grade_name && `التقدير: ${sem.grade_name}`}
                    </td>
                    <td className={`px-3 py-2.5 text-center font-bold ${gradePercent(sem.gpa_percent)}`}>
                      {sem.gpa_percent ? `${parseFloat(sem.gpa_percent).toFixed(1)}%` : ""}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {sem.gpa_points ? `${sem.gpa_points} pts` : ""}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ProfilePage() {
  const { data: personal, loading: lp, error: ep, refetch: rp } = useData(() => api.personal());
  const { data: academic, loading: la, error: ea, refetch: ra } = useData(() => api.academic());

  if (lp || la) return <LoadingBlock />;
  if (ep) return <ErrorBlock message={ep} onRetry={rp} />;
  if (ea) return <ErrorBlock message={ea} onRetry={ra} />;

  const p = personal as PersonalProfile | null;
  const a = academic as AcademicProfile | null;

  return (
    <div className="space-y-5 fade-in">
      {/* Personal header */}
      {p && (
        <Card className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <img
            src={p.picture}
            alt="صورة الطالب"
            className="w-24 h-24 rounded-2xl object-cover border-4 border-[var(--aspu-green-light)] shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e8f5ee'/%3E%3Ctext x='50' y='55' text-anchor='middle' font-size='40' fill='%230a7c3e'%3E👤%3C/text%3E%3C/svg%3E";
            }}
          />
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {p.first_name} {p.last_name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{a?.faculty}</p>
            <p className="text-sm text-[var(--aspu-green)] font-medium">{a?.degree}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-[var(--aspu-green-light)] text-[var(--aspu-green)] px-3 py-1 rounded-full font-medium">
                {a?.level}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                رقم الطالب: {a?.student_num}
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {p && (
          <Card>
            <SectionTitle>المعلومات الشخصية</SectionTitle>
            <InfoRow label="الاسم الأول" value={p.first_name} />
            <InfoRow label="اسم الأب" value={p.father_name} />
            <InfoRow label="اسم الأم" value={p.mother_name} />
            <InfoRow label="اللقب" value={p.last_name} />
            <InfoRow label="مكان الولادة" value={p.birth_place} />
            <InfoRow label="تاريخ الولادة" value={p.birth_date} />
            <InfoRow label="الجنس" value={p.gender_name} />
            <InfoRow label="الجنسية" value={p.nationality_name} />
            <InfoRow label="رقم الهوية" value={p.identity_no} />
            <InfoRow label="الرقم الوطني" value={p.national_no} />
            <InfoRow label="البريد الإلكتروني" value={p.email} />
            <InfoRow label="رقم الجوال" value={p.mobile} />
          </Card>
        )}

        {a && (
          <Card>
            <SectionTitle>المعلومات الأكاديمية</SectionTitle>
            <InfoRow label="رقم الطالب" value={a.student_num} />
            <InfoRow label="الكلية" value={a.faculty} />
            <InfoRow label="التخصص" value={a.degree} />
            <InfoRow label="السنة الدراسية" value={a.level} />
            <InfoRow label="الحالة" value={a.status} />
            <InfoRow label="الفصل الحالي" value={a.applying_semester} />
            <InfoRow label="الساعات المعتمدة" value={`${a.credits} ساعة`} />
            <InfoRow label="المعدل التراكمي" value={a.agpa} />
            <InfoRow label="تاريخ التسجيل" value={a.register_date} />
            <InfoRow label="الإنذار الأكاديمي" value={a.warning_status} />
            <InfoRow label="نوع الشهادة" value={a.diploma_type} />
            <InfoRow label="علامة الشهادة" value={a.diploma_mark} />
            <InfoRow label="معدل الشهادة" value={a.diploma_gpa} />
          </Card>
        )}
      </div>
    </div>
  );
}

function FinancialPage() {
  const { data, loading, error, refetch } = useData(() => api.financial());

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const f = data as FinancialProfile | null;
  if (!f) return null;

  const balance = parseFloat(f.balance_formatted.replace(/,/g, ""));
  const isCredit = balance < 0;

  return (
    <div className="space-y-5 fade-in">
      <SectionTitle>الوضع المالي</SectionTitle>

      {/* Summary banner */}
      <div
        className={`rounded-2xl p-6 text-white ${isCredit ? "bg-gradient-to-l from-emerald-600 to-emerald-400" : "bg-gradient-to-l from-red-600 to-red-400"}`}
      >
        <p className="text-sm opacity-80">الرصيد الحالي — {f.semester_name}</p>
        <p className="text-3xl font-bold mt-1 ltr">
          {isCredit ? "+" : ""}{Math.abs(balance).toLocaleString()} ل.س
        </p>
        <p className="text-sm mt-1 opacity-70">
          {isCredit ? "رصيد دائن — بلا مديونية" : "مديونية متبقية"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="text-center !p-6">
          <p className="text-sm text-gray-400 mb-1">مجموع المدفوعات</p>
          <p className="text-2xl font-bold text-emerald-600 ltr">{f.sum_credit_formatted} ل.س</p>
        </Card>
        <Card className="text-center !p-6">
          <p className="text-sm text-gray-400 mb-1">مجموع المستحقات</p>
          <p className="text-2xl font-bold text-gray-700 ltr">{f.sum_debit_formatted} ل.س</p>
        </Card>
      </div>

      <Card>
        <SectionTitle>تفاصيل الحساب</SectionTitle>
        <InfoRow label="الفصل الدراسي" value={f.semester_name} />
        <InfoRow label="مجموع المدفوعات" value={`${f.sum_credit_formatted} ل.س`} />
        <InfoRow label="مجموع المستحقات" value={`${f.sum_debit_formatted} ل.س`} />
        <InfoRow
          label="الرصيد"
          value={`${isCredit ? "دائن " : "مدين "}${Math.abs(balance).toLocaleString()} ل.س`}
        />
        <InfoRow label="رصيد البطاقة" value={`${f.card_balance} ل.س`} />
      </Card>
    </div>
  );
}

function SchedulePage() {
  const { data: lec, loading: ll, error: el, refetch: rl } = useData(() => api.lectures());
  const { data: exm, loading: le, error: ee, refetch: re } = useData(() => api.exams());

  if (ll || le) return <LoadingBlock />;

  const schedule = lec as ScheduleData | null;
  const exams = exm as ExamData | null;
  const examList = (exams?.exams ?? []) as Array<{
    course_name?: string;
    exam_date?: string;
    exam_time?: string;
    room_name?: string;
    seat_no?: string;
    day_name?: string;
  }>;

  return (
    <div className="space-y-5 fade-in">
      {/* Lectures */}
      <Card>
        <SectionTitle>جدول المحاضرات</SectionTitle>
        {el ? (
          <ErrorBlock message={el} onRetry={rl} />
        ) : (schedule?.courses ?? []).length === 0 ? (
          <div className="flex flex-col items-center py-10 text-gray-300 gap-2">
            <Calendar size={32} />
            <p className="text-sm text-gray-400">
              الجدول غير متاح حالياً أو الفصل منتهٍ
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">يتم عرض البيانات كما وردت من الجامعة</p>
        )}
      </Card>

      {/* Exams */}
      <Card>
        <SectionTitle>جدول الامتحانات</SectionTitle>
        {ee ? (
          <ErrorBlock message={ee} onRetry={re} />
        ) : examList.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-gray-300 gap-2">
            <BookOpen size={32} />
            <p className="text-sm text-gray-400">لا توجد امتحانات مجدولة حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="text-right px-4 py-2.5 font-medium">المادة</th>
                  <th className="px-3 py-2.5 font-medium">التاريخ</th>
                  <th className="px-3 py-2.5 font-medium">اليوم</th>
                  <th className="px-3 py-2.5 font-medium">الوقت</th>
                  <th className="px-3 py-2.5 font-medium">القاعة</th>
                  <th className="px-3 py-2.5 font-medium">المقعد</th>
                </tr>
              </thead>
              <tbody>
                {examList.map((ex, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{ex.course_name}</td>
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">{ex.exam_date}</td>
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">{ex.day_name}</td>
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">{ex.exam_time}</td>
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">{ex.room_name}</td>
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">{ex.seat_no ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function CoursesPage() {
  const { data, loading, error, refetch } = useData(() => api.remaining());

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const rem = data as RemainingCourses | null;
  const courses = rem?.courses ?? [];
  const reqTypes = (rem?.requirement_types ?? []).filter(
    (r) => r.requirement_type_id !== "all"
  );

  const byType = reqTypes.map((rt) => ({
    ...rt,
    courses: courses.filter((c) => c.requirement_type_id === rt.requirement_type_id),
  }));

  return (
    <div className="space-y-5 fade-in">
      <SectionTitle>المواد المتبقية حتى التخرج</SectionTitle>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {reqTypes.map((rt) => (
          <Card key={rt.requirement_type_id} className="!p-4 text-center">
            <p className="text-xs text-gray-400 mb-1 leading-snug">{rt.requirement_type}</p>
            <p className="text-lg font-bold text-[var(--aspu-green)]">
              {rt.credits_count ?? "—"} <span className="text-xs font-normal text-gray-400">ساعة</span>
            </p>
          </Card>
        ))}
      </div>

      {/* Courses by type */}
      {byType.map((group) =>
        group.courses.length === 0 ? null : (
          <Card key={group.requirement_type_id}>
            <SectionTitle>{group.requirement_type}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.courses.map((c) => (
                <div
                  key={c.course_id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.course_name_full}</p>
                    <p className="text-xs text-gray-400">{c.course_code}</p>
                  </div>
                  <span className="text-xs bg-[var(--aspu-green-light)] text-[var(--aspu-green)] px-2.5 py-1 rounded-full font-medium shrink-0 mr-2">
                    {c.course_credits} ساعة
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )
      )}

      {courses.length === 0 && (
        <Card>
          <p className="text-center text-gray-400 py-10">لا توجد مواد متبقية</p>
        </Card>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────


// ─── Current Semester Grades ────────────────────────────────────────────────

function CurrentGradesPage() {
  const { data, loading, error, refetch } = useData(() => api.currentGrades());

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const d = data as { courses: unknown[]; semester_name: string; max_tests_count: number } | null;
  const courses = (d?.courses ?? []) as Array<{
    course_name: string; course_code: string; course_credits: string;
    final_mark: string | null; grade: string | null;
    tests: {
      archive_test_1: string | null; archive_test_2: string | null;
      archive_fixed_mark: string | null; archive_final_mark: string | null;
      final_mark: string | null; grade: string | null;
    } | null;
  }>;

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <SectionTitle>علامات الفصل الحالي</SectionTitle>
        {d?.semester_name && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{d.semester_name}</span>
        )}
      </div>
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المقرر</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">أعمال فصل</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">نهائي</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">التقدير</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{c.course_name}</p>
                    <p className="text-xs text-gray-400">{c.course_code} · {c.course_credits} ساعة</p>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-medium text-gray-700">{c.tests?.archive_fixed_mark ?? "—"}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-medium text-gray-700">{c.tests?.archive_final_mark ?? "—"}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {c.grade ? (
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${gradeClass(c.grade)}`}>{c.grade}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Registration Page ────────────────────────────────────────────────────────

function RegistrationPage() {
  const { data: opened, loading, error, refetch } = useData(() => api.registrationOpened());
  const { data: rules } = useData(() => api.registrationRules());
  const [selected, setSelected] = useState<Record<string, "study" | "exam">>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const courses = ((opened as { courses?: unknown[] } | null)?.courses ?? []) as Array<{
    course_id: string; course_name: string; course_code: string; course_credits: string;
    requirement_type: string; allow_register: string; allow_exam: string;
    status_reason: string; is_requestable: string; year_order: string;
  }>;
  const rulesList = (rules as Array<{ rule: string; value: string }> | null) ?? [];
  const canRegister = courses.filter(c => c.is_requestable === 'Y');

  const toggle = (id: string, type: "study" | "exam") => {
    setSelected(prev => {
      if (prev[id] === type) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: type };
    });
    setResult(null);
  };

  const selectedCount = Object.keys(selected).length;

  const handleSubmit = async () => {
    setConfirm(false);
    setSubmitting(true);
    setResult(null);
    try {
      const courseIds = Object.entries(selected).filter(([,t]) => t === "study").map(([id]) => id);
      const onlyExamIds = Object.entries(selected).filter(([,t]) => t === "exam").map(([id]) => id);
      const res = await api.submitRegistration({ courseIds, onlyExamIds });
      const r = res as { success?: boolean; message?: string; errorMessages?: string[] };
      if (r.success) {
        setResult({ success: true, message: "تم إرسال طلب التسجيل بنجاح ✓" });
        setSelected({});
        refetch();
      } else {
        const msg = r.errorMessages?.join(" | ") ?? r.message ?? "حدث خطأ أثناء التسجيل";
        setResult({ success: false, message: msg });
      }
    } catch (e: unknown) {
      setResult({ success: false, message: e instanceof Error ? e.message : "خطأ في الاتصال" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <SectionTitle>تسجيل المقررات</SectionTitle>

      {/* Rules */}
      {rulesList.length > 0 && (
        <Card>
          <SectionTitle>قواعد التسجيل</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rulesList.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-0.5">{r.rule}</p>
                <p className="font-semibold text-sm text-gray-800">{r.value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Result banner */}
      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {result.message}
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center space-y-4">
            <p className="text-lg font-bold text-gray-800">تأكيد التسجيل</p>
            <p className="text-sm text-gray-500">سيتم إرسال طلب تسجيل <span className="font-bold text-gray-700">{selectedCount} مقرر</span> إلى الجامعة. هل أنت متأكد؟</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleSubmit} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors">
                نعم، سجّل
              </button>
              <button onClick={() => setConfirm(false)} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courses list */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>المقررات المتاحة للتسجيل ({canRegister.length})</SectionTitle>
          {selectedCount > 0 && (
            <button
              onClick={() => setConfirm(true)}
              disabled={submitting}
              className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {submitting ? "جاري الإرسال..." : `تسجيل ${selectedCount} مقرر`}
            </button>
          )}
        </div>

        {canRegister.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">لا توجد مقررات متاحة للتسجيل حالياً</p>
        ) : (
          <div className="space-y-2">
            {canRegister.map((c) => {
              const sel = selected[c.course_id];
              return (
                <div key={c.course_id} className={`border rounded-xl px-4 py-3 transition-colors ${sel ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 leading-snug">{c.course_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.course_code} · {c.requirement_type} · {c.course_credits} ساعة</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {c.allow_register === 'Y' && (
                        <button
                          onClick={() => toggle(c.course_id, "study")}
                          className={`text-xs px-2 py-1 rounded-lg font-medium border transition-colors ${sel === "study" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
                        >
                          دراسة
                        </button>
                      )}
                      {c.allow_exam === 'Y' && (
                        <button
                          onClick={() => toggle(c.course_id, "exam")}
                          className={`text-xs px-2 py-1 rounded-lg font-medium border transition-colors ${sel === "exam" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"}`}
                        >
                          امتحان
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Academic Status Page ─────────────────────────────────────────────────────

function AcademicStatusPage() {
  const { data, loading, error, refetch } = useData(() => api.gradesStatus());

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const records = (data as Array<{ semesters: unknown[]; degree_name: string }> | null) ?? [];
  const allSemesters = records.flatMap(r =>
    (r.semesters as Array<{
      semester_name: string; year_name: string; start_level_name: string;
      gpa_percent: string; gpa_points: string; end_agpa_percent: string;
      semester_pass_credits: string; end_total_in_credits: string;
      warning_status: string; temp_status: string;
    }>)
  );

  return (
    <div className="space-y-5 fade-in">
      <SectionTitle>السجل الأكاديمي</SectionTitle>

      {/* Summary chart-like overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "عدد الفصول", value: allSemesters.length.toString() },
          { label: "الساعات المجتازة", value: allSemesters[allSemesters.length - 1]?.end_total_in_credits ?? "—" },
          { label: "المعدل التراكمي", value: allSemesters[allSemesters.length - 1]?.end_agpa_percent ? allSemesters[allSemesters.length - 1].end_agpa_percent + "%" : "—" },
          { label: "الحالة الأكاديمية", value: allSemesters[allSemesters.length - 1]?.temp_status ?? "—" },
        ].map(item => (
          <Card key={item.label} className="!p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">{item.label}</p>
            <p className="text-sm font-bold text-gray-800">{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Semesters table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الفصل</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">معدل الفصل</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">المعدل التراكمي</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">الساعات</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {allSemesters.map((s, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-xs leading-snug">{s.semester_name}</p>
                    <p className="text-xs text-gray-400">{s.start_level_name}</p>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-bold text-sm ${gradePercent(s.gpa_percent)}`}>{s.gpa_percent}%</span>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600 text-xs">{s.end_agpa_percent}%</td>
                  <td className="px-3 py-3 text-center text-gray-600 text-xs">{s.semester_pass_credits}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s.temp_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Statement Page ───────────────────────────────────────────────────────────

function StatementPage() {
  const { data, loading, error, refetch } = useData(() => api.statement());

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const rows = (data as Array<{
    transaction_date: string; transaction_type: string;
    transaction_statement: string; semester_name: string;
    debit: string; credit: string; balance: string; currency_name: string;
  }> | null) ?? [];

  const totalDebit = rows[rows.length - 1]?.balance ?? "—";

  return (
    <div className="space-y-5 fade-in">
      <SectionTitle>كشف الحساب المالي</SectionTitle>

      <div className="grid grid-cols-2 gap-4">
        <Card className="!p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">عدد الحركات</p>
          <p className="text-2xl font-bold text-gray-800">{rows.length}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">الرصيد الحالي</p>
          <p className="text-lg font-bold text-red-500">{totalDebit}</p>
        </Card>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">البيان</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">التاريخ</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">مدين</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">دائن</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs text-gray-800">{r.transaction_statement}</p>
                    <p className="text-xs text-gray-400">{r.semester_name}</p>
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-gray-500">{r.transaction_date}</td>
                  <td className="px-3 py-3 text-center text-xs text-red-500 font-medium">{r.debit !== "0" ? r.debit : "—"}</td>
                  <td className="px-3 py-3 text-center text-xs text-emerald-600 font-medium">{r.credit !== "0" ? r.credit : "—"}</td>
                  <td className="px-3 py-3 text-center text-xs text-gray-700 font-semibold">{r.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Window One (طلبات الطالب) ────────────────────────────────────────────────

function WindowOnePage() {
  const { data, loading, error, refetch } = useData(() => api.windowOne());

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const d = data as WindowOneData | null;
  const requests = d?.requests ?? [];

  function statusIcon(status: string) {
    const s = status?.toLowerCase() ?? "";
    if (s.includes("قبل") || s.includes("موافق") || s.includes("مكتمل"))
      return <CheckCircle size={15} className="text-emerald-500" />;
    if (s.includes("رفض") || s.includes("ملغ"))
      return <XCircle size={15} className="text-red-400" />;
    return <Clock size={15} className="text-amber-400" />;
  }

  function statusBadge(status: string, color?: string) {
    const base = "text-xs font-semibold px-2.5 py-1 rounded-full";
    if (color === "success" || status?.toLowerCase().includes("موافق") || status?.toLowerCase().includes("مكتمل"))
      return `${base} bg-emerald-50 text-emerald-700`;
    if (color === "danger" || status?.toLowerCase().includes("رفض"))
      return `${base} bg-red-50 text-red-600`;
    return `${base} bg-amber-50 text-amber-700`;
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <SectionTitle>طلبات الطالب</SectionTitle>
        {d?.semester_name && (
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{d.semester_name}</span>
        )}
      </div>

      {requests.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <Inbox size={40} className="opacity-40" />
            <p className="text-sm">لا توجد طلبات مسجّلة لهذا الفصل</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r, i) => (
            <Card key={r.id ?? i} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">{statusIcon(r.status)}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800 leading-snug">{r.request_type ?? r.request_category}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.request_category}</p>
                    {r.semester_name && (
                      <p className="text-xs text-gray-400 mt-0.5">{r.semester_name}</p>
                    )}
                    {r.notes && (
                      <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2 py-1">{r.notes}</p>
                    )}
                    {r.response && (
                      <p className="text-xs text-emerald-700 mt-1.5 bg-emerald-50 rounded-lg px-2 py-1">{r.response}</p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className={statusBadge(r.status, r.status_color)}>{r.status}</span>
                  {r.created_at && (
                    <span className="text-xs text-gray-300">{r.created_at}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {d?.request_categories && Object.keys(d.request_categories).length > 0 && (
        <Card>
          <SectionTitle>فئات الطلبات المتاحة</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {Object.values(d.request_categories).map((cat, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

function SettingsPage() {
  const { data, loading, error, refetch } = useData(() => api.settings());

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const s = data as {
    email: string | null; mobile: string | null; verify_email: boolean;
    verify_mobile: boolean; military_zone: string | null; military_num: string | null;
    is_male: boolean;
  } | null;

  return (
    <div className="space-y-5 fade-in">
      <SectionTitle>الإعدادات الشخصية</SectionTitle>
      <Card>
        <SectionTitle>معلومات التواصل</SectionTitle>
        <InfoRow label="البريد الإلكتروني" value={s?.email ?? "—"} />
        <InfoRow label="حالة البريد" value={s?.verify_email ? "✓ مُفعَّل" : "غير مُفعَّل"} />
        <InfoRow label="الجوال" value={s?.mobile ?? "—"} />
        <InfoRow label="حالة الجوال" value={s?.verify_mobile ? "✓ مُفعَّل" : "غير مُفعَّل"} />
      </Card>
      {(s?.military_zone || s?.military_num) && (
        <Card>
          <SectionTitle>المعلومات العسكرية</SectionTitle>
          <InfoRow label="المنطقة العسكرية" value={s?.military_zone} />
          <InfoRow label="الرقم العسكري" value={s?.military_num} />
        </Card>
      )}
    </div>
  );
}

function AppLayout({
  username, onLogout,
}: {
  username: string;
  onLogout: () => void;
}) {
  const [page, setPage] = useState<Page>("overview");
  const [collapsed, setCollapsed] = useState(true);

  const pageTitle = NAV_ITEMS.find((n) => n.id === page)?.label ?? "";

  return (
    <div className="min-h-screen">
      <Sidebar
        page={page}
        setPage={setPage}
        onLogout={onLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        username={username}
      />

      {/* Main content */}
      <div className="md:mr-[260px] transition-all duration-300">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition md:hidden"
              onClick={() => setCollapsed(false)}
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <h1 className="font-bold text-gray-800 text-base">{pageTitle}</h1>
          </div>
          <div className="text-xs text-gray-400 hidden sm:block">ASPU Student Portal</div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 max-w-5xl mx-auto pb-16">
          {page === "overview"       && <OverviewPage username={username} />}
          {page === "grades"           && <GradesPage />}
          {page === "currentgrades"    && <CurrentGradesPage />}
          {page === "registration"     && <RegistrationPage />}
          {page === "profile"          && <ProfilePage />}
          {page === "financial"        && <FinancialPage />}
          {page === "statement"        && <StatementPage />}
          {page === "schedule"         && <SchedulePage />}
          {page === "courses"          && <CoursesPage />}
          {page === "academicstatus"   && <AcademicStatusPage />}
          {page === "windowone"        && <WindowOnePage />}
          {page === "settings"         && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!getToken());
  const [username, setUsername] = useState<string>("");

  // Verify existing token on mount
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((data) => {
        setUsername(data.username);
        setLoggedIn(true);
      })
      .catch(() => {
        clearToken();
        setLoggedIn(false);
      });
  }, []);

  // Handle session expiry from any page
  useEffect(() => {
    const handler = () => {
      clearToken();
      setLoggedIn(false);
      setUsername("");
    };
    window.addEventListener("session-expired", handler);
    return () => window.removeEventListener("session-expired", handler);
  }, []);

  const handleLogin = () => {
    api
      .me()
      .then((d) => {
        setUsername(d.username);
        setLoggedIn(true);
      })
      .catch(() => {
        // Token was issued but /me failed — clear and stay on login
        clearToken();
        setLoggedIn(false);
      });
  };

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    setUsername("");
  };

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AppLayout username={username} onLogout={handleLogout} />;
}
