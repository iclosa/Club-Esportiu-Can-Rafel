import { useEffect, useState } from "react";
import { fetchAvailability } from "../lib/reservations.js";

const DOW = ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"];
const MESOS = [
  "gener", "febrer", "març", "abril", "maig", "juny",
  "juliol", "agost", "setembre", "octubre", "novembre", "desembre",
];

function ymd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Calendar({
  appointmentTypeId,
  durationMinutes,
  selected,
  onSelect,
  onAvailabilityChange,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [availability, setAvailability] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    fetchAvailability(appointmentTypeId, year, month, { durationMinutes })
      .then((data) => {
        if (!alive) return;
        const next = new Map(
          (data?.days || []).map((day) => [day.date, day.slots || []])
        );
        setAvailability(next);
        onAvailabilityChange?.(next);
      })
      .catch((err) => {
        if (!alive) return;
        setAvailability(new Map());
        onAvailabilityChange?.(new Map());
        setError(
          err instanceof Error
            ? err.message
            : "No s'ha pogut carregar la disponibilitat."
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [appointmentTypeId, durationMinutes, year, month, onAvailabilityChange]);

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }

  return (
    <div className="cal">
      <div className="cal__head">
        <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          ‹
        </button>
        <strong>
          {MESOS[month]} {year}
        </strong>
        <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          ›
        </button>
      </div>

      <div className="cal__grid">
        {DOW.map((day) => (
          <div className="cal__dow" key={day}>
            {day}
          </div>
        ))}

        {cells.map((date, i) => {
          if (!date) return <div className="cal__day empty" key={`e-${i}`} />;

          const key = ymd(date);
          const past = date < today;
          const slots = availability.get(key) || [];
          const available = !past && slots.length > 0;
          const isSel = selected === key;

          return (
            <button
              type="button"
              key={key}
              disabled={!available}
              onClick={() => onSelect(key)}
              className={`cal__day ${available ? "" : "full"} ${isSel ? "selected" : ""}`}
              title={available ? `${slots.length} franges disponibles` : "No disponible"}
            >
              {date.getDate()}
              {available && <span className="dot" />}
            </button>
          );
        })}
      </div>

      <div className="cal__legend">
        <span><i style={{ background: "var(--sand)" }} /> Sense franges</span>
        <span><i style={{ background: "var(--danger)" }} /> Disponible</span>
        {loading && <span style={{ marginLeft: "auto" }}>Carregant…</span>}
      </div>

      {error && (
        <p className="hint" style={{ color: "var(--danger)", marginTop: 12 }}>
          {error}
        </p>
      )}
    </div>
  );
}
