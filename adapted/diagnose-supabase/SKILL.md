---
adapted_from: mattpocock/skills/skills/engineering/diagnose
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-06-15
adaptation_level: heavy
name: diagnose-supabase
description: Supabase/Deno stack'inde disiplinli hata ayıklama: reproduce → minimize → hypothesize → instrument → fix. RLS denial (boş sonuç/403), Edge Function cold start, TanStack Query stale cache, Postgres yavaş sorgu desteğiyle. "Debug this", "neden boş dönüyor", "performance issue" denildiğinde. Yeni feature yazımı için kullanma.
stack: [supabase, postgresql, deno, rls, tanstack-query, react]
---

# Diagnose — Supabase / Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Zor hataları çözmek için disiplin. Bu skill `diagnose-dotnet`'in Supabase karşılığıdır — aynı fazlar, farklı araçlar. Bu stack'te en sık tuzak: **sessiz RLS denial** — hata yok, sadece boş sonuç.

Codebase'i incelerken domain glossary'i kullan; dokunduğun alandaki ADR'leri gözden geçir.

---

## Faz 1 — Feedback Loop Kur

**Bu skill'in özü budur.** Hızlı, deterministik, tekrar çalıştırılabilir bir pass/fail sinyalin varsa hatayı bulursun. Yoksa koda bakmak işe yaramaz. Bu aşamaya orantısız zaman ayır. **Agresif ol. Pes etme.**

### Feedback Loop Yöntemleri

1. **Failing pgTAP testi** — RLS denial / policy hatasını DB seviyesinde yakalar (`supabase test db`).
2. **Edge Function fetch script** — `.http` dosyası veya `curl`/`fetch` ile fonksiyonu tekrar oynat.
3. **`supabase start` + seed** — Lokal tam stack; gerçek Postgres + Auth + Functions.
4. **SQL repro** — Sorunlu sorguyu `psql` / Supabase SQL editöründe `set role` + JWT claim ile çalıştır.
5. **Playwright script** — UI'yı headless drive et; network + console + boş-liste durumunu assert et.
6. **Network HAR / PostHog session replay** — Production'da olanı yeniden izle.

### Supabase'e Özel Loop Araçları

```bash
supabase start                              # lokal stack
supabase functions serve <fn> --debug       # edge function + log
supabase logs --type edge-function          # canlı edge fonksiyon logu
supabase logs --type postgres               # DB logu (RLS denial dahil)
supabase db lint                            # migration/şema lint
```

```sql
-- RLS'i belirli kullanıcı gibi test et (SQL editör)
set local role authenticated;
set local request.jwt.claim.sub = '<user-uuid>';
select * from <table>;   -- boş mu? → policy eşleşmiyor
```

### Loop Kurulamazsa

Dur ve açıkça söyle. Denediklerini listele. Kullanıcıdan iste: (a) repro ortamına erişim, (b) captured artifact (HAR, edge log dump, sorgu + JWT claim), (c) geçici instrumentation izni. Loop olmadan Faz 2'ye geçme.

---

## Faz 2 — Reproduce Et

Loop'u çalıştır, hatanın oluştuğunu gözlemle.

- [ ] Kullanıcının tanımladığı hata oluşuyor — farklı bir hata değil
- [ ] Birden fazla çalıştırmada tekrarlanıyor
- [ ] Kesin semptom yakalandı (boş liste, 403, yanlış veri, yavaş timing)

> **Dikkat:** "Boş dönüyor" çoğu zaman hata mesajı vermez. Semptomu netleştir: HTTP status ne? Sorgu DB'de mi boş, yoksa frontend cache mi eski? Bu ayrım Faz 3'ü belirler.

---

## Faz 3 — Hipotez Üret

Test etmeden önce **3–5 sıralı, falsifiable hipotez**:

> "Eğer `<X>` sebepse, `<Y>`'yi değiştirmek hatayı giderecek / `<Z>` daha da kötüleştirecek."

