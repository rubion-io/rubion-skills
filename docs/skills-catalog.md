# Skill Kataloğu

> 29 skill, kategorize. Her satır: ne yapar · ne zaman tetikle · örnek prompt.
> Detaylar için ilgili `SKILL.md` dosyasını aç.

Yeni başlıyorsan: **[docs/getting-started.md](./getting-started.md)** — senaryo bazlı path.

---

## 🚀 Setup (Bir Kez Çalıştır)

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[setup-rubion-skills](../skills/setup-rubion-skills/SKILL.md)** | Issue tracker (GitHub/Jira) + domain doc yerleşimini `docs/agents/` altına yazar. Karpathy baseline'ı CLAUDE.md'ye yerleştirir. | "rubion init" · "skill setup yap" |
| **[setup-memory](../skills/setup-memory/SKILL.md)** | `docs/memory/` iskeleti — 6 klasör + MOC.md + template'ler. ADR'leri link'ler veya taşır. | "memory iskeleti kur" · "wiki kur" |
| **[setup-otel-dotnet](../skills/setup-otel-dotnet/SKILL.md)** | .NET projesine OpenTelemetry — trace/metric/log → Jaeger veya Tempo. EF Core enstrümantasyonu dahil. | "OTel kur" · "Jaeger kurulumu" |
| **[setup-precommit-dotnet](../skills/setup-precommit-dotnet/SKILL.md)** | Husky.Net pre-commit hook — `dotnet format` + `dotnet test`. | "pre-commit kur" · "Husky ekle" |
| **[setup-precommit-node](../skills/setup-precommit-node/SKILL.md)** | Husky + lint-staged pre-commit — ESLint/Prettier/tsc (frontend) + deno fmt/lint (edge fn) + supabase db lint. | "node pre-commit kur" · "JS husky ekle" |

---

## 🧱 Scaffold (Yeni İskelet Üret)

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[scaffold-backend](../skills/scaffold-backend/SKILL.md)** | Sıfırdan .NET backend iskeleti — monolith (tek modüler API + in-process MediatR) veya mikroservis (DB-per-service + MassTransit). Solution + VSA düzeni + Docker. net10.0. | "Rubion.Erp monolith kur" · "Inventory mikroservisi scaffold et" |
| **[scaffold-frontend-react](../skills/scaffold-frontend-react/SKILL.md)** | Sıfırdan React frontend — Vite + Router + TanStack Query + Vitest/RTL/MSW çekirdek; shadcn/Zustand/RHF+Zod/Playwright/OpenAPI tip üretimi opsiyonel. | "erp-web React frontend kur" |
| **[scaffold-vsa-feature](../skills/scaffold-vsa-feature/SKILL.md)** | VSA feature slice — Command/Query + Handler + Validator + Endpoint + Test. Tek seferde 5 dosya. | "PlaceOrder için VSA feature ekle" |
| **[scaffold-supabase-feature](../skills/scaffold-supabase-feature/SKILL.md)** | Supabase dikey dilim — SQL migration (tablo + RLS) + Edge Function (Deno + JWT guard + Zod) + frontend TanStack hook + test. | "portfolio-publish için supabase feature ekle" |
| **[scaffold-adr](../skills/scaffold-adr/SKILL.md)** | Yeni ADR — auto-numbering, çelişki kontrolü, supersede workflow, MOC güncelleme. `improve-codebase-architecture` ile zincirleme. | "Aday 1'i ADR yap" · "PostgreSQL kararını dokümante et" |

---

## ✅ TDD (Test-Driven Development)

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[tdd-dotnet](../adapted/tdd-dotnet/SKILL.md)** | xUnit + FluentAssertions + NSubstitute + Testcontainers. MediatR handler'lar + VSA bağlamı. | "PlaceOrderHandler için TDD yaz" |
| **[tdd-react](../adapted/tdd-react/SKILL.md)** | Vitest + React Testing Library + MSW + user-event. TanStack Query, hook, form test stratejileri. | "OrderDetails component için test yaz" |
| **[tdd-react-native](../adapted/tdd-react-native/SKILL.md)** | Jest + RTL-RN + Maestro. Navigation, AsyncStorage, native mock'lar. Bare RN desteği. | "LoginScreen için RN TDD" |
| **[tdd-edge-function](../skills/tdd-edge-function/SKILL.md)** | Deno test / Vitest (lokal supabase) + pgTAP. Edge Function handler + RLS policy + webhook testi. | "lemonsqueezy-webhook için TDD yaz" |

---

