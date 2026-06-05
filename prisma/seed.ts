import "dotenv/config";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const staff = [
    {
      nome: "Marco Operatore",
      email: "operatore@zootropolis.it",
      password: await hash("Operatore123!"),
      role: "operator",
    },
    {
      nome: "Sara Assistenza",
      email: "assistenza@zootropolis.it",
      password: await hash("Operatore123!"),
      role: "operator",
    },
    {
      nome: "Comune di Zootropolis",
      email: "admin@zootropolis.it",
      password: await hash("Admin123!"),
      role: "admin",
      citta: "Zootropolis",
    },
  ];

  for (const s of staff) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: { role: s.role, password: s.password, nome: s.nome },
      create: s,
    });
  }

  const allUsers = await prisma.user.findMany();
  for (const u of allUsers) {
    const lower = u.email.toLowerCase();
    if (lower !== u.email) {
      await prisma.user.update({
        where: { id: u.id },
        data: { email: lower },
      });
    }
    if (!u.role) {
      await prisma.user.update({
        where: { id: u.id },
        data: { role: "user" },
      });
    }
  }

  console.log("Seed completato: operatori, admin e utenti aggiornati.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
