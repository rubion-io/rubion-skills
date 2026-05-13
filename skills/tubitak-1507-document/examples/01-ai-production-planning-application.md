# Örnek: AI-Destekli Üretim Planlama Sistemi — TÜBİTAK 1507 Başvurusu

**Başvuru sahibi:** Milagro Yazılım A.Ş. _(hayali şirket — kendi bilgilerinizle değiştirin)_
**Program:** TÜBİTAK 1507 KOBİ Ar-Ge Başlangıç Destek Programı
**Proje süresi:** 18 ay
**Bu dosya:** Teknik bölümlerin doldurulmuş örneği. Doğrudan kopyalamayın — kendi projenize adapte edin.

---

## Bölüm 1 — Projenin Amacı ve Kapsamı

### 1.1 Problem Tanımı

Orta ölçekli imalat işletmelerinde üretim planlama süreci kritik bir operasyonel darboğaz oluşturmaktadır. Mevcut durumda bu süreç iki yöntemden biriyle yürütülmektedir:

**(a) ERP tabanlı kural motoru:** SAP PP, Oracle Manufacturing gibi ERP sistemlerinin statik planlama modülleri, önceden tanımlanmış üretim kurallarını ve sabit emniyet stok seviyelerini kullanır. Bu yaklaşım belirli talep kararlılığına sahip ortamlarda işlevseldir; ancak mevsimsel dalgalanma, hammadde temin süresi değişkenliği ve ani talep kesintileri karşısında %18–27 aralığında stok fazlalığına veya %12–19 aralığında üretim yetersizliğine yol açmaktadır (Kagermann ve ark., 2013; Wang ve ark., 2021).

**(b) Manuel spreadsheet planlaması:** KOBİ ölçeğindeki işletmelerin %63'ünde (KOSGEB 2023 anketi) planlama hâlâ Excel tabanlıdır. Uzman plancının tacit bilgisine dayalı bu süreç; ölçeklenememekte, personel değişiminde kurumsal bilgi kaybına neden olmakta ve gerçek zamanlı veri entegrasyonundan yoksundur.

**Somut etki:** Türkiye imalat sektöründe 2022 yılında stok fazlalığı kaynaklı sermaye bağlılığının toplam 47 Milyar TL olduğu tahmin edilmektedir (TÜİK İmalat Sanayi İstatistikleri, 2023).

### 1.2 Çözüm Yaklaşımı

Bu proje kapsamında makine öğrenmesi tabanlı **talep tahmini modülü** ve kısıt programlama ile desteklenmiş **dinamik üretim planlama motoru** geliştirilecektir.

Sistem iki ana bileşenden oluşacaktır:

1. **Tahmin Motoru:** Geçmiş satış verileri, sipariş backlog'u, mevsimsel endeksler ve harici sinyal kaynakları (hammadde spot fiyatı, hava durumu, ekonomik endeksler) bir araya getirilerek çok değişkenli zaman serisi tahmin modeli oluşturulacaktır.

2. **Optimizasyon Motoru:** Tahmin çıktısı, üretim kapasitesi, makine hazırlık süreleri ve tedarik kısıtları birlikte ele alınarak kısıt programlama (Constraint Programming) ve sezgisel arama algoritmaları ile üretim planı optimize edilecektir.

### 1.3 Kapsam Sınırları

- **Kapsam içi:** Tek fabrika, çok ürün ortamı; envanter yönetimi entegrasyonu; ERP veri bağlayıcısı (SAP/Oracle read-only)
- **Kapsam dışı:** Tedarik zinciri optimizasyonu, çok fabrika koordinasyonu, satınalma otomasyonu (sonraki fazlara bırakıldı)

### 1.4 Proje Çıktıları

| Çıktı | Tür | Teslim Ayı |
|---|---|---|
| Talep Tahmini Modeli (v1) | Yazılım modülü + teknik rapor | Ay 8 |
| Üretim Planlama Motoru (v1) | Yazılım modülü + teknik rapor | Ay 13 |
| Entegre Prototip Sistem | Çalışan yazılım | Ay 15 |
| Pilot Uygulama Raporu | Test + doğrulama raporu | Ay 17 |
| Proje Sonuç Raporu | Teknik rapor | Ay 18 |
| Makale Taslağı | Akademik yayın taslağı | Ay 18 |

---

## Bölüm 2 — Özgün Değer ve Yenilikçilik Analizi

