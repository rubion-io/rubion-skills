---
adapted_from: mattpocock/skills/skills/engineering/tdd
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: heavy
name: tdd-react
description: React projelerinde Vitest + React Testing Library + MSW + user-event ile test-driven development. TanStack Query'li component'ler, custom hook'lar ve form'lar için pratik test stratejileri. "React TDD", "component test", "hook test", "RTL ile yaz" denildiğinde kullan.
stack: [react, typescript, vitest, react-testing-library, msw, tanstack-query]
---

# TDD — React / Rubion

## Felsefe

**Davranışı test et, implementasyonu değil.** Kullanıcının yaptığını yap (tıkla, yaz, gör), DOM'da görülmesi gerekeni assert et. State, props veya internal hook çağrılarını test etme.

İyi React testi:
- Kullanıcı eylemini (`user.click`, `user.type`) tetikler
- Ekrana çıkan ya da çıkmayan elementi (`screen.getByRole`, `findByText`) assert eder
- Implementasyon refactor edildiğinde geçer

Kötü React testi:
- `expect(useState).toHaveBeenCalled()` — implementation
- `expect(component.state.count).toBe(1)` — internal state
- `expect(mockSetUser).toHaveBeenCalledWith(...)` — mock'a sıkı bağlı

---

## Anti-Pattern: Yatay Dilim

Tüm test'leri önce, tüm bileşeni sonra yazma. Bir test → bileşene minimal değişiklik → bir sonraki test.

---

## Stack

| Rol | Paket |
|---|---|
| Test runner | Vitest |
| DOM | jsdom (Vitest default) |
| Component test | @testing-library/react |
| User events | @testing-library/user-event v14 |
| API mock | MSW v2 (Mock Service Worker) |
| Assertion | Vitest expect + @testing-library/jest-dom |

`package.json`:

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^24.0.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "msw": "^2.0.0"
  }
}
```

`vitest.config.ts`:

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

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());
```

---

## İş Akışı

### 1. Planlama

Component yazmadan önce:

- [ ] Hangi user-facing davranışlar var? (görüntü, etkileşim, yönlendirme)
- [ ] API çağrısı var mı? (MSW handler gerekiyor mu?)
- [ ] State paylaşımı var mı? (context provider sarmalı mı?)
- [ ] Kullanıcı onayı

Sor: "Bu component'in dışarıya verdiği davranışlar neler?"

### 2. Tracer Bullet — İlk Test

```tsx
// CreateOrderForm.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateOrderForm } from "./CreateOrderForm";

test("kullanıcı geçerli sipariş gönderdiğinde başarı mesajı görür", async () => {
  const user = userEvent.setup();
  render(<CreateOrderForm />);

  await user.type(screen.getByLabelText(/müşteri/i), "ACME A.Ş.");
  await user.click(screen.getByRole("button", { name: /sipariş oluştur/i }));

  expect(await screen.findByText(/sipariş alındı/i)).toBeInTheDocument();
});
```

```
pnpm vitest CreateOrderForm
# → RED
```

Sonra component'i yaz, testi geçir, sonraki davranışa geç.

### 3. Sorgulama Stratejisi (Query Priority)

```
1. getByRole / findByRole          ← erişilebilirlik + en sağlam
2. getByLabelText                  ← form alanları için ideal
3. getByPlaceholderText             ← (rolü yoksa)
4. getByText                        ← non-interactive metin
5. getByDisplayValue                ← input'taki mevcut değer
6. getByAltText                     ← img
7. getByTitle
8. getByTestId                      ← son çare
```

Sync vs async:
- `getBy*` — anında var olmalı, yoksa fırlatır
- `queryBy*` — anında var olmamalı (negatif assertion için)
- `findBy*` — async olarak bekler (Promise döner)

---

## TanStack Query'li Component Testi

**Yapma:** `useQuery`'yi mock'lama. Bu implementation detayını test eder.

**Yap:** MSW ile gerçek `fetch` çağrısını intercept et, gerçek `QueryClient` ile sar.

### Test Yardımcısı

```tsx
// src/test/test-utils.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}
```

### MSW Setup

