import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROLE_REDIRECT, type Role } from "@/lib/roles";
import bcrypt from "bcrypt";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  const { email, password, expectedRole } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email e password richieste" },
      { status: 400 }
    );
  }

  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Email non trovata. Controlla l'indirizzo o registrati." },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json(
      { message: "Password errata" },
      { status: 401 }
    );
  }

  const role = (user.role || "user") as Role;

  if (expectedRole && expectedRole !== role) {
    const labels: Record<string, string> = {
      user: "Utente",
      operator: "Operatore",
      admin: "Amministrazione pubblica",
    };
    return NextResponse.json(
      {
        message: `Questo account è di tipo "${labels[role] ?? role}". Torna indietro e seleziona il tipo di accesso corretto.`,
      },
      { status: 403 }
    );
  }

  const res = NextResponse.json({
    message: "Login OK",
    role,
    redirect: ROLE_REDIRECT[role],
  });

  res.cookies.set("userId", String(user.id), { httpOnly: true, path: "/" });
  res.cookies.set("role", role, { httpOnly: true, path: "/" });

  return res;
}
