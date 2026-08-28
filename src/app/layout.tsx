import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar"
import { OfflineBanner } from "@/components/pwa/OfflineBanner"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"
import { AppSplash } from "@/components/AppSplashLoader"
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
    default: "Vion",
    template: "%s | Vion",
  },
  description:
    "Plataforma completa de preparação para o ENEM, focada em candidatos a Medicina. Flashcards SM-2, banco de questões, simulados e Mentor IA.",
  manifest: "/manifest.json",
  keywords: ["ENEM", "Medicina", "preparatório", "flashcards", "questões", "simulado"],
  authors: [{ name: "Vion" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Vion",
    description: "Plataforma de preparação para o ENEM focada em Medicina",
    siteName: "Vion",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Aplica o tema salvo antes da pintura (evita flash). Padrão: escuro. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ServiceWorkerRegistrar />
        <OfflineBanner />
        <AppSplash />
        {children}
        <InstallPrompt />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
