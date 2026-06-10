"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OperatorMap from "./OperatorMap";

type Vehicle = {
  id: number;
  type: string;
  lat: number;
  lng: number;
  batteryLevel: number;
  status: string;
  hasFault: boolean;
  faultNote: string | null;
  blocked: boolean;
  stolen: boolean;
};

type UserMessage = {
  id: number;
  message: string;
  vehicleId: number | null;
  createdAt: string;
  user: { id: number; nome: string; email: string };
};

type MaintenanceReport = {
  id: number;
  title: string;
  description: string;
  lat: number | null;
  lng: number | null;
  status: string;
  createdAt: string;
  vehicleId: number | null;
  reportedBy: { id: number; nome: string; email: string };
};

type User = {
  id: number;
  nome: string;
  email: string;
  suspended: boolean;
  role: string;
};

type ProhibitedArea = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  active: boolean;
};

export default function OperatorShell() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [prohibitedAreas, setProhibitedAreas] = useState<ProhibitedArea[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [thread, setThread] = useState<
    { id: number; message: string; isStaff: boolean; createdAt: string; vehicleId: number | null }[]
  >([]);
  const [reply, setReply] = useState("");
  const [tab, setTab] = useState<"map" | "messages" | "users" | "areas" | "stolen">("map");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadVehicles = useCallback(async () => {
    const res = await fetch("/api/operator/vehicles");
    if (res.ok) setVehicles(await res.json());
  }, []);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/support");
    if (res.ok) setMessages(await res.json());
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/operator/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  const loadReports = useCallback(async () => {
    const res = await fetch("/api/operator/reports");
    if (res.ok) setReports(await res.json());
  }, []);

  const loadProhibitedAreas = useCallback(async () => {
    const res = await fetch("/api/operator/prohibited-areas");
    if (res.ok) setProhibitedAreas(await res.json());
  }, []);

  const loadThread = useCallback(async (uid: number) => {
    const res = await fetch(`/api/support?userId=${uid}`);
    if (res.ok) setThread(await res.json());
  }, []);

  useEffect(() => {
    loadVehicles();
    loadMessages();
    loadReports();
    loadUsers();
    loadProhibitedAreas();
    const id = setInterval(() => {
      loadMessages();
      loadVehicles();
      loadReports();
      loadUsers();
      loadProhibitedAreas();
      if (selectedUser) loadThread(selectedUser);
    }, 15000);
    return () => clearInterval(id);
  }, [loadVehicles, loadMessages, loadReports, loadUsers, loadProhibitedAreas, loadThread, selectedUser]);

  useEffect(() => {
    if (selectedUser) loadThread(selectedUser);
  }, [selectedUser, loadThread]);

  async function markFault(id: number, hasFault: boolean, note?: string) {
    await fetch(`/api/operator/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasFault, faultNote: note ?? null }),
    });
    loadVehicles();
  }

  async function blockVehicle(id: number, blocked: boolean) {
    await fetch(`/api/operator/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked }),
    });
    loadVehicles();
  }

  async function blockUser(id: number, suspended: boolean) {
    await fetch(`/api/operator/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended }),
    });
    loadUsers();
  }

  async function reportStolenVehicle(id: number, stolen: boolean) {
    await fetch(`/api/operator/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stolen, blocked: stolen }),
    });
    loadVehicles();
  }

  async function sendReply() {
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: reply.trim(),
        targetUserId: selectedUser,
      }),
    });
    setReply("");
    loadMessages();
    if (selectedUser) loadThread(selectedUser);
  }

  async function dismissReport(id: number) {
    await fetch("/api/operator/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "resolved" }),
    });
    loadReports();
  }

  async function setIncentivePoint(lat: number, lng: number) {
    await fetch("/api/operator/incentive-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, discount: 10 }),
    });
    alert(`Punto incentivo impostato: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  }

  async function addProhibitedArea(name: string, lat: number, lng: number, radius: number) {
    await fetch("/api/operator/prohibited-areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, lat, lng, radius }),
    });
    loadProhibitedAreas();
  }

  async function removeProhibitedArea(id: number) {
    await fetch("/api/operator/prohibited-areas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadProhibitedAreas();
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  const faults = vehicles.filter((v) => v.hasFault);
  const stolenVehicles = vehicles.filter((v) => v.stolen);
  const userThreads = [...new Map(messages.map((m) => [m.user.id, m.user])).values()];

  const availableCount = vehicles.filter((v) => v.status === "available").length;
  const bookedCount = vehicles.filter((v) => v.status === "booked").length;
  const lowBatteryCount = vehicles.filter((v) => v.batteryLevel < 20).length;
  const criticalBatteryCount = vehicles.filter((v) => v.batteryLevel < 10).length;
  const blockedCount = vehicles.filter((v) => v.blocked).length;

  // Support KPIs
  const totalTickets = messages.length;
  const uniqueUsersWithTickets = userThreads.length;
  const recentTickets = messages.filter((m) => {
    const ticketDate = new Date(m.createdAt);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return ticketDate > oneDayAgo;
  }).length;

  return (
    <div className="dashboard operator-layout-root">
      <nav className="dash-navbar">
        <span className="dash-brand">🛠️ Pannello Operatore</span>
        <div className="dash-nav-links">
          <button
            type="button"
            className={`dash-nav-btn ${tab === "map" ? "dash-nav-btn--active" : ""}`}
            onClick={() => setTab("map")}
          >
            Mappa flotta
          </button>
          <button
            type="button"
            className={`dash-nav-btn ${tab === "messages" ? "dash-nav-btn--active" : ""}`}
            onClick={() => setTab("messages")}
          >
            Messaggi ({messages.length})
          </button>
          <button
            type="button"
            className={`dash-nav-btn ${tab === "users" ? "dash-nav-btn--active" : ""}`}
            onClick={() => setTab("users")}
          >
            Utenti
          </button>
          <button
            type="button"
            className={`dash-nav-btn ${tab === "areas" ? "dash-nav-btn--active" : ""}`}
            onClick={() => setTab("areas")}
          >
            Aree Proibite
          </button>
          <button
            type="button"
            className={`dash-nav-btn ${tab === "stolen" ? "dash-nav-btn--active" : ""}`}
            onClick={() => setTab("stolen")}
          >
            🚨 Furti {stolenVehicles.length > 0 && <span className="notification-badge">{stolenVehicles.length}</span>}
          </button>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="dash-nav-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔 {(reports.length + messages.filter(m => m.vehicleId).length) > 0 && <span className="notification-badge">{reports.length + messages.filter(m => m.vehicleId).length}</span>}
            </button>
            {showNotifications && (
              <div className="notifications-dropdown">
                <h4>Notifiche Sistema</h4>
                {reports.length === 0 && messages.filter(m => m.vehicleId).length === 0 ? (
                  <p className="empty-msg">Nessuna notifica</p>
                ) : (
                  <>
                    {reports.map((report) => (
                      <div key={`r-${report.id}`} className="notification-item">
                        <div className="notification-header">
                          <strong>🔧 {report.title}</strong>
                          <span className="notification-time">
                            {new Date(report.createdAt).toLocaleString("it-IT")}
                          </span>
                        </div>
                        <p className="notification-preview">{report.description}</p>
                        <div className="notification-footer">
                          <span className="notification-user">
                            Da: {report.reportedBy.nome}
                            {report.vehicleId && (
                              <span className="notification-vehicle">
                                {" "}· Mezzo #{report.vehicleId}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            className="notification-dismiss"
                            onClick={() => dismissReport(report.id)}
                          >
                            Archivia
                          </button>
                        </div>
                      </div>
                    ))}
                    {messages.filter(m => m.vehicleId).slice(0, 5).map((msg) => (
                      <div key={`m-${msg.id}`} className="notification-item" style={{ borderLeft: "3px solid #3498db" }}>
                        <div className="notification-header">
                          <strong>💬 Segnalazione mezzo</strong>
                          <span className="notification-time">
                            {new Date(msg.createdAt).toLocaleString("it-IT")}
                          </span>
                        </div>
                        <p className="notification-preview">{msg.message}</p>
                        <div className="notification-footer">
                          <span className="notification-user">
                            Da: {msg.user.nome}
                            <span className="notification-vehicle">
                              {" "}· Mezzo #{msg.vehicleId}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            className="dash-nav-btn"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? "📊" : "📊"}
          </button>
          <button type="button" className="dash-nav-btn" onClick={logout}>
            Esci
          </button>
        </div>
      </nav>

      {faults.length > 0 && (
        <div className="operator-alert operator-alert--fault">
          ⚠️ {faults.length} mezzo/i con guasto segnalato
        </div>
      )}
      {criticalBatteryCount > 0 && (
        <div className="operator-alert operator-alert--critical">
          🔋 {criticalBatteryCount} mezzo/i con batteria critica (&lt;10%)
        </div>
      )}
      {lowBatteryCount > 0 && criticalBatteryCount === 0 && (
        <div className="operator-alert operator-alert--warning">
          🔋 {lowBatteryCount} mezzo/i con batteria bassa (&lt;20%)
        </div>
      )}
      {blockedCount > 0 && (
        <div className="operator-alert operator-alert--blocked">
          🔒 {blockedCount} mezzo/i bloccati
        </div>
      )}
      {stolenVehicles.length > 0 && (
        <div className="operator-alert" style={{ background: "#c0392b" }}>
          🚨 {stolenVehicles.length} veicolo/i segnalato/i come rubato/i
        </div>
      )}

      <main className="content" style={{ display: "flex" }}>
        {showSidebar && (
          <aside className="operator-sidebar">
            <h3>📊 Stato Flotta</h3>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Disponibili</span>
              <span className="sidebar-stat-value sidebar-stat-value--available">
                {availableCount}
              </span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Prenotati</span>
              <span className="sidebar-stat-value sidebar-stat-value--booked">
                {bookedCount}
              </span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Guasti</span>
              <span className="sidebar-stat-value sidebar-stat-value--fault">
                {faults.length}
              </span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Bassa batteria</span>
              <span className="sidebar-stat-value sidebar-stat-value--low-battery">
                {lowBatteryCount}
              </span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Bloccati</span>
              <span className="sidebar-stat-value" style={{ color: "#9b59b6" }}>
                {blockedCount}
              </span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Rubati</span>
              <span className="sidebar-stat-value" style={{ color: "#c0392b" }}>
                {stolenVehicles.length}
              </span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Totale</span>
              <span className="sidebar-stat-value">{vehicles.length}</span>
            </div>
          </aside>
        )}
        <div style={{ flex: 1, height: "100%" }}>
          {tab === "map" ? (
            <OperatorMap vehicles={vehicles} onMarkFault={markFault} onBlockVehicle={blockVehicle} onSetIncentivePoint={setIncentivePoint} onReportStolen={reportStolenVehicle} />
          ) : tab === "messages" ? (
            <div className="operator-messages-layout">
              <aside className="operator-inbox">
                <div className="support-kpis">
                  <div className="kpi-card">
                    <span className="kpi-label">Totale Ticket</span>
                    <span className="kpi-value">{totalTickets}</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Utenti Unici</span>
                    <span className="kpi-value">{uniqueUsersWithTickets}</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Ultimi 24h</span>
                    <span className="kpi-value">{recentTickets}</span>
                  </div>
                </div>
                <h3>Messaggi utenti</h3>
                {userThreads.map((u) => {
                  const count = messages.filter((m) => m.user.id === u.id).length;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`inbox-item ${selectedUser === u.id ? "inbox-item--active" : ""}`}
                      onClick={() => setSelectedUser(u.id)}
                    >
                      <strong>{u.nome}</strong>
                      <span>{u.email}</span>
                      <span className="inbox-count">{count} msg</span>
                    </button>
                  );
                })}
                {userThreads.length === 0 && (
                  <p className="empty-msg">Nessun messaggio</p>
                )}
              </aside>

              <div className="operator-thread">
                {selectedUser ? (
                  <>
                    <div className="thread-messages">
                      {thread.map((m) => (
                        <div
                          key={m.id}
                          className={`thread-msg ${m.isStaff ? "thread-msg--staff" : ""}`}
                        >
                          <div className="thread-msg-header">
                            <strong>{m.isStaff ? "Operatore" : "Utente"}</strong>
                            <span>
                              {new Date(m.createdAt).toLocaleString("it-IT")}
                            </span>
                          </div>
                          <p>{m.message}</p>
                          {m.vehicleId && (
                            <span className="thread-vehicle">
                              Mezzo #{m.vehicleId}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="thread-reply">
                      <input
                        placeholder="Rispondi all'utente..."
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                      />
                      <button type="button" onClick={sendReply}>
                        Invia
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="empty-msg">Seleziona un utente</p>
                )}
              </div>
            </div>
          ) : tab === "users" ? (
            <div className="operator-users-layout">
              <div className="operator-users-list">
                <h3>Gestione Utenti</h3>
                {users.filter((u) => u.role === "user").map((u) => (
                  <div key={u.id} className="user-card">
                    <div className="user-card-info">
                      <strong>{u.nome}</strong>
                      <span>{u.email}</span>
                      {u.suspended && (
                        <span className="user-suspended-badge">Sospeso</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`user-block-btn ${u.suspended ? "user-block-btn--unblock" : ""}`}
                      onClick={() => blockUser(u.id, !u.suspended)}
                    >
                      {u.suspended ? "Sblocca" : "Blocca"}
                    </button>
                  </div>
                ))}
                {users.filter((u) => u.role === "user").length === 0 && (
                  <p className="empty-msg">Nessun utente</p>
                )}
              </div>
            </div>
          ) : tab === "stolen" ? (
            <div className="operator-users-layout">
              <div className="operator-users-list">
                <h3>🚨 Gestione Furti</h3>
                <p className="area-note" style={{ marginBottom: "16px" }}>
                  I veicoli segnalati come rubati vengono automaticamente bloccati. Rimuovi la segnalazione solo quando il veicolo è stato ritrovato.
                </p>
                <h4 style={{ color: "#e84118", marginBottom: "12px" }}>
                  Veicoli rubati ({stolenVehicles.length})
                </h4>
                {stolenVehicles.map((v) => (
                  <div key={v.id} className="user-card" style={{ borderLeft: "4px solid #c0392b" }}>
                    <div className="user-card-info">
                      <strong style={{ color: "#e84118" }}>
                        {v.type === "bike" ? "🚲" : "🛴"} #{v.id} — RUBATO
                      </strong>
                      <span>Pos: {v.lat.toFixed(4)}, {v.lng.toFixed(4)}</span>
                      <span>Batteria: {v.batteryLevel}%</span>
                    </div>
                    <button
                      type="button"
                      className="user-block-btn user-block-btn--unblock"
                      onClick={() => reportStolenVehicle(v.id, false)}
                    >
                      Ritrovato
                    </button>
                  </div>
                ))}
                {stolenVehicles.length === 0 && (
                  <p className="empty-msg">Nessun veicolo rubato segnalato 🎉</p>
                )}
                <h4 style={{ marginTop: "24px", marginBottom: "12px" }}>
                  Segna veicolo come rubato
                </h4>
                {vehicles.filter((v) => !v.stolen).map((v) => (
                  <div key={v.id} className="user-card">
                    <div className="user-card-info">
                      <strong>
                        {v.type === "bike" ? "🚲" : "🛴"} #{v.id}
                      </strong>
                      <span>Stato: {v.status}</span>
                      <span>Batteria: {v.batteryLevel}%</span>
                    </div>
                    <button
                      type="button"
                      className="user-block-btn"
                      style={{ background: "#c0392b", color: "white", borderColor: "#c0392b" }}
                      onClick={() => reportStolenVehicle(v.id, true)}
                    >
                      Segna rubato
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="operator-users-layout">
              <div className="operator-users-list">
                <h3>Aree Proibite</h3>
                {prohibitedAreas.map((area) => (
                  <div key={area.id} className="user-card">
                    <div className="user-card-info">
                      <strong>{area.name}</strong>
                      <span>Lat: {area.lat.toFixed(4)}, Lng: {area.lng.toFixed(4)}</span>
                      <span>Raggio: {area.radius}m</span>
                    </div>
                    <button
                      type="button"
                      className="user-block-btn"
                      onClick={() => removeProhibitedArea(area.id)}
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
                {prohibitedAreas.length === 0 && (
                  <p className="empty-msg">Nessuna area proibita</p>
                )}
                <div className="add-area-form">
                  <h4>Aggiungi Area Proibita</h4>
                  <input
                    type="text"
                    placeholder="Nome area"
                    id="area-name"
                    className="area-input"
                  />
                  <input
                    type="number"
                    placeholder="Raggio (metri)"
                    id="area-radius"
                    defaultValue="200"
                    className="area-input"
                  />
                  <button
                    type="button"
                    className="user-block-btn"
                    onClick={() => {
                      const name = (document.getElementById("area-name") as HTMLInputElement)?.value;
                      const radius = parseInt((document.getElementById("area-radius") as HTMLInputElement)?.value || "200");
                      if (name) {
                        addProhibitedArea(name, 41.1087, 16.8784, radius);
                        (document.getElementById("area-name") as HTMLInputElement).value = "";
                      }
                    }}
                  >
                    Aggiungi Area
                  </button>
                  <p className="area-note">Nota: Le coordinate sono dell'Università di Bari</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
