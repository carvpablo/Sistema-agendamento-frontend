# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Clientes (`user`):** Pessoas que buscam contratar e agendar serviços presenciais ou especializados com rapidez, querendo visualizar preços, duração, profissional responsável e horários realmente livres sem atrito, além de acompanhar ou cancelar seus agendamentos.
- **Profissionais (`professional`):** Prestadores de serviço autônomos que precisam cadastrar seu catálogo de serviços (nome, descrição, duração e preço), abrir janelas de disponibilidade na agenda e acompanhar os horários marcados pelos clientes.
- **Avaliadores técnicos e recrutadores:** Visitantes que exploram o sistema como projeto de portfólio e estudo técnico full-stack, avaliando a fluidez dos fluxos reais, regras de negócio e qualidade de engenharia e interface.

## Product Purpose

**Agendamentos!** é uma plataforma web de gestão e marcação de serviços construída como projeto de portfólio e estudo técnico que simula um produto real ponta a ponta. O objetivo é eliminar o vai-e-vem manual na marcação de horários conectando clientes e profissionais em fluxos diretos. O sucesso significa o cliente encontrar um serviço e concluir um agendamento válido em poucos cliques, e o profissional publicar serviços e disponibilidades com total previsibilidade sobre sua agenda.

## Positioning

Agendamento direto orientado à disponibilidade real e à duração de cada serviço: o cliente vê preço transparente, tempo estimado, profissional responsável e apenas os slots compatíveis livres antes mesmo de confirmar, com validação rigorosa contra conflitos de horário.

## Operating Context

Aplicação web responsiva em Português (`pt-BR`, moeda `R$`), utilizada em navegadores desktop e mobile:

- **Descoberta e agendamento:** Catálogo público em `/services` com busca instantânea por nome, descrição ou profissional; página de detalhes em `/services/details/[id]` com seleção de profissional, dia disponível e horário livre para confirmação imediata.
- **Gestão pelo cliente:** Histórico pessoal em `/appointments/[id]` com filtro por status (`Agendados`, `Cancelados`, `Concluídos` e `Todos`) e cancelamento sujeito à janela mínima de antecedência.
- **Gestão pelo profissional:** Autenticação em portal dedicado, criação de serviços em `/services/create`, listagem própria em `/services/[id]`, cadastro/remoção de janelas de atendimento em `/availability` e visualização dos agendamentos recebidos.

## Capabilities and Constraints

- **Separação estrita de papéis:** Contas de `Cliente` realizam e cancelam agendamentos; contas de `Profissional` criam serviços e gerenciam disponibilidade (contas profissionais são impedidas de agendar como clientes).
- **Prevenção de conflitos de agenda:** Os horários ofertados respeitam simultaneamente as janelas de disponibilidade do profissional, a duração em minutos do serviço (`durationMinutes`) e os agendamentos já ativos.
- **Regra de cancelamento (> 24h):** Agendamentos com status `SCHEDULED` só podem ser cancelados com mais de 24 horas de antecedência em relação ao início (`startAt`).
- **Arquitetura e cache:** Front-end em Next.js 16 (App Router com `cacheComponents: true`, `"use cache"` com invalidação por tags e cache sincronizado no cliente) integrado a uma API REST Express 5 + Prisma + PostgreSQL (`http://localhost:3000`) com autenticação via cookies HTTP-only.
- **Idioma e localização:** Toda a interface, mensagens de validação, datas e valores monetários devem permanecer em Português do Brasil (`pt-BR` / `R$`).

## Brand Commitments

- **Nome do produto:** `Agendamentos!`
- **Voz e tom:** Direto, claro, prestativo e moderno em Português (`pt-BR`), priorizando instruções objetivas e feedback imediato de estado.

## Evidence on Hand

- Dados operacionais reais vindos do banco PostgreSQL via API (`Service`, `Professional`, `Client`, `Availability`, `Appointment`).
- Por se tratar de um projeto de portfólio / estudo técnico, **não existem** depoimentos reais de clientes, contadores de usuários/empresas atendidas, notas de avaliação (reviews), logotipos de parceiros, garantias de SLA ou planos pagos. Trabalhos futuros **não devem fabricar** provas sociais, métricas fictícias, avaliações falsas ou promessas comerciais inexistentes.

## Product Principles

1. **Transparência antes do compromisso:** Preço, duração, profissional responsável e disponibilidade real aparecem de forma clara antes de exigir login ou confirmação.
2. **Integridade da agenda inegociável:** A interface reflete fielmente as regras de conflito de horários e a antecedência mínima de 24 horas para cancelamentos, explicando o motivo quando uma ação não está disponível.
3. **Jornadas fiéis ao papel:** Clientes e profissionais têm portais e navegações distintos; cada tela expõe apenas ações válidas para o perfil autenticado.
4. **Credibilidade pelo funcionamento real:** O valor do projeto se prova pela precisão e rapidez dos fluxos reais da plataforma, nunca por números, clientes ou depoimentos inventados.

