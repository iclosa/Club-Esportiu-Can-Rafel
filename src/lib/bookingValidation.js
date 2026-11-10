export function readBookingForm(data) {
  return {
    ...Object.fromEntries(['nom', 'email', 'telefon', 'persones', 'motiu'].map(key => [key, String(data.get(key) || '').trim()])),
    accept: data.has('accept'),
  };
}

export function bookingValidationError(form, date) {
  if (!date) return 'Selecciona un dia disponible al calendari abans d’enviar la sol·licitud.';
  if (!form.nom.trim()) return 'Escriu el nom i cognoms del soci responsable.';
  if (!form.email.trim()) return 'Escriu el correu de contacte.';
  if (!form.telefon.trim()) return 'Escriu el telèfon de contacte.';
  if (!Number.isInteger(Number(form.persones)) || Number(form.persones) < 1) return 'Indica un nombre de persones vàlid.';
  if (!form.motiu.trim()) return 'Escriu el motiu de la reserva.';
  if (!form.accept) return 'Cal acceptar les normes de la zona abans d’enviar la sol·licitud.';
  return '';
}
