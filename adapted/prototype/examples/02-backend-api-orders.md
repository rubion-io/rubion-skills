# Örnek: Backend API — Endpoint Contract POC

**Soru:** "Client orderId mi vermeli, server mı üretmeli?"
**Mod:** Backend API (`dotnet new web`)

---

## Setup

```bash
mkdir -p services/orders/_prototype
cd services/orders/_prototype
dotnet new web -n OrdersProto
cd OrdersProto
```

## Program.cs

```csharp
// _prototype — silinecek, prod değil

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var orders = new List<dynamic>();

// Variant A: server orderId üretir
app.MapPost("/v-a/orders", (CreateOrderDto dto) =>
{
    var id = Guid.NewGuid();
    orders.Add(new { id, dto.Customer, dto.Items });
    return Results.Created($"/v-a/orders/{id}", new { id });
});

// Variant B: client orderId verir, server idempotent
app.MapPut("/v-b/orders/{id:guid}", (Guid id, CreateOrderDto dto) =>
{
    if (orders.Any(o => o.id == id)) return Results.NoContent();
    orders.Add(new { id, dto.Customer, dto.Items });
    return Results.Created($"/v-b/orders/{id}", new { id });
});

app.MapGet("/orders", () => orders);
app.Run();

record CreateOrderDto(string Customer, List<OrderItemDto> Items);
record OrderItemDto(string ProductCode, int Quantity);
```

## Test

```bash
dotnet run
# Variant A
curl -X POST http://localhost:5000/v-a/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":"ACME","items":[{"productCode":"P1","quantity":2}]}'

# Variant B (idempotent)
curl -X PUT http://localhost:5000/v-b/orders/00000000-0000-0000-0000-000000000001 \
  -H "Content-Type: application/json" \
  -d '{"customer":"ACME","items":[{"productCode":"P1","quantity":2}]}'
```

İki variant yan yana — hangisi daha kullanışlı, deneyerek karar verilir.

---

## Karar Notu

```
Karar: Variant B (client-side idempotent PUT) seçildi.
Gerekçe: mobile offline senaryosunda retry güvenli olmalı.
```
