// ============================================================
//  Capa de dades de reserves (frontend-only).
//
//  Disponibilitat de dates:
//   - Si hi ha Google Calendar configurat (data/club.js → GOOGLE_CALENDAR),
//     les dates ocupades es llegeixen del calendari públic de cada zona.
//   - Si no, es calculen amb les reserves desades al localStorage del
//     navegador (mode demostració, amb unes quantes reserves de mostra).
//
//  Les sol·licituds noves es desen localment com a "pendents". La
//  confirmació (crear l'esdeveniment al Google Calendar) la fa la junta,
//  ja que escriure al calendari no es pot fer de manera segura des del
//  navegador.
// ============================================================

import { GOOGLE_CALENDAR } from "../data/club.js";

const KEY = "ccr_reserves_v3";

// Estats possibles d'una reserva.
export const ESTATS = {
  PENDENT: "pendent",
  CONFIRMADA: "confirmada",
  REBUTJADA: "rebutjada",
};

// Sense dades de demostració: la disponibilitat surt del Google Calendar.
// (Aquí només hi quedaran les sol·licituds fetes des d'aquest navegador.)
function seed() {
  return [];
}

export function loadAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  const initial = seed();
  save(initial);
  return initial;
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    /* ignore */
  }
}

// Conjunt de dates (YYYY-MM-DD) ocupades localment per a una zona.
export function getBlockedLocal(zonaId) {
  return new Set(
    loadAll()
      .filter((r) => r.zonaId === zonaId && r.estat !== ESTATS.REBUTJADA)
      .map((r) => r.data)
  );
}

// Afegeix al `set` totes les dates que cobreix un esdeveniment de GCal.
function afegirDiesEvent(set, ev) {
  const startDate = ev.start?.date || ev.start?.dateTime?.slice(0, 10);
  if (!startDate) return;

  // Esdeveniment amb hora concreta → bloqueja només el dia d'inici.
  if (ev.start?.dateTime) {
    set.add(startDate);
    return;
  }

  // Esdeveniment de tot el dia → l'`end.date` és exclusiu.
  const endDate = ev.end?.date || startDate;
  const d = new Date(startDate + "T00:00");
  const fi = new Date(endDate + "T00:00");
  do {
    set.add(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  } while (d < fi);
}

// Dates ocupades d'una zona per a un mes concret.
// Retorna una Promise<Set<string>> amb claus YYYY-MM-DD.
export async function fetchBlockedDates(zonaId, year, month) {
  const cfg = GOOGLE_CALENDAR;
  const calId = cfg?.calendars?.[zonaId];

  if (cfg?.apiKey && calId) {
    try {
      const timeMin = new Date(year, month, 1).toISOString();
      const timeMax = new Date(year, month + 1, 1).toISOString();
      const url =
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events` +
        `?key=${cfg.apiKey}` +
        `&timeMin=${encodeURIComponent(timeMin)}` +
        `&timeMax=${encodeURIComponent(timeMax)}` +
        `&singleEvents=true&maxResults=2500`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const blocked = new Set();
        (data.items || []).forEach((ev) => afegirDiesEvent(blocked, ev));
        // També es tenen en compte les sol·licituds fetes des del web.
        getBlockedLocal(zonaId).forEach((d) => blocked.add(d));
        return blocked;
      }
    } catch (e) {
      /* en cas d'error, es cau al càlcul local */
    }
  }

  return getBlockedLocal(zonaId);
}

export function createReservation(reserva) {
  const list = loadAll();
  if (getBlockedLocal(reserva.zonaId).has(reserva.data)) {
    return { ok: false, error: "Aquesta data ja està ocupada." };
  }
  const nova = {
    id: "r-" + Date.now(),
    estat: ESTATS.PENDENT,
    creada: new Date().toISOString(),
    ...reserva,
  };
  list.push(nova);
  save(list);
  return { ok: true, reserva: nova };
}

export function getReserves() {
  return loadAll();
}
