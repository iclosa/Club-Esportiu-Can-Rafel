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

## Reserves de producció

La branca `integration/odoo` conserva la integració anterior. A `production`, les reserves de zones no requereixen login: es consulta Google Calendar, s’escriu el nom del soci responsable i s'envia una sol·licitud per Formspree pendent de confirmació del club.

Cal configurar `VITE_GCAL_API_KEY` i `VITE_FORMSPREE_ENDPOINT`. Les reserves no consulten Odoo ni requereixen Supabase. Sense disponibilitat verificable, no es permet enviar. Les altes de socis també s’envien per Formspree, amb les dades del titular i dels beneficiaris, sense adjunts.

Consulta [configuració i passos pendents de producció](docs/reservas-produccion.md).

```bash
npm test
npm run build
```

## Personalització ràpida

- Colors i tipografia: variables a dalt de `src/index.css`.
- Textos i zones: `src/data/club.js`.
- Normes de la barbacoa i altres zones: camp `normes` de cada zona.
