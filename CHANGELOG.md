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
- scripts/install.ps1 + scripts/install.sh: Global installer. adapted/* ve skills/* altındaki her skill'i Claude Code (~/.claude/skills/) ve Cursor (~/.cursor/skills-cursor/) global klasörlerine junction/symlink olarak bağlar — git pull sonrası global path'ler otomatik güncellenir. Hedef seçimi (-Target claude|cursor|both), --force ile overwrite, --uninstall ile temizleme desteği. README kurulum bölümü tamamen yeniden yazıldı.
- Docs: skill-authoring.md, stack-conventions.md
- ADR'ler: 001 (VSA default), 002 (PostgreSQL primary), 003 (MediatR CQRS)

### Changed
- (yok)

### Removed
- (yok)
