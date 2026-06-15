import { useEffect, useState } from "react";
import { SLIDES } from "../data/club.js";

// Slider destacat de la pàgina d'inici.
// Mentre les diapositives no tinguin imatge (camp `img` buit), es
// mostra un marcador visual perquè quedi tot preparat per quan
// arribin les fotos del club.
export default function Slider() {
  const [i, setI] = useState(0);
  const total = SLIDES.length;

  const go = (n) => setI((n + total) % total);

  // Auto-rotació cada 5 segons.
  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  if (!total) return null;
  const slide = SLIDES[i];

  return (
    <div className="slider">
      <div className="slider__track">
        {SLIDES.map((s, idx) => (
          <figure
            key={idx}
            className={`slide ${idx === i ? "is-active" : ""}`}
            aria-hidden={idx !== i}
          >
            {s.img ? (
              <img className="slide__img" src={s.img} alt={s.titol} />
            ) : (
              <div className="slide__placeholder">
                <span className="slide__ph-icon">🖼️</span>
                <span className="slide__ph-text">Imatge del club</span>
              </div>
            )}
            <figcaption className="slide__caption">
              <h3>{s.titol}</h3>
              <p>{s.text}</p>
            </figcaption>
          </figure>
        ))}

        <button
          className="slider__arrow slider__arrow--prev"
          onClick={() => go(i - 1)}
          aria-label="Anterior"
        >
          ‹
        </button>
        <button
          className="slider__arrow slider__arrow--next"
          onClick={() => go(i + 1)}
          aria-label="Següent"
        >
          ›
        </button>
      </div>

      <div className="slider__dots">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            className={`slider__dot ${idx === i ? "is-active" : ""}`}
            onClick={() => setI(idx)}
            aria-label={`Diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
