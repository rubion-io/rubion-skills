# Örnek: `improve-codebase-architecture` Çıktısından ADR

**Senaryo:** Mimari analizden sonra "Aday 1: ItemCreatedEvent yarım kalmış" adayı ADR'ye dönüştürülecek.

---

## Önceki Konuşma Bağlamı

```
improve-codebase-architecture çıktısı (özet):

Aday 1 — ItemCreatedEvent yarım kalmış: Discovery ve Engagement
context'leri hâlâ Hangfire polling'e bağımlı.

Problem:
ADR-003 satır 71'de "ItemCreatedEvent → Trust + Discovery + Engagement"
yazılı. Bugün tek handler WantedMatchNotificationHandler. Discovery polling'le
öğreniyor.

Çözüm:
İki handler ekle: ElasticSearchIndexHandler + MilestoneCheckHandler.

Faydalar:
- ADR-003'le tutarsızlık kalkar
- ES yazımı 5dk lag yerine anlık
- Hangfire job sadece reconciliation görevi olur
```

**Kullanıcı:** "Aday 1'i ADR yap"

---

## Skill Akışı

### 1. Konum Tespiti

`docs/memory/30-decisions/` bulundu (Collecsi'de setup-memory çalıştırılmış).

### 2. Auto-Numbering

```bash
ls docs/memory/30-decisions/ADR-*.md
# ADR-001 ... ADR-008 → en yüksek 8 → yeni: ADR-009
```

### 3. Chain Modu — Adaydan Doldur

| Soru | Aday içeriğinden | Onay |
|------|------------------|------|
| Başlık | "ItemCreatedEvent handler stratejisi" | ✓ |
| Bağlam | Aday "Problem:" bölümü | ✓ |
| Karar | "İki handler ekle (ElasticSearch + Milestone), Hangfire reconciliation'a indirilir" | ✓ |
| Sonuçlar (Olumlu) | "Faydalar:" maddeleri | ✓ |
| **Alternatifler** | **Eksik** — kullanıcıya sor | ⚠️ |

**Skill:** "Bu kararın alternatifleri neydi? Aday içinde belirtilmemiş."

**Kullanıcı:** "Üç alternatif: (1) Hangfire'a devam, kabul lag, (2) yeni mesaj kuyruğu (RabbitMQ topic), (3) MediatR INotification handler'lar. (3) seçildi."

### 4. Çelişki Kontrolü

Mevcut ADR'leri tara: **ADR-003** (Domain Event Strategy) bulundu — `ItemCreatedEvent`'i tanımlıyor.

**Skill:**
> "⚠️ ADR-003 'Domain Event Strategy' var. Bu ADR onu nasıl ilişkilendirir?
>   a) Tamamlayıcı — ADR-003'ün implementasyonu
>   b) Süperseder — stratejiyi değiştiriyor
>   c) Bağımsız"

**Kullanıcı:** "(a) tamamlayıcı"

→ Yeni ADR'nin frontmatter'ında `related: [ADR-003]`, "İlgili" bölümünde link.

### 5. Yazılan Dosya

`docs/memory/30-decisions/ADR-009-itemcreated-event-handlers.md`:

```markdown
---
id: ADR-009
type: decision
status: proposed
date: 2026-05-19
deciders: [murat]
related: [ADR-003]
tags: [event-driven, integration]
---

# ADR-009: ItemCreatedEvent Handler Stratejisi

## Bağlam

ADR-003 `ItemCreatedEvent`'i Trust + Discovery + Engagement context'lerini
besleyen domain event olarak tanımladı. Bugün sadece Trust context'inde tek
handler (WantedMatchNotificationHandler) çalışıyor. Discovery `sp_get_items_for_indexing`
Hangfire polling'iyle 5dk gecikmeyle ES'e yazıyor. Engagement context'inde
milestone handler hiç yok. ADR-003'ün vaatlerinin %70'i tutulmamış.

## Karar

`ItemCreatedEvent`'e iki yeni `INotificationHandler` ekle:
- **ElasticSearchIndexHandler** (Discovery context) — anlık ES write
- **MilestoneCheckHandler** (Engagement context) — kullanıcı milestone kontrolü

Hangfire polling job'ını reconciliation görevi'ne indir (saatlik, fallback).

## Gerekçe

- ADR-003'ün belirttiği event-driven mimari tamamlanır
- ES yazımı 5dk lag yerine <1s anlık olur
- Hangfire bağımlılığı tek noktada kalır, mantık handler'lara taşınır

## Alternatifler

### A) Hangfire polling'e devam, lag kabul

5dk gecikme kullanıcı deneyiminde "yeni eklediğim item'ı feed'de göremiyorum"
şeklinde geri bildirim üretiyor. Reddedildi.

### B) Yeni mesaj kuyruğu (RabbitMQ topic)

Mevcut MediatR + in-process publisher yeterli. Cross-process bus eklemek
operasyonel maliyet (RabbitMQ cluster, dead-letter, retry) ekliyor.
Reddedildi — bugünkü yük için overkill.

### C) MediatR `INotification` handler'lar (seçildi)

In-process, mevcut altyapıyla tutarlı, test edilebilir.

## Sonuçlar

### Olumlu

- ADR-003 tutarsızlığı kalkar (silme testi geçer)
- Feed'de yeni item için <1s görünürlük
- Hangfire job basitleşir

### Olumsuz

- ES çağrısı handler'da senkron — exception olursa transaction'ı etkiler
  → mitigation: `IPublisher` ile fire-and-forget veya outbox pattern (ADR-010 olabilir)
- Milestone hesabı sırasında DB sorgusu artışı (her ItemCreatedEvent'te +1 query)

## İlgili

- [ADR-003: Domain Event Strategy](./ADR-003-domain-events.md)
- Etkilenen modüller:
  - `../20-modules/discovery.md` (ES index handler eklendi)
  - `../20-modules/engagement.md` (milestone handler eklendi)
```

### 6. Index Güncellemeleri

`docs/memory/30-decisions/README.md` tablosuna satır:
```
| ADR-009 | ItemCreatedEvent Handler Stratejisi | 2026-05-19 | proposed |
```

`docs/memory/MOC.md` Kararlar bölümüne link.

### 7. Skill'in Son Mesajı

> "ADR-009 yazıldı (`proposed`).
>
> Sonraki adım — implementasyon: `scaffold-vsa-feature` + `tdd-dotnet` ile iki handler'ı yaz.
> Test'ler yeşil olduğunda ADR-009 status'ünü `accepted` yap.
>
> Discovery ve Engagement modüllerinin `20-modules/*.md` dosyalarına ADR-009 referansı ekle (`memorize-module` ile yeniden çalıştırabilirsin)."

---

## Faydası

**Skill olmasaydı:**
- Kullanıcı 8 ADR'yi tek tek tarayıp en yüksek numarayı bulurdu
- Şablonu manuel kopyalardı
- Cross-check yapmazdı, ADR-003 ile ilişkiyi atlardı
- 15-20 dakika iş

**Skill ile:**
- Auto-numbering, çelişki kontrolü, MOC güncelleme otomatik
- "Aday 1'i ADR yap" → 3 dakika
- 4 sorudan 3'ü zaten chain'den dolduruldu, sadece alternatifler soruldu
