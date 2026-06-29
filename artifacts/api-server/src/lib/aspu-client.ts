// NOTE: my.aspu.edu.sy does not support TLS — the university's server only
// serves plain HTTP. All communication stays server-to-server (Replit → ASPU),
// so student credentials are never transmitted over a public plaintext link.
// Student ↔ Replit traffic is always HTTPS (Replit terminates TLS).
const ASPU_BASE = "http://my.aspu.edu.sy";

const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "ar",
};

function parseCookies(setCookieHeaders: string[]): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const semicolonIdx = header.indexOf(";");
    const nameValue =
      semicolonIdx >= 0 ? header.slice(0, semicolonIdx) : header;
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx === -1) continue;
    const name = nameValue.slice(0, eqIdx).trim();
    const value = nameValue.slice(eqIdx + 1).trim();
    cookies[name] = value;
  }
  return cookies;
}

export function cookiesToHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export type LoginResult =
  | { success: true; cookies: Record<string, string> }
  | { success: false; message: string };

export async function aspuLogin(
  username: string,
  password: string,
): Promise<LoginResult> {
  // Step 1: GET login page → CSRF token + initial session cookies
  const loginPageRes = await fetch(`${ASPU_BASE}/en/login`, {
    headers: { ...COMMON_HEADERS, Accept: "text/html" },
  });

  const html = await loginPageRes.text();
  const csrfMatch = html.match(/csrf-token"\s+content="([^"]+)"/);
  const csrf = csrfMatch?.[1];
  if (!csrf) throw new Error("Could not extract CSRF token from ASPU login page");

  const initialCookies = parseCookies(loginPageRes.headers.getSetCookie());

  // Step 2: POST credentials
  const loginRes = await fetch(`${ASPU_BASE}/en/login`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrf,
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${ASPU_BASE}/en/login`,
      Cookie: cookiesToHeader(initialCookies),
    },
    body: JSON.stringify({ username, password, remember: true }),
  });

  const data = (await loginRes.json()) as {
    message?: string;
    redirectTo?: string;
  };

  if (!data.redirectTo) {
    return {
      success: false,
      message: data.message ?? "اسم المستخدم أو كلمة المرور غير صحيحة",
    };
  }

  const newCookies = parseCookies(loginRes.headers.getSetCookie());
  return { success: true, cookies: { ...initialCookies, ...newCookies } };
}

export class AspuSessionError extends Error {
  statusCode = 401;
}

export async function aspuGet(
  cookies: Record<string, string>,
  endpoint: string,
): Promise<unknown> {
  const res = await fetch(`${ASPU_BASE}/${endpoint}`, {
    headers: {
      ...COMMON_HEADERS,
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookiesToHeader(cookies),
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new AspuSessionError("ASPU session expired or unauthorized");
  }

  // Try to return JSON even on 5xx — ASPU sometimes returns 500 with partial data
  if (!res.ok && res.status < 500) {
    throw new Error(`ASPU API error: ${res.status} on ${endpoint}`);
  }

  try {
    return await res.json();
  } catch {
    if (!res.ok) throw new Error(`ASPU API error: ${res.status} on ${endpoint}`);
    return {};
  }
}
