import type { MetadataRoute } from "next";

const baseUrl = "https://ditapaja.web.id";

export default function sitemap(): MetadataRoute.Sitemap {
 const staticRoutes = [
  "", "/koleksi", "/cara-kerja", "/fitur", "/panduan", "/tentang", "/faq", "/kontak",
  "/kebijakan-privasi", "/syarat-ketentuan",
 ];
 const products = ["noir", "blanc", "signature"].map((slug) => "/products/" + slug);
 return [...staticRoutes, ...products].map((route) => ({
  url: baseUrl + route,
  changeFrequency: route === "" ? "weekly" : "monthly",
  priority: route === "" ? 1 : route === "/koleksi" ? 0.9 : route.startsWith("/products/") ? 0.8 : 0.6,
 }));
}
