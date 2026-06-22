---
name: scaffold-frontend-react
description: Yeni bir React + TypeScript frontend iskeleti kurar — Vite + React Router + TanStack Query + Vitest/RTL/MSW çekirdek; shadcn/ui, Zustand, React Hook Form + Zod, Playwright ve OpenAPI tip üretimi opsiyonel. features/shared/app klasör düzeni. "React kur", "frontend iskelet", "Vite app scaffold" denildiğinde kullan.
stack: [react, typescript, vite, tanstack-query, react-router, vitest, msw]
---

# Scaffold Frontend React — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

> **Test stack gerekçesi** (Vitest vs Jest, MSW, RTL) → [ADR-0008](../../docs/adr/0008-test-stack.md). Test yazımı için → [`tdd-react`](../../adapted/tdd-react/SKILL.md).

Bir React frontend'in **sıfırdan iskeletini** kurar: Vite projesi, klasör düzeni, server-state + routing + test altyapısı. Component/hook yazmak için sonra [`tdd-react`](../../adapted/tdd-react/SKILL.md) kullanılır.

> **Paket yöneticisi:** pnpm (varsayılan). Repo'da `package-lock.json` varsa npm'e, `yarn.lock` varsa yarn'a düş.

### Mono-repo Yerleşimi

Aynı repo'da backend de varsa (full-stack — bkz. [stack-conventions](../../docs/stack-conventions.md) Mono-repo Kök Düzeni), frontend `src/frontend/` altına kurulur; backend `src/backend/` altındadır.

- Tek frontend → `src/frontend/` doğrudan Vite kökü (`package.json` burada)
- Birden fazla app → `src/frontend/<app-kebab>/` (örn: `src/frontend/erp-web/`, `src/frontend/admin-web/`)
- **Frontend-only** repo (backend ayrı) → Vite projesi repo kökünde, ön ek yok

Vite oluşturma komutunu doğru dizinde çalıştır: full-stack'te `cd src/frontend` (veya `src/frontend/<app>`), sonra `pnpm create vite . ...`.

---

## Önce Sor

Çekirdek her zaman kurulur. Yalnızca **opsiyonelleri** sor (tek mesajda):

1. **Proje adı** nedir? (kebab-case — örn: `erp-web`, `portfolio-app`)
2. **shadcn/ui + Tailwind** kurulsun mu? (headless UI kit — UI ağırlıklı projeler için önerilir)
3. **Zustand** (client state) eklensin mi? (server state TanStack Query'de; bu sadece UI/oturum gibi client state için)
4. **React Hook Form + Zod** eklensin mi? (form ağırlıklı proje ise)
5. **Playwright** (E2E) eklensin mi?
6. **Backend bağlı mı?** Varsa OpenAPI/Swagger URL'i → `openapi-typescript` ile tip üretimi kurulabilir (DTO'ları elle yazmak yerine).

> Karar veremezse: shadcn **evet**, Zustand **hayır** (gerekince eklenir), RHF+Zod **evet**, Playwright **hayır**, OpenAPI tip üretimi backend varsa **evet**.

---

## Çekirdek Kurulum (Her Zaman)

### 1. Vite Projesi

```bash
pnpm create vite@latest <project-name> -- --template react-ts
cd <project-name>
pnpm install
```

### 2. Çekirdek Paketler

```bash
# Routing + server state
pnpm add react-router-dom @tanstack/react-query

# Test çekirdeği (tdd-react ile birebir uyumlu)
pnpm add -D vitest @vitest/ui jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  msw @vitejs/plugin-react
```

### 3. Klasör Yapısı

```
src/
├── features/                 ← her domain alanı kendi dikey dilimi
│   └── <feature>/
│       ├── components/
│       ├── hooks/
│       ├── api.ts            ← TanStack Query hook'ları
│       └── types.ts
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── app/
│   ├── router.tsx            ← React Router v6 route tanımları
│   └── providers.tsx         ← QueryClientProvider + (varsa) diğer provider'lar
├── test/
│   ├── setup.ts
│   └── msw/
│       ├── server.ts
│       └── handlers.ts
└── main.tsx
```

### 4. `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

### 5. `src/test/setup.ts` (MSW bağlı)

```ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());
```

```ts
// src/test/msw/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";
export const server = setupServer(...handlers);
```

```ts
// src/test/msw/handlers.ts
import { http, HttpResponse } from "msw";
export const handlers = [
  // örn: http.get("/api/orders", () => HttpResponse.json([])),
];
```

### 6. `app/providers.tsx`

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

