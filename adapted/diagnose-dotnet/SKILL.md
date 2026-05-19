---
adapted_from: mattpocock/skills/skills/engineering/diagnose
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: heavy
name: diagnose-dotnet
description: .NET'te disiplinli hata ayıklama: reproduce → minimize → hypothesize → instrument → fix. EF Core N+1, OTel trace, RabbitMQ DLX desteğiyle. "Debug this", "performance issue", "something is broken" denildiğinde. Yeni feature yazımı için kullanma.
stack: [dotnet, csharp, ef-core, opentelemetry, rabbitmq, serilog]
---

# Diagnose — .NET / Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Zor hataları çözmek için disiplin.

> **Stack kararları:** EF Core vs Dapper seçimi → **[ADR-007](../../docs/adr/0007-ef-core-over-dapper.md)** | Observability (OTel + Serilog) → **[ADR-006](../../docs/adr/0006-observability-stack.md)** Aşamaları yalnızca açıkça gerekçelendirirsen atla.

Codebase'i incelerken projenin domain glossary'ini kullan. Dokunduğun alandaki ADR'leri gözden geçir.

---

## Faz 1 — Feedback Loop Kur

**Bu skill'in özü budur.** Hızlı, deterministik, agent çalıştırabilir bir pass/fail sinyalin varsa hatayı bulursun. Yoksa koda bakmak işe yaramaz.

Bu aşamaya orantısız zaman ayır. **Agresif ol. Yaratıcı ol. Pes etme.**

### Feedback Loop Kurma Yöntemleri

1. **Failing unit test** — Handler veya domain logic seviyesinde.
2. **Failing integration test** — `WebApplicationFactory<Program>` veya `Testcontainers` ile.
3. **HTTP script** — `curl`, `httpie`, veya `.http` dosyası çalıştırılabilir request.
4. **`dotnet run` + fixture input** — CLI tabanlı ya da bir console test harness.
5. **Playwright script** — UI'yı headless drive et, DOM/network/console'u assert et.
6. **Trace replay** — Gerçek network request / payload'ı diske kaydet, tekrar oynat.
7. **Minimal harness** — Tek servis, mock bağımlılıklar, tek fonksiyon çağrısı.
8. **`git bisect` harness** — İki bilinen durum arası regresyon; `bisect run` ile otomatize et.

Loop'u ürün gibi ele al — hızlandır, sinyali keskinleştir, deterministik yap.

### .NET'e Özel Loop Araçları

```bash
# Çalışan process'te trace al (CPU profil)
dotnet trace collect -p <PID> --providers Microsoft-DotNETCore-SampleProfiler

# Performans counter'larını canlı izle
dotnet counters monitor -p <PID> System.Runtime

# Crash dump al
dotnet dump collect -p <PID>
dotnet dump analyze <dump-file>
```

### Deterministik Olmayan Hatalar

Loopı 100× çalıştır, paralelize et, timing window'larını daralt. %50 flake = debug edilebilir; %1 flake değil.

### Loop Kurulamazsa

Dur ve açıkça söyle. Denediklerini listele. Kullanıcıdan şunu iste:
- (a) Hatanın oluştuğu ortama erişim
- (b) Captured artifact (HAR dosyası, log dump, core dump)
- (c) Geçici production instrumentation izni

Loop olmadan Faz 2'ye geçme.

---

## Faz 2 — Reproduce Et

Loop'u çalıştır, hatanın oluştuğunu gözlemle.

Doğrula:
- [ ] Kullanıcının tanımladığı hata oluşuyor — farklı bir hata değil
- [ ] Birden fazla çalıştırmada tekrarlanıyor
- [ ] Kesin semptom yakalandı (hata mesajı, yanlış çıktı, yavaş timing)

Reproduce edemezsen Faz 3'e geçme.

---

## Faz 3 — Hipotez Üret

Test etmeden önce **3–5 sıralı hipotez** oluştur.

Her hipotez **falsifiable** olmalı:

> "Eğer `<X>` sebepse, `<Y>`'yi değiştirmek hatayı ortadan kaldıracak / `<Z>`'yi değiştirmek daha da kötüleştirecek."

Tahmin edemiyorsan hipotez bir his — at ya da netleştir.

**Listeyi kullanıcıya göster, sonra test et.** Kullanıcı sıralamayı anında değiştirebilir.

---

## Faz 4 — Instrument Et

Her probe Faz 3'teki bir tahminle eşleşmeli. **Bir seferde tek değişken.**

