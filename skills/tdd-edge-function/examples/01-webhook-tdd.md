# Örnek: Lemon Squeezy Webhook'unu TDD ile Yazma

Hedef: `order_created` event'i geldiğinde kullanıcının aboneliğini aktive eden bir
Edge Function. Güvenlik kritik → ilk testler imza + idempotency.

## Plan (Faz 1)

Public interface: `POST /functions/v1/lemonsqueezy-webhook`, raw JSON body + `X-Signature` header.
Davranışlar (sıralı):
1. İmza yoksa/yanlışsa → 401
2. Geçerli imza + `order_created` → abonelik aktive, 200
3. Aynı event iki kez → tek aktivasyon (idempotency)

Lokal ortam:

```bash
supabase start
supabase functions serve lemonsqueezy-webhook --env-file ./supabase/.env.local
```

---

## Döngü 1 — İmza (RED → GREEN)

```typescript
// supabase/functions/lemonsqueezy-webhook/index.test.ts
import { assertEquals } from "jsr:@std/assert";

const URL = "http://localhost:54321/functions/v1/lemonsqueezy-webhook";

Deno.test("imza yoksa 401", async () => {
  const res = await fetch(URL, { method: "POST", body: JSON.stringify({ meta: {} }) });
  assertEquals(res.status, 401);
  await res.body?.cancel();
});
```

```bash
deno test --allow-net supabase/functions/lemonsqueezy-webhook/index.test.ts
# RED: 500 (handler yok) → guard ekle → GREEN: 401
```

GREEN için minimum:

```typescript
const sig = req.headers.get("X-Signature");
const raw = await req.text();
if (!sig || !(await verifyHmac(raw, sig, secret))) {
  return new Response(JSON.stringify({ error: "invalid_signature" }), { status: 401 });
}
```

> İmzayı **raw body** üzerinden doğrula — `verifyHmac` parse edilmiş gövdeyle çağrılırsa
> kırılır. Detay: `harden-webhook` Kontrol 1.

## Döngü 2 — Aktivasyon (RED → GREEN)

```typescript
Deno.test("geçerli order_created aboneliği aktive eder", async () => {
  const body = JSON.stringify({ meta: { event_name: "order_created" }, data: { id: "ord_1", attributes: { user_email: "a@test.io" } } });
  const res = await fetch(URL, {
    method: "POST",
    headers: { "X-Signature": sign(body, secret) },
    body,
  });
  assertEquals(res.status, 200);
  // DB doğrulaması: subscriptions tablosunda active satır var mı
});
```

## Döngü 3 — Idempotency (RED → GREEN)

```typescript
Deno.test("aynı event iki kez → tek aktivasyon", async () => {
  const body = signedBody("ord_dup");
  await postSigned(body);
  const res2 = await postSigned(body);          // ikinci kez
  assertEquals(res2.status, 200);               // hata değil
  // subscriptions'ta tek active satır olmalı (event_id dedupe)
});
```

GREEN: `processed_webhook_events(event_id unique)` tablosuna insert; `23505` → already processed.

---

## RLS Testi (Ayrı — pgTAP)

Webhook `service_role` ile yazıyorsa RLS bypass olur; ama kullanıcıların `subscriptions`
tablosunu **okuması** RLS ile sınırlı olmalı:

```sql
-- supabase/tests/subscriptions_rls_test.sql
begin;
select plan(2);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.io'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.io');
insert into subscriptions (user_id, status) values
  ('11111111-1111-1111-1111-111111111111', 'active');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq('select count(*)::int from subscriptions', array[1], 'A kendi aboneliğini görür');

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty('select * from subscriptions', 'B, A''nın aboneliğini göremez');

select * from finish();
rollback;
```

```bash
supabase test db
```

---

## Faz 6 — Bitiş

```
[ ] 3 handler testi yeşil (imza, aktivasyon, idempotency)
[ ] 2 RLS testi yeşil (sahip görür, yabancı görmez)
[ ] harden-webhook checklist'i geçti (raw body, dedupe, secret env'den)
[ ] [DBG-...] log yok
```
