import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
 return {
  rules: {
   userAgent: "*",
   allow: "/",
   disallow: ["/dashboard", "/admin", "/api", "/login", "/register", "/c/"],
  },
  sitemap: "https://ditapaja.web.id/sitemap.xml",
  host: "https://ditapaja.web.id",
 };
}
