---
name: setup-rubion-skills
description: Wizard — projeyi keşfeder ve kişiselleştirilmiş skill yol haritası önerir. Önce foundation (issue tracker, baseline, hooks), sonra zero/legacy × stack matrisinde sıradaki skill'i önerir. "rubion init", "skill setup", "wizard başlat" denildiğinde. İlk kez veya re-entry — idempotent.
stack: []
---

# Setup Rubion Skills — Wizard

Bu skill **wizard** gibi çalışır: 4 faz, her fazda kullanıcıya tek tek sorular sorar, cevaplara göre sıradaki skill'i önerir. Otomatik skill çalıştırmaz — sadece **yönlendirir**.

> **Karpathy uyumu:** Don't assume, ask. Her faz sonunda kullanıcı onayı zorunlu. Skill chain'i kullanıcının elinde.

> **İdempotent.** Bir hafta sonra tekrar çalıştırıldığında filesystem'i okur, nerede kaldığını bulur, doğru adımdan devam eder.

---

## Faz A — Foundation (her zaman)

Bu fazda 3 şey kurulur: issue tracker, baseline, hooks.

### A.1 Keşfet

Mevcut durumu kontrol et (varsa oku, yoksa varsayma):

```bash
git remote -v                              # GitHub mu?
ls CLAUDE.md AGENTS.md                     # entry point var mı?
ls CONTEXT.md CONTEXT-MAP.md               # domain doc var mı?
ls docs/adr/ docs/agents/                  # daha önce kurulmuş mu?
ls .claude/settings.json                   # hook'lar kurulmuş mu?
```

Bulguları kullanıcıya 3-4 cümlede özetle.

### A.2 Soru 1 — Issue Tracker

> Açıklama: `to-prd`, `to-issues`, `diagnose-dotnet` gibi skill'ler buradan okur ve buraya yazar.

İki seçenek:
- **GitHub** (`gh` CLI ile, açık kaynak/in-house projeler için varsayılan)
- **Jira** (REST API + token, müşteri/enterprise projeler için)

`git remote -v` GitHub gösteriyorsa **GitHub** öner.

### A.3 Soru 2 — Domain Doc Yerleşimi

> Açıklama: Domain dilini ve geçmiş kararları nerede tutuyoruz?

- **Single-context** — `CONTEXT.md` + `docs/adr/` repo kökünde (çoğu Rubion projesi)
- **Multi-context** — `CONTEXT-MAP.md` + her modülün kendi `CONTEXT.md`'si (monorepo / büyük mikroservis)

### A.4 Onay al ve yaz

Taslağı göster, onay al, yaz:

