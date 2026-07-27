import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vion",
    short_name: "Vion",
    description: "Plataforma completa de preparação para o ENEM focada em Medicina.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F0A1E",
    theme_color: "#7C3AED",
    categories: ["education"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Questões",
        url: "/questions",
        description: "Praticar questões ENEM",
      },
      {
        name: "Revisões",
        url: "/flashcards",
        description: "Revisar flashcards pendentes",
      },
      {
        name: "Mentor IA",
        url: "/mentor",
        description: "Chat com o Mentor ENEM",
      },
    ],
  }
}
