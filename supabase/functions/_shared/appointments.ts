export const TZ = "Europe/Madrid";

type OdooConfig = {
  baseUrl: string;
  database: string;
  apiKey: string;
};

export type AppointmentTypeRecord = {
  id: number;
  name: string;
  appointment_duration: number;
  resource_ids: number[];
  slot_ids: number[];
  schedule_based_on: string;
  assignment_method: string;
  manage_capacity: boolean;
  resource_total_capacity: number;
  min_schedule_hours: number;
  max_schedule_days: number;
  slot_creation_interval: number;
};

export type AppointmentSlotRecord = {
  id: number;
  appointment_type_id: [number, string];
  weekday: string;
  start_hour: number;
  end_hour: number;
  allday: boolean;
  start_datetime: string | false;
  end_datetime: string | false;
  restrict_to_resource_ids: number[];
  slot_type: string;
};

export type CalendarEventRecord = {
  id: number;
  name?: string;
  start: string;
  stop: string;
  appointment_type_id?: [number, string] | false;
  appointment_status?: string | false;
  appointment_resource_ids?: number[];
  resource_ids?: number[];
};

type PartnerRecord = {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
};

type JournalRecord = {
  id: number;
  name?: string;
  type?: string;
  inbound_payment_method_line_ids?: number[];
};

export type ReservationPayload = {
  appointmentTypeId: number;
  authUserId: number | null;
  authPartnerId: number | null;
  zonaId: string;
  zonaNom: string;
  nom: string;
  email: string;
  telefon: string | null;
  persones: number;
  motiu: string;
  selectedPartnerIds?: number[];
  soci: boolean;
  slotStart: string;
  slotEnd: string;
};

export function getOdooConfig(): OdooConfig {
  const baseUrl = Deno.env.get("ODOO_BASE_URL")?.replace(/\/+$/, "") || "";
  const database = Deno.env.get("ODOO_DATABASE") || "";
  const apiKey = Deno.env.get("ODOO_API_KEY") || "";

  if (!baseUrl || !database || !apiKey) {
    throw new Error("Falten secrets d'Odoo a Supabase.");
  }

  return { baseUrl, database, apiKey };
}

export async function getAppointmentType(
  appointmentTypeId: number
): Promise<AppointmentTypeRecord> {
  const records = await odooCall<AppointmentTypeRecord[]>(
    "appointment.type/search_read",
    {
      context: { lang: "ca_ES", tz: TZ },
      domain: [["id", "=", appointmentTypeId]],
      fields: [
        "id",
        "name",
        "appointment_duration",
        "resource_ids",
        "slot_ids",
        "schedule_based_on",
        "assignment_method",
        "manage_capacity",
        "resource_total_capacity",
        "min_schedule_hours",
        "max_schedule_days",
        "slot_creation_interval",
      ],
      limit: 1,
    }
  );

  if (!records.length) {
    throw new Error("No s'ha trobat el tipus de reserva a Odoo.");
  }

  return records[0];
}

export async function getAppointmentSlots(
  appointmentTypeId: number
): Promise<AppointmentSlotRecord[]> {
  return odooCall<AppointmentSlotRecord[]>("appointment.slot/search_read", {
    context: { lang: "ca_ES", tz: TZ },
    domain: [["appointment_type_id", "=", appointmentTypeId]],
    fields: [
      "id",
      "appointment_type_id",
      "weekday",
      "start_hour",
      "end_hour",
      "allday",
      "start_datetime",
      "end_datetime",
      "restrict_to_resource_ids",
      "slot_type",
    ],
    limit: 200,
    order: "weekday asc,start_hour asc",
  });
}

