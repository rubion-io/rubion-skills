---
name: harden-webhook
description: Dışa açık webhook ve OAuth callback handler'larını güvenlik açısından denetler ve sertleştirir — imza doğrulama (raw body), idempotency, replay koruması, secret yönetimi, OAuth state. "Webhook güvenli mi", "ödeme entegrasyonunu kontrol et", "webhook sertleştir" denildiğinde.
stack: [supabase, deno, typescript, webhook, security]
---

# Harden Webhook — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Webhook ve OAuth callback'leri internet'e açık, kimliği doğrulanmamış girişlerdir. İmza doğrulanmazsa veya idempotent değilse: **sahte event → yetkisiz işlem**, **çift event → çift ödeme/kredi**. Bu, kritik-path'tir — düzeltme uygulansa bile **insan review zorunludur**.

## Ne Zaman Kullanılır?

Bir webhook/OAuth callback handler'ı yazılırken veya değiştirilirken; "bu webhook güvenli mi", "ödeme entegrasyonunu kontrol et" denince. Bu projede kapsam: **Lemon Squeezy, Paddle** (ödeme), **Resend** (email), **Instagram/TikTok** (OAuth).

## İnceleme Adımları

### 1. Handler'ı Oku

```bash
ls supabase/functions/ | grep -Ei 'webhook|callback|oauth'
cat supabase/functions/<provider>-webhook/index.ts
```

### 2. Kontrolleri Uygula

Her kontrol için `[GEÇTİ]`, `[UYARI]` veya `[ENGEL]`.

---

## Kontrol 1 — İmza Doğrulama (Raw Body)

**En sık ve en tehlikeli hata.** İmza, gövdenin **ham (raw) byte'ları** üzerinden doğrulanmalı. `await req.json()` ile parse edip sonra tekrar `JSON.stringify` ile imza hesaplamak imzayı bozar — sağlayıcının imzaladığı tam byte dizisi kaybolur.

```typescript
// ✓ DOĞRU: önce raw body al, imzayı onun üzerinden doğrula, sonra parse et
const raw = await req.text();
const valid = await verifyHmac(raw, req.headers.get("X-Signature"), secret);
if (!valid) return json({ error: "invalid_signature" }, 401);
const event = JSON.parse(raw);
```

```typescript
// ✗ ENGEL: parse edilmiş gövdeden imza — kırılır / atlanır
const event = await req.json();
const valid = verifyHmac(JSON.stringify(event), sig, secret);  // YANLIŞ
```

Sağlayıcıya göre:

| Sağlayıcı | Mekanizma | Header |
|---|---|---|
| Lemon Squeezy | HMAC-SHA256, raw body | `X-Signature` |
| Paddle | HMAC-SHA256 (Billing) / public key (Classic) | `Paddle-Signature` |
| Resend (Svix) | Svix imzası — `svix-id`, `svix-timestamp`, `svix-signature` | üç header birlikte |

**ENGEL:** imza kontrolü yok, ya da parse edilmiş gövdeden hesaplanıyor.
**ENGEL:** karşılaştırma `===` ile (timing attack) — sabit-zamanlı karşılaştırma kullan (`crypto.subtle` / `timingSafeEqual`).

---

## Kontrol 2 — Idempotency

Sağlayıcılar 2xx alana kadar **retry eder** — aynı event birden çok kez gelir. İşlem idempotent değilse çift kayıt / çift ödeme oluşur.

```typescript
// event_id'yi unique constraint'li tabloya yaz; çakışma = zaten işlendi
const { error } = await supabase
  .from("processed_webhook_events")
  .insert({ event_id: event.id, provider: "lemonsqueezy" });
if (error?.code === "23505") return json({ status: "already_processed" }, 200);
```

**ENGEL:** retry edilen event çift yan etki üretiyor (kredi ekleme, abonelik uzatma, email gönderme).
**Gerekli:** `event_id` üzerinde unique constraint olan bir dedupe tablosu (`processed_webhook_events`) veya eşdeğeri.

---

## Kontrol 3 — Replay Koruması

