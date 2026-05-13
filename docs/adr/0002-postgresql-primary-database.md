# ADR-002: PostgreSQL Birincil Veritabanı, MSSQL Yalnızca Legacy/Enterprise

**Tarih:** 2026-05-13
**Durum:** Kabul Edildi

## Bağlam

Rubion projeleri için varsayılan ilişkisel veritabanı seçimi yapılmalıydı. Değerlendirilen seçenekler: PostgreSQL, MSSQL (SQL Server), MySQL.

## Karar

**PostgreSQL birincil veritabanı.** MSSQL yalnızca şu durumlarda kullanılır:
- Mevcut müşteri altyapısında MSSQL zorunluluğu var (legacy sistem entegrasyonu)
- Enterprise lisans anlaşması MSSQL'i kapsıyor ve geçiş onaylanmıyor

## Gerekçe

**Lisanslama:** PostgreSQL açık kaynak, ücretsiz. MSSQL Express sınırları kısıtlayıcı, Standard/Enterprise maliyeti küçük takımlar için orantısız.

**Özellik seti:** PostgreSQL, JSONB, full-text search, window functions, CTE, lateral join gibi gelişmiş özellikleri ücretsiz sunar. Bu özellikler zaman zaman ayrı bir servis (Elasticsearch, Redis JSON) ihtiyacını ortadan kaldırır.

**Testcontainers uyumu:** `postgres:16-alpine` image küçük ve hızlı; CI'da spin-up süresi minimaldır.

**Hosting seçenekleri:** Supabase, Neon, Railway, AWS RDS, Azure Database for PostgreSQL — geniş seçenek yelpazesi.

**Npgsql:** .NET için en gelişmiş, aktif geliştirilen PostgreSQL sürücüsü; EF Core entegrasyonu güçlü.

## Sonuçlar

- Yeni projeler `Npgsql.EntityFrameworkCore.PostgreSQL` ile başlar
- `appsettings.json` bağlantı dizgesi `Host=...;Database=...;Username=...;Password=...` formatında
- MSSQL kullanan projeler için `Microsoft.EntityFrameworkCore.SqlServer` ve ayrı Testcontainers image (`mcr.microsoft.com/mssql/server:2022-latest`)
- Migration'lar PostgreSQL için `CONCURRENTLY` index oluşturma avantajından yararlanır (bkz. `ef-core-migration-review` skill)
