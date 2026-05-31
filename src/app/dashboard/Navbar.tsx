export default function Navbar() {
  return (
    <div
      style={{
        height: 60,
        background: "#ff9800",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        fontWeight: "bold",
      }}
    >
      🚲 Zootropolis

      <div style={{ display: "flex", gap: 20 }}>
        <span>Profilo</span>
        <span>Mezzi</span>
        <span>Prenotazioni</span>
      </div>
    </div>
  );
}