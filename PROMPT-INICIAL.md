# Prompt inicial — cole isto no Claude Code da outra máquina

```
Você vai assumir a finalização do projeto Vion (app de estudos ENEM/Medicina). Você
NÃO tem contexto anterior — toda a informação está nos arquivos do repositório.

ANTES DE QUALQUER COISA, leia na íntegra, nesta ordem:
1. HANDOFF-TERMINAR-TUDO.md  (o passo a passo do que falta — SUA FONTE DA VERDADE)
2. AGENTS.md e PROJECT_STATE.md  (regras do projeto e diferenças de API/schema)
3. PENDENCIAS.md  (estado atual)

Seu objetivo: executar TODO o trabalho restante descrito no HANDOFF, na ordem do §10
(barato → caro), até concluir.

REGRAS INEGOCIÁVEIS:
- O banco (DATABASE_URL / Neon) é PRODUÇÃO AO VIVO. Todo script escreve de verdade.
- NUNCA commite o .env nem qualquer segredo. NUNCA rode prisma migrate reset nem
  qualquer coisa que apague dados. Só `prisma db push` se for realmente necessário.
- NÃO invente dados (nomes, datas, gabaritos, questões). Se não tiver certeza, não grave.
- Os scripts são idempotentes/retomáveis. Sempre rode `--dry-run` (quando existir) e os
  contadores do §9 ANTES e DEPOIS de cada bloco, pra medir o efeito real.

COMO TRABALHAR:
1. Primeiro rode o setup do §0: `npm install` e `npx prisma generate`. Depois verifique
   se o .env tem as variáveis necessárias (DATABASE_URL, MIMO_API_KEY/MIMO_API_KEYS ou
   OPENROUTER_API_KEY, e CLOUDINARY_* se for fazer o §6). Se faltar alguma, PARE e me avise
   exatamente qual — não tente contornar.
2. Rode os contadores do §9 e me mostre o estado inicial.
3. Execute os blocos NA ORDEM do §10. Para cada bloco: explique o que vai rodar, rode,
   confira o contador, e resuma o resultado.
4. Trabalhe de forma autônoma nos blocos baratos/seguros (§2 reclassificar, §3 gabaritos,
   §8 flashcards, §1 resumos).
5. PARE e peça minha confirmação ANTES de:
   - qualquer bloco caro (§5 Simulados ~US$12–18, §6 Questões de imagem ~US$15–25);
   - qualquer mudança de ESTRUTURA/taxonomia (§7 Filosofia/Biologia/Linguagens/Química) —
     me mostre o plano de alteração de Topics antes de aplicar;
   - a construção do pipeline novo de imagens (§6), que ainda não existe.
6. Ao terminar cada bloco: atualize PENDENCIAS.md e faça um commit pequeno e descritivo
   (só de scripts/ e docs; nunca .env). Não faça push sem eu pedir.

Comece agora pelo passo 1 (setup + checagem de env) e me reporte antes de gastar qualquer
API paga.
```
