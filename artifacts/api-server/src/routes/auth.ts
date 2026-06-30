import { Router, type IRouter, type Request, type Response } from "express";
import { aspuLogin } from "../lib/aspu-client.js";
import {
  createSession,
  getSession,
  deleteSession,
} from "../lib/session-store.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({ message: "يرجى إدخال اسم المستخدم وكلمة المرور" });
    return;
  }

  try {
    const result = await aspuLogin(username.trim(), password);

    if (!result.success) {
      res.status(401).json({ message: result.message });
      return;
    }

    const token = createSession(result.cookies, username.trim());
    logger.info({ username: username.trim() }, "Student logged in");
    res.json({ token });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول، حاول مجدداً" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) deleteSession(token);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ message: "غير مسجّل" });
    return;
  }
  const session = getSession(token);
  if (!session) {
    res.status(401).json({ message: "انتهت صلاحية الجلسة" });
    return;
  }
  res.json({ username: session.username });
});

export default router;
