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
};

type UserMessage = {
  id: number;
  message: string;
  vehicleId: number | null;
  createdAt: string;
  user: { id: number; nome: string; email: string };
};

export default function OperatorShell() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [thread, setThread] = useState<
    { id: number; message: string; isStaff: boolean; createdAt: string; vehicleId: number | null }[]
  >([]);
  const [reply, setReply] = useState("");
  const [tab, setTab] = useState<"map" | "messages">("map");

  const loadVehicles = useCallback(async () => {
    const res = await fetch("/api/operator/vehicles");
    if (res.ok) setVehicles(await res.json());
  }, []);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/support");
    if (res.ok) setMessages(await res.json());
  }, []);

  const loadThread = useCallback(async (uid: number) => {
    const res = await fetch(`/api/support?userId=${uid}`);
    if (res.ok) setThread(await res.json());
  }, []);

  useEffect(() => {
    loadVehicles();
    loadMessages();
    const id = setInterval(() => {
      loadMessages();
      loadVehicles();
      if (selectedUser) loadThread(selectedUser);
    }, 15000);
    return () => clearInterval(id);
  }, [loadVehicles, loadMessages, loadThread, selectedUser]);

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

  async function sendReply() {
    if (!selectedUser || !reply.trim()) return;
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

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  const faults = vehicles.filter((v) => v.hasFault);
  const userThreads = [...new Map(messages.map((m) => [m.user.id, m.user])).values()];

  return (
    <div className="dashboard">
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
          <button type="button" className="dash-nav-btn" onClick={logout}>
            Esci
          </button>
        </div>
      </nav>

      {faults.length > 0 && (
        <div className="operator-alert">
          ⚠️ {faults.length} mezzo/i con guasto segnalato
        </div>
      )}

      <main className="content">
        {tab === "map" ? (
          <OperatorMap vehicles={vehicles} onMarkFault={markFault} />
        ) : (
          <div className="operator-messages-layout">
            <aside className="operator-inbox">
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
        )}
      </main>
    </div>
  );
}
