import { Router, type IRouter, type Request, type Response } from "express";
import { aspuGet, AspuSessionError } from "../lib/aspu-client.js";
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
  // Attach session cookies to req for use in handlers
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

// Dashboard overview
router.get("/dashboard", proxyHandler("api/students/dashboard/dashboard"));

// Announcements
router.get("/announcements", proxyHandler("api/students/dashboard/announcements"));

// Profile sections
router.get("/profile/personal", proxyHandler("api/students/profiles/personal"));
router.get("/profile/academic", proxyHandler("api/students/profiles/academic"));
router.get("/profile/financial", proxyHandler("api/students/profiles/financial"));
router.get("/profile/warnings", proxyHandler("api/students/profiles/warnings"));

// Grades / transcript
router.get("/grades", proxyHandler("api/students/grades/transcript-semesters"));

// Schedule: lectures + exams + academic calendar
router.get("/schedule/lectures", proxyHandler("api/students/calendar/lectures-table"));
router.get("/schedule/exams", proxyHandler("api/students/calendar/exam-table"));
router.get("/schedule/calendar", proxyHandler("api/students/calendar/academic-calendar"));

// Courses: remaining to graduation
router.get("/courses/remaining", proxyHandler("api/students/registration/remaining-courses"));

// Menu links (used by frontend to know what's available)
router.get("/menu", proxyHandler("api/menu/links"));

export default router;
