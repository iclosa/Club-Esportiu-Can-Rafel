import { useEffect, useRef, useState } from 'react';
import { CLUB, FORMSPREE_ENDPOINT, ZONES } from '../data/club.js';
import { fetchGoogleAvailability, madridDate } from '../lib/googleCalendar.js';
import { sendBookingRequest } from '../lib/bookingRequest.js';
import { readBookingForm, bookingValidationError } from '../lib/bookingValidation.js';
import Calendar from './Calendar.jsx';
import PadelFronto from './PadelFronto.jsx';

function formatReservationDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

const EMPTY = { nom: '', email: '', telefon: '', persones: '', motiu: '', accept: false };

export default function Reservations({ section = 'zones' }) {
  const [zoneId, setZoneId] = useState(ZONES[0].id);
  const [date, setDate] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const submitting = useRef(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (!result || !resultRef.current) return;
    resultRef.current.focus({ preventScroll: true });
    resultRef.current.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [result]);
  const zone = ZONES.find(item => item.id === zoneId);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const booking = readBookingForm(new FormData(event.currentTarget));
    const validationError = bookingValidationError(booking, date);
    if (validationError) {
      setResult({ ok: false, error: validationError });
      return;
    }
    if (!FORMSPREE_ENDPOINT) {
      setResult({ ok: false, error: `L’enviament encara no està disponible. Contacta amb ${CLUB.email}.` });
      return;
    }
    submitting.current = true;
    setSending(true);
    setResult(null);
    try {
      if (date < madridDate()) throw new Error('Selecciona una data futura.');
      const [year, month] = date.split('-').map(Number);
      const blocked = await fetchGoogleAvailability(zoneId, year, month - 1, { apiKey: import.meta.env.VITE_GCAL_API_KEY });
      if (blocked.has(date)) {
        setDate(null);
        throw new Error('Aquesta data ja està ocupada. Selecciona una altra data.');
      }
      await sendBookingRequest(FORMSPREE_ENDPOINT, {
        _subject: `Sol·licitud de reserva: ${zone.nom} — ${date} — ${booking.nom.trim()}`,
        email: booking.email.trim(),
        'Zona': zone.nom,
        'Data': date,
        'Horari': 'Tot el dia (Europe/Madrid)',
        'Soci': booking.nom.trim(),
        'Telèfon de contacte': booking.telefon.trim(),
        'Nombre de persones': Number(booking.persones),
        'Motiu': booking.motiu.trim(),
        'Estat': 'Pendent de confirmació del club',
      });
      setResult({ ok: true, zone: zone.nom, date, name: booking.nom.trim() });
      setForm(EMPTY);
      setDate(null);
    } catch (error) {
      setResult({ ok: false, error: error.message || `No s’ha pogut enviar. Contacta amb ${CLUB.email}.` });
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  if (section === 'courts') return <section className="section"><div className="container"><h1 className="section__title">Pàdel i frontó</h1><PadelFronto /></div></section>;
  return <section className="section"><div className="container">
    <h1 className="section__title">Reserva una zona</h1>
    <p className="section__lead">Selecciona la zona i una data disponible, i escriu el nom del soci responsable. Enviarem la sol·licitud al club, que et confirmarà la reserva per correu.</p>
    {result?.ok && <div ref={resultRef} tabIndex={-1} style={{ scrollMarginTop: 100 }} className="alert alert--ok" role="status">
      <strong>Sol·licitud enviada</strong><br />{result.zone} · {formatReservationDate(result.date)} · {result.name}.<br />
      Pendent de confirmació del club. La sol·licitud no bloqueja el calendari.
    </div>}
    <fieldset disabled={sending} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <legend className="hint">1. Tria la zona</legend>
      <div className="zones">{ZONES.map(item => <button type="button" key={item.id}
        className={`zone-pick ${item.id === zoneId ? 'active' : ''}`} aria-pressed={item.id === zoneId}
        onClick={() => { setZoneId(item.id); setDate(null); setResult(null); }}>
        <span className="e">{item.emoji}</span><strong>{item.nom}</strong><small>{item.capacitat}</small>
      </button>)}</div>
      <div className="reserve-layout"><div>
        <h2>2. Tria el dia</h2>
        <Calendar key={zoneId} zonaId={zoneId} selected={date} onSelect={setDate} />
        <div className="norms" style={{ marginTop: 24 }}><h3>{zone.nom}</h3><p>{zone.descripcio}</p><p>{zone.capacitat}</p>
          <h4>Normes de la zona</h4><ul>{zone.normes.map(rule => <li key={rule}>{rule}</li>)}</ul>
        </div>
      </div><form className="form" onSubmit={submit}>
        <h2>3. Dades de la sol·licitud</h2>
        <p className="alert alert--info">{date ? `Dia seleccionat: ${formatReservationDate(date)} · Tot el dia` : 'Selecciona un dia disponible al calendari.'}</p>
        <div className="field"><label htmlFor="booking-name">Nom i cognoms del soci responsable *</label><input id="booking-name" name="nom" type="text" autoComplete="name" required maxLength={150} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
        <div className="field"><label htmlFor="booking-email">Correu de contacte *</label><input id="booking-email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div className="field"><label htmlFor="booking-phone">Telèfon de contacte *</label><input id="booking-phone" name="telefon" type="tel" autoComplete="tel" required maxLength={30} value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} /></div>
        <div className="field"><label htmlFor="booking-people">Nombre de persones *</label><input id="booking-people" name="persones" type="number" min="1" max={zone.capacitat.match(/\d+/)?.[0]} step="1" required value={form.persones} onChange={e => setForm({ ...form, persones: e.target.value })} /></div>
        <div className="field"><label htmlFor="booking-purpose">Motiu de la reserva *</label><textarea id="booking-purpose" name="motiu" rows={3} maxLength={2000} required value={form.motiu} onChange={e => setForm({ ...form, motiu: e.target.value })} /></div>
        <label style={{ display: 'flex', gap: 10, marginBottom: 20 }}><input type="checkbox" name="accept" required checked={form.accept} onChange={e => setForm({ ...form, accept: e.target.checked })} />Accepto les normes de la zona i entenc que el club ha de confirmar la reserva.</label>
        {!FORMSPREE_ENDPOINT && <p className="alert alert--err">L’enviament encara no està disponible. Contacta amb el club.</p>}
        <button type="submit" className="btn btn--primary btn--block" disabled={sending}>
          {sending ? 'Enviant…' : 'Enviar sol·licitud de reserva'}
        </button>
        {result && !result.ok && <div ref={resultRef} tabIndex={-1} style={{ scrollMarginTop: 100 }} className="alert alert--err" role="alert">{result.error}</div>}
        <p className="hint">Contacte del club: <a href={`mailto:${CLUB.email}`}>{CLUB.email}</a>.</p>
      </form></div>
    </fieldset>
  </div></section>;
}
