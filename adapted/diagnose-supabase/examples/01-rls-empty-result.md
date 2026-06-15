# Örnek: "Liste Boş Dönüyor" — RLS Denial Teşhisi

**Şikayet:** "Kullanıcı kendi kurslarını göremiyor, liste boş. Ama veriler kesin var,
Supabase dashboard'da görüyorum."

## Faz 1 — Feedback Loop

Frontend'i debug etmeye dalmadan önce deterministik bir SQL repro kur. Dashboard
`service_role` ile çalışır (RLS bypass) — bu yüzden orada veri görünür. Asıl soru:
`authenticated` rolünde geliyor mu?

```sql
-- Supabase SQL editör — kullanıcı gibi davran
set local role authenticated;
set local request.jwt.claim.sub = '7c9e...uuid';   -- gerçek kullanıcı id'si
select * from courses;
```

→ **Boş döndü.** Loop kuruldu: bu sorgu RLS sorununu deterministik yeniden üretiyor.

## Faz 2 — Reproduce

- [x] Boş sonuç tekrarlanıyor (service_role'de dolu, authenticated'de boş)
- [x] Semptom net: hata yok, sadece 0 satır → **RLS denial**, veri eksikliği değil

## Faz 3 — Hipotez

1. Policy `auth.uid() = user_id` bekliyor ama `courses.user_id` farklı bir kolonu
   (`owner_id` / `created_by`) tutuyor → eşleşme yok.
2. JWT `sub` claim'i ile `user_id` tipi/değeri uyuşmuyor (text vs uuid cast).
3. Policy yalnızca `for select to anon` tanımlı, `authenticated` için yok.
4. RLS açık ama policy hiç yok (sessiz kilit).

## Faz 4 — Instrument (tek değişken)

```sql
-- Policy gerçekte ne diyor?
select policyname, roles, cmd, qual from pg_policies where tablename = 'courses';
```

Çıktı:

```
 policyname            | roles           | cmd    | qual
-----------------------+-----------------+--------+----------------------------
 courses_select_owner  | {authenticated} | SELECT | (auth.uid() = created_by)
```

→ Policy `created_by` kolonuna bakıyor. Tabloyu kontrol et:

```sql
select column_name from information_schema.columns
where table_name = 'courses' and column_name in ('user_id', 'created_by', 'owner_id');
-- → user_id  (created_by kolonu YOK — eski isim, migration'da değişmiş)
```

**Hipotez 1 doğrulandı.** Policy `created_by` diyor ama kolon `user_id`. `auth.uid() =
created_by` → `created_by` null/yok → her satır elenir → boş sonuç. Sessiz, çünkü RLS
eşleşmeyen satırı hata değil, yokmuş gibi davranır.

## Faz 5 — Düzelt + Regression

Önce failing pgTAP testi (doğru seam — DB seviyesi):

```sql
-- supabase/tests/courses_rls_test.sql
set local request.jwt.claim.sub = '<owner-uuid>';
select results_eq('select count(*)::int from courses', array[1], 'sahip kendi kursunu görür');
-- RED: 0 döner
```

Fix — policy'yi doğru kolona bağla (yeni migration):

```sql
drop policy if exists "courses_select_owner" on courses;
create policy "courses_select_owner" on courses
  for select to authenticated using (auth.uid() = user_id);
```

→ pgTAP GREEN. Faz 1 SQL loop'u tekrar: artık dolu.

## Faz 6 — Cleanup + Post-Mortem

- [x] SQL repro artık dolu dönüyor
- [x] pgTAP regression testi geçiyor
- [x] Geçici SQL probe'ları editörden silindi

**Ne önleyebilirdi?** Kolon adı `created_by → user_id` migration'ında policy güncellenmemiş.
→ `supabase-migration-review`'i pipeline'a koy (RENAME COLUMN policy etkisini yakalar) +
her RLS policy için pgTAP testi (`tdd-edge-function`) — test olsaydı rename anında kırılırdı.
```
