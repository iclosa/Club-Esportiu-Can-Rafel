# Club Esportiu Can Rafel — Web

Landing **només frontend** (React + Vite) per al Club Esportiu Can Rafel.

## Què inclou

1. **Inici** — explicació del club, ambient de bosc de pins, zones i crides a l'acció.
2. **Fes-te soci** — formulari d'alta amb totes les dades del full d'inscripció:
   titular, fins a 4 beneficiaris, domiciliació bancària i autoritzacions RGPD.
3. **Reserves** — selecció de zona (barbacoa, pàdel/tennis, piscina/social, sala
   polivalent), comprovació que ets soci, calendari amb **disponibilitat real**,
   normes de cada zona i sol·licitud que queda **pendent de confirmació**.

## Posada en marxa

```bash
npm install
npm run dev      # entorn de desenvolupament
npm run build    # build de producció (carpeta dist/)
npm run preview  # previsualitza el build
```

## Notes (frontend-only)

- Les reserves es desen al **localStorage** del navegador i inclouen dades de
  demostració perquè el calendari mostri disponibilitat des del primer moment.
- El llistat de socis és de prova (`src/data/club.js`). Per provar les reserves
  pots fer servir el DNI `12345678A` o el número de soci `001`.
- Per connectar dades reals (padró de socis, reserves compartides, enviament de
  correus) només cal substituir:
  - `src/data/club.js` — configuració de zones, franges i socis.
  - `src/lib/reservations.js` — capa de dades; canvieu `loadAll` / `createReservation`
    per crides a la vostra API o Google Sheet.
  - L'enviament del formulari d'alta a `src/components/RegisterForm.jsx` (`onSubmit`).

## Personalització ràpida

- Colors i tipografia: variables a dalt de `src/index.css`.
- Textos i zones: `src/data/club.js`.
- Normes de la barbacoa i altres zones: camp `normes` de cada zona.
