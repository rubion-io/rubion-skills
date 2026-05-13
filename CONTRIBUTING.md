# Skill Yazma Kuralları

## Naming

- Skill klasör adı: lowercase, kebab-case (örn: `tdd-dotnet`, `scaffold-vsa-feature`)
- Stack-specific skill'lerde stack suffix: `-dotnet`, `-react`, `-react-native`
- Generic skill'lerde suffix yok

## Yapı

Her skill klasöründe:
- `SKILL.md` — zorunlu, asıl prompt
- `ADAPTATION.md` — sadece `adapted/` altındakiler için, upstream'den ne değişti
- `examples/` — opsiyonel ama önerilen

## SKILL.md Header

```yaml
---
name: tdd-dotnet
description: Test-driven development for .NET projects with xUnit + FluentAssertions + NSubstitute
adapted_from: mattpocock/skills/skills/engineering/tdd
upstream_commit: <SHA>
last_reviewed: YYYY-MM-DD
adaptation_level: light|medium|heavy
stack: [dotnet, csharp]
---
```

## Prompt Yazım Disiplini

- Önce **ne** sonra **neden** sonra **nasıl**
- Concrete örnek olmadan abstract prompt yazma
- Stack-specific komutları sıralı ver (`dotnet new`, `dotnet test --filter`...)
- Anti-pattern'leri açıkça yaz ("şunu yapma" örnekleri ekle)

## Test Etmeden Commit Etme

Her yeni veya değişen skill, en az bir test projesinde (`rubion-skills-test/`) bir senaryoda çalıştırılmadan main'e merge edilmez.

## Sync Politikası

- `vendor/` klasörüne asla manuel müdahale edilmez
- Upstream sync yalnızca `docs/sync-process.md` prosedürü takip edilerek yapılır
- Her adapted skill'in `ADAPTATION.md` dosyası, değişiklik tarihini ve gerekçesini içermelidir
