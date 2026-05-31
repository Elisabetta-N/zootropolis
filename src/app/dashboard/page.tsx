import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MapClient from "./MapClient";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const user = cookieStore.get("userId");

  if (!user) {
    redirect("/");
  }

  return <MapClient />;
}