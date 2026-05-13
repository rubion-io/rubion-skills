## Değişiklik Tipi

- [ ] Yeni skill (sıfırdan)
- [ ] Mevcut skill güncellemesi
- [ ] ADR ekleme/güncelleme
- [ ] Doc-only değişiklik
- [ ] Vendor sync (mattpocock/skills)
- [ ] Bug fix
- [ ] Refactor

---

## Skill İçin Checklist (Yeni veya Güncellenen Skill İse)

- [ ] Frontmatter eksiksiz: `name`, `description`, `stack` (gerekiyorsa)
- [ ] Adapted skill ise: `adapted_from`, `upstream_commit`, `last_reviewed`, `adaptation_level`
- [ ] Description 100-250 karakter arası
- [ ] Description'da trigger keyword'leri var ("X denildiğinde", "Y için kullan")
- [ ] Description'da negatif sınır var ("kullanma" benzeri)
- [ ] SKILL.md 500 satırı geçmiyor (geçiyorsa referans dosyaya bölünmüş)
- [ ] En az 1 `examples/*.md` dosyası var
- [ ] Kod örnekleri gerçek Rubion stack'iyle uyumlu (.NET 8+, xUnit, MediatR, vb.)
- [ ] "Yapma" / anti-pattern bölümü var
- [ ] ADR ile çelişme yok (varsa açıkça belirtilmiş)
- [ ] `evals/skills/<skill-name>.json` güncellenmiş (yeni skill ise oluşturulmuş)

---

## ADR İçin Checklist (ADR Eklendi/Değiştirildiyse)

- [ ] Numaralandırma sıralı (0001, 0002, ... — atlama yok)
- [ ] Başlık net (örn: `0004-database-per-service.md`)
- [ ] Bağlam, Karar, Gerekçe, Sonuçlar bölümleri var
- [ ] Reddedilen alternatifler dokümante edilmiş
- [ ] İlgili skill'lerde "bkz. ADR-NNN" referansı eklenmiş

---

## Test

- [ ] Değiştirilen skill(ler) bir gerçek projede veya `rubion-skills-test/`'te denenmiş
- [ ] Eval varsa: `npx tsx evals/runner.ts --skill=<name>` çalıştırıldı

---

## CHANGELOG

- [ ] `CHANGELOG.md` "Unreleased" bölümüne entry eklendi
