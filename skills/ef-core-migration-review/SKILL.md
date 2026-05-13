---
name: ef-core-migration-review
description: EF Core ile üretilmiş bir migration'ı production-safety açısından inceler. Destructive operasyonları (DROP, veri kaybı riski), kilitleme tehlikelerini ve geri alma stratejisini raporlar. "Migration review yap", "migration güvenli mi", "migration kontrol et" denildiğinde kullan.
stack: [dotnet, csharp, ef-core, postgresql, mssql]
---

# EF Core Migration Review — Rubion

## Ne Zaman Kullanılır?

Her `dotnet ef migrations add` komutundan sonra, migration `main` branch'e merge edilmeden önce.

---

## İnceleme Adımları

### 1. Migration Dosyasını Oku

```bash
# Son migration dosyasını bul ve oku
ls Migrations/ | tail -1

# Örnek:
cat Migrations/20260513120000_AddCustomerIndexAndDropLegacyColumn.cs
```

### 2. Aşağıdaki Kontrolleri Uygula

Her kontrol için `[GEÇTİ]`, `[UYARI]` veya `[ENGEL]` ver.

---

## Kontrol 1 — Destructive Operasyonlar

**ENGEL** sayılanlar:

| Operasyon | Risk | Geri Alınabilir mi? |
|---|---|---|
| `DropTable` | Veri kaybı | Hayır (backup yoksa) |
| `DropColumn` | Veri kaybı | Hayır |
| `AlterColumn` (type değişimi) | Veri kaybı veya cast hatası | Hayır |
| `RenameColumn` | Kod uyumsuzluğu | Evet (rename geri alınır) |
| `DropIndex` | Performans düşüşü | Evet |

**UYARI** sayılanlar:

| Operasyon | Risk |
|---|---|
| `AddColumn NOT NULL` (default yok) | Mevcut satırlar için hata |
| `CreateIndex` (büyük tablo) | Uzun kilitleme |
| `AddForeignKey` | Kilitlenme riski |

---

## Kontrol 2 — NOT NULL Kolon Ekleme

```csharp
// TEHLİKELİ: mevcut satırlar için değer yok → hata
migrationBuilder.AddColumn<string>(
    name: "Email",
    table: "Customers",
    nullable: false);   // ← ENGEL
```

**Güvenli yol:**

```csharp
// Adım 1: nullable ekle
migrationBuilder.AddColumn<string>(
    name: "Email",
    table: "Customers",
    nullable: true);

// Adım 2: backfill (ayrı migration veya script)
migrationBuilder.Sql("UPDATE Customers SET Email = '' WHERE Email IS NULL");

// Adım 3: NOT NULL yap (ayrı migration)
migrationBuilder.AlterColumn<string>(
    name: "Email",
    table: "Customers",
    nullable: false,
    oldNullable: true);
```

---

## Kontrol 3 — Index Oluşturma (Büyük Tablo)

PostgreSQL'de `CREATE INDEX` varsayılan olarak tablo kilidini tutar.

**Tehlikeli:**

```csharp
migrationBuilder.CreateIndex("IX_Orders_CustomerId", "Orders", "CustomerId");
// → Production'da büyük tabloda uzun kilit!
```

**Güvenli (PostgreSQL):**

```csharp
migrationBuilder.Sql(
    "CREATE INDEX CONCURRENTLY IX_Orders_CustomerId ON \"Orders\" (\"CustomerId\")");
```

`CONCURRENTLY` ile index arka planda, kilit olmadan oluşturulur. Down migration'da da `DROP INDEX CONCURRENTLY` kullan.

---

## Kontrol 4 — Geri Alma Stratejisi

`Down()` metodunu oku. Her `Up()` operasyonu için karşılıklı `Down()` var mı?

```csharp
// Up: kolon ekle
migrationBuilder.AddColumn<string>("Email", "Customers", nullable: true);

// Down: kolonu sil (geri alınabilir)
migrationBuilder.DropColumn("Email", "Customers");
```

`DropTable` veya `DropColumn` varsa `Down()` mümkün değildir — backup zorunlu.

---

## Kontrol 5 — Kolon Adı / Tablo Adı Rename

```csharp
// RenameColumn — EF Core bunu destekler ama deploy sırası önemli
migrationBuilder.RenameColumn("OldName", "Orders", "NewName");
```

**Deploy stratejisi:** Rename migration, kod değişikliğiyle eş zamanlı deploy edilmeli. Kademeli deploy (blue-green) yapılıyorsa:
1. Önce yeni kolon adıyla da okuyabilen kod deploy et
2. Sonra rename migration uygula
3. Eski adı kullanan kodu kaldır

---

## Kontrol 6 — Foreign Key Kilitleri

```csharp
// FK eklemek hem kaynak hem hedef tabloyu kilitler
migrationBuilder.AddForeignKey("FK_Orders_Customers_CustomerId", ...);
```

Production'da yoğun saatte uygulanmamalı. Migration zamanlamasını dokümante et.

---

## Rapor Formatı

Migration incelemesi sonunda şu formatı kullan:

```
## Migration Review: <MigrationName>

### [GEÇTİ / UYARI / ENGEL]

**Özet:** <tek cümle>

### Bulgular

| # | Operasyon | Durum | Gerekçe |
|---|---|---|---|
| 1 | AddColumn Email NOT NULL | ENGEL | Mevcut satırlar için değer yok |
| 2 | CreateIndex IX_Orders | UYARI | Büyük tabloda kilit riski, CONCURRENTLY kullan |
| 3 | AddForeignKey | GEÇTİ | Yeni tablo, mevcut veri yok |

### Önerilen Düzeltmeler

1. Email kolonu 3 adımlı migration'a bölünmeli (nullable ekle → backfill → NOT NULL)
2. CreateIndex CONCURRENTLY olarak değiştirilmeli

### Geri Alma

Down() mevcut ve test edilebilir: EVET / HAYIR (gerekçe)

### Deploy Notu

<Varsa özel zamanlama, sıralama veya bakım penceresi notu>
```

---

## Hızlı Kontrol Listesi

```
[ ] DropTable / DropColumn var mı? → ENGEL, backup planı iste
[ ] NOT NULL kolon ekleniyor mu? → 3 adımlı migration gerekli
[ ] CreateIndex büyük tabloda mı? → CONCURRENTLY kullan
[ ] RenameColumn var mı? → deploy sırası planı yap
[ ] Down() çalışıyor mu? → test et
[ ] AddForeignKey var mı? → yoğun saat dışında deploy
[ ] AlterColumn type değişiyor mu? → data loss riski değerlendir
```
