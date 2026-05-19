<!-- rubion:baseline-start v1 -->
## Davranış Baseline (Rubion + Karpathy)

> Bu bölüm `rubion-skills` baseline'ından gelir — `templates/CLAUDE.md.baseline.md` ile senkronize.
> Marker'lar arası içerik üzerinde elle değişiklik yapma; sürüm yükselince otomatik regenere edilir.
> Override gerekiyorsa marker dışında ayrı bir bölüm aç.

### Hiyerarşi

Çatışma durumunda öncelik: **baseline → ADR → domain rules → skill operational**.
Yani bu 4 prensip ADR'lerden ve skill talimatlarından önce gelir.

### 1. Think Before Coding

Varsayım yapma, belirsizliği gizleme, tradeoff'ları sun.

**Somut tetikleyiciler:**
- **3+ dosya değiştirilecekse** veya **yeni klasör/namespace eklenecekse** → önce scope onayı al.
- **Birden fazla yorum mümkünse** hepsini sun; sessizce seçme.
- **ADR'de karar yoksa** teknik seçimi (DB sütun tipi, pattern, lib) yapmadan kullanıcıya sor.
- **"Şunu da temizleyeyim" hissi** → dur, kullanıcıya sor, ayrı PR öner.

### 2. Simplicity First

Minimum kod, spekülatif özellik yok.

**Somut tetikleyiciler:**
- **200 satır yazıyorsan** "50 satır mümkün mü?" diye sor.
- **Interface tek implementation için kurma** — gerekince çıkar.
- **Try-catch sadece beklenen exception için** — `Exception` yakalama, swallow etme.
- **Configurability "ileride lazım olabilir" diye eklenmez** — gerçek bir tüketici olduğunda eklenir.
- **DTO/Mapper/Service katmanı** sadece silme testi geçerse kalır (bkz. ADR-001 deep module).

### 3. Surgical Changes

Sadece istenen yere dokun. Komşu kodu "iyileştirme".

**Somut tetikleyiciler:**
- **Dokunmadığın dosyada formatting/comment değiştirme** — kendi diff'inin %100'ü scope içinde olmalı.
- **Existing style match et** — kendi tercihin değil; repo'nun convention'ı.
- **Dead code fark edersen söyle, silme** — orphan ise (senin değişikliğinin yarattığı) sil, değilse `mcp__ccd_session__spawn_task` ile ayrı task aç.
- **Imports'u sırala diye refactor etme** — sadece senin eklediğin/sildiğin import'ları düzelt.

### 4. Goal-Driven Execution

Doğrulanabilir başarı kriteri, loop until verified.

**Somut tetikleyiciler:**
- **Her görev için:** 1) Adımlar listele 2) Her adımın doğrulama komutu ne?
  ```
  1. PlaceOrderHandler yaz → dotnet build
  2. Test yaz → dotnet test --filter PlaceOrder
  3. Endpoint ekle → curl smoke test
  ```
- **"Make it work" yetersiz** — "X testi pass eder" diye somutla.
- **Kod yazdıktan sonra**: build + test çalıştır, çıktıyı raporla. "Bitti" deme — "build temiz, 14/14 test geçiyor" de.
- **TDD bağlamında**: testler önce, ihtiyaca uygun minimum kod sonra.

---

### Override / Skip Koşulları

Bu baseline aşağıdaki durumlarda geçici olarak devre dışı:

- **`prototype` skill'i aktifken** — "cila yok, throwaway" prototype'ın doğası.
- **Kullanıcı açıkça "hızlı dene, doğrulama atlayalım" derse** — bunu söylediği commit'te explicit olarak.
- **Acil hotfix (P0)** — Goal-Driven gevşer ama Surgical Changes daha da sıkılaşır.

Bu durumlar dışında: **4 prensip geçerli, hep.**
<!-- rubion:baseline-end -->
