import { ZONES } from "../data/club.js";
import Slider from "./Slider.jsx";
import InstagramFeed from "./InstagramFeed.jsx";
import PadelFronto from "./PadelFronto.jsx";

export default function Home({ go, auth }) {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Un club entre pins, fet per a tu i la teva família</h1>
          <p>
            El Club Esportiu Can Rafel és un petit club familiar envoltat de
            natura i pinedes. Esport, lleure i bona companyia en un entorn
            tranquil.
          </p>
          <div className="hero__cta">
            {!auth?.loggedIn && (
              <button className="btn btn--primary" onClick={() => go("alta")}>
                Fes-te soci
              </button>
            )}
            <button className="btn btn--light" onClick={() => go("reserves-zones")}>
              Reserva una zona
            </button>
          </div>
        </div>
      </section>

      {/* Slider destacat amb les imatges del club */}
      <section className="section">
        <div className="container">
          <Slider />
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <h2 className="section__title">Què és el Club Can Rafel?</h2>
          <p className="section__lead">
            Som una entitat esportiva petita i propera. Cuidem l'entorn natural,
            fomentem l'esport i creem un espai de trobada per a socis i les seves
            famílies.
          </p>
          <div className="grid grid--3">
            <div className="card">
              <div className="card__icon">🌲</div>
              <h3>Entorn natural</h3>
              <p>
                Instal·lacions integrades en una pineda, pensades per gaudir de
                l'aire lliure i la tranquil·litat.
              </p>
            </div>
            <div className="card">
              <div className="card__icon">🤝</div>
              <h3>Ambient familiar</h3>
              <p>
                Un club petit on tothom es coneix. Activitats i celebracions per
                a totes les edats.
              </p>
            </div>
            <div className="card">
              <div className="card__icon">🏅</div>
              <h3>Esport i lleure</h3>
              <p>
                Pistes esportives, piscina i zones socials per mantenir-te actiu
                i passar-ho bé.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section__title">Les nostres zones</h2>
          <p className="section__lead">
            Les reserves de les zones del club es fan des d&apos;aquest web amb
            accés de soci. Els socis reserven de manera
            <strong> gratuïta i amb prioritat</strong>.
          </p>
          <div className="grid grid--2">
            {ZONES.map((z) => (
              <div className="card" key={z.id}>
                <div className="card__icon">{z.emoji}</div>
                <h3>{z.nom}</h3>
                <p>{z.descripcio}</p>
                <p style={{ marginTop: 10, color: "var(--pine-600)", fontWeight: 600 }}>
                  {z.capacitat}
                </p>
                <div className="price-row">
                  <span className="price-tag price-tag--soci">
                    Socis: {z.preuSoci}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pàdel i frontó — reserva externa via MP Centros */}
          <PadelFronto />

          <div style={{ textAlign: "center", marginTop: 30 }}>
            <button className="btn btn--primary" onClick={() => go("reserves-zones")}>
              Anar a reserves →
            </button>
          </div>
        </div>
      </section>

      {/* Últimes publicacions d'Instagram */}
      <InstagramFeed />

      {!auth?.loggedIn && (
        <section className="section">
          <div className="container" style={{ textAlign: "center" }}>
            <h2 className="section__title">Vols formar part del club?</h2>
            <p className="section__lead">
              Fer-se soci és fàcil. Consulta les quotes i els avantatges, i omple
              el full d'inscripció en línia.
            </p>
            <div className="hero__cta" style={{ justifyContent: "center" }}>
              <button className="btn btn--outline" onClick={() => go("info")}>
                Quotes i beneficis
              </button>
              <button className="btn btn--primary" onClick={() => go("alta")}>
                Començar la inscripció
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
