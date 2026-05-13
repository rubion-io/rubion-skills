# Rubion Skills — Eval Suite

Skill description'larının trigger doğruluğunu ölçen test paketi.

Her skill için 20 query (10 pozitif + 10 negatif). Pozitif = skill tetiklenmeli, negatif = tetiklenmemeli.

---

## Kurulum

```bash
cd evals
npm install
```

`package.json` (otomatik oluşturulur `npm init -y` ile, sonra ekle):

```json
{
  "devDependencies": {
    "tsx": "^4.0.0",
    "@anthropic-ai/sdk": "^0.37.0",
    "glob": "^10.0.0"
  }
}
```

```bash
npm install --save-dev tsx @anthropic-ai/sdk glob
```

---

## Kullanım

```bash
# ANTHROPIC_API_KEY env var gerekli
export ANTHROPIC_API_KEY=sk-ant-...

# Tek bir skill eval et
npx tsx runner.ts --skill=tdd-dotnet

# Tüm skill'leri eval et
npx tsx runner.ts --all

# Yalnızca son commit'te değişen skill'leri eval et (CI için)
npx tsx runner.ts --changed-only

# Verbose çıktı (her query için detay)
npx tsx runner.ts --skill=tdd-dotnet --verbose
```

---

## Çıktı Örneği

```
Skill Eval — tdd-dotnet
────────────────────────────────────────
Positive queries (should trigger):
  ✓ ".NET Order handler için TDD yapalım"
  ✓ "MediatR command'ı için önce test yaz"
  ✗ "xUnit test nasıl çalışır?" → triggered: none  (FAIL)

Negative queries (should NOT trigger):
  ✓ "React component nasıl test edilir?" → triggered: tdd-react
  ✓ "Sipariş feature'ını VSA'ya çevir" → triggered: scaffold-vsa-feature
  ✗ "dotnet test komutu" → triggered: tdd-dotnet  (FAIL — should be none)

────────────────────────────────────────
tdd-dotnet: 18/20 (90%) — PASS ✓
```

```
Genel Özet
──────────────────────────────────────────
tdd-dotnet              18/20   90%  ✓
diagnose-dotnet         20/20  100%  ✓
scaffold-vsa-feature    17/20   85%  ✗  ← eşik altı
...
──────────────────────────────────────────
Toplam:  315/360  87.5%
PASS eşiği: 80% (her skill için)
Başarısız skill sayısı: 1
```

---

## Eşik

- Skill bazında `%80` accuracy → PASS
- Altında → CI fail, PR merge engellenir

---

## Eval Dosya Formatı

```json
{
  "skill": "tdd-dotnet",
  "description": "Description trigger doğruluğu için 20 query",
  "queries": [
    { "query": "...", "should_trigger": true },
    { "query": "...", "should_trigger": false }
  ]
}
```

Her dosyada **tam olarak 10 pozitif + 10 negatif** query olmalı.

---

## Nasıl Çalışır?

1. Runner, `evals/skills/*.json` dosyalarını okur.
2. Her skill'in `SKILL.md` frontmatter `description` alanını parse eder.
3. Her query için Anthropic API'ye istek atar: "Bu query için hangi skill tetiklenmeli?"
4. `should_trigger=true` ise doğru skill'in seçildiğini kontrol eder.
5. `should_trigger=false` ise farklı bir skill veya `none` seçildiğini kontrol eder.
6. Accuracy hesaplar, PASS/FAIL raporu verir.

Model: `claude-haiku-4-5` (hızlı + ucuz).
