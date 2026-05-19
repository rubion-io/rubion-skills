---
name: scaffold-adr
description: Yeni ADR yazar — otomatik numaralandırır, standart şablonu doldurur (Bağlam/Karar/Gerekçe/Alternatifler/Sonuçlar), mevcut ADR'lerle çelişki kontrolü yapar, MOC.md'yi günceller. "ADR yaz", "karar dokümante et" denildiğinde.
stack: []
---

# Scaffold ADR — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Architecture Decision Record (ADR) yazımını otomatize eder — numaralandırma, çelişki kontrolü, format tutarlılığı, MOC entegrasyonu.

> **Sık zincirlenen skill:** `improve-codebase-architecture` çıktısındaki adayları doğrudan ADR'ye dönüştürebilir. "Aday 1'i ADR yap" denilince bu skill devreye girer.

---

## Konum Tespiti (önce keşfet)

ADR'lerin nerede tutulduğunu bul. İki olası konum:

- `docs/adr/` (legacy, `setup-memory` öncesi)
- `docs/memory/30-decisions/` (`setup-memory` sonrası)

İkisi de varsa: kullanıcıya sor "Yeni ADR'yi hangisine yazalım?" Default: hangisi daha yeni dosya içeriyorsa.

Hiçbiri yoksa: önce `docs/adr/` oluştur, sonra yaz. `setup-memory` çalıştırılması önerilebilir ama bu skill için zorunlu değil.

---

## Süreç

### 1. Bağlam ve Karar Bilgisini Topla (Karpathy 1: Think Before Coding)

Kullanıcıya **tek tek** 4 soru sor:

> **Soru 1:** **Karar başlığı** nedir? (kısa, eylem-yönlendirmeli)
> Örnek: "PostgreSQL'i primary DB olarak kullan"

> **Soru 2:** **Bağlam** ne? Bu kararın gerekliliğini doğuran durum 2-3 cümlede.
> Örnek: "Mikroservis stack'i kurarken DB seçimi gerekti. Mevcut .NET ekibi MSSQL deneyimli ama lisans maliyeti var..."

> **Soru 3:** **Hangi alternatifleri** değerlendirdin? En az 2-3 alternatif yaz.
> Örnek: "MSSQL, MySQL, MongoDB."

> **Soru 4:** **Karar ne yönde**? Tek cümle + 2-3 gerekçe maddesi.
> Örnek: "PostgreSQL. Açık kaynak, JSONB için güçlü, partition desteği iyi."

İsteğe bağlı **Soru 5:** Bu kararın **sonuçları** (trade-off'lar) ne? Yan etkiler, kısıtlar.
> Örnek: "DB tarafı ekipte deneyim açığı var, ilk 6 ay daha yavaş ilerleyebilir. Lisans yok."

Eğer `improve-codebase-architecture` çıktısı **aday** olarak veriliyorsa (chain modu), bu 4-5 soruyu otomatik olarak çıktıdan **doldur** ama kullanıcıdan onay al.

---

### 2. Numaralandır

Mevcut ADR'leri tara:

```bash
ls docs/adr/ADR-*.md 2>/dev/null
ls docs/memory/30-decisions/ADR-*.md 2>/dev/null
```

En yüksek numarayı bul → **+1**. Yeni dosya adı:

```
ADR-<NNN>-<kebab-case-slug>.md
```

Slug, başlıktan türetilir (Türkçe karakterler ASCII'ye normalize):
- "PostgreSQL'i primary DB olarak kullan" → `postgresql-primary`
- "MassTransit + RabbitMQ" → `masstransit-rabbitmq`

---

### 3. Çelişki Kontrolü (Karpathy 4: Goal-Driven)

**Bu kritik adım.** Yeni ADR mevcut bir ADR ile çelişiyor olabilir.

Mevcut ADR'lerin başlık + Karar bölümünü oku. Anahtar kelime karşılaştırması yap:

- Yeni ADR'nin başlığındaki/Kararındaki ana kavramları çıkar (örn: "PostgreSQL", "ORM", "auth")
- Mevcut ADR'lerde aynı kavramları ara

Eşleşme varsa kullanıcıya sor:

> "⚠️ Tespit: ADR-007 'EF Core as default ORM' var. Senin yazdığın 'Dapper for hot paths' onunla ilişkili görünüyor."
>
> Üç ihtimal:
>   **a) Tamamlayıcı** — ADR-007'nin escape hatch'i olarak yazılıyor. Yeni ADR'ye "Bkz. ADR-007" referansı ekle.
>   **b) Süperseder** — ADR-007'yi geçersiz kılıyor. ADR-007'nin status'unu `superseded by ADR-NNN` yap.
>   **c) Bağımsız** — eşleşme yanıltıcı, ilgisiz.
>
> Hangisi?

