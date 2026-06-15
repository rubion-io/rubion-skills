# Changelog

Tüm önemli değişiklikler bu dosyaya işlenir. Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added (Hafta 10 — Supabase Stack Desteği)
- Yeni `stack:supabase` şeridi: Supabase (Postgres + Auth + Storage + Deno Edge Functions) backend'i artık birinci sınıf stack. Daha önce katalog yalnızca .NET / React / RN varsayıyordu; Vite + React SPA + Supabase projeleri (örn. çok dilli portfolio/marketplace uygulaması) için backend tarafı tamamen açıktaydı.
- 4 yeni yerli skill (`skills/`):
  - `supabase-migration-review`: Ham SQL migration'ı production-safety + **RLS** açısından inceler — destructive op, kilit (CONCURRENTLY transaction tuzağı dahil), RLS açığı (`using(true)`, policy'siz tablo, `with check` eksikliği), SECURITY DEFINER, ileri-only rollback. `ef-core-migration-review`'in SQL/RLS karşılığı.
  - `scaffold-supabase-feature`: Dikey dilim iskeleti — migration (tablo + RLS owner policy) + Edge Function (Deno + JWT guard + Zod) + frontend TanStack Query hook + test. Edge Function gerekliliği için karar kapısı. `scaffold-vsa-feature`'in karşılığı.
  - `tdd-edge-function`: Edge Function handler (Deno test / Vitest @ lokal supabase) + **RLS policy testi (pgTAP)** + webhook idempotency testi. `tdd-dotnet`'in sunucu-tarafı Supabase karşılığı; `tdd-react` yalnızca UI'ı kapsıyordu.
  - `harden-webhook`: Dışa açık webhook/OAuth callback güvenlik denetimi — imza doğrulama (raw body), idempotency, replay, secret yönetimi, OAuth `state`. Lemon Squeezy / Paddle / Resend / Instagram / TikTok kapsamı. Kritik-path → insan review zorunlu.
