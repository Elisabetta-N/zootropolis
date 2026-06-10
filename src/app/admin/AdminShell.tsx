"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEuro } from "@/lib/pricing";

type Tab = "reports" | "heatmap" | "fleet" | "stolen" | "maintenance" | "users" | "system";

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
  lat: number;
  lng: number;
  batteryLevel: number;
  status: string;
  hasFault: boolean;
  blocked: boolean;
  stolen: boolean;
  stolenAt: string | null;
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

// ── Heatmap component (pure canvas, no external lib) ──────────────────────────
function HeatmapCanvas({ routes }: { routes: { destination: string; count: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || routes.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, W, H);

    // Draw simulated heatmap blobs based on count
    const max = Math.max(...routes.map((r) => r.count), 1);

    // Deterministic pseudo-random positions from route name hash
    routes.forEach((route, i) => {
      const hash = route.destination.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const x = ((hash * 37 + i * 113) % (W - 120)) + 60;
      const y = ((hash * 59 + i * 71) % (H - 80)) + 40;
      const radius = 40 + (route.count / max) * 80;
      const alpha = 0.3 + (route.count / max) * 0.6;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 60, 0, ${alpha})`);
      gradient.addColorStop(0.4, `rgba(255, 152, 0, ${alpha * 0.6})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // Labels
    ctx.font = "bold 11px Arial";
    routes.forEach((route, i) => {
      const hash = route.destination.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const x = ((hash * 37 + i * 113) % (W - 120)) + 60;
      const y = ((hash * 59 + i * 71) % (H - 80)) + 40;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.fillText(route.destination.slice(0, 18), x, y + 4);
      ctx.fillStyle = "#ff9800";
      ctx.fillText(`(${route.count})`, x, y + 18);
    });
  }, [routes]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={380}
      style={{ borderRadius: "12px", width: "100%", maxWidth: "700px" }}
    />
  );
}

