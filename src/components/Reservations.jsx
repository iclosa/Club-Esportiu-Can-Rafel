import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CLUB, COURTS, ZONES } from "../data/club.js";
import { searchClubMembers } from "../lib/members.js";
import { createCheckoutSession, getPaymentStatus } from "../lib/payments.js";
import {
  goToReservationCancelled,
  goToReservationConfirmation,
  storeReservationError,
  storeReservationConfirmation,
} from "../lib/reservationConfirmation.js";
import { createReservation } from "../lib/reservations.js";
import Calendar from "./Calendar.jsx";

const IS_TEST_MODE = import.meta.env.DEV;
const TEST_EMAIL = "isaac.closa+01@gmail.com";

function getBaseContact(auth) {
  const loggedIn = Boolean(auth?.loggedIn);
  const resolvedEmail = loggedIn
    ? String(
        auth?.email ||
          (typeof auth?.login === "string" && auth.login.includes("@")
            ? auth.login
            : "")
      )
        .trim()
        .toLowerCase()
    : IS_TEST_MODE
      ? TEST_EMAIL
      : "";

  return {
    nom: loggedIn ? auth?.name || "" : IS_TEST_MODE ? "Isaac Closa" : "",
    email: resolvedEmail,
    telefon: loggedIn ? auth?.phone || "" : IS_TEST_MODE ? "664029696" : "",
  };
}

function getDefaultZoneForm(auth) {
  return {
    ...getBaseContact(auth),
    persones: IS_TEST_MODE ? "4" : "",
    motiu: IS_TEST_MODE ? "Prova de reserva web" : "",
  };
}

function getPlayerCount(court, gameType) {
  if (court.jugadorsFixos) return court.jugadorsFixos;
  const totalPlayers = court.jugadorsPerTipus?.[gameType] || 0;
  return Math.max(totalPlayers - 1, 0);
}

function buildPlayerDefaults(count) {
  return Array.from({ length: count }, () => ({
    id: null,
    name: "",
    email: "",
    phone: "",
    tags: [],
  }));
}

function getDefaultCourtForm(auth, court) {
  const firstDuration = court.durades[0]?.value || 60;
  const firstType = court.tipus[0]?.value || "";
  return {
    ...getBaseContact(auth),
    durada: String(firstDuration),
    tipus: firstType,
    jugadors: buildPlayerDefaults(getPlayerCount(court, firstType)),
  };
}

function formatSelectedSlot(slot) {
  if (!slot) return null;
  return new Date(`${slot.start}:00`).toLocaleDateString("ca-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildCourtMotiu(court, form) {
  const durada = `${form.durada} min`;
  const tipus = form.tipus ? `Tipus: ${form.tipus}` : null;
  const jugadors = [
    `Jugador principal: ${form.nom}`,
    ...form.jugadors
      .filter((player) => player.id && player.name.trim())
      .map((player, index) => `Acompanyant ${index + 1}: ${player.name}`),
  ];

  return [
    `Reserva ${court.nom}`,
    `Durada: ${durada}`,
    tipus,
    "Jugadors:",
    ...jugadors,
  ]
    .filter(Boolean)
    .join("\n");
}

function getGameTypeLabel(court, gameType) {
  return court.tipus.find((item) => item.value === gameType)?.label || "";
}

function buildConfirmationPayload({
  auth,
  court,
  form,
  slot,
  totalPeople,
  totalAmountEuros,
  eventId = null,
  invoiceId = null,
  reservationIntentId = "",
}) {
  return {
    reservationIntentId,
    status: "reservation_created",
    courtName: court.nom,
    durationLabel: "60 min",
    gameTypeLabel: getGameTypeLabel(court, form.tipus),
    slotStart: slot?.start || "",
    slotEnd: slot?.end || "",
    bookerName: form.nom,
    email: form.email || auth?.email || "",
    peopleCount: totalPeople,
    amountEuros: totalAmountEuros,
    eventId,
    invoiceId,
    players: [
      form.nom,
      ...form.jugadors
        .map((player) => player.name?.trim() || "")
        .filter(Boolean),
    ],
  };
}

function buildZoneConfirmationPayload({
  auth,
  zona,
  form,
  slot,
  eventId = null,
}) {
  return {
    status: "reservation_created",
    courtName: zona.nom,
    durationLabel: slot?.label || "Tot el dia",
    gameTypeLabel: "",
    slotStart: slot?.start || "",
    slotEnd: slot?.end || "",
    bookerName: form.nom,
    email: form.email || auth?.email || "",
    peopleCount: Number(form.persones) || "",
    amountEuros: 0,
    eventId,
    players: [],
  };
}

function formatPrice(amountEuros) {
  return new Intl.NumberFormat("ca-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: amountEuros % 1 === 0 ? 0 : 2,
  }).format(amountEuros);
}

