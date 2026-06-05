"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/roles";

type Props = {
  expectedRole: Role;
};

export default function LoginForm({ expectedRole }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          expectedRole,
        }),
      });

      let data: { message?: string; redirect?: string } = {};
      try {
        data = await res.json();
      } catch {
        alert(
          "Il server non risponde. Avvia l'app con: npm run dev"
        );
        return;
      }

      if (!res.ok) {
        alert(data.message ?? "Accesso non riuscito");
        return;
      }

      router.push(data.redirect ?? "/dashboard");
    } catch {
      alert(
        "Errore di connessione. Verifica che il server sia avviato (npm run dev)."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form active">
      <h2>Accedi</h2>

      <div className="input-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="input-group">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button className="submit-btn" disabled={loading}>
        {loading ? "Accesso..." : "Accedi"}
      </button>

      <div className="bottom-text">Ben tornato a Zootropolis 🚀</div>
    </form>
  );
}
