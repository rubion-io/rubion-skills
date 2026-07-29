---
name: analyze-project
description: Orchestrator — analyze-codebase + analyze-functional zincirini otomatik çalıştırıp projeyi uçtan uca analiz eder, PROJECT_ANALYSIS.md üretir. "Projeyi analiz et", "bu projeyi anlat" denildiğinde. Tek boyut için alt skill'i kullan.
stack: []
---

# Analyze Project — Orchestrator

> **Önemli:** Bu skill bir **orchestrator**'dur — [`analyze-codebase`](../analyze-codebase/SKILL.md) ve [`analyze-functional`](../analyze-functional/SKILL.md)'ı otomatik, sırayla çalıştırır. Rubion'un "öner, kullanıcı tetiklesin" konvansiyonunun **bilinçli istisnası**dır (`dispatch-agents` gibi): kullanıcı tek komutla uçtan uca rapor ister; iki alt adım arasında onay sormak akışı bozar. Zincir **raporla biter** — sonraki skill'ler (grill-with-docs vb.) yalnızca önerilir, tetiklenmez.

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Ürettiği şey: **`PROJECT_ANALYSIS.md`** — projenin hem **teknik röntgeni** (envanter + sağlık bulguları) hem **ürün haritası** (ekranlar, aksiyon zincirleri, akışlar, domain) tek raporda. Legacy bir projeyi devralırken ilk çalıştırılacak analiz; `setup-rubion-skills` wizard'ı Legacy path'lerde bunu ilk build adımı olarak önerir.

> **Ön koşullar:**
> - Mevcut kod tabanı. Boş/yeni projede reddet → `scaffold-backend` / `scaffold-frontend-react` öner.
> - `setup-rubion-skills` + `setup-memory` önerilir (raporun evi `docs/memory/99-meta/`) ama zorunlu değil — memory yoksa rapor repo köküne yazılır.

---

## Akış

### 1. Ön kontrol — tazelik

- `PROJECT_ANALYSIS.md` ara: `docs/memory/99-meta/` → repo kökü.
- **Varsa:** frontmatter `analyzed_commit` ile `git rev-parse --short HEAD` karşılaştır:
  - **Aynı** → tam taramayı boşa çalıştırma; sor: "Rapor güncel (<tarih> @ <sha>). Yeniden mi çalıştırayım, mevcut raporu mu özetleyeyim?"
  - **Geride** → tazeleme modu: analizi çalıştır + rapor sonuna "Son analizden bu yana" notu (`git log --oneline <eski-sha>..HEAD` özeti: kaç commit, hangi modüller).
- **Yoksa:** tam analiz.
- **Boş proje kontrolü:** kaynak dosya sayısı ~0 ise dur; scaffold skill'lerini öner.

### 2. Teknik analiz — `analyze-codebase`

Skill tool'u ile `analyze-codebase`'i çağır. Tamamlanınca kullanıcıya **ilerleme notu** ver (onay bekleme):

> "Teknik tarama bitti: 34 endpoint, 18 tablo, 5 modül; 23 bulgu (2 Critical). Fonksiyonel analize geçiyorum."

### 3. Fonksiyonel analiz — `analyze-functional`

Skill tool'u ile `analyze-functional`'ı çağır. §3 envanteri aynı oturumda taze olduğundan girdi kontrolünden doğrudan geçer.

### 4. Sentez — orchestrator'ın kendi işi

Alt skill'ler §2-§4'ü doldurdu. Sen şunları yazarsın:

- **§1 Yönetici Özeti** (≤10 madde): proje ne (1-2 madde) · genel sağlık cümlesi · en kritik 3 risk · en değerli 3 fırsat · harita sürprizleri (yarım feature, beklenmedik iş kuralı).
- **§5 Memory Besleme:** alt skill katkılarını birleştir — `memorize-module` aday top 5 (churn) · glossary adayları · ADR adayları. Bunlar **öneri listesidir** — memory'nin insan-onaylı katmanlarına yazılmaz.
- **§6 Sıradaki Adımlar** — duruma göre öner:

