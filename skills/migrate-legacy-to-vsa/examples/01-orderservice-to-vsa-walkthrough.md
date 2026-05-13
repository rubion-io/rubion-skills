# Örnek: OrderService → VSA — Strangler Fig Walkthrough

Senaryo: 600 satırlık `OrderService`'i, mevcut testleri kırmadan, adım adım VSA'ya geçir.

---

## Başlangıç Durumu

```
src/
└── Orders/
    ├── OrderService.cs         (600 satır, 8 method)
    ├── IOrderService.cs
    ├── OrderRepository.cs
    ├── IOrderRepository.cs
    └── OrdersController.cs     (IOrderService inject eder)

tests/
└── Orders/
    └── OrderServiceTests.cs    (23 test — hepsi yeşil)
```

**Hedef:** `OrderService` kaldırılsın, her method ayrı bir VSA slice olsun. Sıfır downtime. Her adım sonunda testler yeşil.

---

## Genel Strateji — Strangler Fig

```
1. Yeni slice yaz (service'in YANINA — değiştirmeden)
2. Controller'ı yeni slice'a yönlendir (geçici adapter)
3. Eski method'u service'ten sil
4. Tekrar et — bir sonraki method için
5. Service boşaldığında tüm dosyayı sil
```

Her adımda commit → testler yeşil → bir sonraki adım.

---

## Adım 1: CreateOrder — Slice Yaz

### Slice Dosyaları

```bash
mkdir -p src/Orders/CreateOrder
```

```csharp
// src/Orders/CreateOrder/CreateOrderCommand.cs
using MediatR;

namespace Orders.CreateOrder;

public record CreateOrderCommand(
    Guid CustomerId,
    List<CreateOrderItem> Items
) : IRequest<Guid>;

public record CreateOrderItem(Guid ProductId, int Quantity, decimal UnitPrice);
```

```csharp
// src/Orders/CreateOrder/CreateOrderValidator.cs
using FluentValidation;

namespace Orders.CreateOrder;

public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Sipariş en az 1 ürün içermelidir.");
    }
}
```

```csharp
// src/Orders/CreateOrder/CreateOrderHandler.cs
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Orders.CreateOrder;

public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly AppDbContext _db;

    public CreateOrderHandler(AppDbContext db) => _db = db;

    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = cmd.CustomerId,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        foreach (var item in cmd.Items)
        {
            order.Items.Add(new OrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
            });
        }

        order.TotalAmount = order.Items.Sum(i => i.Quantity * i.UnitPrice);
        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);
        return order.Id;
    }
}
```

### Slice Testi

```csharp
// tests/Orders/CreateOrder/CreateOrderHandlerTests.cs

public class CreateOrderHandlerTests : IClassFixture<TestDbContextFixture>
{
    private readonly AppDbContext _db;

    public CreateOrderHandlerTests(TestDbContextFixture fixture)
        => _db = fixture.CreateContext();

    [Fact]
    public async Task Handle_ValidCommand_CreatesOrder()
    {
        var cmd = new CreateOrderCommand(
            CustomerId: Guid.NewGuid(),
            Items: [new(Guid.NewGuid(), 2, 50m)]
        );

        var handler = new CreateOrderHandler(_db);
        var id = await handler.Handle(cmd, default);

        var order = await _db.Orders.FindAsync(id);
        order.Should().NotBeNull();
        order!.TotalAmount.Should().Be(100m);
        order.Status.Should().Be(OrderStatus.Pending);
    }

    [Fact]
    public async Task Handle_EmptyItems_ThrowsValidationException()
    {
        var validator = new CreateOrderValidator();
        var cmd = new CreateOrderCommand(Guid.NewGuid(), []);

        var result = await validator.ValidateAsync(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("en az 1 ürün"));
    }
}
```

```bash
dotnet test
# 25 test — 2 yeni, 23 eski — hepsi GREEN ✓
```

Commit:

```bash
git add src/Orders/CreateOrder/ tests/Orders/CreateOrder/
git commit -m "feat(orders): add CreateOrder VSA slice (Strangler Fig step 1)"
```

---

## Adım 2: Controller'ı Yeni Slice'a Bağla (Adapter)

Eski `OrdersController.CreateOrder` metodu `IOrderService` çağırıyor. Bunu geçici olarak `IMediator`'a yönlendir:

```csharp
// OrdersController.cs — sadece CreateOrder endpoint'i değişti

[HttpPost]
public async Task<IActionResult> CreateOrder(
    [FromBody] CreateOrderDto dto,
    [FromServices] IMediator mediator)  // geçici: eski inject + yeni
{
    var cmd = new CreateOrderCommand(
        dto.CustomerId,
        dto.Items.Select(i => new CreateOrderItem(i.ProductId, i.Quantity, i.UnitPrice)).ToList()
    );
    var id = await mediator.Send(cmd);
    return CreatedAtAction(nameof(GetOrder), new { id }, new { id });
}
```

**Not:** `IOrderService` inject hâlâ var — diğer method'lar için. Silinmedi.

