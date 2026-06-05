import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OperatorShell from "./OperatorShell";

export default async function OperatorPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("userId")) redirect("/");
  if (cookieStore.get("role")?.value !== "operator") redirect("/");

  return <OperatorShell />;
}
