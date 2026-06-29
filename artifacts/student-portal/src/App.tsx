import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type Page = "login" | "dashboard" | "courses" | "grades" | "schedule" | "announcements";

interface Student {
  name: string;
  id: string;
  major: string;
  year: string;
  gpa: string;
  avatar: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const STUDENT: Student = {
  name: "أحمد محمد السيد",
  id: "2021030045",
  major: "التربية البدنية",
  year: "السنة الثالثة",
  gpa: "3.72",
  avatar: "أ",
};

const COURSES = [
  { code: "PE301", name: "فسيولوجيا الرياضة", credits: 3, instructor: "د. سامي العمر", time: "السبت 8:00 - 9:30", room: "قاعة 201", status: "مسجّل" },
  { code: "PE305", name: "علم الحركة الرياضية", credits: 3, instructor: "د. نادية حسن", time: "الأحد 10:00 - 11:30", room: "قاعة 105", status: "مسجّل" },
  { code: "PE310", name: "التدريب الرياضي", credits: 4, instructor: "أ.د. خالد الزهراني", time: "الاثنين 8:00 - 10:00", room: "الملعب الرئيسي", status: "مسجّل" },
  { code: "PE315", name: "الإصابات الرياضية", credits: 3, instructor: "د. ريم الشمري", time: "الثلاثاء 12:00 - 13:30", room: "مختبر 3", status: "مسجّل" },
  { code: "GE201", name: "اللغة الإنجليزية", credits: 2, instructor: "أ. فاطمة الحربي", time: "الأربعاء 14:00 - 15:30", room: "قاعة 310", status: "مسجّل" },
];

const GRADES = [
  { semester: "الفصل الأول 2023/2024", courses: [
    { name: "علم وظائف الأعضاء", credits: 3, grade: "A", points: 4.0, score: 93 },
    { name: "مناهج البحث العلمي", credits: 3, grade: "A-", points: 3.7, score: 90 },
    { name: "تاريخ الرياضة", credits: 2, grade: "B+", points: 3.3, score: 87 },
    { name: "التربية البدنية التطبيقية", credits: 3, grade: "A", points: 4.0, score: 95 },
    { name: "اللغة الإنجليزية 3", credits: 2, grade: "B", points: 3.0, score: 82 },
  ]},
];

const SCHEDULE = [
  { day: "السبت",    slots: [{ time: "8:00 - 9:30", subject: "فسيولوجيا الرياضة", room: "201", type: "نظري" }, { time: "14:00 - 15:30", subject: "—", room: "", type: "" }] },
  { day: "الأحد",   slots: [{ time: "10:00 - 11:30", subject: "علم الحركة الرياضية", room: "105", type: "نظري" }, { time: "13:00 - 14:30", subject: "الإصابات الرياضية — مختبر", room: "L3", type: "عملي" }] },
  { day: "الاثنين", slots: [{ time: "8:00 - 10:00", subject: "التدريب الرياضي", room: "ملعب", type: "عملي" }] },
  { day: "الثلاثاء",slots: [{ time: "12:00 - 13:30", subject: "الإصابات الرياضية", room: "L3", type: "نظري" }] },
  { day: "الأربعاء",slots: [{ time: "14:00 - 15:30", subject: "اللغة الإنجليزية", room: "310", type: "نظري" }] },
];

const ANNOUNCEMENTS = [
  { id: 1, title: "موعد تسجيل المقررات للفصل القادم", date: "2026-06-25", category: "تسجيل", urgent: true, body: "يُذكر جميع الطلاب بأن تسجيل المقررات للفصل الثاني 2025/2026 سيبدأ يوم الأحد الموافق 6 يوليو 2026. يُرجى مراجعة الخطة الدراسية والتواصل مع المرشد الأكاديمي قبل التسجيل." },
  { id: 2, title: "الجدول النهائي للاختبارات", date: "2026-06-20", category: "اختبارات", urgent: false, body: "تم نشر الجدول النهائي للاختبارات النهائية للفصل الأول. يمكن الاطلاع عليه من خلال بوابة الطالب أو من لوحة الإعلانات الرئيسية في المبنى الإداري." },
  { id: 3, title: "ورشة عمل: التغذية الرياضية", date: "2026-06-18", category: "فعاليات", urgent: false, body: "تدعوكم عمادة شؤون الطلاب إلى حضور ورشة العمل المتخصصة في التغذية الرياضية التي ستُعقد يوم الخميس 2 يوليو 2026 في قاعة المؤتمرات الكبرى." },
  { id: 4, title: "تعليمات الغياب والحضور", date: "2026-06-10", category: "أكاديمي", urgent: false, body: "يُذكر الطلاب بأن نسبة الغياب المسموح بها هي 25% من إجمالي المحاضرات. الطلاب الذين تتجاوز نسبة غيابهم هذه الحد المسموح به سيُحرمون من الاختبار النهائي." },
];

// ── Utility ──────────────────────────────────────────────────────────────────

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "#1a8c5a";
  if (grade.startsWith("B")) return "#2d6cc0";
  if (grade.startsWith("C")) return "#c8973a";
  return "#c0392b";
}

