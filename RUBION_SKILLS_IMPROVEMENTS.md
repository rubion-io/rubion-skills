# Rubion Skills — İyileştirme Planı

> Bu dosya `rubion-skills` repo'sunun analizinde tespit edilen zayıf yönleri ve aksiyon planını içerir.
> Claude Code'a "bu dosyayı oku ve adımları sırayla uygula" denecek şekilde hazırlanmıştır.

**Analiz tarihi:** 2026-05-13
**Analiz edilen commit:** main branch HEAD (clone tarihinde)
**Genel skor:** 8.5/10 — blocking bug yok, ama 6 kategoride rötuş gerek.

---

## Özet — Hızlı Bakış

| # | Konu | Öncelik | Tahmini Süre |
|---|---|---|---|
| 1 | Eksik `examples/` klasörleri | YÜKSEK | 4 saat |
| 2 | Description'lar çok uzun (300+ char) | ORTA | 1.5 saat |
| 3 | ADR sayısı az — 5 yeni ADR yazılmalı | ORTA | 2.5 saat |
| 4 | `scaffold-microservice` Kubernetes inconsistency | DÜŞÜK | 30 dk |
| 5 | `dispatch-agents` execution önkoşulu muğlak | DÜŞÜK | 15 dk |
| 6 | `tdd-react-native` sadece Expo | DÜŞÜK | 30 dk |
| 7 | Eval setup yok (kalite ölçümü) | ORTA-YÜKSEK | 4-6 saat |
| 8 | PR template + skill review checklist yok | DÜŞÜK | 30 dk |

**Toplam tahmini iş:** 13-15 saat (2 günlük yoğun çalışma veya 1 hafta yan iş)

---

## 1. Eksik `examples/` Klasörleri (ÖNCELİK: YÜKSEK)

### Sorun

18 skill'in 11'inde `examples/` klasörü boş. Bu tutarsızlık iki problem yaratır:

1. **Skill kalitesi sinyali kayboluyor** — `tdd-dotnet` 3 örnekli, diğerleri 0 — kullanıcı hangisinin daha "olgun" olduğunu anlayamıyor.
2. **Heavy adaptation skill'leri somut çıktısız** — özellikle `tdd-react-native` ve `improve-codebase-architecture` adaptasyon seviyesi "heavy" olarak işaretli ama gerçek senaryo örneği yok.

### Mevcut Durum

```
Examples var olan skill'ler:
  - adapted/tdd-dotnet (3 example) ✓
  - adapted/grill-with-docs (1) ✓
  - adapted/tdd-react (1) ✓
  - adapted/diagnose-dotnet (1) ✓
  - skills/dispatch-agents (1) ✓
  - skills/ef-core-migration-review (1) ✓
  - skills/scaffold-vsa-feature (1) ✓

Examples eksik olan skill'ler:
  - adapted/improve-codebase-architecture ✗ KRİTİK
  - adapted/prototype ✗
  - adapted/tdd-react-native ✗ KRİTİK (heavy adaptation)
  - adapted/to-issues ✗
  - adapted/to-prd ✗
  - skills/migrate-legacy-to-vsa ✗ KRİTİK
  - skills/scaffold-microservice ✗ KRİTİK
  - skills/setup-otel-dotnet ✗
  - skills/setup-precommit-dotnet ✗
  - skills/setup-rubion-skills ✗
  - skills/tubitak-1507-document ✗ KRİTİK
```

### Aksiyon

Öncelik sırasıyla **en az 4 kritik skill'e** birer example ekle. Her example dosyası 100-300 satır, gerçek bir Rubion senaryosu üzerinden, kullanıcının kopyalayıp uyarlayabileceği seviyede.

#### 1.1 `adapted/tdd-react-native/examples/01-form-component-with-validation.md`

**Senaryo:** Bir login form component'i için TDD akışı.

İçerik şablonu:
- Component spec'i (props, davranış)
- Red: `expect(screen.getByLabelText('Email')).toBeOnTheScreen()` test'i — fail
- Green: minimal component
- Red: validation testi — fail
- Green: validation ekle
- Refactor: hook'a ekstrakt
- Maestro flow YAML örneği (E2E)

#### 1.2 `adapted/improve-codebase-architecture/examples/01-shallow-repository-deepening.md`

**Senaryo:** `OrderService` 600 satır, içinde 8 method. Refactor analizi.

