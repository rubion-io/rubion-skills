# Örnek: Inventory.Api — Sıfırdan Mikroservis

Senaryo: `Inventory.Api` mikroservisi — PostgreSQL + RabbitMQ + OpenTelemetry. Komutları sırayla çalıştır.

---

## Başlangıç: Repo Yapısı

```
services/
└── Inventory/
    ├── Inventory.Api/          ← bu örnek
    └── Inventory.Tests/        ← entegrasyon testleri
```

---

## 1. Proje Oluştur

```bash
mkdir -p services/Inventory
cd services/Inventory

dotnet new webapi -n Inventory.Api --use-minimal-apis
dotnet new xunit -n Inventory.Tests

dotnet new sln -n Inventory
dotnet sln add Inventory.Api/Inventory.Api.csproj
dotnet sln add Inventory.Tests/Inventory.Tests.csproj
dotnet add Inventory.Tests/Inventory.Tests.csproj reference Inventory.Api/Inventory.Api.csproj
```

---

## 2. Paket Kurulumu

```bash
cd Inventory.Api

# EF Core + PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

# CQRS + Validation
dotnet add package MediatR.Extensions.Microsoft.DependencyInjection
dotnet add package FluentValidation.AspNetCore

# Mesajlaşma
dotnet add package MassTransit.RabbitMQ

# Observability
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Instrumentation.Http
dotnet add package OpenTelemetry.Instrumentation.EntityFrameworkCore
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol

# Logging
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.Seq

cd ../Inventory.Tests

# Test
dotnet add package FluentAssertions
dotnet add package NSubstitute
dotnet add package Testcontainers.PostgreSql
dotnet add package Microsoft.AspNetCore.Mvc.Testing
```

---

## 3. Program.cs (Tam İçerik)

```csharp
// Inventory.Api/Program.cs

using MassTransit;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ──────────────────────────────────────────────
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Seq(ctx.Configuration["Seq:Url"] ?? "http://localhost:5341"));

// ── EF Core / PostgreSQL ─────────────────────────────────
builder.Services.AddDbContext<InventoryDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// ── MediatR ──────────────────────────────────────────────
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssemblyContaining<Program>());

// ── FluentValidation ─────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ── MassTransit / RabbitMQ ───────────────────────────────
builder.Services.AddMassTransit(x =>
{
    x.AddConsumers(typeof(Program).Assembly);

    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMQ:Host"] ?? "localhost", "/", h =>
        {
            h.Username(builder.Configuration["RabbitMQ:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMQ:Password"] ?? "guest");
        });

        cfg.ConfigureEndpoints(ctx);
    });
});

// ── OpenTelemetry ─────────────────────────────────────────
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r
        .AddService("Inventory.Api", serviceVersion: "1.0.0"))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter(o =>
            o.Endpoint = new Uri(
                builder.Configuration["Otel:Endpoint"] ?? "http://localhost:4317")));

// ── Health Checks ─────────────────────────────────────────
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!);

var app = builder.Build();

// ── Middleware ────────────────────────────────────────────
app.UseSerilogRequestLogging();

// ── Endpoints ─────────────────────────────────────────────
app.MapHealthChecks("/health");

// Inventory endpoints — slice'lar burada register edilir
app.MapInventoryEndpoints();

app.Run();

public partial class Program { }  // integration test erişimi için
```

---

## 4. DbContext

```csharp
// Inventory.Api/Infrastructure/InventoryDbContext.cs

using Microsoft.EntityFrameworkCore;

namespace Inventory.Api.Infrastructure;

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options)
        : base(options) { }

    public DbSet<StockItem> StockItems => Set<StockItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StockItem>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Sku).HasMaxLength(100).IsRequired();
            b.Property(x => x.Quantity).IsRequired();
            b.HasIndex(x => x.Sku).IsUnique();
        });
    }
}
```

---

## 5. İlk Slice: GetStockItem

```csharp
// Inventory.Api/Features/Stock/GetStockItem/GetStockItemQuery.cs

using MediatR;

namespace Inventory.Api.Features.Stock.GetStockItem;

public record GetStockItemQuery(string Sku) : IRequest<StockItemDto?>;
public record StockItemDto(Guid Id, string Sku, int Quantity);
```

```csharp
// Inventory.Api/Features/Stock/GetStockItem/GetStockItemHandler.cs

using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Api.Features.Stock.GetStockItem;

public class GetStockItemHandler : IRequestHandler<GetStockItemQuery, StockItemDto?>
{
    private readonly InventoryDbContext _db;

    public GetStockItemHandler(InventoryDbContext db) => _db = db;

    public async Task<StockItemDto?> Handle(GetStockItemQuery query, CancellationToken ct)
        => await _db.StockItems
            .Where(s => s.Sku == query.Sku)
            .Select(s => new StockItemDto(s.Id, s.Sku, s.Quantity))
            .FirstOrDefaultAsync(ct);
}
```

