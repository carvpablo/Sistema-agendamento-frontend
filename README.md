# Agendamentos! — Front-End Web

Interface web responsiva do sistema **Agendamentos!**, construída com **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4** e **Zustand**. Oferece jornadas dedicadas para **Clientes** (exploração de catálogo, busca rápida, reserva de horários sem conflito e gestão de agendamentos) e **Profissionais** (publicação de serviços com pré-visualização em tempo real, configuração de janelas de disponibilidade em calendário interativo e acompanhamento da agenda de clientes).

> 🔗 **Repositório da API (Back-End):** [github.com/carvpablo/Sistema-agendamento-backend](https://github.com/carvpablo/Sistema-agendamento-backend)

---

## Sumário

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Principais Funcionalidades e Jornadas](#principais-funcionalidades-e-jornadas)
- [Arquitetura e Estrutura de Pastas](#arquitetura-e-estrutura-de-pastas)
- [Destaques de Engenharia, UX e Acessibilidade](#destaques-de-engenharia-ux-e-acessibilidade)
- [Rotas da Aplicação](#rotas-da-aplicação)
- [Configuração e Variáveis de Ambiente](#configuração-e-variáveis-de-ambiente)
- [Como Executar](#como-executar)
  - [Execução Local](#execução-local)
  - [Execução com Docker](#execução-com-docker)
- [Testes e Qualidade de Código](#testes-e-qualidade-de-código)

---

## Tecnologias Utilizadas

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework & UI** | Next.js 16.4 (`App Router`, `cacheComponents`) · React 19 · TypeScript |
| **Estilização & Design System** | Tailwind CSS v4 · Tokens semânticos CSS (`Light` / `Dark` mode) · Lucide Icons |
| **Gerenciamento de Estado** | Zustand (persistência de sessão com controle de hidratação e filtros) |
| **Formulários** | React Hook Form |
| **Testes & Qualidade** | Vitest · React Testing Library · User Event · JSDOM · ESLint 9 |

---

## Principais Funcionalidades e Jornadas

### 1. Visitante e Catálogo Público
- **Landing Page (`/`)**: Apresentação clara da proposta de valor para visitantes não autenticados, com acesso direto ao catálogo e criação de conta.
- **Catálogo de Serviços (`/services`)**: Busca instantânea (insensível a acentos e maiúsculas/minúsculas) por nome do serviço, descrição ou nome do profissional.
- **Paleta de Comandos Rápida (`Ctrl K` / `⌘K`)**: Busca global acessível de qualquer tela pelo cabeçalho ou barra lateral, com navegação completa por teclado (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).

### 2. Jornada do Cliente (`role: "user"`)
- **Painel Inicial (`/`)**: Visão imediata dos próximos agendamentos em ordem cronológica com folhas de calendário (`DateLeaf`), rótulos temporais relativos (`Hoje`, `Amanhã`, `Em X dias`, `Em andamento`) e contadores de histórico.
- **Reserva de Horários (`/services/details/[id]`)**: Seleção de profissional, escolha de data disponível e visualização apenas dos slots de horário compatíveis com a duração do serviço.
- **Meus Agendamentos (`/appointments/[id]`)**:
  - Abas de status sincronizadas com a URL (`?status=SCHEDULED|COMPLETED|CANCELLED|ALL`) e contadores em tempo real.
  - Deep-linking com destaque visual e rolagem suave (`?highlight=<id>`) ao clicar em um compromisso no painel inicial.
  - Cancelamento com confirmação inline no próprio card, respeitando e informando o prazo limite de **24 horas de antecedência**.

### 3. Jornada do Profissional (`role: "professional"`)
- **Painel Profissional (`/`)**: Resumo dos próximos atendimentos de clientes e atalhos rápidos para criar serviço e abrir disponibilidade.
- **Meus Serviços (`/services/[id]`)**: Listagem dos serviços vinculados ao profissional com exclusão inline segura e invalidação automática de cache.
- **Criar Serviço (`/services/create`)**: Formulário com sugestões rápidas de duração (`30 min`, `45 min`, `1h`, `1h30`, `2h`), contador de caracteres (`500`) e **pré-visualização em tempo real** do card exatamente como aparecerá no catálogo.
- **Disponibilidade (`/availability`)**: Calendário interativo com bloqueio de datas passadas (`disablePast`), indicadores visuais nos dias que já possuem horários configurados e cadastro/exclusão de janelas de atendimento.
- **Agenda de Clientes (`/appointments/[id]`)**: Acompanhamento dos horários reservados pelos clientes com identificação completa de cada atendimento.

---

## Arquitetura e Estrutura de Pastas

```text
├── app/
│   ├── actions/
│   │   └── cacheActions.ts         # Server Actions para invalidação de cache por tags (updateTag)
│   ├── appointments/[id]/
│   │   ├── cachedAppointments.ts   # Busca autenticada de agendamentos com tratamento de sessão
│   │   └── page.tsx                # Página de Meus Agendamentos / Agenda de Clientes
│   ├── auth/
│   │   ├── professional/           # Login e cadastro de Profissionais
│   │   └── user/                   # Login e cadastro de Clientes
│   ├── availability/
│   │   └── page.tsx                # Gestão de disponibilidade com calendário interativo
│   ├── components/                 # Componentes de domínio da aplicação
│   │   ├── __tests__/              # Testes unitários e de integração dos componentes
│   │   ├── AppShell.tsx            # Shell responsivo (Sidebar, Topbar, Command Palette ⌘K)
│   │   ├── AppointmentList.tsx     # Lista de agendamentos com confirmação e erro inline
│   │   ├── BookServiceSection.tsx  # Fluxo interativo de escolha de data e slot livre
│   │   ├── CreateService.tsx       # Formulário de criação com preview em tempo real
│   │   ├── DateLeaf.tsx            # Folha de calendário semântica para datas
│   │   ├── Header.tsx              # Cabeçalho de navegação
│   │   └── ServiceList.tsx         # Catálogo de serviços com busca e exclusão inline
│   ├── services/
│   │   ├── [id]/page.tsx           # Meus Serviços (visão do profissional)
│   │   ├── create/page.tsx         # Página de criação de novo serviço
│   │   ├── details/[id]/page.tsx   # Detalhes do serviço e agendamento
│   │   └── page.tsx                # Catálogo público de serviços
│   ├── globals.css                 # Tokens de design (Light/Dark) e utilitários Tailwind v4
│   ├── layout.tsx                  # Root layout com suporte a tema e metadados
│   └── page.tsx                    # Home (Landing page pública + Dashboard autenticado)
├── components/ui/                  # Primitivos de UI reutilizáveis
│   ├── calendar.tsx                # Calendário em pt-BR com suporte a disablePast e markedDates
│   ├── card.tsx
│   ├── dashboard-sidebar.tsx       # Sidebar colapsável com identidade do usuário
│   ├── field.tsx
│   └── input-group.tsx
├── lib/
│   ├── __tests__/                  # Testes dos utilitários de formatação
│   ├── api.ts                      # Configuração centralizada da URL da API
│   ├── format.ts                   # Formatadores pt-BR (moeda BRL, duração, datas e rótulos relativos)
│   ├── useNow.ts                   # Hook temporal livre de mismatch de hidratação (useSyncExternalStore)
│   └── utils.ts                    # Utilitário cn() (clsx + tailwind-merge)
├── store/
│   ├── appointmentFilter.ts        # Store Zustand para filtro de status da agenda
│   ├── appointmentsClientCache.ts  # Cache em memória no cliente para transições instantâneas
│   └── auth.ts                     # Store Zustand de autenticação com hook useAuthHydrated()
├── test/
│   └── setup.ts                    # Configuração global do Vitest + jest-dom
├── Dockerfile
├── next.config.ts
├── vitest.config.mts
└── package.json
```

---

## Destaques de Engenharia, UX e Acessibilidade

- **Hidratação Segura sem Flash de Estado (`useAuthHydrated` & `useNow`):**
  - O estado de autenticação persistido no `localStorage` expõe `useAuthHydrated()`, evitando que usuários logados vejam um "flash" da landing page de visitantes durante o carregamento inicial.
  - O relógio do cliente (`useNow`) utiliza `useSyncExternalStore` para calcular prazos de 24h e rótulos relativos (`Hoje`, `Amanhã`) sem causar erros de hidratação no React 19.
- **Confirmações e Recuperação de Erros Inline:**
  - Ações destrutivas (cancelar agendamento ou excluir serviço) utilizam grupos de confirmação inline no próprio card (`role="group"`, suporte à tecla `Escape` e `autoFocus` na opção segura), sem depender de `window.confirm` ou modais intrusivos.
  - Mensagens de sucesso (`role="status"`) e falhas de ação (`role="alert"`) recebem foco programático (`tabIndex={-1}`) para leitura imediata por tecnologias assistivas e usuários de teclado.
- **Navegação por Teclado WAI-ARIA:**
  - As abas de filtro de agendamentos implementam `role="tablist"`, `roving tabIndex` e navegação pelas setas `ArrowLeft` / `ArrowRight`.
- **Tema Claro e Escuro (`Light` / `Dark`):**
  - Paleta baseada em variáveis CSS semânticas em `app/globals.css`, com alternância instantânea persistida no navegador e sincronizada entre abas.

---

## Rotas da Aplicação

| Rota | Perfil | Descrição |
| :--- | :--- | :--- |
| `/` | Todos | Landing page para visitantes ou Painel Inicial para Clientes e Profissionais |
| `/services` | Todos | Catálogo público de serviços com filtro de busca instantâneo |
| `/services/details/[id]` | Todos / Cliente | Detalhes do serviço e seleção de data/horário livre para agendamento |
| `/services/[id]` | Profissional | Gestão dos serviços criados pelo profissional (**Meus Serviços**) |
| `/services/create` | Profissional | Cadastro de novo serviço com pré-visualização em tempo real |
| `/availability` | Profissional | Calendário e gestão de janelas de disponibilidade de atendimento |
| `/appointments/[id]` | Cliente / Profissional | Histórico e gestão de agendamentos com filtros por status na URL |
| `/auth/user/login` · `/signin` | Visitante | Login e cadastro de conta de Cliente |
| `/auth/professional/login` · `/signin` | Visitante | Login e cadastro de conta de Profissional |

---

## Configuração e Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (opcional em desenvolvimento caso o back-end rode em `http://localhost:3000`):

```env
# URL base da API Back-End (padrão: http://localhost:3000)
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## Como Executar

### Execução Local

1. **Certifique-se de que a [API do Back-End](https://github.com/carvpablo/Sistema-agendamento-backend) está rodando na porta `3000`.**

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento (porta `3001` quando a `3000` está em uso pelo back-end):**
   ```bash
   npm run dev -- -p 3001
   ```
   Acesse `http://localhost:3001` no navegador.

4. **Build de produção:**
   ```bash
   npm run build
   npm start
   ```

### Execução com Docker

```bash
docker build -t agendamentos-frontend .
docker run -p 3001:3000 -e NEXT_PUBLIC_API_URL="http://localhost:3000" agendamentos-frontend
```

---

## Testes e Qualidade de Código

O front-end utiliza **Vitest**, **React Testing Library**, **TypeScript** e **ESLint**:

```bash
# Executar os testes unitários e de componentes
npm test

# Executar os testes em modo watch
npm run test:watch

# Verificar tipos TypeScript
npx tsc --noEmit

# Executar análise estática do ESLint
npm run lint
```
