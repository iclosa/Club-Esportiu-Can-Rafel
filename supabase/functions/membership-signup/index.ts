import { corsHeaders, withCorsHeaders } from "../_shared/cors.ts";

type AttachmentPayload = {
  name: string;
  mimetype: string;
  data: string;
};

type BeneficiaryPayload = {
  nom: string;
  naixement: string;
  dni: string;
  parentiu: string;
  telefon: string;
  email: string;
  foto?: AttachmentPayload | null;
};

type MembershipPayload = {
  titular_nom: string;
  titular_naixement: string;
  titular_dni: string;
  titular_adreca: string;
  titular_poblacio: string;
  titular_cp: string;
  titular_mobil: string;
  titular_fix: string;
  titular_email: string;
  banc_titular: string;
  banc_dni: string;
  banc_entitat: string;
  banc_mes: string;
  banc_iban: string;
  auth_imatge: boolean;
  auth_dades: boolean;
  auth_veracitat: boolean;
  beneficiaris: BeneficiaryPayload[];
  attachments: AttachmentPayload[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const payload = validatePayload(await req.json());
    const leadId = await createLead(payload);
    await createAttachments(leadId, collectAllAttachments(payload));
    return json({ ok: true, leadId });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No s'ha pogut crear l'oportunitat de CRM.",
      },
      400
    );
  }
});

function validatePayload(payload: unknown): MembershipPayload {
  const body = payload && typeof payload === "object" ? payload : {};
  const data = body as Record<string, unknown>;
  const titular_nom = stringField(data.titular_nom, true, "Nom del titular");
  const titular_naixement = stringField(data.titular_naixement, true, "Naixement del titular");
  const titular_dni = stringField(data.titular_dni, true, "DNI del titular");
  const titular_adreca = stringField(data.titular_adreca, true, "Adreça");
  const titular_poblacio = stringField(data.titular_poblacio, true, "Població");
  const titular_cp = stringField(data.titular_cp, true, "Codi postal");
  const titular_mobil = stringField(data.titular_mobil, true, "Telèfon mòbil");
  const titular_fix = stringField(data.titular_fix);
  const titular_email = stringField(data.titular_email, true, "Correu electrònic");
  const banc_titular = stringField(data.banc_titular);
  const banc_dni = stringField(data.banc_dni);
  const banc_entitat = stringField(data.banc_entitat);
  const banc_mes = stringField(data.banc_mes);
  const banc_iban = stringField(data.banc_iban);
  const auth_imatge = Boolean(data.auth_imatge);
  const auth_dades = Boolean(data.auth_dades);
  const auth_veracitat = Boolean(data.auth_veracitat);

  if (!auth_veracitat) {
    throw new Error("Cal confirmar la veracitat de les dades.");
  }

  const beneficiarisRaw = Array.isArray(data.beneficiaris) ? data.beneficiaris : [];
  const attachmentsRaw = Array.isArray(data.attachments) ? data.attachments : [];
  const beneficiaris = beneficiarisRaw
    .map((item, index) => normalizeBeneficiary(item, index))
    .filter(Boolean) as BeneficiaryPayload[];
  const attachments = attachmentsRaw.map((item, index) =>
    normalizeAttachment(item, `Adjunt ${index + 1}`)
  );

  return {
    titular_nom,
    titular_naixement,
    titular_dni,
    titular_adreca,
    titular_poblacio,
    titular_cp,
    titular_mobil,
    titular_fix,
    titular_email,
    banc_titular,
    banc_dni,
    banc_entitat,
    banc_mes,
    banc_iban,
    auth_imatge,
    auth_dades,
    auth_veracitat,
    beneficiaris,
    attachments,
  };
}

function normalizeBeneficiary(item: unknown, index: number) {
  if (!item || typeof item !== "object") return null;
  const data = item as Record<string, unknown>;
  const nom = stringField(data.nom);
  const naixement = stringField(data.naixement);
  const dni = stringField(data.dni);
  const parentiu = stringField(data.parentiu);
  const telefon = stringField(data.telefon);
  const email = stringField(data.email);
  const foto = data.foto ? normalizeAttachment(data.foto, `Foto beneficiari ${index + 1}`) : null;

  if (!nom) return null;
  return { nom, naixement, dni, parentiu, telefon, email, foto };
}

function normalizeAttachment(item: unknown, label: string): AttachmentPayload {
  if (!item || typeof item !== "object") {
    throw new Error(`${label} no és vàlid.`);
  }
  const data = item as Record<string, unknown>;
  const name = stringField(data.name, true, `${label} nom`);
  const mimetype = stringField(data.mimetype, true, `${label} tipus`);
  const raw = stringField(data.data, true, `${label} contingut`);
  return { name, mimetype, data: raw };
}

async function createLead(payload: MembershipPayload) {
  const leadValues = {
    name: `Alta soci web - ${payload.titular_nom}`,
    type: "opportunity",
    team_id: 1,
    contact_name: payload.titular_nom,
    email_from: payload.titular_email,
    phone: payload.titular_mobil,
    street: payload.titular_adreca,
    zip: payload.titular_cp,
    city: payload.titular_poblacio,
    description: buildDescription(payload),
  };

  const created = await odooCall<number[] | number>("crm.lead/create", {
    context: { lang: "ca_ES", tz: "Europe/Madrid" },
    vals_list: [leadValues],
  });

  return Array.isArray(created) ? created[0] : created;
}