İçerik şablonu:
- Mevcut `OrderService` snippet (kısaltılmış)
- "Silme testi" uygulaması — her method için
- Bulgular: 3 method shallow (sadece `_db.Set<T>` wrap), 2 method aslında domain invariant, 3 method handler olabilir
- Önerilen 3 derinleştirme: (1) Repository sil, (2) `Order.Cancel()` invariant'a taşı, (3) Geri kalanı VSA slice'lara böl
- VSA hedef yapısı kod örneğiyle

#### 1.3 `skills/migrate-legacy-to-vsa/examples/01-orderservice-to-vsa-walkthrough.md`

**Senaryo:** 600 satırlık `OrderService`'i Strangler Fig ile VSA'ya geçir.

İçerik şablonu:
- Önce durum: `OrderService` + `OrderRepository` + `OrdersController`
- Step 1: `CreateOrder` method'unu izole et — Command + Handler yaz
- Step 2: Controller'ı geçici adapter olarak bırak — testler kırılmasın
- Step 3: Endpoint ekle, controller route'larını duplikate et
- Step 4: Smoke test, eski route'ları kapat
- Step 5: Sonraki method'a geç (`CancelOrder`)
- Tüm akış için git commit mesaj örnekleri (her küçük adım ayrı commit)

#### 1.4 `skills/scaffold-microservice/examples/01-inventory-service-from-scratch.md`

**Senaryo:** Sıfırdan `Inventory.Api` mikroservisi (PostgreSQL + RabbitMQ + OTel).

İçerik şablonu:
- `dotnet new` komutları (sırayla)
- Paket installation tam liste
- `Program.cs` tam içeriği (kopya-yapıştırılabilir)
- `Dockerfile` (multi-stage build, non-root user)
- `docker-compose.override.yml` entry
- İlk smoke test: `curl http://localhost:5101/health` → 200 OK

#### 1.5 `skills/tubitak-1507-document/examples/01-ai-production-planning-application.md`

**Senaryo:** "AI-Destekli Üretim Planlama Sistemi" başvurusu — gerçek bir başvuru iskeleti.

