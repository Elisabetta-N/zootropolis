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

export default function DashboardShell() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [endingRide, setEndingRide] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    bookingId: number;
    breakdown: Breakdown;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Visa •••• 4242");
  const [rideEndedMsg, setRideEndedMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [position, setPosition] = useState<Pos | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
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
      });
    }
  }, []);

  useEffect(() => {
    loadProfile();
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setPosition({ lat, lng });
      loadVehicles(lat, lng);
      loadActiveBooking();
    });
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
      setActiveBooking(null);
      setPendingPayment({
        bookingId: activeBooking.id,
        breakdown: data.breakdown,
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
          />
        </div>
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
        />
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
        onPaymentRequired={(bookingId, breakdown) => {
          setActiveBooking(null);
          setPendingPayment({ bookingId, breakdown });
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
        />
      )}

      {(rideEndedMsg || bookingMsg) && (
        <div className="booking-toast">{rideEndedMsg || bookingMsg}</div>
      )}
    </div>
  );
}