İmzalı eski bir event tekrar oynatılabilir. Timestamp kontrolü ekle (Svix/Resend bunu header'da verir):

```typescript
const ts = Number(req.headers.get("svix-timestamp")) * 1000;
if (Math.abs(Date.now() - ts) > 5 * 60_000) return json({ error: "stale" }, 401);
```

**UYARI:** timestamp doğrulaması yok (idempotency varsa risk düşer, yine de önerilir).

---

## Kontrol 4 — 2xx Zamanlaması

DB commit'inden **önce** 200 dönülürse event kaybolur (sağlayıcı başarılı sayar, retry etmez). Sıra: doğrula → işle → **commit** → 200 dön. İşlem başarısızsa 5xx dön ki sağlayıcı retry etsin.

**ENGEL:** kritik yan etki tamamlanmadan 200 dönülüyor (fire-and-forget commit).

---

## Kontrol 5 — Secret Yönetimi

```typescript
const secret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");  // ✓
// const secret = "whsec_abc123";                            // ✗ ENGEL
```

**ENGEL:** imza secret'ı, API anahtarı veya `service_role` key kodda hardcoded / repo'da. `supabase secrets set` ile yönetilmeli.
**UYARI:** Edge Function `SUPABASE_SERVICE_ROLE_KEY` kullanıyor ama imza doğrulanmadan önce DB'ye yazıyor (doğrulama her zaman ilk adım olmalı).

---

## Kontrol 6 — OAuth Callback (Instagram / TikTok)

```typescript
// state parametresi CSRF koruması — başlatırken üretilen değerle eşleşmeli
if (url.searchParams.get("state") !== storedState) {
  return json({ error: "invalid_state" }, 401);
}
```

**ENGEL:** `state` parametresi doğrulanmıyor (CSRF — saldırgan kendi hesabını kurbanınkine bağlayabilir).
**ENGEL:** alınan access/refresh token loglanıyor veya RLS'siz/şifresiz tabloya yazılıyor.
**UYARI:** `redirect_uri` allow-list'te değil.

---

## Rapor Formatı

```
## Webhook Review: <provider>-webhook

### [GEÇTİ / UYARI / ENGEL]

**Özet:** <tek cümle>

### Bulgular

| # | Kontrol | Durum | Gerekçe |
|---|---|---|---|
| 1 | İmza (raw body) | ENGEL | json() ile parse sonrası imza hesaplanıyor |
| 2 | Idempotency | ENGEL | event_id dedupe yok — retry çift kredi veriyor |
| 3 | Replay | UYARI | timestamp kontrolü yok |
| 4 | 2xx zamanlaması | GEÇTİ | commit sonrası 200 |
| 5 | Secret | GEÇTİ | Deno.env'den |

### Önerilen Düzeltmeler

1. raw body üzerinden HMAC + sabit-zamanlı karşılaştırma
2. processed_webhook_events tablosu + unique(event_id) ile dedupe

### İnsan Review Notu

Para/kimlik akışı — düzeltme uygulandıysa bile merge öncesi insan onayı zorunlu.
```

---

> **Tam örnek** (Lemon Squeezy webhook — sorunlu handler + düzeltmeler) → [examples/01-lemonsqueezy-webhook.md](examples/01-lemonsqueezy-webhook.md)

## Hızlı Kontrol Listesi

```
[ ] İmza RAW body üzerinden mi doğrulanıyor? (parse sonrası = ENGEL)
[ ] Karşılaştırma sabit-zamanlı mı? (=== timing attack)
[ ] event_id ile idempotency / dedupe var mı?
[ ] Replay için timestamp penceresi var mı?
[ ] 200 yalnızca commit sonrası mı dönülüyor?
[ ] Secret Deno.env'den mi? (hardcoded = ENGEL)
[ ] İmza doğrulaması DB yazımından ÖNCE mi?
[ ] OAuth: state CSRF kontrolü + token güvenli saklama var mı?
[ ] Düzeltme uygulandıysa insan review notu bırakıldı mı?
```
