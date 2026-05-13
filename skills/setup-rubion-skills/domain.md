# Domain Docs: Layout

Bu projenin domain dökümanları nerede yaşar — `tdd-dotnet`, `diagnose-dotnet`, `grill-with-docs`, `improve-codebase-architecture` skill'leri buradan okur.

## Yerleşim

> **single-context** veya **multi-context** — kurulum sırasında seçilen.

### Single-context (çoğu Rubion projesi)

```
/
├── CONTEXT.md           ← domain sözlüğü + bounded context'ler + tech kararlar özet
├── docs/
│   ├── adr/             ← mimari kararlar
│   │   ├── 0001-...md
│   │   └── 0002-...md
│   └── prd/             ← opsiyonel — büyük özelliklerin PRD'leri (varsa)
└── src/
```

### Multi-context (monorepo / büyük mikroservis kümesi)

```
/
├── CONTEXT-MAP.md       ← her context'in nerede olduğunu listeler
├── docs/
│   └── adr/             ← sistem geneli kararlar
└── src/
    ├── Sales/
    │   ├── CONTEXT.md
    │   └── docs/adr/    ← Sales context'ine özel kararlar
    ├── Inventory/
    │   ├── CONTEXT.md
    │   └── docs/adr/
    └── Production/
        ├── CONTEXT.md
        └── docs/adr/
```

---

## Consumer Kuralları (Skill'ler için)

### `CONTEXT.md` Ne İçin Okunur?

- **Domain terimlerinin doğru kullanımı:** Test isimleri, handler isimleri, hata mesajları sözlüğe uymalı
- **Bounded context tespiti:** Yeni feature hangi context'e ait? Cross-context çağrı oluşuyor mu?
- **Tech karar özetleri:** Hangi auth, hangi DB, hangi mesajlaşma — re-discover etme

### `docs/adr/` Ne İçin Okunur?

- Mimari karar gerektiren bir öneri yapmadan önce, ilgili alanda ADR var mı bak
- Bir karara aykırı kod önermeden önce ADR'yi referans göster — "ADR-001 VSA varsayılan, ama bu durumda Clean Architecture seçilecekse..."

### `docs/prd/` Ne İçin Okunur? (Varsa)

- `to-issues` bir PRD'yi issue'lara böldüğünde, kaynak PRD repo'da `docs/prd/<feature>.md` olarak da tutulabilir (Jira/GitHub'a ek olarak)
- Sebebi: PR'lar PRD'yi referans gösterebilir, geçmiş kararlar koddan erişilebilir

---

## Skill Yönlendirmeleri

| Skill der ki | Yapılacak |
|---|---|
| "domain glossary'i kullan" | `CONTEXT.md` oku, terimleri al |
| "ADR'lere bak" | Multi-context ise hem global `docs/adr/` hem ilgili modülün `docs/adr/`'sini oku |
| "context'ler arası çağrı tespit et" | Multi-context'te her modülün `CONTEXT.md`'sindeki "ne dışarı açılır" bölümüne bak |