function categoryColor(cat: string) {
  const map: Record<string, string> = { تسجيل: "#2d6cc0", اختبارات: "#c0392b", فعاليات: "#1a8c5a", أكاديمي: "#c8973a" };
  return map[cat] ?? "#5a6378";
}

// ── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!id || !pass) { setError("يُرجى إدخال رقم الطالب وكلمة المرور"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1000);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f2b5a 0%, #1a4b8c 50%, #1e5fa8 100%)", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 80, height: 80, background: "rgba(255,255,255,0.1)", border: "3px solid rgba(200,151,58,0.8)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", backdropFilter: "blur(8px)" }}>
            <span style={{ fontSize: 32, color: "#c8973a" }}>🎓</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>بوابة الطالب</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>الجامعة الرياضية العربية ASPU</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", color: "#1a1f2e", fontWeight: 600 }}>تسجيل الدخول</h2>
          <form onSubmit={handle}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#5a6378", marginBottom: "0.4rem", fontWeight: 500 }}>رقم الطالب</label>
              <input value={id} onChange={e => setId(e.target.value)} placeholder="مثال: 2021030045" style={{ width: "100%", padding: "0.65rem 0.9rem", border: "1.5px solid #dde3ee", borderRadius: 8, fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border 0.2s" }} onFocus={e => (e.target.style.border = "1.5px solid #2d6cc0")} onBlur={e => (e.target.style.border = "1.5px solid #dde3ee")} />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#5a6378", marginBottom: "0.4rem", fontWeight: 500 }}>كلمة المرور</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "0.65rem 0.9rem", border: "1.5px solid #dde3ee", borderRadius: 8, fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border 0.2s" }} onFocus={e => (e.target.style.border = "1.5px solid #2d6cc0")} onBlur={e => (e.target.style.border = "1.5px solid #dde3ee")} />
            </div>
            {error && <p style={{ color: "#c0392b", fontSize: "0.83rem", margin: "0 0 1rem", background: "#fff0ee", padding: "0.5rem 0.75rem", borderRadius: 6 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.75rem", background: loading ? "#8baed4" : "#1a4b8c", color: "#fff", border: "none", borderRadius: 8, fontSize: "1rem", fontWeight: 600, cursor: loading ? "default" : "pointer", transition: "background 0.2s" }}>
              {loading ? "جاري تسجيل الدخول..." : "دخول"}
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#5a6378", marginTop: "1rem", marginBottom: 0 }}>
            نسيت كلمة المرور؟ <a href="#" style={{ color: "#2d6cc0", textDecoration: "none" }}>استعادة الحساب</a>
          </p>
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", fontSize: "0.75rem", marginTop: "1.5rem" }}>
          © 2024 ASPU — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard",      label: "الرئيسية",        icon: "🏠" },
  { id: "courses",        label: "مقرراتي",          icon: "📚" },
  { id: "grades",         label: "الدرجات",          icon: "📊" },
  { id: "schedule",       label: "الجدول الدراسي",   icon: "📅" },
  { id: "announcements",  label: "الإعلانات",        icon: "📢" },
];

function Sidebar({ page, onNav, onLogout, open, onClose }: { page: Page; onNav: (p: Page) => void; onLogout: () => void; open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Overlay on mobile */}
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 99, display: "block" }} />}

      <aside style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 240,
        background: "linear-gradient(180deg, #0f2b5a 0%, #1a4b8c 100%)",
        display: "flex", flexDirection: "column", zIndex: 100,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(200,151,58,0.25)", border: "2px solid rgba(200,151,58,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c8973a", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
              {STUDENT.avatar}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ color: "#fff", fontWeight: 600, margin: 0, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{STUDENT.name}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "0.73rem" }}>{STUDENT.id}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem 0", overflowY: "auto" }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => { onNav(item.id as Page); onClose(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.7rem 1.25rem", border: "none", background: page === item.id ? "rgba(255,255,255,0.12)" : "transparent",
                color: page === item.id ? "#fff" : "rgba(255,255,255,0.65)", fontSize: "0.9rem",
                cursor: "pointer", textAlign: "right", borderRight: page === item.id ? "3px solid #c8973a" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              <span style={{ fontWeight: page === item.id ? 600 : 400 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.75rem", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", borderRadius: 8, cursor: "pointer", fontSize: "0.88rem" }}>
            <span>🚪</span> <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────

function Layout({ page, onNav, onLogout, children }: { page: Page; onNav: (p: Page) => void; onLogout: () => void; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageLabel = NAV.find(n => n.id === page)?.label ?? "";

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb" }}>
      <Sidebar page={page} onNav={onNav} onLogout={onLogout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #dde3ee", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem", height: 58, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.3rem", padding: "0.25rem", color: "#1a4b8c" }}>☰</button>
          <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1a1f2e" }}>{pageLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#5a6378" }}>ASPU</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a4b8c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700 }}>{STUDENT.avatar}</div>
        </div>
      </header>

      <main style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem" }}>{icon}</span>
        <span style={{ background: color + "18", color, fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: 20, fontWeight: 600 }}>الفصل الحالي</span>
      </div>
      <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "#1a1f2e" }}>{value}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#5a6378" }}>{label}</p>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      {/* Welcome banner */}
      <div style={{ background: "linear-gradient(135deg, #1a4b8c 0%, #2d6cc0 100%)", borderRadius: 14, padding: "1.5rem", marginBottom: "1.25rem", color: "#fff" }}>
        <p style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", opacity: 0.75 }}>مرحباً بك،</p>
        <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.4rem", fontWeight: 700 }}>{STUDENT.name}</h2>
        <p style={{ margin: 0, fontSize: "0.82rem", opacity: 0.7 }}>{STUDENT.major} · {STUDENT.year}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        <StatCard label="المعدل التراكمي" value={STUDENT.gpa} color="#1a4b8c" icon="🎯" />
        <StatCard label="المقررات المسجّلة" value="5" color="#1a8c5a" icon="📚" />
        <StatCard label="الساعات المعتمدة" value="72" color="#c8973a" icon="⏱️" />
        <StatCard label="الفصل الدراسي" value="5" color="#2d6cc0" icon="📅" />
      </div>

      {/* Quick info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Today's courses */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "#1a1f2e", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>📅</span> محاضرات اليوم
          </h3>
          {SCHEDULE[0].slots.filter(s => s.subject !== "—").map((s, i) => (
            <div key={i} style={{ padding: "0.6rem 0.75rem", background: "#f4f7fb", borderRadius: 8, marginBottom: "0.5rem", borderRight: "3px solid #1a4b8c" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#1a1f2e" }}>{s.subject}</p>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#5a6378" }}>{s.time} · قاعة {s.room}</p>
            </div>
          ))}
        </div>

        {/* Latest announcement */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "#1a1f2e", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>📢</span> آخر الإعلانات
          </h3>
          {ANNOUNCEMENTS.slice(0, 2).map(a => (
            <div key={a.id} style={{ padding: "0.6rem 0.75rem", background: a.urgent ? "#fff8f0" : "#f4f7fb", borderRadius: 8, marginBottom: "0.5rem", borderRight: `3px solid ${categoryColor(a.category)}` }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: "#1a1f2e" }}>{a.title}</p>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.73rem", color: "#5a6378" }}>{a.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Courses ───────────────────────────────────────────────────────────────────

function CoursesPage() {
  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, color: "#1a1f2e" }}>مقرراتي المسجّلة</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {COURSES.map(c => (
          <div key={c.code} style={{ background: "#fff", borderRadius: 12, padding: "1.1rem 1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.72rem", background: "#1a4b8c18", color: "#1a4b8c", padding: "0.15rem 0.45rem", borderRadius: 4, fontWeight: 600 }}>{c.code}</span>
                <span style={{ fontSize: "0.72rem", background: "#1a8c5a18", color: "#1a8c5a", padding: "0.15rem 0.45rem", borderRadius: 4 }}>{c.credits} ساعات</span>
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "#1a1f2e" }}>{c.name}</p>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#5a6378" }}>
                {c.instructor} · {c.time} · {c.room}
              </p>
            </div>
            <span style={{ background: "#1a8c5a18", color: "#1a8c5a", fontSize: "0.78rem", padding: "0.2rem 0.6rem", borderRadius: 6, fontWeight: 600 }}>{c.status}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem", background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: "2rem" }}>
        <div><span style={{ color: "#5a6378", fontSize: "0.83rem" }}>إجمالي المقررات</span><p style={{ margin: "0.25rem 0 0", fontWeight: 700, fontSize: "1.2rem", color: "#1a4b8c" }}>5</p></div>
        <div><span style={{ color: "#5a6378", fontSize: "0.83rem" }}>إجمالي الساعات</span><p style={{ margin: "0.25rem 0 0", fontWeight: 700, fontSize: "1.2rem", color: "#1a4b8c" }}>{COURSES.reduce((s, c) => s + c.credits, 0)}</p></div>
      </div>
    </div>
  );
}

// ── Grades ────────────────────────────────────────────────────────────────────

function GradesPage() {
  const sem = GRADES[0];
  const gpa = (sem.courses.reduce((s, c) => s + c.points * c.credits, 0) / sem.courses.reduce((s, c) => s + c.credits, 0)).toFixed(2);
  return (
    <div>
      <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700, color: "#1a1f2e" }}>نتائج الدرجات</h2>
      <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "#5a6378" }}>{sem.semester}</p>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: "1rem" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "#1a4b8c", color: "#fff" }}>
                {["المقرر", "الساعات", "الدرجة", "النقاط", "العلامة %"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sem.courses.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eef1f7", background: i % 2 === 0 ? "#fff" : "#f9fafc" }}>
                  <td style={{ padding: "0.7rem 1rem", fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: "0.7rem 1rem", color: "#5a6378" }}>{c.credits}</td>
                  <td style={{ padding: "0.7rem 1rem" }}>
                    <span style={{ background: gradeColor(c.grade) + "18", color: gradeColor(c.grade), padding: "0.15rem 0.5rem", borderRadius: 5, fontWeight: 700 }}>{c.grade}</span>
                  </td>
                  <td style={{ padding: "0.7rem 1rem", color: "#5a6378" }}>{c.points.toFixed(1)}</td>
                  <td style={{ padding: "0.7rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: 6, background: "#eef1f7", borderRadius: 3, minWidth: 60 }}>
                        <div style={{ width: `${c.score}%`, height: "100%", background: gradeColor(c.grade), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#1a1f2e", minWidth: 28 }}>{c.score}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: "#1a4b8c", color: "#fff", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", gap: "2rem" }}>
        <div><p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.75 }}>معدل الفصل</p><p style={{ margin: "0.25rem 0 0", fontSize: "1.6rem", fontWeight: 700 }}>{gpa}</p></div>
        <div><p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.75 }}>المعدل التراكمي</p><p style={{ margin: "0.25rem 0 0", fontSize: "1.6rem", fontWeight: 700 }}>{STUDENT.gpa}</p></div>
        <div><p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.75 }}>الساعات المنجزة</p><p style={{ margin: "0.25rem 0 0", fontSize: "1.6rem", fontWeight: 700 }}>72</p></div>
      </div>
    </div>
  );
}

