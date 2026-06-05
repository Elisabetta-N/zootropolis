import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logout OK" });
  res.cookies.set("userId", "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set("role", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