- Frontend not: Vite + React 19 SPA tarafı mevcut `tdd-react` + `stack-conventions.md` React bölümüyle örtüşüyor — yeni skill gerekmedi.
- 2 ek skill (ikinci dalga):
  - `setup-precommit-node` (skills/): Husky + lint-staged pre-commit — `src/` için ESLint/Prettier/tsc, `supabase/functions/` için deno fmt/lint, migration için supabase db lint (path'e göre araç ayrımı). `setup-precommit-dotnet`'in JS/Deno karşılığı.
  - `diagnose-supabase` (adapted/, heavy): RLS denial (sessiz boş sonuç/403), edge cold start, TanStack stale cache, Postgres yavaş sorgu odaklı 6-fazlı debug. `diagnose-dotnet` ile aynı iskelet, Supabase araçları (`supabase logs`, pgTAP, `pg_policies`, `EXPLAIN ANALYZE`). ADAPTATION.md dahil.
- 5 örnek dosyası (`examples/`): supabase-migration-review (RLS açığı migration), scaffold-supabase-feature (portfolio-publish uçtan uca), tdd-edge-function (Lemon Squeezy webhook TDD + RLS pgTAP), harden-webhook (sorunlu webhook + düzeltmeler), diagnose-supabase (boş-liste RLS teşhisi). 4 Supabase skill'ine örnek referansı eklendi.
- 2 ek eval JSON: `setup-precommit-node`, `diagnose-supabase` (her biri 10 pos + 10 neg).

### Changed (Hafta 10 — Bağlayıcı Doku: stack:supabase Routing)
- `adapted/to-issues/SKILL.md`: Stack etiketi tablosuna `stack:supabase` satırı + backend etiketinin repo'ya göre çözüldüğü kural (`*.csproj` → dotnet, `supabase/config.toml` → supabase) + auto-split ve `STACK_LABEL` listesi güncellendi.
- `skills/dispatch-agents/SKILL.md`: Stack → skill zinciri routing tablosu eklendi (`stack:supabase → scaffold-supabase-feature → tdd-edge-function`; migration → `supabase-migration-review`; webhook → `harden-webhook`). Critical-path heuristic'ine `webhook`, `lemon squeezy`, `paddle`, `rls` eklendi.
- `skills/setup-rubion-skills/SKILL.md`: Faz B stack tespiti config-dosyası tablosuna dönüştü (README'ye güvenme uyarısı dahil); karar matrisine Zero × Supabase ve Legacy × Supabase satırları; Mixed tanımı backend'in .NET veya Supabase olabileceğini içeriyor; Faz D re-entry tespitine `supabase/config.toml` + migration/function sayımı.
- `docs/stack-conventions.md`: Supabase naming + klasör yapısı + backend paket tercihleri tabloları; Veritabanı Kuralları'nda migration naming (EF PascalCase ≠ Supabase snake_case.sql) ve RLS zorunluluğu.
- `docs/skills-catalog.md`, `README.md`, `docs/sizing-guide.md`: skill sayısı 21→28 (6 yeni skill + önceki header'daki 1 birimlik eksik sayım düzeltmesi; junction 22→28, evals 22→28 ile birebir), yeni satırlar (Setup/Scaffold/TDD/Diagnose kategorileri) + Supabase skill chain'i + karar ağacı (stack ayrımlı bug/migration/pre-commit) güncellendi.

### Added (Hafta 9 — Token Maliyeti Optimizasyonu)
- `docs/sizing-guide.md`: 4 tier'lı proje boyutu rehberi (T1 Stratejik / T2 Aktif / T3 Bakım / T4 Throwaway). Her tier için skill subset, memory politikası, otomasyon önerileri. Karar ağacı + token maliyeti karşılaştırması + migrasyon path'leri + 3 soruluk pratik test.
- `templates/github-workflows/memory-review.yml`: Aylık otomatik memory denetimi CI template'i (consuming project'e kopyalanır). Bayatlık + broken link + git log cross-check. Critical bulunca otomatik GitHub issue açar.
- `.github/workflows/eval.yml`: Haftalık (Pazartesi 06:00 UTC) full-suite eval schedule eklendi + manuel `workflow_dispatch` tetikleyici. Eval düşerse otomatik issue açılır (description bozulması erken yakalama).
- `scripts/install.ps1` ve `install.sh`: `-ExcludeNiche` / `--exclude-niche` flag'i — niş skill'leri (`tubitak-1507-document`, `dispatch-agents`, `prototype`) T2/T3 tier'larında atlar. Always-on token tasarrufu.

### Changed (Hafta 9 — Hook + Skill Body Optimizasyonu)
- `templates/claude-settings.example.json`: Tüm hook `echo` komutları `>&2` (stderr) ile yeniden yazıldı. Hook çıktıları Claude'un prompt context'ine girmiyor artık — sadece tool result'ta görünür. **~30% hook overhead düşüşü** (uzun session'larda binlerce token).
- 3 büyük skill body trim — toplam **224 satır azalma**:
  - `adapted/diagnose-dotnet/SKILL.md`: 312 → 210 (-102). EF Core N+1 ve Distributed/RabbitMQ bölümleri yeni example dosyalarına taşındı.
  - `adapted/tdd-react-native/SKILL.md`: 311 → 251 (-60). Bare RN bölümü `examples/03-bare-rn-setup.md`'ye taşındı.
  - `skills/dispatch-agents/SKILL.md`: 288 → 226 (-62). Per-agent prompt template'i `examples/02-per-agent-prompt-template.md`'ye taşındı.
- 3 yeni example dosyası: `diagnose-dotnet/examples/02-ef-core-n-plus-one.md`, `03-distributed-and-messaging.md`, `tdd-react-native/examples/03-bare-rn-setup.md`, `dispatch-agents/examples/02-per-agent-prompt-template.md`.

### Changed (Hafta 8 — setup-rubion-skills → Wizard)
- `setup-rubion-skills` skill'i **4 fazlı wizard** olarak yeniden yapılandırıldı:
  - **Faz A — Foundation:** Issue tracker (GitHub/Jira), domain doc, baseline, hooks (mevcut içerik faz altına alındı)
  - **Faz B — Diagnose:** 2 soru → "zero ya da legacy?" + "stack?" (.NET/React/RN/Mixed)
  - **Faz C — Recommend Path:** 8 senaryolu karar matrisinden kişiselleştirilmiş yol haritası üretir (örn: Legacy × .NET → memory → improve-arch → scaffold-adr × N → memorize-module × 5 → migrate → precommit)
  - **Faz D — Re-Entry:** İdempotent durum tespiti — filesystem'den (docs/agents/, docs/memory/, .husky/, OTel pattern'i vb.) nerede kaldığını anlar, doğru adımdan devam eder
