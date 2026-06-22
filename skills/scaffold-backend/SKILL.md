---
name: scaffold-backend
description: Yeni bir .NET backend iskeleti oluşturur — monolith (tek modüler API) veya mikroservis. Solution + VSA klasör yapısı + MediatR/FluentValidation/EF Core/Serilog/OTel altyapısı + Dockerfile + docker-compose. "Backend kur", "solution oluştur", "monolith iskelet", "mikroservis scaffold" denildiğinde kullan.
stack: [dotnet, csharp, docker, postgresql, mediatr]
---

# Scaffold Backend — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

> **Mimari kararlar:** VSA → [ADR-0001](../../docs/adr/0001-vertical-slice-architecture-default.md) · PostgreSQL → [ADR-0002](../../docs/adr/0002-postgresql-primary-database.md) · MediatR → [ADR-0003](../../docs/adr/0003-mediatr-cqrs-pipeline.md) · DB-per-service → [ADR-0004](../../docs/adr/0004-database-per-service.md) · MassTransit → [ADR-0005](../../docs/adr/0005-masstransit-rabbitmq.md) · EF Core → [ADR-0007](../../docs/adr/0007-ef-core-over-dapper.md)

Bu skill bir .NET backend'in **sıfırdan iskeletini** kurar. Tek bir feature değil — solution, altyapı, Docker ve VSA klasör düzeni. Feature eklemek için sonra [`scaffold-vsa-feature`](../scaffold-vsa-feature/SKILL.md) kullanılır.

---

## Önce Sor

Tek mesajda hepsini sor:

1. **Tür: Monolith mi, Mikroservis mi?** — Bütün dallanma buna bağlı.
   - **Monolith** (varsayılan): Tek modüler API projesi, tek PostgreSQL, modüller arası in-process MediatR. Takım < 5 kişi, domain henüz netleşmemiş → bunu seç (bkz. stack-conventions karar ağacı).
   - **Mikroservis**: Bağımsız deploy + DB-per-service + MassTransit/RabbitMQ. Bağımsız ölçekleme/deploy zorunluysa.
2. **Proje/Servis adı** nedir? (PascalCase — örn: `Rubion.Erp`, `Inventory`, `PaymentGateway`)
3. **İlk modül adı** nedir? (örn: `Orders`, `Catalog` — iskelet boş bir modül klasörü açar)
4. **Veritabanı:** PostgreSQL (varsayılan) / MSSQL (legacy istemci) / yok
5. **Mikroservis ise:** Worker (mesaj tüketici) gerekli mi? Mesajlaşma var mı (MassTransit + RabbitMQ)?

> **TFM:** Tüm şablonlar **net10.0** hedefler (güncel LTS). Docker base image `10.0`.

Tür cevabına göre **Dal A (Monolith)** veya **Dal B (Mikroservis)** uygulanır. Ortak adımlar her ikisinde de geçerlidir.

### Mono-repo Yerleşimi

Aynı repo'da frontend de olacaksa (full-stack — bkz. [stack-conventions](../../docs/stack-conventions.md) Mono-repo Kök Düzeni), backend `src/backend/` altına kök salar:

- Monolith: `src/backend/<Project>.sln` + `src/backend/<Project>.Api/` + `src/backend/<Project>.Tests/`
- Mikroservis: `src/backend/services/<service-kebab>/...`
- Frontend `src/frontend/` altına gelir (`scaffold-frontend-react`).

**Backend-only** repo ise (frontend ayrı repo) `src/backend/` ön eki yok — `.sln` repo kökünde, aşağıdaki komutlardaki yollar aynen geçerli.

Kullanıcıya sor: "Frontend de bu repo'da mı olacak?" Evet ise aşağıdaki tüm yollara `src/backend/` ön ekini uygula.

---

## Dal A — Monolith

Tek bir API projesi; modüller içeride klasör olarak yaşar, aralarında **in-process MediatR `INotification`** ile haberleşir. RabbitMQ yok — domain bölünme ihtiyacı doğarsa Strangler Fig ile mikroservise geçilir.

### A.1 Solution + Proje Oluşturma

