import Navbar from "./Navbar";
import "leaflet/dist/leaflet.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <Navbar />
      <main className="content">{children}</main>
    </div>
  );
}