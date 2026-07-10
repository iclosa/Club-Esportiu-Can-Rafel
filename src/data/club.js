// ============================================================
//  Configuració del club — única font de dades del frontend.
// ============================================================

export const CLUB = {
  nom: "Club Esportiu Can Rafel",
  poblacio: "Cervelló",
  adreca: "Avda. de la Font, s/n — 08758 Cervelló",
  telefon: "936 50 01 45",
  email: "clubcanrafel@gmail.com",
  web: "www.clubesportiucanrafel.cat",
};

export const SLIDES = [
  {
    img: "/padel.jpg",
    titol: "Un club entre pins",
    text: "Instal·lacions integrades a la pineda, envoltades de natura.",
  },
  {
    img: "/piscina.jpg",
    titol: "Terrassa de les moreres",
    text: "El punt de trobada de l'estiu per a socis i famílies.",
  },
  {
    img: "/pistas.jpg",
    titol: "Esport per a tothom",
    text: "Pàdel / Frontó i pista multiesportiva en un entorn natural.",
  },
  {
    img: "/padel.jpg",
    titol: "Celebracions i bons moments",
    text: "Zona de barbacoa i sala polivalent per a les vostres trobades.",
  },
];

export const INSTAGRAM = {
  handle: "@clubcanrafel",
  url: "https://www.instagram.com/clubesportiucanrafel/",
  embedUrl: "",
  posts: [
    { img: "", caption: "Última publicació" },
    { img: "", caption: "Publicació recent" },
    { img: "", caption: "Publicació recent" },
    { img: "", caption: "Publicació recent" },
  ],
};

export const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT || "";

export const RESERVATIONS_API = {
  baseUrl: import.meta.env.VITE_RESERVATIONS_API_URL || "",
};

export const FRANGES = [
  { id: "mati", label: "Matí", hores: "10:00 – 14:00" },
  { id: "tarda", label: "Tarda", hores: "16:00 – 20:00" },
  { id: "vespre", label: "Vespre", hores: "20:00 – 00:00" },
];

export const ZONES = [
  {
    id: "barbacoa",
    appointmentTypeId: 9,
    nom: "Zona de barbacoa",
    emoji: "🔥",
    descripcio:
      "Espai a l'aire lliure entre pins amb barbacoes d'obra, taules i ombra natural. Ideal per a dinars i sopars familiars.",
    capacitat: "Fins a 30 persones",
    preuSoci: "Gratuït",
    preuNoSoci: "Consulta la tarifa",
    normes: [
      "Deixa la zona recollida i neta, tal com t'agradaria trobar-la.",
      "Porta bosses d'escombraries i, en marxar, treu-les al contenidor.",
      "Apaga bé les brases i deixa la barbacoa neta de cendres.",
      "Recull taules, cadires i estris al lloc on els has trobat.",
      "Respecta l'horari acordat i el descans dels veïns i altres socis.",
      "Vigila els nens en tot moment.",
    ],
  },
  {
    id: "piscina",
    appointmentTypeId: 10,
    nom: "Terrassa de les moreres",
    emoji: "🏊",
    descripcio:
      "Terrassa de les moreres al voltant de la piscina, reservable per a celebracions i esdeveniments del club.",
    capacitat: "Fins a 50 persones",
    preuSoci: "Gratuït",
    preuNoSoci: "Consulta la tarifa",
    normes: [
      "Dutxa't abans d'entrar a l'aigua.",
      "Els menors han d'anar acompanyats d'un adult en tot moment.",
      "No es permet vidre a la zona de bany.",
      "Respecta l'aforament i l'horari acordat.",
    ],
  },
  {
    id: "poliesportiva",
    appointmentTypeId: 11,
    nom: "Pista multiesportiva",
    emoji: "⛹️",
    descripcio:
      "Pista multiesportiva a l'aire lliure per a futbol sala, bàsquet, hoquei i altres activitats. Amb il·luminació per a les franges de vespre.",
    capacitat: "Fins a 20 jugadors",
    preuSoci: "Gratuït",
    preuNoSoci: "Consulta la tarifa",
    normes: [
      "Cal calçat esportiu de sola no marcant.",
      "Respecta la franja reservada; deixa lliure la pista en acabar.",
      "L'ús de la llum del vespre pot tenir un suplement.",
      "Recull el material esportiu en marxar.",
    ],
  },
  {
    id: "sala",
    appointmentTypeId: 12,
    nom: "Sala polivalent",
    emoji: "🏠",
    descripcio:
      "Sala interior per a reunions, tallers i celebracions, amb taules, cadires i projector.",
    capacitat: "Fins a 40 persones",
    preuSoci: "Gratuït",
    preuNoSoci: "Consulta la tarifa",
    normes: [
      "Deixa la sala recollida i el mobiliari al seu lloc.",
      "No es permet menjar calent sense avís previ.",
      "Apaga llums i climatització en marxar.",
    ],
  },
];

export const MP_CENTROS = {
  nom: "MP Centros",
  url: "",
  androidUrl: "https://play.google.com/store/search?q=MP%20Centros&c=apps",
  iosUrl: "https://apps.apple.com/search?term=MP%20Centros",
  zones: [
    {
      id: "padel-fronto",
      nom: "Pàdel / Frontó",
      emoji: "🎾",
      descripcio:
        "Pistes de pàdel i frontó del club. Reserva i pagament des de l'app MP Centros.",
    },
  ],
};

export const COURTS = [
  {
    id: "padel",
    appointmentTypeId: 7,
    nom: "Pista de pàdel",
    emoji: "🎾",
    descripcio:
      "Reserva una pista de pàdel amb disponibilitat real segons Odoo.",
    capacitat: "Singles o dobles",
    durades: [{ value: 60, label: "60 min" }],
    tipus: [
      { value: "dobles", label: "Dobles" },
      { value: "singles", label: "Singles" },
    ],
    jugadorsPerTipus: {
      dobles: 4,
      singles: 2,
    },
  },
  {
    id: "fronto",
    appointmentTypeId: 8,
    nom: "Pista de frontó",
    emoji: "🥎",
    descripcio:
      "Reserva la pista de frontó amb les hores disponibles configurades a Odoo.",
    capacitat: "Singles o dobles",
    durades: [{ value: 60, label: "60 min" }],
    tipus: [
      { value: "dobles", label: "Dobles" },
      { value: "singles", label: "Singles" },
    ],
    jugadorsPerTipus: {
      dobles: 4,
      singles: 2,
    },
  },
];

export const SOCIS = [
  { numSoci: "001", dni: "12345678A", nom: "Família Garcia" },
  { numSoci: "014", dni: "47852136B", nom: "Família Martí" },
  { numSoci: "027", dni: "39654178C", nom: "Família López" },
  { numSoci: "042", dni: "51236987D", nom: "Família Roca" },
];

export function esSoci(identificador) {
  if (!identificador) return null;
  const valor = identificador.trim().toUpperCase();
  return (
    SOCIS.find(
      (s) => s.dni.toUpperCase() === valor || s.numSoci === valor
    ) || null
  );
}

export function getZona(id) {
  return ZONES.find((z) => z.id === id) || null;
}
