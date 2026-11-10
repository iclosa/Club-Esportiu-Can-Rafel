import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendBookingRequest } from '../src/lib/bookingRequest.js';
test('email request requires configured service and explicit success', async () => {
  await assert.rejects(sendBookingRequest('', {}));
  for (const response of [{ ok: false, json: async () => ({ ok: true }) }, { ok: true, json: async () => ({}) }, { ok: true, json: async () => { throw new Error('invalid JSON'); } }]) {
    await assert.rejects(sendBookingRequest('https://example.test', {}, async () => response));
  }
});
test('email request sends entered name, zone, date and contact without auth', async () => {
  const payload = { Soci: 'Soci de prova', Zona: 'Sala', Data: '2026-12-01', email: 'test@example.test' };
  await sendBookingRequest('https://example.test', payload, async (url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(options.body), payload);
    return { ok: true, json: async () => ({ ok: true }) };
  });
});
