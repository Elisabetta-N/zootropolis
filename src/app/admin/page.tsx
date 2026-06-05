import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("userId")) redirect("/");
  if (cookieStore.get("role")?.value !== "admin") redirect("/");

  return <AdminShell />;
}