### 2.1 Literatür Taraması

Talep tahmini ve üretim planlaması literatürü incelendiğinde şu temel çalışmalar öne çıkmaktadır:

**Makine öğrenmesi tabanlı talep tahmini:**
- **Makridakis ve ark. (2018)** — M4 yarışması bulguları: klasik istatistiksel yöntemler (ARIMA, ETS) kısa vadede ML modellerine yakın performans gösterirken 12+ hafta ufkunda derin öğrenme üstünlük sağlamaktadır.
- **Salinas ve ark. (2020)** — DeepAR: olasılıksal tahmin için RNN tabanlı model; çok ürün ortamlarında transfer learning ile performans artışı göstermektedir.
- **Zhou ve ark. (2021)** — Informer: Transformer tabanlı uzun dizi tahmini için dikkat mekanizması; 500+ zaman adımı ufkunda LSTM'e göre %34 daha düşük MSE.

**Üretim planlama ve optimizasyon:**
- **Applegate ve ark. (2006)** — CP-SAT çözücü temelleri; kısıt programlama NP-zor kombinatoryal problemlerde keşifsel algoritmalardan üstün sonuç verir.
- **Wang ve ark. (2021)** — Hibrit ML+CP yaklaşımı: tahmin belirsizliği optimizasyon kısıtına alındığında plan güvenilirliği %22 artmaktadır.

**Mevcut araştırmaların ortak sınırlılıkları:**
- Çalışmaların %80'i perakende veya e-ticaret veri setleri kullanmaktadır; imalat sektörüne özgü kısıtlar (makine hazırlık süreleri, lot büyüklüğü kısıtları, tedarikçi teslim süresi belirsizliği) ihmal edilmektedir.
- Türkiye imalat sektörüne uyarlanmış, yerel tedarik zinciri dinamiklerini modelleyen çalışma bulunmamaktadır.
- Tahmin ve optimizasyon katmanlarının uçtan uca entegre edildiği yerli yazılım mevcut değildir.

### 2.2 Mevcut Ticari Ürün Analizi

| Çözüm | Sağlayıcı | Güçlü Yönü | Yetersizliği |
|---|---|---|---|
| SAP IBP (Integrated Business Planning) | SAP SE | Kurumsal entegrasyon | KOBİ bütçesiyle erişilmez (≥$150K/yıl lisans); yerelleştirme Türkiye'ye özgü değil |
| Oracle Demand Management Cloud | Oracle | Kullanıcı arayüzü olgunluğu | Benzer maliyet; kısıt programlama modülü eklenti ile geliyor |
| Anaplan | Anaplan Inc. | Esneklik | ML modeli özelleştirme imkânsız; kara kutu tahmin |
| o9 Solutions | o9 Solutions | Yapay zeka vurgusu | Kaynak gereksinimleri KOBİ ölçeğini aşıyor; API açık değil |
| Homegrown Excel + VBA | — | Sıfır lisans maliyeti | Gerçek zamanlı veri entegrasyonu yok; ölçeklenmez |

**Sonuç:** KOBİ ölçeğinde uygulanabilir, Türkiye imalat sektörüne özgü kısıtları modelleyen, açık API sunarak ERP entegrasyonu sağlayan ve ML tahminini CP optimizasyonuyla birleştiren yerli bir çözüm piyasada bulunmamaktadır.

### 2.3 Özgün Teknik Katkılar

Bu projenin teknik özgünlüğü üç noktada somutlaşmaktadır:

**Katkı 1 — Türkiye imalat sektörüne özgü özellik mühendisliği:**
Mevcut çalışmalar hammadde temin süresi belirsizliğini sabit varsayar. Bu projede Türkiye'ye özgü tedarik dinamikleri (döviz kuru oynaklığı, Enerji Borsası spot fiyatları, nakliye süresi değişkenliği) modele dış sinyal olarak entegre edilecek, mevsimsel bayram-tatil etkisi Türkiye takvimi ile modellenecektir.

**Katkı 2 — Belirsizlik-farkındı planlama (Uncertainty-aware scheduling):**
Tahmin modelinin çıktısı, nokta tahmini yerine olasılık dağılımı (P10/P50/P90 senaryo bandı) olarak üretim planlama motoruna aktarılacaktır. CP-SAT çözücüsüne eklenen stokastik kısıt seti, plan güvenilirliğini belirsizlik bütçesiyle dengeler. Bu bütünleşik yaklaşım literatürde KOBİ ölçekli uygulamalarda denenmemiştir.

