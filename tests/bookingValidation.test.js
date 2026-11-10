import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBookingForm, bookingValidationError } from '../src/lib/bookingValidation.js';
const filled = { nom: 'Anna Martí', email: 'anna@example.test', telefon: '600123456', persones: '4', motiu: 'Dinar', accept: true };
test('complete booking can submit without a member ID or login', () => {
  assert.equal(bookingValidationError(filled, '2026-12-01'), '');
});
test('missing date and unchecked rules have explicit errors', () => {
  assert.match(bookingValidationError(filled, null), /dia disponible/);
  assert.match(bookingValidationError({ ...filled, accept: false }, '2026-12-01'), /normes/);
});
test('blank names are rejected even when HTML required sees whitespace', () => {
  assert.match(bookingValidationError({ ...filled, nom: '   ' }, '2026-12-01'), /nom/);
});
test('submission uses current form values including autofilled inputs', () => {
  const data = new FormData();
  for (const [key, value] of Object.entries(filled)) data.set(key, key === 'accept' ? 'on' : ` ${value} `);
  assert.deepEqual(readBookingForm(data), filled);
});