### 7. `app/router.tsx`

```tsx
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  { path: "/", element: <div>Home</div> },
  // feature route'ları buraya
]);
```

### 8. `main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./app/providers";
import { router } from "./app/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
```

### 9. `package.json` script'leri

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest",
    "test:run": "vitest --run",
    "test:ui": "vitest --ui"
  }
}
```

---

## Opsiyonel Modüller

Yalnızca kullanıcı **evet** dediyse kur.

### shadcn/ui + Tailwind

```bash
pnpm add -D tailwindcss @tailwindcss/vite
# vite.config.ts'e tailwind plugin'i ekle, src/index.css'e @import "tailwindcss";
pnpm dlx shadcn@latest init
# Component ekleme: pnpm dlx shadcn@latest add button
```

> shadcn **headless** — component'ler `src/shared/components/ui/` altına KOPYALANIR, bağımlılık olarak gelmez. Düzenlenebilir, sahibi sensin.

### Zustand (client state)

```bash
pnpm add zustand
```

```ts
// src/shared/stores/ui-store.ts
import { create } from "zustand";
interface UiState { sidebarOpen: boolean; toggleSidebar: () => void; }
export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

> Sunucu verisini Zustand'a koyma — o TanStack Query'nin işi. Zustand yalnızca client-only state (sidebar, tema, wizard adımı).

### React Hook Form + Zod

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

```tsx
const schema = z.object({ customer: z.string().min(1, "Müşteri zorunludur") });
const { register, handleSubmit, formState: { errors } } =
  useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
```

### Playwright (E2E)

```bash
pnpm create playwright@latest
# tests/ klasörü + playwright.config.ts üretir. CI'da headless çalışır.
```

### OpenAPI Tip Üretimi (Backend bağlıysa)

Backend (scaffold-backend) `/openapi/v1.json` yayınlar. DTO'ları elle yazmak yerine üret:

```bash
pnpm add -D openapi-typescript
# package.json script:
#   "gen:api": "openapi-typescript http://localhost:8080/openapi/v1.json -o src/shared/api/schema.d.ts"
pnpm gen:api
```

> Tipler `schema.d.ts`'e üretilir; `features/*/types.ts` bunlardan türetir. Backend kontratı değişince `pnpm gen:api` tekrar çalıştırılır — frontend/backend tip drift'i biter.

---

## Doğrulama

```bash
pnpm test:run     # MSW + Vitest çekirdeği ayakta — 0 test ama config doğru
pnpm dev          # http://localhost:5173 açılıyor
pnpm build        # tsc + vite build hatasız
```

İlk anlamlı testi yazmak için kullanıcıya `tdd-react`'i öner.

---

## Sonraki Adım (Skill Zinciri)

```
scaffold-frontend-react  ← buradayız
   ↓
tdd-react                her component/hook/form için red-green-refactor
   ↓ (E2E gerekiyorsa)
Playwright flow'ları
```

---

## Kontrol Listesi

```
[ ] Proje adı + opsiyoneller kullanıcıyla netleşti
[ ] Vite react-ts projesi kuruldu (pnpm)
[ ] react-router-dom + @tanstack/react-query eklendi
[ ] Vitest + RTL + user-event + jest-dom + MSW kuruldu
[ ] features/ shared/ app/ test/ klasör düzeni açıldı
[ ] providers.tsx (QueryClient) + router.tsx + main.tsx bağlandı
[ ] MSW server + setup.ts kurulu (onUnhandledRequest: error)
[ ] Seçilen opsiyoneller kuruldu (shadcn / zustand / RHF+Zod / Playwright / openapi-typescript)
[ ] pnpm test:run + pnpm build yeşil
```

---

## Yapma

- ✗ **Server state'i Zustand/Redux'a koymak** — TanStack Query server state'in tek kaynağı; client store yalnızca UI state
- ✗ **`useQuery`'yi mock'lamak için altyapı kurmak** — MSW ile gerçek fetch intercept edilir (tdd-react felsefesi)
- ✗ **shadcn'i bağımlılık gibi kurmaya çalışmak** — headless, component'ler kopyalanır
- ✗ **CRA (create-react-app) kullanmak** — Vite standart (deprecated CRA)
- ✗ **Backend DTO'larını elle çoğaltmak** — backend varsa openapi-typescript ile üret
- ✗ **Tüm opsiyonelleri sormadan kurmak** — çekirdek + sor; iskeleti şişirme
- ✗ **İlk feature component'ini bu skill'de yazmak** — iskelet kurulur, kod tdd-react ile gelir