```bash
dotnet test && dotnet run
# Integration test: POST /orders → 201 Created ✓
git commit -m "refactor(orders): route CreateOrder to MediatR handler (Strangler Fig step 2)"
```

---

## Adım 3: Eski CreateOrder'ı Service'ten Sil

```csharp
// OrderService.cs — CreateOrderAsync method'u kaldırıldı
// IOrderService.cs — CreateOrderAsync imzası kaldırıldı
```

```bash
dotnet build   # compile hatası varsa düzelt
dotnet test    # 25 test GREEN ✓
git commit -m "refactor(orders): remove CreateOrderAsync from OrderService (Strangler Fig step 3)"
```

---

## Adım 4: CancelOrder Slice — Entity Method Önce

Domain invariant'lar önce entity'ye taşınır:

```csharp
// src/Orders/Domain/Order.cs — Cancel method eklendi
public void Cancel(string reason)
{
    if (Status == OrderStatus.Shipped)
        throw new DomainException("Kargoya verilmiş sipariş iptal edilemez.");
    if (Status == OrderStatus.Cancelled)
        throw new DomainException("Sipariş zaten iptal edilmiş.");

    Status = OrderStatus.Cancelled;
    CancelledAt = DateTime.UtcNow;
    CancellationReason = reason;
}
```

Entity unit testi:

```csharp
[Fact]
public void Cancel_WhenShipped_ThrowsDomainException()
{
    var order = OrderFactory.CreateShipped();
    var act = () => order.Cancel("test");
    act.Should().Throw<DomainException>()
        .WithMessage("Kargoya verilmiş*");
}
```

Sonra handler:

```csharp
// src/Orders/CancelOrder/CancelOrderHandler.cs
public async Task Handle(CancelOrderCommand cmd, CancellationToken ct)
{
    var order = await _db.Orders.FindAsync(cmd.OrderId, ct)
        ?? throw new NotFoundException(cmd.OrderId);

    order.Cancel(cmd.Reason);   // invariant entity'de

    await _db.SaveChangesAsync(ct);
    await _email.SendCancellationNotificationAsync(order);
}
```

```bash
dotnet test   # hepsi GREEN ✓
git commit -m "feat(orders): add CancelOrder VSA slice + Order.Cancel entity method (Strangler Fig step 4)"
```

---

## Adım 5–7: Kalan Method'lar

Aynı pattern: ConfirmOrder, ShipOrder, GetOrder, GetOrdersByCustomer.

Her biri için:

```
Slice yaz → Test yaz (kırmızı) → Handler yaz (yeşil) → Controller adapter → Service'ten sil → Commit
```

Commit mesajı şablonu:

```
feat(orders): add <SliceName> VSA slice (Strangler Fig step N)
refactor(orders): route <SliceName> to MediatR (Strangler Fig step N+1)
refactor(orders): remove <MethodName> from OrderService (Strangler Fig step N+2)
```

---

## Adım 8: OrderService'i Sil

Service ve repository artık boş veya sadece `GetOrdersByCustomer` bırakıldıysa:

```csharp
// IOrderService.cs — tüm imzalar silindi, interface boş
// OrderService.cs — tüm method'lar silindi
```

```bash
# Dosyaları sil
git rm src/Orders/OrderService.cs
git rm src/Orders/IOrderService.cs
git rm src/Orders/OrderRepository.cs
git rm src/Orders/IOrderRepository.cs
```

Controller'dan `IOrderService` inject kaldır:

```csharp
// OrdersController.cs — constructor'da sadece IMediator kaldı
public OrdersController(IMediator mediator) => _mediator = mediator;
```

DI registration'ı temizle:

```csharp
// Program.cs — kaldırılanlar:
// builder.Services.AddScoped<IOrderService, OrderService>();
// builder.Services.AddScoped<IOrderRepository, OrderRepository>();
```

```bash
dotnet build && dotnet test
# 35+ test — hepsi GREEN ✓
git commit -m "refactor(orders): remove OrderService + OrderRepository, migration complete (Strangler Fig final)"
```

---

## Sonuç

```
Önce:
  OrderService.cs        600 satır
  IOrderService.cs        30 satır
  OrderRepository.cs      50 satır
  IOrderRepository.cs     20 satır
  OrdersController.cs    120 satır (service inject)

Sonra:
  Orders/CreateOrder/    ~80 satır (Command + Handler + Validator)
  Orders/CancelOrder/    ~50 satır
  Orders/ConfirmOrder/   ~40 satır
  Orders/ShipOrder/      ~40 satır
  Orders/GetOrder/       ~25 satır
  Orders/Domain/Order.cs ~60 satır (entity + invariant'lar)
  OrdersController.cs    ~70 satır (sadece IMediator)

Silinen: 4 dosya (800 satır)
Eklenen: 6 slice klasörü (~365 satır) + entity method'lar
Net: -435 satır, daha iyi dağılım, her slice bağımsız test edilebilir
```

**Kritik nokta:** Her adımda testler yeşil kaldı. Toplam süre: 4-6 saat. Production'da sıfır downtime.
