import { useState } from "react";
import { CLUB, FORMSPREE_ENDPOINT } from "../data/club.js";

const beneficiariBuit = () => ({
  nom: "",
  naixement: "",
  dni: "",
  parentiu: "",
  telefon: "",
  email: "",
});

export default function RegisterForm({ go }) {
  const [beneficiaris, setBeneficiaris] = useState([beneficiariBuit()]);
  const [enviat, setEnviat] = useState(false);
  const [enviant, setEnviant] = useState(false);
  const [error, setError] = useState("");

  const addBeneficiari = () => {
    if (beneficiaris.length < 4)
      setBeneficiaris([...beneficiaris, beneficiariBuit()]);
  };
  const removeBeneficiari = (i) =>
    setBeneficiaris(beneficiaris.filter((_, idx) => idx !== i));
  const updateBeneficiari = (i, camp, valor) => {
    const next = [...beneficiaris];
    next[i] = { ...next[i], [camp]: valor };
    setBeneficiaris(next);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (enviant) return;

    const fd = new FormData(e.target);
    const siNo = (camp) => (fd.get(camp) ? "Sí" : "No");

    // Beneficiaris resumits en una sola línia cadascun.
    const benePlens = beneficiaris.filter((b) => b.nom.trim());
    const beneText = benePlens.length
      ? benePlens
          .map(
            (b, i) =>
              `Beneficiari ${i + 1}: ${b.nom} | Naix.: ${b.naixement || "—"} | ` +
              `DNI: ${b.dni || "—"} | Parentiu: ${b.parentiu || "—"} | ` +
              `Tel.: ${b.telefon || "—"} | Correu: ${b.email || "—"}`
          )
          .join("\n")
      : "—";

    const dades = {
      _subject: `Sol·licitud d'alta de soci — ${fd.get("titular_nom") || ""}`,
      "Nom i cognoms": fd.get("titular_nom"),
      "Data de naixement": fd.get("titular_naixement"),
      DNI: fd.get("titular_dni"),
      Adreça: fd.get("titular_adreca"),
      Població: fd.get("titular_poblacio"),
      "Codi postal": fd.get("titular_cp"),
      "Telèfon mòbil": fd.get("titular_mobil"),
      "Telèfon fix": fd.get("titular_fix") || "—",
      "Correu electrònic": fd.get("titular_email"),
      Beneficiaris: beneText,
      "Domiciliació · Titular del compte": fd.get("banc_titular") || "—",
      "Domiciliació · DNI/NIF": fd.get("banc_dni") || "—",
      "Domiciliació · Entitat": fd.get("banc_entitat") || "—",
      "Domiciliació · Mes d'inici": fd.get("banc_mes") || "—",
      "Domiciliació · IBAN": fd.get("banc_iban") || "—",
      "Autoritza ús d'imatge": siNo("auth_imatge"),
      "Autoritza tractament de dades": siNo("auth_dades"),
      "Confirma veracitat i condicions": siNo("auth_veracitat"),
    };

    if (!FORMSPREE_ENDPOINT) {
      setError(
        `L'enviament automàtic encara no està configurat. Escriu-nos a ${CLUB.email}.`
      );
      return;
    }

    setEnviant(true);
    setError("");
    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(dades),
      });
      if (!resp.ok) throw new Error("Enviament rebutjat");
      setEnviat(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        `No s'ha pogut enviar la sol·licitud. Torna-ho a provar o escriu-nos a ${CLUB.email}.`
      );
    } finally {
      setEnviant(false);
    }
  };

  if (enviat) {
    return (
      <section className="section">
        <div className="container">
          <div className="form">
            <div className="alert alert--ok">
              Gràcies! Hem rebut la teva sol·licitud d'inscripció.
            </div>
            <h2>Sol·licitud enviada</h2>
            <p>
              La junta del club revisarà les teves dades i et contactarà per
              completar l'alta i la domiciliació bancària.
            </p>
            <button className="btn btn--outline" onClick={() => setEnviat(false)}>
              ← Tornar al formulari
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section__title">Full d'inscripció de nou soci</h2>
        <p className="section__lead">
          Omple les dades del titular i, si vols, dels beneficiaris. La junta
          confirmarà l'alta i la domiciliació bancària.
        </p>

        {go && (
          <p style={{ textAlign: "center", marginTop: -28, marginBottom: 30 }}>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => go("info")}
            >
              Veure quotes i beneficis del soci
            </button>
          </p>
        )}

        <form className="form" onSubmit={onSubmit}>
          {/* ---- Dades del soci titular ---- */}
          <fieldset className="fieldset">
            <legend>Dades del soci titular</legend>
            <div className="field">
              <label>Nom i cognoms *</label>
              <input required name="titular_nom" />
            </div>
            <div className="row">
              <div className="field">
                <label>Data de naixement *</label>
                <input required type="date" name="titular_naixement" />
              </div>
              <div className="field">
                <label>DNI *</label>
                <input required name="titular_dni" placeholder="12345678A" />
              </div>
            </div>
            <div className="field">
              <label>Adreça *</label>
              <input required name="titular_adreca" />
            </div>
            <div className="row">
              <div className="field">
                <label>Població *</label>
                <input required name="titular_poblacio" />
              </div>
              <div className="field">
                <label>Codi postal *</label>
                <input required name="titular_cp" inputMode="numeric" />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Telèfon mòbil *</label>
                <input required type="tel" name="titular_mobil" />
              </div>
              <div className="field">
                <label>Telèfon fix</label>
                <input type="tel" name="titular_fix" />
              </div>
            </div>
            <div className="field">
              <label>Correu electrònic *</label>
              <input required type="email" name="titular_email" />
            </div>
          </fieldset>

          {/* ---- Beneficiaris ---- */}
          <fieldset className="fieldset">
            <legend>Socis beneficiaris</legend>
            <p className="hint" style={{ marginTop: 0 }}>
              Familiars inclosos a l'abonament (màxim 4). Opcional.
            </p>
            {beneficiaris.map((b, i) => (
              <div className="beneficiari" key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>Beneficiari {i + 1}</strong>
                  {beneficiaris.length > 1 && (
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                      onClick={() => removeBeneficiari(i)}
                    >
                      Treure
                    </button>
                  )}
                </div>
                <div className="field">
                  <label>Nom i cognoms</label>
                  <input
                    value={b.nom}
                    onChange={(e) => updateBeneficiari(i, "nom", e.target.value)}
                  />
                </div>
                <div className="row--3">
                  <div className="field">
                    <label>Data de naixement</label>
                    <input
                      type="date"
                      value={b.naixement}
                      onChange={(e) =>
                        updateBeneficiari(i, "naixement", e.target.value)
                      }
                    />
                  </div>
                  <div className="field">
                    <label>DNI</label>
                    <input
                      value={b.dni}
                      onChange={(e) => updateBeneficiari(i, "dni", e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Parentiu</label>
                    <input
                      value={b.parentiu}
                      onChange={(e) =>
                        updateBeneficiari(i, "parentiu", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label>Telèfon</label>
                    <input
                      type="tel"
                      value={b.telefon}
                      onChange={(e) =>
                        updateBeneficiari(i, "telefon", e.target.value)
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Correu electrònic</label>
                    <input
                      type="email"
                      value={b.email}
                      onChange={(e) =>
                        updateBeneficiari(i, "email", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            {beneficiaris.length < 4 && (
              <button
                type="button"
                className="btn btn--outline"
                onClick={addBeneficiari}
              >
                + Afegir beneficiari
              </button>
            )}
          </fieldset>

          {/* ---- Domiciliació bancària ---- */}
          <fieldset className="fieldset">
            <legend>Autorització de domiciliació bancària</legend>
            <div className="row">
              <div className="field">
                <label>Titular del compte</label>
                <input name="banc_titular" />
              </div>
              <div className="field">
                <label>DNI / NIF del titular</label>
                <input name="banc_dni" />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Entitat bancària</label>
                <input name="banc_entitat" />
              </div>
              <div className="field">
                <label>Mes d'inici del cobrament</label>
                <input name="banc_mes" type="month" />
              </div>
            </div>
            <div className="field">
              <label>IBAN</label>
              <input name="banc_iban" placeholder="ES00 0000 0000 00 0000000000" />
            </div>
            <p className="hint">
              En cas de baixa, cal comunicar-la durant la primera quinzena del
              mes anterior a la data de baixa.
            </p>
          </fieldset>

          {/* ---- Autoritzacions ---- */}
          <fieldset className="fieldset">
            <legend>Autoritzacions (RGPD)</legend>
            <label className="check">
              <input type="checkbox" name="auth_imatge" />
              <span>
                Autoritzo l'ús de la meva imatge i la dels beneficiaris en
                fotografies del club, per publicar-les al web i/o xarxes socials
                de l'entitat.
              </span>
            </label>
            <label className="check">
              <input type="checkbox" name="auth_dades" />
              <span>
                Autoritzo que les meves dades i la dels beneficiaris s'incloguin
                al sistema informatitzat del club per a les finalitats pròpies de
                l'entitat (Llei 15/99 de Protecció de Dades).
              </span>
            </label>
            <label className="check">
              <input type="checkbox" required name="auth_veracitat" />
              <span>
                Confirmo que les dades facilitades són certes i accepto les
                condicions d'alta com a soci. *
              </span>
            </label>
          </fieldset>

          {error && (
            <div className="alert alert--err" style={{ marginTop: 0 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={enviant}
          >
            {enviant ? "Enviant…" : "Enviar sol·licitud d'alta"}
          </button>
        </form>
      </div>
    </section>
  );
}
