import { useState } from "react";
import { createMembershipOpportunity, fileToBase64 } from "../lib/membership.js";

const IS_TEST_MODE = import.meta.env.DEV;
const TEST_EMAIL = "isaac.closa+01@gmail.com";

const beneficiariBuit = () => ({
  nom: IS_TEST_MODE ? "Beneficiari Prova" : "",
  naixement: IS_TEST_MODE ? "2012-06-15" : "",
  dni: IS_TEST_MODE ? "00000000T" : "",
  parentiu: IS_TEST_MODE ? "Fill/a" : "",
  telefon: IS_TEST_MODE ? "664029696" : "",
  email: IS_TEST_MODE ? TEST_EMAIL : "",
  foto: null,
});

const TEST_MEMBERSHIP_DEFAULTS = {
  titular_nom: "Isaac Closa",
  titular_naixement: "1988-04-17",
  titular_dni: "12345678Z",
  titular_adreca: "Carrer de Prova, 12",
  titular_poblacio: "Corbera de Llobregat",
  titular_cp: "08757",
  titular_mobil: "664029696",
  titular_fix: "936500000",
  titular_email: TEST_EMAIL,
  banc_titular: "Isaac Closa",
  banc_dni: "12345678Z",
  banc_entitat: "CaixaBank",
  banc_mes: "2026-07",
  banc_iban: "ES1200000000000000000000",
};

function buildTestAttachment(name, content, mimetype) {
  return {
    name,
    mimetype,
    data: btoa(unescape(encodeURIComponent(content))),
  };
}

