# Rubion Skill'leri — Sözlü ve Teknik Açıklama

> Bu doküman, `skills/` (yerli) ve `adapted/` (upstream'den türetilmiş) altındaki **33 skill'in** her birini iki katmanda anlatır:
>
> - **🗣️ Sözlü** — bir ekip arkadaşına anlatır gibi: bu skill ne işe yarar, ne zaman elini uzatırsın?
> - **⚙️ Teknik** — motor kapağının altı: hangi adımları izler, ne üretir, hangi stack'e dokunur?
>
> Hızlı referans tablosu için: **[skills-catalog.md](./skills-catalog.md)**. Senaryo bazlı başlangıç için: **[getting-started.md](./getting-started.md)**.

---

## İçindekiler

- [Skill nedir, nasıl tetiklenir?](#skill-nedir-nasıl-tetiklenir)
- [🚀 Setup — Bir kez çalıştır](#-setup--bir-kez-çalıştır)
- [🧱 Scaffold — Yeni iskelet üret](#-scaffold--yeni-iskelet-üret)
- [✅ TDD — Test-Driven Development](#-tdd--test-driven-development)
- [🧠 Memory — Bilgi yönetimi](#-memory--bilgi-yönetimi)
- [🔬 Analyze — Mevcut projeyi tanı](#-analyze--mevcut-projeyi-tanı)
- [🔍 Diagnose & Review — Teşhis ve denetim](#-diagnose--review--teşhis-ve-denetim)
- [🔄 Refactor](#-refactor)
- [🧪 Prototype](#-prototype)
- [🎨 Design](#-design)
- [🎯 Orchestrate](#-orchestrate)
- [📝 Plan & Document](#-plan--document)
- [Terimler sözlüğü](#terimler-sözlüğü)

---

## Skill nedir, nasıl tetiklenir?

Her skill bir `SKILL.md` dosyasıdır: başında `name` + `description` içeren bir frontmatter, altında adım adım talimat. Claude Code, kullanıcının cümlesini skill'in `description`'ındaki tetikleyici ifadelerle eşleştirir ("migration güvenli mi?", "TDD ile yaz" gibi) ve ilgili skill'i devreye alır. Skill devreye girince, o dosyadaki talimatlar Claude'un o an izleyeceği yönerge haline gelir — yani skill, **modelin davranışını o göreve özel olarak yeniden programlar**.

İki kaynak vardır:
- **`skills/`** — tamamen Rubion için sıfırdan yazılmış yerli skill'ler (upstream eşdeğeri yok).
- **`adapted/`** — [`mattpocock/skills`](https://github.com/mattpocock/skills) reposundan türetilmiş; frontmatter'da `adapted_from`, `upstream_commit` ve `adaptation_level` (light / medium / heavy) taşır.

Çoğu skill, Andrej Karpathy'nin dört ilkesine yaslanır: **(1)** Think Before Coding, **(2)** Simplicity First, **(3)** Reversibility, **(4)** Goal-Driven Execution. Bunlar `CLAUDE.md` baseline'ında yaşar ve skill'ler adımlarında bu ilkelere açıkça atıf yapar.

---

## 🚀 Setup — Bir kez çalıştır

Proje ömründe genelde bir kez çalışan, altyapı kuran skill'ler.

### `setup-rubion-skills` — Wizard / yol haritası
*stack: genel*

**🗣️ Sözlü.** "Nereden başlasam?" sorusunun cevabı. Projeyi tanır, sana birkaç soru sorar (issue tracker'ın ne, proje yeni mi legacy mi, hangi stack?) ve sana özel bir skill kullanım yol haritası çıkarır. İlk kurulumu yapar, sonra hangi skill'i ne zaman çalıştıracağını söyler. İstediğin zaman tekrar çalıştırabilirsin — nerede kaldığını hatırlar.

**⚙️ Teknik.** Dört fazlı bir sihirbaz:
- **Faz A (Foundation):** repo'yu keşfeder, sırayla 5 soru sorar — issue tracker (GitHub/Jira), domain doc yerleşimi (`docs/agents/`), Karpathy baseline'ının `CLAUDE.md`'ye yerleştirilmesi, hook'lar, analiz dökümanı varlığı. Onay alıp yazar.
- **Faz B (Diagnose):** proje yaşı ve stack'i belirler.
- **Faz C (Recommend):** `zero/legacy × stack` karar matrisinden sıradaki skill'i önerir.
- **Faz D (Re-Entry):** idempotent — hangi adımların tamamlandığını tespit edip kaldığı yerden devam eder.

### `setup-memory` — LLM hafıza iskeleti
*stack: genel*

**🗣️ Sözlü.** Projenin "kurumsal hafızasını" kuran skill. Ajanların (ve insanların) modülleri, kararları ve terimleri kaydedebileceği düzenli bir klasör yapısı oluşturur. Bir kez kurarsın, sonra `memorize-module` ile doldurursun.

**⚙️ Teknik.** `docs/memory/` altına 6 klasörlü bir yapı yazar: giriş noktası `CLAUDE.md`, harita `MOC.md` (Map of Content), `20-modules/`, `30-decisions/` (ADR), `50-glossary/`, `99-meta/conventions.md`. Her klasöre `_template.md` koyar. Mevcut ADR'leri bulup ya link'ler ya taşır. Proje `CLAUDE.md`'sine idempotent bir marker ekler ki ajanlar hafızayı ilk okuyacakları yer olarak bilsin.

### `setup-otel-dotnet` — Observability (.NET)
*stack: dotnet, opentelemetry, jaeger, prometheus*

**🗣️ Sözlü.** ".NET uygulamamın içinde ne olup bittiğini görmek istiyorum" dediğinde çalışır. Uygulamaya OpenTelemetry kurar; trace, metrik ve log'ları Jaeger'a (geliştirme) veya Grafana Tempo'ya (production) gönderir. Bir isteğin sistemin içinde nereden nereye gittiğini görebilirsin.

**⚙️ Teknik.** NuGet paketlerini ekler (OTel core + EF Core enstrümantasyonu + Prometheus exporter + Serilog→OTel bridge). `Program.cs`'e tracing/metric/log pipeline'ını kurar, `appsettings.json`'a exporter ayarlarını yazar. **CorrelationId middleware** ile request'ler arası izi taşır, manuel span için örnek verir. `docker-compose.yml`'e Jaeger, production için otel-collector `config.yaml` şablonu ekler. Trace okuma rehberiyle biter.

### `setup-precommit-dotnet` — Commit öncesi kalite kapısı (.NET)
*stack: dotnet, husky*

**🗣️ Sözlü.** "Bozuk kod commit'lenmesin" için bekçi köpeği. Her `git commit` öncesi otomatik olarak kodu formatlar ve testleri çalıştırır; bir şey bozuksa commit'e izin vermez.

**⚙️ Teknik.** Husky.Net'i dotnet tool olarak kurar, `.husky/pre-commit` hook'unu yazar: `dotnet format` + `dotnet test`. `.editorconfig` yoksa oluşturur, `.gitignore`'a tool girdisini ekler, ekip için README notu bırakır. Büyük monorepo için "sadece staged `.cs` dosyaları formatla" ve "yavaş integration testlerini atla, sadece unit test" gibi yapılandırma seçenekleri sunar.

### `setup-precommit-node` — Commit öncesi kalite kapısı (Node/Supabase)
*stack: node, typescript, husky, lint-staged, deno, supabase*

**🗣️ Sözlü.** Yukarıdakinin JavaScript/Supabase dünyasındaki karşılığı. Frontend, Edge Function ve migration'lar için ayrı ayrı, doğru araçlarla commit öncesi denetim kurar.

**⚙️ Teknik.** Husky + lint-staged kurar. `lint-staged` yapılandırması dosya tipine göre farklı araç çalıştırır: frontend TS için ESLint + Prettier + `tsc`, Edge Function için `deno fmt` + `deno lint`, migration eklendiyse `supabase db lint`. ESLint/Prettier yoksa kurar. Opsiyonel olarak sadece etkilenen testler için Vitest, `tsc` yavaşsa incremental mod, ve Conventional Commits için `commit-msg` hook'u ekler.

---

## 🧱 Scaffold — Yeni iskelet üret

Sıfırdan çalışır kod/dosya iskeleti üreten skill'ler.

### `scaffold-backend` — Sıfırdan .NET backend
*stack: dotnet, docker, postgresql, mediatr*

**🗣️ Sözlü.** "Yeni bir backend'e ihtiyacım var" dediğinde tüm solution'ı kuran skill. İki yol sunar: tek parça **monolith** mi yoksa **mikroservis** mi? Seçtiğine göre klasör yapısını, kütüphaneleri, Docker'ı — her şeyi hazırlar. Sonra ilk feature'ı `scaffold-vsa-feature` ile eklersin.

**⚙️ Teknik.** Önce yerleşimi ve mimariyi sorar, sonra iki dala ayrılır:
- **Dal A (Monolith):** tek modüler API, VSA klasör düzeni, in-process MediatR notification ile modüller arası iletişim.
- **Dal B (Mikroservis):** DB-per-service, MassTransit ile mesajlaşma (ADR-005), worker şablonu, `docker-compose.override.yml`.
- **Ortak adımlar:** MediatR `ValidationBehavior` pipeline'ı, CorrelationId middleware, `Dockerfile`, `AppDbContext` iskeleti, Central Package Management. `dotnet build` ile doğrulayıp biter. .NET 9+ minimal API + yerleşik OpenAPI kullanır.

### `scaffold-frontend-react` — Sıfırdan React frontend
*stack: react, typescript, vite, tanstack-query, react-router, vitest, msw*

**🗣️ Sözlü.** Yeni bir React uygulaması için sağlam bir başlangıç noktası. Çekirdek her zaman aynı (Vite + Router + veri katmanı + test), üstüne ihtiyacına göre UI kütüphanesi, form, E2E gibi parçaları opsiyonel ekler.

**⚙️ Teknik.** **Çekirdek (her zaman):** Vite projesi, React Router + TanStack Query, Vitest + RTL + MSW test altyapısı (bu `tdd-react` ile birebir uyumlu), `features/shared/app` klasör düzeni, providers/router/main dosyaları, `package.json` script'leri. **Opsiyonel modüller:** shadcn/ui + Tailwind, Zustand (client state), React Hook Form + Zod, Playwright (E2E), backend bağlıysa OpenAPI'den TypeScript tip üretimi (`openapi-typescript`).

### `scaffold-vsa-feature` — VSA feature dilimi (.NET)
*stack: dotnet, mediatr, fluentvalidation, xunit*

**🗣️ Sözlü.** Var olan bir .NET backend'e yeni bir özellik eklerken tek komutla tüm dosyaları döken skill. Bir "PlaceOrder" özelliği için gereken Command, Handler, doğrulayıcı, endpoint ve test dosyalarını bir arada üretir — dikey dilim (vertical slice) olarak.

**⚙️ Teknik.** Vertical Slice Architecture'da bir feature için 5 dosya üretir: Command **veya** Query + Handler + FluentValidation Validator + Minimal API Endpoint + xUnit Test. Endpoint'i otomatik kaydeder. MediatR + FluentValidation'ın otomatik doğrulama pipeline'ına bağlanır (`ValidationBehavior` — istek handler'a ulaşmadan doğrulanır).

### `scaffold-supabase-feature` — Supabase dikey dilim
*stack: supabase, deno, typescript, zod, react, tanstack-query*

**🗣️ Sözlü.** Yukarıdakinin Supabase karşılığı. Bir özelliğin veritabanından ekrana kadar tüm katmanlarını tek seferde iskeletler: tablo + güvenlik kuralı + sunucu fonksiyonu + frontend veri kancası + testler.

**⚙️ Teknik.** Dört katmanı bir arada üretir: **(1)** SQL migration (tablo + RLS politikaları), **(2)** gerekiyorsa Deno Edge Function (JWT guard + Zod şema doğrulama), **(3)** frontend TanStack Query hook'u, **(4)** test iskeleti. Üretim sonrası kontrol listesiyle biter.

### `scaffold-adr` — Mimari Karar Kaydı
*stack: genel*

**🗣️ Sözlü.** Önemli bir teknik karar verdin ("PostgreSQL kullanacağız çünkü...") ve bunu ileride "neden böyle yapmıştık?" diye soran biri için kalıcı olarak yazmak istiyorsun. Bu skill o kararı standart bir formatta belgeler.

**⚙️ Teknik.** Önce konumu keşfeder, karar bağlamını toplar (Karpathy 1). Mevcut ADR'lere bakıp bir sonraki numarayı otomatik atar. **Çelişki kontrolü** yapar (Karpathy 4) — yeni karar eski bir ADR'yle çelişiyorsa supersede workflow'u önerir. Standart şablonu doldurur: Bağlam / Karar / Gerekçe / Alternatifler / Sonuçlar (olumlu+olumsuz) / İlgili. `MOC.md` indeksini günceller. `improve-codebase-architecture` ile zincirleme çalışabilen bir "chain modu" vardır.

---

## ✅ TDD — Test-Driven Development

"Önce test, sonra kod" (red → green → refactor) disiplinini her stack'e özel araçlarla uygulayan skill'ler. Hepsi **yatay dilim anti-pattern'ini** reddeder ve **tracer bullet** ile başlar (uçtan uca çalışan en ince dilim).

### `tdd-dotnet` — TDD (.NET) · *adapted, heavy*
*stack: dotnet, xunit, mediatr, testcontainers*

**🗣️ Sözlü.** .NET'te bir MediatR handler'ı ya da bir feature yazarken önce testini yazmanı sağlar. Gerçek veritabanına karşı test etmen gerektiğinde Testcontainers ile geçici bir Postgres ayağa kaldırır. Kırmızı test → yeşil kod → temizle döngüsünde ilerler.

**⚙️ Teknik.** xUnit + FluentAssertions + NSubstitute stack'i. İş akışı: planlama → tracer bullet → red-green döngüsü → refactor. Handler unit testi örnekleri (NSubstitute ipuçlarıyla), Testcontainers ile gerçek Postgres'e karşı integration test, `WebApplicationFactory` ile endpoint testi. Coverage politikası ve mikroservis için contract test rehberi içerir. VSA bağlamına oturur.

### `tdd-react` — TDD (React) · *adapted, heavy*
*stack: react, vitest, react-testing-library, msw, tanstack-query*

**🗣️ Sözlü.** React component'lerini, hook'ları ve form'ları kullanıcının gördüğü gibi test etmeni sağlar. Ağ isteklerini MSW ile taklit eder, gerçek backend'e ihtiyaç bırakmaz.

**⚙️ Teknik.** Vitest + RTL + MSW + user-event. **Query priority** stratejisiyle (erişilebilirlik odaklı sorgular) element bulma. TanStack Query'li component testi, custom hook testi (`renderHook`), form testi kalıpları. Component vs integration test ayrımını netleştirir, coverage politikası verir.

### `tdd-react-native` — TDD (React Native/Expo) · *adapted, heavy*
*stack: react-native, expo, jest, react-testing-library, maestro*

**🗣️ Sözlü.** Mobil (Expo öncelikli) uygulamalarda TDD. Navigation, cihaz depolama (AsyncStorage) gibi native parçaları taklit eder; uçtan uca akışları Maestro ile test eder.

**⚙️ Teknik.** Jest + `@testing-library/react-native`. React Navigation testi, AsyncStorage/SecureStore mock'ları, TanStack Query entegrasyonu. E2E için Maestro flow'ları (`.maestro/*.yaml`, lokal + cloud paralel). Expo EAS build öncesi smoke test stratejisi ve bare React Native (Expo'suz) desteği içerir.

### `tdd-edge-function` — TDD (Supabase Edge Functions)
*stack: supabase, deno, vitest, pgtap, rls*

**🗣️ Sözlü.** Supabase Edge Function'larını ve — en önemlisi — **RLS güvenlik politikalarını** test-driven yazdırır. "Bu kullanıcı gerçekten sadece kendi verisini görebiliyor mu?" sorusunu teste döker.

**⚙️ Teknik.** Deno test / Vitest ile lokal Supabase'e karşı handler testi. **RLS testi pgTAP ile atlanmaz** — politikaların doğru izole ettiğini SQL seviyesinde doğrular. Webhook/OAuth için özel test durumu. Tracer bullet → döngü → refactor akışı ve coverage politikası.

---

## 🧠 Memory — Bilgi yönetimi

`setup-memory` ile kurulan hafıza vault'unu dolduran ve bakımını yapan skill'ler.

### `memorize-module` — Tek modül TL;DR'ı
*stack: genel*

**🗣️ Sözlü.** "Şu modülün ne yaptığını, nereye dokunulmaması gerektiğini bir yere yazalım ki bir dahaki sefere sıfırdan okumayalım." Bir modülü seç, skill sana birkaç soru sorar, kodun bir kısmını okuyup doğrular ve o modülün özet kartını yazar. Zorla her şeyi belgelemek yerine, dokundukça yazma (lazy adoption) mantığı.

**⚙️ Teknik.** Modül kapsamını belirler → kullanıcıya 5 soru sorar (Karpathy 1) → 3-5 dosya okuyup cevapları **doğrular** (Karpathy 4) → `docs/memory/20-modules/<modul>.md` yazar. Şablon bölümleri: TL;DR / Buraya Dokunma / Kod / İlişkiler / İlgili Kararlar. `MOC.md`'yi günceller. `PROJECT_ANALYSIS.md` varsa hızlandırıcı olarak kullanır: modül seçimi churn top-5'ten, dosya listesi envanterden, sorular rapor bulgularına keskinleştirilir — ama güncel koddan doğrulama adımı asla atlanmaz (bayatlık `analyzed_commit` ile kontrol edilir).

### `review-memory` — Hafıza bayatlık denetimi
*stack: genel*

**🗣️ Sözlü.** Zamanla dokümantasyon eskir. Bu skill hafıza vault'unu tarar: hangi kartlar çok eski, hangi link'ler kırık, hangi modül son 30 günde değişmiş ama dokümanı güncellenmemiş? Bir öncelikli "bakım yapılacaklar" raporu çıkarır.

**⚙️ Teknik.** Beş denetim: **(1)** bayatlık (`last_reviewed` 60+ gün), **(2)** broken link kontrolü, **(3)** git log cross-check — en güçlü sinyal: son 30 günde değişen ama doc'u dokunulmamış modüller, **(4)** eksik kapsam analizi (kodda kaç modül var vs kaçı belgeli), **(5)** öncelik sıralı rapor (🔴 Acil / ⚠️ Bayat / 🔗 Broken Link / 📊 Coverage). Otomatik tetikleyici önerisiyle biter.

---

## 🔬 Analyze — Mevcut projeyi tanı

Legacy/mevcut bir projeyi devralırken çalışan analiz üçlüsü. Tek çıktı dosyası: `PROJECT_ANALYSIS.md` (`docs/memory/99-meta/`, memory yoksa repo kökü). Analiz **makine gözlemidir** — memory'nin insan-onaylı katmanlarına (modül kartı, ADR, glossary) yazmaz, onlara aday listesi besler.

### `analyze-project` — Uçtan uca analiz orchestrator'ı
*stack: genel*

**🗣️ Sözlü.** "Bu projeyi bana anlat" dediğin an çalışan giriş kapısı. Kendisi analiz yapmaz — önce teknik taramayı (`analyze-codebase`), sonra ürün haritasını (`analyze-functional`) otomatik çalıştırır, ikisini tek raporda birleştirip yönetici özeti yazar. Devraldığın legacy projede ilk çalıştıracağın analiz budur; wizard da Legacy path'lerde ilk build adımı olarak bunu önerir.

**⚙️ Teknik.** Rubion'un "öner, kullanıcı tetiklesin" konvansiyonunun **bilinçli istisnası** (`dispatch-agents` gibi) — iki alt skill'i Skill tool'uyla sırayla çağırır, aralarda onay değil ilerleme notu verir; zincir raporla biter, sonraki skill'ler (grill, improve-arch, memorize) yalnızca önerilir. Akış: tazelik kontrolü (`analyzed_commit` vs HEAD — güncel raporu sormadan yeniden koşmaz; bayatsa "son analizden bu yana" diff özeti ekler) → `analyze-codebase` → `analyze-functional` → sentez (§1 Yönetici Özeti ≤10 madde, §5 Memory Besleme, §6 Sıradaki Adımlar) → yerleşim (`99-meta/` + MOC linki). Skill çağrısı olmayan ortamlar (Cursor) için Manuel Mod içerir.

### `analyze-codebase` — Teknik röntgen
*stack: dotnet, supabase, react, react-native*

**🗣️ Sözlü.** "Bu kod tabanının durumu ne?" sorusunun kanıta dayalı cevabı. Önce projenin envanterini çıkarır (hangi endpoint'ler, tablolar, ekranlar, modüller var), sonra dört boyutta sağlık taraması yapar: mimari, test borcu, bağımlılık/güvenlik, performans/hata yönetimi. Her bulgu dosya:satır referanslı — "genel olarak kötü" demez, yerini gösterir. Kodu değiştirmez.

**⚙️ Teknik.** Faz 0 yönelim (manifest'ler, dizin haritası, git churn top 20, en büyük 20 dosya) → Faz 1 envanter (stack başına grep/komut tablosu: MapGet'ler, DbSet'ler, RLS policy'ler, route'lar) → Faz 2 dört boyutlu tarama (Önem: Critical→Low, Çaba: S/M/L; `dotnet list package --vulnerable`, `npm audit`, `npx knip`, `madge --circular` gibi araçlarla). En değerli sinyal: **churn × testsiz kesişimi** — en sık değişen ama testi olmayan dosyalar. `PROJECT_ANALYSIS.md` §3-4'ü yazar; "Kötü Görünüyor Ama Sorun Değil" bölümüyle yanlış alarm birikimini önler. Shallow abstraction adaylarını `improve-codebase-architecture`'a, semptomları `diagnose-*`'a havale eder.

### `analyze-functional` — Ürün haritası
*stack: react, react-native, dotnet, supabase*

**🗣️ Sözlü.** "Peki bu proje son kullanıcı için gerçekte ne yapıyor?" sorusunu koddan cevaplar: hangi ekran var, hangi buton neyi tetikliyor, hangi tabloya yazıyor, kullanıcı hangi yolculukları yürüyor. README'nin vaadine değil kodun kanıtına bakar — yarım kalmış feature'ları (buton var handler yok, endpoint var çağıran yok) özellikle yakalar.

**⚙️ Teknik.** Girdi: `analyze-codebase`'in §3 envanteri (varsa oradan, bayatsa doğrulayarak; yoksa mini-envanter veya önce codebase önerisi). Beş faz: ekran haritası (route/amaç/veri/erişim) → aksiyon zincirleri (`buton → hook → endpoint → handler → tablo`, her halka dosya referanslı) → kullanıcı akışları (2-5 kanıtlı uçtan uca yolculuk) → domain varlıkları + glossary adayları (Türkçe/İngilizce ikilikleri işaretli — Sevkiyat/Shipment) → "ne yapıyor / ne yapmıyor" özeti. Kanıtsız davranış iddiası `(belirsiz)` etiketlenir. §2'yi yazar; çıktının ana tüketicisi `grill-with-docs` Rol 1 (hiç analiz dökümanı olmayan legacy projede CONTEXT.md'nin girdisi bu haritadır).

---

## 🔍 Diagnose & Review — Teşhis ve denetim

Var olan kodda sorun avlayan ve riskli değişiklikleri kapıda durduran skill'ler.

### `diagnose-dotnet` — Disiplinli debugging (.NET) · *adapted, heavy*
*stack: dotnet, ef-core, opentelemetry, rabbitmq, serilog*

**🗣️ Sözlü.** "Bu neden bozuk / neden yavaş?" dediğinde tahminle koda dokunmak yerine, bilimsel bir yöntem izler: önce hatayı tekrar üret, sonra en küçük haline indir, hipotez kur, ölç, düzelt. Sallamayı bırakır, kanıtla ilerler.

**⚙️ Teknik.** 6 fazlı disiplin: feedback loop kur → reproduce → hipotez → instrument → düzelt+regression test → cleanup+post-mortem. .NET'e özel araçlar: canlı process trace/CPU profil, crash dump, BenchmarkDotNet, MiniProfiler, Serilog structured logging. EF Core N+1 avı, OTel trace ile dağıtık debug, RabbitMQ DLX mesaj hataları. **Yeni feature yazımı için değildir.**

### `diagnose-supabase` — Disiplinli debugging (Supabase) · *adapted, heavy*
*stack: supabase, postgresql, deno, rls, tanstack-query*

**🗣️ Sözlü.** Yukarıdaki disiplinin Supabase dünyasındaki hali. En sık düşülen tuzaklara odaklıdır: "Sorgu neden boş dönüyor?" (çoğu zaman RLS reddi), Edge Function soğuk başlangıç, frontend'de bayat cache, yavaş Postgres sorgusu.

**⚙️ Teknik.** Aynı 6 fazlı yöntem, Supabase'e özel instrument bölümleriyle: **RLS denial** (en sık — boş sonuç ya da 403), Edge Function cold start, TanStack Query stale cache, Postgres yavaş sorgu (EXPLAIN ANALYZE). Reproduce → hipotez → ölç → düzelt → post-mortem.

### `improve-codebase-architecture` — Mimari fırsat tespiti · *adapted, heavy*
*stack: dotnet, architecture*

**🗣️ Sözlü.** "Bu kod tabanı nerelerde daha iyi olabilir?" John Ousterhout'un "deep module" kavramıyla, sığ soyutlamaları ve şişmiş servisleri tespit eder. Kararları sana dayatmaz — adaylar sunar, birlikte sorgular (grilling).

**⚙️ Teknik.** Süreç: keşfet → adayları sun → grilling loop. Rubion/.NET'e özel karar ağaçları içerir: **(A)** VSA vs Clean Architecture, **(B)** Domain Event vs Integration Event, **(C)** EF Core'da Repository pattern eleştirisi, **(D)** Monolith → Mikroservis kararı. Terimleri `LANGUAGE.md`'den kesin çeker. `scaffold-adr` ile zincirlenir. **Yeni proje iskeleti için değildir.**

### `ef-core-migration-review` — Migration güvenlik denetimi (.NET)
*stack: dotnet, ef-core, postgresql, mssql*

**🗣️ Sözlü.** Bir veritabanı migration'ını production'a atmadan önce "bu veri kaybettirir mi, tabloyu kilitler mi?" diye kontrol eden gözü. Riskli operasyonları yakalar, güvenli alternatif önerir, geri alma planı ister.

**⚙️ Teknik.** Migration dosyasını okuyup 6 kontrol uygular: destructive operasyonlar (DROP/veri kaybı), NOT NULL kolon ekleme, büyük tabloda index (kilit), geri alma stratejisi, kolon/tablo rename, foreign key kilitleri. Çıktı standart bir rapor: **GEÇTİ / UYARI / ENGEL** verdicti + bulgular + önerilen düzeltmeler + geri alma + deploy notu.

### `supabase-migration-review` — Migration güvenlik denetimi (Supabase)
*stack: supabase, postgresql, sql, rls*

**🗣️ Sözlü.** Yukarıdakinin Supabase/SQL karşılığı, artı **RLS güvenlik açığı** kontrolü. Migration bir tabloyu açığa çıkarıyor mu, güvenlik politikaları eksik mi — bunları yakalar.

**⚙️ Teknik.** 6+ kontrol: destructive operasyonlar, **RLS (en kritik)**, SECURITY DEFINER fonksiyonlar, NOT NULL kolon, index/kilit (`CREATE INDEX CONCURRENTLY` tuzağı), rollback stratejisi, naming/idempotency. Aynı **GEÇTİ / UYARI / ENGEL** rapor formatı.

### `harden-webhook` — Webhook/OAuth sertleştirme
*stack: supabase, deno, typescript, webhook, security*

**🗣️ Sözlü.** Dışarıya açık webhook ve OAuth callback'lerini güvenlik açısından denetler. "Bu ödeme webhook'una sahte istek atılabilir mi, aynı istek iki kere işlenir mi?" gibi soruları kapatır.

**⚙️ Teknik.** Handler'ı okuyup 6 kontrol uygular: **(1)** imza doğrulama (**raw body** üzerinden — parse edilmiş body'de imza bozulur), **(2)** idempotency, **(3)** replay koruması (timestamp penceresi), **(4)** 2xx zamanlaması (işlemeden önce/sonra), **(5)** secret yönetimi, **(6)** OAuth callback state doğrulama (Instagram/TikTok örnekleriyle). **GEÇTİ / UYARI / ENGEL** raporu + insan review notu üretir.

---

## 🔄 Refactor

### `migrate-legacy-to-vsa` — Legacy → VSA taşıma
*stack: dotnet, mediatr, vsa*

**🗣️ Sözlü.** Elinde eski usul "Service + Repository" katmanlı bir .NET kodu var ve bunu modern Vertical Slice mimarisine taşımak istiyorsun — ama bir gecede değil, sistemi çökertmeden, özellik özellik. Bu skill o kademeli geçişi yönetir.

**⚙️ Teknik.** **Strangler Fig** stratejisi. Feature başına 6 adım: feature'ı izole et → Command + Handler yaz → controller'dan handler'a yönlendir (geçiş dönemi) → Minimal API endpoint ekle → controller'ı kaldır → servis boşaldıkça sil. "Repository ne zaman silinir?", shared logic, circular dependency gibi yaygın sorunlara çözüm içerir. Sıfır kesintiyle ilerler.

---

## 🧪 Prototype

### `prototype` — Atılacak POC · *adapted, medium*
*stack: dotnet, react, vite, react-native, expo*

**🗣️ Sözlü.** "Şu fikir/tasarım tutuyor mu, hızlıca bir deneyelim." Cila, test, mimari kaygısı olmadan tek amaçlı bir prototip kurar. Önemli fark: bu kod **silinecek** — o yüzden kalite baseline'ından muaftır.

**⚙️ Teknik.** Dört moddan biriyle çalışır: Backend CLI, Minimal API, Vite UI variants, Expo. Ortak kurallar throwaway doğasına göre gevşetilmiştir. Tamamlandığında çıktının atılacağını açıkça işaretler. **Production kod için değildir** — baseline'dan bilinçli muafiyet taşır (`design-mockup` ile birlikte).

---

## 🎨 Design

### `design-mockup` — Tasarımcı için UI mockup
*stack: react, react-native, expo, tailwind, shadcn, html*

**🗣️ Sözlü.** Tasarımcının "bu ekran nasıl görünmeli?" sorusu için. Mevcut bir projede çalışıyorsan taslak sayfayı doğrudan projenin gerçek component'leriyle kurar — ama backend'e hiç dokunmadan, tüm veri sahte (fixture). Henüz proje yoksa fikri tek bir HTML dosyasında görselleştirir; tarayıcıda açılır, kurulum istemez. Her iki durumda da varyantlar (`?variant=a|b|c`) arasında gezip karşılaştırabilirsin.

**⚙️ Teknik.** Modu kendisi tespit eder: repo'da frontend varsa **Mod 1** (`design/*` branch + `src/_design/` klasörü + DEV-guard'lı `/_design` route'u; data `fixtures.ts`'te, fetch/TanStack Query yasak), yoksa **Mod 2** (tek dosya HTML, dış bağımlılık sıfır, CSS token'ları shadcn adlarıyla → onaylanınca `scaffold-frontend-react` temasına kopyalanır; mobil fikirde 375×812 device-frame). Çıktı disiplini: gerçekçi Türkçe içerik, boş/loading durumları, a11y minimumu, `NOTES.md`'de component-eşleme handoff tablosu, greenfield'da `design-tokens.md`. **Promote-or-delete:** karar sonrası taslak ya `tdd-react`/`tdd-react-native` ile gerçek koda terfi eder ya silinir. Baseline'dan muaf (test/cila yok).

---

## 🎯 Orchestrate

### `dispatch-agents` — Paralel ajan dağıtımı
*stack: genel*

**🗣️ Sözlü.** Elinde birbirinden bağımsız birçok hazır iş (issue) var ve hepsini tek tek beklemek yerine paralel yaptırmak istiyorsun. Bu skill her işi ayrı bir ajana dağıtır; her ajan kendi izole çalışma alanında (worktree) işi PR'a kadar götürür. "AFK batch" — sen yokken çalışan işçi ordusu.

**⚙️ Teknik.** Süreç: `ready-for-agent` etiketli issue'ları çek → **bağımlılık grafiğini** hesapla (sadece bağımsız olanlar paralelleşir) → planı kullanıcıya sun → per-agent prompt hazırla → subagent'ları dispatch et → sonuçları topla+raporla. Her ajan worktree'de `scaffold-vsa-feature` + `tdd-dotnet` zincirini koşturur. Eşzamanlı limit ve hata senaryosu kontrolleri var. **Sıralı bağımlı işler için kullanılmaz** (onun için manuel mod karşı-pattern'i belgeli).

---

## 📝 Plan & Document

### `to-prd` — Konuşmadan PRD · *adapted, light*
*stack: genel*

**🗣️ Sözlü.** Bir feature üzerinde yeterince konuştunuz; artık bunu düzgün bir ürün gereksinim dokümanına (PRD) dökmek istiyorsun. Bu skill sana yeniden soru sormaz — konuşmada zaten söylenenleri sentezleyip yazar ve issue tracker'a yayınlar.

**⚙️ Teknik.** Codebase'i inceler → modül eskizini çıkarır → PRD yazar (Problem / Çözüm / Kullanıcı Hikâyeleri / Implementasyon Kararları / Test Kararları / Kapsam Dışı / Ek Notlar) → issue tracker'a (GitHub/Jira) yayınlar. Kullanıcıyı **sorgulamaz** — mevcut bağlamı sentezler.

### `to-issues` — PRD/plandan issue'lar · *adapted, medium*
*stack: genel*

**🗣️ Sözlü.** Elinde bir plan ya da PRD var; bunu geliştiricilerin (veya ajanların) tek tek alabileceği, birbirinden bağımsız iş paketlerine bölmek istiyorsun. Bu skill planı "tracer bullet" dikey dilimlere böler ve tracker'a yazar. Her dilime otomatik stack etiketi basar — böylece `dispatch-agents` hangi skill'i çağıracağını bilir.

**⚙️ Teknik.** Süreç: bağlamı topla → (opsiyonel) codebase incele → dikey dilimleri taslakla → her dilim için **stack etiketi** çıkar (`stack:dotnet` / `stack:supabase` / `stack:react` / `stack:react-native`) → paralellik ve başlangıç kriterini belirle → kullanıcıya göster/sorgulat → tracker'a yayınla. GitHub'da `gh` ile #N otomatik, Jira'da parent varsa Subtask. Parent issue'a dokunmaz.

### `grill-with-docs` — Plan/analiz stress-testi · *adapted, light*
*stack: dotnet, react, react-native*

**🗣️ Sözlü.** İki işi olan skill. **(1)** Proje başında: elindeki ham analiz dökümanlarını düzenli bir `CONTEXT.md` ve ADR'lere dönüştürür. **(2)** Her feature'da: bir planı/PRD'yi projenin domain diline ve kayıtlı kararlarına karşı sıkıştırır — "bu terimi böyle mi kullanıyoruz, bu karar ADR-003'le çelişmiyor mu?" diye sorgular.

**⚙️ Teknik.** Domain farkındalığıyla çalışır: glossary'ye karşı sorgular, muğlak dili netleştirir, somut senaryolar kullanır, mevcut kodla karşılaştırır. `CONTEXT.md`'yi yerinde günceller, tutumlu biçimde ADR önerir. Rubion projeleri için CONTEXT.md ve ADR formatları tanımlıdır. Tipik zincirde `to-prd` ↔ `to-issues` arasında Rol 2 olarak durur.

### `tubitak-1507-document` — TÜBİTAK 1507 başvurusu
*stack: genel*

**🗣️ Sözlü.** TÜBİTAK 1507 KOBİ Ar-Ge destek başvurusunun teknik bölümlerini yazan skill. Projenin Ar-Ge yönünü, yenilikçiliğini ve teknolojik belirsizliklerini değerlendirici gözüyle, başvuru formatında ifade eder.

**⚙️ Teknik.** Önce proje bilgisini toplar, sonra 6 bölüm üretir: **(1)** Amaç ve kapsam, **(2)** Özgün değer/yenilikçilik analizi (literatür taraması + ticari ürün analizi + özgün katkı), **(3)** Ar-Ge faaliyetleri ve teknolojik belirsizlikler, **(4)** İş paketi planı, **(5)** Proje ekibi/yetkinlikler, **(6)** Bütçe gerekçesi ipuçları. Sıkça yapılan hatalar bölümüyle biter.

---

## Terimler sözlüğü

| Terim | Açıklama |
|-------|----------|
| **VSA** (Vertical Slice Architecture) | Kodu teknik katmanlara değil, feature'lara göre dilimlemek. Bir feature'ın tüm parçaları (istek, iş mantığı, endpoint, test) bir arada durur. |
| **Tracer bullet** | Bir özelliğin uçtan uca çalışan en ince dilimi. Önce onu geçirir, sonra etini doldurursun. |
| **RLS** (Row Level Security) | Postgres/Supabase'de satır bazlı erişim güvenliği — bir kullanıcı sadece yetkili olduğu satırları görür. |
| **ADR** (Architecture Decision Record) | "Şunu neden böyle yaptık" kararını bağlam+gerekçeyle kaydeden kısa belge. |
| **MOC** (Map of Content) | Hafıza vault'unun içindekiler haritası — her modül/karar/terime giden link. |
| **Strangler Fig** | Eski sistemi bir gecede değil, parça parça yenisiyle sararak kademeli değiştirme stratejisi. |
| **Deep module** | Basit arayüz ardında güçlü işlevsellik gizleyen modül (Ousterhout). Sığ soyutlamanın zıttı. |
| **Idempotent** | Bir kez de çalışsa on kez de, sonucu değiştirmeyen işlem. Setup skill'leri idempotenttir. |
| **Karpathy baseline** | `CLAUDE.md`'ye yerleşen 4 çalışma ilkesi: Think Before Coding, Simplicity First, Reversibility, Goal-Driven Execution. |
| **`ready-for-agent`** | Bir issue'nun bir ajana teslim edilmeye hazır olduğunu belirten etiket — `dispatch-agents` bunları toplar. |

---

*Bu doküman `skills/` ve `adapted/` altındaki SKILL.md dosyalarından türetilmiştir. Bir skill değişince ilgili bölümü güncel tut; tek satırlık hızlı bakış için [skills-catalog.md](./skills-catalog.md)'yi kullan.*
