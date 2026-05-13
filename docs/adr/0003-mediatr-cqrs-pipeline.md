# ADR-003: MediatR ile CQRS ve Pipeline Behavior

**Tarih:** 2026-05-13
**Durum:** Kabul Edildi

## Bağlam

Rubion .NET projelerinde uygulama katmanı (handler'lar) üzerinde cross-cutting concern'leri (validation, logging, transaction) yönetmek için bir pattern gerekiyordu.

## Karar

**MediatR kütüphanesi ile CQRS (Command/Query Responsibility Segregation) ve `IPipelineBehavior<,>` kullanımı** varsayılan pattern olarak belirlendi.

Pipeline sırası:
```
Request → LoggingBehavior → ValidationBehavior → Handler → Response
```

## Gerekçe

**MediatR:**
- Handler'ları controller'dan ve birbirinden ayırır
- `ISender.Send()` çağrısı ile controller'lar ince (thin) kalır
- Pipeline behavior ile DRY cross-cutting concern

**ValidationBehavior:**
FluentValidation validator'ları otomatik olarak pipeline'da tetikler; her handler'da `if (!valid) return ...` tekrarını ortadan kaldırır.

**LoggingBehavior:**
Her command/query için structured log: hangi request, kim gönderdi, ne kadar sürdü — handler kodu kirlenmez.

**TransactionBehavior (opsiyonel):**
Command'larda EF Core transaction otomatik açılır/commit edilir. Yalnızca birden fazla `SaveChanges` gereken handler'larda aktif edilir.

## Sonuçlar

**Olumlu:**
- Handler'lar tek sorumluluk (iş logic'i)
- Cross-cutting concern'ler merkezi

**Olumsuz / Trade-off:**
- MediatR bağımlılığı — kütüphane değiştirilirse tüm handler'lar etkilenir (risk düşük; MediatR .NET ekosisteminde stabildir)
- `ISender` yeterince açık olmayan bir abstraction — handler içinde başka handler çağrısı anti-pattern; mediator chain kurmaktan kaçın

## Örnek Pipeline Kaydı

```csharp
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblyContaining<Program>();
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
    // TransactionBehavior gerekirse:
    // cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));
});
```
