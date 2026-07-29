---
name: analyze-functional
description: Projenin kullanıcı gözünden ne yaptığını koddan çıkarır — ekran haritası, buton→endpoint→tablo zinciri, akışlar, domain terim adayları. "Fonksiyonel analiz", "bu proje ne yapıyor" denildiğinde. Teknik borç için analyze-codebase kullan.
stack: [react, react-native, dotnet, supabase]
---

# Analyze Functional — Ürün Haritası

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Mevcut projenin **son kullanıcı gözünden** ne yaptığını çıkarır: hangi ekran var, hangi buton neyi tetikliyor, hangi endpoint'e gidiyor, hangi tabloyu değiştiriyor. **Kod gerçeğin kaynağıdır** — README/yorum iddiası değil, kodda kanıtlanabilen davranış haritalanır.

`PROJECT_ANALYSIS.md`'nin **§2 (Fonksiyonel Harita)** bölümünü yazar. [`analyze-project`](../analyze-project/SKILL.md) orkestrasyonunun 2. adımıdır; solo da çalışır.

Çıktının ana tüketicisi: **`grill-with-docs` Rol 1** — hiç analiz dökümanı olmayan legacy projede bu harita, `CONTEXT.md` + ADR üretiminin girdisi olur.

> **Ön koşul:** Mevcut kod tabanı. UI'sız (salt API) projede Faz 1-2 endpoint-odaklı daralır: "ekran" yerine "API tüketici yüzeyi" haritalanır.

---

## Girdi — Teknik Envanter

