import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockedDates, fetchGoogleAvailability, madridDate } from '../src/lib/googleCalendar.js';
const range = ['2026-10-01', '2026-11-01'];
test('all-day events use an exclusive end and clip to the month', () => {
  assert.deepEqual([...blockedDates([{ start: { date: '2026-09-29' }, end: { date: '2026-10-03' } }], ...range)], ['2026-10-01', '2026-10-02']);
});
test('timed events span Madrid dates, including DST; midnight end does not block next day', () => {
  assert.deepEqual([...blockedDates([{ start: { dateTime: '2026-10-24T22:30:00Z' }, end: { dateTime: '2026-10-26T23:00:00Z' } }], ...range)], ['2026-10-25', '2026-10-26']);
  assert.equal(madridDate(new Date('2026-06-01T22:30:00Z')), '2026-06-02');
});
test('cancelled events do not block days, but events marked free do', () => {
  const event = extra => ({ ...extra, start: { date: '2026-10-02' }, end: { date: '2026-10-03' } });
  assert.equal(blockedDates([event({ status: 'cancelled' })], ...range).size, 0);
  assert.deepEqual([...blockedDates([event({ status: 'confirmed', transparency: 'transparent' })], ...range)], ['2026-10-02']);
});
test('reads every page and expands recurring events', async () => {
  let calls = 0;
  const result = await fetchGoogleAvailability('sala', 2026, 9, { apiKey: 'test', fetcher: async (url) => {
    const params = new URL(url).searchParams;
    assert.equal(params.get('singleEvents'), 'true');
    calls++;
    if (calls === 1) return { ok: true, json: async () => ({ items: [], nextPageToken: 'next' }) };
    assert.equal(params.get('pageToken'), 'next');
    return { ok: true, json: async () => ({ items: [{ start: { date: '2026-10-04' }, end: { date: '2026-10-05' } }] }) };
  } });
  assert.deepEqual([...result], ['2026-10-04']);
  assert.equal(calls, 2);
});
test('unavailable calendars never fall back to empty availability', async () => {
  await assert.rejects(fetchGoogleAvailability('sala', 2026, 9, { apiKey: 'test', fetcher: async () => ({ ok: false }) }));
  await assert.rejects(fetchGoogleAvailability('sala', 2026, 9));
});
