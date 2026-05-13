# Changelog

Tüm önemli değişiklikler bu dosyaya işlenir. Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
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
