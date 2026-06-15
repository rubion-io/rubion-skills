# Örnek: Lemon Squeezy Webhook Güvenlik İncelemesi

**Dosya:** `supabase/functions/lemonsqueezy-webhook/index.ts`

## Mevcut Handler (sorunlu)

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

const secret = "whsec_lsq_8f2a1c";   // hardcoded

Deno.serve(async (req) => {
  const event = await req.json();                    // önce parse

  const sig = req.headers.get("X-Signature");
  const expected = await hmac(JSON.stringify(event), secret);  // parse'tan sonra imza
  if (sig !== expected) return new Response("no", { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (event.meta.event_name === "order_created") {
    await supabase.from("subscriptions").insert({
      user_email: event.data.attributes.user_email,
      status: "active",
    });
  }
  return new Response("ok", { status: 200 });
});
```

---

## Review Raporu

```
## Webhook Review: lemonsqueezy-webhook

### [ENGEL]

**Özet:** İmza parse sonrası hesaplanıyor (kırık), secret hardcoded, idempotency yok
— sahte event ve retry çift abonelik üretebilir.

### Bulgular

| # | Kontrol | Durum | Gerekçe |
|---|---|---|---|
| 1 | İmza (raw body) | ENGEL | req.json() ile parse sonrası JSON.stringify üzerinden imza — Lemon Squeezy'nin imzaladığı byte'larla eşleşmez, doğrulama güvenilmez |
| 2 | Sabit-zamanlı karşılaştırma | ENGEL | sig !== expected — timing attack |
| 3 | Idempotency | ENGEL | event_id dedupe yok — retry her seferinde yeni 'active' satır ekler |
| 4 | Replay | UYARI | timestamp kontrolü yok |
| 5 | 2xx zamanlaması | GEÇTİ | insert sonrası 200 |
| 6 | Secret | ENGEL | whsec_... kodda hardcoded, repo'da sızıyor |

### Önerilen Düzeltmeler

1. **Raw body + sabit-zamanlı imza:**
   ```typescript
   const raw = await req.text();                         // önce raw
   const sig = req.headers.get("X-Signature") ?? "";
   const expected = await hmacHex(raw, Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET")!);
   if (!timingSafeEqual(encoder.encode(sig), encoder.encode(expected))) {
     return json({ error: "invalid_signature" }, 401);
   }
   const event = JSON.parse(raw);                        // doğrulamadan SONRA parse
   ```

2. **Idempotency — dedupe tablosu:**
   ```typescript
   const { error: dupeErr } = await supabase
     .from("processed_webhook_events")
     .insert({ event_id: event.meta.event_id ?? event.data.id, provider: "lemonsqueezy" });
   if (dupeErr?.code === "23505") return json({ status: "already_processed" }, 200);
   ```
   Migration: `processed_webhook_events(event_id text, provider text, unique(provider, event_id))`.

3. **Secret env'den:** `supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=whsec_...`
   ve hardcoded değeri repo geçmişinden temizle (sızdıysa **rotate et**).

4. **Replay (öneri):** event timestamp'i varsa ±5 dk penceresi uygula.

### İnsan Review Notu

Ödeme akışı — düzeltmeler uygulandıktan sonra bile merge öncesi insan onayı zorunlu.
Secret zaten commit'lendiyse: rotate + git geçmişi temizliği ayrı görev.
```
