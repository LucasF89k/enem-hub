# Proteção de borda (anti-DDoS) na Vercel

Este guia é sobre o que **não** dá pra fazer no código: a defesa contra DDoS,
que acontece na borda da rede, antes da requisição chegar na aplicação.

## Por que isso não está no código

Há dois problemas de "excesso de requisição", e eles se resolvem em lugares
diferentes:

- **Abuso lógico** (brute force de senha, um usuário torrando a cota de IA):
  tratado no código, em `src/lib/rate-limit.ts`. Já está feito.
- **DDoS** (inundar o site com tráfego pra derrubá-lo): tem que ser barrado
  **antes** de chegar no código, senão o servidor cai antes de qualquer
  `if` rodar. Isso é infraestrutura, não aplicação.

## O que a Vercel já faz sozinha

Sem nenhuma configuração, todo projeto na Vercel tem:

- Mitigação automática de DDoS nas camadas de rede (L3/L4).
- CDN global que absorve e distribui o tráfego.
- Proteção contra picos na borda.

Ou seja: **contra um DDoS de rede, você já está coberto.** É o principal
motivo de hospedar numa plataforma dessas em vez de um servidor próprio.

## O que dá pra reforçar (configuração no painel, não no código)

A Vercel tem um **Firewall** configurável. Isso é feito no dashboard da
Vercel, no projeto, não aqui no repositório. Vale ligar:

1. **Attack Challenge Mode** (Settings → Security, ou Firewall)
   Quando o site estiver sob ataque, ativar isso põe um desafio
   (tipo "verifique que você é humano") antes de deixar o tráfego passar.
   É um interruptor de emergência: liga quando perceber ataque, desliga
   depois.

2. **Regras de Firewall personalizadas** (plano Pro em diante)
   Dá pra criar regras como "bloquear país X", "limitar N requisições por
   IP por minuto na rota /api", "bloquear user-agents suspeitos". É rate
   limiting na **borda**, que complementa o do código: barra o tráfego
   antes de custar recurso da aplicação.

3. **Bot Protection / Bot Management**
   Filtra tráfego automatizado conhecido. Útil pra rotas de IA, que são as
   mais caras.

## Recomendação prática

- **Agora, grátis:** confirmar no dashboard que o projeto está num plano que
  inclui o Firewall e deixar o **Attack Challenge Mode** à mão pra ligar se
  precisar.
- **Se o app crescer:** criar uma regra de rate limit na borda pras rotas
  `/api/*`, principalmente `/api/mentor`, que é a mais cara.

## Resumo de camadas

| Camada | Contra o quê | Onde se configura | Status |
| --- | --- | --- | --- |
| Rede (L3/L4) | DDoS de volume | Vercel, automático | já ativo |
| Firewall de borda | Flood por IP, bots, país | Dashboard da Vercel | ligar quando quiser |
| Rate limit da aplicação | Brute force, abuso de cota de IA | `src/lib/rate-limit.ts` | feito |
| Upstash (opcional) | Deixa o rate limit da app robusto entre instâncias | 2 env vars | pendente |
