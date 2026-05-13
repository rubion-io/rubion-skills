# Adaptation Notes — diagnose-dotnet

**Upstream:** mattpocock/skills/skills/engineering/diagnose
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** heavy

## Ne Değişmedi

- 6 aşamalı loop: Faz 1 (feedback loop) → Faz 2 (reproduce) → Faz 3 (hipotez) → Faz 4 (instrument) → Faz 5 (fix) → Faz 6 (cleanup)
- "Feedback loop kurmak skill'in özüdür" prensibi
- 3–5 falsifiable hipotez zorunluluğu
- "Bir seferde tek değişken" instrumentation kuralı
- Debug log etiketleme (`[DBG-...]`) ve cleanup
- Post-mortem / "ne önleyebilirdi?" sorusu

## Ne Değişti

### 1. .NET Production Debug Araçları

`dotnet trace`, `dotnet counters`, `dotnet dump` — feedback loop kurma araçları olarak eklendi.

### 2. BenchmarkDotNet + MiniProfiler

Performans regresyon tespiti için. Upstream bu konuda sessiz, Rubion stack için kritik.

### 3. Serilog Structured Logging

Structured logging pattern'i (`{OrderId}` vs string concat) eklendi. Sorgulanabilir log yazma disiplini.

### 4. EF Core N+1 ve Query Plan

N+1 tespiti (EF Core logging), `AsNoTracking`, `Include/ThenInclude`, PostgreSQL `EXPLAIN ANALYZE`.

### 5. OpenTelemetry + Jaeger

Dağıtık debug için: correlation ID propagation, Jaeger trace okuma, span analizi.

### 6. RabbitMQ DLX

Async mesaj hatalarının debug'ı: DLX kuyruğu inceleme, mesaj replay stratejisi, idempotency kontrolü.

### 7. Dil

Türkçe. Kod örnekleri C# naming convention'larına uygun.

## Upstream'den Çıkarılanlar

- `scripts/hitl-loop.template.sh` referansı: Rubion'da makul bir `curl` veya `.http` dosyası daha pratik.
- TypeScript/Node-specific araç önerileri (Playwright gibi UI test referansı genel olarak tutuldu).