// ── Schedule ──────────────────────────────────────────────────────────────────

function SchedulePage() {
  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, color: "#1a1f2e" }}>الجدول الدراسي الأسبوعي</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {SCHEDULE.map(day => (
          <div key={day.day} style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.9rem", color: "#1a4b8c", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>📅</span> {day.day}
            </p>
            {day.slots.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", background: s.subject === "—" ? "#f9fafc" : (s.type === "عملي" ? "#f0fff7" : "#f4f7fb"), borderRadius: 8, marginBottom: "0.4rem", borderRight: `3px solid ${s.type === "عملي" ? "#1a8c5a" : s.subject === "—" ? "#dde3ee" : "#1a4b8c"}` }}>
                <span style={{ fontSize: "0.78rem", color: "#5a6378", minWidth: 80 }}>{s.time}</span>
                <span style={{ fontWeight: s.subject === "—" ? 400 : 600, fontSize: "0.85rem", color: s.subject === "—" ? "#aab0c0" : "#1a1f2e" }}>{s.subject}</span>
                {s.room && <span style={{ marginRight: "auto", fontSize: "0.73rem", color: "#5a6378", background: "#eef1f7", padding: "0.1rem 0.4rem", borderRadius: 4 }}>{s.type} · {s.room}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Announcements ─────────────────────────────────────────────────────────────

function AnnouncementsPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const ann = selected !== null ? ANNOUNCEMENTS.find(a => a.id === selected) : null;

  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, color: "#1a1f2e" }}>الإعلانات</h2>

      {ann && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", marginBottom: "1rem", border: "1px solid #dde3ee" }}>
          <button onClick={() => setSelected(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "#2d6cc0", fontSize: "0.83rem", padding: 0, marginBottom: "0.75rem" }}>← رجوع</button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ background: categoryColor(ann.category) + "18", color: categoryColor(ann.category), fontSize: "0.73rem", padding: "0.15rem 0.45rem", borderRadius: 4, fontWeight: 600 }}>{ann.category}</span>
            {ann.urgent && <span style={{ background: "#c0392b18", color: "#c0392b", fontSize: "0.73rem", padding: "0.15rem 0.45rem", borderRadius: 4, fontWeight: 600 }}>عاجل</span>}
          </div>
          <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem", color: "#1a1f2e" }}>{ann.title}</h3>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "#5a6378" }}>{ann.date}</p>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#1a1f2e", lineHeight: 1.8 }}>{ann.body}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {ANNOUNCEMENTS.map(a => (
          <div key={a.id} onClick={() => setSelected(a.id)} style={{ background: a.urgent ? "#fff8f0" : "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer", borderRight: `4px solid ${categoryColor(a.category)}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                <span style={{ background: categoryColor(a.category) + "18", color: categoryColor(a.category), fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: 4, fontWeight: 600 }}>{a.category}</span>
                {a.urgent && <span style={{ background: "#c0392b18", color: "#c0392b", fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: 4, fontWeight: 600 }}>عاجل</span>}
              </div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1a1f2e" }}>{a.title}</p>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#5a6378" }}>{a.date}</p>
            </div>
            <span style={{ color: "#aab0c0", fontSize: "1.1rem", flexShrink: 0 }}>←</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("login");

  if (page === "login") return <LoginPage onLogin={() => setPage("dashboard")} />;

  function renderPage() {
    switch (page) {
      case "dashboard":      return <Dashboard />;
      case "courses":        return <CoursesPage />;
      case "grades":         return <GradesPage />;
      case "schedule":       return <SchedulePage />;
      case "announcements":  return <AnnouncementsPage />;
      default:               return <Dashboard />;
    }
  }

  return (
    <Layout page={page} onNav={setPage} onLogout={() => setPage("login")}>
      {renderPage()}
    </Layout>
  );
}
