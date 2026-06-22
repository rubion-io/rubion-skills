# Rubion Skills — Başlangıç Rehberi

Bu doküman: **Bu skill kütüphanesini yeni veya mevcut bir Rubion projesinde nasıl kullanırım?**

İki tipik senaryo için adım adım path. Her adımda hangi skill, ne yapar, ne çıktı üretir.

---

## Hangi Senaryodasın?

```
Yeni bir proje mi başlıyorsun?
├── Evet, sıfırdan        → Senaryo 1
├── Hayır, mevcut proje   → Senaryo 2
```

Hangi issue tracker?

```
GitHub Issues kullanılacaksa    → Senaryo 1 default
Jira Cloud kullanılacaksa        → Senaryo 2 default
```

(Senaryo + tracker dik kombinasyonu da geçerli. Aşağıdaki path'ler bunları temsil ediyor ama tracker kısmı `setup-rubion-skills` ile her ikisi için aynı şekilde çalışır.)

> **`grill-with-docs`'un iki rolü** — aynı skill, iki farklı anda, iki farklı girdiyle:
> - **Rol 1 — Domain temeli (init'te, bir kez):** Ham analiz dökümanları (`.md`) → `CONTEXT.md` + ADR. Domain glossary + mimari kararları çıkarır. (Senaryo 1 adım 1, Senaryo 2 adım 2)
> - **Rol 2 — Plan denetimi (her feature'da):** Bir PRD/Story → domain'e karşı stress-test → terminoloji/ADR ihlali yakalanmış plan. `to-prd` ile `to-issues` **arasında** çalışır. (adım 8b)
>
> Feature döngüsü: `to-prd → grill-with-docs → to-issues → dispatch-agents`

---

## SENARYO 1 — Sıfır Proje, Fikir Muğlak, GitHub

**Karakter:** Greenfield. Önce **anla & karar ver**, sonra **inşa et**. Yanlış mimari karara erken commit'lemek çok pahalı.

| # | Aşama | Skill | Çıktı |
|---|---|---|---|
| 0 | Repo başlat | _(manuel)_ | `git init`, boş repo, GitHub remote |
| 1 | **Domain anla** (Rol 1 — analiz dökümanları varsa onları besle) | [`adapted/grill-with-docs`](../adapted/grill-with-docs/SKILL.md) | İlk `CONTEXT.md` (terimler, sınırlar, tech kararlar) + ADR'ler |
| 2 | **Mimari kararı netleştir** | [`adapted/improve-codebase-architecture`](../adapted/improve-codebase-architecture/SKILL.md) — Monolith → Mikroservis karar ağacı bölümü | Bounded context checklist sonucu, monolith/mikroservis kararı, ilk ADR'ler |
| 3 | (Belirsizse) Kritik logic'i dene | [`adapted/prototype`](../adapted/prototype/SKILL.md) — Backend CLI veya API mode | Throwaway POC + kararın commit/ADR'sı, sonra silinir |
| 4 | **Issue tracker bağla** | [`skills/setup-rubion-skills`](../skills/setup-rubion-skills/SKILL.md) → **GitHub seç** | `docs/agents/issue-tracker.md` (GitHub), `docs/agents/domain.md` |
| 5 | Backend iskelet | [`skills/scaffold-backend`](../skills/scaffold-backend/SKILL.md) — monolith mi mikroservis mi diye sorar | Solution + VSA düzeni + Docker (net10.0) |
| 5b | Frontend iskelet (varsa) | [`skills/scaffold-frontend-react`](../skills/scaffold-frontend-react/SKILL.md) | Vite + Router + TanStack Query + test çekirdeği |
| 6 | **Pre-commit disiplini** | [`skills/setup-precommit-dotnet`](../skills/setup-precommit-dotnet/SKILL.md) | Husky.Net + dotnet format + dotnet test |
| 7 | **Observability** | [`skills/setup-otel-dotnet`](../skills/setup-otel-dotnet/SKILL.md) | OpenTelemetry + Jaeger ayakta |
| 8 | İlk feature için PRD | [`adapted/to-prd`](../adapted/to-prd/SKILL.md) → GitHub'a yayınla | GitHub'da `#1: PRD: <feature>` issue |
| 8b | **PRD'yi domain'e karşı grille koy** (Rol 2) | [`adapted/grill-with-docs`](../adapted/grill-with-docs/SKILL.md) | Terminoloji/ADR ihlali yakalanmış PRD + gerekirse CONTEXT.md/ADR güncellemesi |
| 9 | PRD'yi tracer-bullet dilimlere böl | [`adapted/to-issues`](../adapted/to-issues/SKILL.md) | Bağımlılık linkli 3-5 issue (`#2, #3, #4`) |
| 10 | Her issue için inner döngü | [`skills/scaffold-vsa-feature`](../skills/scaffold-vsa-feature/SKILL.md) → [`adapted/tdd-dotnet`](../adapted/tdd-dotnet/SKILL.md) | Çalışan feature + test'ler |
| 10b | 3+ bağımsız issue varsa, paralel batch | [`skills/dispatch-agents`](../skills/dispatch-agents/SKILL.md) | Her biri kendi worktree'sinde çalışan subagent'lar, açılmış PR'lar, dispatch raporu |
| 11 | DB değişikliği olursa | [`skills/ef-core-migration-review`](../skills/ef-core-migration-review/SKILL.md) | Migration güvenlik raporu (merge öncesi) |
| 12 | Frontend katmanı | [`adapted/tdd-react`](../adapted/tdd-react/SKILL.md) veya [`adapted/tdd-react-native`](../adapted/tdd-react-native/SKILL.md) | Frontend test'leri |
| 13 | Bug / perf sorunu | [`adapted/diagnose-dotnet`](../adapted/diagnose-dotnet/SKILL.md) | Disipline edilmiş root-cause analizi |
| 14 | (Opsiyonel) TÜBİTAK 1507 başvurusu | [`skills/tubitak-1507-document`](../skills/tubitak-1507-document/SKILL.md) | Başvuru teknik bölümleri (paralel akış) |

**Kritik nokta:** Aşama 5'e kadar production kod yazma. 1-3 tipik olarak 1-2 günlük konuşma; 4-7 yarım gün; geri kalan tüm hafta inşa.

---

## SENARYO 2 — 1 Yıllık Proje, Jira Takip

**Karakter:** Brownfield. Önce **anla & boşlukları tespit et**, sonra **iyileştir**. Mevcut yapıyı bozmak değil, üzerine inşa etmek.

| # | Aşama | Skill | Çıktı |
|---|---|---|---|
| 0 | **Skill kütüphanesini bağla** | [`skills/setup-rubion-skills`](../skills/setup-rubion-skills/SKILL.md) → **Jira seç** | `docs/agents/issue-tracker.md` (Jira), `JIRA_*` env vars kurulumu |
| 1 | **Mevcut durumu kavra** | [`adapted/improve-codebase-architecture`](../adapted/improve-codebase-architecture/SKILL.md) — Keşfet fazı | Shallow modüller, eksik seam'ler, sürtünme noktaları listesi |
| 2 | **Domain'i dokümante et** (Rol 1) | [`adapted/grill-with-docs`](../adapted/grill-with-docs/SKILL.md) | Retrofit `CONTEXT.md` — 1 yıllık projede sözlük muhtemelen kafalardadır, dışarı çıkar |
| 3 | **Kritik kararları ADR'le** | (grill-with-docs ADR teklif eder) | `docs/adr/000X-*.md` — geçmişte alınmış sözsüz kararlar yazılı hale |
| 4 | Pre-commit eksik mi? | [`skills/setup-precommit-dotnet`](../skills/setup-precommit-dotnet/SKILL.md) (kurulu değilse) | Husky.Net retrofit |
| 5 | Observability eksik mi? | [`skills/setup-otel-dotnet`](../skills/setup-otel-dotnet/SKILL.md) (kurulu değilse) | OTel retrofit — büyük projede 1-2 günlük iş |
| 6 | Legacy "service + repository" kalmış mı? | [`skills/migrate-legacy-to-vsa`](../skills/migrate-legacy-to-vsa/SKILL.md) | Strangler Fig ile feature feature VSA'ya geçiş |
| 7 | Test coverage düşük mü? | [`adapted/tdd-dotnet`](../adapted/tdd-dotnet/SKILL.md) / [`adapted/tdd-react`](../adapted/tdd-react/SKILL.md) | Kritik path'lere geri dönük test |
| 8 | Yeni feature için PRD | [`adapted/to-prd`](../adapted/to-prd/SKILL.md) → Jira'ya Story | Jira'da yeni Story (`RUB-N`) |
| 8b | **PRD'yi domain'e karşı grille koy** (Rol 2) | [`adapted/grill-with-docs`](../adapted/grill-with-docs/SKILL.md) | Terminoloji/ADR ihlali yakalanmış Story + gerekirse CONTEXT.md/ADR güncellemesi |
| 9 | Story'yi sub-task'lara böl | [`adapted/to-issues`](../adapted/to-issues/SKILL.md) | Jira Subtask'lar + "Blocks" link'leri |
| 10 | Feature implementasyonu | [`skills/scaffold-vsa-feature`](../skills/scaffold-vsa-feature/SKILL.md) → [`adapted/tdd-dotnet`](../adapted/tdd-dotnet/SKILL.md) | Yeni VSA dilim + testler |
| 10b | 3+ bağımsız issue varsa, paralel batch | [`skills/dispatch-agents`](../skills/dispatch-agents/SKILL.md) | Subagent başına PR, dispatch raporu |
| 11 | DB değişikliği | [`skills/ef-core-migration-review`](../skills/ef-core-migration-review/SKILL.md) | 1 yıllık projede büyük tablo var → CONCURRENTLY önemli |
| 12 | Bug / perf | [`adapted/diagnose-dotnet`](../adapted/diagnose-dotnet/SKILL.md) | EF Core N+1, DLX, dotnet-trace |
| 13 | Refactor zamanı | [`adapted/improve-codebase-architecture`](../adapted/improve-codebase-architecture/SKILL.md) — Adaylar fazı | Numaralı deepening önerileri |
| 14 | UI iyileştirme dene | [`adapted/prototype`](../adapted/prototype/SKILL.md) → Frontend variants | A/B/C variant'lar, ekibe seçtir |

**Kritik nokta:** Aşama 1-3 (anlama + dokümantasyon) atlanırsa, her sonraki adım yarım iş olur. 1 yıllık projede gerçek mimari öğrenme süresi 1-2 hafta — bunu kabul et, kestirme arama.

---

## İki Senaryoyu Karşılaştır

| Boyut | Senaryo 1 (Sıfır + GitHub) | Senaryo 2 (1 yıllık + Jira) |
|---|---|---|
| **İlk skill** | `grill-with-docs` (domain üret) | `setup-rubion-skills` (Jira bağla) |
| **Ana faz** | İnşa | Anlama + boşluk doldurma |
| **`improve-codebase-architecture`** | Karar aracı (önceden) | Refactor adayları (sonradan) |
| **`migrate-legacy-to-vsa`** | Yok | Var (legacy mevcutsa) |
| **`prototype`** | Erken (karar netleşmemişken) | Geç (UI/UX iyileştirmede) |
| **Issue tracker** | GitHub Issues | Jira Cloud |
| **`grill-with-docs`** | Domain *üret* | Domain *retrofit et* |
| **Risk** | Yanlış mimari karar | Mevcut sistemi bozmak |
| **İlk değer süresi** | 1-2 hafta MVP | 2-4 hafta (anlama ağırlıklı) |

---

## Hangi Skill Ne Zaman *Kullanılmaz*?

**Senaryo 1'de kullanılmaz:**

- `migrate-legacy-to-vsa` — legacy kod yok
- `ef-core-migration-review` — henüz DB yok (sonradan kullanılır)

**Senaryo 2'de erken kullanılmaz:**

- `prototype` — mevcut sistemde POC nadiren gerekir; UI iyileştirme aşamasında değer kazanır
- `scaffold-backend` — iskelet zaten mevcut (yeni servis eklenmiyorsa)
- `to-prd` ilk hafta — önce mevcut sistemi anla, sonra yeni feature ekle

---

## İlk Gün Checklist'i

### Senaryo 1 (Sıfır + GitHub)

```
[ ] GitHub repo oluşturuldu, local'e clone'landı
[ ] grill-with-docs ile ilk 5-10 domain terimi tartışıldı → CONTEXT.md
[ ] Monolith vs mikroservis kararı verildi → ADR-001 yazıldı
[ ] setup-rubion-skills çalıştırıldı → docs/agents/ kuruldu (GitHub adapter)
[ ] scaffold-backend ile iskelet (monolith/mikroservis) + gerekirse scaffold-frontend-react
[ ] setup-precommit-dotnet → ilk commit'ten önce pre-commit hook
[ ] setup-otel-dotnet → Jaeger local'de ayakta
```

### Senaryo 2 (1 yıllık + Jira)

```
[ ] JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY env vars setlendi
[ ] setup-rubion-skills çalıştırıldı → docs/agents/ kuruldu (Jira adapter)
[ ] curl ile Jira API erişimi doğrulandı (myself endpoint)
[ ] improve-codebase-architecture "Keşfet" fazı çalıştırıldı → ilk sürtünme listesi
[ ] grill-with-docs ile mevcut domain dili dökümantasyona indirildi
[ ] (Eksikse) setup-precommit-dotnet ve setup-otel-dotnet retrofit
```

---

## Bir Adım Yanlış Gittiğinde

| Belirti | Atlanan Adım |
|---|---|
| Geliştiriciler aynı şeyi farklı isimle adlandırıyor | Senaryo 1/2 Aşama 1-3 (`grill-with-docs` + `CONTEXT.md`) |
| Yeni feature başlatınca "nereye yazacağım?" sorusu | Senaryo 1 Aşama 8-10 (`to-prd` + `scaffold-vsa-feature`) |
| Test'ler refactor'da kırılıyor | `tdd-dotnet` "davranışı test et" disiplinine geri dön |
| Production'da yavaşlık var ama nerede belli değil | `setup-otel-dotnet` atlanmış — Senaryo 1 Aşama 7 / Senaryo 2 Aşama 5 |
| Migration prod'da kilit yarattı | `ef-core-migration-review` atlanmış (Aşama 11) |
| Mimari kararlar tartışılıp sonra unutuluyor | `grill-with-docs` ADR teklif fonksiyonu kullanılmıyor |

---

## Daha Derin

- Skill yazma kuralları: [docs/skill-authoring.md](skill-authoring.md)
- Stack convention'ları: [docs/stack-conventions.md](stack-conventions.md)
- Aylık upstream sync prosedürü: [docs/sync-process.md](sync-process.md)
- Mimari kararlar: [docs/adr/](adr/)
