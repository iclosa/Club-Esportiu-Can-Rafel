export default function Navbar({ view, go, auth, onLogout }) {
  const links = [
    { id: "home", label: "Inici" },
    { id: "info", label: "Informació" },
  ];
  if (!auth?.loggedIn) {
    links.splice(2, 0, { id: "alta", label: "Fes-te soci" });
  }
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
              onClick={() => go(l.id)}
            >
              {l.label}
            </button>
          ))}
          <div
            className={`nav__submenu ${
              view.startsWith("reserves-") ||
              view === "reservation-confirmed" ||
              view === "reservation-cancelled"
                ? "active"
                : ""
            }`}
          >
            <button
              type="button"
              className={
                view.startsWith("reserves-") ||
                view === "reservation-confirmed" ||
                view === "reservation-cancelled"
                  ? "active"
                  : ""
              }
              onClick={() => go("reserves-zones")}
            >
              Reserves
            </button>
            <div className="nav__submenu-menu">
              <button type="button" onClick={() => go("reserves-zones")}>
                Zones socials
              </button>
              <button type="button" onClick={() => go("reserves-courts")}>
                Pàdel i frontó
              </button>
            </div>
          </div>
          {auth?.loggedIn ? (
            <button type="button" onClick={onLogout}>
              Sortir
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
