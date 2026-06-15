// ============================================================
//  Configuració del club — única font de dades del frontend.
//  Quan tingueu backend o Google Sheet, només cal substituir
//  aquest fitxer i la capa de src/lib/reservations.js.
// ============================================================

export const CLUB = {
  nom: "Club Esportiu Can Rafel",
  poblacio: "Cervelló",
  adreca: "Avda. de la Font, s/n — 08758 Cervelló",
  telefon: "936 50 01 45",
  email: "clubcanrafel@gmail.com",
  web: "www.clubesportiucanrafel.cat",
};

// ------------------------------------------------------------
//  SLIDER destacat de la pàgina d'inici.
//  PLACEHOLDERS: deixeu el camp `img` buit ("") i es mostrarà un
//  marcador visual. Quan tingueu les fotos, copieu-les a
//  /public/imatges/ i poseu la ruta, p. ex. img: "/imatges/piscina.jpg".
// ------------------------------------------------------------
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

// ------------------------------------------------------------
//  INSTAGRAM — últimes publicacions.
//  PLACEHOLDER: poseu l'usuari i l'URL reals del club. Mentre no
//  connecteu el feed automàtic, es mostren targetes de marcador
//  que enllacen al perfil. Per mostrar les publicacions reals
//  automàticament podeu fer servir un widget (LightWidget, Behold,
//  EmbedSocial...) o la Instagram Basic Display API i substituir
//  el contingut del component InstagramFeed.
// ------------------------------------------------------------
export const INSTAGRAM = {
  handle: "@clubcanrafel",
  url: "https://www.instagram.com/clubesportiucanrafel/",
  // FEED REAL AUTOMÀTIC (recomanat):
  //  1. Entra a https://lightwidget.com, inicia sessió amb l'Instagram del
  //     club i crea un widget amb les últimes publicacions.
  //  2. Copia l'URL de l'iframe que et donen (acaba en .html) i enganxa-la
  //     aquí. Mentre estigui buit, es mostren els marcadors de sota.
  embedUrl: "",
  // Marcadors de posició (mentre no hi hagi `embedUrl`).
  posts: [
    { img: "", caption: "Última publicació" },
    { img: "", caption: "Publicació recent" },
    { img: "", caption: "Publicació recent" },
    { img: "", caption: "Publicació recent" },
  ],
};

// ------------------------------------------------------------
//  ENVIAMENT DE FORMULARIS PER CORREU (sense backend) — Formspree.
//  El formulari de reserva (i el d'alta) s'envien al correu del club
//  a través de Formspree, que reenvia les dades a clubcanrafel@gmail.com.
//
//  COM ACTIVAR-HO:
//   1. Entra a https://formspree.io, crea un compte amb clubcanrafel@gmail.com.
//   2. Crea un formulari nou (New form) i posa com a destinatari el correu
//      del club. Et donarà un endpoint del tipus https://formspree.io/f/xxxxxx.
//   3. Enganxa aquest endpoint aquí.
//
//  Mentre estigui buit, l'enviament mostrarà un avís per escriure directament
//  al correu del club.
// ------------------------------------------------------------
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mlgkzzwe";

// Franges horàries disponibles per a les reserves.
export const FRANGES = [
  { id: "mati", label: "Matí", hores: "10:00 – 14:00" },
  { id: "tarda", label: "Tarda", hores: "16:00 – 20:00" },
  { id: "vespre", label: "Vespre", hores: "20:00 – 00:00" },
];

// ------------------------------------------------------------
//  GOOGLE CALENDAR — disponibilitat de dates de les reserves.
//  El calendari de reserves mostra com a OCUPADES les dates que
//  tinguin esdeveniments al Google Calendar de cada zona.
//
//  COM ACTIVAR-HO:
//   1. Creeu un calendari de Google per a cada zona (o un de sol) i
//      feu-lo PÚBLIC (Configuració → "Fes-lo públic").
//   2. Genereu una clau d'API de Google (Google Cloud Console →
//      "API i serveis" → activeu "Google Calendar API" → credencials
//      → clau d'API; restringiu-la a la Calendar API i al vostre domini).
//   3. Enganxeu la clau a `apiKey` i l'ID de cada calendari a `calendars`.
//
//  Mentre `apiKey` estigui buit, la disponibilitat es calcula amb les
//  reserves desades localment (mode demostració).
//
//  NOTA: la clau d'API d'una web és pública per definició; restringiu-la
//  sempre per API i per domini. Crear esdeveniments (confirmar reserves)
//  s'ha de fer des del Google Calendar per part de la junta o amb un
//  backend, mai escrivint des del navegador.
// ------------------------------------------------------------
export const GOOGLE_CALENDAR = {
  apiKey: "AIzaSyB8amAurBaxOypTlYrewpvcBjoA2Y6kw8c",
  // ID del calendari públic de cada zona (acaba sovint en @group.calendar.google.com).
  calendars: {
    barbacoa: "0b59bad2274ed3e2b38707cf126a57f31c7d05b4a3a6c959cb9f98d84b0dc7d0@group.calendar.google.com",
    piscina: "3a3fb1fdbfb62ac28b766de06c24deb4522897ed35d22cb135f4cb440145ebcd@group.calendar.google.com",
    poliesportiva: "2a4c1997e87d685e19c4c2e5f54d0a4dcbf4bc368e232cf741593d533a26bb63@group.calendar.google.com",
    sala: "1da2e4a06444f83d2a4bdbca717d75661c7f93e6dea6a5be65bc50788e0b874a@group.calendar.google.com",
  },
};

// ------------------------------------------------------------
//  Zones RESERVABLES des del web (calendari + sol·licitud).
//  Obertes a socis i no socis: gratuïtes per a socis, amb tarifa
//  per a no socis. Els socis tenen prioritat.
// ------------------------------------------------------------
export const ZONES = [
  {
    id: "barbacoa",
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

// ------------------------------------------------------------
//  Reserva de PÀDEL i FRONTÓ — es gestiona des de l'app MP Centros,
//  NO des d'aquest web.
//  PLACEHOLDER: poseu l'enllaç real de l'app/centre a `url`.
//  Si el deixeu buit (""), només es mostra el text informatiu.
// ------------------------------------------------------------
export const MP_CENTROS = {
  nom: "MP Centros",
  url: "", // p. ex. enllaç al centre dins l'app o a la fitxa de Google Play / App Store
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

// Llistat de socis (simulació). En producció vindria del padró de socis.
// La reserva de soci es valida si el DNI o el núm. de soci hi consten.
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