export default function AdminShell() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<Reports | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [maintForm, setMaintForm] = useState({ title: "", description: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [systemInfo] = useState({
    version: "1.0.0",
    environment: "production",
    dbProvider: "SQLite",
    startTime: new Date().toISOString(),
    framework: "Next.js 15",
    university: "Università degli Studi di Bari Aldo Moro",
    location: "Via Orabona 4, 70125 Bari BA",
    coordinates: "41.1087° N, 16.8784° E",
  });

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

  const stolenVehicles = vehicles.filter((v) => v.stolen);

  const tabs: { key: Tab; label: string }[] = [
    { key: "reports", label: "📊 Report" },
    { key: "heatmap", label: "🔥 Heatmap" },
    { key: "fleet", label: "🚗 Stato mezzi" },
    { key: "stolen", label: `🚨 Furti${stolenVehicles.length > 0 ? ` (${stolenVehicles.length})` : ""}` },
    { key: "maintenance", label: "🔧 Manutenzioni" },
    { key: "users", label: "👤 Utenti" },
    { key: "system", label: "⚙️ Sistema" },
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
        {/* ── REPORT ── */}
        {tab === "reports" && reports && (
          <div className="admin-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{reports.totalRides}</span>
              <span>Corse totali</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{formatEuro(reports.totalRevenue)}</span>
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

        {/* ── HEATMAP ── */}
        {tab === "heatmap" && (
          <div className="admin-panel admin-panel--wide">
            <h3>🔥 Heatmap percorsi più utilizzati</h3>
            <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "20px" }}>
              Visualizzazione delle destinazioni più frequenti. La densità del colore indica il volume di utilizzo.
            </p>
            {reports && reports.topRoutes.length > 0 ? (
              <>
                <HeatmapCanvas routes={reports.topRoutes} />
                <div className="heatmap-legend">
                  <span className="heatmap-legend-hot">🔴 Alta frequenza</span>
                  <span className="heatmap-legend-mid">🟠 Media frequenza</span>
                  <span className="heatmap-legend-low">🟡 Bassa frequenza</span>
                </div>
                <ul className="route-rank" style={{ marginTop: "20px" }}>
                  {reports.topRoutes.map((r, i) => (
                    <li key={r.destination}>
                      <span className="route-rank-pos">#{i + 1}</span>
                      <span>{r.destination}</span>
                      <span className="route-rank-count">{r.count} corse</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="empty-heatmap">
                <p>📭 Nessuna corsa completata ancora — la heatmap si popolerà con l'uso del servizio.</p>
              </div>
            )}
          </div>
        )}

        {/* ── STATO MEZZI ── */}
        {tab === "fleet" && (
          <div className="admin-panel">
            <h3>Stato flotta</h3>
            <div className="fleet-grid">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className={`fleet-card ${v.hasFault ? "fleet-card--fault" : ""} ${v.stolen ? "fleet-card--stolen" : ""}`}
                >
                  <strong>
                    {v.type === "bike" ? "🚲" : "🛴"} #{v.id}
                  </strong>
                  <p>Stato: {v.status}</p>
                  <p>Carica: {v.batteryLevel}%</p>
                  {v.stolen && <p className="fault-text" style={{ color: "#c0392b" }}>🚨 Rubato</p>}
                  {v.blocked && !v.stolen && <p className="fault-text" style={{ color: "#9b59b6" }}>🔒 Bloccato</p>}
                  {v.hasFault && <p className="fault-text">⚠️ Guasto</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FURTI ── */}
        {tab === "stolen" && (
          <div className="admin-panel admin-panel--wide">
            <h3>🚨 Registro furti veicoli</h3>
            <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "20px" }}>
              Veicoli segnalati come rubati dall'operatore. Sono automaticamente bloccati e non prenotabili.
            </p>

            <div className="admin-grid" style={{ marginBottom: "24px" }}>
              <div className="admin-stat-card admin-stat-card--warn" style={{ background: "#c0392b" }}>
                <span className="admin-stat-value">{stolenVehicles.length}</span>
                <span>Veicoli rubati</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">{vehicles.filter((v) => v.blocked && !v.stolen).length}</span>
                <span>Bloccati (non rubati)</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">{vehicles.length - stolenVehicles.length}</span>
                <span>Veicoli operativi</span>
              </div>
            </div>

            {stolenVehicles.length === 0 ? (
              <div className="empty-heatmap">
                <p>✅ Nessun veicolo rubato segnalato al momento.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Latitudine</th>
                    <th>Longitudine</th>
                    <th>Batteria</th>
                    <th>Data segnalazione</th>
                  </tr>
                </thead>
                <tbody>
                  {stolenVehicles.map((v) => (
                    <tr key={v.id} style={{ background: "rgba(192,57,43,0.15)" }}>
                      <td>
                        <strong style={{ color: "#e84118" }}>#{v.id}</strong>
                      </td>
                      <td>{v.type === "bike" ? "🚲 Bici" : "🛴 Monopattino"}</td>
                      <td>{v.lat.toFixed(5)}</td>
                      <td>{v.lng.toFixed(5)}</td>
                      <td>{v.batteryLevel}%</td>
                      <td>
                        {v.stolenAt
                          ? new Date(v.stolenAt).toLocaleString("it-IT")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── MANUTENZIONI ── */}
        {tab === "maintenance" && (
          <div className="admin-grid">
            <form className="admin-panel" onSubmit={submitMaintenance}>
              <h3>Segnala manutenzione urbana</h3>
              <div className="setting-group">
                <label>Titolo</label>
                <input
                  value={maintForm.title}
                  onChange={(e) => setMaintForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="setting-group">
                <label>Descrizione</label>
                <textarea
                  rows={4}
                  value={maintForm.description}
                  onChange={(e) => setMaintForm((f) => ({ ...f, description: e.target.value }))}
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
                    {new Date(m.createdAt).toLocaleDateString("it-IT")} · {m.reportedBy.nome}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── UTENTI ── */}
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
                    <td>{new Date(u.createdAt).toLocaleDateString("it-IT")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── DETTAGLI SISTEMA ── */}
        {tab === "system" && (
          <div className="admin-panel admin-panel--wide">
            <h3>⚙️ Dettagli di sistema</h3>

            <div className="system-grid">
              <div className="system-section">
                <h4>🔧 Applicazione</h4>
                <div className="system-row">
                  <span className="system-label">Versione</span>
                  <span className="system-value">{systemInfo.version}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Framework</span>
                  <span className="system-value">{systemInfo.framework}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Ambiente</span>
                  <span className="system-value system-badge system-badge--green">{systemInfo.environment}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Database</span>
                  <span className="system-value">{systemInfo.dbProvider}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Avviato il</span>
                  <span className="system-value">{new Date(systemInfo.startTime).toLocaleString("it-IT")}</span>
                </div>
              </div>

              <div className="system-section">
                <h4>🏛️ Sede operativa</h4>
                <div className="system-row">
                  <span className="system-label">Università</span>
                  <span className="system-value">{systemInfo.university}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Indirizzo</span>
                  <span className="system-value">{systemInfo.location}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Coordinate</span>
                  <span className="system-value">{systemInfo.coordinates}</span>
                </div>
              </div>

              <div className="system-section">
                <h4>📊 Statistiche live</h4>
                <div className="system-row">
                  <span className="system-label">Veicoli totali</span>
                  <span className="system-value">{vehicles.length}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Disponibili</span>
                  <span className="system-value system-badge system-badge--green">
                    {vehicles.filter((v) => v.status === "available").length}
                  </span>
                </div>
                <div className="system-row">
                  <span className="system-label">In uso</span>
                  <span className="system-value system-badge system-badge--blue">
                    {vehicles.filter((v) => v.status === "booked").length}
                  </span>
                </div>
                <div className="system-row">
                  <span className="system-label">Con guasto</span>
                  <span className="system-value system-badge system-badge--red">
                    {vehicles.filter((v) => v.hasFault).length}
                  </span>
                </div>
                <div className="system-row">
                  <span className="system-label">Utenti registrati</span>
                  <span className="system-value">{users.length}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Corse completate</span>
                  <span className="system-value">{reports?.totalRides ?? "—"}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Incassi totali</span>
                  <span className="system-value">{reports ? formatEuro(reports.totalRevenue) : "—"}</span>
                </div>
              </div>

              <div className="system-section">
                <h4>🔋 Salute flotta</h4>
                <div className="system-row">
                  <span className="system-label">Batteria media</span>
                  <span className="system-value">
                    {vehicles.length > 0
                      ? `${Math.round(vehicles.reduce((s, v) => s + v.batteryLevel, 0) / vehicles.length)}%`
                      : "—"}
                  </span>
                </div>
                <div className="system-row">
                  <span className="system-label">Batteria &lt;20%</span>
                  <span className="system-value system-badge system-badge--orange">
                    {vehicles.filter((v) => v.batteryLevel < 20).length}
                  </span>
                </div>
                <div className="system-row">
                  <span className="system-label">Bloccati</span>
                  <span className="system-value">{vehicles.filter((v) => v.blocked).length}</span>
                </div>
                <div className="system-row">
                  <span className="system-label">Rubati</span>
                  <span className="system-value system-badge system-badge--red">
                    {stolenVehicles.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
