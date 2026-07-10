# Supabase + Odoo Appointments

La web ya no enlaza directamente a la página de Odoo Appointments. Ahora:

- consulta disponibilidad por API,
- muestra fechas y horas en el frontend,
- y crea la reserva en Odoo por API.

## Modelos Odoo usados

- `appointment.type`
- `appointment.slot`
- `calendar.event`
- `res.partner`

Appointment types confirmados en esta instancia:

- `9` Reserva Zona de barbacoa
- `10` Reserva Terrassa de les moreres
- `11` Reserva Pista multiesportiva
- `12` Reserva Sala polivalent

## Arquitectura

- React web -> Supabase Edge Functions
- App iPhone/Android -> Supabase Edge Functions
- Supabase Edge Functions -> Odoo JSON-2 API

## Secrets en Supabase

- `ODOO_BASE_URL=https://edu-clubesportiucanrafel.odoo.com`
- `ODOO_DATABASE=edu-clubesportiucanrafel`
- `ODOO_API_KEY=<api key>`

## Variable pública del frontend

```env
VITE_RESERVATIONS_API_URL=https://kmbcptnavfwirvvqfbdc.supabase.co/functions/v1
```

## Endpoints del backend

### `GET /availability`

Query params:

- `appointmentTypeId`
- `year`
- `month`

Respuesta:

```json
{
  "appointmentTypeId": 9,
  "appointmentName": "Reserva Zona de barbacoa",
  "durationHours": 12,
  "days": [
    {
      "date": "2026-07-12",
      "slots": [
        {
          "start": "2026-07-12T09:00",
          "end": "2026-07-12T21:00",
          "label": "09:00 – 21:00"
        }
      ]
    }
  ]
}
```

### `POST /reservations`

Body:

```json
{
  "appointmentTypeId": 9,
  "zonaId": "barbacoa",
  "zonaNom": "Zona de barbacoa",
  "nom": "Nom Cognoms",
  "email": "persona@example.com",
  "telefon": "600000000",
  "persones": 12,
  "motiu": "Dinar familiar",
  "soci": true,
  "slotStart": "2026-07-12T09:00",
  "slotEnd": "2026-07-12T21:00"
}
```

## Estado del código

- El frontend usa [src/components/Reservations.jsx](/Users/isaacclosapros/Documents/projects/club-can-rafel-web/src/components/Reservations.jsx:1)
- El calendario usa [src/components/Calendar.jsx](/Users/isaacclosapros/Documents/projects/club-can-rafel-web/src/components/Calendar.jsx:1)
- El cliente API usa [src/lib/reservations.js](/Users/isaacclosapros/Documents/projects/club-can-rafel-web/src/lib/reservations.js:1)
- Supabase functions están en `supabase/functions`

## Despliegue

```bash
supabase functions deploy availability --no-verify-jwt
supabase functions deploy reservations --no-verify-jwt
```

## Riesgo pendiente

La lectura de disponibilidad está validada contra la configuración real de Odoo. La creación de `calendar.event` está implementada con los campos de Appointments detectados por API, pero todavía necesita una prueba real desplegada en Supabase para confirmar que Odoo acepta exactamente ese payload de creación sin ajustes adicionales.
