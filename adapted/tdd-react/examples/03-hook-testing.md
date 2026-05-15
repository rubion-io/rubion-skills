# Örnek: Custom Hook Testi — renderHook

**Senaryo:** `useOrderTotals` hook'u — TanStack Query + hesaplama logic'i.

---

## Hook Testi

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
  const { result } = renderHook(() => useOrderTotals("customer-42"), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual({ openCount: 3, totalAmount: 12_500 });
});
```

## State Güncellemesi (`act`)

```tsx
import { act } from "@testing-library/react";

test("setCount artırır", () => {
  const { result } = renderHook(() => useCounter());

  act(() => result.current.increment());

  expect(result.current.count).toBe(1);
});
```

**Kural:** Hook'u test etmek için component render'a gerek yok. `renderHook` + `wrapper` pattern yeterli.
