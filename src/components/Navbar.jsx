import { useEffect, useRef, useState } from "react";

export default function Navbar({ view, go, auth, onLogout }) {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const submenuRef = useRef(null);
  const links = [
    { id: "home", label: "Inici" },
    { id: "info", label: "Informació" },
  ];
  if (!auth?.loggedIn) {
    links.splice(2, 0, { id: "alta", label: "Fes-te soci" });
  }

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!submenuRef.current?.contains(event.target)) {
        setSubmenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const isReservationsView =
    view.startsWith("reserves-") ||
    view === "reservation-confirmed" ||
    view === "reservation-cancelled";

  return (
    <header className="nav">
      <div className="container nav__inner">
        <button className="brand" onClick={() => go("home")}>
          <img src="/pine.svg" alt="" />
          Club Esportiu Can Rafel
        </button>
        <nav className="nav__links">
          {links.map((l) => (
            <button
              key={l.id}
              className={view === l.id ? "active" : ""}
              onClick={() => {
                setSubmenuOpen(false);
                go(l.id);
              }}
            >
              {l.label}
            </button>
          ))}
          <div
            ref={submenuRef}
            className={`nav__submenu ${isReservationsView ? "active" : ""} ${
              submenuOpen ? "open" : ""
            }`}
          >
            <button
              type="button"
              aria-expanded={submenuOpen}
              className={isReservationsView ? "active" : ""}
              onClick={() => setSubmenuOpen((current) => !current)}
            >
              Reserves
            </button>
            <div className="nav__submenu-menu">
              <button
                type="button"
                onClick={() => {
                  setSubmenuOpen(false);
                  go("reserves-zones");
                }}
              >
                Zones socials
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmenuOpen(false);
                  go("reserves-courts");
                }}
              >
                Pàdel i frontó
              </button>
            </div>
          </div>
          {auth?.loggedIn ? (
            <button type="button" className="nav__logout" onClick={onLogout}>
              Sortir
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
