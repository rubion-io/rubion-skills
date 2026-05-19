---
name: review-memory
description: Memory vault'unu denetler — bayatlamış dosyalar (last_reviewed 60+ gün), broken link'ler, son 30 günde değişen ama doc'u eski olan modüller. "memory bayat mı", "wiki review", "memory denetle" denildiğinde.
stack: []
---

# Review Memory — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Memory vault'unun **sağlığını denetler**. Otomatik düzeltme yapmaz — rapor üretir, kullanıcı önceliklendirir. Bayat memory yanlış memory'den daha tehlikelidir; bu skill bayatlığı görünür kılar.

> **Ön koşul:** `docs/memory/` mevcut ve en az bir modül `memorize-module` ile yazılmış olmalı.

---

## Süreç

### 1. Bayatlık Denetimi

`docs/memory/` altındaki **her `.md` dosyasının** frontmatter'ından `last_reviewed` tarihini oku.

Üç eşik:

| Yaş | Etiket | Aksiyon |
|---|---|---|
| 0-60 gün | ✅ Taze | Aksiyon yok |
| 60-120 gün | ⚠️ Bayat | Listele, gözden geçirme öner |
| 120+ gün | 🔴 Çok bayat | Acil — modül silinmiş veya değişmiş olabilir |

Frontmatter yoksa veya `last_reviewed` field'ı yoksa → **🔴 metadata eksik** olarak işaretle.

**Komut örneği (referans, bash'te):**

```bash
find docs/memory -name "*.md" -exec sh -c '
  date=$(grep -m1 "last_reviewed:" "$1" | sed "s/.*: *//")
  echo "$date  $1"
' _ {} \; | sort
```

### 2. Broken Link Kontrolü

Her `.md` dosyasındaki relative link'leri çıkar (`[text](./path.md)` veya `[text](../path.md)`).

Her link için:
- Hedef dosya var mı? Yoksa → 🔴 **broken**
- Hedef bir anchor mu? (`#section`) → mevcut dosyada o heading var mı?

**Lychee komutu önerisi** (CI'da otomatik):

```bash
lychee --no-progress 'docs/memory/**/*.md'
```

### 3. Git Log Cross-Check (en güçlü sinyal)

Bu en kritik kısım: **kod değişti ama doc güncellenmedi mi?**

Her `20-modules/<modul>.md` için:

**a)** `frontmatter.related` veya **Kod** bölümündeki path'leri al (örn: `src/features/profile/`).

**b)** Git'te bu path'lerde **son 30 günde** değişiklik olmuş mu?

```bash
git log --since="30 days ago" --oneline -- src/features/profile/
```

**c)** Kod değişikliği var ama `last_reviewed > 30 gün önce` → 🔴 **stale-but-active**

Bu en zarar verici durum: doküman güncel görünüyor (last_reviewed yakın olsa da yetmez), ama kod altında değişmiş, doc gerçeği yansıtmıyor.

### 4. Eksik Kapsam Denetimi

Vault'taki modül sayısı + kod tabanındaki gerçek modül klasörü sayısını karşılaştır.

```bash
# Frontend modüllerinin tahmini
ls -d src/features/*/ 2>/dev/null | wc -l

# Backend slice'larının tahmini
find src -type d -name "Handlers" -o -name "Slices" 2>/dev/null | wc -l

# Memory'de doc'lu modül sayısı
ls docs/memory/20-modules/*.md 2>/dev/null | grep -v "_template" | wc -l
```

%50'den az coverage varsa → kullanıcıya rapor et:

> "35 frontend modülü tespit ettim, sadece 8'i memory'de doc'lu. `memorize-module` ile en sık dokunduklarını dolduralım mı?"

### 5. Rapor

Çıktı **kategorize edilmiş tablo** halinde. Otomatik silme/düzeltme **yapma**.

```markdown
# Memory Review — <bugünün tarihi>

## 🔴 Acil (içerik kırık veya çok bayat)

| Dosya | Sorun | Öneri |
|---|---|---|
| `20-modules/billing.md` | last_reviewed: 8 ay önce, kod son 30 günde değişmiş (12 commit) | `memorize-module billing` ile güncelle |
| `20-modules/legacy-order.md` | Referans verdiği `src/features/order/` artık yok | Modül silinmiş olabilir — bu dosyayı arşivle veya sil |
| `30-decisions/ADR-005.md` | Frontmatter yok | Frontmatter ekle |

## ⚠️ Bayat (60-120 gün)

| Dosya | Yaş | Aksiyon |
|---|---|---|
| `20-modules/auth.md` | 78 gün | Hızlı gözden geçirme |
| `50-glossary/domain-terms.md` | 95 gün | Yeni terim girişi var mı kontrol |

## 🔗 Broken Link

| Dosya | Link | Hedef |
|---|---|---|
| `20-modules/profile.md:42` | `../30-decisions/ADR-007.md` | dosya yok |

## 📊 Coverage

- Frontend modülleri: 35 toplam, 8 doc'lu (**%23**)
- Backend slice'ları: 68 toplam, 12 doc'lu (**%18**)

**En çok dokunulan ama doc'suz** (git log son 90 gün, top 5):
1. `src/features/notifications/` (47 commit)
2. `src/Application/Items/` (38 commit)
3. ...

## Önerilen Sıralama

1. 🔴 önce — `billing.md`'yi `memorize-module` ile yeniden yaz
2. 🔴 sonra — `legacy-order.md`'yi sil veya `99-meta/archive/` altına taşı
3. 🔗 broken link'leri elle düzelt
4. ⚠️ bayat olanları gözden geçir
5. 📊 coverage'ı artırmak istersen — `memorize-module notifications`
```

---

## Yapma

- ✗ **Otomatik silme** — kullanıcı görmeden bir şeyi silme
- ✗ **last_reviewed'i kendin güncelleme** — bu davranış memory'yi sahte güncel gösterir, en tehlikeli anti-pattern
- ✗ **"Bayat ama içerik doğru olabilir" diye atlamak** — yaş tek başına yetersiz, git log cross-check kritik
- ✗ **Rapor üretirken modülün kendi içeriğini değiştirmek** (Surgical Changes)
- ✗ Coverage'ı %100'e çıkarmaya çalışmak — değer düşük modüller doc'suz kalabilir

---

## Tetikleyici Önerisi

Bu skill'i şu durumlarda çalıştırın:

- **Aylık ritim:** her ayın 1'inde tek seferlik denetim
- **PR pre-merge:** büyük feature merge'inden önce ilgili modüllerin doc'u güncel mi
- **Yeni geliştirici geldiğinde:** doc kalitesini değerlendirmek için
