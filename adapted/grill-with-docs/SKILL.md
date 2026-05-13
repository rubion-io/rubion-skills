---
adapted_from: mattpocock/skills/skills/engineering/grill-with-docs
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: light
name: grill-with-docs
description: Planı mevcut domain modeli ile sorgulayan, terminolojiyi netleştiren ve CONTEXT.md / ADR'leri güncellenen bir grilling seansı. Kullanıcı bir planı Rubion proje diliyle ve kayıtlı kararlarla stress-test etmek istediğinde kullan.
stack: [dotnet, csharp, react, react-native]
---

<ne-yapılacak>

Bu planın her boyutunu ortak bir anlayışa ulaşana kadar amansızca sorgula. Tasarım ağacının her dalını inerek kararlar arası bağımlılıkları birer birer çöz. Her soru için kendi önerilen cevabını ver.

Soruları tek tek sor; her soruya yanıt geldikten sonra bir sonrakine geç.

Eğer bir soru codebase'i inceleyerek yanıtlanabiliyorsa, doğrudan inceleme yap.

</ne-yapılacak>

<destekleyici-bilgiler>

## Domain Farkındalığı

Codebase'i incelerken mevcut dokümantasyona bak:

### Dosya Yapısı

Rubion projelerinde tek context şöyle görünür:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-vertical-slice-default.md
│       └── 0002-postgres-primary-database.md
└── src/
```

Birden fazla bounded context varsa (mikroservis veya büyük monolith), `CONTEXT-MAP.md` kullanılır:

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                        ← sistem geneli kararlar
├── src/
│   ├── Sales/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/               ← Sales context kararları
│   └── Inventory/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Dosyaları lazy oluştur — yazmak için bir şey olduğunda oluştur. `CONTEXT.md` yoksa ilk terim netleştiğinde yarat; `docs/adr/` yoksa ilk ADR gerektiğinde yarat.

## Seans Boyunca

### Glossary'ye Karşı Sorgula

Kullanıcı `CONTEXT.md`'deki mevcut dille çelişen bir terim kullanırsa anında işaret et: "Glossary'niz 'iptal'i X olarak tanımlıyor, ama siz Y'yi kastediyorsunuz gibi — hangisi doğru?"

### Muğlak Dili Netleştir

Belirsiz ya da aşırı yüklü terimler kullandığında kesin bir kanonik terim öner: "Entity mi, Aggregate mi kastediyorsunuz? Bunların EF Core'daki davranışları farklı."

### Somut Senaryolar Kullan

Domain ilişkileri konuşulurken edge case'leri zorlayan somut senaryolar uydur; kavramlar arası sınırları netleştir.

### Kodu Karşılaştır

Kullanıcı bir şeyin nasıl çalıştığını açıkladığında kodun bunu doğrulayıp doğrulamadığını kontrol et. Çelişki varsa gündeme getir: "Kodunuz tüm Siparişi iptal ediyor, ama az önce kısmi iptalin mümkün olduğunu söylediniz — hangisi doğru?"

### CONTEXT.md'yi Yerinde Güncelle

Bir terim netleştiğinde `CONTEXT.md`'yi hemen güncelle; biriktirme. Aşağıdaki Rubion formatını kullan.

CONTEXT.md'yi implementasyon detaylarına bağlama — yalnızca domain uzmanlarının anlayacağı terimler girer.

### ADR Öner (Tutumlu Ol)

Yalnızca üçü de doğruysa ADR öner:

1. **Geri dönmesi zor** — fikir değişikliğinin maliyeti anlamlı
2. **Bağlam olmadan şaşırtıcı** — gelecekteki okuyucu "neden böyle yaptılar?" diye soracak
3. **Gerçek bir trade-off** — gerçek alternatifler vardı, belirli nedenlerle biri seçildi

Üçten biri eksikse ADR yok. Aşağıdaki formatı kullan.

</destekleyici-bilgiler>

---

## CONTEXT.md Formatı (Rubion Projeleri için)

```markdown
# CONTEXT.md

## Domain Terimleri
<!-- Yalnızca domain uzmanlarının konuştuğu terimler. Teknik detay değil. -->
- **[Terim]**: [Tek cümleyle tanım. Belirsizlik varsa neyin dışarıda kaldığını da yaz.]

Örnek:
- **Sevkiyat Planlaması**: Fabrikadan depo veya müşteriye giden malların zamanlama ve rota ataması. "Sipariş"i içermez — sipariş ayrı bir context.
- **Fason Üretim**: Rubion sisteminden üretim emri alan alt tedarikçi süreçleri. Tedarikçi portal entegrasyonunu kapsar.

## Bounded Context'ler / Modüller
<!-- Mikroservis sınırları veya monolith modülleri -->
- **Sales**: Müşteri teklifleri, sipariş yaratma, fiyatlandırma. Veritabanı: rubion_sales (PostgreSQL)
- **Inventory**: Stok hareketleri, depo konumları. Veritabanı: rubion_inventory (PostgreSQL)
- **Production**: Üretim emirleri, iş istasyonları. Mesajlaşma: RabbitMQ exchange `production.*`

## Teknik Kararlar (Özet)
- Auth: [Identity Server | Keycloak | Auth0 | ASP.NET Core Identity]
- Mesajlaşma: [RabbitMQ | Azure Service Bus | yok]
- Frontend state: TanStack Query + [Zustand | Redux Toolkit | yok]
- ORM: [EF Core (default) | Dapper (perf-critical paths)]

## ADR İndeksi
<!-- docs/adr/ altındaki kararların kısa listesi -->
- [ADR-001](docs/adr/0001-vertical-slice-default.md) — Vertical Slice Architecture neden default
- [ADR-002](docs/adr/0002-postgres-primary.md) — PostgreSQL primary, MSSQL yalnızca legacy
```

---

## ADR Formatı (Rubion Projeleri için)

```markdown
# ADR-NNN: [Başlık]

**Tarih:** YYYY-MM-DD
**Durum:** Kabul Edildi | Değiştirildi ([ADR-NNN](link)) | Reddedildi

## Bağlam

[Kararı zorunlu kılan durum. Hangi baskılar, kısıtlamalar, gereksinimler vardı?]

## Karar

[Ne yapıldı?]

## Gerekçe

[Neden bu seçenek? Rakip alternatifler ve onları eleme gerekçeleri.]

## Sonuçlar

[Bu kararın getirdiği trade-off'lar — iyi ve kötü.]
```
