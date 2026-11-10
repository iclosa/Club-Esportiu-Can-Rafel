import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMembershipForm, sendMembershipRequest } from '../src/lib/membership.js';
function fixture() {
  const form = new FormData();
  for (const [key, value] of Object.entries({ titular_nom: 'Anna Test', titular_email: 'anna@example.test', banc_iban: 'TEST-IBAN', auth_dades: 'on', auth_veracitat: 'on' })) form.set(key, value);
  return form;
}
test('membership includes contact, banking, consents and beneficiaries without attachments', async () => {
  const data = buildMembershipForm(fixture(), [{ nom: 'Beneficiari' }]);
  assert.equal(data.get('email'), 'anna@example.test');
  assert.equal(data.get('Domiciliació - IBAN'), 'TEST-IBAN');
  assert.equal(data.get('Autoritza ús d’imatge'), 'No');
  assert.equal(data.get('Autoritza tractament de dades'), 'Sí');
  assert.equal(data.get('Beneficiari 1 - Nom'), 'Beneficiari');
  assert.ok([...data.values()].every(value => typeof value === 'string'));
  await sendMembershipRequest('https://example.test', data, async (url, options) => {
    assert.equal(options.body, data);
    assert.deepEqual(options.headers, { Accept: 'application/json' });
    return { ok: true, json: async () => ({ ok: true }) };
  });
});
test('membership cannot report success on rejection or missing configuration', async () => {
  await assert.rejects(sendMembershipRequest('', new FormData()));
  await assert.rejects(sendMembershipRequest('https://example.test', new FormData(), async () => ({ ok: false, json: async () => ({ errors: [{ message: 'Submission rejected' }] }) })));
  await assert.rejects(sendMembershipRequest('https://example.test', new FormData(), async () => ({ ok: true, json: async () => ({}) })));
});
