"use client";

import type { Role } from "@/lib/roles";

type Props = {
  onSelect: (role: Role) => void;
};

const ROLES: { role: Role; icon: string; title: string; desc: string }[] = [
  {
    role: "user",
    icon: "🚲",
    title: "Utente",
    desc: "Prenota bici e monopattini, gestisci le tue corse",
  },
  {
    role: "operator",
    icon: "🛠️",
    title: "Operatore",
    desc: "Assistenza, mappa flotta e gestione guasti",
  },
  {
    role: "admin",
    icon: "🏛️",
    title: "Amministrazione pubblica",
    desc: "Report, dati utenti e manutenzioni urbane",
  },
];

export default function RolePicker({ onSelect }: Props) {
  return (
    <div className="role-picker">
      <h1>Zootropolis</h1>
      <p className="role-picker-sub">Scegli come vuoi accedere</p>
      <div className="role-cards">
        {ROLES.map((r) => (
          <button
            key={r.role}
            type="button"
            className="role-card"
            onClick={() => onSelect(r.role)}
          >
            <span className="role-card-icon">{r.icon}</span>
            <strong>{r.title}</strong>
            <span className="role-card-desc">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
