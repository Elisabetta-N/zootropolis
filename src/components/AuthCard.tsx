"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthCard() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="container">

      {/* LEFT (identico al tuo HTML) */}
      <div className="left">
        <h1>Zootropolis</h1>

        <p>
          Prenota bici e monopattini elettrici nella città più moderna del mondo animale.
          Muoviti velocemente, in sicurezza e con stile.
        </p>

        <div className="city-badge">
          🛴 Smart Mobility • Zootropolis City
        </div>

        <div className="vehicles">
          <div className="vehicle-card">🚲 Bici</div>
          <div className="vehicle-card">🛴 Monopattini</div>
          <div className="vehicle-card">⚡ Elettrici</div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="right">

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

        {tab === "login"
          ? <LoginForm />
          : <RegisterForm />
        }

      </div>
    </div>
  );
}