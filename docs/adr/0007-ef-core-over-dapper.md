# ADR-007: EF Core Varsayılan ORM — Dapper Escape Hatch

**Tarih:** 2026-05-13
**Durum:** Kabul Edildi

## Bağlam

.NET projelerinde veri erişim katmanı için bir ORM stratejisi belirlenmeliydi. Değerlendirilen seçenekler:

1. **EF Core:** Microsoft'un resmi ORM'i. Migration, change tracking, LINQ, relationship mapping out-of-box.
2. **Dapper:** Micro-ORM. Raw SQL + mapping. Minimal abstraction, yüksek performans.
3. **NHibernate:** Olgun, karmaşık mapping, heavy abstraction.
4. **Raw ADO.NET:** Tam kontrol, tam boilerplate.

## Karar

**EF Core varsayılan ORM'dir.** Dapper yalnızca belirli senaryolarda "escape hatch" olarak kullanılır:

- EF Core'un üretemediği complex SQL (window functions, lateral join, recursive CTE)
- Hot path'te EF Core'un query planlamasının yetersiz kaldığı yüksek frekanslı okumalar
- Legacy şema ile çalışmak zorunda kalındığında EF Core mapping karmaşıklaşıyorsa

Repository pattern, bu kararla birlikte ayrı bir değerlendirmeye tabi tutulmuştur (aşağıda).

## Gerekçe

### EF Core Neden Varsayılan?

**Migration desteği:** EF Core migration'ları şema değişikliklerini code-first yönetir. `dotnet ef migrations add` ile üretilen migration dosyaları `ef-core-migration-review` skill'i ile güvenlik açısından incelenir (bkz. ADR referansı).

```bash
dotnet ef migrations add AddOrderTrackingNumber
dotnet ef database update
```

**LINQ sorgu üretimi:** Karmaşık filtreleme, projection ve sayfalama LINQ ile okunabilir biçimde yazılır; EF Core bunları SQL'e çevirir.

```csharp
var orders = await _db.Orders
    .Where(o => o.CustomerId == customerId && o.Status == OrderStatus.Pending)
    .OrderByDescending(o => o.CreatedAt)
    .Select(o => new OrderSummaryDto(o.Id, o.TotalAmount, o.CreatedAt))
    .Skip(page * pageSize)
    .Take(pageSize)
    .AsNoTracking()
    .ToListAsync(ct);
```

**Change tracking:** Entity'nin güncellenip güncellenmediğini takip eder — `SaveChangesAsync()` sadece değişen kolonları UPDATE'e çevirir.

**Testability:** Testcontainers ile gerçek PostgreSQL üzerinde integration test yazmak EF Core ile doğaldır. In-memory provider artık önerilmez (davranış farkları var).

```csharp
// Testcontainers ile gerçek DB integration test
var container = new PostgreSqlBuilder().Build();
await container.StartAsync();
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(container.GetConnectionString())
    .Options;
```

**Ekip familiarity:** EF Core .NET ekosisteminin standart ORM'idir. Yeni ekip üyesi ek öğrenme yükü olmadan başlayabilir.

### Dapper Ne Zaman Kullanılır?

```csharp
// Örnek: Window function gerektiren rapor sorgusu
// EF Core bu sorguyu doğrudan üretemiyor
var report = await _db.Database
    .GetDbConnection()
    .QueryAsync<SalesReportRow>("""
        SELECT
            customer_id,
            SUM(total_amount) AS total,
            RANK() OVER (ORDER BY SUM(total_amount) DESC) AS rank
        FROM orders
        WHERE created_at >= @from AND created_at < @to
        GROUP BY customer_id
        """,
        new { from = startDate, to = endDate });
```

Dapper, EF Core'un aynı `DbConnection`'ını kullanarak eklenir — ayrı bağlantı yönetimi gerektirmez:

```csharp
// Aynı transaction içinde EF Core + Dapper
var conn = _db.Database.GetDbConnection();
// EF Core SaveChanges ile başlayan transaction'a Dapper dahil edilebilir
```

### Repository Pattern Değerlendirmesi

**Silme testi uygulandığında** (bkz. `improve-codebase-architecture` skill'i, ADR referansı):

```csharp
// Shallow repository — silinirse handler sadece bunu yazar:
public class OrderRepository : IOrderRepository
{
    public Task<Order?> GetByIdAsync(Guid id) => _db.Orders.FindAsync(id).AsTask();
    public Task AddAsync(Order o) { _db.Orders.Add(o); return Task.CompletedTask; }
    public Task SaveAsync() => _db.SaveChangesAsync();
}
```

Handler'a `AppDbContext` inject edilince:

```csharp
var order = await _db.Orders.FindAsync(id);
```

Karmaşıklık kaybolur — repository shallow'dı. **Bu tür repository'ler EF Core projelerinde silinmelidir.**

Repository tut:
- EF Core dışında farklı storage var (harici API, Redis, Dapper raw SQL ile Specification pattern)
- Specification pattern uygulanıyor ve sorgu mantığını isimlendirmek istiyorsun

### Reddedilenler

**NHibernate:** Olgun ve güçlü, ancak yapılandırma karmaşıklığı yüksek. EF Core .NET ekosistemiyle daha iyi entegre.

**Raw ADO.NET:** Her sorgu için bağlantı yönetimi, parametre binding, reader mapping elle yazılır. Dapper bile bu ihtiyacı karşılıyor.

**Dapper-only (EF Core'suz):** Migration desteği yok, change tracking yok. Şema yönetimi ayrı araç (Flyway, Liquibase) gerektirir — ekip yükü artar.

## Sonuçlar

**Olumlu:**
- Migration yönetimi tek araç (EF Core) üzerinden, code-first.
- LINQ ile okunabilir, refactor edilebilir sorgular.
- Testcontainers ile gerçek DB integration test doğal.
- Shallow repository'leri silmek codebase'i küçültür.

**Olumsuz / Trade-off:**
- EF Core query plan bazen verimsiz SQL üretir — `AsNoTracking()`, `Select` projection ve `ExecuteUpdate/Delete` kullanımı optimize etmek için gereklidir.
- Complex analytical sorgular için Dapper escape hatch'ini kabul etmek "iki aracı bilmek" anlamına gelir.

## Referanslar

- EF Core resmi dokümantasyon: https://learn.microsoft.com/en-us/ef/core/
- `adapted/improve-codebase-architecture/SKILL.md` — Repository pattern silme testi
- `skills/ef-core-migration-review/SKILL.md` — Migration güvenlik incelemesi
- ADR-001: VSA (handler'larda direkt DbContext kullanımı)
