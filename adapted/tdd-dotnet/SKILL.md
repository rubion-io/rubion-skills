---
adapted_from: mattpocock/skills/skills/engineering/tdd
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: heavy
name: tdd-dotnet
description: .NET projelerinde xUnit + FluentAssertions + NSubstitute ile test-driven development. MediatR handler'ları, Testcontainers ile integration test, ve Vertical Slice Architecture bağlamında TDD. "TDD ile yaz", "önce test", "red-green-refactor" denildiğinde kullan.
stack: [dotnet, csharp, xunit, mediatr, testcontainers]
---

# TDD — .NET / Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

## Felsefe

**Temel ilke:** Testler davranışı public interface üzerinden doğrular; implementasyon detaylarını değil. Kod tamamen değişebilir, testler değişmemeli.

**İyi test:** Handler'ın dışarıya sağladığı sonucu doğrular — döndürdüğü sonuç, fırlattığı exception, veya ürettiği domain event. Internal'a asla dokunmaz.

**Kötü test:** Mocked repository'nin kaç kez çağrıldığını assert eder; handler'ı refactor ettiğinde kırılır.

## Anti-Pattern: Yatay Dilim

**TÜM testleri önce yazıp sonra kodu yazmayın.** Bu "yatay dilim" — RED = tüm testler, GREEN = tüm kod.

Sonucu: hayali davranışı test eden, gerçek davranışı yakalamayan testler. Bir şey kırılsa geçer, kırılmaması gereken şey kırılsa pass eder.

**Doğru yaklaşım:** Dikey dilimler, tracer bullet ile. Bir test → bir implementasyon → tekrar et.

```
YANLIŞ (yatay):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

DOĞRU (dikey):
  RED→GREEN: test1 → impl1
  RED→GREEN: test2 → impl2
  RED→GREEN: test3 → impl3
  ...
```

---

## Stack

