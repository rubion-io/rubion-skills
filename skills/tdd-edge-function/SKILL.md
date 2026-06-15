---
name: tdd-edge-function
description: Supabase Edge Function'larını ve RLS politikalarını test-driven yazdırır — Deno test / Vitest ile lokal supabase'e karşı handler testi, pgTAP ile RLS doğrulaması. "Edge function TDD", "RLS test et", "önce test", "red-green-refactor" denildiğinde kullan.
stack: [supabase, deno, typescript, vitest, pgtap, rls]
---

# TDD — Supabase Edge Functions / Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Bu skill, `tdd-dotnet`'in sunucu-tarafı Supabase karşılığıdır. `tdd-react` bileşen/hook'u kapsar (RTL + MSW); bu skill **Edge Function handler'larını ve RLS politikalarını** kapsar — webhook, OAuth callback, sync job, yetki kuralı.

## Felsefe

**Temel ilke:** Testler davranışı HTTP arayüzü ve DB yetki sınırı üzerinden doğrular; implementasyon detayını değil.

**İyi test:** Edge Function'ın dışarıya verdiği sonucu doğrular — status kodu, response body, DB'de oluşan yan etki, veya RLS'in **engellediği** erişim.

**Kötü test:** Fonksiyon içinde hangi yardımcının kaç kez çağrıldığını assert eder; refactor'da kırılır.

## Anti-Pattern: Yatay Dilim

**Tüm testleri önce yazıp sonra kodu yazma.** Dikey dilim: bir test → bir implementasyon → tekrar et.

```
DOĞRU (dikey):
  RED→GREEN: "JWT yoksa 401" → guard
  RED→GREEN: "geçersiz payload 400" → Zod validation
  RED→GREEN: "geçerli istek kayıt oluşturur" → iş mantığı
```

---

## Stack

| Rol | Araç |
|---|---|
| Handler testi | Deno test veya Vitest |
| Lokal ortam | `supabase start` (gerçek Postgres + Auth + Functions) |
| RLS testi | pgTAP (`supabase/tests/*.sql`) |
| HTTP istemci | `fetch` (fonksiyon `supabase functions serve` ile ayakta) |
| Test kullanıcısı | `supabase.auth.admin.createUser` ile seed |

> İki ayrı test türü vardır ve **ikisi de gerekir**: (1) Edge Function handler testi, (2) RLS policy testi. Edge Function'ı test etmek RLS'i test etmez — RLS DB seviyesinde ayrı doğrulanmalı.

---

## İş Akışı

### 1. Planlama

Kod yazmadan önce:

- [ ] Hangi arayüz? (HTTP endpoint imzası: method, girdi, çıktı)
- [ ] Hangi davranışlar? (happy path + kritik edge: auth, validation, idempotency)
- [ ] RLS mi test edilecek, handler mı, ikisi mi?
- [ ] Kullanıcıdan onay al

### 2. Lokal Ortamı Hazırla

```bash
supabase start                          # Postgres + Auth + Storage + Functions
supabase functions serve <feature>      # fonksiyonu ayağa kaldır (ayrı terminal)
```

### 3. Tracer Bullet (Handler)

İlk test — sistemin uçtan uca çalıştığını kanıtlar:

```typescript
// supabase/functions/<feature>/index.test.ts
import { assertEquals } from "jsr:@std/assert";

const FN_URL = "http://localhost:54321/functions/v1/<feature>";

Deno.test("JWT yoksa 401 döner", async () => {
  const res = await fetch(FN_URL, { method: "POST", body: "{}" });
  assertEquals(res.status, 401);
  await res.body?.cancel();
});
```

```bash
deno test --allow-net supabase/functions/<feature>/index.test.ts
```

Kırmızı → minimal guard kodu → yeşil.

### 4. Döngü

Her davranış için: **RED** (sonraki testi yaz, kır) → **GREEN** (geçirecek minimum kod).

```typescript
Deno.test("geçersiz payload 400 + Zod issues döner", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${userJwt}` },
    body: JSON.stringify({ /* eksik alan */ }),
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "invalid_input");
});

Deno.test("geçerli istek kayıt oluşturur", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${userJwt}` },
    body: JSON.stringify({ /* geçerli */ }),
  });
  assertEquals(res.status, 201);
});
```

Kurallar:
- Bir seferde tek test
- Sadece o testi geçirecek kadar kod
- Assert daima gözlemlenebilir davranışa (status, body, DB satırı)

### 5. Refactor

Tüm testler yeşilken: tekrarı ayıkla, `_shared/`'a ortak kodu çıkar (cors, imza doğrulama, client kurulumu), modülü derinleştir. **Kırmızıdayken refactor yok.**

---

## RLS Testi (pgTAP) — Atlanmaz

RLS'i sadece migration'da yazıp test etmemek = sessiz veri sızıntısı. Her sahiplik politikası için en az iki test: sahip **görür**, yabancı **görmez**.

```sql
-- supabase/tests/<table>_rls_test.sql
begin;
select plan(3);

-- iki test kullanıcısı
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.io'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.io');

insert into portfolios (id, user_id, title) values
  ('aaaaaaaa-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'A''nın portföyü');

-- A kullanıcısı olarak çalış
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  'select count(*)::int from portfolios',
  array[1],
  'A kendi satırını görür'
);

-- B kullanıcısı A'nın satırını görmemeli
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  'select * from portfolios',
  'B, A''nın satırını göremez (RLS)'
);

select throws_ok(
  $$ update portfolios set title = 'çalındı' where id = 'aaaaaaaa-0000-0000-0000-000000000000' $$,
  null,
  'B, A''nın satırını güncelleyemez'
);

select * from finish();
rollback;
```

```bash
supabase test db
```

---

## Webhook / OAuth Testi (Özel Durum)

Webhook handler'ları imza doğrulaması içerir — TDD'de ilk testler güvenliğe odaklanır (idempotency ve replay dahil). Davranış doğru kurgulansın diye `harden-webhook` checklist'iyle birlikte yürüt:

```typescript
Deno.test("geçersiz imza 401", async () => { /* yanlış HMAC → 401 */ });
Deno.test("aynı event iki kez → tek kayıt (idempotency)", async () => { /* ... */ });
```

---

## Coverage Politikası

| Katman | Min Hedef |
|---|---|
| Edge Function handler (auth + validation + happy path) | Kritik path'ler |
| RLS policy (her sahiplik kuralı) | %100 — sahip görür + yabancı görmez |
| Webhook (imza + idempotency) | %100 — para/kimlik kritik |

**Dogmatik değil ama RLS ve webhook istisnasız.** Sessiz sızıntı ve çift-ödeme buradan çıkar.

---

> **Tam örnek** (Lemon Squeezy webhook TDD + RLS pgTAP) → [examples/01-webhook-tdd.md](examples/01-webhook-tdd.md)

## Döngü Başına Checklist

```
[ ] Test davranışı açıklıyor (status/body/DB), implementasyonu değil
[ ] Yalnızca HTTP arayüzü veya DB yetki sınırı üzerinden assert
[ ] Internal refactor bu testi kırmaz
[ ] Kod bu test için minimum
[ ] RLS politikası için "sahip görür + yabancı görmez" çifti var
[ ] Webhook ise imza + idempotency testi var
```
