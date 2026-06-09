import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "./DashboardShell";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");
  const role = cookieStore.get("role")?.value;

  if (!userId) redirect("/");
  if (role === "operator") redirect("/operator");
  if (role === "admin") redirect("/admin");
  if (role !== "user") redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId.value) },
  });

  return <DashboardShell suspended={user?.suspended || false} />;
}