```bash
# .NET 9+ webapi şablonu minimal API + Microsoft.AspNetCore.OpenApi'yi varsayılan kullanır
# (Swashbuckle yerine yerleşik OpenAPI). Controller istersen --use-controllers ekle.

dotnet new sln -n <ProjectName>

dotnet new webapi -n <ProjectName>.Api -f net10.0 -o src/<ProjectName>.Api
dotnet new xunit  -n <ProjectName>.Tests -f net10.0 -o tests/<ProjectName>.Tests

dotnet sln add src/<ProjectName>.Api
dotnet sln add tests/<ProjectName>.Tests

# Test → Api referansı
dotnet add tests/<ProjectName>.Tests reference src/<ProjectName>.Api
```

### A.2 Klasör Yapısı

```
<ProjectName>/
├── <ProjectName>.sln
├── Directory.Build.props          ← ortak TFM, nullable, analiz kuralları
├── Directory.Packages.props       ← merkezi paket versiyonları (CPM)
├── docker-compose.yml             ← api + postgres + jaeger
├── src/
│   └── <ProjectName>.Api/
│       ├── Program.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       ├── Dockerfile
│       ├── <Module>/              ← ilk modül (boş slice klasörü)
│       │   └── Shared/            ← modül içi paylaşılan tipler
│       ├── Infrastructure/
│       │   └── Persistence/
│       │       ├── AppDbContext.cs
│       │       └── Configurations/
│       └── Common/
│           ├── Behaviors/ValidationBehavior.cs
│           └── Middleware/CorrelationIdMiddleware.cs
└── tests/
    └── <ProjectName>.Tests/
        └── <Module>/
```

### A.3 Central Package Management

`Directory.Packages.props` (solution kökü):

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="MediatR" Version="12.4.1" />
    <PackageVersion Include="FluentValidation" Version="11.10.0" />
    <PackageVersion Include="FluentValidation.DependencyInjectionExtensions" Version="11.10.0" />
    <PackageVersion Include="FluentResults" Version="3.16.0" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.0" />
    <PackageVersion Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
    <PackageVersion Include="Serilog.AspNetCore" Version="9.0.0" />
    <PackageVersion Include="Serilog.Enrichers.Environment" Version="3.0.1" />
    <!-- Test -->
    <PackageVersion Include="FluentAssertions" Version="6.12.2" />
    <PackageVersion Include="NSubstitute" Version="5.3.0" />
    <PackageVersion Include="Testcontainers.PostgreSql" Version="4.0.0" />
  </ItemGroup>
</Project>
```

> Paket versiyonlarını kurulum anında `dotnet add package` ile çekip en güncel uyumlu sürüme sabitle — yukarıdakiler referans alt sınır. CPM ile `.csproj`'lar versiyon değil yalnızca `<PackageReference Include="..." />` taşır.

`Directory.Build.props`:

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <LangVersion>latest</LangVersion>
  </PropertyGroup>
</Project>
```

### A.4 `Program.cs` (Monolith)

```csharp
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.Host.UseSerilog((ctx, cfg) =>
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .Enrich.FromLogContext()
       .Enrich.WithEnvironmentName()
       .WriteTo.Console(outputTemplate:
           "[{Timestamp:HH:mm:ss} {Level:u3}] {CorrelationId} {Message:lj}{NewLine}{Exception}"));

// MediatR + Validation pipeline (handler'lar + INotification'lar bu assembly'den taranır)
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblyContaining<Program>();
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
});
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// EF Core (PostgreSQL)
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Yerleşik OpenAPI (.NET 9+ — Swashbuckle değil)
builder.Services.AddOpenApi();

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseMiddleware<CorrelationIdMiddleware>();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();   // /openapi/v1.json

// Modül endpoint kayıtları buraya:
// app.MapOrdersEndpoints();

app.MapHealthChecks("/health");

app.Run();

public partial class Program { }  // WebApplicationFactory için
```

### A.5 Modüller Arası İletişim — In-Process Notification

Monolith'te modüller doğrudan birbirinin handler'ını çağırmaz. Bir modül olay yayınlar, başka modül(ler) dinler:

