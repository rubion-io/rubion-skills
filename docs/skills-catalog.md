# Skill Kataloğu

> 21 skill, kategorize. Her satır: ne yapar · ne zaman tetikle · örnek prompt.
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

---

## 🧱 Scaffold (Yeni İskelet Üret)

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[scaffold-vsa-feature](../skills/scaffold-vsa-feature/SKILL.md)** | VSA feature slice — Command/Query + Handler + Validator + Endpoint + Test. Tek seferde 5 dosya. | "PlaceOrder için VSA feature ekle" |
| **[scaffold-microservice](../skills/scaffold-microservice/SKILL.md)** | Yeni .NET mikroservis — ASP.NET Core API + Worker (opsiyonel) + Dockerfile + docker-compose entry. | "Inventory mikroservisi scaffold et" |

---

## ✅ TDD (Test-Driven Development)

| Skill | Ne yapar | Örnek prompt |
|-------|----------|--------------|
| **[tdd-dotnet](../adapted/tdd-dotnet/SKILL.md)** | xUnit + FluentAssertions + NSubstitute + Testcontainers. MediatR handler'lar + VSA bağlamı. | "PlaceOrderHandler için TDD yaz" |
| **[tdd-react](../adapted/tdd-react/SKILL.md)** | Vitest + React Testing Library + MSW + user-event. TanStack Query, hook, form test stratejileri. | "OrderDetails component için test yaz" |
| **[tdd-react-native](../adapted/tdd-react-native/SKILL.md)** | Jest + RTL-RN + Maestro. Navigation, AsyncStorage, native mock'lar. Bare RN desteği. | "LoginScreen için RN TDD" |

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
| **[improve-codebase-architecture](../adapted/improve-codebase-architecture/SKILL.md)** | Mimari sürtüşme tespiti — shallow repository, God Service, monolith → mikroservis fırsatları, Domain vs Integration Event. | "Mimari iyileştirme fırsatlarını bul" |
| **[ef-core-migration-review](../skills/ef-core-migration-review/SKILL.md)** | EF Core migration'ı production-safety açısından inceler — DROP/veri kaybı, kilit tehlikeleri, rollback. | "Bu migration güvenli mi?" |

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
| **[grill-with-docs](../adapted/grill-with-docs/SKILL.md)** | Planı mevcut domain modeli + ADR'lerle stress-test eder. CONTEXT.md/ADR güncellemesi. | "Bu planı domain'le grillere koy" |
| **[tubitak-1507-document](../skills/tubitak-1507-document/SKILL.md)** | TÜBİTAK 1507 başvurusu teknik bölümleri — Ar-Ge faaliyetleri, iş paketleri, yenilikçilik. | "1507 başvurusu için Ar-Ge bölümü yaz" |

---

## 🔗 Skill Chain'leri (Sık Birlikte Kullanım)

### Yeni feature implementasyonu (sıfırdan)

```
scaffold-vsa-feature → tdd-dotnet → setup-otel-dotnet (varsa atla) → migration varsa: ef-core-migration-review
```

Tek prompt: "PlaceOrder feature'ı VSA + TDD ile ekle"

### Yeni mikroservis (sıfırdan)

```
scaffold-microservice → scaffold-vsa-feature → tdd-dotnet → setup-otel-dotnet
```

### Mevcut projeyi anlama (Collecsi gibi)

```
setup-rubion-skills → setup-memory → memorize-module (en sık dokunulan modüller için tekrar tekrar) → improve-codebase-architecture
```

### Plan → Implementasyon (paralel)

```
to-prd → grill-with-docs → to-issues → dispatch-agents
```

### Mevcut legacy kod refactor

```
improve-codebase-architecture → migrate-legacy-to-vsa → tdd-dotnet (her slice için)
```

### Memory bakımı (aylık)

```
review-memory → memorize-module (bayat olanları yenile)
```

---

## 🧭 Skill Seçim Karar Ağacı

```
Yeni kod yazacağım
├─ Yeni feature  → scaffold-vsa-feature
├─ Yeni servis   → scaffold-microservice
├─ Hızlı POC     → prototype
└─ Test ile      → tdd-dotnet / tdd-react / tdd-react-native

Mevcut kodu değiştireceğim
├─ Bug var               → diagnose-dotnet
├─ Mimari sorunu         → improve-codebase-architecture
├─ Legacy → VSA          → migrate-legacy-to-vsa
└─ Migration kontrolü    → ef-core-migration-review

Doküman yazacağım
├─ PRD              → to-prd
├─ Issue'lar        → to-issues
├─ Plan denetimi    → grill-with-docs
├─ TÜBİTAK başvuru  → tubitak-1507-document
└─ Modül doc        → memorize-module

Kurulum
├─ İlk kez                  → setup-rubion-skills
├─ Memory                   → setup-memory
├─ Observability            → setup-otel-dotnet
└─ Pre-commit               → setup-precommit-dotnet

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
