# ADR-008: Test Stack Seçimleri — .NET, React, React Native

**Tarih:** 2026-05-13
**Durum:** Kabul Edildi

## Bağlam

Rubion projelerinin üç farklı katmanı var: .NET backend, React web frontend, React Native mobil. Her katman için test runner, assertion library, mock library ve integration test stratejisi seçilmeliydi.

## Karar

### .NET Backend

| Rol | Seçim | Reddedilen |
|---|---|---|
| Test runner | **xUnit** | NUnit, MSTest |
| Assertion | **FluentAssertions** | Assert.Equal (xUnit built-in) |
| Mock | **NSubstitute** | Moq, FakeItEasy |
| Integration DB | **Testcontainers** | In-memory provider, SQLite |

### React Web Frontend

| Rol | Seçim | Reddedilen |
|---|---|---|
| Test runner | **Vitest** | Jest |
| Component test | **React Testing Library** | Enzyme, shallow render |
| API mock | **MSW (Mock Service Worker)** | Jest mock functions, Axios mock |
| User events | **@testing-library/user-event** | fireEvent (RTL built-in) |

### React Native Mobil

| Rol | Seçim | Reddedilen |
|---|---|---|
| Test runner | **Jest + jest-expo** | — |
| Component test | **@testing-library/react-native** | — |
| E2E | **Maestro** | Detox |

## Gerekçe

### .NET — xUnit

xUnit, .NET ekosisteminde Microsoft'un kendi test projelerinde de kullandığı standart framework oldu. `[Fact]` ve `[Theory]` söz dizimi temiz; test izolasyonu `IClassFixture` ile kolaydır.

```csharp
public class CreateOrderHandlerTests : IClassFixture<TestDbContextFixture>
{
    [Fact]
    public async Task Handle_ValidCommand_CreatesOrder() { ... }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Handle_InvalidQuantity_ThrowsValidation(int qty) { ... }
}
```

NUnit de olgunlaşmış bir alternatiftir; ancak ekipte xUnit deneyimi daha yaygındı ve tek framework seçmek tutarlılık sağladı.

### .NET — FluentAssertions

```csharp
// xUnit built-in (okunması zor):
Assert.Equal(OrderStatus.Confirmed, order.Status);
Assert.NotNull(order);

// FluentAssertions (İngilizce cümle gibi okunuyor):
order.Should().NotBeNull();
order.Status.Should().Be(OrderStatus.Confirmed);
order.Items.Should().HaveCount(2)
    .And.AllSatisfy(i => i.Quantity.Should().BePositive());
```

Hata mesajları da daha okunabilir:

```
Expected order.Status to be Confirmed, but found Pending.
```

### .NET — NSubstitute (Moq değil)

2023'te Moq, SponsorLink tartışması ile güven kaybetti (NuGet paketine telemetry kodu eklendi). Bu risk yönetimi kararı olarak NSubstitute tercih edildi. API'si Moq'a benzer ama daha fluent:

```csharp
// NSubstitute
var emailService = Substitute.For<IEmailService>();
emailService.SendAsync(Arg.Any<string>()).Returns(Task.CompletedTask);

// Doğrulama
await emailService.Received(1).SendAsync("order-cancelled@rubion.io");
```

### .NET — Testcontainers (In-memory değil)

EF Core in-memory provider gerçek PostgreSQL davranışını tam yansıtmıyor: transaction semantiği farklı, constraint'ler yok, SQL-native özellikler (window functions, indexes) test edilemiyor.

```csharp
// Testcontainers ile gerçek PostgreSQL
var container = new PostgreSqlBuilder()
    .WithDatabase("test_db")
    .Build();

await container.StartAsync();

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(container.GetConnectionString())
    .Options;

// Migration'lar gerçek DB'ye uygulanır
using var db = new AppDbContext(options);
await db.Database.MigrateAsync();
```

Ek CI süresi (~10s container startup) güven artışıyla karşılanıyor.

### React — Vitest (Jest değil)

Vitest, Vite tabanlı projelerde Jest'e kıyasla 3-5x daha hızlı çalışıyor. Aynı `describe/it/expect` API'sini kullandığı için geçiş maliyeti sıfır.

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

Rubion web projelerinin tamamı Vite tabanlı; bu seçim doğal uyum sağlıyor.

### React — MSW (Mock Service Worker)

MSW, network katmanında intercept yapar — axios/fetch mock'larından farklı olarak gerçek HTTP akışı test edilir.

```typescript
// src/test/handlers.ts
export const handlers = [
  http.get('/api/orders', () =>
    HttpResponse.json([{ id: '1', status: 'pending' }])),

  http.post('/api/orders', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '2', ...body }, { status: 201 });
  }),
];
```

Tek handler dosyası hem test hem de geliştirme mock server'ında kullanılabilir.

### React Native — Maestro (Detox değil)

| Kriter | Maestro | Detox |
|---|---|---|
| Setup süresi | ~15 dk | 2-4 saat |
| Test yazım dili | YAML | JavaScript/TypeScript |
| CI entegrasyonu | Maestro Cloud | Fastlane + özel setup |
| Flakiness | Düşük (semantic actions) | Orta |
| Bakım yükü | Düşük | Yüksek |

```yaml
# .maestro/login-flow.yaml — Detox eşdeğerine göre çok daha kısa
appId: io.rubion.app
---
- launchApp
- tapOn: "Email"
- inputText: "test@rubion.io"
- tapOn: "Giriş Yap"
- assertVisible: "Ana Sayfa"
```

Detox mature ve güçlüdür; ama Maestro yeni projeler için kuruluş sürtünmesini dramatik biçimde azaltıyor.

## Sonuçlar

**Olumlu:**
- Tüm katmanlar için seçimler tutarlı ve ekip tarafından bilinen araçlar.
- Testcontainers ile integration testler gerçekçi — production bug'ları daha erken yakalanıyor.
- MSW handler'ları dev mock server ile paylaşılıyor — DRY.
- Maestro YAML akışları non-teknik ekip üyelerinin de anlayabileceği netlikte.

**Olumsuz / Trade-off:**
- Testcontainers CI'da Docker-in-Docker gerektirir — bazı CI platformlarında ek konfigürasyon.
- Vitest ile Jest uyumluluğu %95 — nadir edge case'lerde farklılık olabilir.
- Maestro, native gesture'lar (çoklu parmak, sensör) için Detox kadar olgun değil.

## Referanslar

- `adapted/tdd-dotnet/SKILL.md` — .NET TDD akışı
- `adapted/tdd-react/SKILL.md` — React TDD akışı
- `adapted/tdd-react-native/SKILL.md` — React Native TDD akışı (Bare RN dahil)
- Testcontainers .NET: https://dotnet.testcontainers.org/
- MSW: https://mswjs.io/
- Maestro: https://maestro.mobile.dev/
