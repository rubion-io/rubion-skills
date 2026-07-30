---
name: design-mockup
description: Tasarımcı için UI mockup üretir — mevcut projede gerçek component'lerle dummy-data taslak sayfa (backend'e dokunmadan, design/* branch + /_design route) veya sıfırdan fikir için tek dosya HTML mockup + design token çıktısı. "Mockup yap", "tasarım taslağı", "bu ekran nasıl görünsün", "sayfa tasarla" denildiğinde kullan.
last_reviewed: 2026-07-30
stack: [react, react-native, expo, tailwind, shadcn, html]
---

# Design Mockup — Rubion

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı ile birlikte çalışır ama `prototype` gibi **cila muafiyeti** vardır: test yok, error handling yok, production kalite beklenmez. Çıktı bir **tasarım taslağıdır**, implementasyon değil.

Tasarımcının "bu nasıl görünmeli?" sorusunu yanıtlar. İki modu vardır; modu **kendisi tespit eder**, kullanıcıya sormaz:

| Durum | Mod | Çıktı |
|---|---|---|
| Repo'da mevcut frontend var (`src/frontend/`, veya `package.json`'da react/expo) | **Mod 1 — Proje İçi** | Projenin gerçek component'leriyle taslak sayfa/ekran, dummy data ile |
| Frontend yok / boş repo / "yeni fikir" | **Mod 2 — Greenfield** | Tek dosya HTML mockup + design token bloğu |

**Kesin kural (her iki modda):** Backend'e **asla** dokunulmaz. Data ihtiyacı hardcoded fixture ile karşılanır — `fetch`, TanStack Query, supabase client import'u yasak.

---

## Önce Sor

Mod ve platform tespitten sonra, tek mesajda:

1. **Ne tasarlanıyor?** (sayfa / ekran / akış — 1-2 cümle; varsa referans görsel veya benzer ürün)
2. **Fidelity:** lo-fi wireframe mi (gri kutular, hiyerarşi odaklı) hi-fi mi (renk + tipografi + gerçekçi içerik)? — varsayılan: **hi-fi**
3. **Kaç varyant?** — varsayılan: karar verilmiş tasarımsa **1**, keşif aşamasıysa **3**
4. *(Sadece Mod 2)* **Platform:** web mi mobil mi? Marka rengi/tercihi var mı? — yoksa nötr starter palet

> Mod 1'de platform sorulmaz — repo'dan bellidir (Vite → web, Expo → mobil).

---

## Mod 1 — Proje İçi Taslak

Mevcut projenin **gerçek tasarım sistemi** kullanılır: shadcn/ui component'leri, projenin tema token'ları, mevcut layout. Böylece mockup zaten ~%80 production kod olur; beğenilirse fixture'ı gerçek query ile değiştirmek yeter.

### Yerleşim

```
Branch:  design/<konu-kebab>              ← örn: design/order-detail-v2
Web:     src/_design/<taslak>/            ← features/ DEĞİL — taslak olduğu isimden belli
         ├── <Taslak>Page.tsx             ← örn: OrderDetailV2Page.tsx
         ├── fixtures.ts                  ← tüm dummy data burada
         └── NOTES.md                     ← varyant kararları + handoff notu
Route:   /_design/<taslak>                ← router'a eklenir, prod build'e girmez*
Mobil:   app/_design/<taslak>.tsx         ← expo-router; veya __DEV__ guard'lı screen
```

\* Web'de `/_design/*` route'ları `import.meta.env.DEV` guard'ı ile sarılır; RN'de `__DEV__`. Taslak yanlışlıkla prod'a sızamaz.

### Kurallar

1. **Gerçek component, sahte data.** `@/shared/components` ve shadcn'den ne varsa onu kullan; eksik pattern varsa taslak içinde inline yaz, `shared`'a **taşıma** (o iş promote aşamasının).
2. **Fixture disiplini:** component data'yı props ile alır, `fixtures.ts` default değer sağlar. Promote = fixture importunu hook ile değiştirmek.
3. **Varyantlar** aynı sayfada `?variant=a|b|c` query param'ı ile (bkz. `prototype` deseni) — üç ayrı dosya değil.
4. **Promote-or-delete:** karar verilince taslak ya `features/<modül>/`e taşınır (o noktada `tdd-react` devreye girer) ya branch ile birlikte silinir. `design/*` branch'i 2 haftadan uzun yaşamaz.

---

## Mod 2 — Greenfield HTML Mockup

Henüz proje yokken fikri görselleştirir. Vite/Expo **kurulmaz** — soru "nasıl görünmeli", "nasıl kodlanmalı" değil.

### Yerleşim ve format

```
_design/<fikir-kebab>/
├── mockup.html          ← tek dosya, tarayıcıda açılır, bağımlılık yok
├── design-tokens.md     ← palet + tipografi + spacing + radius
└── NOTES.md             ← varyant kararları, açık sorular
```

- **Tek HTML dosyası**, inline `<style>` — CDN dahil dış bağımlılık yok (offline da açılsın).
- CSS custom property'ler **shadcn token adlarıyla** tanımlanır (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--radius`...). Böylece mockup onaylandığında token'lar `scaffold-frontend-react`'in shadcn temasına kopyala-yapıştır geçer.
- **Mobil fikir:** aynı HTML, 375×812 device-frame içinde render edilir (status bar + home indicator çizgisi dahil — mobil hissi verir). Component eşlemesi RN primitive'lerine göre yazılır.
- **Varyantlar:** `?variant=a|b|c` — küçük bir JS switch'i `data-variant` attribute'unu set eder, CSS/DOM farkları ona bağlanır.

### Token çıktısı köprüdür

Fikir onaylanınca akış: `design-mockup` → `scaffold-frontend-react` (veya RN projesi) → token'lar temaya işlenir → taslak `tdd-react` / `tdd-react-native` ile gerçek component'lere dönüşür. `design-tokens.md` bu zincirin taşıyıcısıdır — mockup silinse bile token dosyası yaşar.

---

## Ortak Kurallar (her iki mod)

1. **Gerçekçi içerik (hi-fi'de):** "Lorem ipsum" ve "Ürün 1" yasak. Domain'e uygun Türkçe veri kullan — gerçek uzunlukta isimler, gerçekçi tutarlar/tarihler. Tasarım kararları içerik uzunluğuna bağlıdır; sahte kısa içerik yanıltır.
2. **Boş / uç durumları göster:** en az bir varyantta veya bölümde boş liste, uzun metin taşması ve loading iskeleti görünsün.
3. **Erişilebilirlik minimumu:** kontrast ≥ 4.5:1 (metin), dokunma hedefi ≥ 44px (mobil), görünür focus state, semantik başlık hiyerarşisi. Derin denetim gerekiyorsa `design:accessibility-review` plugin'ine yönlendir.
4. **Handoff notu zorunlu** (`NOTES.md`): 

```markdown
## Handoff — <taslak adı>
| Bölge | Component karşılığı | Not |
|---|---|---|
| Üst bar | shadcn `Card` + `Badge` | sticky, blur backdrop |
| Aksiyon | shadcn `Button variant=outline` | mobilde bottom bar'a iner |
Token: primary #.., radius .. | Açık sorular: [..]
```

5. **Karar kaydı:** varyant seçilince neden seçildiği `NOTES.md`'ye bir cümleyle yazılır; karar mimari nitelikteyse `scaffold-adr` öner.

---

## Sınırlar — Ne Zaman Başka Skill?

| İhtiyaç | Git |
|---|---|
| Etkileşim / gesture / native his sorusu ("bu akış elde nasıl duruyor?") | `prototype` (Expo veya Vite modu) |
| Mockup onaylandı, gerçek sayfa yazılacak | `tdd-react` / `tdd-react-native` |
| Proje yok, iskelet kurulacak | `scaffold-frontend-react` |
| Tasarım eleştirisi / a11y denetimi / handoff spec'i | `design:*` plugin skill'leri |

---

## Yapma

- ✗ Backend'e dokunmak, `fetch`/TanStack Query/supabase import etmek — data fixture'dır, taslak backend'siz açılabilmeli
- ✗ Mod 1 taslağını `features/` altına koymak veya `main`'e merge etmek — yeri `_design/` + `design/*` branch
- ✗ Greenfield fikir için Vite/Expo kurmak — tek HTML yeter; kod prototipi gerekiyorsa `prototype`
- ✗ Taslağa test, error handling, abstraction yazmak — bu tasarım, implementasyon değil
- ✗ Hi-fi mockup'ta lorem ipsum / "Ürün 1" — gerçekçi domain verisi şart
- ✗ Karar sonrası taslağı repo'da bırakmak — promote-or-delete; `design/*` branch 2 haftada kapanır
- ✗ Taslak sırasında `shared/`a component eklemek — paylaşıma terfi promote aşamasının işi

---

## Örnekler

- [Mod 1 — Mevcut projede sipariş detay sayfası taslağı](examples/01-inproject-order-detail.md)
- [Mod 2 — Greenfield mobil fikir: tek dosya HTML mockup](examples/02-greenfield-mobile-html.md)

---

## Kontrol Listesi

```
[ ] Mod tespit edildi (repo'da frontend var mı bakıldı) ve kullanıcıya söylendi
[ ] Fidelity + varyant sayısı soruldu
[ ] Backend'e sıfır dokunuş — hiçbir fetch/query import'u yok
[ ] Mod 1: design/* branch + src/_design/ (veya app/_design/) + DEV guard
[ ] Mod 2: tek HTML, dış bağımlılık yok, shadcn adlarıyla token'lar
[ ] Gerçekçi Türkçe içerik + boş/uzun/loading durumları görünür
[ ] A11y minimumu: kontrast, touch target, focus
[ ] NOTES.md: handoff tablosu (component eşlemesi) + varyant kararı
[ ] Mod 2: design-tokens.md üretildi
[ ] Promote-or-delete hatırlatıldı
```
