---
name: setup-memory
description: Proje için LLM memory iskeleti kurar — `docs/memory/` altına 6 klasör + MOC.md + template'ler. Mevcut ADR'leri link'ler veya taşır. "memory kur", "wiki kur", "docs memory setup" denildiğinde. Sadece bir kez çalıştır.
stack: []
---

# Setup Memory — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

LLM memory için saf markdown + ilişkili linklere dayalı atomik not iskeleti oluşturur. Wiki sistemi `setup-rubion-skills` ile uyumlu — ADR ve domain pointer'ları korur, üstüne knowledge katmanı ekler.

> **İlişkili skill'ler:**
> - `memorize-module` — bu iskelete modül başına TL;DR doldurur
> - `review-memory` — iskelet dolduktan sonra bayatlık denetimi yapar

---

## Önce Keşfet (varsayma)

Mevcut yapıyı kontrol et:

- `docs/memory/` zaten var mı? Varsa **dur** — `setup-memory` daha önce çalıştırılmış.
- `docs/adr/` var mı? Kaç ADR? (içerik kararlar için kritik kaynak)
- `CONTEXT.md` veya `CONTEXT-MAP.md` var mı? (glossary için besleyici)
- `CLAUDE.md` var mı? (memory pointer'ı için)

Bulguları kullanıcıya 3-4 cümlede özetle.

---

## Sor (tek tek, hepsini bir anda dökme)

### Soru 1 — ADR yerleşimi

> "Mevcut ADR'leri `docs/adr/` altında bulduk (N adet). İki seçenek:"

- **A) Olduğu yerde bırak, link ver** — `docs/memory/30-decisions/README.md` üzerinden `../../adr/` linki. Eski referanslar bozulmaz.
- **B) Yeni klasöre taşı** — `docs/memory/30-decisions/` altına. Daha tutarlı yapı, ama mevcut ADR linklerini güncellemen gerekir.

Önerin: **A** (surgical changes — mevcut yapıyı bozma).

### Soru 2 — Glossary kaynağı

> "`CONTEXT.md` veya `CONTEXT-MAP.md` var mı, glossary'i oradan mı besleyelim?"

- **a)** CONTEXT.md varsa → terimleri `50-glossary/domain-terms.md`'ye kopyala (özet seviyesi)
- **b)** Yoksa → boş template, kullanıcı doldursun

### Soru 3 — Kapsam onayı

> "Aşağıdaki dosyaları oluşturacağım. Onaylıyor musun?"
> ```
> docs/memory/
> ├── CLAUDE.md                  (memory entry — proje CLAUDE.md'sine ek)
> ├── MOC.md                     (boş Map of Content)
> ├── 10-architecture/overview.md (template)
> ├── 20-modules/_template.md
> ├── 30-decisions/README.md     (ADR'lere pointer veya gerçek taşıma)
> ├── 40-runbooks/_template.md
> ├── 50-glossary/domain-terms.md
> └── 99-meta/conventions.md     (memory nasıl güncellenir)
> ```

---

## Yaz

### `docs/memory/CLAUDE.md` (memory entry point)

```markdown
# Project Memory

> Bu `docs/memory/` vault'u proje hakkındaki **knowledge** (modüller, kararlar,
> jargon, runbook) içerir. Her oturumda LLM ilk burayı yoklar.

## Önce şunları oku

1. [MOC.md](./MOC.md) — vault haritası
2. Çalıştığın modül varsa: `20-modules/<modul>.md`
3. Karar gerekçesi gerekirse: `30-decisions/`

## Yazma disiplini

- Sadece **koddan çıkarılamayacak** bilgiyi yaz (gerekçe, jargon, gotcha)
- Kod imzası yapıştırma — path referansı ver
- Kod değişirse ilgili `.md` aynı PR'da güncellenir
- Her dosyada `last_reviewed` tut

## Skill referansları

- Modül dokümantasyonu için: `memorize-module` skill'i
- Bayatlık denetimi için: `review-memory` skill'i
```

### `docs/memory/MOC.md` (Map of Content)

```markdown
# Map of Content

> Vault haritası. Yeni dosya eklendikçe ilgili bölüme link eklenir.

## Mimari
- (henüz yok — `10-architecture/overview.md` doldurulduğunda eklenecek)

## Modüller
- (henüz yok — `memorize-module` skill'iyle eklenir)

## Kararlar (ADR)
- (`30-decisions/` altında — README.md'ye bak)

## Runbook
- (henüz yok)

## Glossary
- [Domain Terms](./50-glossary/domain-terms.md)
```

