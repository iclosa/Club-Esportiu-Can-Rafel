# Reservas de producción

## Ramas

- `integration/odoo`: conserva el estado completo anterior (`f15da4e`), incluido login, reservas y pagos.
- `production`: reservas de zonas sin login, consulta de Google Calendar y solicitudes por Formspree.
- `main`: no se ha modificado.

## Funcionamiento

1. El usuario elige zona y día completo, y escribe el nombre y apellidos del socio responsable en un campo libre obligatorio. No se consulta Odoo.
2. Google Calendar indica días ocupados. Se expanden las recurrencias, se leen todas las páginas y se usa Europe/Madrid. Cualquier evento no cancelado bloquea el día, aunque esté marcado como «Libre» (los eventos de día completo lo están por defecto). Los eventos cancelados no bloquean.
3. Antes de enviar se consulta de nuevo el calendario. Si Google falla, no se permite enviar.
4. Formspree recibe zona, día, nombre del socio, correo y teléfono de contacto, personas y motivo.
5. Solo una respuesta satisfactoria del proveedor muestra «Sol·licitud enviada». La junta confirma la reserva y la incorpora manualmente a Google Calendar.

Las solicitudes pendientes no bloquean fechas para otros usuarios. El nombre escrito no autentica la identidad del socio: el club debe comprobarla al confirmar. No hay escritura automática en Google Calendar ni garantía de exclusión entre solicitudes simultáneas.

Pádel y frontón utilizan el bloque de la app externa del club. El formulario de alta de socios también envía sus datos por Formspree mediante multipart/form-data, sin archivos adjuntos. No crea oportunidades en Odoo.

## Configuración para el despliegue

- `VITE_GCAL_API_KEY`: clave pública para Google Calendar API, restringida al dominio de la web y a esa API. Los cuatro calendarios deben permitir lectura pública de eventos.
- `VITE_FORMSPREE_ENDPOINT`: formulario con destinatario **clubcanrafel@gmail.com** verificado en el panel de Formspree. El destinatario se configura en Formspree, no en el payload del navegador.
- `VITE_RESERVATIONS_API_URL`: configuración antigua; no se utiliza en las reservas ni las altas de esta rama.

Las variables VITE se incorporan durante el build: volver a construir después de configurarlas. El hosting debe servir `index.html` para rutas como `/reserves-zones` y `/reserves-pistes`.

## Pendiente antes de lanzar

- Validar en el dominio de producción los cuatro calendarios (desde este entorno la comprobación HTTPS falla por resolución DNS).
- Comprobar destinatario de Formspree y realizar una solicitud controlada para verificar recepción.
- Confirmar que se desean reservas por día completo y confirmación manual del club.

## Validación local

`npm test`: calendario (recurrencia mediante singleEvents, paginación, multiday, fin exclusivo, medianoche, DST y errores), contrato de envío.

`npm run build`: compilación de producción.

Referencias: [Google Calendar events.list](https://developers.google.com/workspace/calendar/api/v3/reference/events/list).

## Altas por Formspree

Se usa el mismo `VITE_FORMSPREE_ENDPOINT`, con asunto «Sol·licitud d’alta de soci». Incluye titular, datos bancarios, autorizaciones y hasta cuatro beneficiarios, sin archivos adjuntos. El destinatario se configura en el panel de Formspree.

No se pide fotocopia del DNI ni fotos; se mantienen los campos de texto del número de DNI. No requiere la función de file uploads. Si el proveedor rechaza el envío, se muestra un error y se conservan los datos. No se ha realizado un envío real.
