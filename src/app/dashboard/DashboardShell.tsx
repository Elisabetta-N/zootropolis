"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "./Navbar";
import SearchBar, { type Destination } from "./SearchBar";
import MapClient from "./MapClient";
import SidePanel from "./SidePanel";
import SupportChat from "./SupportChat";
import ActiveRideBar from "./ActiveRideBar";
import PaymentModal from "./PaymentModal";
import type { Booking, Panel, Pos, Vehicle } from "./types";

type Breakdown = {
  unlock: number;
  minutes: number;
  timeCost: number;
  distCost: number;
  total: number;
  durationSeconds: number;
};

export default function DashboardShell({ suspended }: { suspended: boolean }) {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [endingRide, setEndingRide] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    bookingId: number;
    breakdown: Breakdown;
    startPos: string;
    destination: string;
    vehicleType: string;
    vehicleId: number;
  } | null>(null);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false); // kept for endRide incentive check
  const [discountAmount, setDiscountAmount] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState("Visa •••• 4242");
  const [rideEndedMsg, setRideEndedMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [position, setPosition] = useState<Pos | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookingDuration, setBookingDuration] = useState<number>(30); // minuti
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [discountStep, setDiscountStep] = useState<"ask" | "granted" | "denied" | null>(null);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);

  const loadVehicles = useCallback(async (lat: number, lng: number) => {
    const res = await fetch(`/api/vehicles?lat=${lat}&lng=${lng}`);
    if (res.ok) setVehicles(await res.json());
  }, []);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setPaymentMethod(data.user.paymentMethod);
    }
  }, []);

  const loadActiveBooking = useCallback(async () => {
    const res = await fetch("/api/bookings");
    if (!res.ok) return;
    const bookings: Booking[] = await res.json();
    const active = bookings.find((b) => b.status === "active");
    const awaiting = bookings.find((b) => b.status === "awaiting_payment");
    setActiveBooking(active ?? null);

    // Restore destination from active booking so map + route remain visible
    if (active && active.destination && active.destLat && active.destLng) {
      setDestination({
        label: active.destination,
        lat: active.destLat,
        lng: active.destLng,
      });
    }

    if (awaiting && awaiting.cost != null) {
      setPendingPayment({
        bookingId: awaiting.id,
        breakdown: {
          unlock: 1,
          minutes: Math.ceil((awaiting.durationSeconds ?? 60) / 60),
          timeCost: awaiting.cost - 1,
          distCost: 0,
          total: awaiting.cost,
          durationSeconds: awaiting.durationSeconds ?? 60,
        },
        startPos: awaiting.vehicle ? `${awaiting.vehicle.lat.toFixed(5)}, ${awaiting.vehicle.lng.toFixed(5)}` : "Milano Centro",
        destination: awaiting.destination ?? "Destinazione non specificata",
        vehicleType: awaiting.vehicle?.type ?? "bike",
        vehicleId: awaiting.vehicle?.id ?? awaiting.vehicleId,
      });
    }
  }, []);

  useEffect(() => {
    loadProfile();
    // Dipartimento di Informatica - Università di Bari (Via Orabona 4)
    const lat = 41.1087;
    const lng = 16.8784;
    setPosition({ lat, lng });
    loadVehicles(lat, lng);
    loadActiveBooking();
  }, [loadVehicles, loadActiveBooking, loadProfile]);

  const handleBookingChange = useCallback((booking: Booking | null) => {
    setActiveBooking(booking);
  }, []);

  async function bookVehicle(vehicleId: number): Promise<boolean> {
    if (activeBooking || pendingPayment) {
      setBookingMsg("❌ Completa il pagamento o termina la corsa attiva");
      return false;
    }

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        destination: destination?.label ?? null,
        destLat: destination?.lat ?? null,
        destLng: destination?.lng ?? null,
        distance: routeDistance,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setActiveBooking(data.booking);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      setBookingMsg("✅ Prenotazione confermata!");
      setTimeout(() => setBookingMsg(null), 4000);
      return true;
    }

    setBookingMsg(`❌ ${data.message}`);
    return false;
  }

  async function endRide() {
    if (!activeBooking) return;
    setEndingRide(true);

    const res = await fetch(`/api/bookings/${activeBooking.id}`, {
      method: "PATCH",
    });
    const data = await res.json();

    if (res.ok) {
      const startPos = activeBooking.vehicle
        ? `${activeBooking.vehicle.lat.toFixed(5)}, ${activeBooking.vehicle.lng.toFixed(5)}`
        : "Posizione di sblocco";
      const dest = activeBooking.destination ?? destination?.label ?? "Destinazione";
      const vehicleType = activeBooking.vehicle?.type ?? "bike";
      const vehicleId = activeBooking.vehicle?.id ?? activeBooking.vehicleId;

      // Check if near incentive point — save discount amount for later popup
      const incentiveRes = await fetch("/api/incentive-points");
      if (incentiveRes.ok) {
        const incentivePoints = await incentiveRes.json();
        const currentLat = position?.lat || 41.1087;
        const currentLng = position?.lng || 16.8784;

        for (const point of incentivePoints) {
          const distance = Math.sqrt(
            Math.pow(currentLat - point.lat, 2) + Math.pow(currentLng - point.lng, 2)
          ) * 111000;
          if (distance < 200) {
            setDiscountAmount(point.discount);
            break;
          }
        }
      }

      setActiveBooking(null);
      setPendingPayment({
        bookingId: activeBooking.id,
        breakdown: data.breakdown,
        startPos,
        destination: dest,
        vehicleType,
        vehicleId,
      });
    }
    setEndingRide(false);
  }

  async function confirmPayment() {
    if (!pendingPayment) return;
    setPaying(true);

    const res = await fetch(
      `/api/bookings/${pendingPayment.bookingId}/pay`,
      { method: "POST" }
    );
    const data = await res.json();

    if (res.ok) {
      setPendingPayment(null);
      setRideEndedMsg(`✅ Pagamento di €${data.cost.toFixed(2)} completato!`);
      setRefreshKey((k) => k + 1);
      if (position) loadVehicles(position.lat, position.lng);
      setTimeout(() => setRideEndedMsg(null), 5000);
      
      // Mostra popup con domanda sul parcheggio incentivato
      setDiscountStep("ask");
    }
    setPaying(false);
  }

  function openSupportChat() {
    setActivePanel(null);
    setChatOpen(true);
  }

  return (
    <div className="dashboard">
      <Navbar activePanel={activePanel} onNavigate={setActivePanel} />

      {activeBooking && (
        <ActiveRideBar
          booking={activeBooking}
          onEndRide={endRide}
          ending={endingRide}
        />
      )}

      <main className="content">
        <div className="map-overlay">
          <SearchBar
            destination={destination}
            onDestinationSelect={setDestination}
            userPosition={position}
            vehicles={vehicles}
            activeBooking={activeBooking}
            onBookVehicle={bookVehicle}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
          />
        </div>

        {(destination || activeBooking) ? (
          <MapClient
            key={refreshKey}
            destination={destination}
            activeBooking={activeBooking}
            onBookingChange={handleBookingChange}
            position={position}
            vehicles={vehicles}
            onBookVehicle={bookVehicle}
            onRouteChange={setRouteDistance}
            onVehiclesReload={() =>
              position && loadVehicles(position.lat, position.lng)
            }
            selectedVehicle={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
          />
        ) : (
          <div className="empty-map-placeholder">
            <div className="empty-map-card">
              <div className="empty-map-icon">🗺️</div>
              <h2>Inizia il tuo viaggio</h2>
              <p>Inserisci una destinazione sopra per cercare i mezzi disponibili e visualizzare il percorso.</p>
              <div className="features-list">
                <div className="feature-item">
                  <span className="feature-emoji">🚲</span>
                  <div>
                    <strong>Bici & Monopattini</strong>
                    <p>Trova il mezzo elettrico più vicino a te</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-emoji">⚡</span>
                  <div>
                    <strong>Eco-friendly & Veloce</strong>
                    <p>Controlla l'autonomia residua in tempo reale</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-emoji">🅿️</span>
                  <div>
                    <strong>Parcheggi Convenzionati</strong>
                    <p>Ottieni sconti se parcheggi nelle zone indicate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Vehicle Preview Component */}
        {selectedVehicle && !activeBooking && destination && (
          <div className="vehicle-preview-card">
            <div className="vehicle-preview-header">
              <span className="vehicle-preview-title">
                {selectedVehicle.type === "bike" ? "🚲 E-Bike" : "🛴 E-Scooter"} #{selectedVehicle.id}
              </span>
              <button
                type="button"
                className="vehicle-preview-close"
                onClick={() => setSelectedVehicle(null)}
              >
                ✕
              </button>
            </div>
            <div className="vehicle-preview-stats">
              <div className="vehicle-preview-stat">
                <div className="vehicle-preview-stat-label">Autonomia</div>
                <div className="vehicle-preview-stat-value">
                  {selectedVehicle.type === "bike"
                    ? Math.round(60 * (selectedVehicle.batteryLevel / 100))
                    : Math.round(45 * (selectedVehicle.batteryLevel / 100))}{" "}
                  km
                </div>
              </div>
              <div className="vehicle-preview-stat">
                <div className="vehicle-preview-stat-label">Batteria</div>
                <div className="vehicle-preview-stat-value battery">
                  {selectedVehicle.batteryLevel}%
                </div>
                <div className="vehicle-preview-battery-bar">
                  <div
                    className="battery-fill"
                    style={{
                      width: `${selectedVehicle.batteryLevel}%`,
                      background: selectedVehicle.batteryLevel > 50 ? "#4cd137" : selectedVehicle.batteryLevel > 20 ? "#ff9800" : "#e84118",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Selettore durata */}
            <div className="duration-selector">
              <div className="duration-label">⏱️ Durata stimata</div>
              <div className="duration-options">
                {[15, 30, 45, 60, 90, 120].map((min) => (
                  <button
                    key={min}
                    type="button"
                    className={`duration-option ${bookingDuration === min ? "duration-option--active" : ""}`}
                    onClick={() => setBookingDuration(min)}
                  >
                    {min >= 60 ? `${min / 60}h` : `${min}m`}
                  </button>
                ))}
              </div>
              <div className="duration-cost-preview">
                Costo stimato: <strong>€{(1 + bookingDuration * 0.25).toFixed(2)}</strong>
                <span style={{ fontSize: "10px", color: "#888", marginLeft: "6px" }}>
                  (€1 sblocco + €0.25/min)
                </span>
              </div>
            </div>

            <button
              type="button"
              className="panel-btn"
              onClick={async () => {
                const ok = await bookVehicle(selectedVehicle.id);
                if (ok) {
                  setSelectedVehicle(null);
                }
              }}
              disabled={!!activeBooking}
              style={{ background: "#ff9800", color: "black", fontWeight: "bold" }}
            >
              Prenota ora
            </button>
          </div>
        )}
      </main>

      <SidePanel
        panel={activePanel}
        onClose={() => setActivePanel(null)}
        onBookingEnded={() => {
          setActiveBooking(null);
          setRefreshKey((k) => k + 1);
          if (position) loadVehicles(position.lat, position.lng);
        }}
        onOpenSupport={openSupportChat}
        onPaymentRequired={(bookingId, breakdown, extra) => {
          setActiveBooking(null);
          setPendingPayment({
            bookingId,
            breakdown,
            startPos: extra?.startPos ?? "Milano Centro",
            destination: extra?.destination ?? "Destinazione non specificata",
            vehicleType: extra?.vehicleType ?? "bike",
            vehicleId: extra?.vehicleId ?? 0,
          });
        }}
      />

      <SupportChat
        activeBooking={activeBooking}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />

      {pendingPayment && (
        <PaymentModal
          breakdown={pendingPayment.breakdown}
          paymentMethod={paymentMethod}
          onPay={confirmPayment}
          onCancel={() => setPendingPayment(null)}
          paying={paying}
          startPos={pendingPayment.startPos}
          destination={pendingPayment.destination}
          durationSeconds={pendingPayment.breakdown.durationSeconds}
          vehicleType={pendingPayment.vehicleType}
          vehicleId={pendingPayment.vehicleId}
        />
      )}

      {/* Post-ride incentive popup — step 1: domanda, step 2: granted, step 3: denied */}
      {discountStep === "ask" && (
        <div className="discount-popup-backdrop">
          <div className="discount-popup">
            <div className="discount-popup-icon">🅿️</div>
            <div className="discount-popup-badge">Zona Incentivata</div>
            <h2>Hai parcheggiato in una zona incentivata?</h2>
            <p>
              Se hai lasciato il mezzo in una delle aree convenzionate, puoi ricevere uno sconto del <strong style={{ color: "#ff9800" }}>10%</strong> sulla corsa appena completata.
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                className="discount-popup-btn"
                style={{ background: "#4cd137", color: "black" }}
                onClick={() => setDiscountStep("granted")}
              >
                ✅ Sì, ho parcheggiato lì
              </button>
              <button
                type="button"
                className="discount-popup-btn"
                style={{ background: "#2a2a2a", color: "#ccc", border: "1px solid #444" }}
                onClick={() => setDiscountStep("denied")}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {discountStep === "granted" && (
        <div className="discount-popup-backdrop">
          <div className="discount-popup">
            <div className="discount-popup-icon">🎁</div>
            <div className="discount-popup-badge">Bonus Applicato!</div>
            <h2>Sconto del {discountAmount}% ottenuto!</h2>
            <p>
              Ottimo! Il tuo sconto è stato registrato e verrà applicato automaticamente alla tua prossima corsa.
            </p>
            <div className="discount-popup-spot">
              🏅 Grazie per aver usato una zona incentivata!
            </div>
            <button
              type="button"
              className="discount-popup-btn"
              onClick={() => setDiscountStep(null)}
            >
              Perfetto, grazie!
            </button>
          </div>
        </div>
      )}

      {discountStep === "denied" && (
        <div className="discount-popup-backdrop">
          <div className="discount-popup">
            <div className="discount-popup-icon">📍</div>
            <div className="discount-popup-badge">Suggerimento</div>
            <h2>La prossima volta puoi risparmiare!</h2>
            <p>
              Parcheggiando nelle zone incentivate ricevi uno sconto del <strong style={{ color: "#ff9800" }}>10%</strong> sulla corsa. Le zone sono indicate sulla mappa con il simbolo 🎯.
            </p>
            <button
              type="button"
              className="discount-popup-btn"
              onClick={() => setDiscountStep(null)}
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      {(rideEndedMsg || bookingMsg) && (
        <div className="booking-toast">{rideEndedMsg || bookingMsg}</div>
      )}

      {suspended && (
        <div className="suspended-overlay">
          <div className="suspended-modal">
            <div className="suspended-icon">🚫</div>
            <h2>Account Sospeso</h2>
            <p>
              Il tuo account è stato sospeso dall'utilizzo del servizio. Se ritieni che
              ci sia stato un errore, contatta il supporto per maggiori informazioni.
            </p>
            <a href="#" className="suspended-link">
              Maggiori informazioni
            </a>
            <button
              type="button"
              className="suspended-logout"
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                window.location.href = "/";
              }}
            >
              Esci
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
