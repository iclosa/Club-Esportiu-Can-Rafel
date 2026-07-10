import {
  AppointmentSlotRecord,
  AppointmentTypeRecord,
  CalendarEventRecord,
  localIsoToOdooDateTime,
} from "./appointments.ts";

export type SlotOption = {
  start: string;
  end: string;
  label: string;
};

export type AvailabilityDay = {
  date: string;
  slots: SlotOption[];
};

export function validateReservationInput(payload: unknown) {
  const body = payload && typeof payload === "object" ? payload : {};
  const reserva = body as Record<string, unknown>;

  const appointmentTypeId = Number(reserva.appointmentTypeId);
  const authUserId =
    Number.isInteger(Number(reserva.authUserId)) && Number(reserva.authUserId) > 0
      ? Number(reserva.authUserId)
      : null;
  const authPartnerId =
    Number.isInteger(Number(reserva.authPartnerId)) && Number(reserva.authPartnerId) > 0
      ? Number(reserva.authPartnerId)
      : null;
  const zonaId = typeof reserva.zonaId === "string" ? reserva.zonaId.trim() : "";
  const zonaNom = typeof reserva.zonaNom === "string" ? reserva.zonaNom.trim() : "";
  const nom = typeof reserva.nom === "string" ? reserva.nom.trim() : "";
  const email = typeof reserva.email === "string" ? reserva.email.trim() : "";
  const telefon =
    typeof reserva.telefon === "string" && reserva.telefon.trim()
      ? reserva.telefon.trim()
      : null;
  const persones = Number(reserva.persones);
  const motiu = typeof reserva.motiu === "string" ? reserva.motiu.trim() : "";
  const selectedPartnerIds = Array.isArray(reserva.selectedPartnerIds)
    ? reserva.selectedPartnerIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    : [];
  const soci = Boolean(reserva.soci);
  const slotStart =
    typeof reserva.slotStart === "string" ? reserva.slotStart.trim() : "";
  const slotEnd = typeof reserva.slotEnd === "string" ? reserva.slotEnd.trim() : "";

  if (!Number.isInteger(appointmentTypeId) || appointmentTypeId <= 0) {
    throw new Error("Tipus de reserva no vàlid.");
  }
  if (!authPartnerId) {
    throw new Error("No s'ha identificat el contacte autenticat per fer la reserva.");
  }
  if (!zonaId || !zonaNom) throw new Error("Zona no vàlida.");
  if (!nom) throw new Error("El nom és obligatori.");
  if (!email) throw new Error("El correu és obligatori.");
  if (!Number.isFinite(persones) || persones <= 0) {
    throw new Error("El nombre de persones no és vàlid.");
  }
  if (!motiu) throw new Error("El motiu és obligatori.");
  if (!isIsoLocal(slotStart) || !isIsoLocal(slotEnd)) {
    throw new Error("Franja horària no vàlida.");
  }

  return {
    appointmentTypeId,
    authUserId,
    authPartnerId,
    zonaId,
    zonaNom,
    nom,
    email,
    telefon,
    persones,
    motiu,
    selectedPartnerIds,
    soci,
    slotStart,
    slotEnd,
  };
}

export function buildAvailabilityDays(args: {
  year: number;
  month: number;
  type: AppointmentTypeRecord;
  slots: AppointmentSlotRecord[];
  events: CalendarEventRecord[];
  now?: Date;
  durationHoursOverride?: number;
}): AvailabilityDay[] {
  const { year, month, type, slots, events } = args;
  const now = args.now || new Date();
  const minAllowed = addHours(now, type.min_schedule_hours || 0);
  const maxAllowed = addDays(startOfDay(now), type.max_schedule_days || 365);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: AvailabilityDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${pad(month)}-${pad(day)}`;
    const dateObj = new Date(`${date}T00:00:00`);
    const weekday = jsDayToOdoo(dateObj.getDay());
    const baseSlots = slots.length
      ? slots
          .filter((slot) => slot.slot_type === "recurring" && slot.weekday === weekday)
          .flatMap((slot) => expandSlot(date, slot, type, args.durationHoursOverride))
      : expandFallbackAllDaySlot(date, type);
    const daySlots = baseSlots.filter((slot) => {
      const startDate = new Date(`${slot.start}:00`);
      if (startDate < minAllowed) return false;
      if (startDate > maxAllowed) return false;
      return !hasOverlap(slot.start, slot.end, events);
    });

    days.push({
      date,
      slots: daySlots,
    });
  }

  return days;
}

function expandFallbackAllDaySlot(
  date: string,
  type: AppointmentTypeRecord
): SlotOption[] {
  if (type.appointment_duration < 23.99) return [];

  const start = `${date}T00:00`;
  const end = `${date}T23:59`;

  return [
    {
      start,
      end,
      label: "Tot el dia",
    },
  ];
}

function expandSlot(
  date: string,
  slot: AppointmentSlotRecord,
  type: AppointmentTypeRecord,
  durationHoursOverride?: number
): SlotOption[] {
  if (slot.allday) {
    const start = `${date}T00:00`;
    const end = `${date}T23:59`;
    return [
      {
        start,
        end,
        label: "Tot el dia",
      },
    ];
  }

  const startHour = slot.start_hour;
  const endHour = slot.end_hour;
  const duration = durationHoursOverride || type.appointment_duration;
  const step = type.slot_creation_interval || duration;
  const items: SlotOption[] = [];

  for (let cursor = startHour; cursor + duration <= endHour + 1e-9; cursor += step) {
    const start = `${date}T${formatHour(cursor)}`;
    const end = `${date}T${formatHour(cursor + duration)}`;
    items.push({
      start,
      end,
      label: `${formatLabel(cursor)} – ${formatLabel(cursor + duration)}`,
    });
  }

  return items;
}

function hasOverlap(startIso: string, endIso: string, events: CalendarEventRecord[]) {
  const start = localIsoToOdooDateTime(startIso);
  const end = localIsoToOdooDateTime(endIso);
  return events.some((event) => {
    const status = event.appointment_status || "";
    if (status === "cancelled") return false;
    return event.stop > start && event.start < end;
  });
}

function isIsoLocal(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function formatHour(hourFloat: number) {
  const hours = Math.floor(hourFloat);
  const minutes = Math.round((hourFloat - hours) * 60);
  return `${pad(hours)}:${pad(minutes)}`;
}

function formatLabel(hourFloat: number) {
  return formatHour(hourFloat);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function jsDayToOdoo(jsDay: number) {
  return String(jsDay === 0 ? 7 : jsDay);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 36e5);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 864e5);
}