function getMemberSummary(member) {
  const tags = Array.isArray(member?.tags) ? member.tags.filter(Boolean) : [];
  return tags.join(", ") || "Soci del club";
}

function LoginBox({ onLogin }) {
  const [login, setLogin] = useState(IS_TEST_MODE ? TEST_EMAIL : "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await onLogin({ login, password });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "No s'ha pogut iniciar la sessió."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form" style={{ maxWidth: 560, margin: "0 auto 28px" }}>
      <h3 style={{ marginTop: 0 }}>Accés de socis</h3>
      <p className="hint">
        Si no has iniciat sessió, ara no podràs reservar.
      </p>

      <form onSubmit={submit}>
        <div className="field">
          <label>Correu o usuari *</label>
          <input
            required
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Contrasenya *</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="alert alert--err" style={{ marginTop: 0 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={loading}
        >
          {loading ? "Entrant…" : "Iniciar sessió"}
        </button>
      </form>
    </div>
  );
}

function MemberCombobox({ index, value, onSelect, auth, selectedIds }) {
  const [query, setQuery] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    setQuery(value?.name || "");
  }, [value?.id, value?.name]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchClubMembers(query, 5);
        const members = Array.isArray(data?.members) ? data.members : [];
        const filtered = members.filter(
          (member) =>
            member.id !== auth?.partnerId &&
            (!selectedIds.includes(member.id) || member.id === value?.id)
        );
        setResults(filtered.slice(0, 5));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [query]);

  return (
    <div className="member-picker">
      <div className="member-card">
        <div className="member-card__avatar">
          {value?.name ? value.name.charAt(0).toUpperCase() : "?"}
        </div>
        <div className="member-card__body">
          <strong>{value?.name || "Afegir jugador"}</strong>
          <small>
            {value?.id ? getMemberSummary(value) : "Convidat no soci · 7 €"}
          </small>
        </div>
        <button
          type="button"
          className="btn btn--outline"
          style={{ padding: "8px 14px" }}
          onClick={() => setOpen((current) => !current)}
        >
          {value?.id ? "Canviar" : "Afegir"}
        </button>
      </div>
      {open && (
        <div className="member-picker__menu">
          <div className="field" style={{ marginBottom: 6 }}>
            <input
              placeholder="Cerca un soci"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSelect({
                  id: null,
                  name: "",
                  email: "",
                  phone: "",
                  tags: [],
                });
              }}
            />
          </div>
          {loading && <div className="member-picker__item">Cercant socis…</div>}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="member-picker__item">No s&apos;han trobat socis.</div>
          )}
          {!loading &&
            results.map((member) => (
              <button
                key={member.id}
                type="button"
                className="member-picker__item member-picker__item--button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(member);
                  setQuery(member.name);
                  setOpen(false);
                }}
              >
                <strong>{member.name}</strong>
                <small>
                  {getMemberSummary(member)}
                  {member.email ? ` · ${member.email}` : ""}
                </small>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function ZoneReservations({ auth }) {
  const [zonaId, setZonaId] = useState(ZONES[0].id);
  const [form, setForm] = useState(getDefaultZoneForm(auth));
  const [data, setData] = useState(null);
  const [slot, setSlot] = useState(null);
  const [availability, setAvailability] = useState(new Map());
  const [resultat, setResultat] = useState(null);
  const [enviant, setEnviant] = useState(false);

  const zona = ZONES.find((z) => z.id === zonaId);
  const slotsDia = data ? availability.get(data) || [] : [];
  const esTotElDia = slotsDia.length === 1 && slotsDia[0]?.label === "Tot el dia";
  const completable =
    auth?.loggedIn &&
    slot &&
    form.nom.trim() &&
    form.email.trim() &&
    Number(form.persones) > 0 &&
    form.motiu.trim();

  const onAvailabilityChange = useCallback((next) => {
    setAvailability(next);
  }, []);

  useEffect(() => {
    setForm(getDefaultZoneForm(auth));
  }, [auth]);

  useEffect(() => {
    if (!data) return;
    if (slotsDia.length === 1) {
      setSlot(slotsDia[0]);
      return;
    }
    if (slot && !slotsDia.some((item) => item.start === slot.start)) {
      setSlot(null);
    }
  }, [data, slotsDia, slot]);

  const triarZona = (id) => {
    setZonaId(id);
    setData(null);
    setSlot(null);
    setResultat(null);
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!completable || enviant) return;

    setEnviant(true);
    try {
      const resp = await createReservation({
        appointmentTypeId: zona.appointmentTypeId,
        zonaId: zona.id,
        zonaNom: zona.nom,
        nom: form.nom,
        email: form.email,
        telefon: form.telefon || null,
        persones: Number(form.persones),
        motiu: form.motiu,
        soci: true,
        slotStart: slot.start,
        slotEnd: slot.end,
      });

      if (!resp.ok) {
        throw new Error(resp.error || "No s'ha pogut crear la reserva.");
      }

      storeReservationConfirmation(
        buildZoneConfirmationPayload({
          auth,
          zona,
          form,
          slot,
          eventId: resp?.reserva?.id || null,
        })
      );
      setForm(getDefaultZoneForm(auth));
      setData(null);
      setSlot(null);
      goToReservationConfirmation();
    } catch (err) {
      setResultat({
        ok: false,
        error:
          err instanceof Error && err.message
            ? err.message
            : `No s'ha pogut enviar la reserva. Escriu-nos a ${CLUB.email}.`,
      });
    } finally {
      setEnviant(false);
    }
  };

  return (
    <>
      <h2 className="section__title">Zones socials</h2>
      <p className="section__lead">
        Reserves de barbacoa, terrassa, pista multiesportiva i sala polivalent.
      </p>

      <div className="zones">
        {ZONES.map((z) => (
          <button
            key={z.id}
            className={`zone-pick ${z.id === zonaId ? "active" : ""}`}
            onClick={() => triarZona(z.id)}
          >
            <span className="e">{z.emoji}</span>
            <strong>{z.nom}</strong>
            <small>{z.capacitat}</small>
          </button>
        ))}
      </div>

      <div className="reserve-layout">
        <div>
          <Calendar
            appointmentTypeId={zona.appointmentTypeId}
            selected={data}
            onSelect={(nextDate) => {
              setData(nextDate);
              setSlot(null);
              setResultat(null);
            }}
            onAvailabilityChange={onAvailabilityChange}
          />
        </div>

        <div>
          <div className="norms">
            <h4>
              {zona.emoji} {zona.nom}
            </h4>
            <p style={{ marginTop: 0 }}>{zona.descripcio}</p>
            <p className="price-row">
              <span className="price-tag price-tag--soci">
                Socis: {zona.preuSoci}
              </span>
            </p>
            <h4 style={{ marginTop: 14 }}>Normes de la zona</h4>
            <ul>
              {zona.normes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>

          <form className="form" onSubmit={enviar}>
            <div className="alert alert--info" style={{ marginTop: 0 }}>
              {slot ? (
                <>
                  {esTotElDia ? "Dia seleccionat: " : "Franja seleccionada: "}
                  <strong>
                    {formatSelectedSlot(slot)} {!esTotElDia && <>· {slot.label}</>}
                  </strong>
                </>
              ) : esTotElDia ? (
                "Selecciona una data disponible."
              ) : (
                "Selecciona una data i una franja disponible."
              )}
            </div>

            <div className="field">
              <label>Nombre de persones *</label>
              <input
                required
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="P. ex. 12"
                value={form.persones}
                onChange={(e) => setForm({ ...form, persones: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Motiu de la reserva *</label>
              <textarea
                required
                rows={3}
                placeholder="P. ex. dinar familiar, aniversari, partit..."
                value={form.motiu}
                onChange={(e) => setForm({ ...form, motiu: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={!completable || enviant}
            >
              {enviant ? "Enviant…" : "Reservar"}
            </button>
          </form>

          {resultat && resultat.ok && (
            <div className="alert alert--ok" style={{ marginTop: 18 }}>
              Reserva enviada correctament.
            </div>
          )}
          {resultat && !resultat.ok && (
            <div className="alert alert--err" style={{ marginTop: 18 }}>
              {resultat.error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CourtReservations({ auth }) {
  const initialPaymentParamsRef = useRef(
    new URLSearchParams(window.location.search)
  );
  const keepPaymentFeedbackRef = useRef(
    initialPaymentParamsRef.current.has("payment")
  );
  const [courtId, setCourtId] = useState(COURTS[0].id);
  const court = useMemo(
    () => COURTS.find((item) => item.id === courtId) || COURTS[0],
    [courtId]
  );
  const [form, setForm] = useState(getDefaultCourtForm(auth, court));
  const [data, setData] = useState(null);
  const [slot, setSlot] = useState(null);
  const [availability, setAvailability] = useState(new Map());
  const [resultat, setResultat] = useState(null);
  const [enviant, setEnviant] = useState(false);

  const slotsDia = data ? availability.get(data) || [] : [];
  const playerCount = getPlayerCount(court, form.tipus);
  const totalPeople = playerCount + 1;
  const selectedPlayerIds = form.jugadors
    .map((player) => player.id)
    .filter(Boolean);
  const guestCount = Math.max(totalPeople - (1 + selectedPlayerIds.length), 0);
  const totalAmountEuros = guestCount * 7;
  const completable =
    auth?.loggedIn &&
    slot &&
    form.nom.trim() &&
    form.email.trim() &&
    (!court.tipus.length || form.tipus);

  const onAvailabilityChange = useCallback((next) => {
    setAvailability(next);
  }, []);

  useEffect(() => {
    const params = initialPaymentParamsRef.current;
    const paymentStatus = params.get("payment");
    const reservationIntentId = params.get("reservation_intent_id");

    if (paymentStatus === "cancel") {
      storeReservationError({
        message: "Pagament cancel·lat. La reserva no s'ha arribat a confirmar.",
      });
      goToReservationCancelled();
      return;
    } else if (paymentStatus === "success") {
      setResultat({
        ok: true,
        message: "Pagament rebut. Estem confirmant la reserva…",
      });

      window.history.replaceState({}, "", window.location.pathname);

      if (reservationIntentId) {
        let cancelled = false;
        const poll = async () => {
          for (let attempt = 0; attempt < 10; attempt += 1) {
            try {
              const status = await getPaymentStatus(reservationIntentId);
              if (cancelled) return;

              if (status?.status === "reservation_created") {
                storeReservationConfirmation(
                  buildConfirmationPayload({
                    auth,
                    court,
                    form,
                    slot,
                    totalPeople,
                    totalAmountEuros:
                      typeof status?.amountCents === "number"
                        ? status.amountCents / 100
                        : totalAmountEuros,
                    eventId: status?.eventId || null,
                    invoiceId: status?.invoiceId || null,
                    reservationIntentId,
                  })
                );
                goToReservationConfirmation(
                  new URLSearchParams({
                    reservation_intent_id: reservationIntentId,
                  }).toString()
                );
                return;
              }

              if (
                status?.status === "failed" ||
                status?.status === "expired" ||
                status?.status === "cancelled"
              ) {
                setResultat({
                  ok: false,
                  error:
                    status?.lastError ||
                    "El pagament s'ha completat, però la reserva no s'ha pogut confirmar.",
                });
                storeReservationError({
                  message:
                    status?.lastError ||
                    "El pagament s'ha completat, però la reserva no s'ha pogut confirmar.",
                });
                goToReservationCancelled(
                  new URLSearchParams({
                    reservation_intent_id: reservationIntentId,
                  }).toString()
                );
                return;
              }
            } catch {
              // ignore transient polling errors
            }

            await new Promise((resolve) => window.setTimeout(resolve, 1500));
          }

          if (!cancelled) {
            setResultat({
              ok: true,
              message:
                "Pagament rebut. La reserva s'està processant i rebràs la confirmació en breu.",
            });
          }
        };

        poll();
        return () => {
          cancelled = true;
        };
      }
    } else {
      return;
    }

    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  useEffect(() => {
    setForm(getDefaultCourtForm(auth, court));
    setData(null);
    setSlot(null);
    if (keepPaymentFeedbackRef.current) {
      keepPaymentFeedbackRef.current = false;
    } else {
      setResultat(null);
    }
  }, [auth, court]);

  useEffect(() => {
    setForm((current) => {
      const nextPlayers = [...current.jugadors];
      while (nextPlayers.length < playerCount) {
        nextPlayers.push({
          id: null,
          name: "",
          email: "",
          phone: "",
          tags: [],
        });
      }
      return {
        ...current,
        jugadors: nextPlayers.slice(0, playerCount),
      };
    });
    setSlot(null);
    if (keepPaymentFeedbackRef.current) {
      keepPaymentFeedbackRef.current = false;
    } else {
      setResultat(null);
    }
  }, [playerCount, form.tipus]);

  useEffect(() => {
    if (!data) return;
    if (slot && !slotsDia.some((item) => item.start === slot.start)) {
      setSlot(null);
    }
  }, [data, slotsDia, slot]);

  const updatePlayer = (index, member) => {
    setForm((current) => {
      const jugadors = [...current.jugadors];
      jugadors[index] = member;
      return { ...current, jugadors };
    });
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!completable || enviant) return;

    setEnviant(true);
    try {
      const payload = {
        appointmentTypeId: court.appointmentTypeId,
        zonaId: court.id,
        zonaNom: court.nom,
        nom: form.nom,
        email: form.email,
        telefon: form.telefon || null,
        persones: totalPeople,
        motiu: buildCourtMotiu(court, form),
        selectedPartnerIds: selectedPlayerIds,
        soci: true,
        slotStart: slot.start,
        slotEnd: slot.end,
      };

      const checkout = await createCheckoutSession(payload);
      if (checkout?.requiresPayment && checkout.checkoutUrl) {
        window.location.assign(checkout.checkoutUrl);
        return;
      }

      const resp = await createReservation(payload);

      if (!resp.ok) {
        throw new Error(resp.error || "No s'ha pogut crear la reserva.");
      }

      setResultat({
        ok: true,
        message: "Reserva de pista enviada correctament.",
      });
      storeReservationConfirmation(
        buildConfirmationPayload({
          auth,
          court,
          form,
          slot,
          totalPeople,
          totalAmountEuros,
          eventId: resp?.reserva?.id || null,
        })
      );
      setForm(getDefaultCourtForm(auth, court));
      setData(null);
      setSlot(null);
      goToReservationConfirmation();
    } catch (err) {
      setResultat({
        ok: false,
        error:
          err instanceof Error && err.message
            ? err.message
            : `No s'ha pogut enviar la reserva. Escriu-nos a ${CLUB.email}.`,
      });
    } finally {
      setEnviant(false);
    }
  };

  return (
    <>
      <h2 className="section__title">Pàdel i frontó</h2>
      <p className="section__lead">
        Reserva de pistes esportives amb horaris i disponibilitat reals d&apos;Odoo.
      </p>

      {resultat && resultat.ok && (
        <div className="alert alert--ok" style={{ marginBottom: 18 }}>
          {resultat.message || "Reserva de pista enviada correctament."}
        </div>
      )}
      {resultat && !resultat.ok && (
        <div className="alert alert--err" style={{ marginBottom: 18 }}>
          {resultat.error}
        </div>
      )}

      <div className="zones">
        {COURTS.map((item) => (
          <button
            key={item.id}
            className={`zone-pick ${item.id === courtId ? "active" : ""}`}
            onClick={() => setCourtId(item.id)}
          >
            <span className="e">{item.emoji}</span>
            <strong>{item.nom}</strong>
            <small>{item.capacitat}</small>
          </button>
        ))}
      </div>

      <div className="reserve-layout">
        <div>
          <Calendar
            appointmentTypeId={court.appointmentTypeId}
            durationMinutes={Number(form.durada)}
            selected={data}
            onSelect={(nextDate) => {
              setData(nextDate);
              setSlot(null);
              setResultat(null);
            }}
            onAvailabilityChange={onAvailabilityChange}
          />
        </div>

        <div>
          <form className="form" onSubmit={enviar}>
            <div className="alert alert--info" style={{ marginTop: 0 }}>
              {slot ? (
                <>
                  Hora seleccionada:{" "}
                  <strong>
                    {formatSelectedSlot(slot)} · {slot.label}
                  </strong>
                </>
              ) : (
                "Selecciona un dia disponible i una hora."
              )}
            </div>

            <div className="row">
              {court.tipus.length > 0 && (
                <div className="field">
                  <label>Tipus *</label>
                  <select
                    value={form.tipus}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, tipus: e.target.value }))
                    }
                  >
                    {court.tipus.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="field">
                <label>Hora *</label>
                <select
                  value={slot?.start || ""}
                  onChange={(e) => {
                    const nextSlot =
                      slotsDia.find((item) => item.start === e.target.value) || null;
                    setSlot(nextSlot);
                    setResultat(null);
                  }}
                >
                  <option value="">Selecciona una hora</option>
                  {slotsDia.map((item) => (
                    <option key={item.start} value={item.start}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Jugadors</label>
              <div className="grid" style={{ gap: 12 }}>
                {form.jugadors.map((player, index) => (
                  <MemberCombobox
                    key={`${court.id}-${index}`}
                    index={index}
                    value={player}
                    auth={auth}
                    selectedIds={selectedPlayerIds}
                    onSelect={(member) => updatePlayer(index, member)}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={!completable || enviant}
            >
              {enviant
                ? "Enviant…"
                : `Reservar pista${
                    totalAmountEuros > 0
                      ? ` · ${formatPrice(totalAmountEuros)}`
                      : " · Gratuït"
                  }`}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Reservations({ auth, onLogin, section }) {
  return (
    <section className="section">
      <div className="container">
        {!auth?.loggedIn && <LoginBox onLogin={onLogin} />}

        {auth?.loggedIn &&
          (section === "courts" ? (
            <CourtReservations auth={auth} />
          ) : (
            <ZoneReservations auth={auth} />
          ))}
      </div>
    </section>
  );
}
