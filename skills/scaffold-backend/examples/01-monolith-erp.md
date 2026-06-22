# Örnek — Monolith ERP İskeleti

Kullanıcı: *"Rubion.Erp adında monolith bir backend kur, ilk modül Orders, PostgreSQL."*

---

## Sorulan + Cevaplar

| Soru | Cevap |
|---|---|
| Tür | Monolith |
| Proje adı | `Rubion.Erp` |
| İlk modül | `Orders` |
| Veritabanı | PostgreSQL |

---

## Çalıştırılan Komutlar

```bash
dotnet new sln -n Rubion.Erp

dotnet new webapi -n Rubion.Erp.Api   -f net10.0 -o src/Rubion.Erp.Api
dotnet new xunit  -n Rubion.Erp.Tests -f net10.0 -o tests/Rubion.Erp.Tests

dotnet sln add src/Rubion.Erp.Api
dotnet sln add tests/Rubion.Erp.Tests
dotnet add tests/Rubion.Erp.Tests reference src/Rubion.Erp.Api

# Paketler (CPM — versiyonlar Directory.Packages.props'a düşer)
cd src/Rubion.Erp.Api
dotnet add package MediatR
dotnet add package FluentValidation.DependencyInjectionExtensions
dotnet add package FluentResults
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Enrichers.Environment
cd ../..

cd tests/Rubion.Erp.Tests
dotnet add package FluentAssertions
dotnet add package NSubstitute
dotnet add package Testcontainers.PostgreSql
cd ../..
```

---

## Üretilen Ağaç

```
Rubion.Erp/
├── Rubion.Erp.sln
├── Directory.Build.props
├── Directory.Packages.props
├── docker-compose.yml                     # api + postgres + jaeger
├── src/Rubion.Erp.Api/
│   ├── Program.cs                          # MediatR + Validation + EF + Serilog + OpenAPI
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   ├── Dockerfile
│   ├── Orders/                             # ilk modül — boş slice klasörü
│   │   └── Shared/
│   ├── Infrastructure/Persistence/
│   │   ├── AppDbContext.cs
│   │   └── Configurations/
│   └── Common/
│       ├── Behaviors/ValidationBehavior.cs
│       └── Middleware/CorrelationIdMiddleware.cs
└── tests/Rubion.Erp.Tests/
    └── Orders/
```

---

## appsettings.json

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=rubion_erp;Username=rubion;Password=rubion123"
  },
  "Otel": { "ServiceName": "rubion-erp", "Endpoint": "http://localhost:4317" },
  "Serilog": { "MinimumLevel": "Information" }
}
```

---

## Doğrulama

```bash
dotnet build                    # → yeşil
docker compose up -d postgres   # DB ayağa
dotnet run --project src/Rubion.Erp.Api
curl http://localhost:8080/health   # → Healthy
```

---

## Sonraki Adım

İskelet hazır. Kullanıcıya önerilen:

```
1. ✅ scaffold-backend            ← burada
2. ⏭ scaffold-vsa-feature         "CreateOrder feature ekle" (Orders modülü)
3. ⏭ tdd-dotnet                   CreateOrderHandler için red-green-refactor
4. ⏭ setup-otel-dotnet            ilk endpoint ayakta olunca
```

> Not: `Orders` modülü şu an boş. İlk feature `scaffold-vsa-feature` ile `Orders/CreateOrder/` altına gelir. Modül başka modülü tetikleyecekse (örn. stok rezervasyonu) `OrderPlacedNotification : INotification` in-process publish edilir — RabbitMQ yok.
