import { Download, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  LayoutDashboard, BookOpen, GraduationCap, Calendar,
  Wallet, ListChecks, LogOut, Menu, X, ChevronDown,
  User, AlertCircle, Loader2, RefreshCw, Bell, BellOff, BellRing,
  ClipboardList, CreditCard, Settings, TrendingUp, ChevronRight,
  Inbox, CheckCircle, Clock, XCircle,
} from "lucide-react";
import {
  api, login, logout, getToken, setToken, clearToken,
  type PersonalProfile, type AcademicProfile, type FinancialProfile,
  type GradesData, type Semester, type RemainingCourses,
  type ScheduleData, type ExamData, type WindowOneData, type LectureSlot,
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
const REMEMBER_PASS = "aspu_remembered_password";
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const savedUser = localStorage.getItem(REMEMBER_KEY) ?? "";
  const savedPass = (() => {
    try { const e = localStorage.getItem(REMEMBER_PASS); return e ? atob(e) : ""; }
    catch { return ""; }
  })();
  const [username, setUsername] = useState(savedUser);
  const [password, setPassword] = useState(savedPass);
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
        localStorage.setItem(REMEMBER_KEY,  username.trim());
        localStorage.setItem(REMEMBER_PASS, btoa(password));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_PASS);
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
        <div className="text-center mt-6 space-y-1">
          <p className="text-emerald-200/70 text-xs">المطور: عماد الدين النسمة</p>
          <p className="text-emerald-100/50 text-xs">طالب علوم إدارية — اختصاص موارد بشرية</p>
        </div>
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
  page, setPage, onLogout, collapsed, setCollapsed, username, installPrompt, onInstall,
}: {
  page: Page;
  setPage: (p: Page) => void;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  username: string;
  installPrompt: boolean;
  onInstall: () => void;
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

        {/* Install + Logout */}
        <div className="p-3 border-t border-white/10 space-y-1">
          {installPrompt && (
            <button
              onClick={onInstall}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-200 bg-white/10 hover:bg-white/20 transition"
            >
              <Download size={18} className="shrink-0" />
              {!collapsed && <span>تثبيت التطبيق</span>}
            </button>
          )}
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

// ─── Notifications ────────────────────────────────────────────────────────────

function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const request = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);
  const send = useCallback((title: string, body: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const n = new Notification(title, {
      body,
      icon: "/My0091p/icon-192.png",
      badge: "/My0091p/icon-192.png",
      dir: "rtl",
      lang: "ar",
    });
    n.onclick = () => { window.focus(); n.close(); };
  }, []);
  return { permission, request, send };
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function OverviewPage({ username }: { username: string }) {
  const { data: dash, loading, error, refetch } = useData(() => api.dashboard());
  const { data: academic } = useData(() => api.academic());
  const { data: announcements } = useData(() => api.announcements());
  const { permission, request } = useNotifications();

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const acad = academic as AcademicProfile | null;
  const anns = (announcements ?? []) as Array<{ title: string; body: string; date: string }>;
  const dashData = dash as { first_name?: string } | null;

  return (
    <div className="space-y-5 fade-in">
      {/* Notification permission banner */}
      {permission === "default" && (
        <button
          onClick={request}
          className="w-full flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-right hover:bg-emerald-100 transition"
        >
          <span className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <BellRing size={18} className="text-emerald-600" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">فعّل إشعارات العلامات</p>
            <p className="text-xs text-emerald-600 mt-0.5">سنخبرك فور صدور علامة جديدة</p>
          </div>
          <span className="text-xs text-emerald-500 shrink-0">اضغط هنا ←</span>
        </button>
      )}
      {permission === "denied" && (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
          <BellOff size={16} className="text-gray-400 shrink-0" />
          <p className="text-xs text-gray-400">الإشعارات محجوبة — فعّلها من إعدادات المتصفح لتلقي تنبيهات العلامات</p>
        </div>
      )}
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


// ─── Schedule helpers ─────────────────────────────────────────────────────────

const DAY_MAP: Record<string, string> = {
  sat: 'السبت', sun: 'الأحد', mon: 'الاثنين',
  tus: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة',
};
const DAY_KEYS = ['sat','sun','mon','tus','wed','thu','fri'] as const;
type DayKey = typeof DAY_KEYS[number];

interface CourseRow {
  course_id: string; course_name: string; course_code: string; course_credits: string;
  sat?: string; sun?: string; mon?: string; tus?: string; wed?: string; thu?: string; fri?: string;
  t_instructor_name?: string | null; p_instructor_name?: string | null;
}

interface ParsedSlot {
  type: 'T' | 'P';
  time: string;
  room: string;
  course: CourseRow;
}

/** Parses ASPU's HTML-packed day cell: "P 10:00-11:00<br> قاعة 15 - 27T 08:00-10:00<br> قاعة 15 - 27" */
function parseDaySlots(raw: string, course: CourseRow): ParsedSlot[] {
  if (!raw?.trim()) return [];
  const out: ParsedSlot[] = [];
  // Each slot: (T|P) HH:MM-HH:MM<br> ROOM  — room ends at next T/P digit or string end
  const re = /([TP]) (d{1,2}:d{2}-d{1,2}:d{2})<br>s*(.*?)(?=s*[TP] d|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out.push({ type: m[1] as 'T'|'P', time: m[2], room: m[3].trim(), course });
  }
  return out;
}

function buildDaySlots(courseList: CourseRow[], instructorMap: Record<string, CourseRow>): Record<string, ParsedSlot[]> {
  const byDay: Record<string, ParsedSlot[]> = {};
  for (const course of courseList) {
    const inst = instructorMap[course.course_id] ?? {};
    const enriched: CourseRow = { ...course, t_instructor_name: inst.t_instructor_name, p_instructor_name: inst.p_instructor_name };
    for (const dayKey of DAY_KEYS) {
      const slots = parseDaySlots((course as Record<string,string>)[dayKey] ?? '', enriched);
      if (slots.length > 0) {
        if (!byDay[dayKey]) byDay[dayKey] = [];
        byDay[dayKey].push(...slots);
      }
    }
  }
  // Sort each day's slots by start time
  for (const k of Object.keys(byDay)) {
    byDay[k].sort((a, b) => a.time.localeCompare(b.time));
  }
  return byDay;
}

function SchedulePage() {
  const { data: lec, loading: ll, error: el, refetch: rl } = useData(() => api.lectures());
  const { data: exm, loading: le, error: ee, refetch: re } = useData(() => api.exams());

  if (ll || le) return <LoadingBlock />;

  const scheduleRaw = lec as { courses?: CourseRow[]; instructors?: CourseRow[] } | null;
  const courseList = (scheduleRaw?.courses ?? []) as CourseRow[];
  const instructorMap: Record<string, CourseRow> = {};
  for (const inst of (scheduleRaw?.instructors ?? []) as CourseRow[]) {
    instructorMap[inst.course_id] = inst;
  }

  const byDay = buildDaySlots(courseList, instructorMap);
  const activeDays = DAY_KEYS.filter(d => (byDay[d]?.length ?? 0) > 0);

  const exams = exm as ExamData | null;
  const examList = (exams?.exams ?? []) as Array<{
    course_name?: string; exam_date?: string; exam_time?: string;
    room_name?: string; seat_no?: string; day_name?: string;
  }>;

  return (
    <div className="space-y-5 fade-in">
      <Card>
        <SectionTitle>جدول المحاضرات</SectionTitle>
        {el ? (
          <ErrorBlock message={el} onRetry={rl} />
        ) : activeDays.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-gray-300 gap-2">
            <Calendar size={32} />
            <p className="text-sm text-gray-400">الجدول غير متاح حالياً أو الفصل منتهٍ</p>
          </div>
        ) : (
          <div className="space-y-5">
            {activeDays.map(dayKey => (
              <div key={dayKey}>
                <div className="mb-3">
                  <span className="text-xs font-bold text-[var(--aspu-green)] bg-[var(--aspu-green-light)] px-3 py-1 rounded-full">
                    {DAY_MAP[dayKey]}
                  </span>
                </div>
                <div className="space-y-2">
                  {byDay[dayKey].map((slot, i) => {
                    const isTheory = slot.type === 'T';
                    const instructor = isTheory ? slot.course.t_instructor_name : slot.course.p_instructor_name;
                    return (
                      <div key={i}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl px-4 py-3 border-r-4"
                        style={{
                          borderColor: isTheory ? 'var(--aspu-green)' : '#f59e0b',
                          background: isTheory ? '#f0fdf4' : '#fffbeb',
                        }}
                      >
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${isTheory ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isTheory ? 'نظري' : 'عملي'}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-700 shrink-0 ltr min-w-[110px]">
                          {slot.time}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 leading-snug">{slot.course.course_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {slot.course.course_code} · {slot.course.course_credits} ساعة
                          </p>
                        </div>
                        {instructor && (
                          <p className="text-xs text-gray-500 shrink-0">{instructor}</p>
                        )}
                        {slot.room && (
                          <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg shrink-0">
                            {slot.room}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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
  const { send: sendNotif } = useNotifications();

  useEffect(() => {
    if (!data) return;
    const SNAP_KEY = "aspu_grades_v1";
    const snapshot = JSON.stringify(data);
    const prev = localStorage.getItem(SNAP_KEY);
    if (prev && prev !== snapshot) {
      try {
        type CourseEntry = { course_name: string; tests?: { final_mark?: string | null } | null; final_mark?: string | null };
        const prevCourses = (JSON.parse(prev) as { courses?: CourseEntry[] }).courses ?? [];
        const newCourses  = (data as { courses?: CourseEntry[] }).courses ?? [];
        const changed: string[] = [];
        newCourses.forEach((nc, i) => {
          const pc = prevCourses[i];
          const n = nc.tests?.final_mark ?? nc.final_mark;
          const o = pc?.tests?.final_mark ?? pc?.final_mark;
          if (n && n !== o) changed.push(nc.course_name);
        });
        if (changed.length > 0) {
          sendNotif(
            "🎓 علامة جديدة — بوابة ASPU",
            changed.length === 1 ? `صدرت علامة: ${changed[0]}` : `صدرت ${changed.length} علامات جديدة`
          );
        }
      } catch { /* ignore */ }
    }
    localStorage.setItem(SNAP_KEY, snapshot);
  }, [data, sendNotif]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  const d = data as { courses: unknown[]; semester_name: string; max_tests_count: number } | null;
  const maxTests = d?.max_tests_count ?? 0;
  const courses = (d?.courses ?? []) as Array<{
    course_name: string; course_code: string; course_credits: string;
    final_mark: string | null; grade: string | null;
    tests: {
      archive_fixed_mark: string | null; archive_final_mark: string | null;
      final_mark: string | null; grade: string | null;
      archive_total_mark?: string | null;
      [key: string]: string | null | number | undefined;
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
                <th className="text-right px-4 py-3 font-semibold text-gray-600 min-w-[160px]">المقرر</th>
                {Array.from({ length: maxTests }, (_, i) => (
                  <th key={i} className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">
                    اختبار {i + 1}
                  </th>
                ))}
                <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">أعمال فصل</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">نهائي</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">المجموع</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">التقدير</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => {
                const totalMark = (c.tests?.archive_total_mark ?? c.tests?.final_mark ?? c.final_mark) as string | null;
                const gradeVal = (c.tests?.grade ?? c.grade) as string | null;
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 leading-snug">{c.course_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.course_code} · {c.course_credits} ساعة</p>
                    </td>
                    {Array.from({ length: maxTests }, (_, ti) => {
                      const key = "archive_test_" + (ti + 1);
                      const val = c.tests ? (c.tests[key] as string | null) : null;
                      return (
                        <td key={ti} className="px-3 py-3 text-center whitespace-nowrap">
                          <span className="font-medium text-gray-700 text-xs">{val ?? "—"}</span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="font-medium text-gray-700 text-xs">{c.tests?.archive_fixed_mark ?? "—"}</span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="font-medium text-gray-700 text-xs">{c.tests?.archive_final_mark ?? "—"}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {totalMark ? (
                        <span className={"font-bold text-sm " + gradePercent(totalMark)}>{totalMark}</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {gradeVal ? (
                        <span className={"text-xs font-bold px-2 py-1 rounded-lg " + gradeClass(gradeVal)}>{gradeVal}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
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
  const { data: lec } = useData(() => api.lectures());
  const { data: academic } = useData(() => api.academic());
  const [selected, setSelected] = useState<Record<string, "study" | "exam">>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showSchedule, setShowSchedule] = useState(false);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  type RegCourse = {
    course_id: string; course_name: string; course_code: string; course_credits: string;
    requirement_type: string; requirement_type_id: string; allow_register: string; allow_exam: string;
    allow_list: string; status_reason: string; is_requestable: string; year_order: string;
  };

  const courses = ((opened as { courses?: unknown[] } | null)?.courses ?? []) as RegCourse[];
  const rulesList = (rules as Array<{ rule: string; value: string }> | null) ?? [];
  const studentYear = parseInt((academic as AcademicProfile | null)?.level_short ?? "3", 10);

  // Enrolled schedule for conflict reference
  const scheduleRaw = lec as { courses?: CourseRow[]; instructors?: CourseRow[] } | null;
  const enrolledList = (scheduleRaw?.courses ?? []) as CourseRow[];
  const instructorMap: Record<string, CourseRow> = {};
  for (const inst of (scheduleRaw?.instructors ?? []) as CourseRow[]) {
    instructorMap[inst.course_id] = inst;
  }
  const enrolledByDay = buildDaySlots(enrolledList, instructorMap);
  const enrolledActiveDays = DAY_KEYS.filter(d => (enrolledByDay[d]?.length ?? 0) > 0);

  // Tabs: all + each requirement_type_id
  const reqTypes = Array.from(new Map(courses.map(c => [c.requirement_type_id, c.requirement_type])).entries());
  const tabCourses = activeTab === "all" ? courses : courses.filter(c => c.requirement_type_id === activeTab);

  const toggle = (id: string, type: "study" | "exam") => {
    setSelected(prev => {
      if (prev[id] === type) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: type };
    });
    setResult(null);
  };

  const selectedCount = Object.keys(selected).length;

  const handleSubmit = async () => {
    setConfirm(false); setSubmitting(true); setResult(null);
    try {
      const courseIds = Object.entries(selected).filter(([,t]) => t === "study").map(([id]) => id);
      const onlyExamIds = Object.entries(selected).filter(([,t]) => t === "exam").map(([id]) => id);
      const res = await api.submitRegistration({ courseIds, onlyExamIds });
      const r = res as { success?: boolean; message?: string; errorMessages?: string[] };
      if (r.success) {
        setResult({ success: true, message: "تم إرسال طلب التسجيل بنجاح ✓" });
        setSelected({}); refetch();
      } else {
        setResult({ success: false, message: r.errorMessages?.join(" | ") ?? r.message ?? "حدث خطأ أثناء التسجيل" });
      }
    } catch (e: unknown) {
      setResult({ success: false, message: e instanceof Error ? e.message : "خطأ في الاتصال" });
    } finally { setSubmitting(false); }
  };

  const getCourseStyle = (c: RegCourse): { border: string; bg: string } => {
    if (selected[c.course_id]) return { border: 'border-blue-300', bg: 'bg-blue-50' };
    if (c.is_requestable !== 'Y') return { border: 'border-red-100', bg: 'bg-red-50/40' };
    if (parseInt(c.year_order, 10) > studentYear) return { border: 'border-amber-200', bg: 'bg-amber-50/40' };
    return { border: 'border-gray-100', bg: 'bg-gray-50' };
  };

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <SectionTitle>تسجيل المقررات</SectionTitle>
        {selectedCount > 0 && (
          <button onClick={() => setConfirm(true)} disabled={submitting}
            className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
            {submitting ? "جاري الإرسال..." : `تسجيل ${selectedCount} مقرر`}
          </button>
        )}
      </div>

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

      {/* Enrolled schedule reference (collapsible) */}
      {enrolledActiveDays.length > 0 && (
        <Card>
          <button onClick={() => setShowSchedule(s => !s)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700">
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-[var(--aspu-green)]" />
              جدولك الحالي (للمقارنة وتجنب التعارض)
            </span>
            <ChevronDown size={16} className={`transition-transform ${showSchedule ? 'rotate-180' : ''}`} />
          </button>
          {showSchedule && (
            <div className="mt-4 space-y-4">
              {enrolledActiveDays.map(dayKey => (
                <div key={dayKey}>
                  <span className="text-xs font-bold text-[var(--aspu-green)] bg-[var(--aspu-green-light)] px-3 py-1 rounded-full">
                    {DAY_MAP[dayKey]}
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {enrolledByDay[dayKey].map((slot, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2"
                        style={{ background: slot.type === 'T' ? '#f0fdf4' : '#fffbeb' }}>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${slot.type === 'T' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {slot.type === 'T' ? 'نظري' : 'عملي'}
                        </span>
                        <span className="text-xs font-mono text-gray-600 ltr">{slot.time}</span>
                        <span className="text-xs text-gray-700 font-medium flex-1 truncate">{slot.course.course_name}</span>
                        {slot.room && <span className="text-xs text-gray-400 shrink-0">{slot.room}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></span>يمكن التسجيل</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></span>مقرر سنة متقدمة</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-50 border border-red-200"></span>لا يمكن التسجيل</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></span>محدد</span>
      </div>

      {/* Tabs by requirement type */}
      {reqTypes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setActiveTab("all")}
            className={`text-xs font-medium px-3 py-1.5 rounded-full shrink-0 transition ${activeTab === "all" ? "bg-[var(--aspu-green)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            الكل ({courses.length})
          </button>
          {reqTypes.map(([id, name]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full shrink-0 transition ${activeTab === id ? "bg-[var(--aspu-green)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {name} ({courses.filter(c => c.requirement_type_id === id).length})
            </button>
          ))}
        </div>
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
              <button onClick={handleSubmit} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors">نعم، سجّل</button>
              <button onClick={() => setConfirm(false)} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Courses list */}
      <div className="space-y-2">
        {tabCourses.map(c => {
          const style = getCourseStyle(c);
          const sel = selected[c.course_id];
          const yearNum = parseInt(c.year_order, 10);
          const isAdvanced = yearNum > studentYear;
          const canReg = c.is_requestable === 'Y';
          return (
            <div key={c.course_id}
              className={`border rounded-xl px-4 py-3 transition-colors ${style.border} ${style.bg}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-medium text-sm text-gray-800 leading-snug">{c.course_name}</p>
                    {isAdvanced && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">
                        سنة {yearNum}
                      </span>
                    )}
                    {!canReg && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded shrink-0">
                        محظور
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{c.course_code} · {c.requirement_type} · {c.course_credits} ساعة</p>
                  {!canReg && c.status_reason && (
                    <p className="text-xs text-red-500 mt-1">{c.status_reason}</p>
                  )}
                </div>
                {canReg && (
                  <div className="flex gap-1 shrink-0">
                    {c.allow_register === 'Y' && (
                      <button onClick={() => toggle(c.course_id, "study")}
                        className={`text-xs px-2 py-1 rounded-lg font-medium border transition-colors ${sel === "study" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                        دراسة
                      </button>
                    )}
                    {c.allow_exam === 'Y' && (
                      <button onClick={() => toggle(c.course_id, "exam")}
                        className={`text-xs px-2 py-1 rounded-lg font-medium border transition-colors ${sel === "exam" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"}`}>
                        امتحان
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (!deferredPrompt) return;
    (deferredPrompt as BeforeInstallPromptEvent).prompt();
    (deferredPrompt as BeforeInstallPromptEvent).userChoice.then(() => setDeferredPrompt(null));
  };

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
        installPrompt={!!deferredPrompt}
        onInstall={handleInstall}
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