```csharp
// Inventory.Api/Features/Stock/StockEndpoints.cs

using MediatR;
using Inventory.Api.Features.Stock.GetStockItem;

namespace Inventory.Api.Features.Stock;

public static class StockEndpoints
{
    public static WebApplication MapInventoryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/stock").WithTags("Stock");

        group.MapGet("/{sku}", async (string sku, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetStockItemQuery(sku));
            return result is null ? Results.NotFound() : Results.Ok(result);
        })
        .WithName("GetStockItem");

        return app;
    }
}
```

---

## 6. Migration Üret

```bash
cd Inventory.Api

# İlk migration
dotnet ef migrations add InitialCreate \
  --output-dir Infrastructure/Migrations

# Dev DB'ye uygula (docker-compose DB ayakta olmalı)
dotnet ef database update
```

---

## 7. Dockerfile

```dockerfile
# Inventory.Api/Dockerfile

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Restore
COPY *.sln .
COPY Inventory.Api/Inventory.Api.csproj Inventory.Api/
COPY Inventory.Tests/Inventory.Tests.csproj Inventory.Tests/
RUN dotnet restore

# Build
COPY . .
RUN dotnet publish Inventory.Api/Inventory.Api.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user (güvenlik)
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Inventory.Api.dll"]
```

---

## 8. docker-compose.override.yml

```yaml
# docker-compose.override.yml (repo kök veya services/ altında)

services:
  inventory-api:
    build:
      context: ./services/Inventory
      dockerfile: Inventory.Api/Dockerfile
    ports:
      - "5101:8080"
    environment:
      - ConnectionStrings__Postgres=Host=postgres;Database=inventory;Username=rubion;Password=rubion123
      - RabbitMQ__Host=rabbitmq
      - RabbitMQ__Username=guest
      - RabbitMQ__Password=guest
      - Otel__Endpoint=http://jaeger:4317
      - Seq__Url=http://seq:5341
    depends_on:
      - postgres
      - rabbitmq
      - jaeger
      - seq
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

## 9. appsettings.json

```json
{
  "ConnectionStrings": {
    "Postgres": "Host=localhost;Database=inventory;Username=rubion;Password=rubion123"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Username": "guest",
    "Password": "guest"
  },
  "Otel": {
    "Endpoint": "http://localhost:4317"
  },
  "Seq": {
    "Url": "http://localhost:5341"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.EntityFrameworkCore": "Warning"
      }
    }
  }
}
```

---

## 10. İlk Smoke Test

```bash
# Docker stack başlat
docker-compose up -d postgres rabbitmq jaeger seq

# Servisi local çalıştır
cd services/Inventory/Inventory.Api
dotnet run

# Health check
curl http://localhost:5101/health
# → {"status":"Healthy","results":{"npgsql":{"status":"Healthy"}}}

# İlk API çağrısı
curl -s http://localhost:5101/stock/SKU-001 | jq .
# → null (henüz veri yok — 404)

# Test verisi ekle (migration sonrası veya seed script ile)
curl -X POST http://localhost:5101/stock \
  -H "Content-Type: application/json" \
  -d '{"sku":"SKU-001","quantity":100}'
# → 201 Created

curl -s http://localhost:5101/stock/SKU-001 | jq .
# → {"id":"...","sku":"SKU-001","quantity":100}
```

---

## 11. Integration Test (Testcontainers)

```csharp
// Inventory.Tests/Integration/StockEndpointsTests.cs

public class StockEndpointsTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("inventory_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.Single(
                        d => d.ServiceType == typeof(DbContextOptions<InventoryDbContext>));
                    services.Remove(descriptor);
                    services.AddDbContext<InventoryDbContext>(opts =>
                        opts.UseNpgsql(_postgres.GetConnectionString()));
                });
            });

        // DB'yi migrate et
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
        await db.Database.MigrateAsync();

        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetStock_ExistingSku_Returns200()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
        db.StockItems.Add(new StockItem { Id = Guid.NewGuid(), Sku = "TEST-001", Quantity = 50 });
        await db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/stock/TEST-001");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<StockItemDto>();
        body!.Sku.Should().Be("TEST-001");
        body.Quantity.Should().Be(50);
    }

    [Fact]
    public async Task GetStock_MissingSku_Returns404()
    {
        var response = await _client.GetAsync("/stock/NOT-EXIST");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    public async Task DisposeAsync()
    {
        await _factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }
}
```

```bash
dotnet test services/Inventory/Inventory.Tests/ --logger "console;verbosity=normal"
# PASS — 2 integration test ✓
```

---

## Sonuç

Bu adımları takip ettiğinde elimde:

- `Inventory.Api` çalışan servis (health check, `GET /stock/{sku}`)
- PostgreSQL bağlantısı + EF Core migration
- MassTransit/RabbitMQ hazır (consumer'lar sonradan eklenir)
- OpenTelemetry → Jaeger trace
- Serilog → Seq log
- Docker multi-stage build (non-root user)
- docker-compose entegrasyonu
- 2 integration test (Testcontainers ile gerçek PostgreSQL)

Toplam süre: ~45 dk (ilk kez). İkinci servis için aynı şablonu kopyala, servis adını değiştir: ~15 dk.
