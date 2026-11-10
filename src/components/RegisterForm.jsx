import { useState } from "react";
import { buildMembershipForm, sendMembershipRequest } from "../lib/membership.js";
import { FORMSPREE_ENDPOINT } from "../data/club.js";

const IS_LOCAL = import.meta.env.DEV;
const LOCAL_DEFAULTS = IS_LOCAL ? {
  titular_nom: "Soci de Prova", titular_naixement: "1988-04-17",
  titular_dni: "00000000T", titular_adreca: "Carrer de Prova, 12",
  titular_poblacio: "Cervelló", titular_cp: "08758",
  titular_mobil: "600000000", titular_fix: "930000000",
  titular_email: "proves@example.com", banc_titular: "Soci de Prova",
  banc_dni: "00000000T", banc_entitat: "Banc de Prova",
  banc_mes: new Date().toISOString().slice(0, 7),
  banc_iban: "ES0000000000000000000000",
} : {};

const beneficiariBuit = () => IS_LOCAL ? {
  nom: "Beneficiari de Prova", naixement: "2012-06-15", dni: "00000000T",
  parentiu: "Fill/a", telefon: "600000001", email: "beneficiari@example.com",
} : {
  nom: "", naixement: "", dni: "", parentiu: "", telefon: "", email: "",
};

export default function RegisterForm({ go }) {
  const [beneficiaris, setBeneficiaris] = useState(() => [beneficiariBuit()]);
  const [enviat, setEnviat] = useState(false);
  const [enviant, setEnviant] = useState(false);
  const [error, setError] = useState("");
  const addBeneficiari = () => {
    if (beneficiaris.length < 4) {
      setBeneficiaris([...beneficiaris, beneficiariBuit()]);
    }
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

    const formEl = e.currentTarget;
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      setError("Revisa els camps obligatoris del formulari.");
      return;
    }

    const fd = new FormData(formEl);
    setEnviant(true);
    setError("");
    try {
      await sendMembershipRequest(FORMSPREE_ENDPOINT, buildMembershipForm(fd, beneficiaris));
      setEnviat(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "No s'ha pogut enviar la sol·licitud d’alta."
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
              Gràcies! Hem rebut la teva sol·licitud d&apos;inscripció.
            </div>
            <h2>Sol·licitud enviada</h2>
            <p>
              La junta del club revisarà les teves dades i et contactarà per
              completar l&apos;alta i la domiciliació bancària.
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
        <h2 className="section__title">Full d&apos;inscripció de nou soci</h2>
        <p className="section__lead">
          Omple les dades del titular i, si vols, dels beneficiaris. La junta
          confirmarà l&apos;alta i la domiciliació bancària.
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

        {IS_LOCAL && <p className="alert alert--info">Mode local: dades fictícies de prova. Si envies el formulari, s’enviarà al Formspree configurat.</p>}
        <form className="form" encType="multipart/form-data" onSubmit={onSubmit}>
          <fieldset className="fieldset">
            <legend>Dades del soci titular</legend>
            <div className="field">
              <label>Nom i cognoms *</label>
              <input
                required
                name="titular_nom" defaultValue={LOCAL_DEFAULTS.titular_nom || ""}
              />
            </div>
            <div className="row">
              <div className="field">
                <label>Data de naixement *</label>
                <input
                  required
                  type="date"
                  name="titular_naixement" defaultValue={LOCAL_DEFAULTS.titular_naixement || ""}
                />
              </div>
              <div className="field">
                <label>DNI *</label>
                <input
                  required
                  name="titular_dni" defaultValue={LOCAL_DEFAULTS.titular_dni || ""}
                  placeholder="12345678A"
                />
              </div>
            </div>
            <div className="field">
              <label>Adreça *</label>
              <input
                required
                name="titular_adreca" defaultValue={LOCAL_DEFAULTS.titular_adreca || ""}
              />
            </div>
            <div className="row">
              <div className="field">
                <label>Població *</label>
                <input
                  required
                  name="titular_poblacio" defaultValue={LOCAL_DEFAULTS.titular_poblacio || ""}
                />
              </div>
              <div className="field">
                <label>Codi postal *</label>
                <input
                  required
                  name="titular_cp" defaultValue={LOCAL_DEFAULTS.titular_cp || ""}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Telèfon mòbil *</label>
                <input
                  required
                  type="tel"
                  name="titular_mobil" defaultValue={LOCAL_DEFAULTS.titular_mobil || ""}
                />
              </div>
              <div className="field">
                <label>Telèfon fix</label>
                <input
                  type="tel"
                  name="titular_fix" defaultValue={LOCAL_DEFAULTS.titular_fix || ""}
                />
              </div>
            </div>
            <div className="field">
              <label>Correu electrònic *</label>
              <input
                required
                type="email"
                name="titular_email" defaultValue={LOCAL_DEFAULTS.titular_email || ""}
              />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend>Socis beneficiaris</legend>
            <p className="hint" style={{ marginTop: 0 }}>
              Familiars inclosos a l&apos;abonament (màxim 4). Opcional.
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

          <fieldset className="fieldset">
            <legend>Autorització de domiciliació bancària</legend>
            <div className="row">
              <div className="field">
                <label>Titular del compte</label>
                <input
                  name="banc_titular" defaultValue={LOCAL_DEFAULTS.banc_titular || ""}
                />
              </div>
              <div className="field">
                <label>DNI / NIF del titular</label>
                <input
                  name="banc_dni" defaultValue={LOCAL_DEFAULTS.banc_dni || ""}
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Entitat bancària</label>
                <input
                  name="banc_entitat" defaultValue={LOCAL_DEFAULTS.banc_entitat || ""}
                />
              </div>
              <div className="field">
                <label>Mes d&apos;inici del cobrament</label>
                <input
                  name="banc_mes" defaultValue={LOCAL_DEFAULTS.banc_mes || ""}
                  type="month"
                />
              </div>
            </div>
            <div className="field">
              <label>IBAN</label>
              <input
                name="banc_iban" defaultValue={LOCAL_DEFAULTS.banc_iban || ""}
                placeholder="ES00 0000 0000 00 0000000000"
              />
            </div>
            <p className="hint">
              En cas de baixa, cal comunicar-la durant la primera quinzena del
              mes anterior a la data de baixa.
            </p>
          </fieldset>

          <fieldset className="fieldset">
            <legend>Autoritzacions (RGPD)</legend>
            <label className="check">
              <input type="checkbox" name="auth_imatge" defaultChecked={IS_LOCAL} />
              <span>
                Autoritzo l&apos;ús de la meva imatge i la dels beneficiaris en
                fotografies del club, per publicar-les al web i/o xarxes socials
                de l&apos;entitat.
              </span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                required
                name="auth_dades" defaultChecked={IS_LOCAL}

              />
              <span>
                Autoritzo que les meves dades i la dels beneficiaris s&apos;incloguin
                al sistema informatitzat del club per a les finalitats pròpies de
                l&apos;entitat (Llei 15/99 de Protecció de Dades).
              </span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                required
                name="auth_veracitat" defaultChecked={IS_LOCAL}

              />
              <span>
                Confirmo que les dades facilitades són certes i accepto les
                condicions d&apos;alta com a soci. *
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
