# Örnek 2: Integration Test — Testcontainers + PostgreSQL

Senaryo: `OrderRepository.SaveAsync` metodunu gerçek PostgreSQL ile test et.

## Paket Kurulumu

```xml
<!-- MyProject.Tests.csproj -->
<PackageReference Include="Testcontainers.PostgreSql" Version="3.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.*" />
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.*" />
```

---

## Container Fixture (Paylaşılan — IClassFixture)

```csharp
public class PostgresFixture : IAsyncLifetime
{
    public PostgreSqlContainer Container { get; } = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("rubion_test")
        .Build();

    public string ConnectionString => Container.GetConnectionString();

    public async Task InitializeAsync() => await Container.StartAsync();
    public async Task DisposeAsync()    => await Container.DisposeAsync();
}
```

---

## Test Sınıfı

```csharp
public class OrderRepositoryTests : IClassFixture<PostgresFixture>, IAsyncLifetime
{
    private readonly PostgresFixture _fixture;
    private AppDbContext _db = null!;
    private OrderRepository _sut = null!;

    public OrderRepositoryTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_fixture.ConnectionString)
            .Options;

        _db = new AppDbContext(options);
        await _db.Database.MigrateAsync();           // migration'lar uygulanır
        await _db.Database.ExecuteSqlRawAsync("""    -- her testten önce temiz başla
            TRUNCATE orders, order_items RESTART IDENTITY CASCADE;
        """);

        _sut = new OrderRepository(_db);
    }

    public async Task DisposeAsync() => await _db.DisposeAsync();

    // ─── Testler ────────────────────────────────────────────────────────────

    [Fact]
    public async Task SaveAsync_NewOrder_PersistedWithItems()
    {
        var order = Order.Create(
            customerId: Guid.NewGuid(),
            items: [new OrderItem(ProductId: Guid.NewGuid(), Quantity: 3)]);

        await _sut.SaveAsync(order);

        var loaded = await _db.Orders
            .Include(o => o.Items)
            .SingleAsync(o => o.Id == order.Id);

        loaded.CustomerId.Should().Be(order.CustomerId);
        loaded.Items.Should().HaveCount(1);
        loaded.Items[0].Quantity.Should().Be(3);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistent_ReturnsNull()
    {
        var result = await _sut.GetByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task SaveAsync_DuplicateId_ThrowsDbUpdateException()
    {
        var order = Order.Create(Guid.NewGuid(), []);
        await _sut.SaveAsync(order);

        var duplicate = order; // aynı Id

        var act = async () => await _sut.SaveAsync(duplicate);

        await act.Should().ThrowAsync<DbUpdateException>();
    }
}
```

---

## EF Core N+1 Tuzağından Kaçınma

```csharp
// Yanlış: her order için ayrı sorgu (N+1)
var orders = await _db.Orders.ToListAsync();
foreach (var o in orders)
{
    _ = o.Items; // lazy load — her satır = ayrı SQL
}

// Doğru: tek sorgu
var orders = await _db.Orders
    .Include(o => o.Items)
    .ToListAsync();

// Sadece okuma ise AsNoTracking ekle
var orders = await _db.Orders
    .AsNoTracking()
    .Include(o => o.Items)
    .ToListAsync();
```

---

## İpuçları

- `IAsyncLifetime` üzerindeki `InitializeAsync`, her test sınıfı **bir kez** çalışır. Testler arasında temizlik için `TRUNCATE` kullan.
- Container'ı `IClassFixture` ile paylaşmak, her test için yeni container başlatmaktan çok daha hızlıdır.
- CI'da Docker soketi erişimi gerekir — GitHub Actions'ta varsayılan olarak açıktır.
- MSSQL için `Testcontainers.MsSql` paketi ve `UseSqlServer(...)` yeterli; test kodu aynı kalır.