```csharp
// <ModuleA>/<Feature>/OrderPlacedNotification.cs
public record OrderPlacedNotification(Guid OrderId, Guid CustomerId) : INotification;

// Yayınlayan handler içinde:
await _mediator.Publish(new OrderPlacedNotification(order.Id, order.CustomerId), ct);

// <ModuleB>/.../OrderPlacedHandler.cs — farklı modül, aynı process
public sealed class OrderPlacedHandler : INotificationHandler<OrderPlacedNotification>
{
    public async Task Handle(OrderPlacedNotification n, CancellationToken ct)
    {
        // örn: stok rezervasyonu, audit log
    }
}
```

> İleride bu modül bağımsız deploy gerektirirse: `INotification` → RabbitMQ integration event'e çevrilir, modül ayrı servise taşınır (Strangler Fig). Kod imzası benzer kaldığı için geçiş ucuz.

### A.6 Docker (Monolith)

`docker-compose.yml`:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: src/<ProjectName>.Api/Dockerfile
    ports:
      - "8080:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__Default=Host=postgres;Database=<project_db>;Username=rubion;Password=rubion123
      - Otel__Endpoint=http://jaeger:4317
    depends_on:
      - postgres
      - jaeger
    networks: [rubion-net]

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=rubion
      - POSTGRES_PASSWORD=rubion123
      - POSTGRES_DB=<project_db>
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    networks: [rubion-net]

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports: ["16686:16686", "4317:4317", "4318:4318"]
    environment: [COLLECTOR_OTLP_ENABLED=true]
    networks: [rubion-net]

networks:
  rubion-net:
volumes:
  pgdata:
```

`Dockerfile` (her iki dalda ortak — bkz. **Ortak C.3**).

---

## Dal B — Mikroservis

Bağımsız deploy edilebilir servis. DB-per-service ([ADR-0004](../../docs/adr/0004-database-per-service.md)), opsiyonel Worker + MassTransit/RabbitMQ ([ADR-0005](../../docs/adr/0005-masstransit-rabbitmq.md)).

### B.1 Solution + Proje

```bash
dotnet new webapi  -n <ServiceName>.Api    -f net10.0 -o services/<service-name>/src/<ServiceName>.Api
dotnet new worker  -n <ServiceName>.Worker -f net10.0 -o services/<service-name>/src/<ServiceName>.Worker   # gerekirse
dotnet new xunit   -n <ServiceName>.Tests  -f net10.0 -o services/<service-name>/tests/<ServiceName>.Tests

# Mevcut .sln varsa ekle
dotnet sln add services/<service-name>/src/<ServiceName>.Api
dotnet sln add services/<service-name>/tests/<ServiceName>.Tests
```

### B.2 Klasör Yapısı

```
services/<service-name>/
├── src/
│   ├── <ServiceName>.Api/       ← VSA modülleri + Program.cs + Dockerfile
│   └── <ServiceName>.Worker/    ← (opsiyonel) MassTransit consumer'ları
├── tests/
│   └── <ServiceName>.Tests/
└── docker-compose.override.yml  ← servis + kendi postgres'i
```

### B.3 Ek Paketler (Mesajlaşma)

```bash
# MassTransit (mesajlaşma varsa) — bkz. ADR-005
dotnet add services/<service-name>/src/<ServiceName>.Api package MassTransit.RabbitMQ
```

`Program.cs`'e MassTransit kaydı:

```csharp
builder.Services.AddMassTransit(x =>
{
    x.SetKebabCaseEndpointNameFormatter();
    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "localhost", "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:User"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Pass"] ?? "guest");
        });
        cfg.ConfigureEndpoints(ctx);
    });
});
```

### B.4 Worker Şablonu

```csharp
// <ServiceName>.Worker/Consumers/OrderCreatedConsumer.cs
public sealed class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
{
    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        // TODO
    }
}
```

### B.5 `docker-compose.override.yml` (DB-per-service)

```yaml
services:
  <service-name>-api:
    build:
      context: ./services/<service-name>/src
      dockerfile: <ServiceName>.Api/Dockerfile
    ports: ["<PORT>:8080"]
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__Default=Host=<service-name>-db;Database=<service_db>;Username=rubion;Password=rubion123
      - RabbitMq__Host=rabbitmq
      - Otel__Endpoint=http://jaeger:4317
    depends_on: [<service-name>-db, rabbitmq, jaeger]
    networks: [rubion-net]

  <service-name>-db:                # her servisin kendi DB'si (ADR-0004)
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=rubion
      - POSTGRES_PASSWORD=rubion123
      - POSTGRES_DB=<service_db>
    networks: [rubion-net]

