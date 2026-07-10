import { apiFetch } from "./backend.js";

export async function createMembershipOpportunity(payload) {
  return apiFetch("/membership-signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("No s'ha pogut llegir el fitxer."));
    reader.readAsDataURL(file);
  });
}