**Katkı 3 — Açık REST API mimarisi:**
Geliştirilen sistem, farklı ERP sistemlerine (SAP, Logo, Mikro) bağlanabilen standart REST API sunacaktır. Hâlihazırda piyasadaki çözümler kapalı ekosistem veya yalnızca belirli ERP entegrasyonu sunmaktadır.

---

## Bölüm 3 — Ar-Ge Faaliyetleri ve Teknolojik Belirsizlikler

### Faaliyet 1: Veri Altyapısı ve Özellik Mühendisliği Araştırması

**Teknik içerik:**
Pilot fabrikadan tarihsel üretim, sipariş, stok ve tedarikçi veri setleri toplanacaktır. Eksik veri impütasyon stratejileri (MICE, KNN, interpolasyon) karşılaştırmalı olarak test edilecektir. Türkiye'ye özgü dış sinyal kaynakları (TCMB döviz kuru, Türkiye İhracatçılar Meclisi endeksleri, EPDK enerji fiyatları) API entegrasyonuyla sisteme alınacaktır. Zaman serisi ayrıştırma (trend, mevsimsellik, artık bileşen) ve lag feature oluşturma pipeline'ı geliştirilecektir.

**Teknolojik belirsizlik:**
Türkiye imalat sektörüne özgü mevsimsel ve ekonomik sinyal kaynaklarının (döviz kuru oynaklığı, bayram etkisi) talep tahmini doğruluğuna katkısı ve hangi özellik kombinasyonunun modeli anlamlı biçimde iyileştireceği başlangıçta bilinmemektedir. Dış sinyal entegrasyonunun aşırı uyum (overfitting) riski oluşturup oluşturmayacağı deneysel olarak belirlenecektir.

**Başarı kriteri:**
- Pilot fabrika verileriyle en az 24 aylık, 50+ SKU içeren temizlenmiş veri seti hazır
- Dış sinyal entegrasyonunun baseline modele katkısı: MAPE üzerinde en az %5 iyileştirme (ablation çalışmasıyla ölçülecek)
- Veri pipeline'ının saatlik otomatik güncellemeyi desteklemesi

**Risk:** Dış sinyal kaynaklarının erişimi kısıtlanırsa veya katkısı istatistiksel olarak anlamsız çıkarsa yalnızca dahili veri ile devam edilecek; özellik seti daraltılacaktır.

**İş paketi:** İP-1 | Süre: Ay 1–4 | Sorumlu: Ar-Ge Mühendisi (Kıdemli) + Veri Mühendisi

---

### Faaliyet 2: Talep Tahmini Model Geliştirme ve Seçimi

**Teknik içerik:**
Zaman serisi talep tahmini için dört model ailesi karşılaştırmalı olarak araştırılacak ve geliştirilecektir:

1. **Klasik istatistiksel:** ARIMA, SARIMA, ETS (baseline)
2. **Makine öğrenmesi:** LightGBM, XGBoost (gradient boosting, yorumlanabilirlik avantajlı)
3. **Derin öğrenme:** LSTM, N-BEATS, Temporal Fusion Transformer (TFT)
4. **Olasılıksal:** DeepAR, Prophet ile belirsizlik bandı tahmini

Her model, Faaliyet 1'de oluşturulan özellik seti ile eğitilecek; hiperparametre optimizasyonu Optuna ile gerçekleştirilecektir. Walk-forward validation (kayan pencere) ile tahmin güvenilirliği test edilecektir.

**Teknolojik belirsizlik:**
Türk imalat sektörünün veri karakteristiği (yüksek mevsimsellik, düşensiz temin süresi kesintileri, küçük lot büyüklükleri) göz önünde bulundurulduğunda, hangi model mimarisinin 4–12 haftalık tahmin ufkunda en düşük hata oranını ürettiği ve olasılıksal çıktının optimizasyon motoruna ne ölçüde doğru belirsizlik bilgisi aktarabileceği başlangıçta bilinmemektedir.

**Başarı kriteri:**
- 12 haftalık tahmin ufkunda MAPE ≤ %10 (mevcut kural tabanlı sisteme göre en az %30 iyileştirme)
- P90 güven aralığının gerçek değeri en az %80 kapsama oranı
- Model açıklanabilirliği: en önemli 10 özellik SHAP değerleriyle raporlanabilmeli
- Yeniden eğitim süresi ≤ 4 saat (haftalık otomatik güncelleme için)

