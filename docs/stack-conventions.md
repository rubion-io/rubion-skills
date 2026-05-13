# Stack Conventions — Rubion

Rubion projelerinde tutarlılık için sabit kurallar. Yeni bir proje veya servis başlarken bu belgeden kontrol et.

---

## Naming Conventions

### C# / .NET

| Yapı | Kural | Örnek |
|---|---|---|
| Namespace | `<Company>.<Project>.<Module>` | `Rubion.Erp.Orders` |
| Record (Command/Query) | `<FeatureName>Command`, `<FeatureName>Query` | `CreateOrderCommand` |
| Handler | `<FeatureName>Handler` | `CreateOrderHandler` |
| Validator | `<FeatureName>Validator` | `CreateOrderValidator` |
| Endpoint | `<FeatureName>Endpoint` | `CreateOrderEndpoint` |
| Interface | `I<Name>` | `IOrderRepository` |
| Test class | `<Subject>Tests` | `CreateOrderHandlerTests` |
| Test method | `<Method>_<Scenario>_<Expected>` | `Handle_EmptyItems_ReturnsValidationError` |
| DB table | `snake_case` çoğul | `orders`, `order_items` |
| DB column | `snake_case` | `customer_id`, `created_at` |
| EF entity | PascalCase tekil | `Order`, `OrderItem` |

### React / TypeScript

| Yapı | Kural | Örnek |
|---|---|---|
| Component | PascalCase | `OrderSummaryCard` |
| Hook | `use` prefix, camelCase | `useOrderById` |
| Util / helper | camelCase | `formatCurrency` |
| Type/Interface | PascalCase | `OrderDto`, `CreateOrderRequest` |
| CSS module | kebab-case | `order-summary-card.module.css` |
| API route | kebab-case | `/api/order-items` |

---

## Klasör Yapısı

### .NET (Vertical Slice Architecture)

```
src/
├── <Module>/
│   ├── <Feature>/
│   │   ├── <Feature>Command.cs
│   │   ├── <Feature>Handler.cs
│   │   ├── <Feature>Validator.cs
│   │   └── <Feature>Endpoint.cs
│   └── Shared/          ← modül içi paylaşılan tipler
├── Infrastructure/
│   ├── Persistence/
│   │   ├── AppDbContext.cs
│   │   └── Configurations/
│   └── Messaging/
└── Common/              ← cross-cutting (ValidationBehavior, CorrelationId vb.)
```

### React

```
src/
├── features/
│   └── orders/
│       ├── components/
│       ├── hooks/
│       ├── api.ts           ← TanStack Query hooks
│       └── types.ts
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
└── app/
    ├── router.tsx
    └── providers.tsx
```

---

## Paket Tercihleri

### Backend (.NET 8+)

| Kategori | Tercih | Alternatif / Not |
|---|---|---|
| CQRS / Mediator | MediatR | — |
| Validation | FluentValidation | — |
| Result pattern | FluentResults | — |
| ORM | EF Core 8 | Dapper: sadece perf-critical path |
| DB (primary) | PostgreSQL + Npgsql | MSSQL: sadece legacy/enterprise istemci |
| Background job | Hangfire (persistent) / `IHostedService` (basit) | — |
| Messaging | MassTransit + RabbitMQ | MassTransit + Azure Service Bus |
| HTTP client | `IHttpClientFactory` + Refit | — |
| Test framework | xUnit | — |
| Assertion | FluentAssertions | — |
| Mock | NSubstitute | — |
| Test containers | Testcontainers | — |
| Logging | Serilog | — |
| Observability | OpenTelemetry | — |

### Frontend (React)

| Kategori | Tercih | Not |
|---|---|---|
| Bundler | Vite | — |
| Server state | TanStack Query v5 | — |
| Routing | React Router v6 | — |
| Client state | Zustand (basit) / Redux Toolkit (kompleks) | — |
| Form | React Hook Form + Zod | — |
| UI kit | shadcn/ui (headless) | Proje başında belirlenir |
| Testing | Vitest + React Testing Library + MSW | — |
| E2E | Playwright | — |

### React Native

| Kategori | Tercih |
|---|---|
| Framework | Expo (managed workflow) |
| Navigation | React Navigation v6 |
| State | Zustand + TanStack Query |
| E2E | Maestro |

---

## Mimari Karar Ağacı

### Monolith mu, Mikroservis mi?

```
Takım < 5 kişi?              → Monolith (modüler)
Bağımsız deploy zorunlu mu?  → Mikroservis
Farklı ölçekleme ihtiyacı?   → Mikroservis
Henüz netleşmemiş domain?    → Monolith başla, strangler fig ile böl
```

### ORM Seçimi (EF Core vs Dapper)

```
Varsayılan: EF Core
Dapper seç:
  - Çok sayıda tablo join içeren read-heavy rapor sorguları
  - EF Core query planı tatmin edici sonuç üretmiyorsa (önce EXPLAIN ile doğrula)
  - Mevcut raw SQL stored procedure'ları wrap'leyeceksen
```

### Repository Pattern (EF Core projesinde)

```
Repository KULLANMA (varsayılan):
  - EF Core zaten unit of work + repository sağlar
  - Testcontainers ile gerçek DB test edilebilir

Repository KULLAN:
  - Birden fazla veri kaynağı (EF + harici API) aynı interface üzerinden
  - Test ortamında gerçek DB mümkün değil (kısıt varsa)
```

---

## Veritabanı Kuralları

- **Migration naming:** `<YYYYMMDDHHMMSS>_<PascalCaseAçıklama>`
  - Doğru: `20260513120000_AddEmailToCustomers`
  - Yanlış: `migration1`, `fix`, `update`
- **Her migration'da:** `ef-core-migration-review` skill'i çalıştır
- **Index adı:** `IX_<Table>_<Column(s)>`
- **FK adı:** `FK_<Table>_<RefTable>_<Column>`
- **Soft delete:** `DeletedAt datetime NULL` + global query filter (hard delete yerine)
- **Audit kolonu:** Tüm entity'lerde `CreatedAt`, `UpdatedAt` (auto-set via `SaveChanges` override)

---

## API Tasarımı

- **HTTP method:** REST semantiğini izle (GET okuma, POST yaratma, PUT tam güncelleme, PATCH kısmi, DELETE silme)
- **Route:** `/<resource>` çoğul, küçük harf, kebab-case: `/order-items`, `/production-plans`
- **Response:** ProblemDetails (RFC 7807) — validation hataları için `400 + errors array`
- **Versioning:** URL prefix (`/v1/`) — sadece breaking change gerektiren durumlarda
- **Auth:** Bearer token, endpoint seviyesinde `[Authorize]` veya `RequireAuthorization()`

---

## Ortam Değişkenleri

```
Geliştirme: appsettings.Development.json
Production: Environment variables (Docker / Kubernetes secret)
Sır (secret): Asla appsettings'e yazma — dotnet user-secrets (local) veya Vault/Key Vault (prod)
```

Format: `BÖLÜM__ALT_BÖLÜM` (iki alt çizgi = nested config)

```bash
# Örnek
ConnectionStrings__Default="Host=...;Database=..."
Otel__Endpoint="http://jaeger:4317"
```
