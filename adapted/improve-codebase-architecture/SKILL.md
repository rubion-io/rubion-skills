---
adapted_from: mattpocock/skills/skills/engineering/improve-codebase-architecture
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: heavy
name: improve-codebase-architecture
description: Codebase'de derinleştirme fırsatlarını (deep module) tespit eder. .NET / VSA / CQRS bağlamında VSA vs Clean Architecture kararı, Domain vs Integration Event ayrımı, Repository pattern eleştirisi, Monolith→Mikroservis kararı dahil. "Mimari iyileştir", "refactor fırsatı bul", "tightly coupled modülleri ayır" denildiğinde kullan.
stack: [dotnet, csharp, architecture]
---

# Improve Codebase Architecture — Rubion

Mimari sürtüşmeyi yüzeye çıkar ve **derinleştirme fırsatları** öner — shallow module'ü deep module'e çevirecek refactor'lar. Hedef: test edilebilirlik ve AI-navigability.

---

## Sözlük (LANGUAGE.md'den, kesin terimler)

Bu terimleri her öneride birebir kullan. "Component", "service", "API", "boundary"e kayma.

- **Module:** Interface'i ve implementasyon'u olan herhangi bir şey (fonksiyon, sınıf, paket, dilim).
- **Interface:** Caller'ın modülü kullanmak için bilmesi gereken her şey — tipler, invariant'lar, hata modları, sıralama, config. Sadece tip imzası değil.
- **Implementation:** İçeride duran kod.
- **Depth:** Interface'teki kaldıraç. **Deep** = küçük interface, çok davranış. **Shallow** = interface implementasyon kadar karmaşık.
- **Seam:** Bir interface'in yaşadığı yer; davranışın yerinde değiştirilebileceği nokta. ("Boundary" deme.)
- **Adapter:** Bir seam'deki interface'i karşılayan somut şey.
- **Locality:** Bir değişikliğin / hatanın tek yerde toplanmasının değeri.

### Kilit İlkeler

- **Silme testi:** Modülü zihinsel olarak sil. Karmaşıklık kaybolursa pass-through'ydu. Karmaşıklık N caller'da yeniden ortaya çıkarsa hak ediyordu.
- **Interface, test yüzeyidir.**
- **Bir adapter = hipotetik seam. İki adapter = gerçek seam.**

Bu skill projenin domain modeli tarafından **bilgilendirilir**: `CONTEXT.md` iyi seam'lere isim verir; ADR'ler tekrar tartışmamamız gereken kararları kaydeder.

---

## Süreç

### 1. Keşfet

İlk olarak: ilgili alandaki `CONTEXT.md` ve `docs/adr/`'ı oku. Multi-context projede modülün kendi ADR klasörü olabilir (bkz. `setup-rubion-skills/domain.md`).

Sonra Agent + `subagent_type=Explore` ile codebase'i dolaş. Katı heuristic uygulama — organik keşfet, sürtünme yaşadığın yeri not al:

- Bir kavramı anlamak için pek çok küçük modül arasında zıplamak gerekiyor mu?
- Bir modül **shallow** mı — interface'i implementasyon kadar karmaşık mı?
- Sırf testability için pure function extract edilmiş ama gerçek bug'lar çağrı yerinde mi (locality yok)?
- Tightly coupled modüller seam'lerinden sızıyor mu?
- Codebase'in hangi parçaları test edilmemiş veya mevcut interface üzerinden test edilmesi zor?

**Silme testi:** Shallow şüphelendiklerine uygula — silersem karmaşıklık tek noktada mı toplanır, yoksa sadece yer mi değiştirir? "Toplanır" = istediğin sinyal.

### 2. Aday'ları sun

Numaralı liste olarak derinleştirme fırsatlarını sun. Her aday için:

