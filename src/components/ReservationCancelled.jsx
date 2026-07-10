import { useEffect, useMemo, useState } from "react";
import { getPaymentStatus } from "../lib/payments.js";
import {
  clearReservationConfirmation,
  clearReservationError,
  readReservationError,
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

export default function ReservationCancelled({ go }) {
  const [errorState, setErrorState] = useState(() => readReservationError());
  const reservationIntentId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return String(params.get("reservation_intent_id") || "").trim();
  }, []);

  useEffect(() => {
    if (!reservationIntentId) return;

    let cancelled = false;
    getPaymentStatus(reservationIntentId)
      .then((status) => {
        if (cancelled) return;
        setErrorState((current) => ({
          ...(current || {}),
          courtName: status?.zonaNom || current?.courtName || "Pista",
          slotStart: status?.slotStart || current?.slotStart || "",
          slotEnd: status?.slotEnd || current?.slotEnd || "",
          bookerName: status?.nom || current?.bookerName || "",
          email: status?.email || current?.email || "",
          peopleCount: status?.persones || current?.peopleCount || "",
        }));
      })
      .catch(() => {
        // best effort only
      });

    return () => {
      cancelled = true;
    };
  }, [reservationIntentId]);

  return (
    <section className="section">
      <div className="container">
        <div className="confirmation">
          <div
            className="confirmation__hero confirmation__hero--error"
          >
            <span className="confirmation__badge">Reserva no confirmada</span>
            <h1>Reserva no confirmada</h1>
            <p>
              La reserva no s&apos;ha arribat a confirmar. Pots revisar les dades i
              tornar-ho a provar.
            </p>
            <div className="confirmation__hero-meta">
              <strong>{errorState?.courtName || "Pista"}</strong>
              <span>{formatDateTime(errorState?.slotStart)}</span>
            </div>
          </div>

          <div className="grid grid--2">
            <article className="card confirmation__card">
              <h3>Dades de la reserva</h3>
              <div className="confirmation__list">
                <div>
                  <span>Instal·lació</span>
                  <strong>{errorState?.courtName || "Pista"}</strong>
                </div>
                <div>
                  <span>Dia i hora</span>
                  <strong>{formatDateTime(errorState?.slotStart)}</strong>
                </div>
                <div>
                  <span>Nom principal</span>
                  <strong>{errorState?.bookerName || "—"}</strong>
                </div>
                <div>
                  <span>Correu</span>
                  <strong>{errorState?.email || "—"}</strong>
                </div>
              </div>
            </article>

            <article className="card confirmation__card">
              <h3>Incidència</h3>
              <p style={{ color: "var(--muted)", marginTop: 0 }}>
                {errorState?.message ||
                  "Has cancel·lat el procés o s'ha produït un error abans de confirmar la reserva."}
              </p>
            </article>
          </div>

          <div className="confirmation__actions">
            <button
              className="btn btn--primary"
              onClick={() => {
                clearReservationConfirmation();
                clearReservationError();
                go("reserves-courts");
              }}
            >
              Tornar a provar
            </button>
            <button
              className="btn btn--outline"
              onClick={() => {
                clearReservationConfirmation();
                clearReservationError();
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
