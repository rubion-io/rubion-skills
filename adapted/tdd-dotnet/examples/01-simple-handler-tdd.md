# Örnek 1: Basit Command Handler — Red-Green-Refactor

Senaryo: `CreateProductCommand` handler'ını TDD ile yaz.

## Başlangıç Kodu (yalnızca interface'ler var, implementasyon yok)

```csharp
// Domain
public record Product(Guid Id, string Name, decimal Price, int Stock);

// Command & Result
public record CreateProductCommand(string Name, decimal Price, int InitialStock)
    : IRequest<Result<Guid>>;

// Repository interface
public interface IProductRepository
{
    Task SaveAsync(Product product, CancellationToken ct = default);
}
```

---

## Adım 1 — RED: İlk test kırık

```csharp
public class CreateProductHandlerTests
{
    private readonly IProductRepository _repository = Substitute.For<IProductRepository>();
    private CreateProductHandler _sut = null!;

    public CreateProductHandlerTests()
    {
        _sut = new CreateProductHandler(_repository);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsNewProductId()
    {
        var command = new CreateProductCommand("Vida M8", Price: 0.25m, InitialStock: 1000);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBe(Guid.Empty);
    }
}
```

```
dotnet test --filter "Handle_ValidCommand_ReturnsNewProductId"
# → BUILD ERROR: CreateProductHandler yok
```

---

## Adım 2 — GREEN: Minimum implementasyon

```csharp
public class CreateProductHandler : IRequestHandler<CreateProductCommand, Result<Guid>>
{
    private readonly IProductRepository _repository;

    public CreateProductHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var product = new Product(
            Id: Guid.NewGuid(),
            Name: request.Name,
            Price: request.Price,
            Stock: request.InitialStock);

        await _repository.SaveAsync(product, ct);
        return Result.Ok(product.Id);
    }
}
```

```
dotnet test --filter "Handle_ValidCommand_ReturnsNewProductId"
# → PASS ✓
```

---

## Adım 3 — Sonraki RED: Negatif fiyat validasyonu

```csharp
[Fact]
public async Task Handle_NegativePrice_ReturnsValidationError()
{
    var command = new CreateProductCommand("Test", Price: -1m, InitialStock: 0);

    var result = await _sut.Handle(command, CancellationToken.None);

    result.IsFailed.Should().BeTrue();
    result.Errors.Should().ContainSingle(e => e.Message.Contains("Price"));
}
```

```
dotnet test --filter "Handle_NegativePrice_ReturnsValidationError"
# → FAIL (handler şu an fiyatı kontrol etmiyor)
```

---

## Adım 4 — GREEN: Validasyon ekle

```csharp
public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken ct)
{
    if (request.Price < 0)
        return Result.Fail("Price cannot be negative.");

    var product = new Product(Guid.NewGuid(), request.Name, request.Price, request.InitialStock);
    await _repository.SaveAsync(product, ct);
    return Result.Ok(product.Id);
}
```

```
dotnet test
# → 2 PASS ✓
```

---

## Adım 5 — Sonraki RED: Boş isim

```csharp
[Theory]
[InlineData("")]
[InlineData("   ")]
[InlineData(null)]
public async Task Handle_EmptyName_ReturnsValidationError(string? name)
{
    var command = new CreateProductCommand(name!, Price: 10m, InitialStock: 5);

    var result = await _sut.Handle(command, CancellationToken.None);

    result.IsFailed.Should().BeTrue();
    result.Errors.Should().ContainSingle(e => e.Message.Contains("Name"));
}
```

---

## Adım 6 — GREEN + REFACTOR

```csharp
public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken ct)
{
    var errors = new List<string>();

    if (string.IsNullOrWhiteSpace(request.Name))
        errors.Add("Name cannot be empty.");

    if (request.Price < 0)
        errors.Add("Price cannot be negative.");

    if (errors.Count > 0)
        return Result.Fail(errors);

    var product = new Product(Guid.NewGuid(), request.Name.Trim(), request.Price, request.InitialStock);
    await _repository.SaveAsync(product, ct);
    return Result.Ok(product.Id);
}
```

```
dotnet test
# → 5 PASS ✓  (ValidCommand + NegativePrice + 3 × EmptyName)
```

---

## Repository Çağrısını Doğrulama

```csharp
[Fact]
public async Task Handle_ValidCommand_SavesProductToRepository()
{
    var command = new CreateProductCommand("Somun M6", Price: 0.10m, InitialStock: 500);

    await _sut.Handle(command, CancellationToken.None);

    await _repository.Received(1).SaveAsync(
        Arg.Is<Product>(p =>
            p.Name == "Somun M6" &&
            p.Price == 0.10m &&
            p.Stock == 500),
        Arg.Any<CancellationToken>());
}
```

> **Not:** Repository'nin kaç kez çağrıldığını doğrulamak, happy path'te bir kez persist edildiğini garanti eder. Ama internal method adlarını veya implementation sıralamasını assert etme — o testler refactor'da kırılır.
