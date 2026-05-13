---
adapted_from: mattpocock/skills/skills/engineering/prototype
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: medium
name: prototype
description: Bir tasarımı bağlamadan önce keşfetmek için throwaway prototip kurar. Dört mod arasında dallanır — Backend CLI (logic POC, dotnet new console), Backend API (Minimal API endpoint POC), Frontend UI variants (Vite + ?variant=a|b|c), Mobile (Expo). "Bunu prototip et", "POC yap", "tasarımı dene" denildiğinde kullan.
stack: [dotnet, csharp, react, vite, react-native, expo]
---

# Prototype — Rubion

Prototip = **bir soruyu yanıtlayan throwaway kod.** Soru, prototipin şeklini belirler.

---

## Modu seç

Yanıtlanan soruyu tespit et — kullanıcının prompt'undan, çevresindeki koddan, ya da kullanıcıya sorarak:

| Soru | Mod | Şablon |
|---|---|---|
| "Bu logic / state model doğru hissettiriyor mu?" | **Backend CLI** | `dotnet new console` |
| "Bu endpoint contract'ı doğru mu?" | **Backend API** | `dotnet new web` (Minimal API) |
| "Bu nasıl görünmeli?" (web) | **Frontend UI variants** | Vite + `?variant=a|b|c` |
| "Bu nasıl görünmeli?" (mobil) | **Mobile** | Expo Snack veya `npx create-expo-app` |

Belirsizse: çevresindeki koda bak (backend modülü → CLI/API; sayfa → UI). Varsayımı prototipin başına yaz.

---

## İki Mod İçin Ortak Kurallar

1. **Day 1'den throwaway, açıkça öyle işaretlenmiş.** Kullanılacak yere yakın yerleştir (modülün veya sayfanın yanı) ama isimden prototip olduğu anlaşılsın. Repo'nun routing convention'ını boz, yeni top-level yapı icat etme.
2. **Tek komutla çalışsın.** `dotnet run`, `pnpm dev`, `pnpm <name>` — kullanıcı düşünmeden başlatabilmeli.
3. **Persistence yok (varsayılan).** State bellekte. Persistence prototipin sınadığı şey olmadığı sürece.
4. **Cila yok.** Test yok, kapsamlı error handling yok, abstraction yok. Hızlı öğren, sonra sil.
5. **State'i yüzeye çıkar.** Her aksiyondan sonra (logic) veya her variant geçişinde (UI) ilgili state'i print et / render et.
6. **Tamamlanınca sil ya da emz.** Soru cevaplandı mı, ya commit'i sil ya kararı gerçek koda al — repo'da çürümeye bırakma.

---

## Mod 1 — Backend CLI (Logic / State POC)

**Soru örnekleri:**
- "Bu state machine doğru transition'ları üretiyor mu?"
- "Bu pricing kuralı doğru mu hesaplıyor?"
- "Bu reducer / event sourcing flow tutarlı mı?"

**Setup:**

```bash
# Hedef modülün yanına yerleştir
mkdir -p src/Pricing/_prototype
cd src/Pricing/_prototype

dotnet new console -n PricingProto
cd PricingProto
```

`Program.cs` template'i:

```csharp
// _prototype — silinecek, prod değil

var state = new PricingState();

while (true)
{
    Console.WriteLine();
    Console.WriteLine($"State: {state}");
    Console.Write("Aksiyon (add|discount|reset|quit): ");
    var line = Console.ReadLine();

    switch (line)
    {
        case "add":
            Console.Write("Ürün fiyatı: ");
            if (decimal.TryParse(Console.ReadLine(), out var p))
                state = state.AddItem(p);
            break;
        case "discount":
            Console.Write("İndirim %: ");
            if (int.TryParse(Console.ReadLine(), out var d))
                state = state.ApplyDiscount(d);
            break;
        case "reset":
            state = new PricingState();
            break;
        case "quit":
            return;
    }
}

record PricingState(decimal Subtotal = 0m, decimal Discount = 0m)
{
    public PricingState AddItem(decimal price) =>
        this with { Subtotal = Subtotal + price };

    public PricingState ApplyDiscount(int pct) =>
        this with { Discount = Subtotal * pct / 100m };

    public decimal Total => Subtotal - Discount;

    public override string ToString() =>
        $"Subtotal=₺{Subtotal}, Discount=₺{Discount}, Total=₺{Total}";
}
```

```bash
dotnet run
```

**State her aksiyondan sonra yazdırılır** — yanlış davranış anında görülür.

---

## Mod 2 — Backend API (Endpoint Contract POC)

**Soru örnekleri:**
- "Bu endpoint contract'ı frontend için kullanışlı mı?"
- "Multipart form vs JSON — hangisi mantıklı?"
- "WebSocket mi, polling mi?"

**Setup:**

```bash
mkdir -p services/orders/_prototype
cd services/orders/_prototype

dotnet new web -n OrdersProto
cd OrdersProto
```

`Program.cs`:

