import { cookies } from "next/headers";
import type { Role } from "./roles";

export type { Role } from "./roles";
export { ROLE_REDIRECT } from "./roles";

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const role = cookieStore.get("role")?.value as Role | undefined;
  if (!userId || !role) return null;
  return { userId: parseInt(userId), role };
}

export function requireRole(session: { role: Role } | null, allowed: Role[]) {
  return session && allowed.includes(session.role);
}
