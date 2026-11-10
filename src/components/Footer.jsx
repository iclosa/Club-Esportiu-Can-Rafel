import { CLUB } from "../data/club.js";

export default function Footer({ go, auth }) {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <h4>{CLUB.nom}</h4>
          <p>
            Un club familiar i esportiu envoltat de pins. Vine a gaudir de la
            natura amb nosaltres.
          </p>
        </div>
        <div>
          <h4>Contacte</h4>
          <p>
            {CLUB.adreca}
            <br />
            Tel. {CLUB.telefon}
            <br />
            <a href={`mailto:${CLUB.email}`}>{CLUB.email}</a>
          </p>
        </div>
        <div>
          <h4>Enllaços</h4>
          <p>
            {!auth?.loggedIn && (
              <>
                <a href="#" onClick={(e) => { e.preventDefault(); go("alta"); }}>
                  Fes-te soci
                </a>
                <br />
              </>
            )}
            <a href="#" onClick={(e) => { e.preventDefault(); go("reserves-zones"); }}>
              Reserva una zona
            </a>
          </p>
        </div>
      </div>
      <div className="container footer__bottom">
        © {new Date().getFullYear()} {CLUB.nom}. Tots els drets reservats.
      </div>
    </footer>
  );
}