async function createAttachments(leadId: number, attachments: AttachmentPayload[]) {
  if (!attachments.length) return;

  await odooCall<number[] | number>("ir.attachment/create", {
    context: { lang: "ca_ES", tz: "Europe/Madrid" },
    vals_list: attachments.map((attachment) => ({
      name: attachment.name,
      type: "binary",
      datas: attachment.data,
      mimetype: attachment.mimetype,
      res_model: "crm.lead",
      res_id: leadId,
    })),
  });
}

function collectAllAttachments(payload: MembershipPayload) {
  const beneficiaryPhotos = payload.beneficiaris
    .flatMap((beneficiary, index) => {
      if (!beneficiary.foto) return [];
      return [
        {
          ...beneficiary.foto,
          name:
            beneficiary.foto.name ||
            `beneficiari-${index + 1}-${beneficiary.nom || "sense-nom"}`,
        },
      ];
    });

  return [...payload.attachments, ...beneficiaryPhotos];
}

function buildDescription(payload: MembershipPayload) {
  const beneficiaris = payload.beneficiaris.length
    ? payload.beneficiaris
        .map(
          (b, index) =>
            `<p><strong>Beneficiari ${index + 1}</strong><br>` +
            `Nom: ${escapeHtml(b.nom)}<br>` +
            `Naixement: ${escapeHtml(b.naixement || "—")}<br>` +
            `DNI: ${escapeHtml(b.dni || "—")}<br>` +
            `Parentiu: ${escapeHtml(b.parentiu || "—")}<br>` +
            `Telèfon: ${escapeHtml(b.telefon || "—")}<br>` +
            `Correu: ${escapeHtml(b.email || "—")}<br>` +
            `Foto adjunta: ${b.foto ? "Sí" : "No"}</p>`
        )
        .join("")
    : "<p>Sense beneficiaris.</p>";

  return [
    "<p><strong>Sol·licitud d'alta de soci des del web</strong></p>",
    `<p><strong>Titular:</strong> ${escapeHtml(payload.titular_nom)}</p>`,
    `<p><strong>Naixement:</strong> ${escapeHtml(payload.titular_naixement)}</p>`,
    `<p><strong>DNI:</strong> ${escapeHtml(payload.titular_dni)}</p>`,
    `<p><strong>Adreça:</strong> ${escapeHtml(payload.titular_adreca)}</p>`,
    `<p><strong>Població:</strong> ${escapeHtml(payload.titular_poblacio)}</p>`,
    `<p><strong>Codi postal:</strong> ${escapeHtml(payload.titular_cp)}</p>`,
    `<p><strong>Mòbil:</strong> ${escapeHtml(payload.titular_mobil)}</p>`,
    `<p><strong>Fix:</strong> ${escapeHtml(payload.titular_fix || "—")}</p>`,
    `<p><strong>Correu:</strong> ${escapeHtml(payload.titular_email)}</p>`,
    "<p><strong>Beneficiaris</strong></p>",
    beneficiaris,
    "<p><strong>Domiciliació bancària</strong></p>",
    `<p><strong>Titular del compte:</strong> ${escapeHtml(payload.banc_titular || "—")}</p>`,
    `<p><strong>DNI/NIF:</strong> ${escapeHtml(payload.banc_dni || "—")}</p>`,
    `<p><strong>Entitat:</strong> ${escapeHtml(payload.banc_entitat || "—")}</p>`,
    `<p><strong>Mes d'inici:</strong> ${escapeHtml(payload.banc_mes || "—")}</p>`,
    `<p><strong>IBAN:</strong> ${escapeHtml(payload.banc_iban || "—")}</p>`,
    "<p><strong>Autoritzacions</strong></p>",
    `<p>Ús d'imatge: ${payload.auth_imatge ? "Sí" : "No"}</p>`,
    `<p>Tractament de dades: ${payload.auth_dades ? "Sí" : "No"}</p>`,
    `<p>Veracitat i condicions: ${payload.auth_veracitat ? "Sí" : "No"}</p>`,
  ].join("");
}

async function odooCall<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const baseUrl = Deno.env.get("ODOO_BASE_URL")?.replace(/\/+$/, "") || "";
  const database = Deno.env.get("ODOO_DATABASE") || "";
  const apiKey = Deno.env.get("ODOO_API_KEY") || "";

  if (!baseUrl || !database || !apiKey) {
    throw new Error("Falten secrets d'Odoo a Supabase.");
  }

  const resp = await fetch(`${baseUrl}/json/2/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${apiKey}`,
      "X-Odoo-Database": database,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Odoo ha respost ${resp.status}: ${text}`);
  }

  return (await resp.json()) as T;
}

function stringField(value: unknown, required = false, label = "Camp") {
  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) throw new Error(`${label} és obligatori.`);
  return text;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: withCorsHeaders({ "Content-Type": "application/json" }),
  });
}