export async function getAppointmentEvents(
  appointmentTypeId: number,
  rangeStart: string,
  rangeEnd: string
): Promise<CalendarEventRecord[]> {
  return odooCall<CalendarEventRecord[]>("calendar.event/search_read", {
    context: { lang: "ca_ES", tz: TZ },
    domain: [
      ["appointment_type_id", "=", appointmentTypeId],
      ["active", "=", true],
      ["stop", ">", rangeStart],
      ["start", "<", rangeEnd],
    ],
    fields: [
      "id",
      "name",
      "start",
      "stop",
      "appointment_type_id",
      "appointment_status",
      "appointment_resource_ids",
      "resource_ids",
    ],
    limit: 1000,
    order: "start asc,id asc",
  });
}

export async function createAppointmentReservation(
  payload: ReservationPayload
): Promise<{ id: number }> {
  const partnerId =
    payload.authPartnerId ||
    (await findOrCreatePartner({
      name: payload.nom,
      email: payload.email,
      phone: payload.telefon,
    }));

  const type = await getAppointmentType(payload.appointmentTypeId);
  const extraPartnerIds = Array.isArray(payload.selectedPartnerIds)
    ? payload.selectedPartnerIds.filter((id) => id && id !== partnerId)
    : [];
  const allPartnerIds = [partnerId, ...extraPartnerIds];
  const resourceIds = type.resource_ids || [];
  if (!resourceIds.length) {
    throw new Error("Aquest tipus de reserva no té cap recurs assignat a Odoo.");
  }

  const eventValues: Record<string, unknown> = {
    name: buildReservationTitle(payload.zonaNom),
    start: localIsoToOdooDateTime(payload.slotStart),
    stop: localIsoToOdooDateTime(payload.slotEnd),
    event_tz: TZ,
    duration: diffHours(payload.slotStart, payload.slotEnd),
    appointment_type_id: payload.appointmentTypeId,
    appointment_booker_id: partnerId,
    partner_id: partnerId,
    partner_ids: [[6, 0, allPartnerIds]],
    description: buildDescription(payload),
  };

  const created = await odooCall<number[] | number>("calendar.event/create", {
    context: { lang: "ca_ES", tz: TZ },
    vals_list: [eventValues],
  });

  const id = Array.isArray(created) ? created[0] : created;

  await odooCall<number[] | number>("appointment.booking.line/create", {
    context: { lang: "ca_ES", tz: TZ },
    vals_list: resourceIds.map((resourceId) => ({
      calendar_event_id: id,
      appointment_resource_id: resourceId,
      appointment_type_id: payload.appointmentTypeId,
      capacity_reserved: 1,
      capacity_used: 1,
    })),
  });

  await odooCall<boolean>("calendar.event/write", {
    ids: [id],
    vals: {
      appointment_booker_id: partnerId,
      partner_id: partnerId,
      partner_ids: [[6, 0, allPartnerIds]],
      appointment_resource_ids: [[6, 0, resourceIds]],
      resource_ids: [[6, 0, resourceIds]],
      total_capacity_reserved: 1,
      total_capacity_used: 1,
    },
  });

  return { id };
}

