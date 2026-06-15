---
name: setup-precommit-node
description: Node/TypeScript + Supabase projesine Husky + lint-staged tabanlı pre-commit hook kurar. Frontend için ESLint + Prettier + tsc, Edge Functions için deno fmt + deno lint, migration için supabase db lint her commit öncesi çalışır. "pre-commit kur", "husky ekle", "commit öncesi lint/format" denildiğinde kullan.
stack: [node, typescript, husky, lint-staged, deno, supabase]
---

# Setup Pre-Commit — Node / Supabase / Rubion

## Neden?

Pre-commit hook olmadan: format bozuk kod, tip hatası, lint ihlali commit'lenir; CI'da yakalanır (geç). Hook ile: commit anında frontend (ESLint/Prettier/tsc) + Edge Function (deno) + migration (supabase lint) garantilenir.

> Bu skill `setup-precommit-dotnet`'in JS/Deno karşılığıdır. Tek fark: bu repo iki dünyaya sahip — `src/` (Vite/React, ESLint+Prettier) ve `supabase/functions/` (Deno, `deno fmt`/`deno lint`). Path'e göre ayrı araç.

## Ön Koşullar

Konuşmadan önce doğrula:

- [ ] Repo kökünde `package.json` var mı?
- [ ] Paket yöneticisi ne? (`pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` — komutları ona göre yaz)
- [ ] Mevcut `.husky/` klasörü var mı? (çakışma riski)
- [ ] `supabase/functions/` var mı? (Deno adımı gerekli mi?)
- [ ] `deno` CLI erişilebilir mi? (`deno --version`) — Edge Function lint için

---

## Kurulum Adımları

### 1. Husky + lint-staged ekle

```bash
# (npm örneği — pnpm/yarn'da install komutunu uyarla)
npm install --save-dev husky lint-staged
npx husky init        # .husky/ oluşturur + package.json'a "prepare": "husky" ekler
```

`husky init` bir `.husky/pre-commit` oluşturur — içeriğini 3. adımdaki ile değiştir.

### 2. lint-staged yapılandırması

`package.json`'a ekle (veya `lint-staged.config.js` oluştur). **Path'e göre araç ayrımı kritik** — `src/` ESLint+Prettier, `supabase/functions/` Deno:

```jsonc
// package.json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix --max-warnings=0",
      "prettier --write"
    ],
    "src/**/*.{css,json,md}": "prettier --write",
    "supabase/functions/**/*.ts": [
      "deno fmt",
      "deno lint"
    ]
  }
}
```

> `src/` (ESLint/Prettier) ile `supabase/functions/` (deno fmt) **aynı dosyaya iki formatter uygulanmamalı** — glob'lar ayrı klasörleri hedeflediği için çakışma olmaz. Edge Function'ları ESLint glob'una sokma.

### 3. Pre-commit hook

`.husky/pre-commit` dosyasını yaz (Husky v9+ — `husky.sh` source satırı artık gerekmez):

```bash
echo "⏳ lint-staged (eslint + prettier + deno)..."
npx lint-staged || exit 1

echo "⏳ TypeScript tip kontrolü..."
npx tsc --noEmit || { echo "❌ Tip hataları var."; exit 1; }

# Migration eklendiyse SQL lint (opsiyonel — supabase CLI gerekli)
if git diff --cached --name-only | grep -q '^supabase/migrations/.*\.sql$'; then
  echo "⏳ supabase db lint..."
  supabase db lint || { echo "❌ Migration lint hatası."; exit 1; }
fi

echo "✅ Pre-commit geçti."
```

> **tsc neden lint-staged dışında?** `tsc --noEmit` tüm projeyi tipler — staged dosya başına çalıştırılamaz (tip hataları dosyalar arası yayılır). Bu yüzden hook'ta bir kez çalışır. Büyük projede yavaşsa "Yapılandırma Seçenekleri"ne bak.

### 4. ESLint + Prettier yoksa kur

```bash
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier
```

`.prettierrc` (yoksa):

```json
{ "semi": true, "singleQuote": false, "printWidth": 100, "endOfLine": "lf" }
```

Edge Functions için `deno.json` (yoksa, `supabase/functions/` altında):

```json
{ "fmt": { "lineWidth": 100 }, "lint": { "rules": { "tags": ["recommended"] } } }
```

### 5. Ekip için README notu

`README.md`'ye ekle (varsa güncelle):

```markdown
## Geliştirme Ortamı Kurulumu

Repo'yu klonladıktan sonra:

\`\`\`bash
npm install          # husky prepare script'i hook'ları kurar
\`\`\`

Edge Function lint için Deno gerekli: https://deno.land
```

---

## Doğrulama

```bash
git add .
git commit --allow-empty -m "test: hook çalışıyor mu?"
# → lint-staged + tsc çıktısını görmeli
```

---

## Yapılandırma Seçenekleri

### Değişen dosyalar için Vitest (opsiyonel, hook'a ekle)

```bash
# .husky/pre-commit içine — sadece etkilenen testleri çalıştır
npx vitest related --run $(git diff --cached --name-only --diff-filter=ACM | grep -E 'src/.*\.tsx?$') || exit 1
```

> Tüm süiti commit'te çalıştırma — yavaş. `vitest related` yalnızca değişen dosyalara bağlı testleri seçer. Tam süit CI'da.

### tsc yavaşsa — incremental

`tsconfig.json`'a `"incremental": true` ekle; `.tsbuildinfo`'yu `.gitignore`'a koy. İlk çalıştırma sonrası hook hızlanır.

### Sadece commit-msg formatı (Conventional Commits)

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
npx husky add .husky/commit-msg 'npx commitlint --edit $1'
```

---

## Sorun Giderme

| Sorun | Çözüm |
|---|---|
| `husky - command not found` | `npm install` tekrar çalıştır (prepare script hook'ları kurar) |
| ESLint Edge Function'da patlıyor | `supabase/functions/`'ı ESLint glob'undan çıkar — Deno globalleri ESLint'i şaşırtır |
| `deno: command not found` | Deno kur veya migration-only commit'lerde Deno adımını koşullu yap |
| `tsc` her commit'te yavaş | `incremental: true` + `.tsbuildinfo` veya tsc'yi pre-push'a taşı |
| Windows'ta hook çalışmıyor | Git Bash kullan; `.husky/*` dosyaları LF satır sonu olmalı |
| Prettier ↔ ESLint çatışıyor | `eslint-config-prettier`'ı ESLint config'in **son** extends'i yap |
