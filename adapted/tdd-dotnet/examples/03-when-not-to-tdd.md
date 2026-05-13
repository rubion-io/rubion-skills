# Örnek 3: TDD'nin Ters Tepebileceği Durumlar

TDD her zaman doğru araç değildir. Aşağıdaki durumlarda TDD yerine önce exploratory coding, ardından test yaz.

---

## 1. Bilinmeyeni Keşfetmek (Spike)

**Senaryo:** Bir Keycloak entegrasyonu yazıyorsun. Client flow'u, token yapısını, hata kodlarını henüz bilmiyorsun.

**TDD'nin sorunu:** Neyi test edeceğini bilmeden test yazarsan, ya çok geniş ya da yanlış şeyi test edersin. Tüm testleri sonra sileceksin.

**Doğru yaklaşım:**
1. Spike branch'i aç (`spike/keycloak-auth`).
2. Çalışır bir POC yaz, flow'u anla.
3. Flow anlaşıldıktan sonra spike'ı sil, production kodunu TDD ile yeniden yaz.

---

## 2. UI / Görsel Bileşenler

**Senaryo:** Figma'dan gelen bir `DataGrid` bileşenini yazıyorsun; hover state'leri, responsive breakpoint'ler var.

**TDD'nin sorunu:** "Sütun başlığı hover'da underline olmalı" gibi görsel davranışları test etmek çok kırılgan ve bakımı zor testler üretir.

**Doğru yaklaşım:**
- Snapshot test veya Storybook ile visual regression test.
- Erişilebilirlik testleri (`@testing-library/user-event`) değer katar.
- Saf görsel state'ler için TDD zorlamayın.

---

## 3. EF Core Migration

**Senaryo:** Yeni bir kolon ekliyor, var olan tabloya index atıyorsun.

**TDD'nin sorunu:** Migration, EF Core'un ürettiği bir artefakt — içeriğini test etmek framework'ü test etmek demek.

**Doğru yaklaşım:** Migration'ı üret ve `/ef-core-migration-review` skill'ini çalıştır. Bu skill destructive operation var mı, production-safe mi diye kontrol eder.

---

## 4. Kesinlikle Değişecek Prototipler

**Senaryo:** Müşteriye göstermek için bir hafta içinde bir prototip üretmen gerekiyor.

**TDD'nin sorunu:** Prototip genellikle atılır. Test yazmak zaman kaybı.

**Doğru yaklaşım:** `prototype` skill'ini kullan. Prototip onaylanırsa production versiyonunu TDD ile sıfırdan yaz.

---

## 5. Üçüncü Taraf API Adaptörleri (thin wrapper)

**Senaryo:** Serilog için bir `ILogger` wrapper'ı yazıyorsun.

**TDD'nin sorunu:** Bu kod gerçek Serilog'u wrap ediyor — testlerde zaten mock'layacaksın, gerçek davranışı test etmeyeceksin.

**Doğru yaklaşım:**
- Sadece adaptör logic'i varsa (transform, mapping) test yaz.
- Saf delegation wrapper'larını test etme; framework'ün kendi testleri var.

---

## Özet

| Durum | TDD mi? | Alternatif |
|---|---|---|
| Bilinmeyen domain/API | Hayır | Spike → sil → TDD |
| Görsel UI bileşeni | Hayır | Snapshot / Storybook |
| EF Core migration | Hayır | Migration review skill |
| Kısa ömürlü prototip | Hayır | Prototype skill |
| Thin adapter/wrapper | Kısmen | Sadece transform logic |
| Domain logic / handler | **Evet** | — |
| Repository | **Evet** | Testcontainers ile |
| Endpoint validasyon | **Evet** | WebApplicationFactory |