```ts
// src/test/msw-server.ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/orders/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      customer: "ACME A.Ş.",
      status: "open",
    });
  }),
];

export const server = setupServer(...handlers);
```

```ts
// src/test/setup.ts (genişletilmiş)
import { server } from "./msw-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Testi

```tsx
test("açık sipariş detayını gösterir", async () => {
  renderWithQuery(<OrderDetails orderId="42" />);

  expect(await screen.findByText("ACME A.Ş.")).toBeInTheDocument();
  expect(screen.getByText(/açık/i)).toBeInTheDocument();
});

test("API hatası verirse hata mesajı gösterir", async () => {
  server.use(
    http.get("/api/orders/:id", () => HttpResponse.json({}, { status: 500 })),
  );

  renderWithQuery(<OrderDetails orderId="42" />);

  expect(await screen.findByRole("alert")).toHaveTextContent(/yüklenemedi/i);
});
```

---

## Custom Hook Testi

`renderHook` pattern — provider wrapper'ı ile.

```tsx
// useOrderTotals.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOrderTotals } from "./useOrderTotals";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

test("açık sipariş kalemlerinin toplamını döner", async () => {
  const { result } = renderHook(() => useOrderTotals("customer-42"), {
    wrapper,
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual({
    openCount: 3,
    totalAmount: 12_500,
  });
});
```

`act` ile state güncellemeleri:

```tsx
import { act } from "@testing-library/react";

test("setCount artırır", () => {
  const { result } = renderHook(() => useCounter());

  act(() => result.current.increment());

  expect(result.current.count).toBe(1);
});
```

---

## Form Testi

React Hook Form + Zod yaygın. Yine de **implementation'a değil davranışa** assert et.

```tsx
test("zorunlu alan eksikse hata gösterir", async () => {
  const user = userEvent.setup();
  render(<CreateOrderForm />);

  await user.click(screen.getByRole("button", { name: /oluştur/i }));

  expect(await screen.findByText(/müşteri zorunludur/i)).toBeInTheDocument();
});

test("geçerli form mutation çağırır", async () => {
  let captured: unknown;
  server.use(
    http.post("/api/orders", async ({ request }) => {
      captured = await request.json();
      return HttpResponse.json({ id: "order-1" }, { status: 201 });
    }),
  );

  const user = userEvent.setup();
  renderWithQuery(<CreateOrderForm />);

  await user.type(screen.getByLabelText(/müşteri/i), "ACME");
  await user.click(screen.getByRole("button", { name: /oluştur/i }));

  expect(await screen.findByText(/sipariş alındı/i)).toBeInTheDocument();
  expect(captured).toEqual({ customer: "ACME" });
});
```

---

## Component vs Integration Ayrımı

| Test Türü | Ne Test Eder | Hız | Örnek |
|---|---|---|---|
| **Unit (saf)** | Util fonksiyonu, saf hook | Çok hızlı | `formatCurrency(1234) === "₺1.234"` |
| **Component** | Tek component, izole, ama gerçek user interaction | Hızlı | `<Button />` tıklanabilir |
| **Integration** | Birden fazla component + state + MSW | Orta | Form gönderildiğinde liste güncellenir |
| **E2E (ayrı)** | Tam stack — Playwright (bu skill kapsamı dışı) | Yavaş | Login → checkout → ödeme |

**Tercih:** Integration test'leri en yüksek değer sağlar. Çok fazla küçük "unit component test" yerine birkaç tane gerçek user flow integration test yaz.

---

## Coverage Politikası

| Bölüm | Min Hedef |
|---|---|
| Hook (saf logic) | %80 |
| Component (kullanıcı flow'u) | %60 |
| Util / formatter | %90 |
| Storybook bileşenleri | (snapshot/visual ile kapatılır) |

Dogmatik değil. Kritik user flow'ları kapat, dekoratif component'leri bırak.

---

## Döngü Başına Checklist

```
[ ] Test user-facing davranışı assert ediyor
[ ] Implementation detayına (state, prop adı) assert yok
[ ] Query priority'ye uygun (role > label > text > testId)
[ ] MSW handler kurulu, gerçek fetch çağrısı yapılıyor
[ ] async için findBy* veya waitFor kullanıldı
[ ] Component refactor edildiğinde test geçer
```
