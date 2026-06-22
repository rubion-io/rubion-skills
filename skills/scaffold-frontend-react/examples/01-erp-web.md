# Örnek — ERP Web Frontend İskeleti

Kullanıcı: *"erp-web adında React frontend kur, backend Rubion.Erp'e bağlanacak, UI ağırlıklı."*

---

## Sorulan + Cevaplar

| Soru | Cevap |
|---|---|
| Proje adı | `erp-web` |
| shadcn/ui + Tailwind | Evet (UI ağırlıklı) |
| Zustand | Hayır (gerekince eklenir) |
| RHF + Zod | Evet (form çok) |
| Playwright | Hayır (şimdilik) |
| Backend OpenAPI | Evet → `http://localhost:8080/openapi/v1.json` |

---

## Çalıştırılan Komutlar

```bash
pnpm create vite@latest erp-web -- --template react-ts
cd erp-web
pnpm install

# Çekirdek
pnpm add react-router-dom @tanstack/react-query
pnpm add -D vitest @vitest/ui jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  msw @vitejs/plugin-react

# Seçilen opsiyoneller
pnpm add -D tailwindcss @tailwindcss/vite
pnpm dlx shadcn@latest init
pnpm add react-hook-form zod @hookform/resolvers
pnpm add -D openapi-typescript
```

---

## Üretilen Ağaç

```
erp-web/
├── vite.config.ts            # react + tailwind plugin
├── vitest.config.ts
├── components.json           # shadcn config
├── package.json              # + gen:api script
└── src/
    ├── main.tsx
    ├── index.css             # @import "tailwindcss";
    ├── app/
    │   ├── providers.tsx     # QueryClientProvider
    │   └── router.tsx
    ├── features/             # boş — ilk feature tdd-react ile gelir
    ├── shared/
    │   ├── components/ui/    # shadcn kopyaları (button, input...)
    │   └── api/schema.d.ts   # openapi-typescript çıktısı
    └── test/
        ├── setup.ts
        └── msw/{server,handlers}.ts
```

---

## package.json (ilgili kısım)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest",
    "test:run": "vitest --run",
    "gen:api": "openapi-typescript http://localhost:8080/openapi/v1.json -o src/shared/api/schema.d.ts"
  }
}
```

---

## Backend Tip Üretimi

```bash
# Backend ayaktayken:
pnpm gen:api
# → src/shared/api/schema.d.ts üretildi
```

```ts
// features/orders/types.ts — backend kontratından türetilmiş
import type { components } from "@/shared/api/schema";
export type OrderDto = components["schemas"]["OrderDto"];
export type CreateOrderRequest = components["schemas"]["CreateOrderCommand"];
```

> Backend `CreateOrderCommand`'a alan eklediğinde `pnpm gen:api` yeniden çalıştırılır; tip drift'i derleme anında yakalanır.

---

## Doğrulama

```bash
pnpm test:run     # MSW + Vitest config doğru (0 test)
pnpm dev          # http://localhost:5173
pnpm build        # tsc + vite build yeşil
```

---

## Sonraki Adım

```
1. ✅ scaffold-frontend-react   ← burada
2. ⏭ tdd-react                  "OrderList component için test yaz" (features/orders)
3. ⏭ tdd-react                  CreateOrderForm — RHF + Zod + MSW mutation testi
```

> `features/` şu an boş. İlk anlamlı UI `tdd-react` ile `features/orders/components/` altına, MSW ile gerçek fetch intercept edilerek gelir.
