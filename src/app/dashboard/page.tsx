import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "./DashboardShell";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");
  const role = cookieStore.get("role")?.value;

  if (!userId) redirect("/");
  if (role === "operator") redirect("/operator");
  if (role === "admin") redirect("/admin");
  if (role !== "user") redirect("/");

  return <DashboardShell />;
}
