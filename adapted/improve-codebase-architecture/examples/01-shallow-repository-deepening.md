# Örnek: OrderService Analizi — Silme Testi ve Derinleştirme

Senaryo: `OrderService` 600 satır, 8 method. Mimari inceleme: hangi parçalar shallow, hangileri kalmalı?

---

## Başlangıç Durumu

```
src/
└── Orders/
    ├── OrderService.cs         ← 600 satır, 8 method
    ├── IOrderService.cs
    ├── OrderRepository.cs      ← EF Core wrap
    ├── IOrderRepository.cs
    └── OrdersController.cs     ← OrderService inject eder
```

---

## Mevcut Kod (Kısaltılmış)

```csharp
// OrderService.cs
public class OrderService : IOrderService
{
    private readonly IOrderRepository _repo;
    private readonly IEmailService _email;
    private readonly ILogger<OrderService> _logger;

    // Method 1 — sadece EF Core wrapper
    public Task<Order?> GetOrderByIdAsync(Guid id)
        => _repo.GetByIdAsync(id);

    // Method 2 — sadece EF Core wrapper
    public Task<List<Order>> GetOrdersByCustomerAsync(Guid customerId)
        => _repo.GetByCustomerAsync(customerId);

    // Method 3 — iş mantığı var
    public async Task<Order> CreateOrderAsync(CreateOrderDto dto)
    {
        if (dto.Items.Count == 0)
            throw new DomainException("Sipariş en az 1 ürün içermelidir.");

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = dto.CustomerId,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        foreach (var item in dto.Items)
        {
            order.Items.Add(new OrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
            });
        }

        order.TotalAmount = order.Items.Sum(i => i.Quantity * i.UnitPrice);
        await _repo.AddAsync(order);
        await _repo.SaveAsync();
        return order;
    }

    // Method 4 — iş mantığı var
    public async Task CancelOrderAsync(Guid id, string reason)
    {
        var order = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException($"Order {id} not found");

        if (order.Status == OrderStatus.Shipped)
            throw new DomainException("Kargoya verilmiş sipariş iptal edilemez.");

        if (order.Status == OrderStatus.Cancelled)
            throw new DomainException("Sipariş zaten iptal edilmiş.");

        order.Status = OrderStatus.Cancelled;
        order.CancelledAt = DateTime.UtcNow;
        order.CancellationReason = reason;

        await _repo.SaveAsync();
        await _email.SendCancellationNotificationAsync(order);
    }

    // Method 5 — sadece EF Core wrapper
    public async Task UpdateShippingAddressAsync(Guid id, AddressDto address)
    {
        var order = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException($"Order {id} not found");

        order.ShippingAddress = address.ToEntity();
        await _repo.SaveAsync();
    }

    // Method 6 — domain invariant tekrar
    public async Task ConfirmOrderAsync(Guid id)
    {
        var order = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException($"Order {id} not found");

        if (order.Status != OrderStatus.Pending)
            throw new DomainException("Sadece beklemedeki siparişler onaylanabilir.");

        order.Status = OrderStatus.Confirmed;
        order.ConfirmedAt = DateTime.UtcNow;
        await _repo.SaveAsync();
    }

    // Method 7 — domain invariant tekrar
    public async Task ShipOrderAsync(Guid id, string trackingNumber)
    {
        var order = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException($"Order {id} not found");

        if (order.Status != OrderStatus.Confirmed)
            throw new DomainException("Sadece onaylanmış siparişler kargoya verilebilir.");

        order.Status = OrderStatus.Shipped;
        order.ShippedAt = DateTime.UtcNow;
        order.TrackingNumber = trackingNumber;
        await _repo.SaveAsync();
    }

    // Method 8 — cross-cutting, notification
    public async Task<List<Order>> GetPendingOrdersOlderThanAsync(int hours)
        => await _repo.GetPendingOlderThanAsync(DateTime.UtcNow.AddHours(-hours));
}
```

---

## Silme Testi Uygulaması

Her method için: "Sildim. Karmaşıklık nereye gitti?"

### Method 1: `GetOrderByIdAsync`

```csharp
// Silersem caller şöyle yazar:
var order = await _db.Orders.FindAsync(id);
```

Karmaşıklık? **Kayboldu** — sadece `_db.Orders.FindAsync` tek satır. **Shallow.** ✗

### Method 2: `GetOrdersByCustomerAsync`

```csharp
// Silersem caller şöyle yazar:
var orders = await _db.Orders.Where(o => o.CustomerId == customerId).ToListAsync();
```

Karmaşıklık? **Kayboldu**. **Shallow.** ✗

### Method 3: `CreateOrderAsync`

```csharp
// Silersem bu mantık 2 yerde gözükür:
// - API handler'da
// - Background job'da (yeniden gelen siparişler için)
if (dto.Items.Count == 0) throw ...
order.TotalAmount = order.Items.Sum(...)
```

Karmaşıklık? **N caller'a yayılır.** İş mantığı, doğrulama. **Deep.** ✓

### Method 4: `CancelOrderAsync`

```csharp
// İki farklı controller çağırıyor (customer cancel + admin cancel)
// Silersem:
if (order.Status == OrderStatus.Shipped) throw ...
if (order.Status == OrderStatus.Cancelled) throw ...
// Bu 2 caller'da tekrarlanır
```

