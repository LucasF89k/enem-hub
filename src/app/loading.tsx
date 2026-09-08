/**
 * Tela de carregamento da raiz, enquanto o servidor decide o destino
 * (autenticado→/dashboard, senão→/login).
 *
 * Deliberadamente SEM spinner: a AppSplash que vem logo em seguida já começa
 * com o anel da logo se desenhando. Um spinner circular aqui fazia aparecer
 * um círculo, sumir e um segundo círculo entrar: parecia que a animação da
 * logo estava repetindo duas vezes. Aqui fica só o fundo, e a única coisa
 * circular que o usuário vê é a logo montando.
 */
export default function RootLoading() {
  return <div className="min-h-screen bg-background" />
}
