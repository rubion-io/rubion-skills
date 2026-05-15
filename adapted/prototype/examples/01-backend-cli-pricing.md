# Örnek: Backend CLI — Pricing State Machine POC

**Soru:** "Bu pricing kuralı doğru hesaplıyor mu?"
**Mod:** Backend CLI (`dotnet new console`)

---

## Setup

```bash
mkdir -p src/Pricing/_prototype
cd src/Pricing/_prototype
dotnet new console -n PricingProto
cd PricingProto
```

## Program.cs

```csharp
// _prototype — silinecek, prod değil

var state = new PricingState();

while (true)
{
    Console.WriteLine();
    Console.WriteLine($"State: {state}");
    Console.Write("Aksiyon (add|discount|reset|quit): ");
    var line = Console.ReadLine();

    switch (line)
    {
        case "add":
            Console.Write("Ürün fiyatı: ");
            if (decimal.TryParse(Console.ReadLine(), out var p))
                state = state.AddItem(p);
            break;
        case "discount":
            Console.Write("İndirim %: ");
            if (int.TryParse(Console.ReadLine(), out var d))
                state = state.ApplyDiscount(d);
            break;
        case "reset":
            state = new PricingState();
            break;
        case "quit":
            return;
    }
}

record PricingState(decimal Subtotal = 0m, decimal Discount = 0m)
{
    public PricingState AddItem(decimal price) =>
        this with { Subtotal = Subtotal + price };

    public PricingState ApplyDiscount(int pct) =>
        this with { Discount = Subtotal * pct / 100m };

    public decimal Total => Subtotal - Discount;

    public override string ToString() =>
        $"Subtotal=₺{Subtotal}, Discount=₺{Discount}, Total=₺{Total}";
}
```

```bash
dotnet run
```

State her aksiyondan sonra yazdırılır — yanlış davranış anında görülür.

---

## Cevap Bulunduktan Sonra

`_prototype/NOTES.md`:
```
Karar: %20 indirim Subtotal'a değil her item'a ayrı ayrı uygulanacak.
Gerekçe: çoklu indirim kuralları subtotal bazında çakışıyor.
```

Prototipi sil, kararı gerçek koda işle.
