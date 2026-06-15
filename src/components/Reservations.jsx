import { useState } from "react";
import { ZONES, CLUB, FORMSPREE_ENDPOINT } from "../data/club.js";
import { createReservation } from "../lib/reservations.js";
import Calendar from "./Calendar.jsx";
import PadelFronto from "./PadelFronto.jsx";

const formBuit = { nom: "", email: "", telefon: "", persones: "", motiu: "" };

export default function Reservations() {
  const [zonaId, setZonaId] = useState(ZONES[0].id);
  const [mode, setMode] = useState(null); // "soci" | "nosoci"
  const [form, setForm] = useState(formBuit);
  const [data, setData] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [enviant, setEnviant] = useState(false);

  const zona = ZONES.find((z) => z.id === zonaId);
  const esSoci = mode === "soci";

  const triarZona = (id) => {
    setZonaId(id);
    setData(null);
    setResultat(null);
  };

  const canviarMode = (m) => {
    setMode(m);
    setForm(formBuit);
    setData(null);
    setResultat(null);
  };

  const completable =
    data &&
    form.nom.trim() &&
    form.email.trim() &&
    Number(form.persones) > 0 &&
    form.motiu.trim();

  const enviar = async (e) => {
    e.preventDefault();
    if (!completable || enviant) return;

    const dataLlegible = new Date(data + "T00:00").toLocaleDateString("ca-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Dades que s'envien al correu del club.
    const dades = {
      _subject: `Reserva ${zona.nom} — ${dataLlegible} — ${form.nom}`,
      Zona: zona.nom,
      Data: dataLlegible,
      Tipus: esSoci ? "Soci (gratuït, prioritat)" : "No soci (amb tarifa)",
      "Nombre de persones": form.persones,
      Motiu: form.motiu,
      "Nom i cognoms": form.nom,
      "Correu de contacte": form.email,
      Telèfon: form.telefon || "—",
    };

    if (!FORMSPREE_ENDPOINT) {
      setResultat({
        ok: false,
        error: `L'enviament automàtic encara no està configurat. Escriu-nos a ${CLUB.email}.`,
      });
      return;
    }

    setEnviant(true);
    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(dades),
      });
      if (!resp.ok) throw new Error("Enviament rebutjat");

      // Desa la reserva localment (bloqueig optimista en aquest navegador).
      createReservation({
        zonaId,
        data,
        nom: form.nom,
        email: form.email,
        telefon: form.telefon || null,
        persones: Number(form.persones),
        motiu: form.motiu,
        soci: esSoci,
      });

      setResultat({ ok: true });
      setForm(formBuit);
      setData(null);
    } catch (err) {
      setResultat({
        ok: false,
        error: `No s'ha pogut enviar la sol·licitud. Torna-ho a provar o escriu-nos a ${CLUB.email}.`,
      });
    } finally {
      setEnviant(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h2 className="section__title">Reserva una zona del club</h2>
        <p className="section__lead">
          Socis i no socis poden reservar les zones. Els <strong>socis</strong>{" "}
          reserven de manera <strong>gratuïta i amb prioritat</strong>; els no
          socis tenen una tarifa. La junta confirmarà cada reserva.
        </p>

        {/* 1. Zona */}
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

        {/* 2. Tipus de reserva */}
        <div className="form" style={{ marginBottom: 26 }}>
          <h3 style={{ marginTop: 0 }}>Com vols reservar?</h3>
          <div className="mode-tabs">
            <button
              type="button"
              className={`mode-tab ${mode === "soci" ? "active" : ""}`}
              onClick={() => canviarMode("soci")}
            >
              Sóc soci
              <small>Gratuït i amb prioritat</small>
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === "nosoci" ? "active" : ""}`}
              onClick={() => canviarMode("nosoci")}
            >
              No sóc soci
              <small>Amb tarifa</small>
            </button>
          </div>

          {mode && (
            <p className="hint" style={{ marginBottom: 0 }}>
              {esSoci
                ? "Com a soci, la reserva és gratuïta i té prioritat. No cal el DNI: només les teves dades de contacte, la data i el motiu."
                : "Els socis tenen prioritat i la reserva pot tenir una tarifa. Indica les teves dades de contacte, la data i el motiu."}
            </p>
          )}
        </div>

        {/* 3. Data + formulari */}
        {mode && (
          <div className="reserve-layout">
            <div>
              <h3>Disponibilitat — {zona.nom}</h3>
              <Calendar zonaId={zonaId} selected={data} onSelect={setData} />
              <p className="hint" style={{ marginTop: 12 }}>
                Si no està disponible la zona,{" "}
                <a href={`mailto:${CLUB.email}`}>envia un mail al club</a> per
                confirmar la disponibilitat.
              </p>
            </div>

            <div>
              <div className="norms">
                <h4>{zona.emoji} {zona.nom}</h4>
                <p className="price-row" style={{ marginTop: 0 }}>
                  <span className="price-tag price-tag--soci">
                    Socis: {zona.preuSoci}
                  </span>
                  <span className="price-tag price-tag--nosoci">
                    No socis: {zona.preuNoSoci}
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
                  {data ? (
                    <>
                      Data seleccionada:{" "}
                      <strong>
                        {new Date(data + "T00:00").toLocaleDateString("ca-ES", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </strong>
                    </>
                  ) : (
                    "Selecciona una data lliure al calendari."
                  )}
                </div>

                <div className="field">
                  <label>Nom i cognoms *</label>
                  <input
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  />
                </div>
                <div className="row">
                  <div className="field">
                    <label>Correu electrònic *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Telèfon</label>
                    <input
                      type="tel"
                      value={form.telefon}
                      onChange={(e) =>
                        setForm({ ...form, telefon: e.target.value })
                      }
                    />
                  </div>
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
                    onChange={(e) =>
                      setForm({ ...form, persones: e.target.value })
                    }
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
                  {enviant ? "Enviant…" : "Sol·licitar reserva"}
                </button>
              </form>

              {resultat && resultat.ok && (
                <div className="alert alert--ok" style={{ marginTop: 18 }}>
                  Sol·licitud enviada. La reserva queda pendent de confirmació.
                </div>
              )}
              {resultat && !resultat.ok && (
                <div className="alert alert--err" style={{ marginTop: 18 }}>
                  {resultat.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Pàdel / Frontó — reserva via app MP Centros */}
        <div className="">
          <PadelFronto />
        </div>
      </div>
    </section>
  );
}
