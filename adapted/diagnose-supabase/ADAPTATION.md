# Adaptation Notes — diagnose-supabase

**Upstream:** mattpocock/skills/skills/engineering/diagnose
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** heavy

## Ne Değişmedi

- 6 aşamalı loop: Faz 1 (feedback loop) → Faz 2 (reproduce) → Faz 3 (hipotez) → Faz 4 (instrument) → Faz 5 (fix) → Faz 6 (cleanup)
- "Feedback loop kurmak skill'in özüdür" prensibi
- 3–5 falsifiable hipotez zorunluluğu
- "Bir seferde tek değişken" instrumentation kuralı
- Debug log etiketleme (`[DBG-...]`) ve cleanup
- Post-mortem / "ne önleyebilirdi?" sorusu

## Ne Değişti

### 1. Supabase Feedback Loop Araçları

`supabase start`, `supabase functions serve --debug`, `supabase logs --type edge-function|postgres`, pgTAP (`supabase test db`) — feedback loop kurma araçları olarak eklendi. `.http` / `fetch` script ile edge function replay.

### 2. RLS Denial — Sessiz Hata (Stack'in Birincil Tuzağı)

Bu stack'in en sık ve en sinsi hatası: RLS reddi hata vermez, sadece boş sonuç / 0 etkilenen satır döner. Faz 2'de "boş dönüyor" semptomunu netleştirme, Faz 4'te `pg_policies` inceleme + `service_role` ile bypass karşılaştırması + JWT claim doğrulama eklendi. Upstream'de bu kavram yok.

### 3. Auth / JWT Ekseni

Token süresi, `Authorization` header iletimi, `anon` vs `authenticated` rolü, `service_role` yanlış bypass — hipotez eksenleri olarak eklendi.

### 4. TanStack Query Cache

Frontend "eski veri" sorunları: stale cache, yanlış `queryKey`, eksik `invalidateQueries`. React Query Devtools ile teşhis.

### 5. Edge Function (Deno)

Cold start / timeout ölçümü, env var eksikliği tespiti (`Deno.env` anahtarları), `_shared` import hataları.

### 6. Postgres Query Plan

`EXPLAIN (ANALYZE, BUFFERS)` ile yavaş sorgu; RLS qual'inin satır başına subquery maliyeti; index eksikliği → `supabase-migration-review` köprüsü.

### 7. Dil

Türkçe. Kod örnekleri TypeScript/Deno ve SQL/RLS convention'larına uygun.

## Upstream'den Çıkarılanlar

- `scripts/hitl-loop.template.sh` referansı: Rubion'da `.http` dosyası veya `supabase functions serve` daha pratik.
- .NET-specific araçlar (`dotnet trace`, BenchmarkDotNet) — bunlar `diagnose-dotnet`'te kaldı.
