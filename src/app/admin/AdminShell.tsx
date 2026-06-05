"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEuro } from "@/lib/pricing";

type Tab = "reports" | "fleet" | "maintenance" | "users";

type Reports = {
  topRoutes: { destination: string; count: number }[];
  totalRevenue: number;
  totalDistance: number;
  totalRides: number;
  totalUsers: number;
  fleet: { status: string; _count: number }[];
  faults: number;
};

type Vehicle = {
  id: number;
  type: string;
  batteryLevel: number;
  status: string;
  hasFault: boolean;
};

type UserRow = {
  id: number;
  nome: string;
  email: string;
  citta: string;
  documentStatus: string;
  createdAt: string;
  _count: { bookings: number };
};

type Maintenance = {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  reportedBy: { nome: string };
};

export default function AdminShell() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<Reports | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [maintForm, setMaintForm] = useState({ title: "", description: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    const res = await fetch("/api/admin/reports");
    if (res.ok) setReports(await res.json());
  }, []);

  const loadFleet = useCallback(async () => {
    const res = await fetch("/api/operator/vehicles");
    if (res.ok) setVehicles(await res.json());
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  const loadMaintenance = useCallback(async () => {
    const res = await fetch("/api/admin/maintenance");
    if (res.ok) setMaintenance(await res.json());
  }, []);

  useEffect(() => {
    loadReports();
    loadFleet();
    loadUsers();
    loadMaintenance();
  }, [loadReports, loadFleet, loadUsers, loadMaintenance]);

  async function submitMaintenance(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maintForm),
    });
    if (res.ok) {
      setMsg("✅ Segnalazione inviata");
      setMaintForm({ title: "", description: "" });
      loadMaintenance();
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "reports", label: "Report" },
    { key: "fleet", label: "Stato mezzi" },
    { key: "maintenance", label: "Manutenzioni" },
    { key: "users", label: "Utenti" },
  ];

  return (
    <div className="admin-layout">
      <nav className="dash-navbar">
        <span className="dash-brand">🏛️ Amministrazione Zootropolis</span>
        <div className="dash-nav-links">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`dash-nav-btn ${tab === t.key ? "dash-nav-btn--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          <button type="button" className="dash-nav-btn" onClick={logout}>
            Esci
          </button>
        </div>
      </nav>

      <main className="admin-content">
        {tab === "reports" && reports && (
          <div className="admin-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{reports.totalRides}</span>
              <span>Corse totali</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">
                {formatEuro(reports.totalRevenue)}
              </span>
              <span>Incassi</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{reports.totalUsers}</span>
              <span>Utenti registrati</span>
            </div>
            <div className="admin-stat-card admin-stat-card--warn">
              <span className="admin-stat-value">{reports.faults}</span>
              <span>Mezzi con guasto</span>
            </div>

            <div className="admin-panel admin-panel--wide">
              <h3>Tratte più utilizzate</h3>
              {reports.topRoutes.length === 0 && (
                <p className="empty-msg">Nessun dato ancora</p>
              )}
              <ul className="route-rank">
                {reports.topRoutes.map((r, i) => (
                  <li key={r.destination}>
                    <span className="route-rank-pos">#{i + 1}</span>
                    <span>{r.destination}</span>
                    <span className="route-rank-count">{r.count} corse</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "fleet" && (
          <div className="admin-panel">
            <h3>Stato flotta</h3>
            <div className="fleet-grid">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className={`fleet-card ${v.hasFault ? "fleet-card--fault" : ""}`}
                >
                  <strong>
                    {v.type === "bike" ? "🚲" : "🛴"} #{v.id}
                  </strong>
                  <p>Stato: {v.status}</p>
                  <p>Carica: {v.batteryLevel}%</p>
                  {v.hasFault && <p className="fault-text">⚠️ Guasto</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "maintenance" && (
          <div className="admin-grid">
            <form className="admin-panel" onSubmit={submitMaintenance}>
              <h3>Segnala manutenzione urbana</h3>
              <div className="setting-group">
                <label>Titolo</label>
                <input
                  value={maintForm.title}
                  onChange={(e) =>
                    setMaintForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="setting-group">
                <label>Descrizione</label>
                <textarea
                  rows={4}
                  value={maintForm.description}
                  onChange={(e) =>
                    setMaintForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <button type="submit" className="panel-btn">
                Invia segnalazione
              </button>
              {msg && <p className="settings-msg">{msg}</p>}
            </form>

            <div className="admin-panel">
              <h3>Segnalazioni recenti</h3>
              {maintenance.map((m) => (
                <div key={m.id} className="booking-card">
                  <strong>{m.title}</strong>
                  <p>{m.description}</p>
                  <p className="booking-date">
                    {new Date(m.createdAt).toLocaleDateString("it-IT")} ·{" "}
                    {m.reportedBy.nome}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="admin-panel">
            <h3>Dati utenti</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Città</th>
                  <th>Documenti</th>
                  <th>Corse</th>
                  <th>Iscritto</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>{u.citta}</td>
                    <td>{u.documentStatus}</td>
                    <td>{u._count.bookings}</td>
                    <td>
                      {new Date(u.createdAt).toLocaleDateString("it-IT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