## 🧠 Memory (Knowledge Management)

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[memorize-module](../skills/memorize-module/SKILL.md)** | Tek modül TL;DR — 5 soru + 3-5 dosya doğrulama + `20-modules/<modul>.md`. Lazy adoption. | "Profile modülünü memorize et" |
| **[review-memory](../skills/review-memory/SKILL.md)** | Bayatlık + broken link + git log cross-check raporu. Coverage analizi. | "memory bayat mı kontrol et" |

> Kurulum için önce `setup-memory` çalıştır.

---

## 🔍 Diagnose & Improve

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[diagnose-dotnet](../adapted/diagnose-dotnet/SKILL.md)** | Disiplinli debugging: reproduce → minimize → hypothesize → instrument → fix. EF Core N+1, OTel trace, RabbitMQ DLX. | "Bu endpoint neden yavaş?" · "Debug this" |
| **[diagnose-supabase](../adapted/diagnose-supabase/SKILL.md)** | Disiplinli debugging (Supabase/Deno): RLS denial (boş sonuç/403), edge cold start, TanStack stale cache, Postgres yavaş sorgu. | "Neden boş dönüyor?" · "RLS debug" |
| **[improve-codebase-architecture](../adapted/improve-codebase-architecture/SKILL.md)** | Mimari sürtüşme tespiti — shallow repository, God Service, monolith → mikroservis fırsatları, Domain vs Integration Event. | "Mimari iyileştirme fırsatlarını bul" |
| **[ef-core-migration-review](../skills/ef-core-migration-review/SKILL.md)** | EF Core migration'ı production-safety açısından inceler — DROP/veri kaybı, kilit tehlikeleri, rollback. | "Bu migration güvenli mi?" |
| **[supabase-migration-review](../skills/supabase-migration-review/SKILL.md)** | Supabase SQL migration'ı production-safety + RLS açısından inceler — DROP/veri kaybı, kilit, RLS açığı, rollback. | "Bu supabase migration güvenli mi?" |
| **[harden-webhook](../skills/harden-webhook/SKILL.md)** | Webhook/OAuth callback'leri güvenlik açısından sertleştirir — imza (raw body), idempotency, replay, secret, OAuth state. | "lemonsqueezy webhook'u güvenli mi?" |

---

## 🔄 Refactor

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[migrate-legacy-to-vsa](../skills/migrate-legacy-to-vsa/SKILL.md)** | Service + Repository mimarisini Strangler Fig ile VSA'ya taşır. Feature başına, sıfır kesinti. | "OrderService'i VSA'ya geç" |

---

## 🧪 Prototype

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[prototype](../adapted/prototype/SKILL.md)** | Throwaway POC — Backend CLI, Minimal API, Vite UI variants, Expo. **Baseline'dan muaf** (cila yok, silinecek). | "Bu pricing kuralı doğru mu, prototip yap" |

---

## 🎯 Orchestrate

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[dispatch-agents](../skills/dispatch-agents/SKILL.md)** | Bağımsız `ready-for-agent` issue'larını paralel subagent'lara dağıtır — her biri worktree'de PR'a kadar götürür. | "AFK batch — 5 issue'u paralel dağıt" |

---

## 📝 Plan & Document

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[to-prd](../adapted/to-prd/SKILL.md)** | Konuşma bağlamını PRD'ye dönüştürür ve issue tracker'a yayınlar. Kullanıcıyı sorgulamaz — sentezler. | "Bunu PRD yap" |
| **[to-issues](../adapted/to-issues/SKILL.md)** | Plan/PRD'yi tracer-bullet dikey dilimlere bölerek issue tracker'a yazar. | "Bu PRD'yi issue'lara böl" |
| **[grill-with-docs](../adapted/grill-with-docs/SKILL.md)** | İki rol: **(1) init'te** ham analiz dökümanlarını → CONTEXT.md + ADR'ye çevirir; **(2) her feature'da** PRD'yi domain modeli + ADR'lerle stress-test eder (`to-prd` ↔ `to-issues` arası). | "Analiz dökümanlarını grille koy" · "Bu PRD'yi domain'le grille koy" |
| **[tubitak-1507-document](../skills/tubitak-1507-document/SKILL.md)** | TÜBİTAK 1507 başvurusu teknik bölümleri — Ar-Ge faaliyetleri, iş paketleri, yenilikçilik. | "1507 başvurusu için Ar-Ge bölümü yaz" |

---

## 🔗 Skill Chain'leri (Sık Birlikte Kullanım)

### Yeni feature implementasyonu (sıfırdan)

```
scaffold-vsa-feature → tdd-dotnet → setup-otel-dotnet (varsa atla) → migration varsa: ef-core-migration-review
```

