export async function sendBookingRequest(endpoint, payload, fetcher = fetch) {
  if (!endpoint) throw new Error('L’enviament no està configurat. Contacta amb el club.');
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.ok !== true) {
    throw new Error('No s’ha pogut enviar la sol·licitud. Torna-ho a provar o contacta amb el club.');
  }
  return data;
}