Bu stack için tipik hipotez eksenleri:
- **RLS:** policy `auth.uid()` ile eşleşmiyor / JWT claim eksik / rol yanlış (`anon` vs `authenticated`)
- **Auth:** token süresi dolmuş / `Authorization` header iletilmiyor / `service_role` yanlışlıkla bypass ediyor
- **Cache:** TanStack Query stale data / yanlış `queryKey` / `invalidateQueries` çağrılmıyor
- **Edge:** cold start timeout / env var eksik / `_shared` import hatası
- **Veri:** sorgu doğru ama veri gerçekten yok / FK join sessizce satır eliyor

**Listeyi kullanıcıya göster, sonra test et.**

---

## Faz 4 — Instrument Et

Her probe bir hipotezle eşleşmeli. **Bir seferde tek değişken.**

### RLS Denial (En Sık)

RLS reddi **sessizdir** — `select` boş döner, `insert`/`update` 0 satır etkiler, hata yok.

```sql
-- 1) Policy gerçekten var mı ve hangi rol için?
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where tablename = '<table>';

-- 2) Aynı sorguyu service_role ile çalıştır (RLS bypass) — veri VAR mı?
--    service_role'de geliyor ama authenticated'de gelmiyorsa → RLS sorunu, veri değil
```

Frontend'den gelen isteğin JWT'sini kontrol et: `supabase.auth.getSession()` → `access_token`'ı [jwt.io]'da aç, `sub` claim'i policy'nin beklediği `user_id` ile eşleşiyor mu?

### Edge Function

```typescript
// Hipotezleri ayıran sınırlara hedefli log — her debug log'u etiketle
console.log("[DBG-a4f2]", { stage: "after-auth", uid: user?.id });
```

```bash
supabase logs --type edge-function | grep DBG-a4f2
```

Cold start / timeout şüphesi: ilk çağrı vs sonraki çağrı süresini ölç (`Date.now()` farkı log'la). Env var eksik mi: `console.log(Object.keys(Deno.env.toObject()))` (değerleri değil, anahtarları).

### TanStack Query Cache

React Query Devtools aç → ilgili `queryKey`'in durumuna bak: `stale` mı, `fetching` mi, hangi `data`? Mutation sonrası `invalidateQueries({ queryKey })` çağrılıyor mu? `queryKey` parametre değişiminde gerçekten değişiyor mu (yoksa eski cache döner)?

### Postgres Yavaş Sorgu

```sql
explain (analyze, buffers) select ...;
-- Seq Scan büyük tabloda → index eksik (migration ile ekle, CONCURRENTLY)
-- RLS qual her satırda subquery çalıştırıyorsa → policy'yi optimize et / index'le
```

Tam akış (RLS denial → boş sonuç teşhisi, adım adım) → **[examples/01-rls-empty-result.md](examples/01-rls-empty-result.md)**

---

## Faz 5 — Düzelt + Regression Test

Düzeltmeden **önce** regression testini yaz — doğru bir seam varsa.

- RLS hatası → **pgTAP** testi: "yetkili kullanıcı görür, yabancı görmez" (`tdd-edge-function`'daki pattern).
- Edge Function mantığı → handler testi (lokal `supabase`).
- Frontend cache → RTL + MSW ile invalidation testi.

1. Repro'yu failing teste çevir → 2. fail gör → 3. fix → 4. pass gör → 5. Faz 1 loop'unu tekrar çalıştır.

Doğru seam yoksa: bu bir bulgu, dokümante et.

---

## Faz 6 — Cleanup + Post-Mortem

- [ ] Orijinal repro artık oluşmuyor (Faz 1 loop tekrar)
- [ ] Regression test geçiyor (veya seam yokluğu dokümante edildi)
- [ ] Tüm `[DBG-...]` log'ları silindi (`grep -rn "DBG-" src/ supabase/functions/`)
- [ ] Throwaway harness / `.http` script'leri temizlendi
- [ ] Doğru çıkan hipotez commit/PR mesajında belirtildi

**Sonra sor:** Bu hatayı ne önleyebilirdi? Bir RLS policy testi eksikse → `tdd-edge-function` ile kapat. Tekrarlayan migration riski → `supabase-migration-review`'i pipeline'a koy. Mimari sorunsa → `improve-codebase-architecture`.