Tek prompt: "PlaceOrder feature'ı VSA + TDD ile ekle"

### Yeni feature implementasyonu (Supabase)

```
scaffold-supabase-feature → tdd-edge-function → migration için: supabase-migration-review → webhook varsa: harden-webhook
```

Tek prompt: "portfolio-publish feature'ı supabase + TDD ile ekle"

### Yeni backend (sıfırdan — monolith veya mikroservis)

```
scaffold-backend → scaffold-vsa-feature → tdd-dotnet → setup-otel-dotnet
```

Tek prompt: "Rubion.Erp monolith backend kur" veya "Inventory mikroservisi kur"

### Yeni frontend (sıfırdan — React)

```
scaffold-frontend-react → tdd-react (her component/hook/form için)
```

Tek prompt: "erp-web React frontend iskeleti kur"

### Yeni full-stack proje (.NET + React, sıfırdan)

```
scaffold-backend → scaffold-frontend-react → scaffold-vsa-feature → tdd-dotnet + tdd-react
```

### Mevcut projeyi anlama (Collecsi gibi)

```
setup-rubion-skills → setup-memory → memorize-module (en sık dokunulan modüller için tekrar tekrar) → improve-codebase-architecture
```

### Plan → Implementasyon (paralel)

```
to-prd → grill-with-docs → to-issues → dispatch-agents
```

> Buradaki `grill-with-docs` **Rol 2** (PRD denetimi): to-prd taslağı domain glossary + ADR'lere karşı stress-test edilir, sonra to-issues böler. Init'teki **Rol 1** (analiz dökümanı → CONTEXT.md) ayrı andır — bkz. getting-started.

### Mevcut legacy kod refactor

```
improve-codebase-architecture → migrate-legacy-to-vsa → tdd-dotnet (her slice için)
```

### Mimari analiz → karar belgele → implementasyon

```
improve-codebase-architecture → scaffold-adr (adayları belgele) → scaffold-vsa-feature → tdd-dotnet
```

### Memory bakımı (aylık)

```
review-memory → memorize-module (bayat olanları yenile)
```

---

## 🧭 Skill Seçim Karar Ağacı

```
Yeni kod yazacağım
├─ Yeni backend (.NET)      → scaffold-backend (monolith / mikroservis sorar)
├─ Yeni frontend (React)    → scaffold-frontend-react
├─ Yeni feature (.NET)      → scaffold-vsa-feature
├─ Yeni feature (Supabase)  → scaffold-supabase-feature
├─ Hızlı POC                → prototype
└─ Test ile                 → tdd-dotnet / tdd-react / tdd-react-native / tdd-edge-function

Mevcut kodu değiştireceğim
├─ Bug var (.NET)                → diagnose-dotnet
├─ Bug var (Supabase)            → diagnose-supabase
├─ Mimari sorunu                 → improve-codebase-architecture
├─ Legacy → VSA                  → migrate-legacy-to-vsa
├─ Migration kontrolü (.NET)     → ef-core-migration-review
├─ Migration kontrolü (Supabase) → supabase-migration-review
└─ Webhook güvenliği             → harden-webhook

Doküman yazacağım
├─ PRD                → to-prd
├─ Issue'lar          → to-issues
├─ Plan denetimi      → grill-with-docs
├─ TÜBİTAK başvuru    → tubitak-1507-document
├─ Modül doc          → memorize-module
└─ Mimari karar (ADR) → scaffold-adr

Kurulum
├─ İlk kez                  → setup-rubion-skills
├─ Memory                   → setup-memory
├─ Observability            → setup-otel-dotnet
└─ Pre-commit               → setup-precommit-dotnet (.NET) / setup-precommit-node (JS+Supabase)

Çoklu iş
├─ Paralel implementasyon   → dispatch-agents
└─ Memory bayatlık denetimi → review-memory
```

---

## 📊 Skill Adaptasyon Seviyeleri

`adapted/` altındakiler upstream [`mattpocock/skills`](https://github.com/mattpocock/skills)'ten türetilmiş; `skills/` altındakiler tamamen yerli.

| Seviye | Anlamı |
|--------|--------|
| **light** | Çoğunlukla upstream'le aynı, ufak Rubion uyarlamaları |
| **medium** | Upstream'in özünü koruyor, Rubion stack için yeniden yazılmış kısımlar var |
| **heavy** | Sıfırdan yazılmış denecek kadar değiştirilmiş — fikir upstream'den, içerik yerli |

Yerli `skills/` ise tamamen Rubion için yazılmış, upstream eşdeğeri yok.
