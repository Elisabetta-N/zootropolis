import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SuspendedPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");

  if (!userId) redirect("/");

  return (
    <div className="suspended-screen">
      <div className="suspended-container">
        <div className="suspended-icon">🚫</div>
        <h1>Account Sospeso</h1>
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
            redirect("/");
          }}
        >
          Esci
        </button>
      </div>
    </div>
  );
}