Karmaşıklık? **2 caller'da yayılır.** Domain invariant. **Deep** ama yanlış yerde — entity'ye taşınmalı. ✓ (ama entity'de olmalı)

### Method 5: `UpdateShippingAddressAsync`

```csharp
// Silersem:
var order = await _db.Orders.FindAsync(id);
order.ShippingAddress = address.ToEntity();
await _db.SaveChangesAsync();
```

Karmaşıklık? **Kayboldu** — 3 satır, hiç mantık yok. **Shallow.** ✗

### Method 6: `ConfirmOrderAsync` ve Method 7: `ShipOrderAsync`

```csharp
// Silersem bu status kontrolleri birden fazla handler'a yayılır
// Ama aslında Order ENTITY'si zaten durumunu biliyor
// order.Confirm() ve order.Ship() metotları olabilir
```

Karmaşıklık? **Entity'ye taşınabilir**, service'e gerek yok. Service **pass-through + thin wrapper**. ✓ (entity method'u olarak)

### Method 8: `GetPendingOrdersOlderThanAsync`

```csharp
// Silersem:
await _db.Orders.Where(o => o.Status == OrderStatus.Pending
    && o.CreatedAt < DateTime.UtcNow.AddHours(-hours)).ToListAsync();
```

Karmaşıklık? Kayboldu + query semantiği kaybolur. Tek kullanım (background job). **Shallow** ama query ismi değerliyse Specification olabilir. ✓ (query object olarak)

---

## Bulgular

| Method | Karar | Gerekçe |
|---|---|---|
| `GetOrderByIdAsync` | Sil | `_db.Orders.FindAsync` ile aynı |
| `GetOrdersByCustomerAsync` | Sil | LINQ yazımı kadar kolay |
| `CreateOrderAsync` | Tut (handler'a taşı) | Domain iş mantığı + validation |
| `CancelOrderAsync` | Entity'ye taşı | `order.Cancel(reason)` invariant olmalı |
| `UpdateShippingAddressAsync` | Sil | Hiç mantık yok |
| `ConfirmOrderAsync` | Entity'ye taşı | `order.Confirm()` |
| `ShipOrderAsync` | Entity'ye taşı | `order.Ship(trackingNumber)` |
| `GetPendingOrdersOlderThanAsync` | Specification yaz | Query semantiği değerli |

---

## 3 Derinleştirme Önerisi

### Öneri 1 — OrderRepository'yi sil

```csharp
// OrderRepository mevcut (SHALLOW):
public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _db;
    public Task<Order?> GetByIdAsync(Guid id) => _db.Orders.FindAsync(id).AsTask();
    public Task<List<Order>> GetByCustomerAsync(Guid id)
        => _db.Orders.Where(o => o.CustomerId == id).ToListAsync();
    public Task AddAsync(Order o) { _db.Orders.Add(o); return Task.CompletedTask; }
    public Task SaveAsync() => _db.SaveChangesAsync();
}

// Silme testi: handler doğrudan _db kullanırsa kaybolur mu?
// → Evet. Her yerde _db.Orders doğrudan kullanılır.
// → IOrderRepository için sahte implementasyon yazmaya gerek kalmaz.
// → Testcontainers gerçek DB ile test → daha güvenilir.
```

**Sonuç:** `OrderRepository` + `IOrderRepository` silinir. Handler'lar `AppDbContext` inject eder.

### Öneri 2 — Domain Invariant'ları Entity'ye Taşı

```csharp
// Order.cs — entity methodları
public class Order
{
    public OrderStatus Status { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }
    // ... diğer property'ler

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

    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException("Sadece beklemedeki siparişler onaylanabilir.");

        Status = OrderStatus.Confirmed;
        ConfirmedAt = DateTime.UtcNow;
    }

    public void Ship(string trackingNumber)
    {
        if (Status != OrderStatus.Confirmed)
            throw new DomainException("Sadece onaylanmış siparişler kargoya verilebilir.");

        Status = OrderStatus.Shipped;
        ShippedAt = DateTime.UtcNow;
        TrackingNumber = trackingNumber;
    }
}
```

**Avantaj:** `CancelOrderCommand` handler'ı:

```csharp
// Önce (service'de):
await _orderService.CancelOrderAsync(command.OrderId, command.Reason);

// Sonra (handler'da doğrudan):
var order = await _db.Orders.FindAsync(command.OrderId)
    ?? throw new NotFoundException(command.OrderId);
order.Cancel(command.Reason);   // invariant entity'de
await _db.SaveChangesAsync();
await _email.SendCancellationNotificationAsync(order);
```

### Öneri 3 — VSA Slice'larına Böl

```
src/Orders/
├── CreateOrder/
│   ├── CreateOrderCommand.cs
│   ├── CreateOrderHandler.cs
│   └── CreateOrderValidator.cs
├── CancelOrder/
│   ├── CancelOrderCommand.cs
│   └── CancelOrderHandler.cs
├── ConfirmOrder/
│   ├── ConfirmOrderCommand.cs
│   └── ConfirmOrderHandler.cs
├── ShipOrder/
│   ├── ShipOrderCommand.cs
│   └── ShipOrderHandler.cs
└── Domain/
    └── Order.cs               ← entity, invariant method'larıyla
```

Her slice `AppDbContext` inject eder. `OrderService` + `OrderRepository` tamamen silinir.

---

## Sonuç Durumu

```
Öncesi: OrderService.cs (600 satır) + OrderRepository.cs + IOrderService.cs + IOrderRepository.cs
Sonrası:
  - 4 ayrı handler (her biri ~30 satır)
  - Order.cs entity (domain invariant'larla)
  - AppDbContext direkt kullanım
  - 4 test dosyası (handler başına)

Silinen: OrderService, IOrderService, OrderRepository, IOrderRepository (4 dosya)
Eklenen: 4 Command + 4 Handler + Order entity method'ları
Net LOC değişimi: -240 satır (400→160)
```

**Bu analizde kullanılan sözlük:** CONTEXT.md'nin "sipariş", "iptal", "kargo" terminolojisi korundu. Yeni terim gerekmedi.
