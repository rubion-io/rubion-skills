# Örnek: EF Core N+1 Sorununu Tespit Et ve Çöz

**Senaryo:** `/orders` endpoint'i 50 sipariş için saniyeler sürüyor.

---

## Tespit — Log Seviyesi Aç

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

Bu ayarla çalıştırılan **her SQL** konsola düşer. Aynı pattern'de çok sayıda `SELECT` görüyorsan → **N+1**.

```
SELECT * FROM orders WHERE customer_id = '...'        ← 1 sorgu
SELECT * FROM order_items WHERE order_id = 1          ← N kez tekrarlanan
SELECT * FROM order_items WHERE order_id = 2
SELECT * FROM order_items WHERE order_id = 3
...
```

---

## Çözüm 1: Eager Load

```csharp
var orders = await _db.Orders
    .Include(o => o.Items)
    .ThenInclude(i => i.Product)
    .ToListAsync();
```

Tek `JOIN`'lu sorguya iner.

---

## Çözüm 2: Projection (Sadece İhtiyaç Duyulan Kolonlar)

```csharp
var summaries = await _db.Orders
    .Select(o => new OrderSummaryDto(
        o.Id,
        o.Items.Count,
        o.TotalAmount
    ))
    .ToListAsync();
```

EF Core en optimal SQL'i üretir, tüm entity'leri hydrate etmez.

---

## Query Plan Okuma (PostgreSQL)

```sql
EXPLAIN ANALYZE
SELECT * FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.customer_id = '...'
ORDER BY o.created_at DESC;
```

- **`Seq Scan`** → index eksik. Büyük tablolarda `CreateIndex` migration ekle.
- **`Index Scan`** → iyi.
- **`Hash Join` + büyük work_mem** → memory kullanımı yüksek, kontrol et.

---

## Doğrulama

```bash
dotnet run
curl http://localhost:5000/orders | jq 'length'
# Log'da kaç SQL gördün? 1 olmalı (eager load) veya 2 (projection + ana).
```

Hâlâ N+1 görüyorsan: `Include` chain'ini doğru kurmadın veya `.Select()` lazy property çağırıyor.
