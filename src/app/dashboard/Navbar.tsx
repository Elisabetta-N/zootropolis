"use client";

import type { Panel } from "./types";

type Props = {
  activePanel: Panel;
  onNavigate: (panel: Panel) => void;
};

export default function Navbar({ activePanel, onNavigate }: Props) {
  const links: { key: Panel; label: string }[] = [
    { key: "profile", label: "Profilo" },
    { key: "bookings", label: "Prenotazioni" },
    { key: "settings", label: "Impostazioni" },
  ];

  return (
    <nav className="dash-navbar">
      <span className="dash-brand">🚲 Zootropolis</span>

      <div className="dash-nav-links">
        {links.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`dash-nav-btn ${activePanel === key ? "dash-nav-btn--active" : ""}`}
            onClick={() => onNavigate(activePanel === key ? null : key)}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
