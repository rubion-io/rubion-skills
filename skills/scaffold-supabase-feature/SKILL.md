---
name: scaffold-supabase-feature
description: Supabase stack'inde yeni bir feature'ı dikey dilim olarak iskeletler — SQL migration (tablo + RLS) + Deno Edge Function (JWT guard + Zod) + frontend TanStack Query hook + test dosyaları tek seferde. "Yeni feature ekle", "supabase feature iskelet", "scaffold" denildiğinde kullan.
stack: [supabase, deno, typescript, zod, react, tanstack-query]
---

# Scaffold Supabase Feature — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Bu skill, `scaffold-vsa-feature`'in Supabase karşılığıdır. MediatR/EF yerine bu stack'in katmanları: **SQL migration → Edge Function (Deno) → frontend data layer**. Katman katman değil, tek **dikey dilim** üretir.

## Ne Üretir?

```
supabase/migrations/
└── <timestamp>_<feature>.sql        ← tablo + index + RLS enable + owner policy

supabase/functions/<feature>/        (yalnızca DB-üstü mantık gerekiyorsa)
├── index.ts                         ← CORS + JWT guard + Zod + RLS-aware client
└── deno.json

src/features/<feature>/
├── api.ts                           ← TanStack Query hook
├── types.ts                         ← Zod şema + türetilmiş tip
└── api.test.ts                      ← test iskeleti
```

> **Karar:** Çoğu CRUD için Edge Function **gereksizdir** — RLS + `@supabase/supabase-js` doğrudan istemciden güvenli erişir. Edge Function sadece şunlarda gerekir: gizli anahtarla 3. parti çağrı (Resend, Bunny, ödeme), webhook, sunucu-tarafı iş mantığı, RLS ile ifade edilemeyen yetki. **Önce sor: bu feature Edge Function gerektiriyor mu?**

---

## Kullanım

Önce şunları sor (hepsini tek mesajda):

1. **Feature adı?** (kebab-case — örn: `portfolio-publish`, `course-enroll`, `contract-sign`)
2. **Tablo gerekiyor mu, adı ne?** (snake_case çoğul — örn: `portfolios`, `enrollments`)
3. **Temel kolonlar?** (örn: `user_id uuid`, `title text`, `status text`)
4. **Edge Function gerekli mi?** (yukarıdaki karar kutusu — gerekçesini de al)
5. **Frontend tarafı: okuma mı (query), yazma mı (mutation), ikisi mi?**
6. **Yetki:** satır sahibi mi erişmeli (`auth.uid() = user_id`), yoksa farklı bir kural mı?

Cevaplar gelince üretimi başlat. Varsayım yapıyorsan açıkça belirt. Üretilen migration için sonrasında **`supabase-migration-review`** öner; webhook içeriyorsa **`harden-webhook`** öner.

---

## Üretim Şablonları

### 1. Migration (tablo + RLS)

```sql
-- supabase/migrations/<timestamp>_<feature>.sql
create table if not exists <table> (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  <fields>,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_<table>_user on <table> (user_id);

alter table <table> enable row level security;

drop policy if exists "<table>_select_owner" on <table>;
create policy "<table>_select_owner" on <table>
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "<table>_insert_owner" on <table>;
create policy "<table>_insert_owner" on <table>
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "<table>_update_owner" on <table>;
create policy "<table>_update_owner" on <table>
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 2. Edge Function (gerekiyorsa)

```typescript
// supabase/functions/<feature>/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod@4";
import { corsHeaders } from "../_shared/cors.ts";

const InputSchema = z.object({
  // TODO: girdi alanları
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1) Auth guard — JWT zorunlu
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "unauthorized" }, 401);
  }

  // 2) RLS-aware client (kullanıcının JWT'siyle — RLS uygulanır)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  // 3) Input validation
  const parsed = InputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return json({ error: "invalid_input", issues: parsed.error.issues }, 400);
  }

  // 4) TODO: iş mantığı
  throw new Error("Not implemented");
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

> `_shared/cors.ts` yoksa oluştur: `export const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };`
>
> Servis-rolü gereken (RLS bypass) işlemler için `SUPABASE_SERVICE_ROLE_KEY` kullan — ama yalnızca yetki kontrolünü **elle** yaptıktan sonra.

### 3. Frontend Data Layer

```typescript
// src/features/<feature>/types.ts
import { z } from "zod";

export const <Feature>Schema = z.object({
  id: z.string().uuid(),
  // TODO: alanlar
});
export type <Feature> = z.infer<typeof <Feature>Schema>;
```

```typescript
// src/features/<feature>/api.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/supabase";
import { <Feature>Schema } from "./types";

// Okuma — RLS otomatik kullanıcının satırlarıyla sınırlar
export function use<Feature>List() {
  return useQuery({
    queryKey: ["<feature>"],
    queryFn: async () => {
      const { data, error } = await supabase.from("<table>").select("*");
      if (error) throw error;
      return <Feature>Schema.array().parse(data);
    },
  });
}

// Yazma
export function useCreate<Feature>() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: /* TODO */ unknown) => {
      const { data, error } = await supabase.from("<table>").insert(input).select().single();
      if (error) throw error;
      return <Feature>Schema.parse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["<feature>"] }),
  });
}
```

### 4. Test İskeleti

```typescript
// src/features/<feature>/api.test.ts
import { describe, it, expect } from "vitest";

describe("<feature> api", () => {
  it.todo("kullanıcı kendi <feature> satırlarını listeler");
  it.todo("başka kullanıcının satırı RLS ile görünmez");
});
```

Edge Function varsa testi `tdd-edge-function` ile yaz (RLS testi pgTAP, handler testi lokal `supabase start`).

---

## Kontrol Listesi (Üretim Sonrası)

```
[ ] Tablo + RLS enable + owner policy (select/insert/update) üretildi
[ ] insert/update policy'lerinde WITH CHECK var (user_id spoof engeli)
[ ] Edge Function kararı gerekçelendirildi (gereksizse üretilmedi)
[ ] Edge Function'da JWT guard + Zod validation var
[ ] Secret'lar Deno.env'den (hardcoded değil)
[ ] Frontend hook RLS'e güveniyor, query key invalidation doğru
[ ] Migration için supabase-migration-review çağrıldı
[ ] Webhook varsa harden-webhook çağrıldı
[ ] Alan adları domain glossary ile uyuşuyor
```
