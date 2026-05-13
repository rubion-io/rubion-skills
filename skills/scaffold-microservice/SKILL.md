---
name: scaffold-microservice
description: Yeni bir .NET mikroservis iskeleti oluşturur. ASP.NET Core API projesi + opsiyonel Worker + Dockerfile + docker-compose entry + temel paketler. "Yeni mikroservis ekle", "servis iskeleti", "scaffold microservice" denildiğinde kullan.
stack: [dotnet, csharp, docker]
---

# Scaffold Microservice — Rubion

## Önce Sor

1. **Servis adı** nedir? (PascalCase, tek kelime veya iki kelime — örn: `Inventory`, `NotificationWorker`, `PaymentGateway`)
2. **Tür:** API mi, Worker mi, yoksa ikisi birden mi?
   - **API**: HTTP endpoint'leri sunan servis
   - **Worker**: Background işleme, mesaj tüketimi (RabbitMQ vb.)
   - **API + Worker**: Hem endpoint hem background processing
3. **Mesajlaşma var mı?** RabbitMQ / Azure Service Bus / yok
4. **Veritabanı var mı?** PostgreSQL / MSSQL / yok
5. **Solution'a eklensin mi?** (`.sln` dosyası varsa)

---

## Üretim

### Proje Oluşturma

```bash
# API projesi
dotnet new webapi -n <ServiceName>.Api \
  --use-minimal-apis \
  -o services/<service-name>/src/<ServiceName>.Api

# Worker projesi (gerekirse)
dotnet new worker -n <ServiceName>.Worker \
  -o services/<service-name>/src/<ServiceName>.Worker

# Test projesi
dotnet new xunit -n <ServiceName>.Tests \
  -o services/<service-name>/tests/<ServiceName>.Tests

# Solution'a ekle (varsa)
dotnet sln add services/<service-name>/src/<ServiceName>.Api
dotnet sln add services/<service-name>/tests/<ServiceName>.Tests
```

### Temel Paketler

```bash
cd services/<service-name>/src/<ServiceName>.Api

# MediatR (VSA)
dotnet add package MediatR

# FluentValidation + MediatR entegrasyonu
dotnet add package FluentValidation
dotnet add package FluentValidation.DependencyInjectionExtensions

# FluentResults (Result pattern)
dotnet add package FluentResults

# EF Core (veritabanı varsa)
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL      # PostgreSQL
# VEYA
dotnet add package Microsoft.EntityFrameworkCore.SqlServer    # MSSQL

# OpenTelemetry (Faz 4: setup-otel-dotnet ile tamamlanır)
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol

# Serilog
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Enrichers.Environment

# RabbitMQ / MassTransit (mesajlaşma varsa) — bkz. ADR-005
dotnet add package MassTransit.RabbitMQ
```

---

## Klasör Yapısı

```
services/<service-name>/
├── src/
│   └── <ServiceName>.Api/
│       ├── Program.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       ├── Dockerfile
│       └── <Module>/
│           └── <Feature>/
│               ├── <Feature>Command.cs
│               ├── <Feature>Handler.cs
│               └── <Feature>Endpoint.cs
├── tests/
│   └── <ServiceName>.Tests/
│       └── <Module>/
└── docker-compose.override.yml
```

---

## `Program.cs` Şablonu

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

// MediatR + Validation Pipeline
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblyContaining<Program>();
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
});
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// EF Core (varsa)
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");  // varsa

var app = builder.Build();

app.UseSerilogRequestLogging();

// Endpoint'ler buraya map edilir
// app.MapOrdersEndpoints();

app.MapHealthChecks("/health");

app.Run();

public partial class Program { }  // WebApplicationFactory için
```

---

## `Dockerfile`

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["<ServiceName>.Api/<ServiceName>.Api.csproj", "<ServiceName>.Api/"]
RUN dotnet restore "<ServiceName>.Api/<ServiceName>.Api.csproj"
COPY . .
WORKDIR "/src/<ServiceName>.Api"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Non-root kullanıcı (güvenlik)
USER app

ENTRYPOINT ["dotnet", "<ServiceName>.Api.dll"]
```

---

## `docker-compose.override.yml` Entry

```yaml
services:
  <service-name>-api:
    build:
      context: ./services/<service-name>/src
      dockerfile: <ServiceName>.Api/Dockerfile
    ports:
      - "<PORT>:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__Default=Host=postgres;Database=<service_db>;Username=rubion;Password=rubion123
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
    depends_on:
      - postgres
      - jaeger
    networks:
      - rubion-net
```

Root `docker-compose.yml`'e servis ekle ve `networks` / `volumes` tanımlarının mevcut olduğundan emin ol.

---

## Worker Şablonu (Mesaj Tüketimi)

```csharp
// <ServiceName>.Worker/Program.cs
var builder = Host.CreateDefaultBuilder(args)
    .UseSerilog(...)
    .ConfigureServices((ctx, services) =>
    {
        services.AddMassTransit(x =>
        {
            x.AddConsumer<OrderCreatedConsumer>();
            x.UsingRabbitMq((ctx, cfg) =>
            {
                cfg.Host(ctx.GetRequiredService<IConfiguration>()["RabbitMq:Host"]);
                cfg.ConfigureEndpoints(ctx);
            });
        });
    });

await builder.Build().RunAsync();
```

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

---

## Kontrol Listesi

```
[ ] Proje oluşturuldu ve solution'a eklendi
[ ] Temel paketler yüklendi
[ ] Program.cs şablonu dolduruldu
[ ] Dockerfile oluşturuldu
[ ] docker-compose.override.yml güncellendi
[ ] appsettings.json bağlantı dizgeleri eklendi
[ ] /health endpoint çalışıyor
[ ] setup-otel-dotnet skill'i ile OpenTelemetry tamamlandı
```
