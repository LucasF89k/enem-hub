export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="opal-hero-bg flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-app.png" alt="Vion" className="w-44 mx-auto mb-2 object-contain" />
      </div>

      <div className="w-full max-w-md">
        <div className="opal-glass-card rounded-2xl p-6">{children}</div>
      </div>
    </div>
  )
}
