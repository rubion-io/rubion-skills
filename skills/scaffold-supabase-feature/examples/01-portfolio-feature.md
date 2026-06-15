# Örnek: portfolio-publish Feature Scaffold

Kullanıcı kendi portföyünü yayınlayıp özel subdomain'de gösterebilecek. Frontend'den
basit CRUD yeterli değil — yayınlama anında Bunny.net'e asset kopyalama ve domain
kaydı gerekiyor → **Edge Function gerekli.**

## Sorulara Verilen Cevaplar

| Soru | Cevap |
|---|---|
| Feature adı | `portfolio-publish` |
| Tablo | `portfolios` (yeni) |
| Kolonlar | `user_id`, `slug text`, `title text`, `content jsonb`, `status text` |
| Edge Function? | **Evet** — yayınlama Bunny.net upload + domain kaydı tetikler (gizli anahtar) |
| Frontend | Okuma (liste) + mutation (publish) |
| Yetki | Satır sahibi (`auth.uid() = user_id`) |

---

## Üretilen Dosyalar

### 1. `supabase/migrations/20260612100000_portfolio_publish.sql`

```sql
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  content jsonb not null default '{}',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_portfolios_user on portfolios (user_id);

alter table portfolios enable row level security;

drop policy if exists "portfolios_select_owner" on portfolios;
create policy "portfolios_select_owner" on portfolios
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "portfolios_insert_owner" on portfolios;
create policy "portfolios_insert_owner" on portfolios
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "portfolios_update_owner" on portfolios;
create policy "portfolios_update_owner" on portfolios
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> **Not:** Yayınlanan portföyün public subdomain'den okunması gerekiyorsa, ayrı bir
> `for select to anon using (status = 'published')` policy'si **bilinçli** eklenmeli —
> bu bir HITL kararı, scaffold otomatik eklemez (yanlışlıkla draft sızdırma riski).

### 2. `supabase/functions/portfolio-publish/index.ts`

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod@4";
import { corsHeaders } from "../_shared/cors.ts";

const InputSchema = z.object({ portfolioId: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const parsed = InputSchema.safeParse(await req.json());
  if (!parsed.success) return json({ error: "invalid_input", issues: parsed.error.issues }, 400);

  // RLS sayesinde bu update yalnızca sahibinin satırını etkiler
  const { data, error } = await supabase
    .from("portfolios")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.portfolioId)
    .select()
    .single();

  if (error) return json({ error: error.message }, 400);

  // TODO: Bunny.net asset upload + custom domain kaydı (gizli anahtar burada)
  return json({ portfolio: data }, 200);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### 3. `src/features/portfolio/api.ts` + `types.ts`

TanStack Query: `usePortfolioList()` (select) + `usePublishPortfolio()` (edge function `invoke`).

### 4. Test iskeletleri — `it.todo` ile işaretli

---

## Sonraki Adımlar (scaffold sonrası)

```
1. supabase-migration-review → 20260612100000_portfolio_publish.sql
   (özellikle: public 'anon' okuma policy'si eklenecekse RLS gözden geçir)
2. tdd-edge-function → portfolio-publish handler + RLS pgTAP testi
3. Handler TODO'sunu doldur (Bunny.net + domain) → bu kısım gizli anahtar kullandığı için
   harden-webhook checklist'i secret yönetimi açısından da geçerli
```
