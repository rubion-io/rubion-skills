# Örnek: Tehlikeli Migration İncelemesi

**Migration:** `20260513_AddEmailAndDropLegacyPhone`

## Migration Kodu

```csharp
public partial class AddEmailAndDropLegacyPhone : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Yeni kolon — NOT NULL, default yok
        migrationBuilder.AddColumn<string>(
            name: "Email",
            table: "Customers",
            maxLength: 256,
            nullable: false,
            defaultValue: "");  // boş string default — dikkatli!

        // Eski kolon siliniyor
        migrationBuilder.DropColumn(name: "PhoneLegacy", table: "Customers");

        // Index
        migrationBuilder.CreateIndex(
            name: "IX_Customers_Email",
            table: "Customers",
            column: "Email",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex("IX_Customers_Email", "Customers");
        migrationBuilder.DropColumn("Email", "Customers");
        // PhoneLegacy geri gelemiyor!
    }
}
```

---

## Review Raporu

```
## Migration Review: AddEmailAndDropLegacyPhone

### [ENGEL]

**Özet:** DropColumn ile veri kaybı riski; CreateIndex büyük tabloda kilit tehlikesi.

### Bulgular

| # | Operasyon | Durum | Gerekçe |
|---|---|---|---|
| 1 | AddColumn Email NOT NULL defaultValue="" | UYARI | Boş string default kabul edilebilir ama intentional mi? |
| 2 | DropColumn PhoneLegacy | ENGEL | Veri kaybı — geri alınamaz |
| 3 | CreateIndex IX_Customers_Email UNIQUE | UYARI | Büyük tabloda kilit riski, CONCURRENTLY gerekli |

### Önerilen Düzeltmeler

1. **DropColumn engelini kaldır:** `PhoneLegacy` gerçekten kullanılmıyor mu?
   Kontrol et: `grep -r "PhoneLegacy" src/ --include="*.cs"`
   Kullanan kod kalmadıysa, ayrı bir "cleanup" migration'da sil ve deploy öncesi backup al.

2. **CreateIndex → CONCURRENTLY:**
   ```csharp
   migrationBuilder.Sql(
       "CREATE UNIQUE INDEX CONCURRENTLY \"IX_Customers_Email\" " +
       "ON \"Customers\" (\"Email\")");
   ```
   Down'da da:
   ```csharp
   migrationBuilder.Sql("DROP INDEX CONCURRENTLY \"IX_Customers_Email\"");
   ```

3. **Email NOT NULL default:** Boş string olduğu için mevcut satırlar geçer.
   Ama gerçek email validation uygulanacaksa, backfill sonrası CHECK constraint ekle.

### Geri Alma

Down() kısmen çalışır: Email ve Index silinebilir. PhoneLegacy geri GELEMEZ.

### Deploy Notu

- PhoneLegacy drop'tan önce PostgreSQL backup al: `pg_dump -t Customers ...`
- CreateIndex CONCURRENTLY migration penceresi dışında apply edilebilir (yoğun saatte bile güvenli)
- Email unique constraint: mevcut duplicate email var mı? `SELECT Email, COUNT(*) FROM Customers GROUP BY Email HAVING COUNT(*) > 1`
```