| Durum | Öneri |
|---|---|
| `CONTEXT.md` yok | `grill-with-docs` (Rol 1) — §2 haritayı CONTEXT.md + ADR'ye resmileştir |
| Mimari aday var (§4-A) | `improve-codebase-architecture` → `scaffold-adr` |
| Churn top-5 doc'suz | `memorize-module` (aday listesi §5.1'de) |
| Critical güvenlik bulgusu | ilgili review skill (`harden-webhook`, `supabase-migration-review`, `ef-core-migration-review`) |
| Service + Repository yapısı | `migrate-legacy-to-vsa` (improve-arch grilling'i onaylarsa) |

### 5. Yerleşim + bitiş

- `docs/memory/` varsa: `docs/memory/99-meta/PROJECT_ANALYSIS.md` + `MOC.md`'ye link satırı (idempotent — satır varsa ekleme).
- Yoksa: repo köküne + rapora not: "`setup-memory` kurulduğunda bu dosya `docs/memory/99-meta/`'ya taşınır."
- Kullanıcıya kapanış: rapor yolu + 3 cümlelik özet + §6'nın ilk önerisi. **Başka skill tetiklenmez — zincir burada biter.**

---

## Rapor Şablonu

```markdown
---
id: project-analysis
type: analysis
status: active
analyzed_commit: <git rev-parse --short HEAD>
last_reviewed: <YYYY-MM-DD>
---

# Proje Analizi — <proje adı>

## 1. Yönetici Özeti

## 2. Fonksiyonel Harita
> Analiz: <tarih> @ <sha> — analyze-functional
### 2.1 Ekran / Sayfa Haritası
### 2.2 Aksiyon Zincirleri
### 2.3 Kullanıcı Akışları
### 2.4 Domain Varlıkları
### 2.5 Ne Yapıyor / Ne Yapmıyor

## 3. Teknik Envanter
> Analiz: <tarih> @ <sha> — analyze-codebase
### 3.1 Endpoint'ler
### 3.2 Veritabanı
### 3.3 Sayfalar / Ekranlar
### 3.4 Modüller
### 3.5 Entegrasyonlar & Background İşler

## 4. Teknik Sağlık Bulguları
### 4.1 Bulgular
### 4.2 Churn × Testsiz Kesişimi
### 4.3 Kötü Görünüyor Ama Sorun Değil

## 5. Memory Besleme Önerileri
### 5.1 memorize-module adayları (churn top 5)
### 5.2 Glossary adayları
### 5.3 ADR adayları

## 6. Sıradaki Adımlar
```

Alt skill'ler kendi bölümünü yazar; solo çalışan alt skill diğer bölümü `> henüz çalıştırılmadı — <skill>` notuyla boş bırakır.

---

## Manuel Mod (skill-to-skill çağrı olmayan ortam)

Cursor vb. araçlarda Skill tool yoksa: `skills/analyze-codebase/SKILL.md` ve `skills/analyze-functional/SKILL.md`'yi **sırayla oku ve talimatlarını bu sırayla kendin uygula**, sonra Adım 4 Sentez'i izle. Davranış birebir aynı — yalnızca dispatch mekanizması farklı.

---

## Yapma

- ✗ Alt skill'lerin işini inline yapmak — delege et; Manuel Mod'da bile önce SKILL.md'lerini oku
- ✗ Zinciri uzatmak — 2 halka: codebase + functional. `grill-with-docs` / `improve-codebase-architecture` / `memorize-module` otomatik **tetiklenmez**, önerilir
- ✗ Fazlar arasında kullanıcı onayı beklemek — ilerleme notu ver, akmaya devam et (orchestrator'ın varlık sebebi kesintisiz akış)
- ✗ Kod değiştirmek, fix uygulamak — read-only analiz
- ✗ `20-modules/`, `30-decisions/`, `50-glossary/`, `CONTEXT.md`'ye yazmak — tek çıktı `PROJECT_ANALYSIS.md` (+ MOC linki)
- ✗ Rapor günceli varken sormadan full re-run — token israfı
- ✗ Boş projede "analiz" üretmek — scaffold öner

---

## Kontrol Listesi

- [ ] Tazelik kontrolü yapıldı (mevcut rapor + HEAD karşılaştırması; boş proje kontrolü)
- [ ] `analyze-codebase` çalıştı → §3-4 dolu
- [ ] Aralarda ilerleme notu verildi, onay istenmedi
- [ ] `analyze-functional` çalıştı → §2 dolu
- [ ] §1 Yönetici Özeti ≤10 madde
- [ ] §5 Memory Besleme birleştirildi (churn top 5 + glossary + ADR adayları)
- [ ] §6 Sıradaki Adımlar duruma göre yazıldı
- [ ] Rapor doğru yerde (`99-meta/` veya kök) + memory varsa MOC.md linki
- [ ] Zincir raporla bitti — başka skill tetiklenmedi