export default function RegisterForm({ go }) {
  const [beneficiaris, setBeneficiaris] = useState([beneficiariBuit()]);
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
    const benePlens = beneficiaris.filter((b) => b.nom.trim());
    const titularDniFile = fd.get("titular_dni_file");

    if (
      !IS_TEST_MODE &&
      (!(titularDniFile instanceof File) || !titularDniFile.size)
    ) {
      setError("Cal adjuntar la fotocòpia del DNI del titular.");
      return;
    }

    for (const [index, bene] of benePlens.entries()) {
      if (!IS_TEST_MODE && (!(bene.foto instanceof File) || !bene.foto.size)) {
        setError(`Cal adjuntar la foto del beneficiari ${index + 1}.`);
        return;
      }
    }

    setEnviant(true);
    setError("");

    try {
      const titularAttachment =
        titularDniFile instanceof File && titularDniFile.size
          ? {
              name: titularDniFile.name,
              mimetype: titularDniFile.type || "application/octet-stream",
              data: await fileToBase64(titularDniFile),
            }
          : buildTestAttachment(
              "dni-titular-test.txt",
              "Adjunt de prova per a entorn de desenvolupament.",
              "text/plain"
            );

      const attachments = [titularAttachment];

      const beneficiarisPayload = await Promise.all(
        benePlens.map(async (b) => ({
          nom: b.nom,
          naixement: b.naixement,
          dni: b.dni,
          parentiu: b.parentiu,
          telefon: b.telefon,
          email: b.email,
          foto:
            b.foto instanceof File && b.foto.size
              ? {
                  name: b.foto.name,
                  mimetype: b.foto.type || "application/octet-stream",
                  data: await fileToBase64(b.foto),
                }
              : IS_TEST_MODE
                ? buildTestAttachment(
                    `beneficiari-${b.nom || "test"}.txt`,
                    `Foto de prova del beneficiari ${b.nom || "sense nom"}.`,
                    "text/plain"
                  )
              : null,
        }))
      );

      await createMembershipOpportunity({
        titular_nom: String(fd.get("titular_nom") || ""),
        titular_naixement: String(fd.get("titular_naixement") || ""),
        titular_dni: String(fd.get("titular_dni") || ""),
        titular_adreca: String(fd.get("titular_adreca") || ""),
        titular_poblacio: String(fd.get("titular_poblacio") || ""),
        titular_cp: String(fd.get("titular_cp") || ""),
        titular_mobil: String(fd.get("titular_mobil") || ""),
        titular_fix: String(fd.get("titular_fix") || ""),
        titular_email: String(fd.get("titular_email") || ""),
        banc_titular: String(fd.get("banc_titular") || ""),
        banc_dni: String(fd.get("banc_dni") || ""),
        banc_entitat: String(fd.get("banc_entitat") || ""),
        banc_mes: String(fd.get("banc_mes") || ""),
        banc_iban: String(fd.get("banc_iban") || ""),
        auth_imatge: Boolean(fd.get("auth_imatge")),
        auth_dades: Boolean(fd.get("auth_dades")),
        auth_veracitat: Boolean(fd.get("auth_veracitat")),
        beneficiaris: beneficiarisPayload,
        attachments,
      });

      setEnviat(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "No s'ha pogut crear l'oportunitat al CRM."
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

        <form className="form" onSubmit={onSubmit}>
          <fieldset className="fieldset">
            <legend>Dades del soci titular</legend>
            <div className="field">
              <label>Nom i cognoms *</label>
              <input
                required
                name="titular_nom"
                defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.titular_nom : ""}
              />
            </div>
            <div className="row">
              <div className="field">
                <label>Data de naixement *</label>
                <input
                  required
                  type="date"
                  name="titular_naixement"
                  defaultValue={
                    IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.titular_naixement : ""
                  }
                />
              </div>
              <div className="field">
                <label>DNI *</label>
                <input
                  required
                  name="titular_dni"
                  placeholder="12345678A"
                  defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.titular_dni : ""}
                />
              </div>
            </div>
            <div className="field">
              <label>Fotocòpia del DNI del titular *</label>
              <input required type="file" name="titular_dni_file" accept=".pdf,image/*" />
            </div>
            <div className="field">
              <label>Adreça *</label>
              <input
                required
                name="titular_adreca"
                defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.titular_adreca : ""}
              />
            </div>
            <div className="row">
              <div className="field">
                <label>Població *</label>
                <input
                  required
                  name="titular_poblacio"
                  defaultValue={
                    IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.titular_poblacio : ""
                  }
                />
              </div>
              <div className="field">
                <label>Codi postal *</label>
                <input
                  required
                  name="titular_cp"
                  inputMode="numeric"
                  defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.titular_cp : ""}
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Telèfon mòbil *</label>
                <input
                  required
                  type="tel"
                  name="titular_mobil"
                  defaultValue={
                    IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.titular_mobil : ""
                  }
                />
              </div>
              <div className="field">
                <label>Telèfon fix</label>
                <input
                  type="tel"
                  name="titular_fix"
                  defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.titular_fix : ""}
                />
              </div>
            </div>
            <div className="field">
              <label>Correu electrònic *</label>
              <input
                required
                type="email"
                name="titular_email"
                defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.titular_email : ""}
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
                <div className="field">
                  <label>Foto del beneficiari {b.nom.trim() ? "*" : "(opcional fins que omplis el nom)"}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      updateBeneficiari(i, "foto", e.target.files?.[0] || null)
                    }
                  />
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
                  name="banc_titular"
                  defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.banc_titular : ""}
                />
              </div>
              <div className="field">
                <label>DNI / NIF del titular</label>
                <input
                  name="banc_dni"
                  defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.banc_dni : ""}
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Entitat bancària</label>
                <input
                  name="banc_entitat"
                  defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.banc_entitat : ""}
                />
              </div>
              <div className="field">
                <label>Mes d&apos;inici del cobrament</label>
                <input
                  name="banc_mes"
                  type="month"
                  defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.banc_mes : ""}
                />
              </div>
            </div>
            <div className="field">
              <label>IBAN</label>
              <input
                name="banc_iban"
                placeholder="ES00 0000 0000 00 0000000000"
                defaultValue={IS_TEST_MODE ? TEST_MEMBERSHIP_DEFAULTS.banc_iban : ""}
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
              <input type="checkbox" name="auth_imatge" defaultChecked={IS_TEST_MODE} />
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
                name="auth_dades"
                defaultChecked={IS_TEST_MODE}
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
                name="auth_veracitat"
                defaultChecked={IS_TEST_MODE}
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
