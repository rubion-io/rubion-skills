# ADR-004: Database-per-Service — Mikroservis Veri İzolasyonu

**Tarih:** 2026-05-13
**Durum:** Kabul Edildi

## Bağlam

Rubion projeleri mikroservis mimarisine geçiş yaptığında her servisin veritabanı yönetimi konusunda bir karar gerekiyordu. Değerlendirilen iki yaklaşım:

1. **Shared Database:** Tüm servisler aynı PostgreSQL instance'ına, farklı schema'lara yazar. Servisler arası JOIN mümkündür.
2. **Database-per-Service:** Her servis kendi veritabanına sahiptir. Servisler yalnızca API veya mesaj kanalı üzerinden iletişim kurar.

Seçim, deployment bağımsızlığı, şema değişikliği koordinasyonu ve ölçeklenebilirlik üzerinde doğrudan etkilidir.

## Karar

**Database-per-Service varsayılan seçim olarak belirlendi.** Her mikroservis kendi PostgreSQL veritabanına sahiptir ve başka servisin şemasına doğrudan yazmaz.

Cross-service raporlama ihtiyacı için: **CDC (Change Data Capture) + read-optimized data store** (örn. Elasticsearch, data warehouse).

Distributed transaction yerine: **Saga pattern** (koreografi veya orkestrasyon).

## Gerekçe

### Database-per-Service'in Avantajları

**Bağımsız deploy:** Bir servisin şema değişikliği diğer servisleri etkilemez. Migration sadece ilgili servis deploy'u sırasında çalışır.

**Şema izolasyonu:** `Inventory` servisi `Orders` tablosunu okuyamaz, yazamaz. Bu kasıtlı bir kısıtlamadır — servisler arası bağımlılığı API sözleşmesine zorlayarak veri sızdırmayı önler.

**Ölçeklenebilirlik:** `Inventory` servisi yoğun okuma gerektiriyorsa read replica veya farklı bir storage engine (örn. Redis) tercih edilebilir. Shared DB'de bu servis bazında mümkün değildir.

**Farklı veri modeli:** Bir servis event-sourced çalışabilirken diğeri CRUD kullanabilir. Shared DB'de ortak bir şema kısıtlaması gerekir.

### Shared Database Neden Reddedildi?

- Şema değişikliği tüm servislerin release koordinasyonunu gerektirir.
- Bir servisin yavaş sorgusu diğer servislerin performansını etkiler (ortak connection pool).
- "Modüler monolith" olmaktan çıkmayı ve gerçek servis izolasyonunu sağlamak imkânsızlaşır.
- Testlerde servisleri gerçekten izole etmek güçleşir.

### Cross-Service Raporlama

Cross-service JOIN ihtiyacı meşrudur (örn. "müşteri bazında sipariş + envanter raporu"). Çözüm:

```
Servis A → Event yayınla (OrderCreated)
Servis B → Event yayınla (InventoryReserved)
        ↓
    Message Bus (RabbitMQ)
        ↓
Data Pipeline (CDC veya event consumer)
        ↓
Read Store (data warehouse / Elasticsearch / PostgreSQL replica)
        ↓
Raporlama servisi veya BI aracı
```

Bu yaklaşım gerçek zamanlılık garantisi vermez (eventual consistency). Raporlar birkaç saniye gecikebilir — çoğu iş raporu için kabul edilebilir.

### Distributed Transaction Yerine Saga

`Order` oluşturulurken `Inventory` reserve edilmesi ve `Payment` alınması gerekiyorsa distributed transaction yerine Saga:

```
1. OrderService: Order oluştur (Pending)
2. InventoryService: Stok rezerve et → başarılıysa event yayınla
3. PaymentService: Ödeme al → başarılıysa event yayınla
4. OrderService: Order'ı Confirmed'a çek

Herhangi bir adım başarısız olursa: compensating transaction
  - Stok rezervasyonunu geri al
  - Ödemeyi iade et
  - Order'ı Failed'a çek
```

MassTransit, Saga state machine desteği ile bu akışı yönetir (bkz. ADR-005).

## Sonuçlar

**Olumlu:**
- Servisler gerçekten bağımsız deploy edilebilir.
- Şema değişiklikleri koordinasyon gerektirmez.
- Her servis kendi test DB'sine sahip olabilir (Testcontainers ile izole).

**Olumsuz / Trade-off:**
- Cross-service raporlama için ek altyapı (CDC, event pipeline) gerekir.
- Distributed transaction yerine Saga karmaşıklığı artar.
- Veri tutarlılığı eventual — güçlü tutarlılık gereken işlemler dikkatli tasarlanmalıdır.

## Referanslar

- Sam Newman, "Building Microservices" — Chapter: Data Management
- Chris Richardson, "Microservices Patterns" — Saga pattern
- ADR-005: MassTransit + RabbitMQ (mesajlaşma stack'i ve Saga desteği)
