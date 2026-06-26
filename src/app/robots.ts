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
          "/questions",
          "/simulados",
          "/redacao",
          "/analytics",
          "/planner",
          "/mentor",
          "/conquistas",
          "/onboarding",
          "/api/",
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://enem-hub.vercel.app"}/sitemap.xml`,
  }
}
