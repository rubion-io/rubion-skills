# Örnek: CreateOrder Feature İskeleti

**Girdi:**
- Feature adı: `CreateOrder`
- Modül: `Orders`
- Tür: Command
- Route: `POST /orders`
- Alanlar: `CustomerId: Guid`, `Items: List<OrderItemDto>`

---

## Üretilen Dosyalar

### `src/Orders/CreateOrder/CreateOrderCommand.cs`

```csharp
namespace RubionApp.Orders.CreateOrder;

public record CreateOrderCommand(
    Guid CustomerId,
    List<OrderItemDto> Items
) : IRequest<Result<Guid>>;

public record OrderItemDto(Guid ProductId, int Quantity);
```

### `src/Orders/CreateOrder/CreateOrderHandler.cs`

```csharp
namespace RubionApp.Orders.CreateOrder;

public sealed class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly AppDbContext _db;

    public CreateOrderHandler(AppDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        var order = Order.Create(request.CustomerId, request.Items
            .Select(i => new OrderItem(i.ProductId, i.Quantity))
            .ToList());

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        return Result.Ok(order.Id);
    }
}
```

### `src/Orders/CreateOrder/CreateOrderValidator.cs`

```csharp
namespace RubionApp.Orders.CreateOrder;

public sealed class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("Sipariş en az bir kalem içermelidir.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty();
            item.RuleFor(i => i.Quantity).GreaterThan(0);
        });
    }
}
```

### `src/Orders/CreateOrder/CreateOrderEndpoint.cs`

```csharp
namespace RubionApp.Orders.CreateOrder;

public static class CreateOrderEndpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/orders", async (
            [FromBody] CreateOrderCommand command,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(command, ct);
            return result.IsSuccess
                ? Results.Created($"/orders/{result.Value}", new { orderId = result.Value })
                : Results.BadRequest(result.Errors);
        })
        .WithName("CreateOrder")
        .WithTags("Orders")
        .Produces<object>(StatusCodes.Status201Created)
        .ProducesValidationProblem();
    }
}
```

### `tests/Orders/CreateOrder/CreateOrderHandlerTests.cs`

```csharp
namespace RubionApp.Tests.Orders.CreateOrder;

public class CreateOrderHandlerTests
{
    private readonly AppDbContext _db;
    private readonly CreateOrderHandler _sut;

    public CreateOrderHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _sut = new CreateOrderHandler(_db);
    }

    [Fact]
    public async Task Handle_ValidCommand_CreatesOrderAndReturnsId()
    {
        var command = new CreateOrderCommand(
            CustomerId: Guid.NewGuid(),
            Items: [new OrderItemDto(Guid.NewGuid(), Quantity: 2)]);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var saved = await _db.Orders.FindAsync(result.Value);
        saved.Should().NotBeNull();
        saved!.CustomerId.Should().Be(command.CustomerId);
    }

    [Fact]
    public async Task Handle_EmptyItems_ValidationFails()
    {
        var validator = new CreateOrderValidator();
        var command = new CreateOrderCommand(Guid.NewGuid(), Items: []);

        var validation = await validator.ValidateAsync(command);

        validation.IsValid.Should().BeFalse();
        validation.Errors.Should().ContainSingle(e => e.PropertyName == "Items");
    }
}
```