### Araç Tercih Sırası

1. **Debugger** — VS veya Rider breakpoint'i. On log'dan iyi.
2. **Hedefli log'lar** — Hipotezleri ayırt eden boundary'lere.
3. Asla "her şeyi log'la ve grep'le."

### Serilog ile Structured Logging

```csharp
// Kötü — düz string, sorgulanamaz
_logger.LogInformation("Order processed for " + orderId);

// İyi — structured, Seq/Kibana'da filtrelenebilir
_logger.LogInformation("Order processed {OrderId} with status {Status}", orderId, status);

// Hata bağlamı
_logger.LogError(ex, "Failed to process order {OrderId}", orderId);
```

**Her debug log'u etiketle:** `[DBG-{rastgele4}]` prefix'i. Cleanup tek `grep` ile yapılır.

```csharp
_logger.LogDebug("[DBG-a4f2] Handler entry, command {@Command}", request);
```

### Performans Regresyonu — Özel Branch

Log'lar performans için genellikle yanlış araç. Bunun yerine:

```bash
# BenchmarkDotNet ile mikro benchmark
dotnet run -c Release -- --job short --runtimes net8.0
```

```csharp
[MemoryDiagnoser]
[SimpleJob(RuntimeMoniker.Net80)]
public class OrderQueryBenchmarks
{
    private AppDbContext _db = null!;

    [GlobalSetup]
    public void Setup() { /* seed db */ }

    [Benchmark(Baseline = true)]
    public async Task<List<Order>> WithTracking()
        => await _db.Orders.Include(o => o.Items).ToListAsync();

    [Benchmark]
    public async Task<List<Order>> WithNoTracking()
        => await _db.Orders.AsNoTracking().Include(o => o.Items).ToListAsync();
}
```

```bash
# MiniProfiler (web request profili — sadece development)
# Startup.cs / Program.cs:
builder.Services.AddMiniProfiler().AddEntityFramework();
app.UseMiniProfiler();
# /profiler/results-index adresinden görüntüle
```

---

## EF Core Sorunları

EF Core log'larını `Information` seviyesine al → çıkan SQL'leri oku. Aynı pattern'de N kez tekrar = **N+1**. Çözüm: `Include + ThenInclude` (eager) veya `.Select(... dto)` (projection). `Seq Scan` görüyorsan migration ile index ekle.

Tam akış + EXPLAIN ANALYZE → **[examples/02-ef-core-n-plus-one.md](examples/02-ef-core-n-plus-one.md)**

---

## Dağıtık Debug + Mesaj Hataları

**OTel + Jaeger:** `correlation_id` ile trace'i bul, kırmızı span'i tespit et, ilgili servise git. Outgoing HTTP'ye `X-Correlation-Id` header'ını ilet (OTel otomatik).

**RabbitMQ DLX:** Mesaj DLX kuyruğunda birikiyorsa `x-death` header'ında sebep var. Consumer idempotent mi, schema eski mi kontrol et.

Tam setup + checklist → **[examples/03-distributed-and-messaging.md](examples/03-distributed-and-messaging.md)**

---

## Faz 5 — Düzelt + Regression Test

Düzeltmeden **önce** regression testini yaz — ama yalnızca **doğru bir seam** varsa.

Doğru seam: Hatanın call site'ında gerçekten oluştuğu yeri test eder.

1. Minimize edilmiş repro'yu o seam'de failing test'e çevir.
2. Fail görmek için çalıştır.
3. Fix'i uygula.
4. Pass görmek için çalıştır.
5. Orijinal Faz 1 loop'unu tekrar çalıştır.

Doğru seam yoksa: bu bir bulgu. Mimari, hatanın kilitlenmesini engelliyor. Dokümante et.

---

## Faz 6 — Cleanup + Post-Mortem

Done demeden önce:

- [ ] Orijinal repro artık oluşmuyor (Faz 1 loop tekrar çalıştırıldı)
- [ ] Regression test geçiyor (veya seam yokluğu dokümante edildi)
- [ ] Tüm `[DBG-...]` log'ları silindi (`grep -r "DBG-" src/`)
- [ ] Throwaway harness'lar silindi
- [ ] Doğru çıkan hipotez commit/PR mesajında belirtildi

**Sonra sor:** Bu hatayı ne önleyebilirdi? Cevap mimari değişiklik içeriyorsa (iyi seam yok, dolanık caller'lar), fix tamamlandıktan sonra `improve-codebase-architecture` skill'ine yönlendir.
