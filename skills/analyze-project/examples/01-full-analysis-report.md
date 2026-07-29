# Örnek: Uçtan Uca Analiz — Birleşik PROJECT_ANALYSIS.md

> **Senaryo:** Kullanıcı `Milagro.Erp` + `erp-web` legacy projesinde "projeyi analiz et" dedi. Orchestrator akışı + kısaltılmış birleşik rapor. Alt skill'lerin detaylı çıktıları kendi örneklerinde: [teknik](../../analyze-codebase/examples/01-legacy-dotnet-erp.md) · [fonksiyonel](../../analyze-functional/examples/01-erp-order-flow.md).

---

## Orchestrator akışı (kullanıcının gördüğü)

**1. Ön kontrol:**

> `docs/memory/99-meta/` var (setup-memory kurulu), PROJECT_ANALYSIS.md yok → tam analiz. HEAD: `a3f9c21`.

**2. analyze-codebase çalışır, bitince ilerleme notu:**

> "Teknik tarama bitti: 34 endpoint, 18 tablo, 5 modül; 23 bulgu (2 Critical: commit'li secret + CVE'li paket). Fonksiyonel analize geçiyorum."

**3. analyze-functional çalışır, bitince:**

> "Fonksiyonel harita çıktı: 12 ekran, 2 ana akış, 2 yarım feature, 3 glossary adayı. Sentezi yazıyorum."

**4-5. Sentez + yerleşim → kapanış mesajı:**

> "Rapor hazır: `docs/memory/99-meta/PROJECT_ANALYSIS.md` (MOC.md'ye link eklendi). Özet: 4 yıllık sipariş yönetimi monolith'i; sağlık orta — 2 Critical güvenlik bulgusu acil, en büyük yapısal sorun 612 satırlık OrderService. İlk önerim: SEC-01 secret rotasyonu, ardından `grill-with-docs` ile haritayı CONTEXT.md'ye resmileştirmek. Çalıştırmamı istersen söyle."

---

## Üretilen rapor (kısaltılmış)

```markdown
---
id: project-analysis
type: analysis
status: active
analyzed_commit: a3f9c21
last_reviewed: 2026-07-29
---

# Proje Analizi — Milagro.Erp

## 1. Yönetici Özeti

1. **Ne:** Sipariş yönetimi ERP'si — sipariş/müşteri/stok/raporlama; .NET 6 monolith + React SPA.
2. **Sağlık:** Orta. Çalışıyor ama churn'ün %60'ı testsiz tek servise (OrderService) yığılmış.
3. **Risk 1 (Critical):** Prod connection string commit geçmişinde — rotasyon şart (SEC-01).
4. **Risk 2 (Critical):** Newtonsoft.Json 12.0.1, bilinen CVE (DEP-01).
5. **Risk 3 (High):** OrderService 612 satır + 41 commit/6 ay + sıfır test (ARCH-01 × TEST-01).
6. **Sürpriz:** Sipariş iptali stok iadesi YAPMIYOR — oluşturma düşüyor, iptal geri eklemiyor (§2.2).
7. **Sürpriz:** README "microservices" + "fatura entegrasyonu" vadediyor; ikisi de kodda yok.
8. **Fırsat 1:** 7/9 repository pass-through — silinirse katman sadeleşir (ADR-007 uyumlu).
9. **Fırsat 2:** Rapor modülü yarım (boş buton + öksüz endpoint) — bitir ya da sil kararı ucuz.
10. **Fırsat 3:** Churn top-5 modül belli — memory kurulumu hedefli başlayabilir (§5.1).

## 2. Fonksiyonel Harita
> Analiz: 2026-07-29 @ a3f9c21 — analyze-functional

### 2.1 Ekran Haritası
12 route: login, orders (liste/yeni/detay), customers (liste/detay), inventory,
reports (menüden erişimsiz), settings... [tam tablo]

### 2.2 Aksiyon Zincirleri
- "Siparişi Kaydet" → POST /api/orders → INSERT Orders, OrderItems + stok düşümü ✓
- "İptal" → UPDATE Orders.Status ⚠ stok iadesi yok
- Yarım: "Rapor İndir" (boş TODO), GET /api/reports/monthly (öksüz)

### 2.3 Kullanıcı Akışları
Akış 1 — Sipariş: Draft → Confirmed → Shipped; Cancelled her durumdan (belirsiz — grill sorusu)
Akış 2 — Auth: login → JWT localStorage → RequireAuth guard

### 2.4 Domain Varlıkları
Order/OrderItem (aggregate), Shipment ("Sevkiyat"), Customer ("Cari"?)...

### 2.5 Ne Yapıyor / Ne Yapmıyor
Yapıyor: sipariş yönetimi, müşteri CRUD, stok düşümü, JWT auth.
Yapmıyor: ödeme, iptalde stok iadesi, rapor export, fatura entegrasyonu (README vaadi).

## 3. Teknik Envanter
> Analiz: 2026-07-29 @ a3f9c21 — analyze-codebase

34 endpoint · 18 tablo · 5 modül · 2 background job (gece rapor + mail) [tam tablolar]

## 4. Teknik Sağlık Bulguları

| ID | Kategori | Konum | Önem | Çaba |
|---|---|---|---|---|
| SEC-01 | Güvenlik | appsettings.json:14 | Critical | S |
| DEP-01 | Güvenlik | Api.csproj:18 | Critical | S |
| ARCH-01 | Mimari | OrderService.cs (612 satır) | High | L |
| TEST-01 | Test | OrderService.cs (churn #1, test 0) | High | M |
| PERF-01 | Performans | ReportService.cs:88 (N+1) | High | M |
| ... 18 bulgu daha | | | | |

### 4.2 Churn × Testsiz: OrderService.cs · OrderForm.tsx · ReportService.cs
### 4.3 Kötü Görünüyor Ama Sorun Değil: LegacyPriceCalculator.cs (izole + testli + stabil)

## 5. Memory Besleme Önerileri

### 5.1 memorize-module adayları: orders · reporting · invoicing · inventory · auth
### 5.2 Glossary adayları: Sevkiyat/Shipment · Cari/Customer · Onay/Tasdik
### 5.3 ADR adayları: iptalde stok iadesi · OrderService parçalanması · repository kaldırma · net6→net10

## 6. Sıradaki Adımlar

1. **Acil (skill değil):** SEC-01 secret rotasyonu + DEP-01 paket upgrade
2. `grill-with-docs` (Rol 1) — §2 haritayı CONTEXT.md + ADR'ye; grill soruları hazır: stok iadesi, Cari/Customer
3. `improve-codebase-architecture` — ARCH-01/02 grilling → `scaffold-adr`
4. `memorize-module` — §5.1 listesinden başla (orders)
5. `migrate-legacy-to-vsa` — improve-arch onaylarsa Strangler Fig
```

---

## Tazeleme modu örneği (3 ay sonra tekrar çalıştırma)

> Ön kontrol: rapor var, `analyzed_commit: a3f9c21`, HEAD `f27b904` — 87 commit geride. Tazeleme modu: analiz yeniden koşar, rapor sonuna eklenir:
>
> ```markdown
> ## Son Analizden Bu Yana (a3f9c21 → f27b904, 87 commit)
> - SEC-01 ✓ kapatılmış (user-secrets'a taşınmış), DEP-01 ✓ upgrade edilmiş
> - ARCH-01 kısmen: CreateOrder + CancelOrder slice'a taşınmış (OrderService 612→380 satır)
> - Yeni bulgu: NOTIF-01 — yeni mail servisi retry'sız (High)
> - Churn kayması: notifications modülü top-5'e girdi → memorize-module adayı
> ```