- **Dosyalar:** İlgili modüller
- **Problem:** Mevcut mimari neden sürtüşme yaratıyor
- **Çözüm:** Düz Türkçe ne değişecek
- **Faydalar:** Locality, leverage ve testlerin nasıl iyileşeceği

CONTEXT.md sözlüğünü kullan — "Order intake modülü", "the FooBarHandler" değil. Domain'in dili neyse orada kalan modülün adı odur.

**ADR çelişkileri:** Bir aday mevcut bir ADR ile çelişiyorsa, yalnızca sürtünme ADR'yi yeniden açmaya değer kadar gerçekse gündeme getir. Açıkça işaretle ("_ADR-0007 ile çelişir — ama yeniden açılmaya değer çünkü..._"). Her teorik refactor'ı listeleme.

Henüz interface önerme. Kullanıcıya sor: "Bunlardan hangisini araştıralım?"

### 3. Grilling Loop

Kullanıcı bir aday seçince, grilling konuşmasına gir. Tasarım ağacını birlikte gez — kısıtlar, bağımlılıklar, derinleştirilmiş modülün şekli, seam'in arkasında ne durur, hangi testler hayatta kalır.

Yan etkiler kararlar netleşince anında:

- **Derinleştirilmiş modül CONTEXT.md'de olmayan bir kavramla adlandırılıyor mu?** Terimi ekle (bkz. `grill-with-docs`).
- **Konuşma sırasında muğlak bir terim netleşiyor mu?** CONTEXT.md'yi yerinde güncelle.
- **Kullanıcı adayı kalıcı bir gerekçeyle reddediyor mu?** ADR öner: "_Bunu ADR olarak kaydedelim mi ki gelecek review'lar tekrar önermesin?_". Yalnızca gelecek bir explorer'ın bilmek isteyeceği bir gerekçe varsa öner — geçici ("şimdilik değer yok") veya bariz olanları atla.

---

## Rubion / .NET Bağlamında Pattern Karar Ağaçları

### A) VSA vs Clean Architecture

Rubion default = VSA (bkz. `docs/adr/0001-vertical-slice-architecture-default.md`).

```
Clean Architecture'e geçişi düşün:
  ✓ Domain logic 3+ farklı UI kanalı tarafından paylaşılıyor (web + mobil + CLI)
  ✓ Domain'i ORM'den izole edip değiştirme niyeti somut
  ✓ Takım 10+ kişi ve katmanlı sorumluluk ayrımı yönetimi kolaylaştırıyor

Clean overkill:
  ✗ Tek UI + tek backend
  ✗ Domain logic %20'den az (çoğu CRUD)
  ✗ Takım küçük
```

VSA'da derinleştirme fırsatları:
- Handler içindeki domain logic 30+ satır → entity'ye method olarak taşı
- Aynı validation 3+ handler'da tekrar → domain invariant olarak entity constructor'a
- Cross-slice paylaşılan logic → `<Module>/Shared/` altına saf domain primitive

### B) Domain Event vs Integration Event

**Domain Event:** Aynı bounded context içinde, in-process. Aggregate state değişimini ifade eder.
**Integration Event:** Context'ler arasında, message bus üzerinden. Domain Event'in dışarıya açık karşılığı.

```
Domain Event örneği: OrderPriced
  → Aynı service içinde DiscountPolicy tarafından dinlenir.
  → MediatR INotification ile in-memory dispatch.

Integration Event örneği: OrderCreatedIntegrationEvent
  → RabbitMQ exchange üzerinden yayınlanır.
  → Inventory service tarafından tüketilir.
  → Payload kontrat olarak versiyonlanır (örn: v1, v2).
```

Anti-pattern: Domain event'i doğrudan RabbitMQ'ya gönderme. İkisi farklı zamanda, farklı transactional context'te yayılır.

### C) Repository Pattern Eleştirisi (EF Core'da)

**Silme testi:** `OrderRepository`'yi silersek?

