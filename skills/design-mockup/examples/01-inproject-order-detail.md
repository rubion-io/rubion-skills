# Örnek — Mod 1: Mevcut projede sipariş detay sayfası taslağı

**Senaryo:** `rubion-erp` mono-repo'sunda (`src/frontend/` Vite + shadcn kurulu) tasarımcı diyor ki: *"Sipariş detay sayfasını yeniden tasarlamak istiyorum, mockup yap — iki varyant: yan panel vs tam sayfa."*

**Tespit:** `src/frontend/package.json` → react + vite var → **Mod 1, web**. Platform sorulmaz.

**Sorulan:** fidelity (hi-fi seçildi), varyant sayısı (kullanıcı zaten 2 dedi).

---

## 1. Branch + klasör

```bash
git checkout -b design/order-detail-v2
```

```
src/frontend/src/_design/order-detail-v2/
├── OrderDetailV2Page.tsx
├── fixtures.ts
└── NOTES.md
```

## 2. fixtures.ts — tüm dummy data tek yerde

```ts
// Taslak fixture — backend'e bağlanmaz. Promote'ta useOrderById(orderId) ile değişir.
export const orderFixture = {
  id: "SIP-2026-04871",
  customer: { name: "Akdeniz Endüstriyel Mutfak San. ve Tic. Ltd. Şti.", city: "Antalya" },
  status: "uretimde" as const,
  createdAt: "2026-07-12T09:30:00Z",
  total: 184_750.5,
  currency: "TRY",
  items: [
    { sku: "PRF-3040", name: "Paslanmaz Çelik Tezgah 3040 (özel ölçü)", qty: 4, unitPrice: 28_900 },
    { sku: "DVL-118", name: "Devrilir Tava 118 lt", qty: 1, unitPrice: 61_150.5 },
    { sku: "RAF-201", name: "Duvar Rafı 201", qty: 6, unitPrice: 1_450 },
  ],
  timeline: [
    { at: "2026-07-12", label: "Sipariş alındı" },
    { at: "2026-07-15", label: "Üretim planlandı" },
    { at: "2026-07-21", label: "Üretimde", current: true },
  ],
};

export const emptyOrderFixture = { ...orderFixture, items: [], timeline: [] };
```

> İçerik gerçekçi: uzun firma ünvanı ("Ltd. Şti." taşma testi), kuruşlu tutar, gerçek tarih. "Müşteri 1 / Ürün 1" **yok**.

## 3. OrderDetailV2Page.tsx — gerçek shadcn component'leri, varyant switch'i

```tsx
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { orderFixture } from "./fixtures";

// TASLAK — design/order-detail-v2. Promote-or-delete: 2026-08-13'e kadar karar.
export function OrderDetailV2Page() {
  const [params] = useSearchParams();
  const variant = params.get("variant") ?? "a"; // a: yan panel, b: tam sayfa
  const order = orderFixture;

  return (
    <div className={variant === "a" ? "grid grid-cols-[1fr_380px] gap-6" : "mx-auto max-w-3xl space-y-6"}>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{order.id}</CardTitle>
          <Badge variant="secondary">Üretimde</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{order.customer.name} · {order.customer.city}</p>
          <Separator className="my-4" />
          {order.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Bu siparişte kalem yok.</p>
          ) : (
            <ul className="space-y-2">
              {order.items.map((i) => (
                <li key={i.sku} className="flex justify-between text-sm">
                  <span className="truncate pr-4">{i.name}</span>
                  <span className="tabular-nums">{i.qty} × {i.unitPrice.toLocaleString("tr-TR")} ₺</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {/* variant a: timeline yan panelde; b: içerik altında — detay kısaltıldı */}
      <Button className="w-full">Sipariş Emrini Yazdır</Button>
    </div>
  );
}
```

## 4. Router — DEV guard'lı `_design` route'u

```tsx
// app/router.tsx içine, bir kez:
...(import.meta.env.DEV
  ? [{ path: "/_design/order-detail-v2", element: <OrderDetailV2Page /> }]
  : []),
```

Tasarımcı tarayıcıda gezer: `/_design/order-detail-v2?variant=a` ↔ `?variant=b`.

## 5. NOTES.md — handoff + karar

```markdown
## Handoff — order-detail-v2
| Bölge | Component karşılığı | Not |
|---|---|---|
| Başlık + durum | shadcn `Card` + `Badge variant=secondary` | durum renkleri token'dan |
| Kalem listesi | mevcut liste deseni | boş durum metni dahil |
| Zaman çizelgesi | yeni component gerekir (`OrderTimeline`) | promote'ta features/orders'a |
| Yazdır | `Button` default | variant b'de sticky bottom |

Karar (2026-07-30): **Variant A** — yan panel; timeline'ı kaybetmeden kalemler okunuyor.
Açık soru: iptal aksiyonu bu ekranda mı, liste ekranında mı?
```

## 6. Sonuç

Karar verildi → taslak `features/orders/`e taşınır (`tdd-react` ile `OrderTimeline` test-first yazılır), `fixtures.ts` importu `useOrderById` ile değişir, `design/order-detail-v2` branch'i kapanır.
