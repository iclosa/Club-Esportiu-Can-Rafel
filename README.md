# Club Esportiu Can Rafel — Web

Landing React + Vite per al Club Esportiu Can Rafel.

## Què inclou

1. **Inici** — explicació del club, ambient de bosc de pins, zones i crides a l'acció.
2. **Fes-te soci** — formulari d'alta amb totes les dades del full d'inscripció:
   titular, fins a 4 beneficiaris, domiciliació bancària i autoritzacions RGPD.
3. **Reserves** — selecció de zona, consulta de dates disponibles i enviament
   de la reserva des del web.

## Posada en marxa

```bash
npm install
npm run dev      # entorn de desenvolupament
npm run build    # build de producció (carpeta dist/)
npm run preview  # previsualitza el build
```

## Notes

- Les reserves depenen de `VITE_RESERVATIONS_API_URL`.
- El llistat de socis continua sent de prova a `src/data/club.js`.
- El formulari d'alta encara usa Formspree si `VITE_FORMSPREE_ENDPOINT` està configurat.

## Personalització ràpida

- Colors i tipografia: variables a dalt de `src/index.css`.
- Textos i zones: `src/data/club.js`.
- Normes de la barbacoa i altres zones: camp `normes` de cada zona.