- Description güncellendi: "Wizard — projeyi keşfeder ve kişiselleştirilmiş skill yol haritası önerir... 'rubion init', 'skill setup', 'wizard başlat' denildiğinde. İlk kez veya re-entry — idempotent." (252 char)
- Eval JSON 20 query yenilendi (wizard trigger'larına göre)
- **Karpathy uyumu:** Don't assume, ask — otomatik skill çalıştırma yapmaz, sadece **öner**. Kullanıcı her adımı explicit onaylar.
- 2 fazdan 4 faza geçiş: skill 115 satırdan ~210 satıra çıktı ama mantığı önemli ölçüde değiştirmedi — sadece yapılandırma + karar matrisi + re-entry eklendi.

### Added (Hafta 7 — scaffold-adr)
- `skills/scaffold-adr/SKILL.md`: Yeni ADR yazımı için auto-numbering + çelişki kontrolü + supersede workflow + MOC.md/README.md güncelleme. 4-5 soru ile bağlam/karar/alternatif/sonuç doldurulur. `improve-codebase-architecture` çıktısından chain modu — "Aday 1'i ADR yap" denildiğinde aday içeriği otomatik map'lenir, sadece eksik alanlar (genelde alternatifler) sorulur.
- `skills/scaffold-adr/examples/01-from-architecture-review.md`: Collecsi `ItemCreatedEvent` adayının ADR-009'a dönüşümü — tam akış (chain modu + çelişki kontrolü + supersede senaryosu).
- `evals/skills/scaffold-adr.json`: 10 pos + 10 neg query (TÜBİTAK/migration/PRD gibi confusable skill'lere karşı).
- Skills catalog güncellendi: `scaffold-adr` Scaffold kategorisine, yeni "mimari analiz → karar belgele → implementasyon" chain'i, karar ağacına "Mimari karar (ADR) → scaffold-adr" satırı.
- `setup-memory` skill'inde "Yeni ADR eklerken `scaffold-adr` kullan" referansı.

### Added (Hafta 6 — Memory Skill Üçlüsü)
- `skills/setup-memory/SKILL.md`: Proje için memory iskeleti kurar — `docs/memory/` altına 6 klasör (10-architecture, 20-modules, 30-decisions, 40-runbooks, 50-glossary, 99-meta) + MOC.md + template'ler. Mevcut `docs/adr/`'yi link'ler veya taşır (kullanıcı seçer). `CLAUDE.md`'ye idempotent memory pointer marker'ı ekler. Sadece bir kez çalıştırılır.
- `skills/memorize-module/SKILL.md`: Tek bir modülün TL;DR'ını üretir — kullanıcıya 5 soru (ne yapar, kritik convention, "dokunma" notları, ADR ilişkileri, modül bağımlılıkları), 3-5 anahtar dosyayla doğrulama, sonra `20-modules/<modul>.md` yazar ve MOC.md'yi günceller. Lazy adoption pattern — modül başına 5-10K token. Karpathy "Don't assume, ask" prensibi.
- `skills/review-memory/SKILL.md`: Memory vault sağlığını denetler — last_reviewed > 60 gün, broken link, git log cross-check (kod son 30 günde değişti ama doc eski mi?), coverage raporu (en sık dokunulan ama doc'suz top 5). Otomatik düzeltme yapmaz — rapor üretir, kullanıcı önceliklendirir.
- 3 yeni eval JSON: `setup-memory`, `memorize-module`, `review-memory` × 10 pos + 10 neg query.
- Memory katmanı **skill execution memory'sinden bağımsız bir knowledge memory** olarak konumlandırıldı. Wiki = "ne doğru, neden bu kararı verdik" / Skill = "nasıl yapılır" — çakışmaz, beraber çalışır.

### Added (Hafta 5 — Karpathy Davranış Baseline)
- `templates/CLAUDE.md.baseline.md`: 4 davranış prensibi (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution) + Rubion-specific somut tetikleyiciler (3+ dosya → onay, 200+ satır → "50 mümkün mü?", dokunulmayan dosyada formatting yasak vb.). Idempotent marker'lar (`<!-- rubion:baseline-start v1 -->`) ile regenere edilebilir.
- `templates/claude-settings.example.json`: Claude Code v2 hook'ları — `PostToolUse` (Edit/Write sonrası Surgical Changes hatırlatıcı), `Stop` (.cs değişiklikleri varsa test çalıştırıldı mı kontrolü), `PreToolUse` (destructive bash komut uyarısı).
- `setup-rubion-skills` skill'ine "Karpathy/Rubion Baseline Yerleştir" adımı eklendi — CLAUDE.md idempotent merge, marker'lar arasındaki içeriği regenerate eder.
- 9 kod-yazan skill'in başına "Baseline" referans satırı eklendi: `improve-codebase-architecture`, `migrate-legacy-to-vsa`, `scaffold-vsa-feature`, `scaffold-microservice`, `tdd-dotnet/react/react-native`, `diagnose-dotnet`, `ef-core-migration-review`. Hiyerarşi: baseline → ADR → domain → skill operational.
- `prototype` skill'i baseline'dan muaf — "throwaway, cila yok" prototype'ın doğasıyla çelişiyor (baseline'ın override bölümünde belgelendi).

### Added (Hafta 4 — Smoke Test + TÜBİTAK Örneği)
- **Smoke test repo:** https://github.com/muratkizilelma/rubion-skills-test — 3 skill demo projesi (.NET 10, 14 xUnit testi, 0 failure). Tested: `scaffold-vsa-feature` (PlaceOrder/GetOrders/CancelOrder slice'ları), `tdd-dotnet` (14 test, FluentAssertions + NSubstitute), `migrate-legacy-to-vsa` (LegacyOrderService BEFORE state + VSA AFTER state Strangler Fig notasyonuyla).
- `skills/tubitak-1507-document/examples/01-ai-production-planning-application.md`: Tam doldurulmuş TÜBİTAK 1507 başvurusu örneği — Milagro Yazılım A.Ş. hayali şirketi, plastik enjeksiyon sektörü için "AI-Destekli Üretim Planlama Sistemi". 6 bölüm: Amaç/Kapsam, Özgün Değer (5 makale + 5 ticari ürün analizi + 3 özgün katkı), 4 Ar-Ge Faaliyeti (teknik içerik + belirsizlik + başarı kriteri + risk), Gantt tablosu (18 ay), Ekip (5 kişi, 54 ay-kişi), Bütçe (5.176.000 TL). Adapte etme notları dahil.

### Added (Hafta 3)
- `evals/` klasörü: 18 skill için trigger accuracy eval suite.
  - `evals/runner.ts`: Anthropic API tabanlı eval runner — her query için hangi skill trigger olduğunu kontrol eder, %80 accuracy eşiği, PASS/FAIL raporu.
  - `evals/skills/*.json`: 18 skill × 20 query (10 pos + 10 neg) = 360 eval query. Confusable skill çiftleri özellikle negatif query'lere alındı.
  - `evals/package.json`: tsx + @anthropic-ai/sdk bağımlılıkları.
  - `evals/README.md`: Kurulum, kullanım, çıktı örnekleri.
  - `.github/workflows/eval.yml`: PR'da değişen SKILL.md'ler için otomatik eval CI.

### Added (Hafta 2)
- `docs/adr/0004-database-per-service.md`: Database-per-Service karar gerekçesi — Saga pattern, CDC raporlama, Shared DB neden reddedildi.
- `docs/adr/0005-masstransit-rabbitmq.md`: MassTransit + RabbitMQ stack kararı — transport-agnostic abstraction, NServiceBus/CAP/raw RabbitMQ neden reddedildi.
- `docs/adr/0006-observability-stack.md`: OTel + Grafana Ecosystem (Jaeger dev, Tempo prod, Prometheus, Loki) — Datadog/AppInsights neden reddedildi.
- `docs/adr/0007-ef-core-over-dapper.md`: EF Core varsayılan ORM — Dapper escape hatch koşulları, Repository pattern silme testi.
- `docs/adr/0008-test-stack.md`: Test stack (.NET xUnit+FluentAssertions+NSubstitute+Testcontainers, React Vitest+MSW, RN Maestro) — her seçimin gerekçesi.
- ADR referansları skill'lere eklendi: `improve-codebase-architecture` → ADR-004, `scaffold-microservice` → ADR-005, `setup-otel-dotnet` → ADR-006, `diagnose-dotnet` → ADR-006+007, `tdd-dotnet/react/react-native` → ADR-008.

### Added (Hafta 1 — önceki commit)
- Initial repo skeleton
- Vendor of mattpocock/skills @ f304057d61d3df3c9fd992ac2b6e3833cb9325fb
- Adapted skills: grill-with-docs, tdd-dotnet, diagnose-dotnet
- Rubion skills: setup-precommit-dotnet, scaffold-vsa-feature, scaffold-microservice, migrate-legacy-to-vsa, setup-otel-dotnet, ef-core-migration-review, tubitak-1507-document, setup-rubion-skills (bootstrap, GitHub + Jira adapter şablonları)
- Adapted skills (light): to-prd, to-issues — issue tracker-agnostic, docs/agents/issue-tracker.md adapter'ından okur
- Adapted skills (heavy): tdd-react (Vitest + RTL + MSW + TanStack Query), tdd-react-native (Jest + RTL-RN + Maestro + Expo), improve-codebase-architecture (VSA/Clean karar ağacı, Domain vs Integration Event, Repository eleştirisi, Monolith→Mikroservis)
- Adapted skill (medium): prototype (4 mod — Backend CLI, Backend API, Frontend variants, Mobile/Expo)
- Brief v1.0 → v1.1: Linear → GitHub+Jira değişikliği, setup-rubion-skills + ADR-002/003 eklemeleri dokümante edildi
- docs/getting-started.md: Geliştirici onboarding rehberi — Senaryo 1 (sıfır proje + GitHub) ve Senaryo 2 (1 yıllık proje + Jira) için adım adım skill path'leri, karşılaştırma tablosu, ilk gün checklist'i. README'den erişilebilir.
- skills/dispatch-agents: Orchestrator skill — issue tracker'daki bağımsız `ready-for-agent` issue'larını paralel Claude Code subagent'larına dağıtır (her biri git worktree mode'da). Her subagent scaffold-vsa-feature + tdd-dotnet zinciri ile implementasyonu yapar, PR açar. Dependency graph hesabı (GitHub `Blocked by` referansları, Jira `Blocks` issueLinks), eşzamanlı limit (default 3), critical-path uyarısı, conflict tespiti, draft PR fallback'i. examples/01-parallel-features.md ile somut akış. Brief v1.2.
- scripts/install.ps1 + scripts/install.sh: Global installer. adapted/* ve skills/* altındaki her skill'i Claude Code (~/.claude/skills/) ve Cursor (~/.cursor/skills-cursor/) global klasörlerine junction/symlink olarak bağlar — git pull sonrası global path'ler otomatik güncellenir. Hedef seçimi (-Target claude|cursor|both), --force ile overwrite, --uninstall ile temizleme desteği. README kurulum bölümü tamamen yeniden yazıldı.
- Docs: skill-authoring.md, stack-conventions.md
- ADR'ler: 001 (VSA default), 002 (PostgreSQL primary), 003 (MediatR CQRS)

### Changed
- 5 skill description kısaltıldı (~%40 azalma) — trigger doğruluğu için keyword density artırıldı, negatif sınırlar eklendi: `setup-rubion-skills` (385→195 char), `dispatch-agents` (355→220), `improve-codebase-architecture` (347→200), `diagnose-dotnet` (344→215), `prototype` (326→180).
- `scaffold-microservice` frontmatter'dan `kubernetes` kaldırıldı — içerikte K8s manifest yok, yanıltıcıydı. Stack: `[dotnet, csharp, docker]`.
- `dispatch-agents` SKILL.md: "Ön Koşullar" bölümüne Claude Code v2.x+ gereksinimi ve Cursor uyarısı eklendi. Skill başına orchestrator uyarı kutusu eklendi.
- `tdd-react-native` SKILL.md: "Bare React Native — Expo Olmayan Projeler" bölümü eklendi (jest preset, native modül mock'ları, Detox vs Maestro karşılaştırması).

### Added
- `adapted/tdd-react-native/examples/01-form-component-with-validation.md`: Login form TDD akışı (render → validation → API mock → refactor hook → Maestro E2E).
- `adapted/improve-codebase-architecture/examples/01-shallow-repository-deepening.md`: OrderService 8 method silme testi analizi, 3 derinleştirme önerisi (Repository sil, entity method, VSA slice).
- `skills/migrate-legacy-to-vsa/examples/01-orderservice-to-vsa-walkthrough.md`: Strangler Fig ile OrderService → VSA tam walkthrough (8 adım, her adımda commit).
- `skills/scaffold-microservice/examples/01-inventory-service-from-scratch.md`: Inventory.Api sıfırdan (dotnet new → paketler → Program.cs → DbContext → Dockerfile → docker-compose → smoke test → Testcontainers integration test).
- `.github/PULL_REQUEST_TEMPLATE.md`: Skill + ADR PR checklist'i.
- `.github/CODEOWNERS`: Tüm skill ve doc değişikliklerine otomatik review request.

### Removed
- (yok)