### `docs/memory/20-modules/_template.md`

```markdown
---
id: <kebab-case-name>
type: module
status: active
last_reviewed: <YYYY-MM-DD>
owner: <handle>
related: []
tags: []
---

# <Modül Adı>

## TL;DR

- <Tek cümle: bu modül ne yapar>
- <Önemli convention 1>
- <Önemli convention 2>

## Detay

<Sadece koddan çıkarılamayacak şeyler — gerekçeler, gotcha'lar, "buraya dokunma çünkü...">

## Kod

- Frontend: `src/features/<x>/`
- Backend: `src/Application/<X>/`
- Test: `tests/<X>.Tests/`

## İlgili

- [ADR-XXX](../30-decisions/ADR-XXX-...md)
- [<Başka modül>](./<other>.md)
```

### `docs/memory/30-decisions/README.md` (ADR pointer)

Soru 1'in cevabına göre:

**A) Link veriyorsan:**

```markdown
# Architecture Decision Records

ADR'ler `docs/adr/` altında tutulur (mevcut yapı korunur).

| # | Başlık | Tarih |
|---|---|---|
| ... | ... | ... |
```

(Listeyi `docs/adr/`'i okuyup otomatik üret)

**B) Taşıyorsan:**

ADR dosyalarını `docs/memory/30-decisions/` altına `git mv` ile taşı. README'yi de aynı tabloyla doldur. Eski `docs/adr/` referans veren dosyaları **listele** kullanıcıya — manuel güncelleme gerekir.

### `docs/memory/50-glossary/domain-terms.md`

Soru 2'ye göre:

**a)** CONTEXT.md'den özet üret. Her terim için 1 satır + tanım.
**b)** Boş template:

```markdown
---
id: domain-terms
type: glossary
status: active
last_reviewed: <YYYY-MM-DD>
---

# Domain Terms

> İş jargonu, kısaltmalar, domain-specific terimler.

| Terim | Tanım |
|---|---|
| <Term> | <1 cümle> |
```

### `docs/memory/99-meta/conventions.md`

```markdown
# Memory Conventions

## Dosya pattern

- Her dosya YAML frontmatter ile başlar (id, type, status, last_reviewed, related, tags)
- TL;DR önce, detay sonra
- Relative link kullan (`[text](./path.md)`), wikilink yasak

## Bakım

- Kod değişikliği aynı PR'da memory güncellemesi içerir
- 60 günde bir `review-memory` skill'i ile bayatlık denetimi
- Broken link kontrolü için CI: `.github/workflows/check-links.yml`

## Yeni modül eklerken

`memorize-module` skill'ini kullan — kullanıcıya sorular sorar, doğrular, yazar.

## Yeni ADR eklerken

`30-decisions/ADR-XXX-<slug>.md` formatı. README.md tablosuna satır ekle.
```

### Proje `CLAUDE.md`'ye marker ekle (idempotent)

Eğer proje kökünde `CLAUDE.md` varsa, sonuna ekle (varsa zaten, atla):

```markdown
<!-- rubion:memory-pointer-start v1 -->
## Memory

Bu projenin knowledge'ı `docs/memory/` altındadır.
`docs/memory/CLAUDE.md`'yi ilk oku, sonra `MOC.md`'den ilgili dosyayı aç.
<!-- rubion:memory-pointer-end -->
```

---

## Bitir

Kullanıcıya:

1. Oluşan dosyaları **listele** (`ls docs/memory/` çıktısı)
2. **Sonraki adımı** söyle: "İlk modülü doc'lamak için `memorize-module` skill'ini çalıştır."
3. **Disiplin hatırlatması:** "Memory bayatlarsa zarar verir. Kod değişikliği aynı PR'da memory güncellemesi içermeli — `99-meta/conventions.md`'de yazılı."

---

## Yapma

- ✗ ADR'leri kullanıcıya sormadan taşıma (Surgical Changes)
- ✗ CONTEXT.md'yi glossary'ye **kopyala**ma — özet üret, çift kaynak çelişkisi olur
- ✗ Boş template'leri "doldurayım" demek — kullanıcı yokken doldurma (Think Before Coding)
- ✗ `docs/memory/` varken üzerine yazma — kullanıcıya sor, `.bak` al
