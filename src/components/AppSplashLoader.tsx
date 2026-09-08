"use client"

import dynamic from "next/dynamic"

// ssr: false é essencial aqui, não só uma otimização: o gate de "já rodou
// nessa aba" (sessionStorage) só existe no client. Com SSR normal, o
// servidor sempre renderiza o HTML inicial com a splash em "logo" (porque
// sessionStorage não existe lá). Em toda navegação que cair num reload
// completo de documento (hard navigation, que o App Router usa como
// fallback quando o prefetch client-side falha ou demora, comum em rotas
// que buscam mais dado do banco), o usuário VÊ a splash nesse HTML antes da
// hidratação corrigir o estado, mesmo já tendo "rodado" nessa sessão.
// Forçando client-only, o componente só monta depois que sessionStorage já
// está disponível, e a checagem funciona desde o primeiro render de verdade.
//
// dynamic(..., { ssr: false }) só é permitido dentro de um Client
// Component: layout.tsx é Server Component por padrão, daí esse wrapper.
//
// `loading`: enquanto o chunk do AppSplash (que agora é client-only, indo
// num JS bundle separado) ainda está baixando, esse fallback cobre a tela
// com um div preto puro, sem vídeo, sem depender de nada assíncrono. Sem
// isso existia uma janela real (variável, dependendo de quão rápido o
// chunk carrega) onde nada cobria a tela ainda, e quando o <video> do
// AppSplash finalmente montava, podia aparecer por um instante no tamanho
// intrínseco dele com o controle nativo do navegador por cima, antes do
// autoPlay/play() imperativo rodarem synchronous o bastante.
const AppSplashDynamic = dynamic(() => import("@/components/AppSplash").then((m) => m.AppSplash), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[999] bg-black" />,
})

export function AppSplash({ isLoggedIn }: { isLoggedIn: boolean }) {
  return <AppSplashDynamic isLoggedIn={isLoggedIn} />
}
