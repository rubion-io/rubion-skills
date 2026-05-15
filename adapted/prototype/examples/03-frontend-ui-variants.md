# Örnek: Frontend UI Variants — Sipariş Kartı POC

**Soru:** "Sipariş kartı kompakt mı, geniş mi olmalı?"
**Mod:** Frontend UI variants (Vite + `?variant=a|b|c`)

---

## Setup

```bash
# Mevcut Vite projesinin içinde
mkdir src/features/orders/_prototype
```

## OrderCardPrototype.tsx

```tsx
// src/features/orders/_prototype/OrderCardPrototype.tsx
// _prototype — silinecek, prod değil

import { useSearchParams } from "react-router-dom";

const order = {
  id: "42", customer: "ACME A.Ş.", status: "open", total: 12500,
  items: [{ code: "P1", qty: 2 }, { code: "P2", qty: 5 }],
};

export function OrderCardPrototype() {
  const [params, setParams] = useSearchParams();
  const variant = params.get("variant") ?? "a";

  return (
    <div>
      <Variants current={variant} onChange={(v) => setParams({ variant: v })} />
      {variant === "a" && <VariantA />}
      {variant === "b" && <VariantB />}
      {variant === "c" && <VariantC />}
      <pre style={{ marginTop: 32, opacity: 0.5 }}>
        {JSON.stringify(order, null, 2)}
      </pre>
    </div>
  );
}

function Variants({ current, onChange }: { current: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
                  background: "#222", color: "white", padding: 12, borderRadius: 8 }}>
      {["a", "b", "c"].map((v) => (
        <button key={v} onClick={() => onChange(v)}
                style={{ marginRight: 8, fontWeight: v === current ? "bold" : "normal" }}>
          Variant {v.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function VariantA() {
  return (
    <article style={{ border: "1px solid #ddd", padding: 16 }}>
      <h2>{order.customer}</h2>
      <p>Durum: {order.status} | Toplam: ₺{order.total}</p>
    </article>
  );
}

function VariantB() {
  return (
    <article style={{ display: "grid", gridTemplateColumns: "1fr auto",
                      gap: 16, padding: 16, border: "1px solid #ddd" }}>
      <div>
        <h2>{order.customer}</h2>
        <ul>{order.items.map((i) => <li key={i.code}>{i.code} × {i.qty}</li>)}</ul>
      </div>
      <strong>₺{order.total}</strong>
    </article>
  );
}

function VariantC() {
  return (
    <article style={{ padding: 16, border: "2px solid #0066cc", borderRadius: 12 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{order.customer}</strong>
        <span style={{ background: "#0066cc", color: "white",
                       padding: "2px 8px", borderRadius: 4 }}>{order.status}</span>
      </header>
      <p>₺{order.total}</p>
    </article>
  );
}
```

## Route

```tsx
{ path: "/_prototype/order-card", element: <OrderCardPrototype /> }
```

```bash
pnpm dev
# http://localhost:5173/_prototype/order-card?variant=a
```

Floating bottom bar her tıklamada variant geçişi yapar. State altta her zaman görünür.
