import { useEffect, useState } from 'react';
import { fetchGoogleAvailability, madridDate } from '../lib/googleCalendar.js';

const DOW = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
const MONTHS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];

export default function Calendar({ zonaId, selected, onSelect }) {
  const today = madridDate();
  const [cursor, setCursor] = useState(() => today.slice(0, 7));
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({ key: '', blocked: new Set(), error: '' });
  const [year, monthNumber] = cursor.split('-').map(Number);
  const month = monthNumber - 1;
  const key = `${zonaId}/${cursor}/${retry}`;
  const loading = state.key !== key;
  useEffect(() => {
    const controller = new AbortController();
    fetchGoogleAvailability(zonaId, year, month, {
      apiKey: import.meta.env.VITE_GCAL_API_KEY,
      signal: controller.signal,
    }).then(blocked => {
      if (!controller.signal.aborted) setState({ key, blocked, error: '' });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, blocked: new Set(), error: error.message });
    });
    return () => controller.abort();
  }, [zonaId, year, month, key]);

  function move(delta) {
    onSelect(null);
    setCursor(new Date(Date.UTC(year, month + delta, 1)).toISOString().slice(0, 7));
  }
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return <div className="cal" aria-busy={loading}>
    <div className="cal__head">
      <button type="button" aria-label="Mes anterior" disabled={cursor <= today.slice(0, 7)} onClick={() => move(-1)}>‹</button>
      <strong>{MONTHS[month]} {year}</strong>
      <button type="button" aria-label="Mes següent" onClick={() => move(1)}>›</button>
    </div>
    <div className="cal__grid">
      {DOW.map(day => <div className="cal__dow" key={day}>{day}</div>)}
      {Array.from({ length: offset }, (_, i) => <div className="cal__day empty" key={`empty-${i}`} />)}
      {Array.from({ length: days }, (_, i) => {
        const date = `${cursor}-${String(i + 1).padStart(2, '0')}`;
        const available = !loading && !state.error && date >= today && !state.blocked.has(date);
        return <button type="button" key={date} disabled={!available}
          aria-label={`${date}: ${available ? 'Disponible' : 'No disponible'}`}
          aria-pressed={selected === date}
          className={`cal__day ${available ? '' : 'full'} ${selected === date ? 'selected' : ''}`}
          onClick={() => onSelect(date)}>{i + 1}{available && <span className="dot" />}</button>;
      })}
    </div>
    {loading && <p className="hint" role="status">Consultant Google Calendar…</p>}
    {!loading && state.error && <div className="alert alert--err" role="alert">
      {state.error} <button type="button" onClick={() => { onSelect(null); setRetry(value => value + 1); }}>Torna-ho a provar</button>
    </div>}
  </div>;
}
