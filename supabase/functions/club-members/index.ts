import { corsHeaders, withCorsHeaders } from "../_shared/cors.ts";

type MemberRecord = {
  id: number;
  name?: string;
  email?: string | false;
  phone?: string | false;
  category_id?: number[];
};

type CategoryRecord = {
  id: number;
  name?: string;
};

const ALLOWED_MEMBER_TAGS = ["Soci Titular", "Soci Jubilat", "Beneficiari"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const url = new URL(req.url);
    const q = String(url.searchParams.get("q") || "").trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 8), 1), 20);

    if (q.length < 2) {
      return json({ members: [] });
    }

    const members = await odooCall<MemberRecord[]>("res.partner/search_read", {
      context: { lang: "ca_ES", tz: "Europe/Madrid" },
      domain: [
        ["category_id.name", "in", ALLOWED_MEMBER_TAGS],
        "|",
        ["name", "ilike", q],
        ["email", "ilike", q],
      ],
      fields: ["id", "name", "email", "phone", "category_id"],
      limit,
      order: "name asc",
    });

    const categoryIds = [
      ...new Set(
        members.flatMap((member) =>
          Array.isArray(member.category_id) ? member.category_id : []
        )
      ),
    ];

    const categories = categoryIds.length
      ? await odooCall<CategoryRecord[]>("res.partner.category/search_read", {
          context: { lang: "ca_ES", tz: "Europe/Madrid" },
          domain: [["id", "in", categoryIds]],
          fields: ["id", "name"],
          limit: categoryIds.length,
        })
      : [];

    const categoryMap = new Map(
      categories.map((category) => [category.id, String(category.name || "").trim()])
    );

    return json({
      members: members.map((member) => ({
        id: member.id,
        name: String(member.name || "").trim(),
        email:
          typeof member.email === "string" ? member.email.trim().toLowerCase() : "",
        phone: typeof member.phone === "string" ? member.phone.trim() : "",
        tags: (Array.isArray(member.category_id) ? member.category_id : [])
          .map((id) => categoryMap.get(id) || "")
          .filter(Boolean),
      })),
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No s'ha pogut carregar el cercador de socis.",
      },
      400
    );
  }
});

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: withCorsHeaders({ "Content-Type": "application/json" }),
  });
}
