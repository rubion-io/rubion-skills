# Örnek: Bounded Context Grilling — Sales vs Inventory

Bu örnek, bir Rubion projesinde Sales ve Inventory arasındaki sınırı netleştirmek için yapılan bir grilling seansını gösterir.

## Başlangıç Durumu

Geliştirici şunu söylüyor: "Sipariş oluştururken stok kontrolü yapacağız."

`CONTEXT.md` henüz bu durumu tanımlamıyor. Grilling başlıyor.

---

## Seans Akışı

**Soru 1:** "Stok kontrolü" ile ne kastediyorsunuz — anlık stok sorgusu mu, rezervasyon mu, yoksa hard-lock mu?

> _Cevap: Sipariş oluşturulurken stok rezerve edilmeli, sipariş iptal olursa rezervasyon geri alınmalı._

**Soru 2:** Rezervasyon Sales context'inde mi yaşıyor, Inventory'de mi? Şu an kod bunu nerede yapıyor?

> _Cevap: Şu an Sales servisi doğrudan `inventory` tablosunu güncelliyor._

**Tespit:** Doğrudan tablo güncellemesi, servis sınırlarını ihlal ediyor. Sales, Inventory'nin internal state'ini mutate ediyor.

**Soru 3:** Bu rezervasyon mantığı başka context'lerden de tetikleniyor mu? Örneğin üretim emri oluşturulduğunda da stok rezerve ediliyor mu?

> _Cevap: Evet, Production da benzer şey yapıyor._

**Soru 4:** O zaman "Stok Rezervasyonu" bağımsız bir domain operasyonu gibi görünüyor. Bunu bir Inventory komutu (`ReserveStock`) olarak modelleyebilir miyiz, Sales ve Production'ın çağırdığı?

> _Cevap: Evet, bu daha temiz olur._

---

## Sonuç: CONTEXT.md Güncellemesi

```markdown
## Domain Terimleri

- **Stok Rezervasyonu**: Sipariş veya üretim emrine karşılık belirli miktarın geçici olarak kilitlenmesi.
  Serbest bırakma; sipariş iptali, üretim emri iptali veya sevkiyat tamamlanmasıyla tetiklenir.
  → Inventory context'in sorumluluğu. `ReserveStock` / `ReleaseReservation` komutları.

## Bounded Context'ler

- **Sales**: Sipariş yaratma, fiyatlandırma. Stok rezervasyonunu Inventory'ye **komut** göndererek yapar.
- **Inventory**: Stok hareketleri, rezervasyonlar. `rubion_inventory` veritabanı.
```

## ADR Teklifi

Bu seans şu ADR'yi tetikler:

> **ADR-003: Sales doğrudan inventory tablosunu güncellemez**
> - Hard to reverse: Şema paylaşımını kırmak büyük refactor
> - Surprising without context: Geliştiriciler Sales'in neden Inventory client'ı import ettiğini merak edecek
> - Real trade-off: Anlık tutarlılık kaybına karşılık loose coupling kazanımı
