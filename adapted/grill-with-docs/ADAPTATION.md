# Adaptation Notes — grill-with-docs

**Upstream:** mattpocock/skills/skills/engineering/grill-with-docs
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** light

## Ne Değişmedi

- Temel grilling felsefesi: amansız sorgulama, bir soru → yanıt → devam döngüsü
- Domain farkındalığı: glossary çelişkilerini yakala, muğlak dili netleştir, kodla karşılaştır
- ADR önerme kriterleri: üçlü filtre korundu (geri dönmesi zor + şaşırtıcı + gerçek trade-off)
- CONTEXT.md'yi yerinde güncelleme prensibi

## Ne Değişti

1. **Dil:** Türkçe
2. **CONTEXT.md template:** Upstream'deki generic template, Rubion stack'ine özgü olarak yeniden yazıldı:
   - `Bounded Context'ler / Modüller` bölümü Rubion servis isimleriyle örneklendi
   - `Teknik Kararlar` bölümü Rubion tercihlerine göre dolduruldu (EF Core, RabbitMQ vb.)
   - Domain örnekleri Rubion iş alanına göre somutlaştırıldı (sevkiyat, fason üretim)
3. **ADR formatı:** Türkçe başlıklar, "Durum" field'ına "Değiştirildi" seçeneği eklendi
4. **Dosya yapısı:** Rubion'un `src/Sales/`, `src/Inventory/` tarzı module yapısı örnek olarak eklendi

## Neden Light?

Orijinal skill'in mantığı evrensel — domain-agnostik. Sadece somut örnekler ve template dili Rubion'a çevrildi. Felsefi hiçbir değişiklik yapılmadı.
