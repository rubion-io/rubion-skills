---
name: tubitak-1507-document
description: TÜBİTAK 1507 KOBİ Ar-Ge Başlangıç Destek Programı başvurusu için teknik bölümleri üretir. Yenilikçilik analizi, Ar-Ge faaliyetleri tanımı, iş paketi planı ve teknolojik belirsizlik ifadesi. "1507 başvurusu yaz", "TÜBİTAK dokümanı üret", "Ar-Ge bölümü" denildiğinde kullan.
stack: []
---

# TÜBİTAK 1507 Teknik Bölüm Üreticisi — Rubion

## Önce Topla

Başlamadan şu bilgileri sor (hepsi gerekli):

1. **Proje başlığı** — kısa, eyleme dayalı (örn: "AI-Destekli Üretim Planlama Sistemi")
2. **Problem tanımı** — müşteri/sektör hangi problemi yaşıyor?
3. **Çözüm fikri** — ne yapılacak, teknik özü nedir?
4. **Neden Ar-Ge?** — neden bu bir Ar-Ge projesidir, neden mevcut yöntemler yetmez?
5. **Teknolojik belirsizlikler** — çözülmesi garanti olmayan teknik sorular neler?
6. **Hedef çıktı** — sonunda ne teslim edilecek? (yazılım, algoritma, prototip, yayın)
7. **Süre** — kaç ay? (tipik: 12–24 ay)
8. **Ekip** — AR-GE personeli listesi (unvan + uzmanlık kısa)

---

## Bölüm 1 — Projenin Amacı ve Kapsamı

**Şablon:**

```
[Proje Başlığı] projesi, [sektör/alan]'daki [problem] sorununa çözüm geliştirmeyi amaçlamaktadır.

Mevcut durumda [rakip yaklaşım/yaygın yöntem] kullanılmakta, ancak [kısıt/yetersizlik] nedeniyle
[somut olumsuz etki: verimlilik kaybı, hata oranı, maliyet vb.] yaşanmaktadır.

Bu proje kapsamında [teknik çözüm özeti] geliştirilecektir. Proje çıktısı [somut teslimable:
yazılım modülü, algoritma, prototip sistemi] olacaktır.
```

**Rubion örneği:**

```
"AI-Destekli Talep Tahmini ve Üretim Planlama Sistemi" projesi, orta ölçekli imalat
işletmelerindeki üretim planlama süreçlerini yapay zeka ile otomatize etmeyi amaçlamaktadır.

Mevcut durumda üretim planlama, ERP sistemlerindeki statik kural tabanlı algoritmalar veya
manuel spreadsheet süreçleriyle yürütülmekte; değişken talep koşullarına uyum sağlayamamakta
ve ortalama %23 stok fazlalığına yol açmaktadır.

Bu proje kapsamında makine öğrenmesi tabanlı talep tahmini modülü ve kısıt programlama ile
desteklenmiş dinamik planlama motoru geliştirilecektir.
```

---

## Bölüm 2 — Özgün Değer ve Yenilikçilik Analizi

**Önemli:** Bu bölüm TÜBİTAK değerlendirmesinde en kritik kısımdır. "Piyasada mevcut değil" demek yetmez — neden mevcut değil, araştırıldı mı, somut kanıt?

**Yapı:**

### 2.1 Literatür Taraması Özeti

```
[Konu alanında] yapılan araştırmalar incelendiğinde [X, Y, Z] çalışmaları bu alanda
temel referans olarak öne çıkmaktadır. Ancak mevcut akademik çalışmalar [kısıt/boşluk]
nedeniyle Türk imalat sektörünün [özellik] koşullarına doğrudan uygulanabilir değildir.
```

### 2.2 Ticari Ürün Analizi

| Ürün/Çözüm | Sağlayıcı | Yetersizliği |
|---|---|---|
| [Ürün A] | [Firma] | [Neden yetmez: maliyet/uyarlama/kısıt] |
| [Ürün B] | [Firma] | [Neden yetmez] |

### 2.3 Özgün Katkı

```
Bu projenin teknik özgünlüğü şu noktalarda somutlaşmaktadır:

1. [Özgün teknik katkı 1]: Mevcut yöntemlerde [eksiklik], bu projede [yeni yaklaşım]
2. [Özgün teknik katkı 2]: ...
3. [Özgün teknik katkı 3]: ...
```

---

