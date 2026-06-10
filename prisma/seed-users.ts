import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { nome: "Mario Rossi", email: "mario@test.com", password: "password123", role: "user", citta: "Bari" },
    { nome: "Giulia Bianchi", email: "giulia@test.com", password: "password123", role: "user", citta: "Bari" },
    { nome: "Luca Verdi", email: "luca@test.com", password: "password123", role: "user", citta: "Bari" },
    { nome: "Sara Neri", email: "sara@test.com", password: "password123", role: "user", citta: "Bari" },
    { nome: "Marco Operatore", email: "operatore@test.com", password: "operator123", role: "operator", citta: "Bari" },
    { nome: "Admin Sistema", email: "admin@test.com", password: "admin123", role: "admin", citta: "Bari" },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        nome: u.nome,
        email: u.email,
        password: hashed,
        role: u.role,
        citta: u.citta,
      },
    });
    console.log(`Created: ${u.email} (${u.role})`);
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
