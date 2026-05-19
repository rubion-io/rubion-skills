---
name: memorize-module
description: Belirtilen modülün TL;DR'ını üretir — kullanıcıya 5 soru sorar, 3-5 dosya okuyup doğrular, `docs/memory/20-modules/<modul>.md` yazar, MOC.md'yi günceller. "Profile modülünü memorize et", "auth dokumantasyonu" denildiğinde.
stack: []
---

# Memorize Module — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Tek bir modülün **knowledge memory**'sini üretir. Otonom analiz değil — kullanıcı doğrulamasıyla. Karpathy 1. prensibi: "Don't assume, ask."

> **Ön koşul:** `setup-memory` çalıştırılmış (`docs/memory/` ve `MOC.md` var).
>
> **Tek seferde tek modül.** Tüm projeyi memorize etmek için bu skill'i tekrar tekrar çalıştır — bu **bilinçli** bir tasarım: token tasarrufu + doğruluk artışı.

---

## Süreç

### 1. Modül adını ve kapsamı belirle

Kullanıcının prompt'undan modül adı çıkar (örn: "Profile modülünü memorize et" → `profile`).

Belirsizse sor:
- "Modülün dosya yolu nedir?" (örn: `src/features/profile/`)
- "Modül kebab-case adı?" (dosya: `profile.md`)

Kontrol et: `docs/memory/20-modules/<modul>.md` zaten var mı?
- **Varsa:** "Mevcut dokümanı güncelleyelim mi yoksa baştan mı yazalım?" diye sor.
- **Yoksa:** Yeni yaz.

### 2. Kullanıcıya 5 Soru Sor (Karpathy 1: Think Before Coding)

Soruları **tek tek** sor, hepsini bir anda dökme. Kullanıcı her cevabı yazsın.

> **Soru 1:** Bu modül **ne yapar**? Tek cümle.
>
> Örnek: "User profile sayfası — kullanıcının bilgilerini görüntüler ve düzenler."

> **Soru 2:** En **kritik 2-3 convention** ne? (validation lib, state lib, naming kuralı, vb.)
>
> Örnek: "Validation Zod ile (frontend) + FluentValidation ile (backend). State Zustand."

> **Soru 3:** **"Buraya dokunma çünkü..."** notları? Sakıncalı yerler, legacy ilişkiler?
>
> Örnek: "ProfileService.cs'te 3. fonksiyon Hangfire job'a bağlı — değişirse polling kırılır."

> **Soru 4:** Hangi **ADR/karar** bu modülü etkiliyor?
>
> Örnek: "ADR-007 (validation strategy), ADR-003 (event-driven)."

> **Soru 5:** **Hangi başka modüllere** bağımlı veya hangileri ona bağımlı?
>
> Örnek: "Auth'a bağımlı (kullanıcı kimliği için), Notification onu dinliyor (profil değişince mail)."

Kullanıcı "bilmiyorum" derse: **boş bırak, varsayma**. Doc bayatlamış-yanlış'tan daha iyi.

### 3. Doğrula (Karpathy 4: Goal-Driven Execution)

Kullanıcının söylediklerini koddan teyit et:

**a)** Modülün ana 3-5 dosyasını oku:
- Handler veya Service (`src/.../*Handler.cs` veya `*Service.cs`)
- Validator (`src/.../*Validator.cs` veya `*.schema.ts`)
- Endpoint veya Component (`*Endpoint.cs` veya `*.tsx`)

**b)** Kullanıcının iddialarını kontrol et:
- "Validation Zod ile" demişse — gerçekten `import z from "zod"` görüyor musun?
- "ADR-007 etkiliyor" demişse — ADR-007 gerçekten validation hakkında mı?

**c)** Tutarsızlık varsa **kullanıcıya geri sor**:

> "Sen 'Validation Zod ile' dedin ama `ProfileForm.tsx`'te `react-hook-form` kullanıyor görüyorum. Zod resolver'ı mı, yoksa farklı bir yaklaşım mı?"

Asla sessizce düzelt. Kullanıcının modeli + kodun gerçeği uyuşmalı.

### 4. Yaz (Karpathy 2: Simplicity First)

**Sadece kullanıcının söylediği + doğruladığın bilgi.** Yorum ekleme, "muhtemelen" yazma.

`docs/memory/20-modules/<modul>.md`:

```markdown
---
id: <modul-slug>
type: module
status: active
last_reviewed: <bugünün tarihi YYYY-MM-DD>
owner: <kullanıcının handle'ı — sor>
related:
  - ../30-decisions/ADR-XXX.md      # Soru 4'ten
  - ./<dependent-module>.md          # Soru 5'ten
tags: [<modülün kategorisi>]
---

# <Modül Başlık>

## TL;DR

- <Soru 1'den: ne yapar>
- <Soru 2'den: convention 1>
- <Soru 2'den: convention 2>

## Buraya Dokunma

<Soru 3'ten>

## Kod

- Frontend: `<path>`
- Backend: `<path>`
- Test: `<path>`

## İlişkiler

**Bağımlı olduğu:** <Soru 5'ten>
**Onu kullanan:** <Soru 5'ten>

## İlgili Kararlar

<Soru 4'ten — her ADR için 1 satır link>
```

### 5. MOC.md'yi Güncelle

`docs/memory/MOC.md`'de **Modüller** bölümüne satır ekle (mevcut sıralamayı koru):

```markdown
- [<Modül Başlık>](./20-modules/<modul-slug>.md) — <TL;DR ilk satırı>
```

### 6. Bitir

Kullanıcıya:

1. **Yazılan dosyayı** göster (`docs/memory/20-modules/<modul-slug>.md`)
2. **Eksik kalan** alanları listele (kullanıcı "bilmiyorum" dediyse)
3. **Sonraki adım:** "Bu modülün ilk doc'u. Modülü her dokunuşunda 5 dakikalık güncelleme yap. 60 gün sonra `review-memory` skill'i sana hatırlatır."

---

## Örnek Akış

**Kullanıcı:** "Auth modülünü memorize et"

**Skill:**
1. `docs/memory/20-modules/auth.md` yok → yeni yazılacak.
2. Soru 1 → "JWT tabanlı kimlik doğrulama"
3. Soru 2 → "15dk access + 7gün refresh, Redis'te session"
4. Soru 3 → "TokenService.cs'te rotation logic — değişirse refresh kırılır"
5. Soru 4 → "ADR-003 (JWT vs Session)"
6. Soru 5 → "User module bağımlı; Billing onu kullanıyor"
7. Doğrulama: `AuthService.cs` + `TokenService.cs` + ADR-003 okur → tutarlı.
8. `auth.md` yazar, MOC.md'ye satır ekler.

---

## Yapma

- ✗ Kullanıcı yokken 5 soruyu **kendi tahminlerinle** doldurmak (Karpathy 1 ihlali)
- ✗ Doğrulama yapmadan yazmak (Karpathy 4 ihlali)
- ✗ "Muhtemelen şöyledir" yazmak — emin değilsen boş bırak
- ✗ Tek seansta 5+ modül memorize etmeye kalkışmak — yorulur, kalite düşer
- ✗ Mevcut modül dosyasını sormadan üzerine yazmak
- ✗ ADR linki kontrolsüz koymak — gerçekten o ADR mı modülü etkiliyor?
