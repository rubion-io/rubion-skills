---
name: setup-otel-dotnet
description: .NET projesine OpenTelemetry kurarak trace, metric ve log'ları Jaeger veya Tempo'ya gönderir. Distributed tracing, correlation ID propagation ve EF Core enstrümantasyonu dahil. "OTel kur", "tracing ekle", "Jaeger kurulumu" denildiğinde kullan.
stack: [dotnet, csharp, opentelemetry, jaeger, prometheus]
---

# Setup OpenTelemetry — .NET / Rubion

## Paketler

```bash
# Temel
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Instrumentation.Http
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol

# EF Core enstrümantasyonu
dotnet add package OpenTelemetry.Instrumentation.EntityFrameworkCore

# Metric exporter (Prometheus scrape endpoint)
dotnet add package OpenTelemetry.Exporter.Prometheus.AspNetCore

# Serilog → OpenTelemetry bridge (log korelasyonu için)
dotnet add package Serilog.Enrichers.Span
```

---

## `Program.cs` Kurulumu

```csharp
var serviceName    = builder.Configuration["Otel:ServiceName"] ?? "rubion-service";
var serviceVersion = builder.Configuration["Otel:ServiceVersion"] ?? "1.0.0";
var otlpEndpoint   = builder.Configuration["Otel:Endpoint"] ?? "http://localhost:4317";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r
        .AddService(serviceName, serviceVersion: serviceVersion)
        .AddAttributes(new Dictionary<string, object>
        {
            ["deployment.environment"] = builder.Environment.EnvironmentName.ToLower()
        }))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation(o =>
        {
            o.RecordException = true;
            o.Filter = ctx => !ctx.Request.Path.StartsWithSegments("/health");
        })
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation(o => o.SetDbStatementForText = true)
        .AddSource(serviceName)          // custom ActivitySource için
        .AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint)))
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddPrometheusExporter())        // /metrics endpoint
    .WithLogging(l => l
        .AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint)));

// Prometheus scrape endpoint
app.MapPrometheusScrapingEndpoint("/metrics");
```

---

## `appsettings.json`

```json
{
  "Otel": {
    "ServiceName": "<service-name>",
    "ServiceVersion": "1.0.0",
    "Endpoint": "http://localhost:4317"
  }
}
```

```json
// appsettings.Production.json
{
  "Otel": {
    "Endpoint": "http://otel-collector:4317"
  }
}
```

---

## Correlation ID Middleware

```csharp
// CorrelationIdMiddleware.cs
public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
                            ?? Activity.Current?.TraceId.ToString()
                            ?? Guid.NewGuid().ToString("N");

        context.Items[HeaderName]        = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await next(context);
        }
    }
}

// Program.cs'e ekle (UseSerilogRequestLogging'den önce)
app.UseMiddleware<CorrelationIdMiddleware>();
```

---

## Custom Span (Manuel Trace)

```csharp
// ActivitySource — servis başına bir tane, DI'a singleton olarak kaydet
public static class Telemetry
{
    public static readonly ActivitySource Source = new("<service-name>", "1.0.0");
}

// Handler içinde
public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken ct)
{
    using var activity = Telemetry.Source.StartActivity("CreateOrder");
    activity?.SetTag("order.customer_id", request.CustomerId.ToString());

    try
    {
        // işlem...
        activity?.SetTag("order.id", order.Id.ToString());
        return Result.Ok(order.Id);
    }
    catch (Exception ex)
    {
        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        throw;
    }
}
```

---

## Jaeger (Geliştirme Ortamı)

```yaml
# docker-compose.yml'e ekle
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"   # UI
      - "4317:4317"     # OTLP gRPC
      - "4318:4318"     # OTLP HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    networks:
      - rubion-net
```

Jaeger UI: http://localhost:16686

---

## Grafana Tempo (Production)

```yaml
# otel-collector config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

exporters:
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlp/tempo]
```

---

## Trace Okuma — Hızlı Rehber

Jaeger UI'da:

1. **Service** dropdown'dan servis adını seç
2. **Operation** ile daralt (örn: `POST /orders`)
3. **Tags** alanına `error=true` yaz → yalnızca hatalı trace'leri göster
4. Trace'e tıkla → span'ler görünür
5. Kırmızı span'de `db.statement` tag'ine bak → yavaş SQL'i tespit et
6. `X-Correlation-Id` header'ını Serilog log'larıyla karşılaştır

---

## Kontrol Listesi

```
[ ] Paketler yüklendi
[ ] Program.cs'e OTel pipeline eklendi
[ ] appsettings.json'a Otel section eklendi
[ ] CorrelationIdMiddleware kayıtlı
[ ] Jaeger veya Tempo docker-compose'da ayakta
[ ] Bir endpoint çağrısı yapıldı ve Jaeger UI'da span görünüyor
[ ] EF Core span'leri trace'te gözüküyor (db.statement)
[ ] /metrics endpoint'i Prometheus formatında veri dönüyor
```