**Risk:** Hiçbir derin öğrenme modeli hedefi karşılamazsa, gradient boosting + Prophet ensemble ile üretim ortamına geçilecektir. Olasılıksal çıktı hedefi karşılanmazsa optimizasyon motoruna yalnızca nokta tahmin aktarılacak, belirsizlik bütçesi heuristik yöntemle belirlenecektir.

**İş paketi:** İP-2 | Süre: Ay 3–9 | Sorumlu: Ar-Ge Mühendisi (Kıdemli) + ML Araştırmacısı

---

### Faaliyet 3: Kısıt Tabanlı Üretim Planlama Motoru Geliştirme

**Teknik içerik:**
Faaliyet 2 çıktısı olan talep tahmini belirsizlik bandı, üretim planlama problemine giriş olarak verilecektir. Optimizasyon problemi şu kısıtlar altında formüle edilecektir:

- Makine kapasitesi kısıtları (kullanılabilirlik takvimiyle entegre)
- Sequence-dependent setup time (ürün geçiş matrisi)
- Lot büyüklüğü kısıtları (minimum üretim miktarı, kampanya büyüklüğü)
- Tedarikçi teslim süresi belirsizliği (stokastik kısıt)
- Envanter tutma maliyeti ve stok tükenmesi maliyeti dengesi

Çözüm yöntemi olarak **CP-SAT** (Google OR-Tools) ve **Large Neighborhood Search** metasezgisel algoritması karşılaştırmalı olarak uygulanacaktır.

**Teknolojik belirsizlik:**
Stokastik talep belirsizliğinin kısıt programlama çözücüsüne nasıl entegre edileceği (senaryo ağacı vs. chance constraint vs. robust optimization) ve bu entegrasyonun çözüm süresini ticari olarak kabul edilebilir sınır içinde (≤ 5 dakika) tutup tutamayacağı başlangıçta bilinmemektedir. Gerçek boyuttaki üretim planlaması (100+ SKU, 52 haftalık ufuk) için CP-SAT'ın ölçeklenebilirliği deneysel olarak belirlenecektir.

**Başarı kriteri:**
- 100 SKU, 52 hafta ufkunda optimal/near-optimal plan üretme süresi ≤ 5 dakika
- Üretilen planın uygulanabilirliği: pilot fabrikada planlama uzmanı tarafından %85 oranında onaylanması
- Stok fazlalığında mevcut sisteme göre en az %20 azalma (simülasyon ortamında)
- Stok tükenmesi olaylarında en az %15 azalma (simülasyon)

**Risk:** CP-SAT hesaplama süresi aşılırsa çözüm ufku 26 haftaya daraltılacak; büyük ölçek için iteratif rolling horizon yaklaşımı kullanılacaktır.

**İş paketi:** İP-3 | Süre: Ay 7–13 | Sorumlu: Optimizasyon Mühendisi + Ar-Ge Mühendisi (Kıdemli)

---

### Faaliyet 4: Sistem Entegrasyonu, Pilot Uygulama ve Doğrulama

**Teknik içerik:**
Faaliyet 2 ve 3 çıktıları, web tabanlı kontrol paneli ve ERP bağlayıcısıyla entegre edilerek çalışan prototip oluşturulacaktır. Sistem mimarisi:

```
ERP Connector (SAP BAPI / Logo REST) 
    → Veri Pipeline (ETL, Faaliyet 1 altyapısı)
    → Tahmin Motoru (Faaliyet 2 modeli)
    → Optimizasyon Motoru (Faaliyet 3 CP çözücüsü)
    → REST API
    → Web Kontrol Paneli (React + .NET backend)
```

Pilot uygulama: Milagro'nun mevcut müşterileri arasında yer alan bir orta ölçekli plastik enjeksiyon fabrikasında (180 çalışan, 340 aktif SKU) 3 ay gerçek ortam testi yapılacaktır. A/B tasarımı: haftalık üretim planlarının %50'si sistem önerisi, %50'si mevcut planlama yöntemi ile üretilecek; performans karşılaştırılacaktır.

