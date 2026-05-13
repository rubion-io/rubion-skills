# Rubion Skills — Proje Briefi

> Bu dosya `rubion-skills` repo'sunun kök dizinine konacak ve Claude Code'a "bu dosyayı oku, tüm adımları sırasıyla uygula" denecek şekilde hazırlanmıştır.

---

## 1. Amaç

[mattpocock/skills](https://github.com/mattpocock/skills) repo'sundaki "Skills for Real Engineers" yaklaşımını **Rubion'un teknoloji stack'ine** (.NET / C# / React / React Native / Monolith + Mikroservis) adapte eden, **upstream güncellemelerinden bozulmayan** bir Claude Code skill kütüphanesi inşa etmek.

Bu repo Rubion'un internal asset'i olacak. Hem AI-augmented development workflow'umuz hem de TÜBİTAK 1507 başvurusunda **"AI-native software methodology"** çıktısı olarak gösterilecek.

---

## 2. Rubion Bağlamı (Claude Code için context)

**Şirket:** Rubion — Akdeniz Teknokent'te kurulacak yazılım şirketi. Kurumsal yazılım, dijital dönüşüm, AI-augmented enterprise software odaklı.

**Teknoloji Stack'i (sabit):**
- Backend: **.NET 8+ / C#**, ASP.NET Core, Minimal API, MediatR
- Database: **PostgreSQL** (primary), **MSSQL** (legacy/enterprise istemci)
- Frontend Web: **React** + Vite + TanStack Query
- Mobile: **React Native** (Expo öncelikli)
- Mimari: **Monolith** (başlangıç) ve **Mikroservis** (ölçek)
- Container: **Docker** + Docker Compose; production'da Kubernetes opsiyonel
- Mesajlaşma: RabbitMQ veya Azure Service Bus (proje bazlı)
- ORM: EF Core (default), Dapper (perf-critical)
- Test: xUnit + FluentAssertions + NSubstitute + Testcontainers
- Observability: OpenTelemetry + Serilog
- Issue tracker: **GitHub Issues** veya **Jira Cloud** (proje bazlı — adapter pattern ile, bkz. `skills/setup-rubion-skills`)

**Mimari tercih:** **Vertical Slice Architecture** (Jimmy Bogard) + CQRS + MediatR. Clean Architecture sadece overkill olmadığında.

---

## 3. Felsefe — Neden Vendor Pattern?

Upstream (`mattpocock/skills`) tek kişi tarafından maintain ediliyor, versiyon politikası yok, breaking change uyarısı yok. Klasik `git pull upstream main` 3 ayda repo'yu bozar.

**Çözüm: Üç katmanlı yapı + ayda bir manuel sync.**

```
rubion-skills/
├── vendor/mattpocock/    ← Upstream'in salt-okunur aynası
├── adapted/              ← Upstream'den ilham, Rubion'a uyarlanmış
├── skills/               ← Rubion'un sıfırdan ürettiği skill'ler
├── UPSTREAM.md           ← Sync logu + commit SHA pinning
├── CHANGELOG.md          ← Rubion tarafı değişiklikler
└── README.md             ← Kullanım, kurulum
```

**Kurallar:**
- `vendor/` asla manuel düzenlenmez, sadece sync sırasında güncellenir
- `adapted/` içindeki her skill'in başında "Adapted from X @ commit Y, last reviewed Z" başlığı bulunur
- `skills/` Rubion'un orijinal üretimi, upstream'le ilişkisi yok
- Sync: ayda bir, 30 dakika, takvimli

---

## 4. Claude Code İçin Görev Listesi

### FAZ 1 — İskelet (öncelik: HIGH)

- [ ] Klasör yapısını oluştur: `vendor/`, `adapted/`, `skills/`, `docs/`
- [ ] `README.md` yaz (aşağıdaki template)
- [ ] `UPSTREAM.md` yaz (aşağıdaki template)
- [ ] `CHANGELOG.md` yaz (boş — Keep a Changelog formatında)
- [ ] `.gitignore` ekle (`.DS_Store`, `node_modules`, `.vs`, `bin`, `obj`, `*.user`)
- [ ] `LICENSE` ekle: **MIT** (upstream ile uyumlu)
- [ ] `CONTRIBUTING.md` yaz: skill yazma kuralları, naming convention, sync politikası

### FAZ 2 — Vendor (öncelik: HIGH)

- [ ] `mattpocock/skills` repo'sunu git geçmişsiz olarak klonla:
  ```bash
  git clone --depth 1 https://github.com/mattpocock/skills.git /tmp/upstream-skills
  cp -r /tmp/upstream-skills/skills vendor/mattpocock/
  cp /tmp/upstream-skills/CLAUDE.md vendor/mattpocock/
  cp /tmp/upstream-skills/CONTEXT.md vendor/mattpocock/
  cd /tmp/upstream-skills && git rev-parse HEAD  # SHA'yı al
  ```
- [ ] Alınan **commit SHA**'yı `UPSTREAM.md`'ye işle (tarih ile birlikte)
- [ ] `vendor/mattpocock/README.md` koy: "Bu klasör salt okunurdur. Düzenleme, sadece sync'te güncelleme."

### FAZ 3 — İlk Adapte Skill'ler (öncelik: HIGH)

Sıra: `grill-with-docs` → `tdd-dotnet` → `diagnose-dotnet` → diğerleri.

Her adapte skill için klasör yapısı:
```
adapted/<skill-adı>/
├── SKILL.md           ← Asıl prompt
├── ADAPTATION.md      ← Upstream'den ne değişti, neden
└── examples/          ← Rubion stack'ine özel örnekler
```

`SKILL.md` her zaman şu başlıkla başlar:
```markdown
---
adapted_from: mattpocock/skills/skills/engineering/grill-with-docs
upstream_commit: <SHA>
last_reviewed: 2026-05-13
adaptation_level: light|medium|heavy
---
```

#### 3.1 `adapted/grill-with-docs/` — adaptation_level: **light**

Orijinal mantık aynı kalır. Sadece **`CONTEXT.md` template'i** Rubion-spesifik hale getirilir:

```markdown
# CONTEXT.md Template (Rubion projeleri için)

## Domain Terimleri
[Bu projenin domain'ine özel terimler. Örn:]
- "Sevkiyat planlaması" = production-side shipment scheduling
- "Tahminleme" = demand forecasting (price değil)
- "Fason üretim" = subcontracted manufacturing

## Bounded Context'ler
[Mikroservis sınırları veya monolith modülleri]
- Sales: ...
- Inventory: ...
- Production: ...

## Tech Decisions (özet)
- Auth: <Identity Server | Keycloak | Auth0>
- Messaging: <RabbitMQ | Azure Service Bus | yok>
- Frontend state: TanStack Query + <Zustand|Redux Toolkit>

## ADR Index
[docs/adr/ altındaki kararların kısa listesi]
```

#### 3.2 `adapted/tdd-dotnet/` — adaptation_level: **heavy**

Orijinal `/tdd`'nin red-green-refactor felsefesi korunur. Aşağıdakiler eklenir:

- **Test framework:** xUnit (default) + FluentAssertions + NSubstitute
- **Integration test:** `WebApplicationFactory<Program>` + Testcontainers (PostgreSQL/MSSQL)
- **Test data:** Bogus + AutoFixture
- **Örnek:** Bir MediatR `CommandHandler` için red-green-refactor walkthrough (gerçek C# kodu ile)
- **Mikroservis durumu:** Contract test (PactNet) ne zaman gerekli, ne zaman gereksiz
- **Coverage politikası:** Önerilen min %70 unit, %40 integration; ama dogmatik değil

`examples/` klasörüne en az şu örnekler:
- `01-simple-handler-tdd.md` — basit bir command handler
- `02-integration-test-with-testcontainers.md` — PostgreSQL ile e2e
- `03-when-not-to-tdd.md` — TDD'nin ters tepebileceği durumlar

#### 3.3 `adapted/tdd-react/` — adaptation_level: **heavy**

- **Stack:** Vitest + React Testing Library + MSW + user-event v14
- **Custom hook testleri:** `renderHook` pattern
- **Component vs integration test ayrımı**
- **Async test'ler:** TanStack Query'li component nasıl test edilir (mock değil, gerçek queryClient)

#### 3.4 `adapted/tdd-react-native/` — adaptation_level: **heavy**

- **Stack:** Jest + `@testing-library/react-native`
- **E2E:** Maestro öncelikli (Detox legacy)
- **Expo özel notlar:** EAS Build öncesi smoke test stratejisi

#### 3.5 `adapted/diagnose-dotnet/` — adaptation_level: **heavy**

Orijinal döngü (reproduce → minimize → hypothesize → instrument → fix → regression-test) korunur. Ekler:

- **Production debug:** `dotnet-trace`, `dotnet-counters`, `dotnet-dump`
- **Perf:** BenchmarkDotNet (mikro), MiniProfiler (web)
- **EF Core:** N+1 tespiti, `AsNoTracking`, query plan okuma
- **Logging:** Serilog + structured logging — sorgulanabilir log yaz
- **Dağıtık debug (mikroservis):** OpenTelemetry + Jaeger trace okuma, correlation ID propagation
- **Async/message debug:** RabbitMQ DLX, message replay stratejisi

#### 3.6 `adapted/improve-codebase-architecture/` — adaptation_level: **heavy**

Orijinal "deep modules" felsefesi (Ousterhout) korunur. Aşağıdaki .NET pattern'leri eklenir:

- **Vertical Slice Architecture** decision tree (default Rubion tercihi)
- **Clean Architecture** ne zaman seçilir, ne zaman overkill
- **CQRS + MediatR** — command/query ayrımı, handler-per-feature
- **Domain Events vs Integration Events** ayrımı
- **Repository pattern**: EF Core kullanırken ne zaman gereksiz
- **Monolith → Mikroservis kararı:**
  - Bounded context tespit checklist'i
  - Strangler Fig pattern
  - Database-per-service vs shared DB

#### 3.7 `adapted/to-prd/` ve `adapted/to-issues/` — adaptation_level: **light**

Sadece "vertical slice" tanımına Rubion açıklığı:
- Slice tek mikroservise sığıyorsa: ideal
- Multiple service değişikliği gerekiyorsa: PRD'de açıkça belirt, contract değişiklikleri ayrı issue
- Issue tracker: GitHub Issues veya Jira (adapter pattern — `docs/agents/issue-tracker.md`)

#### 3.8 `adapted/prototype/` — adaptation_level: **medium**

Üç prototype mode:
- **Backend CLI:** `dotnet new console` — business logic POC için
- **Backend API:** `dotnet new web` (Minimal API) — endpoint POC için
- **Frontend UI variants:** Vite + `?variant=a|b|c` query param routing
- **Mobile:** Expo Snack veya `npx create-expo-app --template blank`

#### 3.9 Olduğu Gibi Bırakılacaklar (sadece referans için vendor'da kalır)

Bunlar Rubion için generic yeterli, adapte edilmez:
- `grill-me`, `handoff`, `caveman`, `zoom-out`, `triage`, `write-a-skill`

#### 3.10 Atılacaklar (vendor'da kalır ama kullanılmaz)

- `migrate-to-shoehorn` (TypeScript kursu için)
- `scaffold-exercises` (eğitim için)
- `setup-pre-commit` (Rubion'un kendi pre-commit setup'ı yazılacak — Husky.Net)

### FAZ 4 — Rubion Özel Skill'ler (öncelik: MEDIUM)

Bunlar tamamen Rubion'a özel, upstream'de karşılığı yok. `skills/` klasörüne girer.

- [ ] `skills/setup-precommit-dotnet/` — Husky.Net + dotnet format + dotnet test
- [ ] `skills/scaffold-vsa-feature/` — Vertical Slice Architecture'da yeni feature iskeleti üretir (Command + Handler + Validator + Endpoint + Test)
- [ ] `skills/scaffold-microservice/` — Yeni mikroservis iskeleti (API + worker + Dockerfile + docker-compose entry)
- [ ] `skills/migrate-legacy-to-vsa/` — Mevcut "service + repository" kodunu Vertical Slice'a refactor
- [ ] `skills/setup-otel-dotnet/` — OpenTelemetry kurulumu (Jaeger/Tempo target'la)
- [ ] `skills/ef-core-migration-review/` — Migration üretildikten sonra review: destructive operation var mı, prod-safe mi
- [ ] `skills/tubitak-1507-document/` — TÜBİTAK 1507 başvuru dokümanı için teknik bölüm üretici (R&D yenilikçilik vurgusu)
- [ ] `skills/setup-rubion-skills/` — bootstrap; yeni projede `docs/agents/issue-tracker.md` (GitHub veya Jira) ve `docs/agents/domain.md` kurar (v1.1'de eklendi)

Her skill için ayrı bir issue/task açılabilir, hepsi birlikte yazılması zorunlu değil.

### FAZ 5 — Dokümantasyon (öncelik: MEDIUM)

- [ ] `docs/sync-process.md` — Aylık upstream sync prosedürü (checklist olarak)
- [ ] `docs/skill-authoring.md` — Yeni skill nasıl yazılır, hangi yapıyı izler
- [ ] `docs/adr/` — Rubion'un mimari kararları:
  - ADR-001: Vertical Slice neden default
  - ADR-002: PostgreSQL birincil, MSSQL legacy/enterprise (v1.1)
  - ADR-003: MediatR ile CQRS pipeline (v1.1)
- [ ] `docs/stack-conventions.md` — Naming, folder structure, dependency tercihleri

---

## 5. Template'ler

### 5.1 `README.md`

```markdown
# Rubion Skills

Claude Code / agent skill kütüphanesi — Rubion'un .NET + React/RN + monolith/mikroservis stack'ine adapte edilmiş.

Temel alınan kaynak: [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).

## Kurulum

\`\`\`bash
# Tek bir projede kullanmak için
cp -r adapted/* /path/to/your/project/.claude/skills/
cp -r skills/* /path/to/your/project/.claude/skills/

# veya symlink
ln -s $(pwd)/adapted /path/to/your/project/.claude/skills-adapted
\`\`\`

## Yapı

- \`vendor/\` — Upstream'in salt-okunur aynası (DOKUNMA)
- \`adapted/\` — Upstream'den uyarlanmış skill'ler
- \`skills/\` — Rubion'un orijinal skill'leri
- \`docs/\` — Süreç dokümanları + ADR'ler

## Sync Disiplini

Upstream ayda bir manuel review ile sync edilir. Detay: \`docs/sync-process.md\`.

## Lisans

MIT. Upstream attribution: bkz. \`UPSTREAM.md\`.
```

### 5.2 `UPSTREAM.md`

```markdown
# Upstream Sync Log

Upstream kaynağı: https://github.com/mattpocock/skills

## Pinned Version

- **Commit SHA:** <FAZ 2'de doldur>
- **Sync tarihi:** 2026-05-13
- **Synced by:** Murat Kızılelma

## Sync History

### 2026-05-13 — Initial vendor
- Commit: <SHA>
- Action: Full vendor copy, no adaptation yet
- Notes: İlk kurulum

<!-- Her sync'te buraya yeni entry eklenir:
### YYYY-MM-DD — <kısa açıklama>
- Commit: <SHA>
- Reviewed: <kaç dosya değişmiş>
- Adopted: <hangi değişiklikler alındı>
- Skipped: <hangi değişiklikler atlandı, neden>
- Added: <yeni skill'ler>
- Removed: <upstream'de silinmişler>
-->

## Adopted Skills Map

| Adapted Path | Upstream Path | Adaptation | Last Reviewed |
|---|---|---|---|
| adapted/grill-with-docs | skills/engineering/grill-with-docs | light | 2026-05-13 |
| adapted/tdd-dotnet | skills/engineering/tdd | heavy | 2026-05-13 |
| adapted/diagnose-dotnet | skills/engineering/diagnose | heavy | 2026-05-13 |
| ... | ... | ... | ... |
```

### 5.3 `CHANGELOG.md`

```markdown
# Changelog

Tüm önemli değişiklikler bu dosyaya işlenir. Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Initial repo skeleton
- Vendor of mattpocock/skills @ <SHA>
- Adapted skills: grill-with-docs, tdd-dotnet, diagnose-dotnet, ...

### Changed
- (yok)

### Removed
- (yok)
```

### 5.4 `docs/sync-process.md`

```markdown
# Aylık Upstream Sync Prosedürü

**Sıklık:** Her ayın ilk pazartesi, ~30 dakika.

## Adımlar

1. **Diff al:**
   \`\`\`bash
   cd /tmp && rm -rf upstream-skills
   git clone --depth 50 https://github.com/mattpocock/skills.git upstream-skills
   cd upstream-skills
   # UPSTREAM.md'deki son pin SHA ile karşılaştır
   git log --oneline <last_pinned_sha>..HEAD -- skills/
   \`\`\`

2. **Per-skill karar matrisi:**

   | Durum | Aksiyon |
   |---|---|
   | Adapte etmediğin skill'de değişiklik | Vendor'u güncelle |
   | Adapte ettiğin skill'de küçük iyileştirme | Manuel olarak adapted/'a uygula |
   | Adapte ettiğin skill'de felsefi değişiklik | Test repo'sunda dene, sonra karar |
   | Yeni skill eklenmiş | Değerli mi? adapted/'a al. Değilse logla, geç |
   | Skill silinmiş | UPSTREAM.md'ye not düş, adapted/'da kalsın |

3. **Vendor'u güncelle (yapacaksan):**
   \`\`\`bash
   rm -rf vendor/mattpocock
   cp -r /tmp/upstream-skills/skills vendor/mattpocock
   git add . && git commit -m "vendor: sync to <new_sha>"
   \`\`\`

4. **UPSTREAM.md'ye yeni entry ekle.**

5. **CHANGELOG.md güncelle** (kullanıcıya etki edecek değişiklikler varsa).

6. **Test repo'sunda smoke test:** Bir CRUD endpoint'i yazdır, davranış değişti mi gözle.

## Cherry-Pick Karar Kriteri

Bir upstream değişikliğini almaya değer mi?

1. **Felsefi mi, taktik mi?** Taktik (örnek/prompt iyileştirmesi) → genelde al. Felsefi (mantık değişimi) → tartış, çoğunlukla alma.
2. **Senin custom kısmınla çakışıyor mu?** Çakışıyorsa kendi versiyonunda kal.
3. **Stack'inle alakalı mı?** TypeScript-specific iyileştirme .NET skill'ini bozar → bypass et.
```

### 5.5 `CONTRIBUTING.md`

```markdown
# Skill Yazma Kuralları

## Naming

- Skill klasör adı: lowercase, kebab-case (örn: \`tdd-dotnet\`, \`scaffold-vsa-feature\`)
- Stack-specific skill'lerde stack suffix: \`-dotnet\`, \`-react\`, \`-react-native\`
- Generic skill'lerde suffix yok

## Yapı

Her skill klasöründe:
- \`SKILL.md\` — zorunlu, asıl prompt
- \`ADAPTATION.md\` — sadece \`adapted/\` altındakiler için, upstream'den ne değişti
- \`examples/\` — opsiyonel ama önerilen

## SKILL.md Header

\`\`\`yaml
---
name: tdd-dotnet
description: Test-driven development for .NET projects with xUnit + FluentAssertions + NSubstitute
adapted_from: mattpocock/skills/skills/engineering/tdd
upstream_commit: <SHA>
last_reviewed: YYYY-MM-DD
adaptation_level: light|medium|heavy
stack: [dotnet, csharp]
---
\`\`\`

## Prompt Yazım Disiplini

- Önce **ne** sonra **neden** sonra **nasıl**
- Concrete örnek olmadan abstract prompt yazma
- Stack-specific komutları sıralı ver (\`dotnet new\`, \`dotnet test --filter\`...)
- Anti-pattern'leri açıkça yaz ("şunu yapma" örnekleri ekle)

## Test Etmeden Commit Etme

Her yeni veya değişen skill, en az bir test projesinde (\`rubion-skills-test/\`) bir senaryoda çalıştırılmadan main'e merge edilmez.
```

---

## 6. Done Definition (Faz 1 + 2 + 3 için)

Aşağıdakiler tamamlandığında bu briefing'in ilk turu "done":

- [ ] `rubion-skills` repo'sunda klasör yapısı kurulu
- [ ] `vendor/mattpocock/` upstream'in **bilinen bir SHA**'sından kopyalanmış
- [ ] `UPSTREAM.md` o SHA'yı listeliyor
- [ ] `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE` (MIT) mevcut
- [ ] **En az** şu üç adapte skill yazılmış ve içlerinde Rubion-spesifik örnek var:
  - `adapted/grill-with-docs/`
  - `adapted/tdd-dotnet/`
  - `adapted/diagnose-dotnet/`
- [ ] `docs/sync-process.md` yazılmış
- [ ] İlk commit atılmış, repo push edilmeye hazır

Faz 4 (Rubion özel skill'ler) ve Faz 5 (dokümantasyon detayı) ayrı turlarda yapılır — bu briefing'in ilk teslimatı değil.

---

## 7. Claude Code İçin Çalışma Talimatı

1. **Önce bu dosyayı tamamen oku, sorularını sıralı bana sor** (10'dan fazla olmasın).
2. Sorular bittikten sonra **Faz 1'i bitir**, çıktıyı göster, onay iste.
3. Onay gelince **Faz 2**, sonra **Faz 3.1, 3.2, 3.3** sırayla. Her büyük adımdan sonra checkpoint için dur.
4. Faz 4 ve 5'i ayrı bir oturumda yapacağız, şimdilik dokunma.
5. **`vendor/` klasörüne dokunma** — sadece Faz 2'de bir kez kopyalama yap.
6. Türkçe yaz. Kod örnekleri C#/TS standartlarına uygun olsun.
7. Emin olmadığın yerde **varsayım yap, açıkça yaz, devam et**. Beklemekten iyidir.

---

## 8. Referanslar

- Upstream: https://github.com/mattpocock/skills
- Vertical Slice Architecture (Jimmy Bogard): https://www.jimmybogard.com/vertical-slice-architecture/
- A Philosophy of Software Design (Ousterhout) — "deep modules" felsefesi
- Pragmatic Programmer — feedback loops, küçük adımlar
- Keep a Changelog: https://keepachangelog.com/
- Architecture Decision Records: https://adr.github.io/

---

**Brief versiyonu:** 1.1
**Hazırlayan:** Murat Kızılelma + Claude
**Tarih:** 2026-05-13

---

## 9. Değişiklik Notları (v1.1 — 2026-05-13)

Brief v1.0'a göre değişen ve eklenen kalemler:

### Değişti

- **Issue tracker:** "Linear (varsayılan)" → "GitHub Issues veya Jira Cloud (adapter pattern)". Gerekçe: müşteri projelerinin %100'ü ya GitHub ya Jira kullanıyor; Linear kapsam dışına alındı. Adapter pattern `skills/setup-rubion-skills/` ile her projede tek seferlik konfigüre edilir.

### Eklendi (brief v1.0'da listelenmemişti)

- **`skills/setup-rubion-skills/`** — bootstrap skill. Yeni projede `docs/agents/issue-tracker.md` (GitHub veya Jira şablonu) ve `docs/agents/domain.md` (single/multi-context) üretir. `to-prd`, `to-issues` vb. skill'ler buradan okur.
- **`docs/adr/0002-postgresql-primary-database.md`** ve **`docs/adr/0003-mediatr-cqrs-pipeline.md`** — brief sadece ADR-001'i örneklemişti; üretim sırasında bu iki karar netleşti ve dokümante edildi.

### Faz 3 Kapsamı Tamamlandı

Brief v1.0 Done Definition "en az 3 adapte skill" der; v1.1 ile **Faz 3'ün tüm maddeleri** karşılandı:

| Skill | Adaptation | Durum |
|---|---|---|
| 3.1 grill-with-docs | light | ✓ |
| 3.2 tdd-dotnet | heavy | ✓ |
| 3.3 tdd-react | heavy | ✓ |
| 3.4 tdd-react-native | heavy | ✓ |
| 3.5 diagnose-dotnet | heavy | ✓ |
| 3.6 improve-codebase-architecture | heavy | ✓ |
| 3.7 to-prd + to-issues | light | ✓ |
| 3.8 prototype | medium | ✓ |
