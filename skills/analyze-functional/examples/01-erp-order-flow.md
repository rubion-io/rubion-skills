# Örnek: ERP Sipariş Akışı — Fonksiyonel Harita

> **Senaryo:** `Milagro.Erp` (.NET backend) + `erp-web` (React) — `analyze-codebase` daha önce çalışmış, `PROJECT_ANALYSIS.md` §3 envanteri taze. Aşağıda §2'nin kısaltılmış çıktısı. (Aynı projenin teknik tarafı: [analyze-codebase örneği](../../analyze-codebase/examples/01-legacy-dotnet-erp.md).)

---

## Girdi kontrolü

> §3 envanteri bulundu (`docs/memory/99-meta/PROJECT_ANALYSIS.md`, `analyzed_commit: a3f9c21` = HEAD). 34 endpoint, 18 tablo, 12 route listesi oradan alındı — yeniden tarama yok.

---

## 2.1 Ekran Haritası (12 route — seçme)

| Route | Amaç | Gösterdiği veri | Erişim |
|---|---|---|---|
| `/login` | Giriş formu | — | public |
| `/orders` | Sipariş listesi + durum filtresi | `useOrders()` → `GET /api/orders` → `orders` | authenticated (`RequireAuth.tsx:9`) |
| `/orders/new` | Sipariş oluşturma formu | müşteri combobox: `GET /api/customers` | authenticated |
| `/orders/:id` | Detay + durum geçmişi + iptal | `useOrder(id)` → `GET /api/orders/{id}` | authenticated |
| `/reports` | (belirsiz) | `ReportPage.tsx` var ama menüden link yok, route tanımlı | authenticated |

## 2.2 Aksiyon Zincirleri (seçme 2 + yarım feature'lar)

**"Siparişi Kaydet"** — tam zincir:

```
"Kaydet" (OrderForm.tsx:84)
  → useCreateOrder() (useOrders.ts:31)
  → POST /api/orders (OrderController.cs:45)
  → OrderService.CreateOrder (OrderService.cs:120)
  → INSERT Orders, OrderItems + stok düşümü (Inventory tarafına satır içi UPDATE)
  → başarıda: /orders/:id + ['orders'] invalidation
```

**"Siparişi İptal Et"** — zincir tamam ama iş kuralı sürprizi:

```
"İptal" (OrderDetail.tsx:112)
  → useCancelOrder() (useOrders.ts:58)
  → POST /api/orders/{id}/cancel (OrderController.cs:71)
  → OrderService.CancelOrder (OrderService.cs:245)
  → UPDATE Orders.Status = Cancelled
  ⚠ Stok İADESİ YOK — CreateOrder stok düşüyor ama Cancel geri eklemiyor (Inventory'e hiç dokunmuyor)
```

→ §1 Yönetici Özeti'ne "sürpriz" olarak taşındı; §5'e ADR adayı: "İptalde stok iadesi davranışı".

**Yarım feature'lar:**

1. "Rapor İndir" butonu (`ReportPage.tsx:34`) → `onClick` içi boş `// TODO export`
2. `GET /api/reports/monthly` endpoint'i var, `/reports` sayfası onu hiç çağırmıyor (elle `fetch` bile yok)

## 2.3 Kullanıcı Akışları

**Akış 1 — Sipariş yaşam döngüsü:**

1. `/orders/new` → form → Kaydet → `Draft`
2. `/orders/:id` → "Onayla" → `Confirmed` (`OrderService.cs:200` — yalnızca Draft'tan geçilebilir)
3. "Sevk Et" → `Shipped` + `Shipments` kaydı (`OrderService.cs:225`)
4. "İptal" → `Cancelled` — **her durumdan** erişilebilir (`OrderService.cs:245`'te durum kontrolü yok) → iş kuralı mı, eksik mi? `(belirsiz)` işaretli, grill sorusu

**Akış 2 — Auth:** `/login` → `POST /api/auth/login` → JWT `localStorage` → `RequireAuth` guard → logout'ta token silme. (Refresh token yok — teknik not olarak `analyze-codebase` §4'e havale edildi.)

## 2.4 Domain Varlıkları

| Varlık | Tablo | İş anlamı |
|---|---|---|
| Order / OrderItem | Orders, OrderItems | Müşteri siparişi; Item tek başına hiçbir yerde kullanılmıyor (aggregate işareti) |
| Shipment | Shipments | UI'da **"Sevkiyat"** — kod İngilizce, UI Türkçe |
| Customer | Customers | UI'da bazı ekranlarda **"Cari"** (`CustomerList.tsx:18` başlık) — aynı kavram mı? glossary sorusu |

**Glossary adayları (§5'e):** Sevkiyat/Shipment · Cari/Customer · "Onay" (Confirm) vs "Tasdik" (`ReportPage` metninde geçiyor)

## 2.5 Ne Yapıyor / Ne Yapmıyor

**Yapıyor:** sipariş yönetimi (oluştur/onayla/sevk/iptal), müşteri CRUD, sipariş bazlı stok düşümü, JWT auth.

**Yapmıyor / yarım:** ödeme yok · iptalde stok iadesi yok · rapor indirme yarım (buton boş, endpoint öksüz) · README'nin vadettiği "fatura entegrasyonu"nun kodda kanıtı yok (`Invoicing` modülü yalnızca dahili PDF üretiyor).

**Belirsiz:** `Cancelled`'ın her durumdan erişilebilir olması bilinçli mi; `/reports` sayfası bilinçli olarak mı menüden çıkarılmış.

---

## Kapanış (solo mod çıktısı)

> Fonksiyonel harita çıktı: 12 ekran, 2 ana akış, 2 yarım feature, 3 glossary adayı, 2 karar sorusu.
>
> Önerilen sıradaki adım (otomatik çalıştırılmaz): `grill-with-docs` Rol 1 — bu haritayı CONTEXT.md + ADR'lere resmileştir; özellikle "iptalde stok iadesi" ve "Cari/Customer" soruları kullanıcıyla netleşmeli.