```csharp
// Mevcut shallow repository
public class OrderRepository : IOrderRepository {
    private readonly AppDbContext _db;
    public Task<Order?> GetByIdAsync(Guid id) => _db.Orders.FindAsync(id).AsTask();
    public Task AddAsync(Order o) { _db.Orders.Add(o); return Task.CompletedTask; }
    public Task SaveAsync() => _db.SaveChangesAsync();
}
```

Silinirse handler `_db.Orders.FindAsync(id)` yazar — karmaşıklık tek satıra düşer, *kaybolur*. Bu shallow.

**Repository tut:**
- EF Core dışında (Dapper, raw SQL, harici API) farklı veri kaynağı var
- Specification pattern uyguluyorsun ve sorgu mantığını isimlendirmek istiyorsun

**Repository sil:**
- Sadece `_db.Set<T>()` wrap'lıyor
- Testlerde Testcontainers ile gerçek DB kullanılıyor

### D) Monolith → Mikroservis Kararı

**Bounded context tespit checklist'i:**

```
[ ] Modülün kendine ait domain dili var (Inventory'nin "stok" tanımı Sales'in "stok"undan farklı)
[ ] Modül kendi veri modeline sahip, başka modüllerin tabloları üzerinde yazma operasyonu yapmıyor
[ ] Modülün yaşam döngüsü farklı (ayrı release cadence)
[ ] Farklı SLA / ölçeklenme ihtiyacı (Inventory yoğun read, Sales yazma)
[ ] Modülü kullanan dış sistem var (API olarak ayrı tüketilecek)
```

3+ "evet" → ayrı servise aday.

**Strangler Fig Pattern:**

```
1. Yeni servisi ayrı deploy et, monolith'in dışında.
2. API gateway veya monolith içine "shim" yerleştir — eski endpoint'i yeni servise yönlendir.
3. Veri: önce read'ı çift kaynak'a yaz (dual-write), monolith'i ana DB tutarak.
4. Tutarlılık doğrulansın diye trafik %0 → %5 → %50 → %100 kaydırılır.
5. Eski kod monolith'ten silinir; tablo migrate edilir veya CDC ile sync edilir.
```

**Database-per-service vs Shared DB:**

```
Database-per-service:
  ✓ Bağımsız deploy
  ✓ Şema değişiklikleri izole
  ✗ Cross-service raporlama zor (event-driven analytics)
  ✗ Distributed transaction (genelde saga pattern ile)

Shared DB:
  ✓ Cross-service JOIN mümkün
  ✗ Şema değişikliği koordinasyon gerektirir
  ✗ Servisler aslında ayrı değil — modüler monolith demek
```

Rubion default: **Database-per-service**, raporlama için **read replica + CDC + data warehouse**.

---

## Sık Karşılaşılan Derinleştirme Fırsatları (Rubion'da)

| Shallow Pattern | Derinleştirme |
|---|---|
| `OrderService` 800 satır | Slice'lara böl (her method ayrı handler) |
| `OrderHelper.CalculateTotal()` static utility | Order entity'sine `Total` computed property |
| 5 handler'da aynı `if (order.Status != Open) throw` | `Order.Cancel()` method'una invariant |
| Repository sadece EF Set<T> wrap | Sil, handler direkt `_db.Orders` kullansın |
| Notification için 3 ayrı method | `INotificationPublisher` seam, MediatR INotification pattern |
| Cross-service HTTP call hardcoded | `IIntegrationEventBus` seam, RabbitMQ adapter arkasında |

---

## Yapma

- ✗ Henüz tek implementation varken interface çıkarma (hipotetik seam)
- ✗ "Daha temiz görünür" diye refactor — silme testini geçmesi lazım
- ✗ ADR ile çelişen öneriyi gerekçe olmadan sunma
- ✗ Domain dilini kullanmadan teknik isim ("OrderManager") önerme
- ✗ Bir aday'ı seçtirmeden interface tasarımına geçme
