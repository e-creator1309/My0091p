import { Router, type IRouter, type Request, type Response } from "express";
import { aspuGet, aspuPost, AspuSessionError } from "../lib/aspu-client.js";
import { getSession } from "../lib/session-store.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// Middleware: require valid session token
router.use((req: Request, res: Response, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ message: "يرجى تسجيل الدخول أولاً" });
    return;
  }
  const session = getSession(token);
  if (!session) {
    res.status(401).json({ message: "انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول" });
    return;
  }
  (req as Request & { aspuCookies: Record<string, string> }).aspuCookies =
    session.cookies;
  next();
});

type AuthedRequest = Request & { aspuCookies: Record<string, string> };

function proxyHandler(aspuEndpoint: string) {
  return async (req: Request, res: Response) => {
    const { aspuCookies } = req as AuthedRequest;
    try {
      const data = await aspuGet(aspuCookies, aspuEndpoint);
      res.json(data);
    } catch (err) {
      if (err instanceof AspuSessionError) {
        res.status(401).json({ message: "انتهت صلاحية جلسة ASPU، يرجى تسجيل الدخول مجدداً" });
        return;
      }
      logger.error({ err, endpoint: aspuEndpoint }, "ASPU proxy error");
      res.status(502).json({ message: "تعذّر الوصول إلى خادم الجامعة" });
    }
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get("/dashboard",    proxyHandler("api/students/dashboard/dashboard"));
router.get("/announcements", proxyHandler("api/students/dashboard/announcements"));

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/profile/personal",  proxyHandler("api/students/profiles/personal"));
router.get("/profile/academic",  proxyHandler("api/students/profiles/academic"));
router.get("/profile/financial", proxyHandler("api/students/profiles/financial"));
router.get("/profile/warnings",  proxyHandler("api/students/profiles/warnings"));
router.get("/profile/statement", proxyHandler("api/students/profiles/statement-account")); // ✅ fixed
router.get("/profile/epayments", proxyHandler("api/students/profiles/e-payments"));       // ✅ fixed
router.get("/profile/banks",     proxyHandler("api/students/profiles/banks"));             // 🆕

// ── Grades / Transcript ───────────────────────────────────────────────────────
router.get("/grades",         proxyHandler("api/students/grades/transcript-semesters"));
router.get("/grades/current", proxyHandler("api/students/grades/transcript-current-semester")); // ✅ fixed (was custom handler)
router.get("/grades/status",  proxyHandler("api/students/grades/status"));                      // 🆕

// ── Schedule ──────────────────────────────────────────────────────────────────
router.get("/schedule/lectures", proxyHandler("api/students/calendar/lectures-table"));
router.get("/schedule/exams",    proxyHandler("api/students/calendar/exam-table"));
router.get("/schedule/calendar", proxyHandler("api/students/calendar/academic-calendar"));
router.get("/schedule/events",   proxyHandler("api/students/calendar/events"));   // 🆕

// ── Registration ──────────────────────────────────────────────────────────────
router.get("/registration/remaining",  proxyHandler("api/students/registration/remaining-courses"));
router.get("/registration/opened",     proxyHandler("api/students/registration/opened-courses"));
router.get("/registration/available",  proxyHandler("api/students/registration/available-courses"));
router.get("/registration/rules",      proxyHandler("api/students/registration/registration-rules")); // ✅ fixed

router.post("/registration/submit", async (req: Request, res: Response) => {
  const { aspuCookies } = req as AuthedRequest;
  try {
    const { courseIds = [], onlyExamIds = [] } = req.body as {
      courseIds: string[];
      onlyExamIds: string[];
    };
    const data = await aspuPost(aspuCookies, "api/students/registration/store-student-queue", {
      course_ids: courseIds,
      only_exam_ids: onlyExamIds,
    });
    res.json(data);
  } catch (err) {
    if (err instanceof AspuSessionError) {
      res.status(401).json({ message: "انتهت صلاحية جلسة ASPU، يرجى تسجيل الدخول مجدداً" });
      return;
    }
    logger.error({ err }, "ASPU registration submit error");
    res.status(502).json({ message: "تعذّر إرسال طلب التسجيل" });
  }
});

// ── Student Requests (نافذة الطالب) ──────────────────────────────────────────
router.get("/window-one", proxyHandler("api/students/window-one/requests")); // 🆕

// ── Settings ──────────────────────────────────────────────────────────────────
router.get("/settings", proxyHandler("api/students/settings/settings")); // ✅ fixed

export default router;