- `CLAUDE.md` veya `AGENTS.md`'ye `## Agent skills` bloğu (idempotent — varsa güncelle, ekleme)
- `docs/agents/issue-tracker.md` ([github](./issue-tracker-github.md) veya [jira](./issue-tracker-jira.md) template'inden)
- `docs/agents/domain.md` ([template](./domain.md))

Jira seçildiyse env var hatırlatması:
```bash
export JIRA_BASE_URL="https://<domain>.atlassian.net"
export JIRA_EMAIL="you@rubion.io"
export JIRA_API_TOKEN="<token>"  # https://id.atlassian.com/manage-profile/security/api-tokens
export JIRA_PROJECT_KEY="<PROJ>"
```

### A.5 Soru 3 — Baseline Yerleştir

> Açıklama: Karpathy 4 prensibi (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) her oturumda yüklenir. Skill'lerin üstünde davranış kuralı.

Kullanıcı evet derse:
1. `<rubion-skills>/templates/CLAUDE.md.baseline.md` içeriğini al
2. Proje `CLAUDE.md`'sinde `<!-- rubion:baseline-start v1 -->` marker'ı var mı?
   - **Varsa:** marker'lar arasını yeniden yaz (regenerate)
   - **Yoksa:** dosya sonuna ekle

### A.6 Soru 4 — Hooks

> Açıklama: PostToolUse + Stop + PreToolUse hook'ları — Surgical Changes hatırlatma, Goal-Driven (test reminder), destructive komut uyarısı.

Kullanıcı evet derse:
- `.claude/settings.json` yoksa → `<rubion-skills>/templates/claude-settings.example.json` kopyala
- Varsa → birleştirme planını sun (otomatik birleştirme yapma)

### A.7 Soru 5 — Domain / Analiz Dökümanı Var mı?

> Açıklama: Elde hazır analiz/domain dökümanı (`.md` analiz notları, gereksinim dökümanları, toplantı çıktıları) varsa, bunlar koda dökülmeden önce `grill-with-docs` ile sorgulanıp `CONTEXT.md` + ADR'lere dönüştürülmeli. Domain glossary tüm sonraki skill'lerin referansıdır.

Önce filesystem'i tara, sonra sor:

```bash
ls *.md docs/*.md analiz/ analysis/ 2>/dev/null   # serbest analiz dökümanları
ls CONTEXT.md CONTEXT-MAP.md                        # zaten grill edilmiş mi?
```

- **Analiz dökümanı var, CONTEXT.md yok** → `grill-with-docs`'u **path'in ilk build adımı** olarak işaretle (Faz C). Kullanıcıya: "Şu klasörde N analiz dökümanı buldum; `grill-with-docs` ile bunları domain'e karşı grilleyip CONTEXT.md + ADR üretelim — scaffold'dan önce."
- **CONTEXT.md zaten var** → grill tamam say, atla (gerekirse tazeleme önerilebilir).
- **Hiç döküman yok** → grill'i yine de öner ama opsiyonel: domain konuşarak da netleşebilir.

> A.3'teki yerleşim kararı (tek `CONTEXT.md` vs çok-context `CONTEXT-MAP.md`) grill'in nereye yazacağını belirler — bu yüzden A.7, A.3'ten sonra gelir.

---

## Faz B — Diagnose (kişiselleştirme için)

2 soru, kısa:

### B.1 Soru 5 — Proje Yaşı

> "Bu **sıfırdan** yeni bir proje mi, yoksa **mevcut/legacy** bir kod tabanı mı?"

Tahmin et (kullanıcıya teyit ettir):
- `src/` veya `app/` dizininde 0-10 dosya → muhtemelen **zero**
- 50+ dosya, ADR'ler var, CHANGELOG dolu → muhtemelen **legacy**

### B.2 Soru 6 — Stack

> "Hangi stack? .NET / Supabase / React / React Native / Mixed?"

Dosyalara bakarak tahmin et, kullanıcıya teyit ettir. **README'ye güvenme** — eski boilerplate yanıltıcı olabilir (örn. "Next.js" yazıp aslında Vite olması), gerçek config dosyalarına bak:

| Sinyal | Stack |
|---|---|
| `*.csproj` | .NET backend |
| `supabase/config.toml`, `supabase/migrations/`, `supabase/functions/` | Supabase backend |
| `package.json` + `vite.config.*` | React SPA frontend |
| `app.json` + Expo | React Native |

Supabase backend + React SPA aynı repo'da sık birlikte gelir (BaaS + SPA) — bu bir **Mixed** projedir, ikisinin de path'i önerilir.

---

## Faz C — Recommend Path (asıl değer)

Faz B'nin 2 cevabına göre **karar matrisinden** kişiselleştirilmiş yol üret.

> **Grill ön-adımı (A.7'den):** Analiz/domain dökümanı var ve `CONTEXT.md` yoksa, seçilen path'in **en başına** `grill-with-docs` eklenir. Gerekçe: domain glossary + mimari kararlar (monolith vs mikroservis dahil) scaffold'dan önce netleşmeli; `scaffold-backend` türünü bu karara göre seçer.
>
> ```
> grill-with-docs → (karar muğlaksa) improve-codebase-architecture → <aşağıdaki matris path'i>
> ```

### Karar Matrisi

| Senaryo | Sıralı path |
|---------|-------------|
| **Zero × .NET** | `setup-memory` → `scaffold-backend` (monolith/mikroservis sorar) → `setup-precommit-dotnet` → `scaffold-vsa-feature` → `tdd-dotnet` → `setup-otel-dotnet` |
| **Zero × Supabase** | `setup-memory` → `scaffold-supabase-feature` → `tdd-edge-function` → `supabase-migration-review` (her migration'da) → `harden-webhook` (webhook varsa) → `setup-precommit-node` |
| **Zero × React** | `setup-memory` → `scaffold-frontend-react` → `tdd-react` (gün 1 disiplin) |
| **Zero × RN** | `setup-memory` → `tdd-react-native` |
| **Zero × Mixed (.NET + React)** | `setup-memory` → `scaffold-backend` → `scaffold-frontend-react` → `setup-precommit-dotnet` + `setup-precommit-node` → `scaffold-vsa-feature` → `tdd-dotnet` + `tdd-react` → `setup-otel-dotnet` |
| **Legacy × .NET** | `setup-memory` → `improve-codebase-architecture` → `scaffold-adr` (adayları belgele) → `memorize-module` (top 5) → `migrate-legacy-to-vsa` (gerekirse) → `setup-precommit-dotnet` |
| **Legacy × Supabase** | `setup-memory` → `improve-codebase-architecture` → `scaffold-adr` → `memorize-module` (top 5) → `supabase-migration-review` (mevcut migration'lara) → `harden-webhook` (webhook'lara) → `setup-precommit-node` |
| **Legacy × React** | `setup-memory` → `memorize-module` (top 5) → `tdd-react` (test açığı kapatma) |
| **Legacy × RN** | `setup-memory` → `memorize-module` (top 5) → `tdd-react-native` |
| **Legacy × Mixed** | `setup-memory` → önce backend path (.NET veya Supabase), sonra frontend |

> `scaffold-backend` türü (monolith/mikroservis) kullanıcıya sorar. `scaffold-frontend-react` çekirdeği kurar, opsiyonelleri (shadcn/Zustand/Playwright) sorar — her ikisi de sadece **sıfır** projede; legacy'de iskelet zaten var.

### Yol Haritasını Sun

Örnek çıktı (Legacy × .NET):

```
Önerilen sıra (kişiselleştirilmiş — Legacy × .NET):

1. ✅ setup-rubion-skills           ← buradayız
2. ⏭ setup-memory                   memory iskeleti — knowledge başlangıcı
3. ⏭ improve-codebase-architecture  neyi düzeltmeliyiz? 3-4 aday üretir
4. ⏭ scaffold-adr × N               (3) çıktısındaki her adayı ADR yap
5. ⏭ memorize-module × 5            en sık dokunulan modüller (git log ile tespit)
6. ⏭ migrate-legacy-to-vsa          (3) önerirse Strangler Fig
7. ⏭ setup-precommit-dotnet         disiplin (son — refactor öncesi koymak gereksiz friction)

Sıradaki: setup-memory.
Şimdi çalıştırayım mı? [evet/hayır/atla]
```

### Önemli Davranış Kuralları

- **Her adımı kullanıcı onaylayarak** geç. "Hepsini şimdi çalıştır" deme.
- **Skill çağrısı yapma** — sadece *öner*. Kullanıcı "evet" derse, Claude Code skill'i bir sonraki turn'de tetikler (description match ile veya `/skill-name` ile).
- Skill bitince **wizard'a geri dön** — sıradaki adımı öner.
- Adım atlanırsa kayıt tut (faz D için):
  ```
  Atlanan: scaffold-frontend-react (kullanıcı: "frontend ayrı repo")
  Sıradaki: setup-precommit-dotnet
  ```

---

## Faz D — Re-Entry (idempotent durumu)

Wizard daha önce çalıştırıldıysa **nerede kaldığını filesystem'den oku**:

### Durum Tespit Matrisi

| Tespit | Sonuç |
|--------|-------|
| `docs/agents/issue-tracker.md` var | A.2 tamam |
| `docs/agents/domain.md` var | A.3 tamam |
| `<!-- rubion:baseline-start` CLAUDE.md'de | A.5 tamam |
| `.claude/settings.json` var ve `[rubion-baseline]` içeriyor | A.6 tamam |
| `CONTEXT.md` veya `CONTEXT-MAP.md` var | `grill-with-docs` (A.7) tamam — domain glossary çıkarılmış |
| Serbest `.md` analiz dökümanı var ama `CONTEXT.md` yok | `grill-with-docs` henüz çalışmamış — **öner** |
| `docs/memory/MOC.md` var | `setup-memory` tamam |
| `docs/memory/20-modules/*.md` (template hariç) sayısı | Kaç modül memorize edildi |
| `docs/adr/ADR-*.md` veya `docs/memory/30-decisions/ADR-*.md` sayısı | Kaç ADR var |
| `.husky/` veya `.husky.json` | `setup-precommit-dotnet` / `setup-precommit-node` tamam |
| `Program.cs`'de `AddOpenTelemetry` | `setup-otel-dotnet` tamam |
| `*.sln` + `src/*.Api/*.csproj` + `Directory.Packages.props` | `scaffold-backend` yapıldı |
| `services/*/src/*.Api.csproj` (çoğul servis) | `scaffold-backend` mikroservis modunda yapıldı |
| `vite.config.*` + `src/app/providers.tsx` | `scaffold-frontend-react` yapıldı |
| `supabase/config.toml` var | Supabase backend projesi |
| `supabase/migrations/*.sql` sayısı | Kaç migration var (`supabase-migration-review` hedefi) |
| `supabase/functions/*/index.ts` sayısı | Kaç edge function var |

### Re-Entry Çıktısı

Örnek (Collecsi gibi 1 hafta sonra):

```
Mevcut durum tespiti:

✅ Foundation tamam (issue tracker: GitHub, baseline kurulu, hook'lar aktif)
✅ Memory iskeleti var (3 modül memorize edilmiş: profile, auth, billing)
✅ 8 ADR + 1 yeni ADR-009 (geçen hafta scaffold-adr ile)
⏭ improve-codebase-architecture henüz çalıştırılmamış (önerilir)
⏭ 32 modülden 3'ü memorize edilmiş — top 5 için 2 daha kaldı
⏭ setup-precommit-dotnet kurulmamış

Önerilen sıradaki: memorize-module (notifications) — git log son 90 günde en çok dokunulan.

Hangisini yapalım?
  1) memorize-module notifications
  2) improve-codebase-architecture (yeni adaylar bulmak için)
  3) setup-precommit-dotnet
  4) Wizard'dan çık, başka bir şey yapacağım
```

---

## Yapma

- ✗ **Otomatik skill çalıştırma** — sadece öner, kullanıcı tetikle
- ✗ **Bir kerede tüm yol haritasını çalıştır** — adım adım, her adımda doğrulama
- ✗ Karar matrisini kullanıcıya **dökmek** — kişiselleştirilmiş çıktı sun, ham tablo gösterme
- ✗ "Şu projede daha iyi olur" gibi **subjektif kararlar dayatma** — kullanıcı bilir, sor
- ✗ Faz B'yi atlamak — kişiselleştirme bu fazda doğar
- ✗ Faz D'yi unutmak — wizard'ın asıl değeri re-entry'de ortaya çıkar
- ✗ `prototype` skill'ini öner — throwaway, wizard kapsamı dışı
- ✗ Skill bitiminde "tamam, hadi sonraki" deyip atlamak — her skill sonrası **build/test/doğrulama** çağrısı yap (Goal-Driven)
