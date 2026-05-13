---
name: migrate-legacy-to-vsa
description: Mevcut "service + repository" mimarisindeki .NET kodunu Vertical Slice Architecture'a refactor eder. Strangler Fig yaklaşımıyla özellik özellik, sıfır kesinti ile. "VSA'ya geç", "slice'a taşı", "service katmanını refactor et" denildiğinde kullan.
stack: [dotnet, csharp, mediatr, vsa]
---

# Migrate Legacy → VSA — Rubion

## Önce Anla

Kör refactor yapma. Önce mevcut yapıyı incele:

```bash
# Mevcut servis ve repository'leri listele
find src/ -name "*Service.cs" -o -name "*Repository.cs" | sort

# Bağımlılık grafiği için — hangi servis neyi çağırıyor?
grep -r "IOrderService\|IInventoryService" src/ --include="*.cs" -l
```

Şunu sor:

1. **Hangi modül/alan** refactor edilecek? (tüm uygulama değil, bölge bölge)
2. **Öncelikli feature** hangisi? (en çok değişen, yeni geliştirme yapılan)
3. **Test coverage** var mı? (yoksa önce test yaz)
4. **Veritabanı şeması** değişecek mi? (migration gerekiyor mu?)

---

## Strateji: Strangler Fig

Sıfır big-bang, sıfır kesinti.

```
Adım 1: Yeni feature'ları doğrudan VSA'ya yaz (eski kodu dokunma)
Adım 2: Mevcut feature'ları birer birer taşı
Adım 3: Eski servis/repository boşaldıkça sil
```

---

## Mevcut Yapı vs Hedef Yapı

**Legacy (service + repository):**

```
src/
├── Services/
│   └── OrderService.cs          ← tüm order logic tek yerde
├── Repositories/
│   └── OrderRepository.cs       ← tüm order DB işlemleri
└── Controllers/
    └── OrdersController.cs      ← HTTP → service mapping
```

**Hedef (VSA):**

```
src/
└── Orders/
    ├── CreateOrder/
    │   ├── CreateOrderCommand.cs
    │   ├── CreateOrderHandler.cs
    │   ├── CreateOrderValidator.cs
    │   └── CreateOrderEndpoint.cs
    ├── GetOrderById/
    │   ├── GetOrderByIdQuery.cs
    │   ├── GetOrderByIdHandler.cs
    │   └── GetOrderByIdEndpoint.cs
    └── CancelOrder/
        ├── CancelOrderCommand.cs
        ├── CancelOrderHandler.cs
        └── CancelOrderEndpoint.cs
```

---

## Refactor Adımları (Feature Başına)

### Adım 1 — Feature'ı izole et

Eski serviste `CreateOrder` method'unu bul:

```csharp
// Eski kod (OrderService.cs)
public async Task<Guid> CreateOrderAsync(CreateOrderRequest request)
{
    var order = new Order { ... };
    await _repository.AddAsync(order);
    await _eventBus.PublishAsync(new OrderCreatedEvent(order.Id));
    return order.Id;
}
```

### Adım 2 — Command + Handler yaz

```csharp
// Orders/CreateOrder/CreateOrderCommand.cs
public record CreateOrderCommand(Guid CustomerId, List<OrderItemDto> Items)
    : IRequest<Result<Guid>>;

// Orders/CreateOrder/CreateOrderHandler.cs
public sealed class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly AppDbContext _db;
    private readonly IEventPublisher _events;

    public CreateOrderHandler(AppDbContext db, IEventPublisher events)
    {
        _db = db;
        _events = events;
    }

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        var order = Order.Create(request.CustomerId,
            request.Items.Select(i => new OrderItem(i.ProductId, i.Quantity)).ToList());

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);
        await _events.PublishAsync(new OrderCreatedEvent(order.Id), ct);

        return Result.Ok(order.Id);
    }
}
```

### Adım 3 — Controller'dan Handler'a yönlendir (geçiş dönemi)

Controller'ı hemen silme. Geçici olarak mediator'a yönlendir:

```csharp
// Eski Controller — geçici adapter
[ApiController, Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly ISender _sender;
    public OrdersController(ISender sender) => _sender = sender;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderCommand command)
    {
        var result = await _sender.Send(command);
        return result.IsSuccess ? Created($"/orders/{result.Value}", result.Value) : BadRequest(result.Errors);
    }
}
```

### Adım 4 — Minimal API endpoint ekle

```csharp
// Orders/CreateOrder/CreateOrderEndpoint.cs
public static class CreateOrderEndpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/orders", async ([FromBody] CreateOrderCommand cmd, ISender s, CancellationToken ct) =>
        {
            var result = await s.Send(cmd, ct);
            return result.IsSuccess
                ? Results.Created($"/orders/{result.Value}", result.Value)
                : Results.BadRequest(result.Errors);
        })
        .WithName("CreateOrder").WithTags("Orders");
    }
}
```

### Adım 5 — Controller'ı kaldır

Tüm action'lar handler'a taşındığında controller'ı sil.

### Adım 6 — Servis boşaldıkça sil

`OrderService.cs`'de başka method kalmadığında dosyayı sil. Repository interface'ini handler'lardan direkt `AppDbContext` ile değiştir (EF Core ile repository pattern genellikle gereksiz).

---

## Repository Pattern — Ne Zaman Silinir?

```
Repository KALSINI:
  ✓ Birden fazla ORM veya data source kullanılıyor
  ✓ Test'te gerçek DB yerine mock kullanmak zorunlu (Testcontainers yoksa)

Repository SİLİNSİN:
  ✓ Tek ORM (EF Core) var
  ✓ Testcontainers ile gerçek DB test ediliyor
  ✓ Repository yalnızca _db.Set<T>() çağrılarını wrap ediyor
```

---

## Yaygın Sorunlar

### "Servis çok büyük, nereden başlayacağım?"

En sık değişen, en çok yeni geliştirme yapılan method'tan başla. Diğerleri zamanla taşınır.

### "Shared logic var, iki handler da kullanıyor"

Önce tekrarla — iki handler'da da aynı kodu yaz. Sonra extract et: domain nesnesine `static` method veya ayrı bir `DomainService` sınıfı (ama ince tut).

### "Circular dependency oluştu"

Handler'lar birbirini çağırmamalı. Bunun yerine domain event pattern'ini kullan: ilk handler event publish eder, ikinci handler event'i tüketir.

---

## Kontrol Listesi

```
[ ] Refactor edilecek feature seçildi (küçük başla)
[ ] Mevcut feature için test var (yoksa önce yaz)
[ ] Command/Query + Handler oluşturuldu
[ ] Controller geçici olarak Handler'a yönlendi
[ ] Minimal API endpoint eklendi
[ ] Eski controller action'ı kaldırıldı
[ ] Servis method'u kaldırıldı
[ ] Testler hâlâ geçiyor
[ ] Sonraki feature'a geç
```
