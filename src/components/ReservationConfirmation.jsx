import { useEffect, useMemo, useState } from "react";
import { getPaymentStatus } from "../lib/payments.js";
import {
  clearReservationConfirmation,
  readReservationConfirmation,
} from "../lib/reservationConfirmation.js";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(`${value}:00`).toLocaleString("ca-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReservationConfirmation({ go }) {
  const [confirmation, setConfirmation] = useState(() =>
    readReservationConfirmation()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reservationIntentId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return String(params.get("reservation_intent_id") || "").trim();
  }, []);

  useEffect(() => {
    if (!reservationIntentId) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    getPaymentStatus(reservationIntentId)
      .then((status) => {
        if (cancelled) return;
        setConfirmation((current) => ({
          ...(current || {}),
          reservationIntentId,
          status: status?.status || current?.status || "reservation_created",
          courtName: status?.zonaNom || current?.courtName || "Pista",
          slotStart: status?.slotStart || current?.slotStart || "",
          slotEnd: status?.slotEnd || current?.slotEnd || "",
          bookerName: status?.nom || current?.bookerName || "",
          email: status?.email || current?.email || "",
          peopleCount: status?.persones || current?.peopleCount || "",
          eventId: status?.eventId || current?.eventId || null,
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error && err.message
            ? err.message
            : "No s'ha pogut consultar l'estat final de la reserva."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reservationIntentId]);

  const players = Array.isArray(confirmation?.players)
    ? confirmation.players.filter(Boolean)
    : [];

  if (!confirmation && !loading) {
    return (
      <section className="section">
        <div className="container">
          <div className="confirmation">
            <div className="card confirmation__card" style={{ textAlign: "center" }}>
              <h1 style={{ marginTop: 0 }}>No hem trobat cap reserva recent</h1>
              <p style={{ color: "var(--muted)" }}>
                Torna a la secció de reserves per consultar la disponibilitat o fer
                una nova reserva.
              </p>
              <div className="confirmation__actions">
                <button className="btn btn--primary" onClick={() => go("reserves-courts")}>
                  Anar a reserves
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="confirmation">
          <div className="confirmation__hero">
            <span className="confirmation__badge">Reserva confirmada</span>
            <h1>Reserva confirmada</h1>
            <p>La reserva ha quedat registrada correctament.</p>
            <div className="confirmation__hero-meta">
              <strong>{confirmation?.courtName || "Pista"}</strong>
              <span>{formatDateTime(confirmation?.slotStart)}</span>
            </div>
          </div>

          {error && <div className="alert alert--err">{error}</div>}
          {loading && (
            <div className="alert alert--info">
              Estem actualitzant les dades finals de la reserva…
            </div>
          )}

          {players.length > 0 && (
            <article className="card confirmation__card" style={{ marginTop: 22 }}>
              <h3>Jugadors</h3>
              <div className="confirmation__players">
                {players.map((player) => (
                  <div key={player} className="confirmation__player">
                    {player}
                  </div>
                ))}
              </div>
            </article>
          )}

          <div className="confirmation__actions">
            <button
              className="btn btn--primary"
              onClick={() => {
                clearReservationConfirmation();
                go("home");
              }}
            >
              Tornar a l&apos;inici
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
