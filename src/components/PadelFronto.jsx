import { MP_CENTROS } from "../data/club.js";

// Bloc reutilitzable de Pàdel / Frontó (reserva via app MP Centros).
// S'usa tant a la Home com a la pàgina de Reserves.
export default function PadelFronto() {
  const zona = MP_CENTROS.zones[0];
  return (
    <div className="mp-card">
      <div className="mp-card__icon">{zona.emoji}</div>
      <div className="mp-card__body">
        <h3 style={{ margin: "0 0 6px" }}>{zona.nom}</h3>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          La reserva de pàdel i frontó es fa des de l'app{" "}
          <strong>{MP_CENTROS.nom}</strong>, no des d'aquest web. El pagament dels
          convidats no socis també es gestiona des de la mateixa app.
        </p>
      </div>
      <div className="mp-card__actions">
        {MP_CENTROS.url && (
          <a
            className="btn btn--primary"
            href={MP_CENTROS.url}
            target="_blank"
            rel="noreferrer"
          >
            Reservar a {MP_CENTROS.nom}
          </a>
        )}
        <a
          className="btn btn--outline"
          href={MP_CENTROS.androidUrl}
          target="_blank"
          rel="noreferrer"
        >
          App Android
        </a>
        <a
          className="btn btn--outline"
          href={MP_CENTROS.iosUrl}
          target="_blank"
          rel="noreferrer"
        >
          App iPhone
        </a>
      </div>
    </div>
  );
}
