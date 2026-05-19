# Changelog

Tüm önemli değişiklikler bu dosyaya işlenir. Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
