// Public calendar reads only. Dates and reservation days use Europe/Madrid.
export const CALENDARS = {
  poliesportiva: '2a4c1997e87d685e19c4c2e5f54d0a4dcbf4bc368e232cf741593d533a26bb63@group.calendar.google.com',
  sala: '1da2e4a06444f83d2a4bdbca717d75661c7f93e6dea6a5be65bc50788e0b874a@group.calendar.google.com',
  piscina: '3a3fb1fdbfb62ac28b766de06c24deb4522897ed35d22cb135f4cb440145ebcd@group.calendar.google.com',
  barbacoa: '0b59bad2274ed3e2b38707cf126a57f31c7d05b4a3a6c959cb9f98d84b0dc7d0@group.calendar.google.com',
};

export function madridDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((p) => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function nextDate(day) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

// Any non-cancelled event blocks the day, even if marked "free" (all-day events default to free). End dates are exclusive.
export function blockedDates(events, first, endExclusive) {
  const blocked = new Set();
  for (const event of events) {
    if (event.status === 'cancelled') continue;
    const start = event.start?.date || (event.start?.dateTime && madridDate(new Date(event.start.dateTime)));
    const last = event.end?.date
      ? event.end.date
      : event.end?.dateTime
        ? nextDate(madridDate(new Date(new Date(event.end.dateTime).getTime() - 1)))
        : start && nextDate(start);
    if (!start || !last) throw new Error('El calendari conté un esdeveniment amb dates invàlides.');
    for (let day = start < first ? first : start; day < last && day < endExclusive; day = nextDate(day)) {
      blocked.add(day);
    }
  }
  return blocked;
}

export async function fetchGoogleAvailability(zoneId, year, month, { apiKey, signal, fetcher = fetch } = {}) {
  if (!CALENDARS[zoneId] || !apiKey) throw new Error('No es pot consultar el calendari. Contacta amb el club.');
  const first = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10);
  // Widen bounds around local midnight, then clip events to Madrid dates.
  const params = new URLSearchParams({
    key: apiKey, singleEvents: 'true', timeZone: 'Europe/Madrid', maxResults: '2500',
    timeMin: new Date(Date.parse(`${first}T00:00:00Z`) - 86400000).toISOString(),
    timeMax: `${end}T00:00:00Z`,
    fields: 'items(status,transparency,start,end),nextPageToken',
  });
  const events = [];
  let pageToken;
  do {
    if (pageToken) params.set('pageToken', pageToken);
    const response = await fetcher(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARS[zoneId])}/events?${params}`, { signal, cache: 'no-store' });
    if (!response.ok) throw new Error('No s’ha pogut consultar la disponibilitat de Google Calendar. Torna-ho a provar.');
    const data = await response.json();
    if (data.items !== undefined && !Array.isArray(data.items)) throw new Error('Resposta del calendari invàlida.');
    events.push(...(data.items || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return blockedDates(events, first, end);
}