export async function createPaidGuestInvoice(input: {
  partnerId: number;
  zonaNom: string;
  guestCount: number;
  amountCents: number;
  slotStart: string;
  stripeSessionId: string | null;
}): Promise<{ invoiceId: number }> {
  const productId = await resolveStripeProductId();
  const journal = await getInboundPaymentJournal();
  const invoiceDate = input.slotStart.slice(0, 10);
  const priceUnit = input.amountCents / 100 / Math.max(input.guestCount, 1);

  const created = await odooCall<number[] | number>("account.move/create", {
    context: { lang: "ca_ES", tz: TZ },
    vals_list: [
      {
        move_type: "out_invoice",
        partner_id: input.partnerId,
        invoice_date: invoiceDate,
        invoice_origin: `Reserva ${input.zonaNom}`,
        ref: input.stripeSessionId ? `Stripe ${input.stripeSessionId}` : undefined,
        invoice_line_ids: [
          [
            0,
            0,
            {
              product_id: productId,
              name: buildGuestInvoiceLineName(input.zonaNom, invoiceDate),
              quantity: input.guestCount,
              price_unit: priceUnit,
            },
          ],
        ],
      },
    ],
  });

  const invoiceId = Array.isArray(created) ? created[0] : created;

  await odooCall<boolean>("account.move/action_post", {
    ids: [invoiceId],
    context: { lang: "ca_ES", tz: TZ },
  });

  const registerPaymentId = await odooCall<number[] | number>(
    "account.payment.register/create",
    {
      context: {
        lang: "ca_ES",
        tz: TZ,
        active_model: "account.move",
        active_ids: [invoiceId],
        active_id: invoiceId,
      },
      vals_list: [
        {
          journal_id: journal.id,
          amount: input.amountCents / 100,
          payment_date: invoiceDate,
          communication: input.stripeSessionId
            ? `Pagament Stripe ${input.stripeSessionId}`
            : `Pagament targeta reserva ${input.zonaNom}`,
          ...(journal.inbound_payment_method_line_ids?.[0]
            ? { payment_method_line_id: journal.inbound_payment_method_line_ids[0] }
            : {}),
        },
      ],
    }
  );

  const wizardId = Array.isArray(registerPaymentId)
    ? registerPaymentId[0]
    : registerPaymentId;

  await odooCall<unknown>("account.payment.register/action_create_payments", {
    ids: [wizardId],
    context: {
      lang: "ca_ES",
      tz: TZ,
      active_model: "account.move",
      active_ids: [invoiceId],
      active_id: invoiceId,
    },
  });

  return { invoiceId };
}

async function findOrCreatePartner(input: {
  name: string;
  email: string;
  phone: string | null;
}): Promise<number> {
  const existing = await odooCall<PartnerRecord[]>("res.partner/search_read", {
    context: { lang: "ca_ES", tz: TZ },
    domain: [["email", "=", input.email]],
    fields: ["id", "name", "email", "phone"],
    limit: 1,
  });

  if (existing.length) {
    return existing[0].id;
  }

  const created = await odooCall<number[] | number>("res.partner/create", {
    context: { lang: "ca_ES", tz: TZ },
    vals_list: [
      {
        name: input.name,
        email: input.email,
        phone: input.phone || undefined,
      },
    ],
  });

  return Array.isArray(created) ? created[0] : created;
}

async function resolveStripeProductId() {
  const rawValue = Deno.env.get("ODOO_STRIPE_PRODUCT_ID") || "";
  const productId = Number(rawValue);
  if (productId) {
    return productId;
  }

  const configuredDefaultProductId = 13;
  const configuredProducts = await odooCall<{ id: number }[]>(
    "product.product/search_read",
    {
      context: { lang: "ca_ES", tz: TZ },
      domain: [["id", "=", configuredDefaultProductId]],
      fields: ["id"],
      limit: 1,
    }
  );

  if (configuredProducts.length) {
    return configuredProducts[0].id;
  }

  const existingProducts = await odooCall<{ id: number }[]>(
    "product.product/search_read",
    {
      context: { lang: "ca_ES", tz: TZ },
      domain: [["name", "=", "Convidat no soci"]],
      fields: ["id"],
      limit: 1,
    }
  );

  if (existingProducts.length) {
    return existingProducts[0].id;
  }

  const createdTemplate = await odooCall<number[] | number>("product.template/create", {
    context: { lang: "ca_ES", tz: TZ },
    vals_list: [
      {
        name: "Convidat no soci",
        type: "service",
        sale_ok: true,
        purchase_ok: false,
        list_price: 7,
        default_code: "WEB_GUEST_RESERVATION",
      },
    ],
  });

  const templateId = Array.isArray(createdTemplate)
    ? createdTemplate[0]
    : createdTemplate;

  const createdProducts = await odooCall<{ id: number }[]>(
    "product.product/search_read",
    {
      context: { lang: "ca_ES", tz: TZ },
      domain: [["product_tmpl_id", "=", templateId]],
      fields: ["id"],
      limit: 1,
    }
  );

  if (!createdProducts.length) {
    throw new Error(
      "S'ha creat el producte de cobrament, però no s'ha pogut obtenir la seva variant."
    );
  }

  return createdProducts[0].id;
}

