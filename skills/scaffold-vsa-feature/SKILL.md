---
name: scaffold-vsa-feature
description: Vertical Slice Architecture'da yeni bir feature iskeleti üretir. Command veya Query + Handler + FluentValidation Validator + Minimal API Endpoint + xUnit Test dosyalarını tek seferde oluşturur. "Yeni feature ekle", "VSA feature iskelet", "scaffold" denildiğinde kullan.
stack: [dotnet, csharp, mediatr, fluentvalidation, xunit]
---

# Scaffold VSA Feature — Rubion

## Ne Üretir?

Bir feature için tam dikey dilim:

```
src/<Module>/<FeatureName>/
├── <FeatureName>Command.cs      veya <FeatureName>Query.cs
├── <FeatureName>Handler.cs
├── <FeatureName>Validator.cs    (Command için)
└── <FeatureName>Endpoint.cs

tests/<Module>/<FeatureName>/
└── <FeatureName>HandlerTests.cs
```

---

## Kullanım

Önce şunu sor (hepsini tek mesajda):

1. **Feature adı** nedir? (PascalCase, fiil+isim — örn: `CreateOrder`, `GetProductById`, `CancelShipment`)
2. **Modül** hangisi? (örn: `Orders`, `Inventory`, `Production`)
3. **Command mı, Query mi?**
   - Command: yan etki üretir (kaydet, sil, güncelle) → `IRequest<Result<T>>`
   - Query: sadece okur → `IRequest<Result<T>>` (veya `IRequest<Result<List<T>>>`)
4. **HTTP method ve route?** (örn: `POST /orders`, `GET /products/{id}`)
5. **Temel alan'lar neler?** (örn: `CustomerId: Guid`, `Items: List<OrderItemDto>`)

Cevaplar gelince üretimi başlat. Varsayım yapıyorsan açıkça belirt.

---

## Üretim Şablonları

### Command + Handler + Validator + Endpoint

```csharp
// <Module>/<FeatureName>/<FeatureName>Command.cs
namespace <ProjectName>.<Module>.<FeatureName>;

public record <FeatureName>Command(<Fields>) : IRequest<Result<<ReturnType>>>;
```

```csharp
// <Module>/<FeatureName>/<FeatureName>Handler.cs
namespace <ProjectName>.<Module>.<FeatureName>;

public sealed class <FeatureName>Handler : IRequestHandler<<FeatureName>Command, Result<<ReturnType>>>
{
    private readonly AppDbContext _db;

    public <FeatureName>Handler(AppDbContext db) => _db = db;

    public async Task<Result<<ReturnType>>> Handle(<FeatureName>Command request, CancellationToken ct)
    {
        // TODO: implementasyon
        throw new NotImplementedException();
    }
}
```

```csharp
// <Module>/<FeatureName>/<FeatureName>Validator.cs
namespace <ProjectName>.<Module>.<FeatureName>;

public sealed class <FeatureName>Validator : AbstractValidator<<FeatureName>Command>
{
    public <FeatureName>Validator()
    {
        // TODO: kurallar
        // RuleFor(x => x.FieldName).NotEmpty().MaximumLength(200);
    }
}
```

```csharp
// <Module>/<FeatureName>/<FeatureName>Endpoint.cs
namespace <ProjectName>.<Module>.<FeatureName>;

public static class <FeatureName>Endpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.Map<HttpMethod>("<route>", async (
            [FromBody] <FeatureName>Command command,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(command, ct);
            return result.IsSuccess
                ? Results.<SuccessResult>(result.Value)
                : Results.BadRequest(result.Errors);
        })
        .WithName("<FeatureName>")
        .WithTags("<Module>")
        .Produces<<ReturnType>>(<StatusCode>)
        .ProducesValidationProblem();
    }
}
```

### Query + Handler + Endpoint

```csharp
// <Module>/<FeatureName>/<FeatureName>Query.cs
namespace <ProjectName>.<Module>.<FeatureName>;

public record <FeatureName>Query(<Parameters>) : IRequest<Result<<ReturnType>>>;
```

```csharp
// <Module>/<FeatureName>/<FeatureName>Handler.cs
namespace <ProjectName>.<Module>.<FeatureName>;

public sealed class <FeatureName>Handler : IRequestHandler<<FeatureName>Query, Result<<ReturnType>>>
{
    private readonly AppDbContext _db;

    public <FeatureName>Handler(AppDbContext db) => _db = db;

    public async Task<Result<<ReturnType>>> Handle(<FeatureName>Query request, CancellationToken ct)
    {
        // TODO: implementasyon
        throw new NotImplementedException();
    }
}
```

```csharp
// <Module>/<FeatureName>/<FeatureName>Endpoint.cs
namespace <ProjectName>.<Module>.<FeatureName>;

public static class <FeatureName>Endpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapGet("<route>", async (
            [AsParameters] <FeatureName>Query query,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(query, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.NotFound();
        })
        .WithName("<FeatureName>")
        .WithTags("<Module>")
        .Produces<<ReturnType>>();
    }
}
```

### Test Dosyası

```csharp
// tests/<Module>/<FeatureName>/<FeatureName>HandlerTests.cs
namespace <ProjectName>.Tests.<Module>.<FeatureName>;

public class <FeatureName>HandlerTests
{
    // TODO: mock'ları veya Testcontainers fixture'ı buraya ekle

    [Fact]
    public async Task Handle_Valid<FeatureName>_Returns<ExpectedResult>()
    {
        // Arrange
        // Act
        // Assert
        Assert.Fail("Not implemented");
    }
}
```

---

## Endpoint Kaydı

Ürettikten sonra endpoint'i `Program.cs`'e kaydet:

```csharp
// Program.cs veya EndpointExtensions.cs
app.Map<Module>Endpoints();

// EndpointExtensions.cs (yoksa oluştur):
public static class <Module>EndpointExtensions
{
    public static IEndpointRouteBuilder Map<Module>Endpoints(this IEndpointRouteBuilder app)
    {
        <FeatureName>Endpoint.Map(app);
        // Diğer feature'lar buraya...
        return app;
    }
}
```

---

## MediatR + FluentValidation Otomatik Doğrulama Pipeline'ı

Validation pipeline **zaten kuruluysa** validator otomatik çalışır. Yoksa kur:

```csharp
// Program.cs
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblyContaining<Program>();
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
});

builder.Services.AddValidatorsFromAssemblyContaining<Program>();
```

```csharp
// ValidationBehavior.cs (yoksa oluştur)
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
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

---

## Kontrol Listesi (Üretim Sonrası)

```
[ ] Command/Query record'daki alan adları domain glossary ile uyuşuyor
[ ] Handler TODO kaldırıldı, gerçek implementasyon yazıldı
[ ] Validator kuralları dolduruldu
[ ] Endpoint <StatusCode> ve route doğru
[ ] Test dosyasına en az bir Fact eklendi
[ ] Endpoint Program.cs'e kaydedildi
```
