"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking, Panel, UserProfile } from "./types";
import { formatEuro } from "@/lib/pricing";

type Breakdown = {
  unlock: number;
  minutes: number;
  timeCost: number;
  distCost: number;
  total: number;
  durationSeconds: number;
};

type Props = {
  panel: Panel;
  onClose: () => void;
  onBookingEnded: () => void;
  onOpenSupport: () => void;
  onPaymentRequired: (bookingId: number, breakdown: Breakdown) => void;
};

function vehicleLabel(type: string) {
  return type === "bike" ? "🚲 Bici" : "🛴 Monopattino";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function docStatusLabel(status: string) {
  if (status === "verified") return { text: "Verificato", cls: "doc--verified" };
  if (status === "pending") return { text: "In verifica", cls: "doc--pending" };
  return { text: "Non caricato", cls: "doc--missing" };
}

export default function SidePanel({
  panel,
  onClose,
  onBookingEnded,
  onOpenSupport,
  onPaymentRequired,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [totalRides, setTotalRides] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [endingId, setEndingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    citta: "",
    paymentMethod: "",
  });
  const [editing, setEditing] = useState(false);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data.user);
      setTotalRides(data.totalRides);
      setNotifications(data.user.notifications);
      setEditForm({
        nome: data.user.nome,
        citta: data.user.citta,
        paymentMethod: data.user.paymentMethod,
      });
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/bookings?all=1");
    if (res.ok) {
      setBookings(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!panel) return;
    if (panel === "profile" || panel === "settings") loadProfile();
    if (panel === "bookings") loadBookings();
  }, [panel, loadProfile, loadBookings]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: reader.result }),
      });
      if (res.ok) loadProfile();
    };
    reader.readAsDataURL(file);
  }

  async function saveNotifications() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifications }),
    });
    setMsg(res.ok ? "✅ Impostazioni salvate" : "❌ Errore nel salvataggio");
    setSaving(false);
  }

  async function changePassword() {
    setMsg(null);
    if (passwordForm.newPass !== passwordForm.confirm) {
      setMsg("❌ Le password non coincidono");
      return;
    }
    if (passwordForm.newPass.length < 8) {
      setMsg("❌ Minimo 8 caratteri");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPass,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("✅ Password aggiornata");
      setPasswordForm({ current: "", newPass: "", confirm: "" });
    } else {
      setMsg(`❌ ${data.message}`);
    }
    setSaving(false);
  }

  async function saveProfile() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setMsg("✅ Profilo aggiornato");
      setEditing(false);
      loadProfile();
    } else {
      setMsg("❌ Errore nel salvataggio");
    }
    setSaving(false);
  }

  async function endBooking(id: number) {
    setEndingId(id);
    const res = await fetch(`/api/bookings/${id}`, { method: "PATCH" });
    const data = await res.json();
    if (res.ok) {
      onPaymentRequired(id, data.breakdown);
      onBookingEnded();
      loadBookings();
      onClose();
    }
    setEndingId(null);
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  if (!panel) return null;

  const titles: Record<NonNullable<Panel>, string> = {
    profile: "👤 Profilo",
    bookings: "📋 Prenotazioni",
    settings: "⚙️ Impostazioni",
  };

  const activeBookings = bookings.filter((b) => b.status === "active");
  const pendingBookings = bookings.filter(
    (b) => b.status === "awaiting_payment"
  );
  const pastBookings = bookings.filter((b) => b.status === "completed");
  const docStatus = docStatusLabel(profile?.documentStatus ?? "pending");

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} />
      <aside className="side-panel">
        <div className="side-panel-header">
          <h2>{titles[panel]}</h2>
          <button type="button" className="panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="side-panel-body">
          {panel === "profile" && profile && (
            <div className="profile-full">
              <div className="profile-photo-wrap">
                <div
                  className="profile-photo"
                  style={
                    profile.avatar
                      ? { backgroundImage: `url(${profile.avatar})` }
                      : undefined
                  }
                >
                  {!profile.avatar && (
                    <span>{profile.nome.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="profile-photo-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  Cambia foto
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                />
              </div>

              <button
                type="button"
                className="panel-btn panel-btn--outline profile-edit-toggle"
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Annulla modifica" : "✏️ Modifica profilo"}
              </button>

              {editing ? (
                <>
                  <div className="setting-group">
                    <label>Nome</label>
                    <input
                      value={editForm.nome}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, nome: e.target.value }))
                      }
                    />
                  </div>
                  <div className="setting-group">
                    <label>Città</label>
                    <input
                      value={editForm.citta}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, citta: e.target.value }))
                      }
                    />
                  </div>
                  <div className="setting-group">
                    <label>Metodo di pagamento</label>
                    <input
                      value={editForm.paymentMethod}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          paymentMethod: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="profile-field">
                    <label>Email (non modificabile)</label>
                    <p>{profile.email}</p>
                  </div>
                  {msg && <p className="settings-msg">{msg}</p>}
                  <button
                    type="button"
                    className="panel-btn"
                    onClick={saveProfile}
                    disabled={saving}
                  >
                    {saving ? "Salvataggio..." : "Salva modifiche"}
                  </button>
                </>
              ) : (
                <>
                  <div className="profile-field">
                    <label>Nome</label>
                    <p>{profile.nome}</p>
                  </div>
                  <div className="profile-field">
                    <label>Città</label>
                    <p>📍 {profile.citta}</p>
                  </div>
                  <div className="profile-field">
                    <label>Email</label>
                    <p>{profile.email}</p>
                  </div>
                </>
              )}

              <div className="profile-section-title">Documenti</div>
              <div className="profile-card-row">
                <div className="profile-doc-card">
                  <span>🪪 Documento identità</span>
                  <span className={`doc-badge ${docStatus.cls}`}>
                    {docStatus.text}
                  </span>
                </div>
                <div className="profile-doc-card">
                  <span>📄 Patente / Codice fiscale</span>
                  <span className={`doc-badge ${docStatus.cls}`}>
                    {docStatus.text}
                  </span>
                </div>
              </div>

              <div className="profile-section-title">Metodo di pagamento</div>
              <div className="payment-card">
                <span className="payment-brand">
                  {profile.paymentBrand === "visa" ? "💳" : "💳"}
                </span>
                <div>
                  <strong>{profile.paymentMethod}</strong>
                  <p className="payment-sub">Predefinito</p>
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat-card">
                  <span className="stat-value">{totalRides}</span>
                  <span className="stat-label">Corse completate</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">
                    {new Date(profile.createdAt).toLocaleDateString("it-IT")}
                  </span>
                  <span className="stat-label">Membro dal</span>
                </div>
              </div>

              <button
                type="button"
                className="panel-btn panel-btn--danger"
                onClick={handleLogout}
              >
                Esci dall&apos;account
              </button>
            </div>
          )}

          {panel === "bookings" && (
            <div className="bookings-section">
              {loading && <p>Caricamento...</p>}

              {!loading && bookings.length === 0 && (
                <p className="empty-msg">Nessuna prenotazione ancora.</p>
              )}

              {pendingBookings.length > 0 && (
                <>
                  <h3 className="bookings-group-title">In attesa di pagamento</h3>
                  {pendingBookings.map((b) => (
                    <div key={b.id} className="booking-card">
                      <div className="booking-card-header">
                        <strong>{vehicleLabel(b.vehicle.type)}</strong>
                        <span className="booking-status booking-status--pending">
                          Da pagare
                        </span>
                      </div>
                      {b.cost != null && (
                        <p className="booking-cost">
                          Totale: <strong>{formatEuro(b.cost)}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}

              {activeBookings.length > 0 && (
                <>
                  <h3 className="bookings-group-title">In corso</h3>
                  {activeBookings.map((b) => (
                    <div key={b.id} className="booking-card booking-card--active">
                      <div className="booking-card-header">
                        <strong>{vehicleLabel(b.vehicle.type)}</strong>
                        <span className="booking-status booking-status--active">
                          In corso
                        </span>
                      </div>
                      <p className="booking-date">{formatDate(b.createdAt)}</p>
                      {b.destination && (
                        <p className="booking-dest">📍 {b.destination}</p>
                      )}
                      <button
                        type="button"
                        className="panel-btn panel-btn--end"
                        disabled={endingId === b.id}
                        onClick={() => endBooking(b.id)}
                      >
                        {endingId === b.id
                          ? "Chiusura..."
                          : "Termina corsa"}
                      </button>
                    </div>
                  ))}
                </>
              )}

              {pastBookings.length > 0 && (
                <>
                  <h3 className="bookings-group-title">Passate</h3>
                  {pastBookings.map((b) => (
                    <div key={b.id} className="booking-card">
                      <div className="booking-card-header">
                        <strong>{vehicleLabel(b.vehicle.type)}</strong>
                        <span className="booking-status booking-status--completed">
                          Completata
                        </span>
                      </div>
                      <p className="booking-date">{formatDate(b.createdAt)}</p>
                      {b.destination && (
                        <p className="booking-dest">📍 {b.destination}</p>
                      )}
                      {b.cost != null && (
                        <p className="booking-cost">
                          Costo: <strong>{formatEuro(b.cost)}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {panel === "settings" && (
            <div className="settings-section">
              <div className="setting-toggle">
                <span>Notifiche push</span>
                <button
                  type="button"
                  className={`toggle ${notifications ? "toggle--on" : ""}`}
                  onClick={() => setNotifications((n) => !n)}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              <button
                type="button"
                className="panel-btn panel-btn--outline"
                onClick={saveNotifications}
                disabled={saving}
              >
                Salva notifiche
              </button>

              <div className="settings-divider" />

              <h3 className="settings-subtitle">Cambia password</h3>
              <div className="setting-group">
                <label htmlFor="current-pw">Password attuale</label>
                <input
                  id="current-pw"
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, current: e.target.value }))
                  }
                />
              </div>
              <div className="setting-group">
                <label htmlFor="new-pw">Nuova password</label>
                <input
                  id="new-pw"
                  type="password"
                  value={passwordForm.newPass}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, newPass: e.target.value }))
                  }
                />
              </div>
              <div className="setting-group">
                <label htmlFor="confirm-pw">Conferma password</label>
                <input
                  id="confirm-pw"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, confirm: e.target.value }))
                  }
                />
              </div>
              <button
                type="button"
                className="panel-btn"
                onClick={changePassword}
                disabled={saving}
              >
                Aggiorna password
              </button>

              <div className="settings-divider" />

              <button
                type="button"
                className="panel-btn panel-btn--support"
                onClick={() => {
                  onClose();
                  onOpenSupport();
                }}
              >
                💬 Contatta assistenza
              </button>

              {msg && <p className="settings-msg">{msg}</p>}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
