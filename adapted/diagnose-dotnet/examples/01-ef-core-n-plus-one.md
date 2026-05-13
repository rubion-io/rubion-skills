# Örnek 1: EF Core N+1 Hatasını Diagnose Et

**Semptom:** Orders endpoint'i 50+ kayıt döndüğünde çok yavaş. Bir sipariş hızlı, yüzü yavaş.

---

## Faz 1 — Feedback Loop

```csharp
// BenchmarkDotNet ile ölçüm
[MemoryDiagnoser]
public class OrdersQueryBenchmarks
{
    [Params(10, 50, 200)]
    public int OrderCount { get; set; }

    [Benchmark(Baseline = true)]
    public async Task<List<OrderDto>> CurrentImplementation()
    {
        // mevcut implementasyonu çağır
        var orders = await _db.Orders.ToListAsync();
        return orders.Select(o => new OrderDto(
            o.Id,
            o.Items.Count,   // ← lazy load tetikleniyor
            o.Customer.Name  // ← başka bir lazy load
        )).ToList();
    }
}
```

```bash
dotnet run -c Release -- --filter "*OrdersQueryBenchmarks*"
```

| N | Mean | Ratio |
|---|---|---|
| 10 | 45 ms | 1.0× |
| 50 | 220 ms | 4.9× |
| 200 | 880 ms | 19.6× |

Lineer olmayan büyüme → N+1.

---

## Faz 2 — Reproduce

EF Core log'larını açarak SQL çıktısını gözlemle:

```json
// appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
```

10 sipariş için 21 SQL görüyorsan (1 + 10 items + 10 customers) → N+1 doğrulandı.

---

## Faz 3 — Hipotezler

1. **`o.Items` lazy load** — Her sipariş için ayrı SELECT. (En olası)
2. **`o.Customer.Name` lazy load** — Aynı sorun, Customer navigation property.
3. **`AsTracking` overhead** — Change tracker bellekte büyüyor.

---

## Faz 4 — Instrument

```csharp
// Mevcut kötü kod:
var orders = await _db.Orders.ToListAsync();
// → Buradan sonra o.Items erişimi her satır için yeni query

// Hedefli log ekle:
_logger.LogDebug("[DBG-n1a4] Fetched {Count} orders from DB", orders.Count);
// SQL sayısını log'dan say
```

---

## Faz 5 — Fix

```csharp
// Düzeltme: eager load + projection
var orders = await _db.Orders
    .AsNoTracking()
    .Include(o => o.Items)
    .Include(o => o.Customer)
    .Select(o => new OrderDto(
        o.Id,
        o.Items.Count,
        o.Customer.Name))
    .ToListAsync();
```

Ya da saf projection (en verimli):

```csharp
var orders = await _db.Orders
    .AsNoTracking()
    .Select(o => new OrderDto(
        o.Id,
        o.Items.Count(),   // SQL'de COUNT — entity materialize olmaz
        o.Customer.Name))
    .ToListAsync();
```

**Benchmark sonucu:**

| N | Öncesi | Sonrası | Fark |
|---|---|---|---|
| 10 | 45 ms | 8 ms | 5.6× hız |
| 50 | 220 ms | 12 ms | 18× hız |
| 200 | 880 ms | 18 ms | 49× hız |

---

## Faz 6 — Cleanup

```bash
grep -r "DBG-n1a4" src/   # 0 sonuç — temiz
```

Regression test:

```csharp
[Fact]
public async Task GetOrders_LargeDataset_CompletesUnder100ms()
{
    // seed 200 orders
    var stopwatch = Stopwatch.StartNew();
    var result = await _sut.GetOrdersAsync();
    stopwatch.Stop();

    result.Should().HaveCount(200);
    stopwatch.ElapsedMilliseconds.Should().BeLessThan(100);
}
```

**Post-mortem:** Navigation property'leri lazy load olarak bırakmak, küçük veri setinde fark edilmiyor ama prod'da belirgin. `AsNoTracking` + eager load veya projection kuralı `CONTRIBUTING.md`'ye eklendi.