## Bölüm 3 — Ar-Ge Faaliyetleri ve Teknolojik Belirsizlikler

**TÜBİTAK'ın Ar-Ge tanımı:** Bilimsel ve teknolojik belirsizlik içeren, sonucu önceden tam olarak bilinemeyen, sistematik çalışmalar.

**Her faaliyet için şu formatı kullan:**

```
### Faaliyet [N]: [Başlık]

**Teknik içerik:** [Ne yapılacak, hangi yöntem, hangi teknoloji]

**Teknolojik belirsizlik:** [Sonucu garanti olmayan teknik soru]
Örn: "LSTM ve Transformer mimarilerinden hangisinin [bu veri tipi] için daha iyi
genelleme yapacağı başlangıçta bilinmemektedir."

**Başarı kriteri:** [Ölçülebilir hedef]
Örn: "Test setinde MAE ≤ %8, F1-score ≥ 0.85"

**Risk:** [Başarısızlık durumunda alternatif]
```

**Rubion örnek faaliyetleri:**

```
### Faaliyet 1: Talep Tahmini Model Araştırması ve Geliştirme

Teknik içerik: Zaman serisi tahmin için LSTM, Transformer (TFT) ve Prophet modelleri
Türk imalat sektörü verilerine uyarlanacak; hiperparametre optimizasyonu ve ensemble
yaklaşımları denenecektir.

Teknolojik belirsizlik: Mevsimsellik ve düzensiz tedarik kesintileri içeren endüstriyel
veri setlerinde hangi model mimarisinin en düşük hata oranını ürettiği başlangıçta
bilinmemektedir.

Başarı kriteri: 12 haftalık tahmin ufkunda MAPE ≤ %10 (mevcut kural tabanlı sisteme
göre en az %30 iyileştirme)

Risk: Derin öğrenme modelleri hedefi karşılamazsa, gradient boosting (XGBoost/LightGBM)
ile hibrit yaklaşıma geçilecektir.
```

---

## Bölüm 4 — İş Paketi Planı

```markdown
| İP | Başlık | Süre | Çıktı |
|---|---|---|---|
| İP-1 | Veri toplama ve ön işleme | Ay 1–3 | Temizlenmiş veri seti, veri sözlüğü |
| İP-2 | Model araştırması ve geliştirme | Ay 2–8 | Eğitilmiş model, karşılaştırma raporu |
| İP-3 | Sistem entegrasyonu | Ay 7–12 | Entegre prototip |
| İP-4 | Test ve doğrulama | Ay 10–14 | Test raporu, performans değerlendirmesi |
| İP-5 | Raporlama ve yayın | Ay 13–18 | Proje sonuç raporu, makale taslağı |
```

---

## Bölüm 5 — Proje Ekibi ve Yetkinlikler

```
| Unvan | Katkı | Ar-Ge Süresi (ay-kişi) |
|---|---|---|
| Ar-Ge Mühendisi (Kıdemli) | Model geliştirme, mimari | 14 |
| Ar-Ge Mühendisi (Jr.) | Veri işleme, test | 12 |
| Proje Yöneticisi | Koordinasyon, raporlama | 6 |
```

---

## Bölüm 6 — Bütçe Gerekçesi (İpuçları)

TÜBİTAK 1507'de kabul edilen kalemler:
- **Personel giderleri:** Ar-Ge personelinin brüt maaşları (oransal)
- **Seyahat:** Konferans, ziyaret, eğitim
- **Alet-teçhizat:** GPU sunucu, lisans (doğrudan Ar-Ge için)
- **Hizmet alımı:** Danışmanlık, test laboratuvarı
- **Genel giderler:** Personel giderlerinin %20'si (sabit oran)

**KURAL:** Bütçe kalemleri Ar-Ge faaliyetleriyle 1:1 bağlantılı olmalı. "Ofis mobilyası" gibi genel giderler reddedilir.

---

## Sıkça Yapılan Hatalar

```
✗ "Bu alanda çalışma yok" → kanıtla (literatür listesi ver)
✗ "Yazılım geliştireceğiz" → Ar-Ge = araştırma; "algoritma araştırması + prototip" yaz
✗ Vague başarı kriterleri → her faaliyet için ölçülebilir hedef
✗ Teknolojik belirsizlik yok → "sonucu bilmiyoruz" açıkça ifade et
✗ Ekip CV'si yokken bütçe → personel yetkinliği ve bütçe birlikte değerlendirilir
```