İçerik şablonu:
- Bölüm 1: Amaç ve kapsam (doldurulmuş — Milagro use case'i)
- Bölüm 2: Özgün değer + literatür taraması (3-4 makale referansı ile)
- Bölüm 3: 4 Ar-Ge faaliyeti (her biri için teknolojik belirsizlik + başarı kriteri)
- Bölüm 4: İş paketi tablosu (Ay 1-18)
- Bölüm 5: Ekip ay-kişi planı
- **NOT:** Bu örnek "şablon" değil, çalışan bir hayali başvuru — kullanıcı kendi projesine adapte eder.

### Öncelik Sırası

1. **Bu hafta** → `migrate-legacy-to-vsa` + `scaffold-microservice` (en çok kullanılacak olanlar)
2. **Bir sonraki hafta** → `improve-codebase-architecture` + `tdd-react-native`
3. **TÜBİTAK öncesi** → `tubitak-1507-document`
4. **Sonra** → kalan 6 skill (`prototype`, `to-prd`, `to-issues`, `setup-otel-dotnet`, `setup-precommit-dotnet`, `setup-rubion-skills`)

---

## 2. Description'lar Çok Uzun (ÖNCELİK: ORTA)

### Sorun

5 skill'in `description` alanı 300+ karakter. Anthropic'in Agent Skills spec'ine göre:

> Description, Claude'un skill'i trigger etmek için baktığı ana metadata'dır. Önerilen 100-200 karakter; çok uzun olunca **context budget'tan yer alır** ve trigger keyword'leri seyrelir.

### Mevcut Durum

| Skill | Karakter | Sorun |
|---|---|---|
| `setup-rubion-skills` | 385 | Önkoşul listesi description'a yazılmış |
| `dispatch-agents` | 355 | Akış adımları description'a yazılmış |
| `improve-codebase-architecture` | 347 | Tüm pattern'ler tek cümlede sayılmış |
| `diagnose-dotnet` | 344 | Tool isimleri (dotnet-trace, vb.) description'a yazılmış |
| `prototype` | 326 | Tüm 4 mod tek cümlede |

### Aksiyon — Format Şablonu

Her description şu yapıyı izlesin (~150-200 karakter):

```
[ne yapar — 1 cümle]. [Trigger keyword'leri "X", "Y", "Z" şeklinde]. [Negatif sınır: Do NOT use for...]
```

### Önerilen Yeniden Yazımlar

**`setup-rubion-skills` (385 → 195):**

> ESKİ: Rubion skill kütüphanesini yeni bir projede kullanılabilir hale getirir. Issue tracker (GitHub veya Jira) ve domain doc (CONTEXT.md / ADR) yerleşimini docs/agents/ altına yazar. to-prd, to-issues, tdd-dotnet, diagnose-dotnet skill'lerinin ilk çalıştırılmasından önce bir kerelik çalıştırılır. "skill setup", "rubion init", "issue tracker config" denildiğinde kullan.

> YENİ: Rubion skill kütüphanesini bir projede bootstrap eder — issue tracker (GitHub/Jira) ve domain doc yerleşimini `docs/agents/` altına yazar. "skill setup", "rubion init" denildiğinde. Sadece bir kez, proje başlangıcında çalıştır.

**`dispatch-agents` (355 → 220):**

> ESKİ: Issue tracker'daki `ready-for-agent` etiketli ve birbirinden bağımsız issue'ları paralel subagent'lara dağıtır. Her subagent kendi git worktree'sinde çalışır, scaffold-vsa-feature + tdd-dotnet kombinasyonuyla implementasyonu yapar, PR açar. "İssue'ları dağıt", "paralel implementasyon", "AFK batch", "agent'lara böl" denildiğinde kullan.

> YENİ: Bağımsız `ready-for-agent` issue'larını paralel subagent'lara dağıtır — her biri git worktree'de scaffold-vsa-feature + tdd-dotnet zinciriyle implementasyonu yapar, PR açar. "Paralel implementasyon", "AFK batch" denildiğinde. Sıralı bağımlı işler için kullanma.

**`improve-codebase-architecture` (347 → 200):**

> ESKİ: Codebase'de derinleştirme fırsatlarını (deep module) tespit eder. .NET / VSA / CQRS bağlamında VSA vs Clean Architecture kararı, Domain vs Integration Event ayrımı, Repository pattern eleştirisi, Monolith→Mikroservis kararı dahil. "Mimari iyileştir", "refactor fırsatı bul", "tightly coupled modülleri ayır" denildiğinde kullan.

> YENİ: .NET codebase'de "deep module" fırsatlarını tespit eder — VSA/Clean kararı, Repository eleştirisi, Domain vs Integration Event, Monolith→Mikroservis dahil. "Mimari iyileştir", "refactor fırsatı bul" denildiğinde. Yeni proje iskeleti için kullanma.

**`diagnose-dotnet` (344 → 215):**

> ESKİ: .NET projelerinde disiplinli hata ayıklama döngüsü. Reproduce → minimize → hypothesize → instrument → fix → regression-test. dotnet-trace, BenchmarkDotNet, EF Core N+1, OpenTelemetry trace okuma ve RabbitMQ DLX ile desteklenmiş. "Diagnose this" / "debug this" / "something is broken" / performance sorunu bildirildiğinde kullan.

> YENİ: .NET'te disiplinli hata ayıklama: reproduce → minimize → hypothesize → instrument → fix. EF Core N+1, OTel trace, RabbitMQ DLX desteğiyle. "Debug this", "performance issue", "something is broken" denildiğinde. Yeni feature yazımı için kullanma.

**`prototype` (326 → 180):**

> ESKİ: Bir tasarımı bağlamadan önce keşfetmek için throwaway prototip kurar. Dört mod arasında dallanır — Backend CLI (logic POC, dotnet new console), Backend API (Minimal API endpoint POC), Frontend UI variants (Vite + ?variant=a|b|c), Mobile (Expo). "Bunu prototip et", "POC yap", "tasarımı dene" denildiğinde kullan.

> YENİ: Throwaway prototip kurar — Backend CLI, Minimal API, Vite UI variants veya Expo modlarından biriyle. "Prototip et", "POC yap", "tasarımı dene" denildiğinde. Production kod için kullanma — çıktı silinir.

### Aksiyon Maddesi

Yukarıdaki 5 skill'in `description` alanını yeniden yazılmış halleriyle değiştir. CHANGELOG.md'ye not düş:
```
### Changed
- 5 skill description'ı kısaltıldı (~%40 azalma) — trigger doğruluğu için keyword density artırıldı, negatif sınırlar (Do NOT use for) eklendi.
```

---

## 3. ADR Sayısı Az — 5 Yeni ADR (ÖNCELİK: ORTA)

### Sorun

Sadece 3 ADR var (VSA, PostgreSQL, MediatR). Skill içeriklerinde geçen aşağıdaki kararlar **ADR'ye taşınmadığı için** her skill aynı kararı kendi başına tekrar ediyor. Bu DRY ihlali ve **kararın bir yerden değişmesi durumunda her skill'i ayrı güncelleme** zorunluluğu doğuruyor.

### Yazılacak ADR'ler

#### 3.1 `docs/adr/0004-database-per-service.md`

**Karar:** Mikroservislerin her biri kendi veritabanına sahip; shared DB kullanılmaz. Cross-service raporlama için CDC + data warehouse.

**Kaynak:** `improve-codebase-architecture/SKILL.md` "Database-per-service vs Shared DB" bölümü.

**İçerik iskeleti:**
- Bağlam: Mikroservis'e geçişte iki yaklaşım — shared DB (modüler monolith) vs database-per-service
- Karar: Database-per-service default
- Gerekçe: Bağımsız deploy, şema izolasyonu, ölçeklenebilirlik
- Trade-off: Cross-service JOIN yok → analytics için ayrı patikalı (CDC → data warehouse → read replica)
- Saga pattern: distributed transaction yerine

#### 3.2 `docs/adr/0005-masstransit-rabbitmq.md`

**Karar:** Mesajlaşma stack'i = MassTransit + RabbitMQ (default). Azure Service Bus sadece müşteri Azure stack zorunlu kılıyorsa.

**Kaynak:** `scaffold-microservice/SKILL.md` paket listesinde zımni karar.

**İçerik iskeleti:**
- Bağlam: .NET mesajlaşma kütüphanesi seçimi — raw RabbitMQ.Client, MassTransit, NServiceBus, CAP
- Karar: MassTransit + RabbitMQ default
- Gerekçe: Saga, retry, DLX policy out-of-box; consumer abstraction transport-agnostic
- Alternatif (Azure Service Bus): MassTransit transport değiştirilerek aynı kod çalışır
- Reddedilenler: NServiceBus (lisans maliyeti), CAP (topluluk küçük)

#### 3.3 `docs/adr/0006-observability-stack.md`

**Karar:** OpenTelemetry (lib) + Jaeger (dev) + Tempo (prod) + Prometheus (metrics) + Serilog (logs).

**Kaynak:** `setup-otel-dotnet/SKILL.md`, `diagnose-dotnet/SKILL.md`.

**İçerik iskeleti:**
- Bağlam: APM seçimi — Application Insights, Datadog, New Relic, OpenTelemetry stack
- Karar: OpenTelemetry-native, vendor-neutral
- Dev: Jaeger all-in-one (Docker)
- Prod: Grafana Tempo (trace) + Prometheus (metric) + Loki (log) — tüm Grafana ecosystem
- Gerekçe: Vendor lock-in yok, müşteri ortamına portable
- Reddedilenler: Datadog/New Relic (maliyet), App Insights (Azure'a bağımlı)

#### 3.4 `docs/adr/0007-ef-core-over-dapper.md`

**Karar:** EF Core default ORM. Dapper sadece perf-critical path'lerde (raw SQL gerekli, hot path).

**Kaynak:** `improve-codebase-architecture/SKILL.md` "Repository pattern eleştirisi" bölümü.

**İçerik iskeleti:**
- Bağlam: .NET ORM seçimi — EF Core, Dapper, NHibernate, raw ADO.NET
- Karar: EF Core default; Dapper escape hatch
- Gerekçe: Migration support, LINQ, change tracking, ekip familiarity
- Dapper ne zaman: çok büyük read query, complex projection, EF Core'un üretemediği SQL
- Anti-pattern: Repository pattern + EF Core (silme testini geçmez — bkz. improve-codebase-architecture)

#### 3.5 `docs/adr/0008-test-stack.md`

**Karar:** xUnit + FluentAssertions + NSubstitute + Testcontainers (.NET); Vitest + RTL + MSW (React); Jest + RTL-RN + Maestro (RN).

**Kaynak:** `tdd-dotnet/SKILL.md`, `tdd-react/SKILL.md`, `tdd-react-native/SKILL.md`.

**İçerik iskeleti:**
- Bağlam: Test stack seçimleri (assert lib, mock lib, integration DB)
- .NET tarafı: xUnit (NUnit'e karşı), NSubstitute (Moq'a karşı — lisans), Testcontainers (in-memory'ye karşı — gerçek DB)
- React tarafı: Vitest (Jest'e karşı — speed), MSW (manual mock'a karşı)
- RN tarafı: Maestro (Detox'a karşı — modernlik)
- Gerekçe: Her seçim için 1-2 cümle

### Skill Güncellemeleri (ADR'lerden sonra)

ADR'ler yazıldıktan sonra ilgili skill'lerde **"bkz. ADR-NNN"** referansı ekle, tekrarlanan içeriği kaldır:

| Skill | Kaldırılacak Bölüm | Yerine |
|---|---|---|
| `improve-codebase-architecture` | "Database-per-service vs Shared DB" detayı | "Bkz. ADR-004" özet + 1 cümle |
| `scaffold-microservice` | MassTransit paket listesi gerekçesi | "Bkz. ADR-005" özet |
| `setup-otel-dotnet` | "Jaeger vs Tempo" tartışması | "Bkz. ADR-006" özet |
| `diagnose-dotnet` | EF Core tercih gerekçesi | "Bkz. ADR-007" özet |
| `tdd-dotnet`, `tdd-react`, `tdd-react-native` | "Neden bu lib?" gerekçeleri | "Bkz. ADR-008" özet |

---

## 4. `scaffold-microservice` Kubernetes Inconsistency (ÖNCELİK: DÜŞÜK)

### Sorun

Frontmatter'da:
```yaml
stack: [dotnet, csharp, docker, kubernetes]
```

Ama içerikte Kubernetes manifest'i yok — sadece Docker + docker-compose var. Bu yanıltıcı.

### Aksiyon — İki Seçenek

**Seçenek A (önerilen):** Stack listesinden `kubernetes` çıkar.

```yaml
stack: [dotnet, csharp, docker]
```

Açıklama: Kubernetes ihtiyacı henüz Rubion müşteri projelerinde yok. Olduğunda ayrı bir skill (`scaffold-k8s-deployment`) yazılır.

**Seçenek B:** `examples/02-k8s-deployment.md` ekle.

İçerik:
- `Deployment.yaml` (3 replica, resource limits, health checks)
- `Service.yaml` (ClusterIP)
- `Ingress.yaml` (NGINX ingress controller)
- `ConfigMap.yaml` (appsettings dış kaynağı)
- `Secret.yaml` (connection string için)
- Helm chart template (opsiyonel)

**Karar Notu:** Antalya Teknokent projelerinde 2026 sonuna kadar K8s'e ihtiyaç olur mu? Olmayacaksa **Seçenek A** doğru. Olacaksa **Seçenek B** + ayrı `setup-k8s-cluster` skill'i.

---

## 5. `dispatch-agents` Execution Önkoşulu Muğlak (ÖNCELİK: DÜŞÜK)

### Sorun

Skill, Claude Code'un `Agent` tool'unu paralel çağırma varsayıyor:
```
Agent({
  description: "Implement <ISSUE-ID>",
  subagent_type: "general-purpose",
  isolation: "worktree",
  run_in_background: true,
  prompt: "..."
})
```

Bu API surface **Claude Code'un belirli versiyonlarında** var (`isolation: worktree` ve `run_in_background` özellikle). Cursor'da bu skill'in nasıl çalışacağı belirsiz.

### Aksiyon

`SKILL.md`'nin "Ön Koşullar" bölümüne şu maddeyi ekle (mevcut listenin üstüne):

```markdown
## Ön Koşullar

- **Claude Code v2.x+** ve `Agent` tool'unun subagent dispatch desteği — `isolation: "worktree"` ve `run_in_background: true` parametreleri.
- **Cursor**'da bu skill native çalışmaz. Cursor için aşağıdaki "Karşı Pattern: Manuel Mod" bölümünü uygula.
- [`setup-rubion-skills`](../setup-rubion-skills/SKILL.md) çalıştırılmış (`docs/agents/issue-tracker.md` var)
- Git worktree desteği aktif (`git --version` ≥ 2.5)
... (kalan mevcut maddeler)
```

Ek olarak skill'in başına şunu ekle:

```markdown
> **Önemli:** Bu skill bir **orchestrator**'dur — Claude Code'un Agent dispatch yeteneğini kullanır.
> Eğer kullandığın araç (Cursor, VS Code Copilot Chat, vb.) paralel subagent desteği vermiyorsa,
> sonundaki "Manuel Mod" bölümüne git.
```

---

## 6. `tdd-react-native` Sadece Expo (ÖNCELİK: DÜŞÜK)

### Sorun

Skill içeriği Expo CLI, Expo SDK, `expo-router`, EAS Build üzerine kurulu. Bare React Native (Expo olmayan) projeler için varyant yok. Müşteri projesi Expo kullanmayabilir.

### Aksiyon — İki Seçenek

**Seçenek A (hızlı):** Skill'i rename'le ve sınır çiz.

- Skill adını `tdd-react-native-expo` yap (klasör + frontmatter)
- Description'ı güncelle: "Expo öncelikli RN projeler için. Bare RN için ayrı skill (henüz yok)."
- README ve getting-started.md'de referansları güncelle

**Seçenek B (kapsamlı):** Mevcut skill'de bir bölüm aç.

`SKILL.md`'nin sonuna "Bare React Native (Expo Olmayan)" bölümü ekle:

```markdown
## Bare React Native — Expo Olmayan Projeler

### Setup Farklılıkları

- **CLI:** `npx @react-native-community/cli init` (Expo `expo init` yerine)
- **Test runner:** Jest config `react-native` preset (Expo `jest-expo` yerine)
- **Mock'lar:** Native modüller (`react-native-permissions`, `react-native-fs` vb.) için
  `jest.mock('module-name', () => mockImplementation)` zorunlu

### Mock Örnek

\`\`\`typescript
// __mocks__/react-native-permissions.ts
export const PERMISSIONS = { IOS: {}, ANDROID: {} };
export const RESULTS = { GRANTED: 'granted', DENIED: 'denied' };
export const check = jest.fn().mockResolvedValue('granted');
export const request = jest.fn().mockResolvedValue('granted');
\`\`\`

### E2E — Detox vs Maestro (Bare RN için)

Expo'da Maestro varsayılan. Bare RN'de **Detox da viable** çünkü native build üzerinde tam kontrol var. Karar:
- **Maestro:** Hızlı setup, YAML script, cross-platform tek dil
- **Detox:** JavaScript test API, daha mature, daha karmaşık setup
- Default önerimiz: Maestro (basitlik için), ama Detox'a geçiş skill'in eski versiyonunda dokümante kalmış olmalı.
```

**Öneri:** Seçenek A daha temiz. Bare RN için ayrı skill yazıldığında split etmek kolay. Şu anda Rubion projelerinde Expo daha yaygın.

---

## 7. Eval Setup Yok — Kalite Ölçümü (ÖNCELİK: ORTA-YÜKSEK)

### Sorun

Skill'lerin gerçekten doğru tetiklenip tetiklenmediği **ölçülmüyor**. Anthropic'in `skill-creator` skill'i şu pattern'i öneriyor:

> Her skill için 20 eval query (mix should-trigger + should-not-trigger). JSON formatında saklanır. Periyodik çalıştırılarak skill description'ın doğruluğu ölçülür.

Şu anda Rubion-skills'de:
- Eval JSON dosyaları yok
- Smoke test repo'su (`rubion-skills-test/`) referans edilmiş ama yok
- "Bir skill çalıştı mı?" sorusunun cevabı manuel gözlem

### Aksiyon

#### 7.1 Eval Klasör Yapısı

```
rubion-skills/
└── evals/
    ├── README.md              ← eval nasıl çalıştırılır
    ├── runner.ts              ← basit test runner (Node script)
    └── skills/
        ├── tdd-dotnet.json
        ├── diagnose-dotnet.json
        ├── grill-with-docs.json
        ├── ... (her skill için)
```

#### 7.2 Eval Format

Her skill için `evals/skills/<skill-name>.json`:

```json
{
  "skill": "tdd-dotnet",
  "description": "Description trigger doğruluğu için 20 query",
  "queries": [
    { "query": ".NET Order handler için TDD yapalım", "should_trigger": true },
    { "query": "MediatR command'ı için önce test yazalım", "should_trigger": true },
    { "query": "xUnit ile integration test ekleyelim", "should_trigger": true },
    { "query": "React component nasıl test edilir?", "should_trigger": false },
    { "query": "Sipariş feature'ını VSA'ya çevir", "should_trigger": false },
    { "query": "Migration güvenli mi kontrol et", "should_trigger": false }
  ]
}
```

Her dosyada **10 positive + 10 negative** query olsun. Negative query'ler özellikle önemli — başka skill'lerle çakışmayı yakalar.

#### 7.3 Runner

Basit bir Node/TypeScript runner:

```typescript
// evals/runner.ts
// Her query'i Anthropic API'ye gönder, hangi skill trigger oldu kontrol et,
// should_trigger=true ile match ise PASS, değilse FAIL.
// Çıktı: skill başına accuracy yüzdesi.
```

Run komutu:
```bash
npx tsx evals/runner.ts --skill=tdd-dotnet
npx tsx evals/runner.ts --all
```

#### 7.4 CI Entegrasyonu

`.github/workflows/eval.yml`:

```yaml
name: Skill Evals
on:
  pull_request:
    paths:
      - 'adapted/**/SKILL.md'
      - 'skills/**/SKILL.md'

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx tsx evals/runner.ts --changed-only
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Sonuç:** PR açıldığında eğer description değişikliği accuracy'i %X'in altına düşürüyorsa CI fail eder.

### Tahmini İş

- 18 skill × 20 query = 360 query yazma → 3-4 saat
- Runner script → 1-2 saat
- CI integration → 30 dk
- Toplam: 4-6 saat

---

## 8. PR Template + Skill Review Checklist (ÖNCELİK: DÜŞÜK)

### Sorun

Yeni skill PR'larında veya güncellemelerde tutarlı review yok. Yazım kalitesi reviewer'a göre değişebilir.

### Aksiyon

#### 8.1 `.github/PULL_REQUEST_TEMPLATE.md`

```markdown
## Değişiklik Tipi

- [ ] Yeni skill (sıfırdan)
- [ ] Mevcut skill güncellemesi
- [ ] ADR ekleme/güncelleme
- [ ] Doc-only değişiklik
- [ ] Vendor sync (mattpocock/skills)
- [ ] Bug fix
- [ ] Refactor

## Skill İçin Checklist (Yeni veya Güncellenen Skill İse)

- [ ] Frontmatter eksiksiz: `name`, `description`, `stack` (gerekiyorsa)
- [ ] Adapted skill ise: `adapted_from`, `upstream_commit`, `last_reviewed`, `adaptation_level`
- [ ] Description 100-250 karakter arası
- [ ] Description'da trigger keyword'leri var ("X denildiğinde", "Y için kullan")
- [ ] Description'da negatif sınır var ("Do NOT use for..." benzeri)
- [ ] SKILL.md 500 satırı geçmiyor (geçiyorsa referans dosyaya bölünmüş)
- [ ] En az 1 `examples/*.md` dosyası var
- [ ] Kod örnekleri gerçek Rubion stack'iyle uyumlu (.NET 8+, xUnit, MediatR, vb.)
- [ ] "Yapma" / anti-pattern bölümü var
- [ ] "Kontrol Listesi" bölümü ile bitiyor
- [ ] ADR ile çelişme yok (varsa açıkça belirtilmiş)
- [ ] `evals/skills/<skill-name>.json` güncellenmiş (yeni skill ise oluşturulmuş)

## ADR İçin Checklist (ADR Eklendi/Değiştirildiyse)

- [ ] Numaralandırma sıralı (0001, 0002, ... — atlama yok)
- [ ] Başlık net (örn: "0004-database-per-service.md")
- [ ] Bağlam, Karar, Gerekçe, Sonuçlar bölümleri var
- [ ] Reddedilen alternatifler dokümante edilmiş
- [ ] İlgili skill'lerde "bkz. ADR-NNN" referansı eklenmiş

## Test

- [ ] Eval suite local'de çalıştırıldı: `npx tsx evals/runner.ts --skill=<name>`
- [ ] Smoke test bir gerçek projede yapıldı (rubion-skills-test veya bir Rubion projesi)

## CHANGELOG

- [ ] `CHANGELOG.md` "Unreleased" bölümüne entry eklendi
```

#### 8.2 `CODEOWNERS` (Opsiyonel)

```
# .github/CODEOWNERS
adapted/                    @muratkizilelma
skills/                     @muratkizilelma
docs/adr/                   @muratkizilelma
vendor/                     @muratkizilelma   # değişiklik istenmiyor
*.md                        @muratkizilelma
```

Bu, **kimse adına PR merge edilmeyecek** demek değil; sadece review request'i otomatik atayacak.

---

## Çalışma Planı — Önerilen Sıra

### Hafta 1 — Quick Wins (Düşük Risk, Yüksek Görünür Değer) ✓ TAMAMLANDI

1. ~~**Gün 1 (2 saat):** Description'lar kısaltma (madde 2) + scaffold-microservice K8s düzeltmesi (madde 4)~~ ✓
2. ~~**Gün 2-3 (4 saat):** 4 kritik example yazma (madde 1.1-1.4)~~ ✓
3. ~~**Gün 4 (1 saat):** PR template + dispatch-agents önkoşul + tdd-react-native Bare RN bölümü (madde 5, 6, 8)~~ ✓

### Hafta 2 — ADR'ler (Karar Yazma) ✓ TAMAMLANDI

4. ~~**Gün 1-2 (3 saat):** 5 yeni ADR yazma (madde 3.1-3.5)~~ ✓
5. ~~**Gün 3 (1 saat):** Skill'lerde ADR referansları + tekrarlanan içeriği kaldırma~~ ✓

### Hafta 3 — Eval Setup (Uzun Vadeli Yatırım) ✓ TAMAMLANDI

6. ~~**Gün 1-2 (4 saat):** Eval format + 360 query yazma~~ ✓
7. ~~**Gün 3 (2 saat):** Runner script + CI integration~~ ✓

### Hafta 4 — TÜBİTAK Özel ✓ TAMAMLANDI

8. ~~**Gün 1-2 (2 saat):** `tubitak-1507-document` için example (madde 1.5) — TÜBİTAK başvurusu yaklaşıyorsa öne çek~~ ✓

---

## Done Definition

Bu plan tamamlandığında repo şu seviyeye gelmiş olur:

- [x] **Examples coverage:** En az 4 kritik skill'de `examples/*.md` var (toplam 11/18 → en az 11/18 olmalı, ideali 15/18) — ✓ Hafta 1'de 4 example eklendi
- [x] **Description quality:** Hiç bir description 250 karakteri geçmiyor — ✓ 5 description kısaltıldı
- [x] **ADR coverage:** 8 ADR var (3 → 8) — ✓ Hafta 2'de 5 ADR eklendi (0004-0008)
- [x] **Eval coverage:** Her skill için en az 20 query, CI'da otomatik çalışıyor — ✓ Hafta 3'de 18×20=360 query + runner.ts + eval.yml
- [x] **PR discipline:** Template var, checklist zorunlu, CODEOWNERS atanmış — ✓ Hafta 1'de yapıldı
- [x] **Smoke test repo'su:** `rubion-skills-test/` var ve en az 3 skill orada test edilmiş — ✓ https://github.com/muratkizilelma/rubion-skills-test (scaffold-vsa-feature, tdd-dotnet, migrate-legacy-to-vsa; 14/14 test geçti)

Bu duruma ulaşınca repo "internal asset" seviyesinden **"public showcase"** seviyesine taşınabilir — TÜBİTAK 1507 başvurusunda "AI-augmented development methodology" çıktısı olarak güçlü bir referans olur.

---

## Riskler ve Notlar

**Risk 1:** Bu planın tümünü tek başına yapmak 2-3 hafta yan iş, 1 hafta tam zamanlı iş. Eğer Rubion müşteri projeleri başlamışsa **eval setup'ı (madde 7) ertelenebilir**, ama madde 1-3 mutlaka yapılmalı.

**Risk 2:** Eval setup yapılmadan description değişikliği "trigger doğruluğunu nasıl etkiledi?" sorusu cevapsız kalır. İdeal sıra: önce eval (madde 7), sonra description kısaltma (madde 2) — böylece before/after ölçülebilir. Ama eval setup ağır iş; pragmatik tercih: önce description kısalt, sonra eval kur, regression'u sonradan ölç.

**Risk 3:** ADR'leri yazarken skill içeriklerini de güncellemek zorundasın. Eğer bu güncellemeler yapılmazsa duplicate information artar (skill içinde de detay var, ADR'de de). Disiplin: ADR yazıldığında ilgili skill'in o bölümünü "Bkz. ADR-NNN" özet cümlesine çevir.

**Risk 4:** `vendor/` klasörü brief'te "DOKUNMA" dedi. Ama upstream Pocock yeni bir iyileştirme yaparsa (örn. `tdd` skill'inin yeni bir versiyonu), bu plan kapsamında değil — `docs/sync-process.md`'deki aylık ritüel ile ayrı bir akış.

---

## Claude Code İçin Çalışma Talimatı

1. Bu dosyayı tamamen oku.
2. Soruların varsa sırayla sor (5'i geçmesin).
3. **Hafta 1**'i tek seferde bitir. Her madde sonunda commit at ve özet ver:
   - `chore(skills): shorten 5 descriptions per IMPROVEMENTS.md §2`
   - `fix(scaffold-microservice): remove kubernetes from stack metadata per §4`
   - `docs(examples): add migrate-legacy-to-vsa walkthrough per §1.3`
4. Her hafta sonunda **kullanıcıdan onay al**, sonra bir sonraki haftaya geç.
5. Bu dosya bir checklist — tamamlananı `- [ ]` yerine `- [x]` yap. Plan ilerledikçe canlı doküman.
6. Türkçe yaz. Kod örnekleri C#/TS standartlarına uygun olsun.
7. CHANGELOG.md "Unreleased" bölümünü her commit sonrası güncelle.

---

**Plan versiyonu:** 1.0
**Hazırlayan:** Murat Kızılelma + Claude
**Hazırlama tarihi:** 2026-05-13
**Tahmini total iş:** 13-15 saat (yan iş olarak 3-4 hafta)