Kullanıcı seçince ona göre işle (b durumunda iki dosya güncellenir).

---

### 4. ADR'yi Yaz

```markdown
---
id: ADR-<NNN>
type: decision
status: proposed
date: <YYYY-MM-DD>
deciders: [<handle>]
supersedes: <önceki ADR varsa, yoksa null>
related: [<ilgili ADR ID'leri>]
tags: [<konuya göre>]
---

# ADR-<NNN>: <Başlık>

## Bağlam

<Soru 2'den — durumu betimle, neden karar gerekti>

## Karar

<Soru 4'ten — net, eylem-yönlendirmeli, tek cümle>

## Gerekçe

- <Madde 1>
- <Madde 2>
- <Madde 3>

## Alternatifler

<Soru 3'ten — her alternatif için neden reddedildi>

### <Alternatif A>

<Neden seçilmedi, kısa>

### <Alternatif B>

<Neden seçilmedi, kısa>

## Sonuçlar

<Soru 5'ten — bu kararın getireceği yan etkiler, kısıtlar, take-on'lar>

### Olumlu

- <Kazanç 1>
- <Kazanç 2>

### Olumsuz

- <Maliyet 1>
- <Maliyet 2>

## İlgili

- <Diğer ADR'lere link (Cross-check'ten gelen)>
- <Etkilenen modüller — memory varsa: ../20-modules/x.md>
```

---

### 5. Index'leri Güncelle

**a)** `docs/memory/30-decisions/README.md` (varsa) — tabloya satır ekle:

```markdown
| ADR-009 | PostgreSQL Primary | 2026-05-19 | proposed |
```

**b)** `docs/memory/MOC.md` (varsa) — "Kararlar" bölümüne link:

```markdown
- [ADR-009: PostgreSQL Primary](./30-decisions/ADR-009-postgresql-primary.md)
```

**c)** Supersede senaryosunda: eski ADR'nin frontmatter'ında `status: superseded` ve `superseded_by: ADR-NNN` ekle.

---

### 6. Bitir

Kullanıcıya:

1. **Yazılan dosya yolu** + git komutu öner:
   ```bash
   git add docs/adr/ADR-009-postgresql-primary.md
   git commit -m "docs(adr): add ADR-009 PostgreSQL primary"
   ```

2. **Status workflow** hatırlatması:
   - Şu an `proposed` — takım kararı veya senin onayın bekleniyor
   - Onaylanınca: frontmatter'da `status: accepted`
   - Daha sonra geçersiz olunca: yeni ADR yaz, eskinin status'unu `superseded by ADR-XXX` yap

3. **İlişkili modülleri güncelle:** Eğer bu karar mevcut bir modülü etkiliyorsa, `20-modules/<modul>.md` dosyasının `related` frontmatter'ına bu ADR'yi ekle.

---

## `improve-codebase-architecture` Chain Modu

Kullanıcı "Aday 1'i ADR yap" derse:

1. **Önceki konuşma bağlamından** Aday 1'in içeriğini al
2. Adayın 4 bölümünü ADR'nin 4 sorusuna **map et**:
   - Aday başlığı → Soru 1 (Karar başlığı)
   - "Problem:" → Soru 2 (Bağlam)
   - "Çözüm:" → Soru 4 (Karar)
   - "Faydalar:" → Soru 5 (Sonuçlar > Olumlu)
3. **Alternatifler eksik** — kullanıcıya sor: "Bu kararın alternatifleri ne idi? `improve-codebase-architecture` çıktısında belirtilmemiş."
4. Olağan akışa devam et.

---

## Yapma

- ✗ ADR'yi kullanıcıya 4 soruyu sormadan kendi tahminlerinle yazmak (Karpathy 1 ihlali)
- ✗ Numaralandırmayı kontrolsüz yapmak — `ls`'le doğrula, üzerine yazma riski
- ✗ Çelişki kontrolünü atlamak — bayatlamış ADR'lerle dolu kütüphane = LLM yanlış karar
- ✗ Eski ADR'nin status'unu sormadan değiştirmek — supersede kararı **kullanıcının**
- ✗ "Alternatifler" bölümünü boş bırakmak — alternatif yoksa ADR de yok demektir
- ✗ Karar verilmemiş bir konuyu `status: accepted` yazmak — default daima `proposed`
- ✗ Aynı oturumda 3+ ADR yazmaya kalkışmak — kalite düşer, her ADR ayrı düşünme gerektirir
