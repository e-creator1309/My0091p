const ASPU_BASE = "http://my.aspu.edu.sy";

const ALLOWED_ORIGINS = [
  "https://e-creator1309.github.io",
  "https://info-fetcher--wereaksle08.replit.app",
];

const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "ar",
};

// ── Cookie helpers ────────────────────────────────────────────────────────────

function parseCookies(headers) {
  // CF Workers: getAll('set-cookie') is the reliable method; getSetCookie() added later
  let raw = [];
  if (typeof headers.getSetCookie === 'function') {
    raw = headers.getSetCookie();
  } else if (typeof headers.getAll === 'function') {
    raw = headers.getAll('set-cookie');
  } else {
    // iterate as last resort
    for (const [k, v] of headers.entries()) {
      if (k.toLowerCase() === 'set-cookie') raw.push(v);
    }
  }
  const cookies = {};
  for (const header of raw) {
    const semi = header.indexOf(";");
    const pair = semi >= 0 ? header.slice(0, semi) : header;
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    cookies[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return cookies;
}

function cookiesToHeader(cookies) {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

// ── Token helpers (stateless session) ─────────────────────────────────────────
// Token = base64( JSON { cookies: {...}, username: "..." } )

function encodeToken(cookies, username) {
  return btoa(JSON.stringify({ cookies, username }));
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

// ── ASPU login ────────────────────────────────────────────────────────────────

async function aspuLogin(username, password) {
  // Step 1: GET the login page to grab CSRF token + initial session cookie
  // cf.cacheEverything:false ensures CF edge doesn't serve a stale CSRF token
  const pageRes = await fetch(`${ASPU_BASE}/en/login`, {
    headers: { ...COMMON_HEADERS, Accept: "text/html", "Cache-Control": "no-cache" },
    cf: { cacheEverything: false },
  });
  const html = await pageRes.text();
  const csrfMatch = html.match(/csrf-token"\s+content="([^"]+)"/);
  if (!csrfMatch) throw new Error("CSRF token not found on ASPU login page");
  const csrf = csrfMatch[1];
  const initCookies = parseCookies(pageRes.headers);

  // Step 2: POST credentials
  const loginRes = await fetch(`${ASPU_BASE}/en/login`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRF-TOKEN": csrf,
      Referer: `${ASPU_BASE}/en/login`,
      Cookie: cookiesToHeader(initCookies),
    },
    body: JSON.stringify({ username, password, remember: true }),
  });

  let data;
  try {
    data = await loginRes.json();
  } catch {
    return { success: false, message: "استجابة غير متوقعة من خادم الجامعة" };
  }

  if (!data.redirectTo) {
    return {
      success: false,
      message: data.message ?? "اسم المستخدم أو كلمة المرور غير صحيحة",
    };
  }

  const newCookies = parseCookies(loginRes.headers);
  return { success: true, cookies: { ...initCookies, ...newCookies } };
}

// ── ASPU GET / POST ──────────────────────────────────────────────────────────

async function aspuGet(cookies, endpoint) {
  const res = await fetch(`${ASPU_BASE}/${endpoint}`, {
    headers: {
      ...COMMON_HEADERS,
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookiesToHeader(cookies),
    },
  });
  if (res.status === 401 || res.status === 403) {
    const err = new Error("انتهت صلاحية جلسة ASPU، يرجى تسجيل الدخول مجدداً");
    err.statusCode = 401;
    throw err;
  }
  // 404/5xx = not available for this student/semester — return empty gracefully
  if (res.status === 404 || res.status >= 500) return {};
  if (!res.ok) {
    const err = new Error(`ASPU error ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function aspuPost(cookies, endpoint, body) {
  const res = await fetch(`${ASPU_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookiesToHeader(cookies),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401 || res.status === 403) {
    const err = new Error("انتهت صلاحية جلسة ASPU، يرجى تسجيل الدخول مجدداً");
    err.statusCode = 401;
    throw err;
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// ── CORS ─────────────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

// ── Route table (GET endpoints) ───────────────────────────────────────────────

const GET_ROUTES = {
  // Dashboard
  "/api/student/dashboard":               "api/students/dashboard/dashboard",
  "/api/student/announcements":           "api/students/dashboard/announcements",

  // Profile
  "/api/student/profile/personal":        "api/students/profiles/personal",
  "/api/student/profile/academic":        "api/students/profiles/academic",
  "/api/student/profile/financial":       "api/students/profiles/financial",
  "/api/student/profile/warnings":        "api/students/profiles/warnings",
  "/api/student/profile/statement":       "api/students/profiles/statement-account",  // ✅ fixed
  "/api/student/profile/epayments":       "api/students/profiles/e-payments",         // ✅ fixed
  "/api/student/profile/banks":           "api/students/profiles/banks",              // 🆕

  // Grades
  "/api/student/grades":                  "api/students/grades/transcript-semesters",
  "/api/student/grades/current":          "api/students/grades/transcript-current-semester", // ✅ fixed (real endpoint)
  "/api/student/grades/status":           "api/students/grades/status",

  // Schedule
  "/api/student/schedule/lectures":       "api/students/calendar/lectures-table",
  "/api/student/schedule/exams":          "api/students/calendar/exam-table",
  "/api/student/schedule/calendar":       "api/students/calendar/academic-calendar",
  "/api/student/schedule/events":         "api/students/calendar/events",             // 🆕

  // Registration
  "/api/student/registration/remaining":  "api/students/registration/remaining-courses",
  "/api/student/registration/opened":     "api/students/registration/opened-courses",
  "/api/student/registration/available":  "api/students/registration/available-courses",
  "/api/student/registration/rules":      "api/students/registration/registration-rules", // ✅ fixed

  // Student requests (نافذة الطالب)
  "/api/student/window-one":              "api/students/window-one/requests",         // 🆕

  // Settings
  "/api/student/settings":               "api/students/settings/settings",            // ✅ fixed

  // Legacy aliases
  "/api/student/courses/remaining":       "api/students/registration/remaining-courses",
  "/api/student/menu":                    "api/menu/links",
};

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;
    const origin = request.headers.get("Origin") ?? ALLOWED_ORIGINS[0];

    // ── Preflight ───────────────────────────────────────────────────────────
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── Health check ────────────────────────────────────────────────────────
    if (path === "/api/healthz" || path === "/") {
      return json({ status: "ok", service: "aspu-api" }, 200, origin);
    }

    // ── POST /api/auth/login ─────────────────────────────────────────────────
    if (path === "/api/auth/login" && method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ message: "طلب غير صالح" }, 400, origin);
      }
      const { username, password } = body;
      if (!username || !password) {
        return json({ message: "يرجى إدخال اسم المستخدم وكلمة المرور" }, 400, origin);
      }
      try {
        const result = await aspuLogin(username.trim(), password);
        if (!result.success) {
          return json({ message: result.message }, 401, origin);
        }
        const token = encodeToken(result.cookies, username.trim());
        return json({ token }, 200, origin);
      } catch {
        return json({ message: "حدث خطأ أثناء تسجيل الدخول، حاول مجدداً" }, 500, origin);
      }
    }

    // ── POST /api/auth/logout ────────────────────────────────────────────────
    if (path === "/api/auth/logout" && method === "POST") {
      return json({ ok: true }, 200, origin);
    }

    // ── GET /api/auth/me ─────────────────────────────────────────────────────
    if (path === "/api/auth/me" && method === "GET") {
      const token   = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
      const session = token ? decodeToken(token) : null;
      if (!session?.cookies) {
        return json({ message: "غير مسجّل" }, 401, origin);
      }
      return json({ username: session.username ?? "student" }, 200, origin);
    }

    // ── GET protected routes ─────────────────────────────────────────────────
    const aspuEndpoint = GET_ROUTES[path];
    if (aspuEndpoint && method === "GET") {
      const token   = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
      const session = token ? decodeToken(token) : null;
      if (!session?.cookies) {
        return json({ message: "يرجى تسجيل الدخول أولاً" }, 401, origin);
      }
      try {
        const data = await aspuGet(session.cookies, aspuEndpoint);
        return json(data, 200, origin);
      } catch (err) {
        if (err.statusCode === 401) return json({ message: err.message }, 401, origin);
        return json({ message: "تعذّر الوصول إلى خادم الجامعة" }, 502, origin);
      }
    }

    // ── POST /api/student/registration/submit ────────────────────────────────
    if (path === "/api/student/registration/submit" && method === "POST") {
      const token   = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
      const session = token ? decodeToken(token) : null;
      if (!session?.cookies) {
        return json({ message: "يرجى تسجيل الدخول أولاً" }, 401, origin);
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ message: "طلب غير صالح" }, 400, origin);
      }
      try {
        // Map frontend field names to ASPU API field names
        const aspuBody = {
          course_ids:    body.courseIds    ?? body.course_ids    ?? [],
          only_exam_ids: body.onlyExamIds  ?? body.only_exam_ids ?? [],
        };
        const data = await aspuPost(session.cookies, "api/students/registration/store-student-queue", aspuBody); // ✅ fixed
        return json(data, 200, origin);
      } catch (err) {
        if (err.statusCode === 401) return json({ message: err.message }, 401, origin);
        return json({ message: "تعذّر الوصول إلى خادم الجامعة" }, 502, origin);
      }
    }

    return json({ message: "Not found" }, 404, origin);
  },
};
