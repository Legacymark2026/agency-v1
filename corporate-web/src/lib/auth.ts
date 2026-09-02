import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "neogestion_admin_session";

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  const token = Buffer.from(
    JSON.stringify({ email, timestamp: Date.now() })
  ).toString("base64");

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const data = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf8"));
    if (data?.email) {
      return { email: data.email };
    }
  } catch {
    return null;
  }
  return null;
}
