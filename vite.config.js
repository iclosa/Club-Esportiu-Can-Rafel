import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SITE_URL, OG_IMAGE, PAGES, SITE_NAME } from "./src/data/seo.js";

const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const START = "<!--seo:start-->";
const END = "<!--seo:end-->";

// Les previsualitzacions (WhatsApp, Telegram, Google…) no executen JavaScript:
// les metaetiquetes han d'estar al HTML estàtic de cada ruta.
function seoPlugin(siteUrl) {
  const block = (page) => {
    const url = `${siteUrl}${page.path === "/" ? "/" : page.path}`;
    const image = `${siteUrl}${OG_IMAGE.path}`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "SportsClub",
      name: SITE_NAME,
      url: `${siteUrl}/`,
      image,
      description: PAGES.home.description,
      email: "clubcanrafel@gmail.com",
      telephone: "+34936500145",
      address: { "@type": "PostalAddress", streetAddress: "Avda. de la Font, s/n", postalCode: "08758", addressLocality: "Cervelló", addressCountry: "ES" },
    };
    return [
      START,
      `<title>${esc(page.title)}</title>`,
      `<meta name="description" content="${esc(page.description)}" />`,
      `<link rel="canonical" href="${url}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
      `<meta property="og:locale" content="ca_ES" />`,
      `<meta property="og:title" content="${esc(page.title)}" />`,
      `<meta property="og:description" content="${esc(page.description)}" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta property="og:image" content="${image}" />`,
      `<meta property="og:image:secure_url" content="${image}" />`,
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
      `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
      `<meta property="og:image:alt" content="${esc(OG_IMAGE.alt)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(page.title)}" />`,
      `<meta name="twitter:description" content="${esc(page.description)}" />`,
      `<meta name="twitter:image" content="${image}" />`,
      `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
      END,
    ].join("\n    ");
  };
  let outDir = "dist";
  return {
    name: "club-seo",
    configResolved(config) { outDir = path.resolve(config.root, config.build.outDir); },
    transformIndexHtml: (html) => html.replace("<!--seo-->", block(PAGES.home)),
    closeBundle() {
      const indexFile = path.join(outDir, "index.html");
      if (!fs.existsSync(indexFile)) return;
      const home = fs.readFileSync(indexFile, "utf8");
      const section = new RegExp(`${START}[\\s\\S]*?${END}`);
      for (const page of Object.values(PAGES)) {
        if (page.path === "/") continue;
        const dir = path.join(outDir, page.path);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), home.replace(section, () => block(page)));
      }
      const urls = Object.values(PAGES).map((p) => `  <url><loc>${siteUrl}${p.path}</loc></url>`).join("\n");
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
      fs.writeFileSync(path.join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /reserva-confirmada\nDisallow: /reserva-cancelada\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
  return { plugins: [react(), seoPlugin(siteUrl)] };
});
