# Örnek: TanStack Query'li Component — Gerçek Fetch + MSW

Senaryo: `<OrderDetails orderId="42" />` component'i bir order'ı API'dan çeker ve gösterir. Loading / success / error state'leri var.

---

## Component (test'ten önce iskelet)

```tsx
// src/features/orders/OrderDetails.tsx
import { useQuery } from "@tanstack/react-query";

type Order = {
  id: string;
  customer: string;
  status: "open" | "closed" | "cancelled";
  totalAmount: number;
};

async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error("Sipariş yüklenemedi");
  return res.json();
}

export function OrderDetails({ orderId }: { orderId: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
  });

  if (isLoading) return <p>Yükleniyor...</p>;
  if (isError) return <div role="alert">{(error as Error).message}</div>;

  return (
    <article>
      <h2>{data!.customer}</h2>
      <p>Durum: {data!.status}</p>
      <p>Toplam: ₺{data!.totalAmount.toLocaleString("tr-TR")}</p>
    </article>
  );
}
```

---

## MSW Handler

```ts
// src/test/msw-server.ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/orders/:id", ({ params }) => {
    if (params.id === "404") {
      return HttpResponse.json({}, { status: 404 });
    }
    return HttpResponse.json({
      id: params.id,
      customer: "ACME A.Ş.",
      status: "open",
      totalAmount: 12500,
    });
  }),
];

export const server = setupServer(...handlers);
```

---

## Test

```tsx
// src/features/orders/OrderDetails.test.tsx
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw-server";
import { renderWithQuery } from "../../test/test-utils";
import { screen } from "@testing-library/react";
import { OrderDetails } from "./OrderDetails";

test("yüklenirken loading mesajı gösterir", () => {
  renderWithQuery(<OrderDetails orderId="42" />);
  expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
});

test("yüklendikten sonra müşteri adını ve toplamı gösterir", async () => {
  renderWithQuery(<OrderDetails orderId="42" />);

  expect(await screen.findByRole("heading", { name: "ACME A.Ş." })).toBeInTheDocument();
  expect(screen.getByText(/₺12\.500/)).toBeInTheDocument();
});

test("404 olunca hata gösterir", async () => {
  server.use(
    http.get("/api/orders/:id", () => HttpResponse.json({}, { status: 404 })),
  );

  renderWithQuery(<OrderDetails orderId="42" />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/yüklenemedi/i);
});

test("network hatasında hata gösterir", async () => {
  server.use(
    http.get("/api/orders/:id", () => HttpResponse.error()),
  );

  renderWithQuery(<OrderDetails orderId="42" />);

  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
```

---

## Test Kararları

- **MSW kullanıldı, useQuery mock'lanmadı:** Gerçek fetch path'i test edildi, refactor'a dayanıklı
- **`renderWithQuery` helper:** Her testte QueryClient kurulumu tekrar edilmedi
- **role-based queries:** `getByRole("heading"|"alert")` — erişilebilirliği bonus olarak doğrular
- **`findBy*` async için:** waitFor ile manual loop yerine
