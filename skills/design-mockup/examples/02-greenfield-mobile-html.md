# Örnek — Mod 2: Greenfield mobil fikir, tek dosya HTML mockup

**Senaryo:** Boş klasörde tasarımcı diyor ki: *"Saha servis teknisyenleri için bir mobil app fikrimiz var — teknisyen günlük iş emirlerini görsün, tamamlasın. Nasıl görünmeli, 3 varyant istiyorum."*

**Tespit:** Repo'da frontend yok → **Mod 2**. Platform soruldu → mobil. Fidelity → hi-fi. Marka rengi yok → nötr starter palet.

---

## 1. Klasör

```
_design/saha-servis-app/
├── mockup.html
├── design-tokens.md
└── NOTES.md
```

## 2. mockup.html — device frame + shadcn adlı token'lar + varyant switch'i

Tek dosya, dış bağımlılık yok. Kısaltılmış iskelet:

```html
<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>Saha Servis — mockup</title>
<style>
  /* ===== Design tokens — shadcn adlarıyla; onaylanınca temaya kopyalanır ===== */
  :root {
    --background: #f8fafc;
    --foreground: #0f172a;
    --card: #ffffff;
    --primary: #1d4ed8;          /* nötr starter — marka rengi gelince değişir */
    --primary-foreground: #ffffff;
    --muted: #f1f5f9;
    --muted-foreground: #64748b;
    --border: #e2e8f0;
    --destructive: #dc2626;
    --radius: 12px;
    --font-sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  body { margin:0; display:flex; gap:32px; justify-content:center; padding:24px;
         background:#e5e7eb; font-family:var(--font-sans); }

  /* ===== Device frame: 375×812, status bar + home indicator ===== */
  .device { width:375px; height:812px; background:var(--background);
            border-radius:40px; border:8px solid #111; overflow:hidden;
            display:flex; flex-direction:column; }
  .statusbar { height:44px; display:flex; justify-content:space-between;
               align-items:center; padding:0 24px; font-size:13px; font-weight:600; }
  .home { height:24px; display:flex; justify-content:center; align-items:center; }
  .home::after { content:""; width:130px; height:5px; border-radius:3px; background:#111; }

  .screen { flex:1; overflow-y:auto; padding:16px; }
  .card { background:var(--card); border:1px solid var(--border);
          border-radius:var(--radius); padding:16px; margin-bottom:12px; }
  .btn { display:flex; justify-content:center; align-items:center; min-height:48px; /* ≥44px touch target */
         border-radius:var(--radius); background:var(--primary); color:var(--primary-foreground);
         font-weight:600; }
  .badge { font-size:12px; padding:2px 10px; border-radius:999px;
           background:var(--muted); color:var(--muted-foreground); }

  /* ===== Varyant farkları data-variant ile ===== */
  [data-variant="a"] .bottombar { display:none; }            /* a: liste odaklı */
  [data-variant="b"] .screen   { padding-bottom:80px; }      /* b: alt aksiyon barı */
  [data-variant="c"] .card     { display:flex; gap:12px; }   /* c: harita + kompakt kart */
</style>
</head>
<body data-variant="a">
<div class="device">
  <div class="statusbar"><span>09:41</span><span>▮▮▮ 🔋</span></div>
  <div class="screen">
    <h1 style="font-size:22px;margin:4px 0 16px">Bugünkü İşler <span class="badge">4 iş emri</span></h1>

    <!-- Gerçekçi içerik: uzun adres, gerçek saat, öncelik -->
    <div class="card">
      <div style="display:flex;justify-content:space-between">
        <strong>İE-2026-0342 · Klima arıza</strong>
        <span class="badge" style="background:#fef2f2;color:var(--destructive)">Acil</span>
      </div>
      <p style="color:var(--muted-foreground);font-size:14px;margin:8px 0">
        Konyaaltı Cad. Liman Mah. 47. Sk. No:12/B, Antalya — Migros şube deposu</p>
      <div class="btn">İşe Başla</div>
    </div>

    <!-- Boş durum da aynı dosyada görünür -->
    <div class="card" style="text-align:center;color:var(--muted-foreground);padding:32px">
      Yarın için planlanmış iş emri yok.
    </div>
  </div>
  <div class="bottombar" style="padding:12px 16px;border-top:1px solid var(--border)">
    <div class="btn">Günü Kapat</div>
  </div>
  <div class="home"></div>
</div>
<script>
  // ?variant=a|b|c
  const v = new URLSearchParams(location.search).get("variant") ?? "a";
  document.body.dataset.variant = v;
</script>
</body>
</html>
```

Tasarımcı `mockup.html?variant=a` / `b` / `c` arasında gezer; dosya offline da açılır.

## 3. design-tokens.md — köprü çıktısı

```markdown
# Saha Servis — Design Tokens (taslak v1, 2026-07-30)
| Token | Değer | Not |
|---|---|---|
| primary | #1d4ed8 | nötr starter — marka onayı bekliyor |
| background / card | #f8fafc / #ffffff | |
| destructive | #dc2626 | "Acil" rozeti |
| radius | 12px | kart + buton |
| font | system-ui | RN'de platform default |
Tipografi: başlık 22/600 · gövde 14/400 · rozet 12/500
Spacing: 4-8-12-16 ölçeği · dokunma hedefi min 48px
```

## 4. NOTES.md — handoff (RN eşlemesiyle)

```markdown
## Handoff — saha-servis-app
| Bölge | RN karşılığı | Not |
|---|---|---|
| İş emri kartı | `Pressable` + custom Card | Expo; shadow yerine border |
| Acil rozeti | custom Badge | renk token: destructive |
| İşe Başla | `Pressable` 48px | haptic feedback (promote'ta) |
| Liste | `FlatList` | boş durum component'i dahil |

Karar (2026-07-30): **Variant B** — alt "Günü Kapat" barı; teknisyen eldivenli, ulaşılabilirlik kritik.
Açık soru: offline durumda iş emri tamamlama kuyruğa mı alınsın? → prototype (Expo) ile sınanmalı.
```

## 5. Sonuç ve zincir

Fikir onaylandı → Expo projesi kurulur, `design-tokens.md` temaya işlenir, ekranlar `tdd-react-native` ile yazılır. Gesture/offline soruları HTML'in sınırı dışında → `prototype` Expo modu. `_design/` klasörü karar sonrası silinir; **yaşayan tek dosya `design-tokens.md`**dir (yeni repo'ya taşınır).
