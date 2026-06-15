---
name: supabase-migration-review
description: Supabase SQL migration'ını production-safety açısından inceler — DROP/veri kaybı riski, kilit tehlikeleri, RLS açıkları, rollback stratejisi. "Migration review", "migration güvenli mi", "RLS kontrol et", "supabase migration kontrol" denildiğinde.
stack: [supabase, postgresql, sql, rls, deno]
---

# Supabase Migration Review — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Bu skill, `ef-core-migration-review`'in Supabase karşılığıdır. Fark: EF'in `Migrations/*.cs` dosyaları yerine **ham SQL** (`supabase/migrations/*.sql`) okur ve EF güvenlik ağı olmadığı için **RLS** birinci sınıf kontroldür.

## Ne Zaman Kullanılır?

Her `supabase migration new` / `supabase db diff` sonrası, migration `main`'e merge edilmeden veya `supabase db push` ile production'a uygulanmadan önce. Mevcut 30+ migration'a geçmişe dönük denetim için de çalıştırılabilir.

---

## İnceleme Adımları

### 1. Migration Dosyasını Oku

```bash
# Son migration dosyasını bul ve oku
ls supabase/migrations/ | tail -1

# Örnek:
cat supabase/migrations/20260513120000_add_portfolio_table.sql
```

Birden fazla yeni migration varsa (PR'da) her birini ayrı incele.

### 2. Aşağıdaki Kontrolleri Uygula

Her kontrol için `[GEÇTİ]`, `[UYARI]` veya `[ENGEL]` ver.

---

## Kontrol 1 — Destructive Operasyonlar

**ENGEL** sayılanlar:

| Operasyon | Risk | Geri Alınabilir mi? |
|---|---|---|
| `DROP TABLE` | Veri kaybı | Hayır (PITR yedeği yoksa) |
| `DROP COLUMN` | Veri kaybı | Hayır |
| `ALTER COLUMN ... TYPE` | Cast hatası / veri kaybı | Hayır |
| `TRUNCATE` | Tüm satırlar gider | Hayır |
| `DELETE` (WHERE'siz) | Tüm satırlar gider | Hayır |

**UYARI** sayılanlar:

| Operasyon | Risk |
|---|---|
| `ADD COLUMN NOT NULL` (default yok) | Mevcut satırlar için hata |
| `CREATE INDEX` (CONCURRENTLY'siz, büyük tablo) | Uzun `ACCESS EXCLUSIVE` kilidi |
| `ADD CONSTRAINT ... FOREIGN KEY` (NOT VALID'siz) | Tablo tarama + kilit |
| `RENAME COLUMN` / `RENAME TABLE` | Uygulama kodu uyumsuzluğu |

---

## Kontrol 2 — RLS (En Kritik)

Supabase'de RLS, uygulamanın **birincil yetki sınırıdır**. `anon` ve `authenticated` rolleri DB'ye doğrudan erişir; RLS yoksa veri açıktadır.

Her yeni tablo için kontrol et:

```sql
-- ✓ DOĞRU: RLS açık + politika var
create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  ...
);
alter table portfolios enable row level security;

create policy "portfolios_select_owner"
  on portfolios for select
  to authenticated
  using (auth.uid() = user_id);
```

**ENGEL** sayılanlar:

| Durum | Risk |
|---|---|
| `create table` var ama `enable row level security` yok | Tablo `service_role` dışında erişilemez **veya** (grant varsa) tamamen açık |
| RLS açık ama **hiç policy yok** | Sessiz kilit — tüm sorgular boş döner, fark edilmez |
| `using (true)` veya `with check (true)` | Herkes her satırı okur/yazar — yetki yok |
| `to anon` ile `insert`/`update`/`delete` policy | Anonim yazma — neredeyse her zaman hata |
| `using` var ama `with check` yok (insert/update policy'sinde) | Kullanıcı başka birinin `user_id`'siyle satır yazabilir |

**Kontrol soruları:**
- Policy `auth.uid()` ile satırı gerçekten sahibine mi kısıtlıyor?
- `select` policy'si hassas kolonları (token, secret, internal flag) sızdırıyor mu?
- `service_role` zaten RLS'i bypass eder — service-only tabloya `anon`/`authenticated` grant verilmiş mi?

## Kontrol 2b — SECURITY DEFINER Fonksiyonlar

```sql
create function get_user_data(...) returns ... 
  language sql security definer  -- ← çağıranın değil, sahibinin yetkisiyle çalışır
as $$ ... $$;
```

`security definer` fonksiyon RLS'i atlayabilir. **ENGEL** eğer: içeride `auth.uid()` ile yetki kontrolü yoksa veya `search_path` sabitlenmemişse (`set search_path = ''` ekle — schema hijack riski).

---

## Kontrol 3 — NOT NULL Kolon Ekleme

```sql
-- TEHLİKELİ: mevcut satırlar için değer yok → hata
alter table users add column email text not null;   -- ← ENGEL
```

**Güvenli yol (3 adım, ayrı migration'lar):**

```sql
-- 1) nullable ekle
alter table users add column email text;
-- 2) backfill
update users set email = '' where email is null;
-- 3) NOT NULL yap
alter table users alter column email set not null;
```

> Not: Postgres 11+ sabit (volatile olmayan) DEFAULT ile `ADD COLUMN NOT NULL DEFAULT 'x'` tabloyu yeniden yazmaz. Ama `DEFAULT gen_random_uuid()` veya `now()` gibi volatile default = tam tablo rewrite + uzun kilit → UYARI.

---

## Kontrol 4 — Index ve Kilit (CONCURRENTLY Tuzağı)

```sql
-- TEHLİKELİ: büyük tabloda ACCESS EXCLUSIVE kilit
create index idx_orders_user on orders (user_id);
```

**Güvenli:** `create index concurrently`.

⚠️ **Supabase tuzağı:** Supabase CLI her migration'ı **tek transaction** içinde çalıştırır. `CREATE INDEX CONCURRENTLY` transaction içinde **çalışmaz** (`ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block`). Çözüm: index migration'ını ayrı tut ve dosyanın başına yönerge ekle:

```sql
-- supabase: bu migration tek statement, concurrently için transaction'sız çalıştır
create index concurrently if not exists idx_orders_user on orders (user_id);
```

Migration'da CONCURRENTLY + başka statement bir aradaysa → ENGEL (ya transaction'sız tek statement, ya da CONCURRENTLY'yi kaldır).

---

## Kontrol 5 — Rollback Stratejisi

Supabase migration'ları **ileri-only**dır — EF'teki gibi otomatik `Down()` yoktur. Geri alma planı:

- Geri alınabilir değişiklik mi (kolon ekleme, index)? → ters migration yazılabilir, dosyada nasıl geri alınacağını **yorum olarak** belirt.
- Veri kaybı içeren değişiklik mi (DROP)? → tek güvence **PITR (Point-in-Time Recovery)** yedeği. Migration öncesi yedek doğrulanmış mı?
- Production'a `db push` öncesi staging'de denenmiş mi?

---

## Kontrol 6 — Naming ve Idempotency

- Dosya adı Supabase CLI formatında mı: `<timestamp>_<snake_case>.sql` (örn `20260513120000_add_email_to_users.sql`). Yanlış: `migration1.sql`, `fix.sql`.
- Tekrar uygulanabilirlik: `create table if not exists`, `drop ... if exists`, `create policy` öncesi `drop policy if exists` — kısmi-başarısız migration'ı kurtarır.

---

## Rapor Formatı

```
## Migration Review: <dosya adı>

### [GEÇTİ / UYARI / ENGEL]

**Özet:** <tek cümle>

### Bulgular

| # | Operasyon | Durum | Gerekçe |
|---|---|---|---|
| 1 | create table portfolios | ENGEL | RLS enable yok — tablo açık |
| 2 | create index idx_orders_user | UYARI | CONCURRENTLY yok, büyük tabloda kilit |
| 3 | policy portfolios_select_owner | GEÇTİ | auth.uid() = user_id, doğru |

### Önerilen Düzeltmeler

1. `alter table portfolios enable row level security;` + owner policy ekle
2. Index'i ayrı migration'a al, CONCURRENTLY (transaction'sız) kullan

### Geri Alma

Ters migration mümkün / PITR gerekli: <hangisi + gerekçe>

### Deploy Notu

<Varsa bakım penceresi, sıralama veya staging-önce notu>
```

---

## Hızlı Kontrol Listesi

```
[ ] DROP TABLE / DROP COLUMN / TRUNCATE / WHERE'siz DELETE var mı? → ENGEL, PITR planı iste
[ ] Yeni tabloda ENABLE ROW LEVEL SECURITY + policy var mı? → yoksa ENGEL
[ ] Policy'de using(true) / with check(true) / anon yazma var mı? → ENGEL
[ ] insert/update policy'sinde WITH CHECK var mı? → yoksa user_id spoof riski
[ ] SECURITY DEFINER fonksiyonda yetki kontrolü + sabit search_path var mı?
[ ] NOT NULL kolon ekleniyor mu? → 3 adımlı migration
[ ] CREATE INDEX büyük tabloda mı? → CONCURRENTLY + transaction'sız ayrı migration
[ ] Volatile DEFAULT ile ADD COLUMN var mı? → tablo rewrite riski
[ ] Dosya adı snake_case timestamp formatında mı?
[ ] Geri alma planı (ters migration veya PITR) net mi?
```
