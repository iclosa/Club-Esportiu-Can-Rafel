import { INSTAGRAM } from "../data/club.js";

// Últimes publicacions d'Instagram.
// Ara mateix mostra una graella de marcadors que enllacen al perfil.
// Per mostrar les publicacions reals automàticament, substituïu el
// contingut de `.ig__grid` per un widget incrustat (LightWidget, Behold,
// EmbedSocial...) o per crides a la Instagram Basic Display API.
export default function InstagramFeed() {
  return (
    <section className="section section--alt">
      <div className="container">
        <h2 className="section__title">Segueix-nos a Instagram</h2>
        <p className="section__lead">
          És on publiquem les novetats del dia a dia: activitats, partits i
          la vida al club. {INSTAGRAM.handle}
        </p>

        {INSTAGRAM.embedUrl ? (
          // Feed real (widget tipus LightWidget). S'actualitza sol.
          <iframe
            src={INSTAGRAM.embedUrl}
            title="Instagram del club"
            scrolling="no"
            allowtransparency="true"
            className="ig__embed"
          />
        ) : (
          <div className="ig__grid">
            {INSTAGRAM.posts.map((p, idx) => (
              <a
                key={idx}
                className="ig__item"
                href={INSTAGRAM.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Obrir Instagram del club"
              >
                {p.img ? (
                  <img src={p.img} alt={p.caption || "Publicació d'Instagram"} />
                ) : (
                  <span className="ig__placeholder">
                    <span className="ig__ph-icon">📷</span>
                  </span>
                )}
                <span className="ig__overlay">{p.caption}</span>
              </a>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <a
            className="btn btn--primary"
            href={INSTAGRAM.url}
            target="_blank"
            rel="noreferrer"
          >
            Veure totes les publicacions
          </a>
        </div>
      </div>
    </section>
  );
}
