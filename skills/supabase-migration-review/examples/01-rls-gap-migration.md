# Örnek: RLS Açığı Olan Migration İncelemesi

**Migration:** `20260610090000_add_contracts_table.sql`

## Migration Kodu

```sql
create table contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  counterparty text not null,
  amount numeric not null,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_contracts_user on contracts (user_id);

-- RLS satırı yok!

grant select, insert, update on contracts to authenticated;
```

---

## Review Raporu

```
## Migration Review: 20260610090000_add_contracts_table

### [ENGEL]

**Özet:** Tablo `authenticated` rolüne açık ama RLS yok — her kullanıcı herkesin
sözleşmesini (tutar, karşı taraf dahil) okuyup değiştirebilir.

### Bulgular

| # | Operasyon | Durum | Gerekçe |
|---|---|---|---|
| 1 | create table contracts | GEÇTİ | Yapı doğru, FK + audit kolon var |
| 2 | (RLS) enable row level security yok | ENGEL | grant verilmiş ama RLS yok → tablo tamamen açık |
| 3 | (RLS) hiç policy yok | ENGEL | Sahiplik kısıtı tanımlı değil |
| 4 | create index idx_contracts_user | UYARI | Yeni/küçük tabloda sorun yok; canlıda büyükse CONCURRENTLY |
| 5 | grant ... to authenticated | UYARI | RLS olmadan grant = açık erişim; RLS sonrası kabul edilebilir |

### Önerilen Düzeltmeler

1. **RLS aç + owner policy ekle** (insert/update'te WITH CHECK zorunlu — user_id spoof engeli):

   ```sql
   alter table contracts enable row level security;

   create policy "contracts_select_owner" on contracts
     for select to authenticated using (auth.uid() = user_id);

   create policy "contracts_insert_owner" on contracts
     for insert to authenticated with check (auth.uid() = user_id);

   create policy "contracts_update_owner" on contracts
     for update to authenticated
     using (auth.uid() = user_id) with check (auth.uid() = user_id);
   ```

2. **amount hassas** — `select` policy yalnızca sahibe açtığı için ek koruma gerekmez,
   ama raporlama görünümü eklenirse ayrı policy düşün.

### Geri Alma

İleri-only migration. Tablo yeni → veri kaybı riski yok, `drop table contracts` ile
geri alınabilir. Production'a gitmeden önce RLS düzeltmesi **aynı migration'a** eklenmeli
(açık tablo bir an bile canlıya çıkmamalı).

### Deploy Notu

- RLS olmadan ASLA push etme. Düzeltme uygulanmış migration'ı `supabase db push` öncesi
  staging'de pgTAP ile doğrula: "sahip görür, yabancı görmez".
- Regression: `tdd-edge-function`'daki RLS pgTAP pattern'iyle test ekle.
```
