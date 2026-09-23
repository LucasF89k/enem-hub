import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Política de Privacidade",
  description: "Como o Vion trata os seus dados pessoais.",
}

/**
 * Política de Privacidade (LGPD, Lei 13.709/2018).
 *
 * Fica FORA do grupo (app) de propósito: precisa abrir sem login, porque a
 * pessoa tem que poder ler antes de criar conta, e porque a página de
 * cadastro aponta pra cá.
 *
 * O conteúdo descreve o que o código faz de verdade (os terceiros listados
 * são os que existem em src/lib: Xiaomi/MiMo e Gemini para IA (via
 * OpenRouter quando configurado), Resend, Cloudinary, Neon e Vercel). Se
 * algum for adicionado ou removido, esta página precisa
 * acompanhar, senão vira declaração falsa.
 */
export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="text-2xl font-bold">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Última atualização: 23 de setembro de 2026
      </p>

      <div className="prose prose-sm dark:prose-invert mt-6 max-w-none">
        <p>
          Esta política explica quais dados o Vion coleta, por que coleta e o
          que você pode fazer a respeito. Ela segue a Lei Geral de Proteção de
          Dados (Lei 13.709/2018).
        </p>

        <h2>Quais dados coletamos</h2>
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail e senha. A senha é guardada
            apenas como hash (bcrypt), então nem nós conseguimos lê-la.
          </li>
          <li>
            <strong>Perfil:</strong> foto (se você enviar), curso e instituição
            de interesse, data da prova e meta diária de estudo.
          </li>
          <li>
            <strong>Uso da plataforma:</strong> tempo estudado, questões
            respondidas, revisões de flashcards, simulados feitos, vídeos
            assistidos, conquistas e sequência de dias.
          </li>
          <li>
            <strong>Conteúdo que você escreve:</strong> redações e anotações.
          </li>
        </ul>

        <h2>Por que coletamos</h2>
        <p>
          Para o app funcionar: mostrar seu progresso, montar seu plano de
          estudos, aplicar a revisão espaçada dos flashcards, corrigir redações
          e gerar as recomendações do Mentor. A base legal é a execução do
          contrato de uso (Art. 7º, V) e, onde se aplica, o seu consentimento
          (Art. 7º, I).
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>
          Não vendemos seus dados. Eles passam por serviços necessários para o
          app funcionar:
        </p>
        <ul>
          <li>
            <strong>Xiaomi (modelo MiMo)</strong> e{" "}
            <strong>Google (Gemini)</strong>: são as inteligências artificiais
            que recebem o texto que você manda ao Mentor, suas redações quando
            pede correção e um resumo do seu desempenho quando o plano é
            recalibrado. Dependendo da configuração, esse acesso pode passar
            pelo intermediário <strong>OpenRouter</strong>.
          </li>
          <li>
            <strong>Resend</strong>: envio de e-mails da plataforma.
          </li>
          <li>
            <strong>Cloudinary</strong>: armazenamento de imagens.
          </li>
          <li>
            <strong>Neon</strong>: banco de dados.
          </li>
          <li>
            <strong>Vercel</strong>: hospedagem.
          </li>
        </ul>
        <p>
          Esses serviços ficam fora do Brasil, então há transferência
          internacional de dados (Art. 33). Ao usar o Vion, você concorda com
          isso.
        </p>

        <h2>Seus direitos</h2>
        <p>
          A LGPD (Art. 18) garante que você possa, a qualquer momento:
        </p>
        <ul>
          <li>
            <strong>Baixar seus dados</strong>, em{" "}
            <Link href="/profile/settings">Configurações</Link>, num arquivo com
            tudo que guardamos sobre você.
          </li>
          <li>
            <strong>Excluir sua conta</strong>, no mesmo lugar. Apaga seu
            histórico inteiro e não tem como desfazer.
          </li>
          <li>
            <strong>Corrigir seus dados</strong>, editando o perfil.
          </li>
        </ul>

        <h2>Por quanto tempo guardamos</h2>
        <p>
          Enquanto sua conta existir. Quando você exclui a conta, os dados são
          apagados do banco junto. Decks de flashcards que você tenha marcado
          como públicos continuam disponíveis para quem os usa, mas
          desvinculados de você.
        </p>

        <h2>Se você tem menos de 18 anos</h2>
        <p>
          O Vion é feito para quem está estudando para o ENEM, então parte do
          público é adolescente. Se você tem menos de 18 anos, use a plataforma
          com o conhecimento e a autorização dos seus pais ou responsáveis
          (Art. 14).
        </p>

        <h2>Segurança</h2>
        <p>
          As senhas ficam com hash bcrypt, o acesso ao app exige autenticação e
          a conexão é criptografada. Nenhum sistema é totalmente imune, mas
          tratamos seus dados com o cuidado que a lei exige.
        </p>

        <h2>Falar com a gente</h2>
        <p>
          Para dúvidas sobre esta política ou sobre seus dados, entre em
          contato pelo e-mail de suporte da plataforma.
        </p>
      </div>
    </div>
  )
}
