"use client";

import { useState } from "react";
import type { Role } from "@/lib/roles";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

type Props = {
  role: Role;
  onBack: () => void;
};

const ROLE_LABELS: Record<Role, string> = {
  user: "Utente",
  operator: "Operatore",
  admin: "Amministrazione pubblica",
};

export default function AuthCard({ role, onBack }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const loginOnly = role === "operator" || role === "admin";

  return (
    <div className="container">
      <div className="left">
        <h1>Zootropolis</h1>
        <p>
          Prenota bici e monopattini elettrici nella città più moderna del mondo
          animale. Muoviti velocemente, in sicurezza e con stile.
        </p>
        <div className="city-badge">
          {role === "user" && "🛴 Smart Mobility • Zootropolis City"}
          {role === "operator" && "🛠️ Pannello Operatore"}
          {role === "admin" && "🏛️ Pannello Amministrazione"}
        </div>
        {role === "user" && (
          <div className="vehicles">
            <div className="vehicle-card">🚲 Bici</div>
            <div className="vehicle-card">🛴 Monopattini</div>
            <div className="vehicle-card">⚡ Elettrici</div>
          </div>
        )}
      </div>

      <div className="right">
        <button type="button" className="auth-back-btn" onClick={onBack}>
          ← Cambia tipo accesso
        </button>

        <p className="auth-role-badge">Accesso come {ROLE_LABELS[role]}</p>

        {!loginOnly && (
          <div className="tabs">
            <button
              className={`tab-btn ${tab === "login" ? "active" : ""}`}
              onClick={() => setTab("login")}
            >
              Login
            </button>
            <button
              className={`tab-btn ${tab === "register" ? "active" : ""}`}
              onClick={() => setTab("register")}
            >
              Registrazione
            </button>
          </div>
        )}

        {loginOnly || tab === "login" ? (
          <LoginForm expectedRole={role} />
        ) : (
          <RegisterForm />
        )}
      </div>
    </div>
  );
}