1. `PROJECT_ANALYSIS.md` §3 (Teknik Envanter) var mı? Sırayla bak: `docs/memory/99-meta/` → repo kökü.
   - **Varsa ve taze** (frontmatter `analyzed_commit` HEAD'e yakın): endpoint/tablo/sayfa listesini oradan al — yeniden tarama yapma.
   - **Varsa ama bayat:** listeyi ipucu olarak kullan; haritaladığın her zinciri güncel koddan doğrula.
   - **Yoksa:** iki seçenek sun — **(a)** önce `analyze-codebase` (önerilen: tam envanter + sağlık taraması), **(b)** hızlı mini-envanterle devam (sadece route + endpoint + tablo listesi; sağlık taraması yapma — o `analyze-codebase`'in işi).

---

## Faz 1 — Ekran / Sayfa Haritası (§2.1)

Her route/ekran için:

| Route | Amaç (1 cümle) | Gösterdiği veri | Erişim |
|---|---|---|---|
| `/orders` | Sipariş listesi + filtre | `useOrders()` → `GET /api/orders` → `orders` | authenticated |
| `/orders/:id` | Sipariş detayı + durum geçmişi | `useOrder(id)` → `GET /api/orders/{id}` | role: sales |

Kurallar:

- "Amaç" kolonunu **koddan çıkar** — component'in çektiği veri, render ettiği alanlar, sayfa başlığı. Emin olamadığında `(belirsiz)` işaretle, uydurma.
- Erişim kolonu: route guard / `[Authorize]` / RLS policy gerçekten var mı — iddia değil, kod referansı.

## Faz 2 — Aksiyon Zincirleri (§2.2)

Her ekrandaki kullanıcı aksiyonunu (buton, form submit, swipe, menü) uçtan uca zincirle:

```
"Kaydet" butonu (OrderForm.tsx:84)
  → useCreateOrder() mutation (useOrders.ts:31)
  → POST /api/orders (CreateOrderEndpoint.cs:12)
  → CreateOrderHandler (CreateOrder.cs:40)
  → INSERT orders, order_items
  → başarıda: /orders/:id yönlendirme + ['orders'] cache invalidation
```

Kurallar:

- Her halka **dosya referanslı**. Zincir koptuğunda dur ve kopuş noktasını işaretle.
- **Yarım/ölü feature tespiti:** buton var handler yok · endpoint var onu çağıran UI yok · tablo var hiç yazan yok → "yarım feature" listesine (§2.5'e taşınır).
- Supabase zinciri: component → hook → (`supabase.from()` doğrudan **veya** Edge Function) → tablo + geçerli RLS policy.
- Her CRUD butonunu tek tek zincirlemek zorunda değilsin — ekran başına **temsili + kritik** aksiyonlar yeter; atladıklarını "rutin CRUD" diye özetle.

## Faz 3 — Kullanıcı Akışları (§2.3)

Kodda **kanıtlanabilir** uçtan uca akışları çıkar (2-5 adet — iş değeri taşıyan yolculuklar):

- **Auth:** kayıt → login → token saklama → guard → logout
- **Ana iş akışı:** örn. sipariş oluştur → onayla → sevk et. Durum makinesi varsa geçişleri ve geçiş koşullarını listele.
- **Ödeme/webhook varsa:** checkout → redirect → webhook → durum güncelleme

Format: numaralı adımlar, her adım `ekran → aksiyon → sonuç`. İstersen mermaid sequence diyagramı ekle (zorunlu değil).

## Faz 4 — Domain Varlıkları & Terim Adayları (§2.4)

- Entity/tablo → iş kavramı eşlemesi: `Order (orders)` = müşteri siparişi.
- İlişkiler: 1-N / N-N + aggregate gözlemi ("OrderItem hiçbir yerde tek başına kullanılmıyor").
- **Glossary aday listesi:** kodda geçen domain terimleri; Türkçe/İngilizce ikiliklerini özellikle işaretle ("UI'da *Sevkiyat*, kodda *Shipment* — aynı kavram mı?"). Adayları §5 Memory Besleme'ye yaz — **`50-glossary/`'ye kendin yazma**, terim teyidi `grill-with-docs`'ta.

## Faz 5 — "Ne Yapıyor / Ne Yapmıyor" Özeti (§2.5)

- **İş yetenekleri** (kanıtlı liste): "Sipariş yönetimi (oluştur/iptal/sevk), stok takibi, e-posta bildirimi."
- **Yapmadıkları** (sık yanlış varsayılanlar): "Ödeme entegrasyonu YOK — checkout ekranı var ama endpoint bağlanmamış (yarım feature #2)."
- README vaadi ↔ kod gerçeği farkları.
- Belirsizler: "X davranışı statik analizle çözülemedi — çalıştırıp doğrulamak gerek."

---

## Çıktı

1. `PROJECT_ANALYSIS.md` **§2'yi yaz/güncelle** — idempotent; diğer bölümlere dokunma. Bölüm damgası: `> Analiz: <tarih> @ <kısa-sha> — analyze-functional`. Dosya hiç yoksa iskeletle oluştur (tam şablon: [`analyze-project`](../analyze-project/SKILL.md)); §3-4'ü `> henüz çalıştırılmadı — analyze-codebase` bırak.
2. Frontmatter güncelle: `analyzed_commit`, `last_reviewed`.
3. **§5 Memory Besleme'ye katkı:** glossary adayları + fonksiyonel ADR adayları (örn. "iptalde stok iadesi davranışı belirsiz — karar gerekli").
4. **Solo modda:** özet ver ve **öner** (çağırma): `grill-with-docs` Rol 1 (haritayı CONTEXT.md + ADR'ye resmileştir), `analyze-codebase` (sağlık taraması yoksa).

---

## Yapma

- ✗ Spekülasyon — kod kanıtı olmayan davranış iddiası; `(belirsiz)` yaz
- ✗ README/yorumlara güvenmek — her zinciri koddan doğrula
- ✗ Teknik borç / severity yorumu — `analyze-codebase`'in işi; gördüğün sorunu tek satır notla oraya havale et
- ✗ `50-glossary/`, `CONTEXT.md`, `20-modules/`'a yazmak — tek çıktı `PROJECT_ANALYSIS.md`; resmileştirme `grill-with-docs` / `memorize-module`'ün işi
- ✗ Uygulamayı çalıştırıp tıklamaya çalışmak — bu skill statik analizdir; çalıştırma gerektiren yerde "belirsiz" notu yeterli
- ✗ Her CRUD ekranına ayrı akış yazmak — akışlar uçtan uca iş yolculuklarıdır (2-5 adet)
- ✗ Kod değiştirmek — read-only

---

## Kontrol Listesi

- [ ] Envanter girdisi kontrol edildi (§3 taze mi / mini-envanter mi)
- [ ] §2.1: tüm route/ekranlar tabloda; belirsizler `(belirsiz)` işaretli
- [ ] §2.2: kritik aksiyon zincirleri dosya referanslı; yarım feature'lar listelendi
- [ ] §2.3: 2-5 kanıtlı kullanıcı akışı
- [ ] §2.4: varlık → iş kavramı eşlemesi + glossary adayları (§5'e)
- [ ] §2.5: yapıyor / yapmıyor / README farkları / belirsizler
- [ ] Bölüm damgası + frontmatter güncel
- [ ] `50-glossary/` veya `CONTEXT.md`'ye yazılmadı; hiçbir kaynak dosya değiştirilmedi
