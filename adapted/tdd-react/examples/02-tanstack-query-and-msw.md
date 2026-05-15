# Örnek: TanStack Query + MSW ile Component Testi

**Senaryo:** `OrderDetails` component'i — API'den sipariş çeker, hata durumunu gösterir.

---

## Test Yardımcısı

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

## MSW Setup

```ts
// src/test/msw-server.ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/orders/:id", ({ params }) =>
    HttpResponse.json({ id: params.id, customer: "ACME A.Ş.", status: "open" })
  ),
];

export const server = setupServer(...handlers);
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); cleanup(); });
afterAll(() => server.close());
```

## Testler

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

**Kural:** `useQuery`'yi mock'lama — implementation detayı. MSW ile gerçek `fetch` intercept et.
