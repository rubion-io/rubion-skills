# ADR-001: Vertical Slice Architecture Varsayılan Mimari Tercih

**Tarih:** 2026-05-13
**Durum:** Kabul Edildi

## Bağlam

Rubion projelerinde mimari tutarlılık sağlamak için bir varsayılan seçim yapılmalıydı. Değerlendirilen başlıca yaklaşımlar:

1. **Clean Architecture (CA):** Katmanlı (Domain / Application / Infrastructure / Presentation), interface bağımlılıkları yoğun
2. **Vertical Slice Architecture (VSA):** Feature başına tam dikey dilim, minimum katman sınırı
3. **Minimal / script-style:** Servis + repository, katman yok

## Karar

**Vertical Slice Architecture varsayılan seçim olarak belirlendi.** Clean Architecture yalnızca aşağıdaki koşulda kullanılır: domain logic karmaşıklığı çok yüksek, birden fazla UI kanalı (web + mobil + API + CLI) aynı domain katmanını paylaşıyor ve takım büyüklüğü bunu haklı çıkarıyor.

## Gerekçe

### VSA'nın Avantajları (bu bağlamda)

**Özellik ekleme sürtünmesi düşük:** Yeni bir feature, `<Module>/<Feature>/` klasörüne `Command + Handler + Validator + Endpoint` dosyaları eklenmesiyle tamamlanır. Clean Architecture'da aynı feature 4–5 katmana yayılır.

**Bağımlılık yönetimi basit:** Her slice kendi bağımlılıklarını tanımlar; diğer slice'larla "interface üzerinden iletişim" zorunluluğu yoktur. Kod okunabilirliği artar.

**Testability doğal:** Handler'lar constructor injection ile test edilebilir; interface'leri manuel mock'lamak yerine NSubstitute veya Testcontainers yeterlidir.

**Refactor izole:** Bir feature değiştiğinde, yalnızca o feature'ın klasörü etkilenir. Katmanlı mimaride refactor dalgalanma yaratır.

**MediatR uyumu:** Rubion'un MediatR kararıyla (bkz. stack-conventions) doğal uyum — her `IRequest<T>` bir slice'a karşılık gelir.

### Clean Architecture Ne Zaman Tercih Edilir?

- Domain logic'in birden fazla uygulama (web, mobil, CLI) tarafından paylaşılması zorunlu
- Domain model'in saf C# nesneleri olarak farklı ORM'lere taşınması öngörülüyor
- Takım 10+ kişi ve katmanlı sorumluluk ayrımı yönetimi kolaylaştırıyor

Bu koşullar mevcut Rubion projelerinin büyük çoğunluğunda geçerli değildir.

### Minimal / Script-style Neden Reddedildi?

"Servis + Repository" yaklaşımı küçük projeler için çalışır; ancak özellik sayısı arttıkça servis sınıfları büyür, bağımlılıklar karmaşıklaşır, test edilmesi güçleşir. Rubion projelerinin büyüme beklentisi göz önünde bulundurulduğunda başlangıçtan VSA tercih edildi.

## Sonuçlar

**Olumlu:**
- Yeni başlayan ekip üyesi, mevcut bir slice'a bakarak pattern'i anında kavrar
- `scaffold-vsa-feature` skill'i ile feature iskeletleri tutarlı ve hızlı üretilir
- CI/CD'de test isolation kolaydır

**Olumsuz / Trade-off:**
- Slice'lar arasında kod tekrarı (her handler kendi DB context injection'ını yazar) — intentional, DRY'ı slice sınırı içinde uygula
- "Shared logic nereye gider?" sorusu yanıtlanmalı — cevap: `<Module>/Shared/` veya domain nesnesine method olarak

## Referanslar

- Jimmy Bogard, "Vertical Slice Architecture": https://www.jimmybogard.com/vertical-slice-architecture/
- Milan Jovanović, "Vertical Slice Architecture in ASP.NET Core": pratik .NET uygulamaları