networks:
  rubion-net:
```

Root `docker-compose.yml`'de `rabbitmq` + `jaeger` + `networks` ortak tanımlı olmalı.

---

## Ortak Adımlar (Her İki Dal)

### C.1 ValidationBehavior

```csharp
// Common/Behaviors/ValidationBehavior.cs
public sealed class ValidationBehavior<TRequest, TResponse>(
    IEnumerable<IValidator<TRequest>> validators) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (!validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

### C.2 CorrelationId Middleware

```csharp
// Common/Middleware/CorrelationIdMiddleware.cs
public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
                            ?? Activity.Current?.TraceId.ToString()
                            ?? Guid.NewGuid().ToString("N");

        context.Items[HeaderName] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
        {
            await next(context);
        }
    }
}
```

### C.3 `Dockerfile`

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["<Proj>.Api/<Proj>.Api.csproj", "<Proj>.Api/"]
RUN dotnet restore "<Proj>.Api/<Proj>.Api.csproj"
COPY . .
WORKDIR "/src/<Proj>.Api"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
USER app                          # non-root (güvenlik)
ENTRYPOINT ["dotnet", "<Proj>.Api.dll"]
```

### C.4 AppDbContext (iskelet)

```csharp
// Infrastructure/Persistence/AppDbContext.cs
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        // CreatedAt / UpdatedAt audit (stack-conventions)
        foreach (var entry in ChangeTracker.Entries())
        {
            // TODO: BaseEntity audit kolonlarını set et
        }
        return base.SaveChangesAsync(ct);
    }
}
```

### C.5 `dotnet build` ile Doğrula

```bash
dotnet build
# Hata yoksa iskelet ayakta. Sonra ilk feature için scaffold-vsa-feature.
```

---

## Sonraki Adım (Skill Zinciri)

```
scaffold-backend  ← buradayız
   ↓
scaffold-vsa-feature   her yeni feature dilimi
   ↓
tdd-dotnet             handler/test red-green-refactor
   ↓
setup-otel-dotnet      ilk feature ayakta olunca observability
   ↓ (DB değişikliği oldukça)
ef-core-migration-review
```

Üretim sonrası kullanıcıya bu zinciri öner — otomatik çalıştırma (baseline: kullanıcı tetikler).

---

## Kontrol Listesi

```
[ ] Tür (monolith/mikroservis) kullanıcıyla netleşti
[ ] Solution + projeler oluşturuldu (net10.0)
[ ] Directory.Build.props + Directory.Packages.props eklendi
[ ] Program.cs: MediatR + Validation pipeline + EF Core + Serilog + OpenAPI
[ ] ValidationBehavior + CorrelationIdMiddleware eklendi
[ ] AppDbContext iskeleti kuruldu
[ ] Dockerfile + docker-compose(.override).yml hazır
[ ] /health endpoint çalışıyor
[ ] Monolith: in-process INotification örneği yerinde / Mikroservis: MassTransit (gerekiyorsa)
[ ] dotnet build yeşil
```

---

## Yapma

- ✗ **Monolith'e RabbitMQ koymak** — modüller arası in-process MediatR yeterli; mesaj broker'ı erken karmaşıklık
- ✗ **Mikroservislerde paylaşılan DB** — DB-per-service zorunlu (ADR-0004); ortak DB = gizli coupling
- ✗ **Katman-bazlı proje bölmek** (`.Application`, `.Domain`, `.Infrastructure` ayrı projeler) — Rubion VSA kullanır, modül = klasör, yatay katman projesi değil
- ✗ **Swashbuckle eklemek** — .NET 9+ yerleşik `Microsoft.AspNetCore.OpenApi` kullanır
- ✗ **Solution'a feature kodu yazmak** — bu skill iskelet kurar; feature için scaffold-vsa-feature
- ✗ **net8.0 / net9.0 hedeflemek** — standart net10.0 (güncel LTS)
- ✗ **Paket versiyonlarını .csproj'a dağıtmak** — CPM ile merkezi Directory.Packages.props
