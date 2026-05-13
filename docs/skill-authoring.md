# Skill Yazma Rehberi

Bu belge, `rubion-skills` repo'suna yeni bir skill ekleme veya mevcut skill'i güncelleme sürecini açıklar.

---

## Skill Nedir?

Bir skill, Claude'a belirli bir görevi nasıl yapacağını öğreten yapılandırılmış bir prompt dosyasıdır. Skill'i çağıran kişi Claude'a "bu skill'i çalıştır" der; Claude skill içeriğini okuyarak o rolü oynar.

İyi bir skill:
- **Odaklı:** Tek bir görevi yapar, çok şey yapmaya çalışmaz
- **Somut:** Abstract tavsiyeler değil, çalışır kod örnekleri ve komutlar içerir
- **Rubion-özgün:** Genel değil; stack'imize, sözlüğümüze ve kararlarımıza göre uyarlanmış
- **Test edilmiş:** En az bir gerçek senaryo ile denenmiş

---

## Skill Türleri

| Tür | Klasör | Ne zaman? |
|---|---|---|
| Upstream adaptasyonu | `adapted/` | mattpocock/skills'de bir karşılığı var, Rubion'a uyarlanıyor |
| Rubion özgünü | `skills/` | Upstream'de karşılığı yok, sıfırdan yazılıyor |

---

## Klasör Yapısı

```
adapted/<skill-adı>/
├── SKILL.md         ← zorunlu
├── ADAPTATION.md    ← sadece adapted/ için, upstream'den ne değişti
└── examples/        ← opsiyonel ama önerilen

skills/<skill-adı>/
├── SKILL.md         ← zorunlu
└── examples/        ← opsiyonel ama önerilen
```

Naming kuralları:
- lowercase, kebab-case: `tdd-dotnet`, `scaffold-vsa-feature`
- Stack suffix: `-dotnet`, `-react`, `-react-native` (generic skill'lerde yok)

---

## `SKILL.md` Header (YAML frontmatter)

Her `SKILL.md` şu frontmatter ile başlar:

```yaml
---
name: <skill-adı>
description: <Claude'un skill'i ne zaman kullanacağını açıklayan tek cümle. "X denildiğinde kullan." ile bitmeli.>
adapted_from: mattpocock/skills/...   # sadece adapted/ için
upstream_commit: <SHA>                # sadece adapted/ için
last_reviewed: YYYY-MM-DD
adaptation_level: light|medium|heavy  # sadece adapted/ için
stack: [dotnet, csharp, react, ...]   # boş liste geçerli
---
```

**`description` kritik:** Claude hangi skill'i tetikleyeceğine description'a bakarak karar verir. Açık, anahtar-kelime zengin yaz.

---

## Prompt Yazım İlkeleri

### 1. Ne → Neden → Nasıl

```markdown
## Ne Yapar?
[1-2 cümle]

## Neden?
[Problem ve motivasyon]

## Nasıl?
[Adımlar, komutlar, kod]
```

### 2. Soru-Sor Deseni

Skill, kullanıcıya ne üretileceğini anlamak için sorular sormalı. Varsayım yaparken açıkça belirt.

```markdown
## Önce Sor
1. [Zorunlu bilgi]
2. [Zorunlu bilgi]
3. [Opsiyonel — varsayılan: X]
```

### 3. Somut Örnek Zorunlu

Her skill'de en az bir "bu girdide bu çıktı çıkar" örneği olmalı:
- `SKILL.md` içinde mini örnek
- `examples/` klasöründe detaylı senaryo

### 4. Anti-Pattern Listesi

Kullanıcının yaygın yanlışlarını açıkça yaz:

```markdown
## Yapma

- ✗ [Yanlış yaklaşım] — [neden yanlış]
- ✗ [Yanlış yaklaşım] — [neden yanlış]
```

### 5. Kontrol Listesi

Her skill bir `## Kontrol Listesi` bölümü ile bitirmeli:

```markdown
## Kontrol Listesi
[ ] ...
[ ] ...
```

---

## Test Etme

Skill commit'lenmeden önce:

1. Gerçek bir projede "bu skill'i çalıştır" ile tetikle
2. Çıktı beklenen mi? Kod compile oluyor mu?
3. Örnekler gerçek Rubion stack'iyle uyumlu mu?

Smoke test projesi: `rubion-skills-test/` (ayrı repo, bağlantı bkz. `README.md`).

---

## Güncelleme

Mevcut bir skill güncellenirken:

1. `last_reviewed` tarihini güncelle
2. `CHANGELOG.md`'ye değişikliği ekle
3. Adapted skill ise `ADAPTATION.md`'ye ne değiştiğini yaz

---

## Sil veya Devre Dışı Bırak

Bir skill artık kullanılmıyorsa:
- Dosyayı silme — `SKILL.md` başına `status: deprecated` frontmatter ekle
- `CHANGELOG.md`'ye neden deprecated olduğunu yaz
