import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar"
import { OfflineBanner } from "@/components/pwa/OfflineBanner"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "ENEM Medicina Hub",
    template: "%s | ENEM Medicina Hub",
  },
  description:
    "Plataforma completa de preparação para o ENEM, focada em candidatos a Medicina. Flashcards SM-2, banco de questões, simulados e Mentor IA.",
  manifest: "/manifest.json",
  keywords: ["ENEM", "Medicina", "preparatório", "flashcards", "questões", "simulado"],
  authors: [{ name: "ENEM Medicina Hub" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "ENEM Medicina Hub",
    description: "Plataforma de preparação para o ENEM focada em Medicina",
    siteName: "ENEM Medicina Hub",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7C3AED" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0A1E" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ServiceWorkerRegistrar />
        <OfflineBanner />
        {children}
        <InstallPrompt />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