**Teknolojik belirsizlik:**
Gerçek ortam koşullarında (veri kalitesi sorunları, operasyonel kısıtların modelde eksik temsil edilmesi, fabrika personeli adaptasyonu) simülasyon ortamında elde edilen performansın ne ölçüde korunacağı başlangıçta bilinmemektedir.

**Başarı kriteri:**
- Pilot fabrikada 8 haftalık kesintisiz sistem işletimi
- Gerçek ortam tahmin MAPE ≤ %15 (simülasyona göre max %5 bozulma kabul edilebilir)
- Planlama uzmanı kullanıcı memnuniyeti: 5 üzerinden en az 3.5 (anket)
- Sistem erişilebilirliği ≥ %95 (3 aylık pilot boyunca)

**Risk:** Pilot fabrika ERP entegrasyonu teknik engelle karşılaşılırsa manuel CSV import ile pilot devam edecek; entegrasyon araştırması ayrı iş paketine alınacaktır.

**İş paketi:** İP-4 + İP-5 | Süre: Ay 13–18 | Sorumlu: Tüm ekip

---

## Bölüm 4 — İş Paketi Gantt Tablosu

```
İP               | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |10 |11 |12 |13 |14 |15 |16 |17 |18 |
─────────────────|───|───|───|───|───|───|───|───|───|───|───|───|───|───|───|───|───|───|
İP-1 Veri Altyapı|███|███|███|███|   |   |   |   |   |   |   |   |   |   |   |   |   |   |
İP-2 Tahmin Model|   |   |███|███|███|███|███|███|███|   |   |   |   |   |   |   |   |   |
İP-3 Planlama Mot|   |   |   |   |   |   |███|███|███|███|███|███|███|   |   |   |   |   |
İP-4 Entegrasyon |   |   |   |   |   |   |   |   |   |   |   |███|███|███|███|   |   |   |
İP-5 Pilot & Test|   |   |   |   |   |   |   |   |   |   |   |   |   |███|███|███|███|   |
İP-6 Raporlama   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |███|███|
```

| İP | Başlık | Süre | Başlıca Çıktı | Ar-Ge Niteliği |
|---|---|---|---|---|
| İP-1 | Veri Altyapısı ve Özellik Mühendisliği | Ay 1–4 | Temizlenmiş veri seti, özellik pipeline'ı | ✓ Araştırma |
| İP-2 | Talep Tahmini Model Geliştirme | Ay 3–9 | Eğitilmiş model, karşılaştırma raporu | ✓ Deneysel Gelişt. |
| İP-3 | Üretim Planlama Motoru | Ay 7–13 | CP çözücü + stokastik kısıt modülü | ✓ Deneysel Gelişt. |
| İP-4 | Sistem Entegrasyonu | Ay 12–15 | Entegre prototip, REST API | ✓ Prototip |
| İP-5 | Pilot Uygulama ve Doğrulama | Ay 14–17 | Pilot test raporu, performans değerlendirmesi | ✓ Doğrulama |
| İP-6 | Raporlama ve Yayın Hazırlığı | Ay 17–18 | Proje sonuç raporu, makale taslağı | ✓ Yayın |

---

## Bölüm 5 — Proje Ekibi ve Yetkinlikler

| Personel | Unvan | Uzmanlık | Ar-Ge Katkısı | Ay-Kişi |
|---|---|---|---|---|
| Ali Yılmaz | Kıdemli Ar-Ge Mühendisi | ML, zaman serisi, Python | Model geliştirme (İP-2 yürütücü), mimari kararlar | 16 |
| Zeynep Demir | Ar-Ge Mühendisi | Veri mühendisliği, ETL | Veri altyapısı (İP-1 yürütücü), entegrasyon desteği | 14 |
| Mert Kaya | Optimizasyon Mühendisi | OR, CP-SAT, Google OR-Tools | Planlama motoru (İP-3 yürütücü) | 12 |
| Dr. Seda Arslan | Danışman (Üniversite) | Makine öğrenmesi, yayın | Metodoloji gözden geçirme, makale desteği | 4 |
| Fatma Çelik | Proje Yöneticisi | Proje yönetimi, müşteri ilişkileri | Koordinasyon, raporlama, pilot yönetimi | 8 |

**Toplam Ar-Ge ay-kişi:** 54

