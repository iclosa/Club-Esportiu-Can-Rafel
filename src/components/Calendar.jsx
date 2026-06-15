import { useEffect, useState } from "react";
import { fetchBlockedDates } from "../lib/reservations.js";

const DOW = ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"];
const MESOS = [
  "gener", "febrer", "març", "abril", "maig", "juny",
  "juliol", "agost", "setembre", "octubre", "novembre", "desembre",
];

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

export default function Calendar({ zonaId, selected, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [blocked, setBlocked] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  // Setmana comença en dilluns.
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Carrega les dates ocupades de la zona/mes (Google Calendar o local).
  useEffect(() => {
    let viu = true;
    setLoading(true);
    fetchBlockedDates(zonaId, year, month).then((set) => {
      if (viu) {
        setBlocked(set);
        setLoading(false);
      }
    });
    return () => {
      viu = false;
    };
  }, [zonaId, year, month]);

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));

  return (
    <div className="cal">
      <div className="cal__head">
        <button type="button" onClick={prevMonth} aria-label="Mes anterior">
          ‹
        </button>
        <strong>
          {MESOS[month]} {year}
        </strong>
        <button type="button" onClick={nextMonth} aria-label="Mes següent">
          ›
        </button>
      </div>
      <div className="cal__grid">
        {DOW.map((d) => (
          <div className="cal__dow" key={d}>
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div className="cal__day empty" key={"e" + i} />;
          const key = ymd(date);
          const past = date < today;
          const ocupat = !past && blocked.has(key);
          const isSel = selected === key;
          return (
            <button
              type="button"
              key={key}
              disabled={past || ocupat}
              onClick={() => onSelect(key)}
              className={`cal__day ${ocupat ? "full" : ""} ${isSel ? "selected" : ""}`}
              title={ocupat ? "Ocupat" : ""}
            >
              {date.getDate()}
              {ocupat && <span className="dot" />}
            </button>
          );
        })}
      </div>
      <div className="cal__legend">
        <span><i style={{ background: "var(--sand)" }} /> Lliure</span>
        <span><i style={{ background: "var(--danger)" }} /> Ocupat</span>
        {loading && <span style={{ marginLeft: "auto" }}>Carregant…</span>}
      </div>
    </div>
  );
}
