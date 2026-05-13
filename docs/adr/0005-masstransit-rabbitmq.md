# ADR-005: MassTransit + RabbitMQ — Mesajlaşma Stack'i

**Tarih:** 2026-05-13
**Durum:** Kabul Edildi

## Bağlam

Mikroservisler arası asenkron iletişim için bir mesajlaşma stack'i seçilmesi gerekiyordu. Değerlendirilen seçenekler:

1. **Raw RabbitMQ.Client:** Doğrudan AMQP kütüphanesi. Tam kontrol, yüksek boilerplate.
2. **MassTransit + RabbitMQ:** .NET için message bus abstraction. Retry, DLX, Saga out-of-box.
3. **NServiceBus:** Olgun enterprise mesajlaşma. Lisans maliyeti yüksek.
4. **CAP:** .NET için outbox pattern + event bus. Topluluk küçük.
5. **Azure Service Bus:** Microsoft'un managed mesajlaşma servisi. Azure'a bağımlı.

## Karar

**MassTransit + RabbitMQ varsayılan mesajlaşma stack'i olarak belirlendi.**

Azure müşteri ortamı gerektiriyorsa: MassTransit transport katmanını Azure Service Bus'a değiştir — uygulama kodu değişmez.

## Gerekçe

### MassTransit'in Avantajları

**Transport-agnostic abstraction:** Uygulama kodu `IPublishEndpoint` ve `IConsumer<T>` interface'lerine karşı yazılır. Transport (RabbitMQ, Azure Service Bus, Amazon SQS) tek bir config değişikliğiyle değişir.

```csharp
// Uygulama kodu — transport'tan bağımsız
public class OrderCreatedConsumer : IConsumer<OrderCreated>
{
    public async Task Consume(ConsumeContext<OrderCreated> ctx)
    {
        var order = ctx.Message;
        // işle...
    }
}

// Program.cs — yalnızca burada transport seçimi var
x.UsingRabbitMq((ctx, cfg) => { ... });
// veya:
x.UsingAzureServiceBus((ctx, cfg) => { ... });
```

**Retry + DLX out-of-box:**

```csharp
cfg.UseMessageRetry(r => r.Intervals(
    TimeSpan.FromSeconds(5),
    TimeSpan.FromSeconds(15),
    TimeSpan.FromSeconds(60)));
```

Manuel RabbitMQ.Client'ta bu retry mantığını sıfırdan yazmak gerekir.

**Saga state machine:**

```csharp
public class OrderStateMachine : MassTransitStateMachine<OrderState>
{
    public State Pending { get; private set; }
    public State InventoryReserved { get; private set; }
    public State Completed { get; private set; }

    public Event<OrderSubmitted> OrderSubmitted { get; private set; }
    public Event<InventoryReserved> InventoryReserved { get; private set; }

    public OrderStateMachine()
    {
        Initially(
            When(OrderSubmitted)
                .TransitionTo(Pending)
                .Publish(ctx => new ReserveInventory(ctx.Message.OrderId)));

        During(Pending,
            When(InventoryReserved)
                .TransitionTo(Completed));
    }
}
```

Distributed transaction yerine Saga — ADR-004'te açıklandığı üzere.

**Test desteği:**

```csharp
var harness = new InMemoryTestHarness();
var consumer = harness.Consumer<OrderCreatedConsumer>();

await harness.Start();
await harness.InputQueueSendEndpoint.Send(new OrderCreated { ... });
Assert.True(await consumer.Consumed.Any<OrderCreated>());
```

Integration test'lerde gerçek RabbitMQ yerine in-memory transport kullanılabilir.

### RabbitMQ Neden Seçildi?

- Self-hosted: Kubernetes veya Docker üzerinde çalışır, managed servis ücreti yok.
- Yüksek throughput (on binlerce mesaj/saniye) Rubion projelerinin ihtiyacını karşılar.
- Management UI ile mesaj debug'ı, DLX incelemesi kolaylaşır.
- Rubion ekibinde deneyim var.

### Reddedilenler

**NServiceBus:** Olgun ve güçlü, ancak lisans maliyeti (annual subscription per endpoint) Rubion'un maliyet hedefiyle uyumsuz.

**CAP:** Outbox pattern ile güçlü tutarlılık sağlar, ancak topluluk küçük ve long-term destek belirsiz.

**Raw RabbitMQ.Client:** Retry, dead-letter, serialize/deserialize, routing mantığını sıfırdan yazmayı gerektirir. MassTransit tüm bunları sağlıyor.

**Azure Service Bus (default olarak):** Azure lock-in yaratır. MassTransit ile transport swap edilebilir olduğundan müşteri Azure kullanıyorsa geçiş kolaydır — varsayılan yapmaya gerek yok.

## Sonuçlar

**Olumlu:**
- Consumer ve publisher kodu transport'tan bağımsız — taşınabilir.
- Retry, DLX, Saga, outbox pattern kütüphane destekli — boilerplate yok.
- Azure müşterileri için transport değişikliği tek satır config.

**Olumsuz / Trade-off:**
- MassTransit abstraction katmanı bazı advanced RabbitMQ özelliklerine erişimi güçleştirebilir (nadir durum).
- Saga state persistance için ek storage gerekir (PostgreSQL veya Redis — Saga state tablosu).

## Referanslar

- MassTransit resmi dokümantasyon: https://masstransit.io/
- ADR-004: Database-per-Service (Saga pattern bağlamı)
- ADR-006: Observability Stack (MassTransit OTel entegrasyonu)