**Personel nitelik gerekçesi:**
- Ali Yılmaz: Lisans üstü ML eğitimi, 3 yayın (Scopus), Kaggle Master profili. İP-2 için teknik yetkinlik yeterli.
- Mert Kaya: OR-Tools proje deneyimi (2 endüstriyel proje), CP-SAT belgelendirmesi. İP-3 için teknik yetkinlik yeterli.
- Dr. Seda Arslan: Üniversite öğretim üyesi (Endüstri Mühendisliği), TÜBİTAK projesi yürütme deneyimi — metodoloji bağımsızlığı ve akademik yayın için.

---

## Bölüm 6 — Bütçe Özeti (Kalem Gerekçeleri)

| Kalem | Alt Kalem | Gerekçe | Tutar (TL) |
|---|---|---|---|
| Personel | AR-GE mühendisleri (oransal brüt) | İP-1,2,3,4,5 doğrudan Ar-Ge çalışması | 3.200.000 |
| Personel | Proje yöneticisi (oransal) | Koordinasyon, raporlama | 480.000 |
| Alet-Teçhizat | GPU iş istasyonu (2 adet) | İP-2 model eğitimi — standart CPU 40x yavaş, proje süresini tehdit eder | 320.000 |
| Alet-Teçhizat | Bulut GPU (AWS/Azure, dev+test) | Büyük model eğitimi için esnek kapasite | 180.000 |
| Hizmet Alımı | Pilot fabrika ERP erişim danışmanlığı | SAP BAPI konfigürasyonu — mevcut ekipte SAP Basis yoktur | 95.000 |
| Hizmet Alımı | Akademik danışmanlık (Dr. Arslan) | Metodoloji gözden geçirme + yayın desteği | 120.000 |
| Seyahat | Konferans (2 kişi × 2 etkinlik) | Bulgu paylaşımı — INFORMS, OR Derneği | 45.000 |
| Genel Gider | %20 personel giderleri (sabit) | TÜBİTAK kuralı | 736.000 |
| **Toplam** | | | **5.176.000** |

**Bütçe-faaliyet bağlantısı:**
- GPU iş istasyonu → doğrudan İP-2 (model eğitimi). Faaliyet olmadan satın alma reddedilmeli.
- SAP danışmanlığı → doğrudan İP-4 (ERP entegrasyonu). Prototip bu kısıt olmadan tamamlanamaz.
- Akademik danışmanlık → İP-2 metodoloji doğrulama + İP-6 yayın. Bağımsız gözden geçirme Ar-Ge gereksinimi.

---

## Sık Yapılan Hataların Bu Örnekte Nasıl Kaçınıldığı

| Hata | Bu örnekte yapılan |
|---|---|
| "Bu alanda çalışma yok" | §2.1'de 5 makale ile literatür boşluğu kanıtlandı |
| "Yazılım geliştireceğiz" | Her faaliyet "araştırma + deneysel geliştirme" olarak ifade edildi |
| Belirsiz başarı kriteri | Her faaliyette sayısal hedef (MAPE ≤ %10, süre ≤ 5dk vb.) |
| Teknolojik belirsizlik yok | Her faaliyette "hangi yaklaşımın üstün olacağı bilinmiyor" açıkça yazıldı |
| Bütçe-faaliyet bağlantısı kopuk | §6'da her kalem hangi iş paketine hizmet ettiği belirtildi |

---

## Adapte Etme Notları

Bu örneği kendi başvurunuza uyarlarken değiştirmeniz gereken minimum set:

1. **Şirket adı ve sektör** — Milagro → kendi şirketiniz; plastik enjeksiyon → kendi sektörünüz
2. **Problem büyüklüğü rakamları** — %23 stok fazlalığı, 47 Milyar TL → kendi sektörünüzün verileri (TÜİK, sektör raporları)
3. **Pilot fabrika** — Milagro müşterisi → sizin pilot lokasyonunuz (onay mektubu gerekli)
4. **Personel isimleri ve CV'leri** — §5 tamamen değişmeli; her personel için özgeçmiş eklenmeli
5. **Bütçe rakamları** — Güncel maaş ve donanım fiyatlarıyla hesaplanmalı
6. **Ar-Ge belirsizlikleri** — Kendi teknik probleminizin gerçek belirsizlikleri yazılmalı; kopyalamayın

**Değiştirmeyin (iskelet olarak koru):**
- Bölüm yapısı (1–6)
- Her faaliyetteki Teknik içerik / Belirsizlik / Başarı kriteri / Risk formatı
- Gantt tablosu formatı
- Bütçe gerekçe yapısı
