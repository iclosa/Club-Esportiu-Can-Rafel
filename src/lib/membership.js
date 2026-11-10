const TEXT_FIELDS = {
  titular_nom: 'Nom i cognoms', titular_naixement: 'Data de naixement', titular_dni: 'DNI',
  titular_adreca: 'Adreça', titular_poblacio: 'Població', titular_cp: 'Codi postal',
  titular_mobil: 'Telèfon mòbil', titular_fix: 'Telèfon fix', titular_email: 'Correu electrònic',
  banc_titular: 'Domiciliació - Titular', banc_dni: 'Domiciliació - DNI/NIF',
  banc_entitat: 'Domiciliació - Entitat', banc_mes: 'Domiciliació - Mes d’inici', banc_iban: 'Domiciliació - IBAN',
};

export function buildMembershipForm(form, beneficiaries) {
  const data = new FormData();
  const value = key => String(form.get(key) || '').trim();
  if (!value('titular_nom')) throw new Error('Cal indicar el nom del titular.');
  if (!form.has('auth_dades') || !form.has('auth_veracitat')) throw new Error('Cal acceptar les autoritzacions obligatòries.');
  data.set('_subject', `Sol·licitud d’alta de soci — ${value('titular_nom')}`);
  data.set('email', value('titular_email'));
  for (const [key, label] of Object.entries(TEXT_FIELDS)) data.set(label, value(key) || '—');
  for (const [key, label] of Object.entries({ auth_imatge: 'Autoritza ús d’imatge', auth_dades: 'Autoritza tractament de dades', auth_veracitat: 'Confirma veracitat i condicions' })) {
    data.set(label, form.has(key) ? 'Sí' : 'No');
  }
  const filled = beneficiaries.filter(b => b.nom.trim());
  if (filled.length > 4) throw new Error('Es permeten com a màxim 4 beneficiaris.');
  data.set('Nombre de beneficiaris', String(filled.length));
  filled.forEach((beneficiary, index) => {
    const prefix = `Beneficiari ${index + 1}`;
    for (const [key, label] of Object.entries({ nom: 'Nom', naixement: 'Naixement', dni: 'DNI', parentiu: 'Parentiu', telefon: 'Telèfon', email: 'Correu' })) {
      data.set(`${prefix} - ${label}`, String(beneficiary[key] || '').trim() || '—');
    }
  });
  return data;
}

export async function sendMembershipRequest(endpoint, data, fetcher = fetch) {
  if (!endpoint) throw new Error('L’enviament no està configurat. Contacta amb el club.');
  const response = await fetcher(endpoint, {
    method: 'POST', headers: { Accept: 'application/json' }, body: data,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.ok !== true) {
    throw new Error('No s’ha pogut enviar la sol·licitud. Torna-ho a provar o contacta amb el club.');
  }
  return result;
}
