# Örnek: Mikroservis Trace + RabbitMQ DLX Debug

**Senaryo:** Order servisi'nde sipariş oluşturuluyor ama email gitmiyor. Trace ile takip et, DLX'te mi takıldı gör.

---

## OpenTelemetry + Jaeger Trace Okuma

```csharp
// Program.cs — trace setup (zaten kuruluysa gözden geçir)
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri("http://jaeger:4317")));
```

Jaeger UI'da (http://localhost:16686) trace açıldığında:

1. **`correlation_id` ile filtrele** — birden fazla servisi kesen trace'i bul.
2. Kırmızı/yavaş span'i tespit et.
3. İlgili servise git, o span'in context'indeki log satırlarına bak.

---

## Correlation ID Propagation

```csharp
// ASP.NET Core middleware — her request'te correlation ID üret veya ilet
app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers["X-Correlation-Id"]
                        .FirstOrDefault() ?? Guid.NewGuid().ToString();
    context.Items["CorrelationId"] = correlationId;
    context.Response.Headers["X-Correlation-Id"] = correlationId;

    using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
    {
        await next();
    }
});
```

HttpClient'ler outgoing call'da bu header'ı iletmeli (OTel otomatik yapıyor, manuel HttpClient için DelegatingHandler ekle).

---

## RabbitMQ Dead Letter Exchange (DLX)

```
Normal flow:    Publisher → Exchange → Queue → Consumer
DLX flow:       Consumer NACK → Dead Letter Exchange → DLX Queue
```

### DLX Kuyruğunu İncele

```bash
# RabbitMQ Management UI: http://localhost:15672
# Queues → <dlx-queue-adı> → Get Messages

# veya CLI
rabbitmqctl list_queues name messages
```

### Mesajı Replay Et

```bash
# Shovel plugin veya custom consumer ile DLX'ten orijinal queue'ya taşı
# Veya: Management UI → Move Messages
```

---

## Message Debug Checklist

```
[ ] DLX kuyruğunda birikmekte olan mesaj var mı?
[ ] Exception mesajı ne? (message.Properties["x-death"] header'ına bak)
[ ] Consumer idempotent mi? Aynı mesaj ikinci kez gelirse ne olur?
[ ] Message schema eski bir versiyona mı ait? (breaking schema change?)
[ ] Trace ID consumer log'unda görünüyor mu? — Correlation kopuyorsa orada bul
```

---

## Doğrulama Akışı

```
1. Order oluştur → Jaeger'da trace bul
2. OrderCreated event publish edildi mi? (span'de "publish" event göründü mü?)
3. Email-service consumer trace'i aynı correlation_id ile var mı?
   - Yoksa → mesaj DLX'te olabilir
   - Varsa → consumer handler exception fırlattıysa span kırmızı görünür
4. DLX'i kontrol et — mesaj burada mı?
5. x-death header'ında neden takıldığı yazılı
```
