"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isValid = hasLength && hasUppercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Registrazione completata!");

      // vai al login dopo registrazione
      router.push("/");

    } catch (err) {
      alert("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form active">
      <h2>Crea Account</h2>

      <div className="input-group">
        <label>Nome utente</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>

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

        <div className="password-rules">
          <p className={hasLength ? "valid" : ""}>
            {hasLength ? "✅" : "❌"} Almeno 8 caratteri
          </p>

          <p className={hasUppercase ? "valid" : ""}>
            {hasUppercase ? "✅" : "❌"} Una lettera maiuscola
          </p>

          <p className={hasNumber ? "valid" : ""}>
            {hasNumber ? "✅" : "❌"} Un numero
          </p>
        </div>
      </div>

      <button
        disabled={!isValid || loading}
        className="submit-btn"
      >
        {loading ? "Creazione..." : "Registrati"}
      </button>

      <div className="bottom-text">
        Inizia a prenotare mezzi in pochi secondi 🛴
      </div>
    </form>
  );
}