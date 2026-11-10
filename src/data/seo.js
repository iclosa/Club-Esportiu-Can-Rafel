// Font única de títols i descripcions per pàgina. La utilitzen l'App (títol de
// la pestanya) i vite.config.js (metaetiquetes estàtiques per a WhatsApp, Google…).
export const SITE_NAME = "Club Esportiu Can Rafel";
export const DEFAULT_SITE_URL = "https://club-esportiu-can-rafel.vercel.app";
export const OG_IMAGE = { path: "/og-image.jpg", width: 1200, height: 630, alt: "Club Esportiu Can Rafel, un club entre pins" };

export const PAGES = {
  home: {
    path: "/",
    title: "Club Esportiu Can Rafel · Un club entre pins",
    description: "Club familiar envoltat de pinedes. Pàdel, piscina, barbacoa i sala polivalent. Fes-te soci i reserva les zones del club en línia.",
  },
  info: {
    path: "/informacio",
    title: "Quotes i beneficis del soci · Club Esportiu Can Rafel",
    description: "Consulta les quotes, els avantatges i les instal·lacions per als socis del Club Esportiu Can Rafel.",
  },
  alta: {
    path: "/fes-te-soci",
    title: "Fes-te soci · Club Esportiu Can Rafel",
    description: "Omple el full d'inscripció en línia i forma part del Club Esportiu Can Rafel, un club familiar entre pins.",
  },
  "reserves-zones": {
    path: "/reserves-zones",
    title: "Reserva una zona · Club Esportiu Can Rafel",
    description: "Consulta la disponibilitat i sol·licita la reserva de la barbacoa, la piscina, la sala polivalent o la zona poliesportiva del club.",
  },
  "reserves-courts": {
    path: "/reserves-pistes",
    title: "Pàdel i frontó · Club Esportiu Can Rafel",
    description: "Reserva les pistes de pàdel i frontó del Club Esportiu Can Rafel.",
  },
};
