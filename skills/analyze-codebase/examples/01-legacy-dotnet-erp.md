# Örnek: 4 Yıllık .NET ERP Monolith — Teknik Röntgen

> **Senaryo:** Devralınan `Milagro.Erp` — .NET 6 (eski TFM), controller tabanlı, Service + Repository katmanlı, ~85k LOC, React frontend'i (`erp-web`) aynı repo'da. Amaç: `PROJECT_ANALYSIS.md` §3-4'ü doldurmak. Aşağıdaki çıktılar kısaltılmıştır.

---

## Faz 0 — Yönelim (ilerleme notu)

> Manifest: tek solution, 4 proje (`Api`, `Core`, `Data`, `Tests` — Tests'te yalnızca 9 dosya, şüpheli az). TFM `net6.0` (EOL). README "microservices architecture" diyor ama tek API projesi var — README iddiası gerçeği yansıtmıyor. Frontend `src/frontend/` altında Vite + React 18. Churn ve boyut listeleri çıkarıldı, envantere geçiyorum.

Churn top 5 (son 6 ay):

| Dosya | Commit |
|---|---|
| `src/backend/Services/OrderService.cs` | 41 |
| `src/backend/Controllers/OrderController.cs` | 28 |
| `src/frontend/src/features/orders/OrderForm.tsx` | 24 |
| `src/backend/Services/ReportService.cs` | 19 |
| `src/backend/Data/AppDbContext.cs` | 17 |

En büyük 3 dosya: `OrderService.cs` (612), `ReportService.cs` (534), `AppDbContext.cs` (497).

---

## Faz 1 — Teknik Envanter (§3, kısaltılmış)

### 3.1 Endpoint'ler (34 toplam — seçme satırlar)

| Metod | Path | Handler | Dosya |
|---|---|---|---|
| GET | /api/orders | `OrderController.List` → `OrderService.GetOrders` | `Controllers/OrderController.cs:28` |
| POST | /api/orders | `OrderController.Create` → `OrderService.CreateOrder` | `Controllers/OrderController.cs:45` |
| POST | /api/orders/{id}/cancel | `OrderController.Cancel` → `OrderService.CancelOrder` | `Controllers/OrderController.cs:71` |
| GET | /api/reports/monthly | `ReportController.Monthly` → `ReportService.BuildMonthly` | `Controllers/ReportController.cs:19` |

### 3.2 Veritabanı (18 tablo — seçme)

| Tablo | Kaynak | Not |
|---|---|---|
| Orders | `DbSet<Order>` — `AppDbContext.cs:22` | |
| OrderItems | `DbSet<OrderItem>` — `AppDbContext.cs:23` | |
| Shipments | `DbSet<Shipment>` — `AppDbContext.cs:31` | UI'da "Sevkiyat" |

### 3.4 Modüller

| Modül | Dosya | 6 ay commit | Test |
|---|---|---|---|
| Orders | 22 | 74 | ✗ |
| Reporting | 9 | 21 | ✗ |
| Invoicing | 14 | 12 | ✓ (3 test) |
| Inventory | 11 | 9 | ✗ |
| Auth | 7 | 4 | ✓ |

---

## Faz 2 — Teknik Sağlık Bulguları (§4, seçme 7)

| ID | Kategori | Konum | Önem | Çaba | Bulgu + Öneri |
|---|---|---|---|---|---|
| SEC-01 | Güvenlik | `appsettings.json:14` | Critical | S | Prod connection string (şifre dahil) commit'lenmiş. Secret rotasyonu + user-secrets/env'e taşıma. |
| DEP-01 | Güvenlik | `Milagro.Erp.Api.csproj:18` | Critical | S | `Newtonsoft.Json 12.0.1` — bilinen CVE (`dotnet list package --vulnerable` çıktısı). Upgrade. |
| ARCH-01 | Mimari | `Services/OrderService.cs` (612 satır, 14 public method) | High | L | God Service — sipariş + fatura + stok düşümü tek sınıfta. `improve-codebase-architecture` adayı. |
| TEST-01 | Test | `Services/OrderService.cs` | High | M | Churn #1 (41 commit) ama tek testi yok — churn × testsiz kesişiminin başı. |
| PERF-01 | Performans | `Services/ReportService.cs:88` | High | M | `foreach` içinde `await _db.OrderItems...` — N+1; 200 siparişlik ayda 201 sorgu. Tek sorguya indir. |
| ARCH-02 | Mimari | `Data/Repositories/*.cs` | Medium | M | 9 repository'den 7'si `_db.Set<T>` pass-through (bkz. ADR-007 silme testi). |
| ERR-01 | Hata | `Controllers/*.cs` (11 nokta) | Medium | M | Boş `catch {}` — hata yutuluyor, Serilog'a düşmüyor. |

### 4.2 Churn × Testsiz Kesişimi

1. `OrderService.cs` (41 commit, test yok) — **en riskli dosya**
2. `OrderForm.tsx` (24 commit, test yok)
3. `ReportService.cs` (19 commit, test yok)

### 4.3 Kötü Görünüyor Ama Sorun Değil

- `LegacyPriceCalculator.cs` — 400 satır ama 2 yıldır dokunulmamış, testli ve izole. Refactor değeri düşük; dokunma.

---

## §5 Katkısı (Memory Besleme)

- **memorize-module adayları (churn top 5):** orders, reporting, invoicing, inventory, auth
- **ADR adayları:** "OrderService parçalanması (VSA slice'ları)", "Repository katmanı kaldırma", "net6.0 → net10.0 upgrade planı"

## Kapanış (solo mod çıktısı)

> Teknik tarama bitti: 34 endpoint, 18 tablo, 5 modül; 23 bulgu (2 Critical). Önce SEC-01 (secret rotasyonu) — commit geçmişinde şifre var.
>
> Önerilen sıradaki adımlar (otomatik çalıştırılmaz):
> 1. `analyze-functional` — fonksiyonel harita henüz yok
> 2. `improve-codebase-architecture` — ARCH-01/02 adayları için grilling
> 3. `tdd-dotnet` — TEST-01 (OrderService'e karakterizasyon testleri)
