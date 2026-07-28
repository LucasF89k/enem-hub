import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: [
          "/dashboard",
          "/study",
          "/flashcards",
          "/simulados",
          "/redacao",
          "/analytics",
          "/planner",
          "/mentor",
          "/conquistas",
          "/ranking",
          "/onboarding",
          "/api/",
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://enem-hub.vercel.app"}/sitemap.xml`,
  }
}
