import { corsHeaders, withCorsHeaders } from "../_shared/cors.ts";

type LoginPayload = {
  login?: string;
  email?: string;
  username?: string;
  password?: string;
};

type OdooAuthResponse = {
  result?: {
    uid?: number;
    username?: string;
    name?: string;
    user_context?: {
      lang?: string;
      tz?: string;
    };
  };
  error?: {
    data?: {
      message?: string;
    };
    message?: string;
  };
};

type OdooUserRecord = {
  id: number;
  name?: string;
  login?: string;
  share?: boolean;
  partner_id?: [number, string] | false;
};

type OdooPartnerRecord = {
  id: number;
  name?: string;
  email?: string | false;
  phone?: string | false;
  category_id?: number[];
};

type OdooCategoryRecord = {
  id: number;
  name?: string;
};

const ALLOWED_MEMBER_TAGS = new Set([
  "Soci Titular",
  "Soci Jubilat",
  "Beneficiari",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const payload = validatePayload(await req.json());
    const auth = await authenticateAgainstOdoo(payload.login, payload.password);
    const user = await loadNormalizedUser(auth.uid, payload.login);

    return json({
      ok: true,
      loggedIn: true,
      uid: auth.uid,
      userId: auth.uid,
      partnerId: user.partnerId,
      login: user.login,
      name: user.name,
      email: user.email,
      phone: user.phone,
      memberTags: user.memberTags,
      hasPortalAccess: user.hasPortalAccess,
      lang: auth.lang,
      tz: auth.tz,
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No s'ha pogut iniciar la sessió.",
      },
      400
    );
  }
});

function validatePayload(payload: unknown) {
  const body = payload && typeof payload === "object" ? (payload as LoginPayload) : {};
  const login = String(body.login || body.email || body.username || "").trim();
  const password = String(body.password || "");

  if (!login || !password) {
    throw new Error("Cal indicar l'usuari i la contrasenya.");
  }

  return { login, password };
}

async function authenticateAgainstOdoo(login: string, password: string) {
  const { baseUrl, database } = getOdooConfig();
  const resp = await fetch(`${baseUrl}/web/session/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      params: {
        db: database,
        login,
        password,
      },
    }),
  });

  const data = (await resp.json()) as OdooAuthResponse;
  const uid = Number(data?.result?.uid || 0);
  if (!resp.ok || !uid) {
    const message =
      data?.error?.data?.message ||
      data?.error?.message ||
      "Credencials incorrectes.";
    throw new Error(message);
  }

  return {
    uid,
    lang: data.result?.user_context?.lang || "ca_ES",
    tz: data.result?.user_context?.tz || "Europe/Madrid",
  };
}

async function loadNormalizedUser(uid: number, identifier: string) {
  const users = await odooCall<OdooUserRecord[]>("res.users/search_read", {
    context: { lang: "ca_ES", tz: "Europe/Madrid" },
    domain: [["id", "=", uid]],
    fields: ["id", "name", "login", "share", "partner_id"],
    limit: 1,
  });

  const user = users[0];
  if (!user) {
    return {
      login: identifier.toLowerCase(),
      name: normalizePersonName(identifier),
      email: identifier.includes("@") ? identifier.toLowerCase() : "",
      phone: "",
    };
  }

  const hasPortalAccess = await odooCall<boolean>("res.users/has_group", {
    ids: [uid],
    group_ext_id: "base.group_portal",
  });

  if (!hasPortalAccess) {
    throw new Error("Aquest usuari no té accés al portal de reserves.");
  }

  const partnerId = Array.isArray(user.partner_id) ? user.partner_id[0] : 0;
  const partners = partnerId
    ? await odooCall<OdooPartnerRecord[]>("res.partner/search_read", {
        context: { lang: "ca_ES", tz: "Europe/Madrid" },
        domain: [["id", "=", partnerId]],
        fields: ["id", "name", "email", "phone", "category_id"],
        limit: 1,
      })
    : [];
  const partner = partners[0];

  const categoryIds = Array.isArray(partner?.category_id) ? partner.category_id : [];
  const categories = categoryIds.length
    ? await odooCall<OdooCategoryRecord[]>("res.partner.category/search_read", {
        context: { lang: "ca_ES", tz: "Europe/Madrid" },
        domain: [["id", "in", categoryIds]],
        fields: ["id", "name"],
        limit: categoryIds.length,
      })
    : [];
  const memberTags = categories
    .map((category) => String(category.name || "").trim())
    .filter(Boolean);

  if (!memberTags.some((tag) => ALLOWED_MEMBER_TAGS.has(tag))) {
    throw new Error(
      "Aquest contacte no té cap etiqueta autoritzada per reservar."
    );
  }

  const rawName = partner?.name || user.name || identifier;
  const loginEmail = identifier.includes("@") ? identifier.trim().toLowerCase() : "";
  const partnerEmail =
    typeof partner?.email === "string" && partner.email.trim()
      ? partner.email.trim().toLowerCase()
      : "";
  const rawEmail = loginEmail || partnerEmail;

  return {
    partnerId,
    login: String(user.login || identifier).trim().toLowerCase(),
    name: normalizePersonName(rawName),
    email: rawEmail.toLowerCase(),
    phone: String(partner?.phone || "").trim(),
    memberTags,
    hasPortalAccess,
  };
}

async function odooCall<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { baseUrl, database, apiKey } = getOdooConfig();
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

function getOdooConfig() {
  const baseUrl = Deno.env.get("ODOO_BASE_URL")?.replace(/\/+$/, "") || "";
  const database = Deno.env.get("ODOO_DATABASE") || "";
  const apiKey = Deno.env.get("ODOO_API_KEY") || "";

  if (!baseUrl || !database || !apiKey) {
    throw new Error("Falten secrets d'Odoo a Supabase.");
  }

  return { baseUrl, database, apiKey };
}

function normalizePersonName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: withCorsHeaders({ "Content-Type": "application/json" }),
  });
}
