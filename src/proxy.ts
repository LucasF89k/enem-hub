import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const protectedRoutes = [
  "/dashboard",
  "/study",
  "/flashcards",
  "/questions",
  "/simulados",
  "/redacao",
  "/planner",
  "/notes",
  "/analytics",
  "/profile",
  "/mentor",
  "/onboarding",
]

const authRoutes = ["/login", "/register"]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isProtected = protectedRoutes.some((r) => nextUrl.pathname.startsWith(r))
  const isAuthRoute = authRoutes.some((r) => nextUrl.pathname.startsWith(r))

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)"],
}
