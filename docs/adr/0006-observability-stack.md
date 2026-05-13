# ADR-006: Observability Stack — OpenTelemetry + Grafana Ecosystem

**Tarih:** 2026-05-13
**Durum:** Kabul Edildi

## Bağlam

Mikroservis mimarisinde bir isteğin birden fazla servis üzerinden geçmesi "distributed tracing" ihtiyacı doğurur. Ayrıca metrik toplama (CPU, istek sayısı, hata oranı) ve yapılandırılmış log yönetimi gereklidir.

Değerlendirilen seçenekler:

1. **OpenTelemetry + Grafana Ecosystem (Jaeger dev, Tempo prod):** Vendor-neutral standart + açık kaynak backend.
2. **Datadog:** Managed APM, güçlü UI, yüksek maliyet.
3. **New Relic:** Managed APM, benzer fiyat modeli.
4. **Azure Application Insights:** Microsoft managed, Azure'a bağımlı.
5. **Elastic APM:** Elasticsearch üzerine kurulu, self-hosted mümkün.

## Karar

**OpenTelemetry (enstrümantasyon) + Grafana Ecosystem (backend) varsayılan observability stack'i olarak belirlendi.**

| Ortam | Trace | Metrik | Log |
|---|---|---|---|
| Development | Jaeger all-in-one (Docker) | Prometheus (Docker) | Seq (Docker) |
| Production | Grafana Tempo | Prometheus + Grafana | Loki + Grafana |

Enstrümantasyon kodu her ortamda aynıdır — yalnızca exporter endpoint'i değişir.

## Gerekçe

### OpenTelemetry Neden Seçildi?

**Vendor-neutral standart:** OpenTelemetry, CNCF (Cloud Native Computing Foundation) tarafından yönetilen endüstri standardıdır. Enstrümantasyon kodu backend'den bağımsız yazılır.

```csharp
// Program.cs — enstrümantasyon kodu backend'den bağımsız
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("Inventory.Api", serviceVersion: "1.0.0"))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri(otelEndpoint)));
```

Backend'i değiştirmek için yalnızca `otelEndpoint` değişir. Enstrümantasyon kodu dokunulmaz.

**Müşteri taşınabilirliği:** Bir müşteri Datadog kullanıyorsa OTel → Datadog exporter eklenir. Kod değişmez.

**Otomatik enstrümantasyon:** ASP.NET Core, HttpClient, EF Core, MassTransit için kütüphane instrumentation paketleri mevcuttur — manuel span yazmaya gerek yok.

### Grafana Ecosystem Neden Seçildi?

**Unified UI:** Trace (Tempo), metrik (Prometheus + Grafana), log (Loki) tek Grafana UI'dan sorgulanabilir. Correlation ID ile trace'den log'a geçiş tek tıkla.

**Self-hosted, maliyet sıfır:** Tüm bileşenler Docker ile çalışır. Managed servis ücreti yok.

**Jaeger (dev):** Tek container (`jaegertracing/all-in-one`), kurulum 1 docker-compose satırı. Development'ta yeterli.

**Seq (dev log):** Yapılandırılmış log için geliştirme ortamında Seq tercih edildi — güçlü query UI, Serilog entegrasyonu kolay.

### Reddedilenler

**Datadog:** Güçlü managed APM, ancak maliyet (host başına/ay) Rubion projelerinin bütçesiyle uyumsuz. OpenTelemetry sayesinde gerekirse geçiş kolaydır.

**New Relic:** Benzer maliyet profili. Free tier sınırlı.

**Azure Application Insights:** Azure'a bağımlılık yaratır. Müşteri Azure kullanmıyorsa işe yaramaz. OpenTelemetry ile Application Insights exporter eklenebilir — müşteri Azure'daysa bu yol tercih edilir.

**Elastic APM:** Güçlü, ancak Elasticsearch cluster'ı yönetmek ek operasyonel yük. Grafana Tempo daha lightweight.

### Serilog ile Yapılandırılmış Log

```csharp
// appsettings.json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.EntityFrameworkCore.Database.Command": "Warning"
      }
    }
  }
}
```

```csharp
// Program.cs
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Seq(seqUrl)           // dev
    .WriteTo.GrafanaLoki(lokiUrl)); // prod
```

Her servis correlation ID'yi log context'ine ekler:

```csharp
using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
{
    await next();
}
```

## Sonuçlar

**Olumlu:**
- Enstrümantasyon kodu vendor-locked değil — backend istediğinde değişir.
- Development ortamında Jaeger + Seq ile zengin debug deneyimi.
- Production'da Grafana tek UI: trace + metrik + log korele edilebilir.
- Yeni servis eklenince `setup-otel-dotnet` skill'i ile 30 dakikada entegre olur (bkz. ADR referansı).

**Olumsuz / Trade-off:**
- Self-hosted Grafana stack'i ops yükü doğurur (upgrade, storage yönetimi).
- Yüksek trace hacminde Tempo sampling konfigürasyonu gerekir — varsayılan %100 sample production'da pahalı olabilir.

## Referanslar

- OpenTelemetry .NET: https://opentelemetry.io/docs/languages/dotnet/
- Grafana Tempo: https://grafana.com/oss/tempo/
- `skills/setup-otel-dotnet/SKILL.md` — OTel kurulum skill'i
- ADR-005: MassTransit (MassTransit OTel enstrümantasyonu)