async function getInboundPaymentJournal(): Promise<JournalRecord> {
  const configuredId = Number(Deno.env.get("ODOO_STRIPE_PAYMENT_JOURNAL_ID") || "0");
  const domain = configuredId ? [["id", "=", configuredId]] : [["type", "in", ["bank", "cash"]]];
  const journals = await odooCall<JournalRecord[]>("account.journal/search_read", {
    context: { lang: "ca_ES", tz: TZ },
    domain,
    fields: ["id", "name", "type", "inbound_payment_method_line_ids"],
    limit: 5,
    order: "id asc",
  });

  const journal = journals.find((item) => Array.isArray(item.inbound_payment_method_line_ids));
  if (!journal) {
    throw new Error(
      "No s'ha trobat cap diari de caixa o banc vàlid per registrar el cobrament."
    );
  }
  return journal;
}

function buildGuestInvoiceLineName(zonaNom: string, invoiceDate: string) {
  return `Convidat no soci · ${zonaNom} · ${invoiceDate}`;
}

async function odooCall<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const cfg = getOdooConfig();
  const resp = await fetch(`${cfg.baseUrl}/json/2/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${cfg.apiKey}`,
      "X-Odoo-Database": cfg.database,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Odoo ha respost ${resp.status}: ${text}`);
  }

  return (await resp.json()) as T;
}

function buildDescription(payload: ReservationPayload) {
  const tipus = payload.soci ? "Soci" : "No soci";
  return [
    `<p><strong>${escapeHtml(buildReservationTitle(payload.zonaNom))}</strong></p>`,
    `<p><strong>Zona:</strong> ${escapeHtml(payload.zonaNom)}</p>`,
    `<p><strong>Tipus:</strong> ${tipus}</p>`,
    `<p><strong>Nom:</strong> ${escapeHtml(payload.nom)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>`,
    `<p><strong>Telèfon:</strong> ${escapeHtml(payload.telefon || "—")}</p>`,
    `<p><strong>Persones:</strong> ${payload.persones}</p>`,
    `<p><strong>Motiu:</strong><br>${escapeHtml(payload.motiu).replace(/\n/g, "<br>")}</p>`,
  ].join("");
}

function buildReservationTitle(zonaNom: string) {
  const normalized = zonaNom.trim().toLowerCase();
  return `Reserva de ${normalized}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toOdooDateTime(isoLocal: string) {
  return localIsoToOdooDateTime(isoLocal);
}

function diffHours(startIso: string, endIso: string) {
  const start = new Date(`${startIso}:00`);
  const end = new Date(`${endIso}:00`);
  return (end.getTime() - start.getTime()) / 36e5;
}

export function localIsoToOdooDateTime(isoLocal: string) {
  const utcDate = localIsoToUtcDate(isoLocal, TZ);
  return formatUtcDateTime(utcDate);
}

export function localDateStartToOdooDateTime(date: string) {
  return localIsoToOdooDateTime(`${date}T00:00`);
}

export function nextLocalDateStartToOdooDateTime(date: string) {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + 1);
  const nextDate = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
  return localIsoToOdooDateTime(`${nextDate}T00:00`);
}

function localIsoToUtcDate(isoLocal: string, timeZone: string) {
  const match = isoLocal.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );
  if (!match) {
    throw new Error(`Data/hora local no vàlida: ${isoLocal}`);
  }

  const [, y, m, d, hh, mm] = match;
  const utcGuess = new Date(
    Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), 0)
  );
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMinutes * 60_000);
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return (asUtc - date.getTime()) / 60_000;
}

function formatUtcDateTime(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
