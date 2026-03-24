import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

/** Throws a redirect to `to` if no token present. Returns the token. */
export async function requireAuth(to = "/login"): Promise<string> {
  const token = await getAuthToken();
  if (!token) redirect(to);
  return token;
}