| Rol | Paket |
|---|---|
| Test framework | xUnit |
| Assertion | FluentAssertions |
| Mocking | NSubstitute |
| Integration DB | Testcontainers (PostgreSQL veya MSSQL) |
| Test data builder | Bogus + AutoFixture (opsiyonel) |
| Web integration | `WebApplicationFactory<Program>` |
| Contract test | PactNet (sadece mikroservis contract'larında) |

> **Bu seçimlerin gerekçesi** (xUnit vs NUnit, NSubstitute vs Moq, Testcontainers vs in-memory) → **[ADR-008](../../docs/adr/0008-test-stack.md)**

### Proje Yapısı

```
MyFeature/
├── MyFeature.csproj
└── src/
    └── Orders/
        └── CreateOrder/
            ├── CreateOrderCommand.cs
            ├── CreateOrderHandler.cs
            └── CreateOrderEndpoint.cs
MyFeature.Tests/
├── MyFeature.Tests.csproj
└── Orders/
    └── CreateOrder/
        ├── CreateOrderHandlerTests.cs        ← unit / handler test
        └── CreateOrderIntegrationTests.cs    ← Testcontainers ile
```

---

## İş Akışı

### 1. Planlama

Kod yazmadan önce:

- [ ] Hangi interface değişiyor? (Command/Query imzası)
- [ ] Hangi davranışlar test edilecek? (öncelikli happy path + kritik edge case)
- [ ] Hangi katman? (Handler unit testi mi, endpoint integration testi mi?)
- [ ] Kullanıcıdan onay al

Sor: "Hangi public interface? En önemli davranışlar hangileri?"

### 2. Tracer Bullet

İlk test — sistemin çalıştığını kanıtlar:

```csharp
// RED: önce bu kırık test
[Fact]
public async Task Handle_ValidCommand_ReturnsOrderId()
{
    // Arrange
    var command = new CreateOrderCommand(CustomerId: Guid.NewGuid(), Items: []);
    var handler = new CreateOrderHandler(/* deps */);

    // Act
    var result = await handler.Handle(command, CancellationToken.None);

    // Assert
    result.IsSuccess.Should().BeTrue();
    result.Value.Should().NotBeEmpty();
}
```

```
dotnet test --filter "Handle_ValidCommand_ReturnsOrderId"
```

Kırmızı → minimal kod → yeşil.

### 3. Döngü

Her davranış için:

```
RED:   Sonraki testi yaz → kır
GREEN: Geçirmek için minimum kod → geçir
```

Kurallar:
- Bir seferde tek test
- Sadece o testi geçirecek kadar kod
- Gelecekteki testleri tahmin etme
- Assert daima observable davranışa

### 4. Refactor

Tüm testler geçtikten sonra:
- [ ] Tekrarı ayıkla
- [ ] Module'ü derinleştir (basit interface, derin implementasyon)
- [ ] Handler içindeki domain logic'i ayrıştır
- [ ] Her refactor adımından sonra testleri çalıştır

**Kırmızıdayken refactor yok. Önce yeşile geç.**

---

## Handler Unit Testi Örneği

```csharp
public class CreateOrderHandlerTests
{
    private readonly IOrderRepository _repository;
    private readonly IEventPublisher _publisher;
    private readonly CreateOrderHandler _sut;

    public CreateOrderHandlerTests()
    {
        _repository = Substitute.For<IOrderRepository>();
        _publisher  = Substitute.For<IEventPublisher>();
        _sut        = new CreateOrderHandler(_repository, _publisher);
    }

    [Fact]
    public async Task Handle_ValidCommand_PersistsOrderAndPublishesEvent()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var command = new CreateOrderCommand(customerId, Items: [
            new OrderItemDto(ProductId: Guid.NewGuid(), Quantity: 2)
        ]);

        _repository.SaveAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        await _repository.Received(1).SaveAsync(
            Arg.Is<Order>(o => o.CustomerId == customerId),
            Arg.Any<CancellationToken>());
        await _publisher.Received(1).PublishAsync(
            Arg.Any<OrderCreatedEvent>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_EmptyItems_ReturnsValidationError()
    {
        var command = new CreateOrderCommand(Guid.NewGuid(), Items: []);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message.Contains("item"));
    }
}
```

### NSubstitute İpuçları

```csharp
// Dönüş değeri ayarla
_repository.GetByIdAsync(id, default).Returns(order);

// Exception fırlat
_repository.SaveAsync(default!, default).Throws(new DbException("Connection failed"));

// Çağrıyı doğrula
await _repository.Received(1).SaveAsync(Arg.Is<Order>(o => o.Status == OrderStatus.Pending), default);

// Çağrılmadığını doğrula
await _publisher.DidNotReceive().PublishAsync(Arg.Any<OrderCreatedEvent>(), default);
```

---

## Integration Testi (Testcontainers)

`IAsyncLifetime` implement et → `InitializeAsync`'te container başlat + migrate, `DisposeAsync`'te kapat. Handler'ı gerçek `Repository` + `Substitute` publisher ile kur.

```csharp
private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
    .WithImage("postgres:16-alpine").Build();
// MSSQL için: MsSqlBuilder().WithImage("mcr.microsoft.com/mssql/server:2022-latest")
```

Tam örnek → **[examples/02-integration-test-with-testcontainers.md](examples/02-integration-test-with-testcontainers.md)**

---

## WebApplicationFactory ile Endpoint Testi

`IClassFixture<WebApplicationFactory<Program>>` → `ConfigureServices`'te DB'yi in-memory ile swap et → `CreateClient()` ile HTTP testi.

Tam örnek → **[examples/03-when-not-to-tdd.md](examples/03-when-not-to-tdd.md)**

---

## Coverage Politikası

| Katman | Min Hedef |
|---|---|
| Domain / Handler (unit) | %70 |
| Repository / Integration | %40 |
| Endpoint (smoke) | Kritik path'ler |

**Dogmatik değil.** Kritik iş mantığını ve edge case'leri kapat; boilerplate'i atlayabilirsin.

---

## Contract Test (Mikroservis — Ne Zaman?)

```
PactNet kullan:
  ✓ İki servis arasında API değişikliği planlanıyorsa
  ✓ Downstream consumer başka bir takımsa
  ✗ Monolith içi servis çağrılarında
  ✗ Kendi kontrolündeki internal API'lerde
```

---

## Döngü Başına Checklist

```
[ ] Test davranışı açıklıyor, implementasyonu değil
[ ] Yalnızca public interface kullanılıyor
[ ] Internal refactor bu testi kırmaz
[ ] Kod bu test için minimum
[ ] Spekülatif özellik eklenmedi
```