```csharp
// _prototype — silinecek, prod değil

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Bellekteki "DB"
var orders = new List<dynamic>();

// Variant A: tek POST, server orderId üretir
app.MapPost("/v-a/orders", (CreateOrderDto dto) =>
{
    var id = Guid.NewGuid();
    orders.Add(new { id, dto.Customer, dto.Items });
    return Results.Created($"/v-a/orders/{id}", new { id });
});

// Variant B: client orderId verir, server idempotent
app.MapPut("/v-b/orders/{id:guid}", (Guid id, CreateOrderDto dto) =>
{
    if (orders.Any(o => o.id == id)) return Results.NoContent();
    orders.Add(new { id, dto.Customer, dto.Items });
    return Results.Created($"/v-b/orders/{id}", new { id });
});

app.MapGet("/orders", () => orders);

app.Run();

record CreateOrderDto(string Customer, List<OrderItemDto> Items);
record OrderItemDto(string ProductCode, int Quantity);
```

```bash
dotnet run
# Sonra başka terminalde:
curl -X POST http://localhost:5000/v-a/orders -H "Content-Type: application/json" \
  -d '{"customer":"ACME","items":[{"productCode":"P1","quantity":2}]}'

curl -X PUT http://localhost:5000/v-b/orders/00000000-0000-0000-0000-000000000001 \
  -H "Content-Type: application/json" \
  -d '{"customer":"ACME","items":[{"productCode":"P1","quantity":2}]}'
```

İki variant yan yana — hangisi daha kullanışlı, deneyerek karar verilir.

---

## Mod 3 — Frontend UI Variants

**Soru örnekleri:**
- "Sipariş kartı kompakt mı, geniş mi olmalı?"
- "Action'lar dropdown'da mı, inline button'larda mı?"
- "Form tek sayfa mı, wizard mı?"

**Setup:**

```bash
# Mevcut Vite projesinin içinde
mkdir src/features/orders/_prototype
```

Routing convention: tek route, `?variant=a|b|c` query param.

```tsx
// src/features/orders/_prototype/OrderCardPrototype.tsx
// _prototype — silinecek, prod değil

import { useSearchParams } from "react-router-dom";

const order = {
  id: "42",
  customer: "ACME A.Ş.",
  status: "open",
  total: 12500,
  items: [
    { code: "P1", qty: 2 },
    { code: "P2", qty: 5 },
  ],
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
        order = {JSON.stringify(order, null, 2)}
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
      <p>Durum: {order.status}</p>
      <p>Toplam: ₺{order.total}</p>
    </article>
  );
}

function VariantB() {
  return (
    <article style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16,
                      padding: 16, border: "1px solid #ddd" }}>
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
        <span style={{ background: "#0066cc", color: "white", padding: "2px 8px", borderRadius: 4 }}>
          {order.status}
        </span>
      </header>
      <p>Toplam: ₺{order.total}</p>
    </article>
  );
}
```

Route'a ekle:

```tsx
{ path: "/_prototype/order-card", element: <OrderCardPrototype /> }
```

```bash
pnpm dev
# http://localhost:5173/_prototype/order-card?variant=a
```

Floating bottom bar her tıklamada variant'ı değiştirir. State (bu örnekte sahte sipariş objesi) altta her zaman görünür.

---

## Mod 4 — Mobile (Expo)

**Soru örnekleri:**
- "Native modal mı, BottomSheet mi?"
- "Tab navigator mı, stack mi?"

**Hızlı yol — Expo Snack:**

https://snack.expo.dev üzerinden tarayıcıda. Native module gerektirmiyorsa en hızlı. URL kaydı yeterli, deploy gerekmez.

**Lokal yol — yeni proje:**

```bash
npx create-expo-app -t blank prototype-rn
cd prototype-rn
npx expo start
```

Variant pattern aynı: tek ekran, `?variant=` yerine bir state.

```tsx
// App.tsx
import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

const variants = ["A", "B", "C"] as const;
type Variant = typeof variants[number];

export default function App() {
  const [variant, setVariant] = useState<Variant>("A");

  return (
    <View style={styles.container}>
      {variant === "A" && <VariantA />}
      {variant === "B" && <VariantB />}
      {variant === "C" && <VariantC />}
      <View style={styles.bar}>
        {variants.map((v) => (
          <Pressable key={v} onPress={() => setVariant(v)} style={styles.btn}>
            <Text style={{ fontWeight: v === variant ? "bold" : "normal" }}>{v}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// VariantA, VariantB, VariantC — UI denemeleri

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  bar: { position: "absolute", bottom: 32, left: 0, right: 0, flexDirection: "row",
         justifyContent: "center", gap: 12 },
  btn: { padding: 12, borderRadius: 8, backgroundColor: "#eee" },
});
```

---

## Tamamlandığında

Prototipten saklanmaya değer tek şey **cevaptır**. Bunu kalıcı bir yere kaydet:

- Commit mesajı: "Variant C seçildi — bottom action bar daha keşfedilebilir"
- ADR: Karar gerçekten yeniden gündeme gelebilirse
- Issue / PR description
- `_prototype/NOTES.md`

Sonra:
- Prototipi sil, **veya**
- Doğrulanan kararı gerçek koda işle (variant C'nin asıl bileşene dönüşmesi)

Repo'da çürümeye bırakma.

---

## Yapma

- ✗ Prototipi production-quality yazmaya çalışmak (error handling, logging, test)
- ✗ Persistent state — bellekteki yeterli, DB prototip kapsamı dışı
- ✗ Cevap bulununca prototipi silmemek (`_prototype/` klasörü 3 ay sonra çürür)
- ✗ Variant'ları farklı route'lara yaymak (tek route + state daha hızlı karşılaştırma)
- ✗ Sorudan emin değilken modu seçip yazmaya başlamak (önce kullanıcıya sor)
