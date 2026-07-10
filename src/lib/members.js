import { apiFetch } from "./backend.js";

export async function searchClubMembers(query, limit = 5) {
  const qs = new URLSearchParams({
    q: String(query || "").trim(),
    limit: String(limit),
  });
  return apiFetch(`/club-members?${qs.toString()}`, { method: "GET" });
}
