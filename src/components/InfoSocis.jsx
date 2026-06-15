export default function InfoSocis({ go }) {
  return (
    <>
      <section className="hero" style={{ padding: "84px 20px 100px" }}>
        <div className="container">
          <span className="tag">Informació per a nous socis</span>
          <h1>Fes-te soci del Club Can Rafel</h1>
          <p>
            Un club petit i familiar envoltat de pins. Aquí tens tot el que has
            de saber: quotes, instal·lacions i com donar-te d'alta.
          </p>
          <div className="hero__cta">
            <button className="btn btn--primary" onClick={() => go("alta")}>
              Omplir el formulari d'alta
            </button>
          </div>
        </div>
      </section>

      {/* Quotes */}
      <section className="section">
        <div className="container">
          <h2 className="section__title">Quotes mensuals</h2>
          <p className="section__lead">
            L'ús de les instal·lacions no té cap tarifa addicional més enllà de
            la quota. Només paguen alguns serveis els acompanyants <strong>no
            socis</strong> (piscina o pàdel).
          </p>
          <div className="grid grid--3">
            <div className="card">
              <div className="card__icon">👤</div>
              <h3>Soci titular</h3>
              <p style={{ fontSize: "1.6rem", color: "var(--pine-600)", fontWeight: 700 }}>
                45 €/mes
              </p>
            </div>
            <div className="card">
              <div className="card__icon">🧓</div>
              <h3>Soci jubilat</h3>
              <p style={{ fontSize: "1.6rem", color: "var(--pine-600)", fontWeight: 700 }}>
                15 €/mes
              </p>
            </div>
            <div className="card">
              <div className="card__icon">👪</div>
              <h3>Beneficiaris (majors de 5 anys)</h3>
              <p style={{ fontSize: "1.6rem", color: "var(--pine-600)", fontWeight: 700 }}>
                10 €/mes <small style={{ fontSize: "1rem", color: "var(--muted)" }}>per persona</small>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Serveis inclosos */}
      <section className="section section--alt">
        <div className="container">
          <h2 className="section__title">Serveis inclosos a la quota</h2>
          <div className="grid grid--2">
            <div className="card">
              <div className="card__icon">🏊</div>
              <h3>Piscina</h3>
              <p>
                Cada soci titular disposa de <strong>10 invitacions de mig dia</strong>
                {" "}(o 5 de dia sencer) per accedir amb una persona no sòcia. Si
                se t'acaben o prefereixes guardar-les, pots comprar-les el mateix
                dia al socorrista per <strong>7 €/dia</strong> per persona. També
                hi ha bons de 10 entrades/dia per <strong>50 €</strong>.
              </p>
            </div>
            <div className="card">
              <div className="card__icon">🎾</div>
              <h3>Pàdel / Frontó</h3>
              <p>
                La reserva de les pistes es fa a través de l'app <strong>MP Centros</strong>
                {" "}i és gratuïta per a socis i beneficiaris. El pagament dels
                convidats no socis també es gestiona des de la mateixa app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Altres instal·lacions */}
      <section className="section">
        <div className="container">
          <h2 className="section__title">Altres instal·lacions i activitats</h2>
          <p className="section__lead">
            Els socis poden fer ús de la resta d'instal·lacions i reservar la
            pista multiesportiva, la zona de BBQ, la terrassa de les moreres i la
            sala polivalent per a celebracions. El pàdel i el frontó es reserven
            des de l'app MP Centros.
          </p>
          <div className="grid grid--2">
            <div className="card">
              <div className="card__icon">🍽️</div>
              <h3>Bar-restaurant</h3>
              <p>
                Bar-restaurant del club a càrrec de l'
                <a
                  href="https://www.instagram.com/envirrat/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Envirrat Club
                </a>
                , amb terrassa i cuina de proximitat per a socis i visitants.
              </p>
            </div>
            <div className="card">
              <div className="card__icon">🛝</div>
              <h3>Zona infantil i petanca</h3>
              <p>Espais de lleure per a totes les edats.</p>
            </div>
            <div className="card">
              <div className="card__icon">🤸</div>
              <h3>Activitats dirigides</h3>
              <p>
                Durant 11 mesos l'any, amb
                <strong> preu especial per a socis</strong>: Pilates, Zumba,
                Aiguagim, Mercadet de Nadal, Ball... Ho pots veure a la porta del
                Club o al nostre Instagram.
              </p>
            </div>
            <div className="card">
              <div className="card__icon">☀️</div>
              <h3>Casal d'estiu</h3>
              <p>
                Al juliol organitzem un campament molt petit i familiar, amb
                <strong> preu especial per a socis</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Documentació + CTA */}
      <section className="section section--alt">
        <div className="container">
          <div className="form" style={{ textAlign: "center" }}>
            <h2 style={{ marginTop: 0 }}>Com donar-te d'alta</h2>
            <p>
              Omple el formulari d'alta en línia. Per completar el procés només
              caldrà que ens enviïs una <strong>fotocòpia del DNI del titular</strong>
              {" "}i una <strong>foto de cada beneficiari</strong>.
            </p>
            <button className="btn btn--primary" onClick={() => go("alta")}>
              Anar al formulari d'alta →
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
