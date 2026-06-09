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

  // Add random users with various data
  const randomUsers = [
    { nome: "Mario Rossi", email: "mario.rossi@email.com", citta: "Milano" },
    { nome: "Laura Bianchi", email: "laura.bianchi@email.com", citta: "Milano" },
    { nome: "Giuseppe Verdi", email: "giuseppe.verdi@email.com", citta: "Milano" },
    { nome: "Anna Ferrari", email: "anna.ferrari@email.com", citta: "Milano" },
    { nome: "Marco Colombo", email: "marco.colombo@email.com", citta: "Milano" },
    { nome: "Giulia Romano", email: "giulia.romano@email.com", citta: "Milano" },
    { nome: "Luca Greco", email: "luca.greco@email.com", citta: "Milano" },
    { nome: "Sofia Costa", email: "sofia.costa@email.com", citta: "Milano" },
    { nome: "Alessandro Mancini", email: "alessandro.mancini@email.com", citta: "Milano" },
    { nome: "Chiara Rizzo", email: "chiara.rizzo@email.com", citta: "Milano" },
    { nome: "Francesco Lombardi", email: "francesco.lombardi@email.com", citta: "Milano" },
    { nome: "Martina Moretti", email: "martina.moretti@email.com", citta: "Milano" },
    { nome: "Andrea Barbieri", email: "andrea.barbieri@email.com", citta: "Milano" },
    { nome: "Elena Fontana", email: "elena.fontana@email.com", citta: "Milano" },
    { nome: "Simone Sarti", email: "simone.sarti@email.com", citta: "Milano" },
  ];

  for (const user of randomUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        nome: user.nome,
        email: user.email,
        password: await hash("User123!"),
        role: "user",
        citta: user.citta,
        documentStatus: "approved",
        paymentMethod: "Visa •••• " + Math.floor(1000 + Math.random() * 9000),
        paymentBrand: "visa",
      },
    });
  }

  console.log("Seed completato: operatori, admin e utenti aggiornati.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
