export default function Navbar({ view, go }) {
  const links = [
    { id: "home", label: "Inici" },
    { id: "info", label: "Informació" },
    { id: "alta", label: "Fes-te soci" },
    { id: "reserves", label: "Reserves" },
  ];
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
        </nav>
      </div>
    </header>
  );
}
